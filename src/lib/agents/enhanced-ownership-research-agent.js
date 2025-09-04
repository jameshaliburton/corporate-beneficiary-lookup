/**
 * Enhanced Ownership Research Agent
 * Integrates multi-factor confidence estimation and detailed trace logging
 */

import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import { WebResearchAgent, isWebResearchAvailable } from './web-research-agent.js'
import { WebSearchOwnershipAgent, isWebSearchOwnershipAvailable } from './web-search-ownership-agent.js'
import { EnhancedWebSearchOwnershipAgent, isEnhancedWebSearchOwnershipAvailable } from './enhanced-web-search-ownership-agent.js'
import { LLMResearchAgent, isLLMResearchAvailable } from './llm-research-agent.js'
import { extractFollowUpContext } from '../services/context-parser.js'
import { QueryBuilderAgent, isQueryBuilderAvailable } from './query-builder-agent.js'
import { supabase } from '../supabase.ts'
import { lookupOwnershipMapping, mappingToResult } from '../database/ownership-mappings.js'
import { getProductByBarcode, getProductByBrandAndName, upsertProduct, ownershipResultToProductData } from '../database/products.js'
import { emitProgress } from '../utils.ts'
import { evaluationFramework } from '../services/evaluation-framework.js'
import { getPromptBuilder, getCurrentPromptVersion } from './prompt-registry.js'
import { calculateEnhancedConfidence, getConfidenceLabel, getConfidenceColor } from './confidence-estimation.js'
import { 
  createEnhancedTraceLogger, 
  EnhancedStageTracker, 
  DecisionTracker, 
  EvidenceTracker, 
  PerformanceTracker,
  TraceAnalyzer,
  REASONING_TYPES 
} from './enhanced-trace-logging.js'
import { ragKnowledgeBase } from './rag-knowledge-base.js'
import { repairJSON, extractJSONFromMarkdown } from '../utils/json-repair.js'
import { generateCurrentResultId } from '../utils/generateResultId.ts'
import { shouldSkipUrl, markDomainAsPaywalled, isPaywallStatusCode, detectPaywallInHTML } from '../utils/paywallDetection.ts'

// Only load .env.local in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' })
}

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY is not set. Please set it in your environment variables.')
}

let anthropic
try {
  anthropic = new Anthropic({
    apiKey
  })
} catch (err) {
  console.error('Error creating Anthropic client:', err)
  throw err
}

/**
 * Enhanced AgentOwnershipResearch with multi-factor confidence and detailed tracing
 */
export async function EnhancedAgentOwnershipResearch({
  barcode,
  product_name,
  brand,
  hints = {},
  enableEvaluation = false,
  imageProcessingTrace = null,
  followUpContext = null
}) {
  const startTime = Date.now()
  const queryId = generateQueryId()
  
  console.log('[AgentLog] Starting: EnhancedAgentOwnershipResearch');
  console.time('[AgentTimer] EnhancedAgentOwnershipResearch');
  
  // Initialize enhanced trace logger
  const traceLogger = createEnhancedTraceLogger(queryId, brand, product_name, barcode)
  const decisionTracker = new DecisionTracker(traceLogger)
  const evidenceTracker = new EvidenceTracker(traceLogger)
  const performanceTracker = new PerformanceTracker(traceLogger)
  
  console.log(`[EnhancedAgentOwnershipResearch] Starting research for:`, { product_name, brand, hints })
  
  try {
    // Step 0: Cache Check
    const cacheStage = new EnhancedStageTracker(traceLogger, 'cache_check', 'Checking for existing cached result')
    await emitProgress(queryId, 'cache_check', 'started', { barcode, brand, product_name })
    
    cacheStage.reason('Checking database for existing product record', REASONING_TYPES.INFO)
    
    // Try to find existing product by barcode first, then by brand and product name
    let existingProduct = null
    if (barcode) {
      existingProduct = await getProductByBarcode(barcode)
      if (existingProduct) {
        cacheStage.reason(`Found product by barcode: ${barcode}`, REASONING_TYPES.INFO)
      }
    }
    
    // If no product found by barcode, try brand and product name
    if (!existingProduct && brand && product_name) {
      existingProduct = await getProductByBrandAndName(brand, product_name)
      if (existingProduct) {
        cacheStage.reason(`Found product by brand and name: ${brand} - ${product_name}`, REASONING_TYPES.INFO)
      }
    }
    
    if (existingProduct && existingProduct.financial_beneficiary && existingProduct.financial_beneficiary !== 'Unknown') {
      // Check if followUpContext is provided - if so, re-run research ignoring cache
      if (followUpContext) {
        cacheStage.reason(`Found cached result but followUpContext provided: "${followUpContext}" - re-running research with enhanced context`, REASONING_TYPES.INFO)
        cacheStage.decide('Re-run research with context', ['Use cached result'], 'Follow-up context requires fresh research with enhanced queries')
        
        console.log('[EnhancedAgentOwnershipResearch] 🔄 Re-running research due to followUpContext:', followUpContext)
        await emitProgress(queryId, 'cache_check', 'context_override', { 
          cached_result: existingProduct.financial_beneficiary,
          followUpContext 
        })
        
      } else {
        cacheStage.reason(`Found cached result for ${brand}: ${existingProduct.financial_beneficiary}`, REASONING_TYPES.INFO)
        cacheStage.decide('Use cached result', ['Perform fresh research'], 'Cached result available with valid ownership data')
        
        const cachedResult = {
          financial_beneficiary: existingProduct.financial_beneficiary,
          beneficiary_country: existingProduct.beneficiary_country,
          beneficiary_flag: existingProduct.beneficiary_flag,
          ownership_structure_type: existingProduct.ownership_structure_type,
          confidence_score: existingProduct.confidence_score,
          ownership_flow: existingProduct.ownership_flow || [],
          sources: existingProduct.sources || ['Cached result'],
          reasoning: existingProduct.reasoning || 'Previously researched and cached',
          web_research_used: existingProduct.web_research_used,
          web_sources_count: existingProduct.web_sources_count || 0,
          query_analysis_used: existingProduct.query_analysis_used,
          static_mapping_used: existingProduct.static_mapping_used,
          result_type: existingProduct.result_type,
          user_contributed: existingProduct.user_contributed,
          inferred: existingProduct.inferred,
          cached: true,
          product_id: existingProduct.id,
          agent_execution_trace: combineTraces(imageProcessingTrace, traceLogger.toDatabaseFormat()),
          initial_llm_confidence: existingProduct.initial_llm_confidence,
          agent_results: existingProduct.agent_results,
          fallback_reason: existingProduct.fallback_reason
        }
        
        cacheStage.success({
          financial_beneficiary: existingProduct.financial_beneficiary,
          confidence_score: existingProduct.confidence_score,
          result_type: existingProduct.result_type
        }, ['Cached result found and returned'])
        
        await emitProgress(queryId, 'cache_check', 'success', cacheStage.stage.data)
        traceLogger.setFinalResult('cached')
        
        return cachedResult
      }
    }
    
    cacheStage.reason('No cached result found, proceeding with research', REASONING_TYPES.INFO)
    cacheStage.success({ result: 'miss' }, ['No cached result available'])
    await emitProgress(queryId, 'cache_check', 'completed', { result: 'miss' })
    
    // Step 1: Google Sheets Ownership Mapping Check
    const sheetsMappingStage = new EnhancedStageTracker(traceLogger, 'sheets_mapping', 'Checking Google Sheets ownership mappings')
    await emitProgress(queryId, 'sheets_mapping', 'started', { brand })
    
    sheetsMappingStage.reason(`Checking Google Sheets ownership mappings for brand: ${brand}`, REASONING_TYPES.INFO)
    
    try {
      const sheetsMapping = await evaluationFramework.checkOwnershipMapping(brand)
      
      if (sheetsMapping) {
        sheetsMappingStage.reason(`Found Google Sheets mapping: ${sheetsMapping.ultimate_owner_name}`, REASONING_TYPES.EVIDENCE)
        sheetsMappingStage.decide('Use Google Sheets mapping', ['Perform web research'], 'Google Sheets mapping provides reliable ownership data')
        
        const result = {
          financial_beneficiary: sheetsMapping.ultimate_owner_name,
          beneficiary_country: sheetsMapping.ultimate_owner_country,
          beneficiary_flag: sheetsMapping.ultimate_owner_flag || getCountryFlag(sheetsMapping.ultimate_owner_country),
          ownership_structure_type: sheetsMapping.intermediate_entity ? 'Subsidiary' : 'Direct',
          confidence_score: 95,
          ownership_flow: [
            { name: brand, type: 'Brand', country: sheetsMapping.ultimate_owner_country, flag: sheetsMapping.ultimate_owner_flag || '🏳️', ultimate: false },
            ...(sheetsMapping.intermediate_entity ? [{ name: sheetsMapping.intermediate_entity, type: 'Subsidiary', country: sheetsMapping.ultimate_owner_country, flag: sheetsMapping.ultimate_owner_flag || '🏳️', ultimate: false }] : []),
            { name: sheetsMapping.ultimate_owner_name, type: 'Ultimate Owner', country: sheetsMapping.ultimate_owner_country, flag: sheetsMapping.ultimate_owner_flag || '🏳️', ultimate: true }
          ],
          sources: ['Google Sheets ownership mapping'],
          reasoning: `Found in Google Sheets ownership mappings: ${sheetsMapping.notes || 'Direct ownership'}`,
          web_research_used: false,
          web_sources_count: 0,
          query_analysis_used: false,
          static_mapping_used: false,
          result_type: 'sheets_mapping',
          cached: false,
          agent_execution_trace: combineTraces(imageProcessingTrace, traceLogger.toDatabaseFormat()),
          initial_llm_confidence: 95,
          agent_results: {
            sheets_mapping: {
              success: true,
              data: sheetsMapping,
              reasoning: 'Found in Google Sheets ownership mappings'
            }
          }
        }
        
        sheetsMappingStage.success({
          financial_beneficiary: result.financial_beneficiary,
          confidence_score: result.confidence_score
        }, ['Google Sheets mapping found and applied'])
        
        await emitProgress(queryId, 'sheets_mapping', 'success', sheetsMappingStage.stage.data)
        
        // Save to database
        const productData = ownershipResultToProductData(barcode, product_name, brand, result)
        await upsertProduct(productData)
        
        traceLogger.setFinalResult('sheets_mapping')
        return result
      }
    } catch (sheetsError) {
      sheetsMappingStage.reason(`Google Sheets mapping check failed: ${sheetsError.message}`, REASONING_TYPES.WARNING)
      console.warn('[EnhancedAgentOwnershipResearch] Google Sheets mapping check failed:', sheetsError.message)
    }
    
    sheetsMappingStage.reason('No Google Sheets mapping found, proceeding with static mapping check', REASONING_TYPES.INFO)
    sheetsMappingStage.success({ result: 'miss' }, ['No Google Sheets mapping available'])
    await emitProgress(queryId, 'sheets_mapping', 'completed', { result: 'miss' })
    
    // Step 2: Static Mapping Check
    const staticStage = new EnhancedStageTracker(traceLogger, 'static_mapping', 'Checking static ownership mappings')
    await emitProgress(queryId, 'static_mapping', 'started', { brand })
    
    staticStage.reason(`Checking static mappings for brand: ${brand}`, REASONING_TYPES.INFO)
    const staticMapping = await lookupOwnershipMapping(brand)
    
    if (staticMapping) {
      staticStage.reason(`Found static mapping: ${staticMapping.financial_beneficiary}`, REASONING_TYPES.EVIDENCE)
      staticStage.decide('Use static mapping', ['Perform web research'], 'Static mapping provides reliable ownership data')
      
      const result = mappingToResult(staticMapping)
      result.beneficiary_flag = getCountryFlag(result.beneficiary_country)
      result.web_research_used = false
      result.web_sources_count = 0
      result.query_analysis_used = false
      result.static_mapping_used = true
      result.cached = false
      result.agent_execution_trace = combineTraces(imageProcessingTrace, traceLogger.toDatabaseFormat())
      result.initial_llm_confidence = result.confidence_score
      result.agent_results = {
        static_mapping: {
          success: true,
          data: staticMapping,
          reasoning: 'Found in static ownership mappings database'
        }
      }
      
      staticStage.success({
        financial_beneficiary: result.financial_beneficiary,
        confidence_score: result.confidence_score
      }, ['Static mapping found and applied'])
      
      await emitProgress(queryId, 'static_mapping', 'success', staticStage.stage.data)
      
      // Save to database
      const productData = ownershipResultToProductData(barcode, product_name, brand, result)
      await upsertProduct(productData)
      
      traceLogger.setFinalResult('static_mapping')
      return result
    }
    
    staticStage.reason('No static mapping found, proceeding with AI research', REASONING_TYPES.INFO)
    staticStage.success({ result: 'miss' }, ['No static mapping available'])
    await emitProgress(queryId, 'static_mapping', 'completed', { result: 'miss' })
    
    // Step 3: RAG Knowledge Base Retrieval
    const ragStage = new EnhancedStageTracker(traceLogger, 'rag_retrieval', 'Searching knowledge base for similar ownership patterns')
    await emitProgress(queryId, 'rag_retrieval', 'started', { brand, product_name })
    
    ragStage.reason(`Searching knowledge base for brand: ${brand}`, REASONING_TYPES.INFO)
    
    try {
      const similarEntries = await ragKnowledgeBase.searchSimilar(brand, product_name, 3)
      
      if (similarEntries && similarEntries.length > 0) {
        const bestMatch = similarEntries[0]
        ragStage.reason(`Found ${similarEntries.length} similar entries in knowledge base`, REASONING_TYPES.SUCCESS)
        ragStage.reason(`Best match: ${bestMatch.brand} → ${bestMatch.financial_beneficiary} (confidence: ${bestMatch.confidence_score}%)`, REASONING_TYPES.INFO)
        
        // If we have a high-confidence match, use it directly
        if (bestMatch.similarity_score > 0.8 && bestMatch.confidence_score > 80) {
          ragStage.reason(`High-confidence RAG match found, using knowledge base result`, REASONING_TYPES.SUCCESS)
          
          const ragResult = {
            financial_beneficiary: bestMatch.financial_beneficiary,
            beneficiary_country: bestMatch.beneficiary_country,
            ownership_structure_type: bestMatch.ownership_structure_type,
            ownership_flow: bestMatch.ownership_flow,
            confidence_score: bestMatch.confidence_score,
            confidence_level: bestMatch.confidence_score >= 90 ? 'Very High' : 
                             bestMatch.confidence_score >= 80 ? 'High' : 
                             bestMatch.confidence_score >= 60 ? 'Medium' : 'Low',
            reasoning: `Based on knowledge base match: ${bestMatch.reasoning}`,
            sources: bestMatch.sources,
            result_type: 'rag_knowledge_base',
            rag_match: {
              similarity_score: bestMatch.similarity_score,
              matched_brand: bestMatch.brand,
              knowledge_base_id: bestMatch.id
            }
          }
          
          ragStage.success(ragResult, [`Used knowledge base match with ${bestMatch.similarity_score.toFixed(2)} similarity`])
          await emitProgress(queryId, 'rag_retrieval', 'completed', ragResult)
          
          // Store this result in knowledge base for future use
          try {
            await ragKnowledgeBase.storeEntry({
              brand,
              product_name,
              barcode,
              ...ragResult,
              tags: ['rag_match', 'high_confidence']
            })
          } catch (storeError) {
            console.warn('Failed to store RAG result in knowledge base:', storeError)
          }
          
          return ragResult
        } else {
          ragStage.reason(`RAG matches found but confidence too low, proceeding with LLM analysis`, REASONING_TYPES.INFO)
          ragStage.success({ 
            similar_entries: similarEntries.length,
            best_similarity: bestMatch.similarity_score,
            best_confidence: bestMatch.confidence_score
          }, [`Found ${similarEntries.length} similar patterns for reference`])
          await emitProgress(queryId, 'rag_retrieval', 'completed', { 
            similar_entries: similarEntries.length,
            best_similarity: bestMatch.similarity_score 
          })
        }
      } else {
        ragStage.reason('No similar entries found in knowledge base', REASONING_TYPES.INFO)
        ragStage.success({ result: 'no_matches' }, ['Knowledge base search completed'])
        await emitProgress(queryId, 'rag_retrieval', 'completed', { result: 'no_matches' })
      }
    } catch (ragError) {
      ragStage.reason(`RAG retrieval failed: ${ragError.message}`, REASONING_TYPES.ERROR)
      ragStage.error(ragError, {}, ['Knowledge base search failed, continuing with LLM analysis'])
      await emitProgress(queryId, 'rag_retrieval', 'failed', { error: ragError.message })
    }
    
    // Step 4: LLM-First Analysis (now with RAG context)
    const llmFirstStage = new EnhancedStageTracker(traceLogger, 'llm_first_analysis', 'Attempting initial LLM analysis of brand ownership')
    await emitProgress(queryId, 'llm_first_analysis', 'started', { brand, product_name })
    
    llmFirstStage.reason(`Attempting LLM-first analysis for brand: ${brand}`, REASONING_TYPES.INFO)
    
    try {
      // Get RAG context for LLM
      const ragContext = await ragKnowledgeBase.searchSimilar(brand, product_name, 2)
      const ragContextText = ragContext.length > 0 
        ? `\n\nRelevant ownership patterns from knowledge base:\n${ragContext.map(entry => 
            `- ${entry.brand} → ${entry.financial_beneficiary} (${entry.ownership_structure_type}, confidence: ${entry.confidence_score}%)`
          ).join('\n')}`
        : ''

      const llmFirstPrompt = `You are an expert corporate ownership researcher. Analyze the following brand and product to determine the ultimate financial beneficiary (parent company or owner), and provide a detailed ownership chain if possible.

Brand: ${brand}
Product: ${product_name || 'Unknown product'}
Barcode: ${barcode}
Additional hints: ${JSON.stringify(hints)}${ragContextText}

Based on your knowledge of corporate structures and brand ownership, provide a detailed analysis:

1. **Financial Beneficiary**: The ultimate parent company or owner
2. **Ownership Structure Type**: The type of ownership structure (e.g., "Public Company", "Private Company", "Subsidiary", "Joint Venture", "Franchise", "Licensed Brand", etc.)
3. **Ownership Flow**: A detailed chain showing the ownership structure from brand to ultimate owner, including intermediate companies if known
4. **Confidence Score**: Your confidence in this analysis (0-100)
5. **Reasoning**: Detailed explanation of your analysis and reasoning
6. **Country**: The country of the ultimate financial beneficiary

For the ownership flow, provide an array of objects with:
- name: Company name
- type: Role in ownership chain (e.g., "Brand", "Subsidiary", "Parent Company", "Ultimate Owner")
- country: Country of incorporation/operation
- source: How you know this information

Respond in valid JSON format:
{
  "financial_beneficiary": "Company Name",
  "beneficiary_country": "Country",
  "ownership_structure_type": "Structure Type",
  "ownership_flow": [
    {"name": "Brand Name", "type": "Brand", "country": "Country", "source": "knowledge"},
    {"name": "Parent Company", "type": "Parent Company", "country": "Country", "source": "knowledge"}
  ],
  "confidence_score": 85,
  "reasoning": "Detailed explanation of analysis..."
}`

      // Set enhanced trace data for LLM stage
      llmFirstStage.setConfig({
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.1,
        maxTokens: 1000,
        stopSequences: null
      })
      
      llmFirstStage.setVariables({
        inputVariables: {
          brand,
          product_name: product_name || 'Unknown product',
          barcode,
          hints: JSON.stringify(hints),
          rag_context: ragContextText
        },
        outputVariables: {},
        intermediateVariables: {
          rag_context_count: ragContext.length
        }
      })
      
      llmFirstStage.setPrompts(llmFirstPrompt, `You are an expert corporate ownership researcher. Analyze the following brand and product to determine the ultimate financial beneficiary (parent company or owner), and provide a detailed ownership chain if possible.

Brand: {{brand}}
Product: {{product_name}}
Barcode: {{barcode}}
Additional hints: {{hints}}
{{rag_context}}

Based on your knowledge of corporate structures and brand ownership, provide a detailed analysis:

1. **Financial Beneficiary**: The ultimate parent company or owner
2. **Ownership Structure Type**: The type of ownership structure (e.g., "Public Company", "Private Company", "Subsidiary", "Joint Venture", "Franchise", "Licensed Brand", etc.)
3. **Ownership Flow**: A detailed chain showing the ownership structure from brand to ultimate owner, including intermediate companies if known
4. **Confidence Score**: Your confidence in this analysis (0-100)
5. **Reasoning**: Detailed explanation of your analysis and reasoning
6. **Country**: The country of the ultimate financial beneficiary

For the ownership flow, provide an array of objects with:
- name: Company name
- type: Role in ownership chain (e.g., "Brand", "Subsidiary", "Parent Company", "Ultimate Owner")
- country: Country of incorporation/operation
- source: How you know this information

Respond in valid JSON format:
{
  "financial_beneficiary": "Company Name",
  "beneficiary_country": "Country",
  "ownership_structure_type": "Structure Type",
  "ownership_flow": [
    {"name": "Brand Name", "type": "Brand", "country": "Country", "source": "knowledge"},
    {"name": "Parent Company", "type": "Parent Company", "country": "Country", "source": "knowledge"}
  ],
  "confidence_score": 85,
  "reasoning": "Detailed explanation of analysis..."
}`)

      const llmFirstResponse = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: llmFirstPrompt
          }
        ]
      })

      const llmFirstContent = llmFirstResponse.content[0].text
      const llmFirstMatch = llmFirstContent.match(/\{[\s\S]*\}/)
      
      if (llmFirstMatch) {
        const llmFirstResult = JSON.parse(llmFirstMatch[0])
        
        // Update output variables with LLM response
        llmFirstStage.setVariables({
          inputVariables: {
            brand,
            product_name: product_name || 'Unknown product',
            barcode,
            hints: JSON.stringify(hints),
            rag_context: ragContextText
          },
          outputVariables: {
            financial_beneficiary: llmFirstResult.financial_beneficiary,
            beneficiary_country: llmFirstResult.beneficiary_country,
            ownership_structure_type: llmFirstResult.ownership_structure_type,
            confidence_score: llmFirstResult.confidence_score,
            reasoning: llmFirstResult.reasoning,
            ownership_flow: llmFirstResult.ownership_flow
          },
          intermediateVariables: {
            rag_context_count: ragContext.length,
            llm_response_length: llmFirstContent.length,
            json_parse_success: true
          }
        })
        
        llmFirstStage.reason(`LLM analysis complete: ${llmFirstResult.financial_beneficiary} (confidence: ${llmFirstResult.confidence_score}%)`, REASONING_TYPES.ANALYSIS)
        
        // If LLM has high confidence (>70), use it directly
        if (llmFirstResult.confidence_score > 70 && llmFirstResult.financial_beneficiary !== 'Unknown') {
          llmFirstStage.decide('Use LLM-first result', ['Proceed with web research'], 'LLM analysis provides high-confidence result')
          
          // Map ownership_flow to expected UI format, fallback if not present
          const ownershipFlow = Array.isArray(llmFirstResult.ownership_flow) && llmFirstResult.ownership_flow.length > 0
            ? llmFirstResult.ownership_flow.map((step, idx, arr) => ({
                name: step.name || (idx === 0 ? brand : 'Unknown'),
                type: step.type || (idx === 0 ? 'Brand' : (idx === arr.length - 1 ? 'Ultimate Owner' : 'Parent Company')),
                country: step.country || 'Unknown',
                flag: getCountryFlag(step.country),
                ultimate: idx === arr.length - 1
              }))
            : [
                { name: brand, type: 'Brand', country: 'Unknown', flag: getCountryFlag('Unknown'), ultimate: false },
                { name: llmFirstResult.financial_beneficiary, type: 'Ultimate Owner', country: llmFirstResult.beneficiary_country || 'Unknown', flag: getCountryFlag(llmFirstResult.beneficiary_country), ultimate: true }
              ]

          const result = {
            financial_beneficiary: llmFirstResult.financial_beneficiary,
            beneficiary_country: llmFirstResult.beneficiary_country,
            beneficiary_flag: getCountryFlag(llmFirstResult.beneficiary_country),
            ownership_structure_type: llmFirstResult.ownership_structure_type,
            confidence_score: llmFirstResult.confidence_score,
            confidence_level: getConfidenceLabel(llmFirstResult.confidence_score),
            sources: [`LLM analysis of ${brand}`],
            reasoning: llmFirstResult.reasoning,
            ownership_flow: ownershipFlow,
            web_research_used: false,
            web_sources_count: 0,
            query_analysis_used: false,
            static_mapping_used: false,
            result_type: 'llm_first_analysis',
            cached: false,
            agent_execution_trace: combineTraces(imageProcessingTrace, traceLogger.toDatabaseFormat()),
            initial_llm_confidence: llmFirstResult.confidence_score,
            agent_results: {
              llm_first_analysis: {
                success: true,
                data: llmFirstResult,
                reasoning: 'LLM-first analysis provided high-confidence ownership determination'
              }
            }
          }
          
          llmFirstStage.success({
            financial_beneficiary: result.financial_beneficiary,
            confidence_score: result.confidence_score,
            method: 'llm_first_high_confidence'
          }, ['LLM-first analysis successful with high confidence'])
          
          await emitProgress(queryId, 'llm_first_analysis', 'success', llmFirstStage.stage.data)
          
          // Save to database
          const productData = ownershipResultToProductData(barcode, product_name, brand, result)
          await upsertProduct(productData)
          
          traceLogger.setFinalResult('llm_first_analysis')
          return result
        } else {
          llmFirstStage.reason(`LLM confidence too low (${llmFirstResult.confidence_score}%), proceeding with web research`, REASONING_TYPES.DECISION)
          llmFirstStage.decide('Proceed with web research', ['Use LLM result'], 'LLM confidence insufficient for direct use')
          
          llmFirstStage.success({
            confidence_score: llmFirstResult.confidence_score,
            method: 'llm_first_low_confidence',
            llm_insights: llmFirstResult
          }, ['LLM-first analysis completed, proceeding with web research'])
          
          await emitProgress(queryId, 'llm_first_analysis', 'completed', llmFirstStage.stage.data)
          
          // Store LLM insights for later use
          const llmInsights = llmFirstResult
          
        }
      } else {
        llmFirstStage.reason('LLM response could not be parsed as JSON', REASONING_TYPES.ERROR)
        llmFirstStage.success({ method: 'llm_first_failed' }, ['LLM-first analysis failed, proceeding with web research'])
        await emitProgress(queryId, 'llm_first_analysis', 'completed', { method: 'llm_first_failed' })
      }
      
    } catch (error) {
      llmFirstStage.reason(`LLM-first analysis failed: ${error.message}`, REASONING_TYPES.ERROR)
      llmFirstStage.success({ method: 'llm_first_error' }, ['LLM-first analysis encountered error, proceeding with web research'])
      await emitProgress(queryId, 'llm_first_analysis', 'completed', { method: 'llm_first_error' })
    }
    
    // Step 5: Query Builder Analysis
    const queryStage = new EnhancedStageTracker(traceLogger, 'query_builder', 'Analyzing brand for optimal search queries')
    await emitProgress(queryId, 'query_builder', 'started', { brand })
    
    let queryAnalysis = null
    if (isQueryBuilderAvailable()) {
      try {
        queryStage.reason('Query builder available, generating optimized search queries', REASONING_TYPES.INFO)
        queryAnalysis = await QueryBuilderAgent({
          brand,
          product_name,
          barcode,
          hints
        })
        
        queryStage.reason(`Query analysis complete: ${queryAnalysis.company_type} company, ${queryAnalysis.recommended_queries.length} queries`, REASONING_TYPES.ANALYSIS)
        queryStage.decide('Use query analysis', ['Use default queries'], 'Query builder provided optimized search strategy')
        
        queryStage.success({
          company_type: queryAnalysis.company_type,
          country_guess: queryAnalysis.country_guess,
          query_count: queryAnalysis.recommended_queries.length,
          flags: queryAnalysis.flags
        }, ['Query analysis completed successfully'])
        
        await emitProgress(queryId, 'query_builder', 'success', queryStage.stage.data)
        
      } catch (error) {
        queryStage.reason(`Query builder failed: ${error.message}`, REASONING_TYPES.ERROR)
        queryStage.error(error, {}, ['Query builder encountered an error'])
        await emitProgress(queryId, 'query_builder', 'error', null, error.message)
      }
    } else {
      queryStage.reason('Query builder not available, using default queries', REASONING_TYPES.INFO)
      queryStage.success({ result: 'not_available' }, ['Query builder not available'])
      await emitProgress(queryId, 'query_builder', 'completed', { result: 'not_available' })
    }
    
    // Step 6: LLM-First Research (Primary Path)
    const webStage = new EnhancedStageTracker(traceLogger, 'web_research', 'Performing LLM-first ownership research')
    await emitProgress(queryId, 'web_research', 'started', { method: 'llm_first_research' })
    
    // Initialize single researchData object to track the authoritative result
    let researchData = null
    let ownershipChain = null
    
    if (isLLMResearchAvailable()) {
      try {
        webStage.reason('LLM-first research available, attempting direct ownership determination', REASONING_TYPES.INFO)
        
        const llmResearchResult = await LLMResearchAgent({
          brand,
          product_name,
          hints,
          queryId,
          followUpContext
        })

        console.log('[DEBUG] LLM Research Agent Result:', {
          success: llmResearchResult?.success,
          ownership_chain: llmResearchResult?.ownership_chain,
          ownership_chain_length: llmResearchResult?.ownership_chain?.length,
          final_confidence: llmResearchResult?.final_confidence,
          research_method: llmResearchResult?.research_method
        })

        if (llmResearchResult?.ownership_chain?.length > 0) {
          // ✅ SHORT-CIRCUIT: Use LLM result as final authoritative output
          researchData = {
            ...llmResearchResult,
            success: true,
            research_method: 'llm_first_research',
          }
          ownershipChain = llmResearchResult.ownership_chain
          
          console.log('[DEBUG] LLM Research Success - Setting researchData:', {
            success: researchData.success,
            ownership_chain_length: researchData.ownership_chain?.length,
            final_confidence: researchData.final_confidence,
            research_method: researchData.research_method
          })
          
          // ✅ SHORT-CIRCUIT: Skip all fallback logic and return immediately
          console.log('[EnhancedAgent] ✅ Using LLM research result as final output, skipping fallback.')
          
          // Track evidence from ownership chain
          if (ownershipChain) {
            for (const entity of ownershipChain) {
              if (entity.sources) {
                for (const source of entity.sources) {
                  evidenceTracker.trackEvidence('llm_research_ownership', entity.name, source.url, source.confidence * 100, 'ownership')
                }
              }
            }
          }
          
          // Update output variables with LLM research results
          webStage.setVariables({
            inputVariables: {
              brand,
              product_name: product_name || 'Unknown product',
              hints: JSON.stringify(hints),
              query_analysis: queryAnalysis ? JSON.stringify(queryAnalysis) : null
            },
            outputVariables: {
              success: researchData.success,
              total_sources: researchData.sources?.length || 0,
              ownership_chain_length: ownershipChain?.length || 0,
              final_confidence: researchData.final_confidence,
              research_method: 'llm_first_research',
              notes: researchData.research_summary || ''
            },
            intermediateVariables: {
              llm_research_available: isLLMResearchAvailable(),
              evidence_tracked: researchData.sources?.length || 0
            }
          })
          
          webStage.success({
            success: researchData.success,
            total_sources: researchData.sources?.length || 0,
            ownership_chain_length: ownershipChain?.length || 0,
            final_confidence: researchData.final_confidence,
            research_method: 'llm_first_research'
          }, ['LLM-first research completed successfully'])
          
          // ✅ SHORT-CIRCUIT: Return the final result immediately
          return await buildFinalResult(researchData, ownershipChain, queryAnalysis, traceLogger, queryId, brand)
          
        } else {
          webStage.reason('LLM-first research completed but no findings, or ownership chain was empty. Proceeding to fallback.', REASONING_TYPES.WARNING)
          webStage.partial({
            success: false,
            total_sources: 0,
            ownership_chain_length: 0
          }, ['LLM-first research completed but no relevant findings, or ownership chain was empty.'])
          
          await emitProgress(queryId, 'web_research', 'fallback', { reason: 'llm_research_no_chain' })
        }
        
      } catch (error) {
        console.error('[EnhancedAgentOwnershipResearch] LLM research failed:', error)
        webStage.reason(`LLM-first research failed: ${error.message}`, REASONING_TYPES.ERROR)
        researchData = { success: false, findings: [], fallback_reason: 'llm_research_failure' }
        webStage.partial({
          success: false,
          total_sources: 0,
          ownership_chain_length: 0,
          fallback_reason: 'llm_research_failure'
        }, ['LLM-first research failed - proceeding to fallback'])
        
        await emitProgress(queryId, 'web_research', 'fallback', { reason: 'llm_research_failure' })
      }
    }
    
    // Fallback to deprecated web scraping if LLM research not available or failed
    if (!researchData?.success && isEnhancedWebSearchOwnershipAvailable()) {
      try {
        webStage.reason('LLM research unavailable or failed, falling back to enhanced web-search-powered ownership research', REASONING_TYPES.WARNING)
        
        const webSearchResult = await EnhancedWebSearchOwnershipAgent({
          brand,
          product_name,
          hints,
          queryId,
          followUpContext
        })
        
        // Handle null return (timeout/failure) from enhanced agent
        if (webSearchResult === null) {
          webStage.reason('Enhanced web-search-powered research failed (timeout/retry exhaustion) - falling back to next agent', REASONING_TYPES.WARNING)
          researchData = { success: false, findings: [], fallback_reason: 'enhanced_agent_timeout_or_failure' }
          webStage.partial({
            success: false,
            total_sources: 0,
            ownership_chain_length: 0,
            fallback_reason: 'enhanced_agent_timeout_or_failure'
          }, ['Enhanced web-search-powered research failed - proceeding to fallback'])
          
          await emitProgress(queryId, 'web_research', 'fallback', { reason: 'enhanced_agent_timeout_or_failure' })
          
        } else if (webSearchResult.success) {
          webStage.reason(`Web-search-powered research successful: ${webSearchResult.sources?.length || 0} sources, confidence: ${webSearchResult.final_confidence}`, REASONING_TYPES.EVIDENCE)
          
          // Extract ownership chain and sources
          ownershipChain = webSearchResult.ownership_chain
          researchData = {
            success: true,
            total_sources: webSearchResult.sources?.length || 0,
            search_results_count: webSearchResult.web_research_data?.search_results_count || 0,
            scraped_sites_count: webSearchResult.web_research_data?.scraped_sites_count || 0,
            findings: webSearchResult.sources || [],
            final_confidence: webSearchResult.final_confidence,
            notes: webSearchResult.notes,
            research_method: 'web_search_powered',
            // Add verification status from enhanced web search
            verification_status: webSearchResult.verification_status || 'unverified',
            verification_reasoning: webSearchResult.verification_reasoning || 'No verification data available',
            trusted_sources: webSearchResult.trusted_sources || [],
            verified_sources: webSearchResult.verified_sources || [],
            highly_likely_sources: webSearchResult.highly_likely_sources || []
          }
          
          // Track evidence from ownership chain
          if (ownershipChain) {
            for (const entity of ownershipChain) {
              if (entity.sources) {
                for (const source of entity.sources) {
                  evidenceTracker.trackEvidence('web_search_ownership', entity.name, source.url, source.confidence * 100, 'ownership')
                }
              }
            }
          }
          
          // Update output variables with web research results
          webStage.setVariables({
            inputVariables: {
              brand,
              product_name: product_name || 'Unknown product',
              hints: JSON.stringify(hints),
              query_analysis: queryAnalysis ? JSON.stringify(queryAnalysis) : null
            },
            outputVariables: {
              success: webSearchResult.success,
              total_sources: webSearchResult.sources?.length || 0,
              ownership_chain_length: ownershipChain?.length || 0,
              final_confidence: webSearchResult.final_confidence,
              research_method: 'web_search_powered',
              notes: webSearchResult.notes
            },
            intermediateVariables: {
              web_search_ownership_available: isWebSearchOwnershipAvailable(),
              evidence_tracked: webSearchResult.sources?.length || 0
            }
          })
          
          webStage.success({
            success: webSearchResult.success,
            total_sources: webSearchResult.sources?.length || 0,
            ownership_chain_length: ownershipChain?.length || 0,
            final_confidence: webSearchResult.final_confidence,
            research_method: 'web_search_powered'
          }, ['Web-search-powered research completed successfully'])
          
        } else {
          webStage.reason('Web-search-powered research completed but no findings', REASONING_TYPES.WARNING)
          webStage.partial({
            success: false,
            total_sources: 0,
            ownership_chain_length: 0
          }, ['Web-search-powered research completed but no relevant findings'])
        }
        
        await emitProgress(queryId, 'web_research', 'success', webStage.stage.data)
        
      } catch (error) {
        webStage.reason(`Web-search-powered research failed: ${error.message}`, REASONING_TYPES.ERROR)
        researchData = { success: false, findings: [] }
        webStage.error(error, {}, ['Web-search-powered research encountered an error'])
        await emitProgress(queryId, 'web_research', 'error', null, error.message)
      }
    } else if (isWebSearchOwnershipAvailable()) {
      // Fallback to original web-search-powered agent if enhanced is not available
      webStage.reason('Enhanced web-search-powered research not available, falling back to original web-search-powered research', REASONING_TYPES.WARNING)
      
      try {
        const webSearchResult = await WebSearchOwnershipAgent({
          brand,
          product_name,
          hints,
          queryId
        })
        
        if (webSearchResult.success) {
          webStage.reason(`Original web-search-powered research successful: ${webSearchResult.sources?.length || 0} sources, confidence: ${webSearchResult.final_confidence}`, REASONING_TYPES.EVIDENCE)
          
          // Extract ownership chain and sources
          ownershipChain = webSearchResult.ownership_chain
          researchData = {
            success: true,
            total_sources: webSearchResult.sources?.length || 0,
            search_results_count: webSearchResult.web_research_data?.search_results_count || 0,
            scraped_sites_count: webSearchResult.web_research_data?.scraped_sites_count || 0,
            findings: webSearchResult.sources || [],
            final_confidence: webSearchResult.final_confidence,
            notes: webSearchResult.notes,
            research_method: 'original_web_search_powered'
          }
          
          webStage.success({
            success: webSearchResult.success,
            total_sources: webSearchResult.sources?.length || 0,
            ownership_chain_length: ownershipChain?.length || 0,
            final_confidence: webSearchResult.final_confidence,
            research_method: 'original_web_search_powered'
          }, ['Original web-search-powered research completed successfully'])
          
        } else {
          webStage.reason('Original web-search-powered research completed but no findings', REASONING_TYPES.WARNING)
          webStage.partial({
            success: false,
            total_sources: 0,
            ownership_chain_length: 0
          }, ['Original web-search-powered research completed but no relevant findings'])
        }
        
        await emitProgress(queryId, 'web_research', 'success', webStage.stage.data)
        
      } catch (error) {
        webStage.reason(`Original web-search-powered research failed: ${error.message}`, REASONING_TYPES.ERROR)
        researchData = { success: false, findings: [] }
        webStage.error(error, {}, ['Original web-search-powered research encountered an error'])
        await emitProgress(queryId, 'web_research', 'error', null, error.message)
      }
    } else {
      // Fallback to legacy web research if no web-search-powered agents are available
      webStage.reason('Web-search-powered research not available, falling back to legacy web research', REASONING_TYPES.WARNING)
      
      if (isWebResearchAvailable()) {
        try {
          researchData = await WebResearchAgent({
            brand,
            product_name,
            hints,
            queryAnalysis
          })
          
          if (researchData.success) {
            webStage.reason(`Legacy web research successful: ${researchData.total_sources} sources, ${researchData.findings?.length || 0} findings`, REASONING_TYPES.EVIDENCE)
            
            // Track evidence found
            if (researchData.findings) {
              for (const finding of researchData.findings) {
                if (finding.owner) {
                  evidenceTracker.trackEvidence('web_research', finding.owner, finding.source, finding.confidence || 50, 'ownership')
                }
              }
            }
            
            webStage.success({
              success: researchData.success,
              total_sources: researchData.total_sources,
              search_results_count: researchData.search_results_count,
              scraped_sites_count: researchData.scraped_sites_count,
              findings_count: researchData.findings?.length || 0,
              research_method: 'legacy_web_research'
            }, ['Legacy web research completed successfully'])
            
          } else {
            webStage.reason('Legacy web research completed but no findings', REASONING_TYPES.WARNING)
            webStage.partial({
              success: false,
              total_sources: 0,
              findings_count: 0
            }, ['Legacy web research completed but no relevant findings'])
          }
          
          await emitProgress(queryId, 'web_research', 'success', webStage.stage.data)
          
        } catch (error) {
          webStage.reason(`Legacy web research failed: ${error.message}`, REASONING_TYPES.ERROR)
          researchData = { success: false, findings: [] }
          webStage.error(error, {}, ['Legacy web research encountered an error'])
          await emitProgress(queryId, 'web_research', 'error', null, error.message)
        }
      } else {
        webStage.reason('No web research available, using knowledge agent only', REASONING_TYPES.WARNING)
        webStage.success({ result: 'not_available' }, ['No web research available'])
        await emitProgress(queryId, 'web_research', 'completed', { result: 'not_available' })
      }
    }
    
    // Step 7: Ownership Analysis
    const analysisStage = new EnhancedStageTracker(traceLogger, 'ownership_analysis', 'Analyzing ownership structure')
    await emitProgress(queryId, 'ownership_analysis', 'started', { 
      web_research_success: researchData?.success,
      sources_count: researchData?.total_sources || 0
    })
    
    // Ensure we have the correct data from LLM research if available
    if (researchData?.research_method === 'llm_first_research' && researchData?.success) {
      console.log('[DEBUG] Using LLM research data for ownership analysis:', {
        success: researchData.success,
        ownership_chain_length: researchData.ownership_chain?.length,
        final_confidence: researchData.final_confidence
      })
    } else {
      console.log('[DEBUG] Using fallback data for ownership analysis:', {
        success: researchData?.success,
        research_method: researchData?.research_method,
        total_sources: researchData?.total_sources
      })
    }
    
    if (ownershipChain && ownershipChain.length > 0) {
      analysisStage.reason('Using structured ownership chain from web-search-powered research', REASONING_TYPES.INFO)
      
      // Convert structured ownership chain to the expected format
      ownership = convertStructuredOwnershipChain(ownershipChain, brand, researchData)
      
      analysisStage.reason(`Converted ownership chain with ${ownershipChain.length} entities`, REASONING_TYPES.SUCCESS)
      
    } else {
      // Fallback to LLM-based analysis for legacy web research or when no structured chain is available
      analysisStage.reason('No structured ownership chain available, performing LLM-based analysis', REASONING_TYPES.INFO)
      
      // Get current prompt version and build prompt using registry
      const promptVersion = getCurrentPromptVersion('OWNERSHIP_RESEARCH')
      const promptBuilder = getPromptBuilder('OWNERSHIP_RESEARCH', promptVersion)
      const researchPrompt = promptBuilder(product_name, brand, hints, researchData, queryAnalysis)
      
      // Set enhanced trace data for ownership analysis stage
      analysisStage.setConfig({
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.1,
        maxTokens: 1500,
        stopSequences: null
      })
      
      analysisStage.setVariables({
        inputVariables: {
          brand,
          product_name: product_name || 'Unknown product',
          hints: JSON.stringify(hints),
          web_research_data: researchData ? JSON.stringify(researchData) : null,
          query_analysis: queryAnalysis ? JSON.stringify(queryAnalysis) : null,
          prompt_version: promptVersion
        },
        outputVariables: {},
        intermediateVariables: {
          web_research_success: researchData?.success || false,
          sources_count: researchData?.total_sources || 0
        }
      })
      
      analysisStage.setPrompts(researchPrompt, `You are an expert corporate ownership researcher. Analyze the following brand and product to determine the ultimate financial beneficiary (parent company or owner).

Brand: {{brand}}
Product: {{product_name}}
Additional hints: {{hints}}
Web research data: {{web_research_data}}
Query analysis: {{query_analysis}}

Based on the provided information, determine:
1. **Financial Beneficiary**: The ultimate parent company or owner
2. **Ownership Structure Type**: The type of ownership structure
3. **Ownership Flow**: A detailed chain showing the ownership structure
4. **Confidence Score**: Your confidence in this analysis (0-100)
5. **Reasoning**: Detailed explanation of your analysis
6. **Country**: The country of the ultimate financial beneficiary

Respond in valid JSON format.`)
      
      analysisStage.reason(`Using prompt version: ${promptVersion}`, REASONING_TYPES.INFO)
      analysisStage.reason(`Analyzing ownership with ${researchData?.total_sources || 0} sources`, REASONING_TYPES.ANALYSIS)
      
      console.log('[DEBUG] Ownership Analysis Input:', {
        webResearchData_success: researchData?.success,
        webResearchData_total_sources: researchData?.total_sources,
        webResearchData_final_confidence: researchData?.final_confidence,
        webResearchData_research_method: researchData?.research_method,
        webResearchData_ownership_chain: researchData?.ownership_chain,
        ownershipChain: ownershipChain
      })
      
      // Ensure we're using the correct data from LLM research if available
      if (researchData?.research_method === 'llm_first_research' && researchData?.success) {
        console.log('[DEBUG] Using LLM research data for ownership analysis')
      } else {
        console.log('[DEBUG] Using fallback data for ownership analysis')
      }
      
      ownership = await performOwnershipAnalysis(researchPrompt, product_name, brand, researchData)
    }
    
    // Update output variables with ownership analysis results
    analysisStage.setVariables({
      inputVariables: {
        brand,
        product_name: product_name || 'Unknown product',
        hints: JSON.stringify(hints),
        web_research_data: researchData ? JSON.stringify(researchData) : null,
        query_analysis: queryAnalysis ? JSON.stringify(queryAnalysis) : null,
        has_structured_chain: !!ownershipChain
      },
      outputVariables: {
        financial_beneficiary: ownership.financial_beneficiary,
        beneficiary_country: ownership.beneficiary_country,
        ownership_structure_type: ownership.ownership_structure_type,
        confidence_score: ownership.confidence_score,
        reasoning: ownership.reasoning,
        ownership_flow: ownership.ownership_flow,
        sources: ownership.sources,
        research_method: researchData?.research_method || 'unknown'
      },
      intermediateVariables: {
        web_research_success: researchData?.success || false,
        sources_count: researchData?.total_sources || 0,
        analysis_duration_ms: Date.now() - analysisStage.startTime,
        used_structured_chain: !!ownershipChain
      }
    })
    
    analysisStage.reason(`Analysis complete: ${ownership.financial_beneficiary} (confidence: ${ownership.confidence_score}%)`, REASONING_TYPES.INFERENCE)
    analysisStage.trackConfidence(ownership.confidence_score, { 
      sources_count: ownership.sources?.length || 0,
      web_research_used: !!researchData?.success
    })
    
    analysisStage.success({
      confidence_score: ownership.confidence_score,
      financial_beneficiary: ownership.financial_beneficiary,
      beneficiary_country: ownership.beneficiary_country,
      sources_count: ownership.sources?.length || 0
    }, ['Ownership analysis completed'])
    
    await emitProgress(queryId, 'ownership_analysis', 'success', analysisStage.stage.data)
    
    // Step 8: Enhanced Confidence Calculation
    const confidenceStage = new EnhancedStageTracker(traceLogger, 'confidence_calculation', 'Calculating enhanced confidence score')
    await emitProgress(queryId, 'confidence_calculation', 'started', { initial_confidence: ownership.confidence_score })
    
    // Calculate enhanced confidence using multi-factor approach
    const enhancedConfidence = calculateEnhancedConfidence({
      ownershipData: ownership,
      webResearchData: researchData,
      queryAnalysis,
      agentResults: {
        query_builder: queryAnalysis ? { success: true, data: queryAnalysis } : { success: false },
        web_research: researchData ? { success: researchData.success, data: researchData } : { success: false },
        ownership_analysis: { success: true, data: ownership }
      },
      executionTrace: traceLogger.toDatabaseFormat()
    })
    
    // Update ownership data with enhanced confidence
    ownership.confidence_score = enhancedConfidence.confidence_score
    ownership.confidence_level = enhancedConfidence.confidence_level
    ownership.confidence_factors = enhancedConfidence.factors
    ownership.confidence_breakdown = enhancedConfidence.breakdown
    ownership.confidence_reasoning = enhancedConfidence.reasoning
    
    confidenceStage.reason(`Enhanced confidence calculated: ${enhancedConfidence.confidence_score}% (${enhancedConfidence.confidence_level})`, REASONING_TYPES.ANALYSIS)
    confidenceStage.reason(`Confidence factors: ${Object.entries(enhancedConfidence.factors).map(([k, v]) => `${k}: ${v}`).join(', ')}`, REASONING_TYPES.ANALYSIS)
    
    confidenceStage.success({
      final_confidence_score: enhancedConfidence.confidence_score,
      confidence_level: enhancedConfidence.confidence_level,
      factors_count: Object.keys(enhancedConfidence.factors).length
    }, ['Enhanced confidence calculation completed'])
    
    await emitProgress(queryId, 'confidence_calculation', 'success', confidenceStage.stage.data)
    
    // Step 9: Validation and Sanitization
    const validationStage = new EnhancedStageTracker(traceLogger, 'validation', 'Validating and sanitizing results')
    await emitProgress(queryId, 'validation', 'started', { confidence: ownership.confidence_score })
    
    const validated = validateAndSanitizeResults(ownership, brand, researchData)
    
    validationStage.reason(`Validation complete: ${validated.financial_beneficiary} (final confidence: ${validated.confidence_score}%)`, REASONING_TYPES.VALIDATION)
    
    validationStage.success({
      final_confidence_score: validated.confidence_score,
      warnings_count: validated.warnings?.length || 0,
      validation_passed: validated.financial_beneficiary !== 'Unknown'
    }, ['Validation and sanitization completed'])
    
    await emitProgress(queryId, 'validation', 'success', validationStage.stage.data)
    
    // Add metadata
    validated.beneficiary_flag = getCountryFlag(validated.beneficiary_country)
    validated.web_research_used = !!researchData?.success
    validated.web_sources_count = researchData?.total_sources || 0
    validated.query_analysis_used = !!queryAnalysis
    validated.query_analysis = queryAnalysis ? {
      company_type: queryAnalysis.company_type,
      country_guess: queryAnalysis.country_guess,
      flags: queryAnalysis.flags
    } : null
    validated.static_mapping_used = false
    validated.result_type = 'ai_research'
    validated.cached = false
    
    // Combine image processing trace with ownership research trace
    const combinedTrace = combineTraces(imageProcessingTrace, traceLogger.toDatabaseFormat())
    validated.agent_execution_trace = combinedTrace
    validated.initial_llm_confidence = ownership.confidence_score
    validated.agent_results = {
      query_builder: queryAnalysis ? {
        success: true,
        data: queryAnalysis,
        reasoning: 'Query builder analyzed brand characteristics and generated optimized search queries'
      } : {
        success: false,
        reasoning: 'Query builder not available or failed'
      },
      web_research: researchData ? {
        success: researchData.success,
        data: researchData,
        reasoning: 'Web research found relevant sources and extracted ownership information'
      } : {
        success: false,
        reasoning: 'Web research not available or failed'
      },
      ownership_analysis: {
        success: true,
        data: validated,
        reasoning: validated.reasoning
      }
    }
    
    // Step 10: Database Save
    const saveStage = new EnhancedStageTracker(traceLogger, 'database_save', 'Saving result to database')
    
    // Check if we should save to database
    const shouldSave = ownership.financial_beneficiary && ownership.financial_beneficiary !== 'Unknown'
    console.log('💾 [Pipeline] Database save decision:', { 
      financial_beneficiary: ownership.financial_beneficiary, 
      shouldSave 
    })
    
    if (shouldSave) {
      await emitProgress(queryId, 'database_save', 'started', { 
        financial_beneficiary: ownership.financial_beneficiary,
        confidence_score: ownership.confidence_score 
      })
      
      try {
        console.log('[DBCache] Starting database write for ownership result:', {
          brand,
          product_name,
          beneficiary: ownership.financial_beneficiary,
          confidence: ownership.confidence_score,
          verification_status: ownership.verification_status,
          has_verification_evidence: !!ownership.verification_evidence,
          verification_confidence_change: ownership.verification_confidence_change
        });

        const { data: product, error: saveError } = await supabase
          .from('products')
          .upsert({
            barcode,
            product_name,
            brand,
            financial_beneficiary: ownership.financial_beneficiary,
            beneficiary_country: ownership.beneficiary_country,
            beneficiary_flag: ownership.beneficiary_flag,
            confidence: ownership.confidence_score,
            verification_status: ownership.verification_status,
            verified_at: ownership.verified_at,
            verification_method: ownership.verification_method,
            verification_notes: ownership.verification_notes,
            verification_evidence: ownership.verification_evidence,
            verification_confidence_change: ownership.verification_confidence_change,
            confidence_assessment: ownership.confidence_assessment,
            sources: ownership.sources,
            reasoning: ownership.reasoning,
            result_type: ownership.result_type,
            ownership_structure_type: ownership.ownership_structure_type,
            ownership_flow: ownership.ownership_flow,
            user_contributed: false,
            agent_execution_trace: traceLogger.getTrace(),
            confidence_factors: ownership.confidence_factors,
            confidence_breakdown: ownership.confidence_breakdown,
            confidence_reasoning: ownership.confidence_reasoning,
            result_id: ownership.result_id,
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (saveError) {
          console.error('[DBCache] Database write failed:', {
            error: saveError,
            error_code: saveError.code,
            error_message: saveError.message,
            brand,
            product_name,
            beneficiary: ownership.financial_beneficiary
          });
          throw saveError;
        }
        
        console.log('[DBCache] Database write successful:', {
          product_id: product.id,
          brand,
          product_name,
          beneficiary: ownership.financial_beneficiary,
          verification_status: ownership.verification_status,
          verification_fields_persisted: {
            verification_status: !!ownership.verification_status,
            verified_at: !!ownership.verified_at,
            verification_method: !!ownership.verification_method,
            verification_notes: !!ownership.verification_notes,
            verification_evidence: !!ownership.verification_evidence,
            verification_confidence_change: !!ownership.verification_confidence_change,
            confidence_assessment: !!ownership.confidence_assessment
          }
        });
        
        saveStage.success({ product_id: product.id }, ['Result saved to database'])
        await emitProgress(queryId, 'database_save', 'completed', { product_id: product.id })
        
        console.log('✅ [Pipeline] Ownership saved to database:', {
          brand,
          product_name,
          beneficiary: ownership.financial_beneficiary,
          product_id: product.id
        })
        
        // Store successful result in knowledge base for future RAG queries
        if (ownership.confidence_score >= 70 && ownership.financial_beneficiary !== 'Unknown') {
          try {
            const knowledgeEntry = {
              brand: brand.toLowerCase(),
              product_name,
              barcode,
              financial_beneficiary: ownership.financial_beneficiary,
              beneficiary_country: ownership.beneficiary_country,
              ownership_structure_type: ownership.ownership_structure_type,
              ownership_flow: ownership.ownership_flow,
              confidence_score: ownership.confidence_score,
              reasoning: ownership.reasoning,
              sources: ownership.sources,
              tags: ['enhanced_agent', 'web_research', ownership.confidence_score >= 90 ? 'high_confidence' : 'medium_confidence']
            }
            
            await ragKnowledgeBase.storeEntry(knowledgeEntry)
            console.log(`✅ Stored research result in knowledge base: ${brand} → ${ownership.financial_beneficiary}`)
          } catch (knowledgeError) {
            console.warn('Failed to store result in knowledge base:', knowledgeError.message)
          }
        }
        
      } catch (error) {
        saveStage.error(error, {}, ['Failed to save result to database'])
        await emitProgress(queryId, 'database_save', 'failed', { error: error.message })
        console.error('Database save error:', error)
      }
    } else {
      console.log('⚠️ [Pipeline] Skipping database save - no valid ownership result')
      await emitProgress(queryId, 'database_save', 'completed', { 
        success: false,
        reason: 'no_valid_ownership_result'
      })
    }
    
    // Set final result
    traceLogger.setFinalResult(validated.financial_beneficiary !== 'Unknown' ? 'success' : 'failure')
    
    // Evaluation logging if enabled
    if (enableEvaluation && hints.test_id) {
      try {
        const evaluationData = {
          test_id: hints.test_id,
          trace_id: queryId,
          agent_version: 'enhanced-v1.0',
          actual_owner: validated.financial_beneficiary,
          actual_country: validated.beneficiary_country,
          actual_structure_type: validated.ownership_structure_type,
          confidence_score: validated.confidence_score,
          match_result: 'TBD', // Will be calculated by evaluation framework
          latency: Date.now() - startTime,
          token_cost_estimate: 0, // TODO: Calculate from API response
          tool_errors: '',
          explainability_score: 0, // Will be calculated by evaluation framework
          source_used: validated.sources?.join(', ') || '',
          prompt_snapshot: JSON.stringify(validated.agent_results || {}),
          response_snippet: validated.reasoning || ''
        }
        
        const steps = traceLogger.getStages().map(stage => ({
          step_name: stage.name,
          agent_or_tool: stage.agent || 'enhanced_ownership_agent',
          input: stage.input || '',
          output_snippet: stage.output || '',
          outcome: stage.status,
          latency_seconds: stage.duration ? stage.duration / 1000 : 0,
          tool_used: stage.tool_used || '',
          fallback_used: stage.fallback_used || 'No',
          notes: stage.notes || ''
        }))
        
        await evaluationFramework.logEvaluation(evaluationData, steps)
        console.log(`[EnhancedAgentOwnershipResearch] Evaluation logged for test_id: ${hints.test_id}`)
      } catch (evalError) {
        console.warn('[EnhancedAgentOwnershipResearch] Failed to log evaluation:', evalError.message)
      }
    }
    
    // Generate unique result ID for deep linking
    const resultId = generateCurrentResultId(brand, product_name)
    validated.result_id = resultId
    
    console.log(`[EnhancedAgentOwnershipResearch] Research complete with result_id: ${resultId}`, validated)
    
    const duration = Date.now() - startTime;
    console.log(`[AgentLog] Completed: EnhancedAgentOwnershipResearch (${duration}ms)`);
    console.timeEnd('[AgentTimer] EnhancedAgentOwnershipResearch');
    return validated
    
  } catch (error) {
    console.error('[EnhancedAgentOwnershipResearch] Research failed:', error)
    
    const errorStage = new EnhancedStageTracker(traceLogger, 'error_recovery', 'Error recovery and fallback response')
    errorStage.reason(`Research failed: ${error.message}`, REASONING_TYPES.ERROR)
    errorStage.error(error, {}, ['Research process encountered an error'])
    
    traceLogger.setFinalResult('error', error.message)
    
    // Create fallback response
    const fallbackResult = createFallbackResponse(brand, error.message)
    fallbackResult.agent_execution_trace = combineTraces(imageProcessingTrace, traceLogger.toDatabaseFormat())
    
    // Generate result ID even for fallback responses
    const resultId = generateCurrentResultId(brand, product_name)
    fallbackResult.result_id = resultId
    
    const duration = Date.now() - startTime;
    console.log(`[AgentLog] Error in EnhancedAgentOwnershipResearch (${duration}ms):`, error.message);
    console.timeEnd('[AgentTimer] EnhancedAgentOwnershipResearch');
    return fallbackResult
  }
}

/**
 * Convert structured ownership chain to the expected format
 */
function convertStructuredOwnershipChain(ownershipChain, brand, webResearchData) {
  if (!ownershipChain || ownershipChain.length === 0) {
    return createFallbackResponse(brand, 'No ownership chain available')
  }
  
  // Find the ultimate owner (last entity in chain)
  const ultimateOwner = ownershipChain[ownershipChain.length - 1]
  const brandEntity = ownershipChain[0]
  
  // Calculate average confidence from all sources
  const allSources = ownershipChain.flatMap(entity => entity.sources || [])
  const averageConfidence = allSources.length > 0 
    ? allSources.reduce((sum, source) => sum + source.confidence, 0) / allSources.length
    : 0.5
  
  // Build ownership flow
  const ownershipFlow = ownershipChain.map(entity => ({
    name: entity.name,
    type: entity.role,
    country: entity.country || 'Unknown',
    source: 'web_search_analysis'
  }))
  
  // Extract sources for the result
  const sources = allSources.map(source => source.url).filter(Boolean)
  
  return {
    financial_beneficiary: ultimateOwner.name,
    beneficiary_country: ultimateOwner.country || 'Unknown',
    beneficiary_flag: getCountryFlag(ultimateOwner.country),
    ownership_structure_type: determineOwnershipStructureType(ownershipChain),
    ownership_flow: ownershipFlow,
    confidence_score: Math.round(averageConfidence * 100),
    confidence_level: getConfidenceLabel(averageConfidence * 100),
    confidence_factors: {
      source_authority: calculateSourceAuthorityScore(allSources),
      source_recency: calculateSourceRecencyScore(allSources),
      source_count: allSources.length,
      chain_completeness: ownershipChain.length
    },
    confidence_breakdown: {
      tier_1_sources: allSources.filter(s => s.tier === 1).length,
      tier_2_sources: allSources.filter(s => s.tier === 2).length,
      tier_3_sources: allSources.filter(s => s.tier === 3).length,
      tier_4_sources: allSources.filter(s => s.tier === 4).length
    },
    confidence_reasoning: `Based on ${allSources.length} sources across ${ownershipChain.length} ownership levels`,
    sources: sources,
    reasoning: webResearchData?.notes || `Ownership chain determined through web search analysis`,
    // Add verification status from web research data
    verification_status: webResearchData?.verification_status || 'unverified',
    verification_reasoning: webResearchData?.verification_reasoning || 'No verification data available',
    trusted_sources: webResearchData?.trusted_sources || [],
    verified_sources: webResearchData?.verified_sources || [],
    highly_likely_sources: webResearchData?.highly_likely_sources || [],
    agent_results: {
      web_research_data: webResearchData,
      ownership_chain: ownershipChain
    }
  }
}

/**
 * Determine ownership structure type based on chain
 */
function determineOwnershipStructureType(ownershipChain) {
  if (!ownershipChain || ownershipChain.length === 0) return 'Unknown'
  
  const ultimateOwner = ownershipChain[ownershipChain.length - 1]
  
  if (ownershipChain.length === 1) {
    return 'Independent Brand'
  } else if (ownershipChain.length === 2) {
    return 'Subsidiary'
  } else {
    return 'Complex Ownership'
  }
}

/**
 * Calculate source authority score
 */
function calculateSourceAuthorityScore(sources) {
  if (!sources || sources.length === 0) return 0
  
  const tierWeights = { 1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4 }
  const weightedSum = sources.reduce((sum, source) => {
    return sum + (tierWeights[source.tier] || 0.4) * source.confidence
  }, 0)
  
  return Math.round((weightedSum / sources.length) * 100)
}

/**
 * Calculate source recency score
 */
function calculateSourceRecencyScore(sources) {
  if (!sources || sources.length === 0) return 0
  
  const currentYear = new Date().getFullYear()
  const recentSources = sources.filter(source => {
    if (!source.date) return false
    const sourceYear = new Date(source.date).getFullYear()
    return sourceYear >= currentYear - 1
  })
  
  return Math.round((recentSources.length / sources.length) * 100)
}

// Helper functions
function generateQueryId() {
  return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getCountryFlag(country) {
  if (!country || country === 'Unknown') return '🏳️'
  
  const flagMap = {
    'United States': '🇺🇸',
    'US': '🇺🇸',
    'USA': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'UK': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Switzerland': '🇨🇭',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Belgium': '🇧🇪',
    'Austria': '🇦🇹',
    'Ireland': '🇮🇪',
    'Luxembourg': '🇱🇺',
    'Singapore': '🇸🇬',
    'Hong Kong': '🇭🇰',
    'South Korea': '🇰🇷',
    'India': '🇮🇳',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽',
    'Argentina': '🇦🇷',
    'Chile': '🇨🇱',
    'Colombia': '🇨🇴',
    'Peru': '🇵🇪',
    'Venezuela': '🇻🇪',
    'Uruguay': '🇺🇾',
    'Paraguay': '🇵🇾',
    'Bolivia': '🇧🇴',
    'Ecuador': '🇪🇨',
    'Guyana': '🇬🇾',
    'Suriname': '🇸🇷',
    'French Guiana': '🇬🇫'
  }
  
  return flagMap[country] || '🏳️'
}

function createFallbackResponse(brand, errorMessage) {
  return {
    financial_beneficiary: 'Unknown',
    beneficiary_country: 'Unknown',
    beneficiary_flag: '🏳️',
    ownership_structure_type: 'Unknown',
    confidence_score: 20,
    ownership_flow: [],
    sources: ['AI analysis'],
    reasoning: `Unable to determine ownership due to error: ${errorMessage}`,
    web_research_used: false,
    web_sources_count: 0,
    query_analysis_used: false,
    static_mapping_used: false,
    result_type: 'error',
    cached: false,
    error: errorMessage
  }
}

// Reuse existing functions from original agent
async function performOwnershipAnalysis(researchPrompt, product_name, brand, webResearchData) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: researchPrompt
        }
      ]
    })
    
    const content = response.content[0].text
    const parsed = await parseJSONResponse(content, 1)
    
    return {
      ...parsed,
      sources: webResearchData?.sources || ['AI analysis'],
      reasoning: parsed.reasoning || 'AI analysis of available information'
    }
  } catch (error) {
    console.error('[EnhancedAgentOwnershipResearch] Ownership analysis failed:', error)
    return createFallbackResponse(brand, error.message)
  }
}

async function parseJSONResponse(text, attempt) {
  try {
    // First try to extract JSON from markdown if present
    const extractedJSON = extractJSONFromMarkdown(text)
    const jsonToParse = extractedJSON || text
    
    // Try to parse directly first
    return JSON.parse(jsonToParse)
  } catch (error) {
    console.error(`[EnhancedAgentOwnershipResearch] JSON parse attempt ${attempt} failed:`, error)
    
    // Try to repair the JSON
    try {
      const repaired = repairJSON(text)
      if (repaired) {
        console.log(`[EnhancedAgentOwnershipResearch] JSON repair successful on attempt ${attempt}`)
        return repaired
      }
    } catch (repairError) {
      console.error(`[EnhancedAgentOwnershipResearch] JSON repair failed on attempt ${attempt}:`, repairError.message)
    }
    
    // If all else fails, return fallback
    return createFallbackResponse('Unknown', 'JSON parsing failed')
  }
}

function validateAndSanitizeResults(ownershipData, brand, webResearchData) {
  const validated = { ...ownershipData }
  
  // Basic validation
  if (!validated.financial_beneficiary) validated.financial_beneficiary = 'Unknown'
  if (!validated.beneficiary_country) validated.beneficiary_country = 'Unknown'
  if (!validated.ownership_structure_type) validated.ownership_structure_type = 'Unknown'
  if (!validated.confidence_score) validated.confidence_score = 30
  
  // After fetching or constructing ownership_flow:
  if (Array.isArray(validated.ownership_flow)) {
    validated.ownership_flow = validated.ownership_flow.map(entry => {
      if (typeof entry === 'string') {
        return { name: entry };
      }
      return entry;
    });
  }
  
  // Add agent_results if not present
  if (!validated.agent_results) {
    validated.agent_results = {
      web_research: webResearchData ? {
        success: webResearchData.success,
        data: webResearchData,
        reasoning: 'Web research completed with enhanced source verification'
      } : {
        success: false,
        reasoning: 'Web research not available or failed'
      },
      ownership_analysis: {
        success: true,
        data: {
          financial_beneficiary: validated.financial_beneficiary,
          beneficiary_country: validated.beneficiary_country,
          confidence_score: validated.confidence_score,
          ownership_structure_type: validated.ownership_structure_type,
          ownership_flow: validated.ownership_flow,
          sources: validated.sources,
          reasoning: validated.reasoning
        },
        reasoning: 'Ownership analysis completed using web research results'
      }
    }
  }
  
  return validated
}

/**
 * Combine image processing trace with ownership research trace
 */
function combineTraces(imageProcessingTrace, ownershipResearchTrace) {
  if (!imageProcessingTrace) {
    return ownershipResearchTrace
  }
  
  // Extract stages from both traces
  const imageStages = imageProcessingTrace.stages || []
  const ownershipStages = ownershipResearchTrace.stages || []
  
  // Combine all stages, putting image processing stages first
  const combinedStages = [...imageStages, ...ownershipStages]
  
  // Create combined trace
  const combinedTrace = {
    ...ownershipResearchTrace,
    stages: combinedStages,
    // Update metadata to reflect combined trace
    total_stages: combinedStages.length,
    has_image_processing: imageStages.length > 0,
    has_ownership_research: ownershipStages.length > 0
  }
  
  return combinedTrace
} 

/**
 * Build final result object for short-circuit return when LLM research succeeds
 */
async function buildFinalResult(researchData, ownershipChain, queryAnalysis, traceLogger, queryId, brand) {
  console.log('[DEBUG] Building final result from LLM research:', {
    researchData_success: researchData?.success,
    ownership_chain_length: ownershipChain?.length,
    research_method: researchData?.research_method
  })
  
  // Convert structured ownership chain to the expected format
  const ownership = convertStructuredOwnershipChain(ownershipChain, brand, researchData)
  
  // Add metadata
  ownership.beneficiary_flag = getCountryFlag(ownership.beneficiary_country)
  ownership.web_research_used = !!researchData?.success
  ownership.web_sources_count = researchData?.total_sources || 0
  ownership.query_analysis_used = !!queryAnalysis
  ownership.query_analysis = queryAnalysis ? {
    company_type: queryAnalysis.company_type,
    country_guess: queryAnalysis.country_guess,
    flags: queryAnalysis.flags
  } : {
    company_type: undefined,
    country_guess: undefined,
    flags: undefined
  }
  ownership.static_mapping_used = false
  ownership.result_type = 'llm_first_research'
  ownership.cached = false
  ownership.agent_execution_trace = traceLogger.toDatabaseFormat()
  ownership.initial_llm_confidence = researchData?.final_confidence || 0
  ownership.agent_results = {
    query_builder: queryAnalysis ? {
      success: true,
      data: queryAnalysis,
      reasoning: 'Query builder analyzed brand characteristics and generated optimized search queries'
    } : {
      success: false,
      reasoning: 'Query builder not available or failed'
    },
    web_research: researchData ? {
      success: researchData.success,
      data: researchData,
      reasoning: 'LLM-first research provided high-confidence ownership determination'
    } : {
      success: false,
      reasoning: 'Web research not available or failed'
    },
    ownership_analysis: {
      success: true,
      data: {
        financial_beneficiary: ownership.financial_beneficiary,
        beneficiary_country: ownership.beneficiary_country,
        ownership_structure_type: ownership.ownership_structure_type,
        confidence_score: ownership.confidence_score,
        ownership_flow: ownership.ownership_flow,
        sources: ownership.sources,
        reasoning: ownership.reasoning
      },
      reasoning: 'Ownership analysis completed using LLM research results'
    }
  }
  ownership.fallback_reason = null
  ownership.result_id = generateQueryId()
  
  console.log('[DEBUG] Final result built from LLM research:', {
    financial_beneficiary: ownership.financial_beneficiary,
    confidence_score: ownership.confidence_score,
    research_method: ownership.result_type
  })
  
  return ownership
} 