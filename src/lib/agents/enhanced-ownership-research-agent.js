/**
 * Enhanced Ownership Research Agent
 * Integrates multi-factor confidence estimation and detailed trace logging
 */

import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import { WebResearchAgent, isWebResearchAvailable } from './web-research-agent.js'
import { QueryBuilderAgent, isQueryBuilderAvailable } from './query-builder-agent.js'
import { supabase } from '../supabase.ts'
import { lookupOwnershipMapping, mappingToResult } from '../database/ownership-mappings.js'
import { getProductByBarcode, upsertProduct, ownershipResultToProductData } from '../database/products.js'
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
  imageProcessingTrace = null
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
    await emitProgress(queryId, 'cache_check', 'started', { barcode })
    
    cacheStage.reason('Checking database for existing product record', REASONING_TYPES.INFO)
    const existingProduct = await getProductByBarcode(barcode)
    
    if (existingProduct && existingProduct.financial_beneficiary && existingProduct.financial_beneficiary !== 'Unknown') {
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
    
    // Step 6: Web Research
    const webStage = new EnhancedStageTracker(traceLogger, 'web_research', 'Performing web research for ownership information')
    await emitProgress(queryId, 'web_research', 'started', { brand, hasQueryAnalysis: !!queryAnalysis })
    
    // Set enhanced trace data for web research stage
    webStage.setConfig({
      model: 'serpapi_web_search',
      temperature: null,
      maxTokens: null,
      stopSequences: null
    })
    
    webStage.setVariables({
      inputVariables: {
        brand,
        product_name: product_name || 'Unknown product',
        hints: JSON.stringify(hints),
        query_analysis: queryAnalysis ? JSON.stringify(queryAnalysis) : null
      },
      outputVariables: {},
      intermediateVariables: {
        web_research_available: isWebResearchAvailable()
      }
    })
    
    webStage.setPrompts(
      'Web research using SERP API with optimized queries',
      'Perform web research for {{brand}} using {{query_analysis}} to find ownership information'
    )
    
    let webResearchData = null
    if (isWebResearchAvailable()) {
      try {
        webStage.reason('Web research available, performing comprehensive search', REASONING_TYPES.INFO)
        webResearchData = await WebResearchAgent({
          brand,
          product_name,
          hints,
          queryAnalysis
        })
        
        if (webResearchData.success) {
          webStage.reason(`Web research successful: ${webResearchData.total_sources} sources, ${webResearchData.findings?.length || 0} findings`, REASONING_TYPES.EVIDENCE)
          
          // Track evidence found
          if (webResearchData.findings) {
            for (const finding of webResearchData.findings) {
              if (finding.owner) {
                evidenceTracker.trackEvidence('web_research', finding.owner, finding.source, finding.confidence || 50, 'ownership')
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
              success: webResearchData.success,
              total_sources: webResearchData.total_sources,
              search_results_count: webResearchData.search_results_count,
              scraped_sites_count: webResearchData.scraped_sites_count,
              findings_count: webResearchData.findings?.length || 0,
              findings: webResearchData.findings || []
            },
            intermediateVariables: {
              web_research_available: isWebResearchAvailable(),
              evidence_tracked: webResearchData.findings?.length || 0
            }
          })
          
          webStage.success({
            success: webResearchData.success,
            total_sources: webResearchData.total_sources,
            search_results_count: webResearchData.search_results_count,
            scraped_sites_count: webResearchData.scraped_sites_count,
            findings_count: webResearchData.findings?.length || 0
          }, ['Web research completed successfully'])
          
        } else {
          webStage.reason('Web research completed but no findings', REASONING_TYPES.WARNING)
          webStage.partial({
            success: false,
            total_sources: 0,
            findings_count: 0
          }, ['Web research completed but no relevant findings'])
        }
        
        await emitProgress(queryId, 'web_research', 'success', webStage.stage.data)
        
      } catch (error) {
        webStage.reason(`Web research failed: ${error.message}`, REASONING_TYPES.ERROR)
        webResearchData = { success: false, findings: [] }
        webStage.error(error, {}, ['Web research encountered an error'])
        await emitProgress(queryId, 'web_research', 'error', null, error.message)
      }
    } else {
      webStage.reason('Web research not available, using knowledge agent only', REASONING_TYPES.WARNING)
      webStage.success({ result: 'not_available' }, ['Web research not available'])
      await emitProgress(queryId, 'web_research', 'completed', { result: 'not_available' })
    }
    
    // Step 7: Ownership Analysis
    const analysisStage = new EnhancedStageTracker(traceLogger, 'ownership_analysis', 'Performing LLM-based ownership analysis')
    await emitProgress(queryId, 'ownership_analysis', 'started', { 
      hasWebResearch: !!webResearchData?.success,
      sourcesCount: webResearchData?.total_sources || 0
    })
    
    // Get current prompt version and build prompt using registry
    const promptVersion = getCurrentPromptVersion('OWNERSHIP_RESEARCH')
    const promptBuilder = getPromptBuilder('OWNERSHIP_RESEARCH', promptVersion)
    const researchPrompt = promptBuilder(product_name, brand, hints, webResearchData, queryAnalysis)
    
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
        web_research_data: webResearchData ? JSON.stringify(webResearchData) : null,
        query_analysis: queryAnalysis ? JSON.stringify(queryAnalysis) : null,
        prompt_version: promptVersion
      },
      outputVariables: {},
      intermediateVariables: {
        web_research_success: webResearchData?.success || false,
        sources_count: webResearchData?.total_sources || 0
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
    analysisStage.reason(`Analyzing ownership with ${webResearchData?.total_sources || 0} sources`, REASONING_TYPES.ANALYSIS)
    
    const ownership = await performOwnershipAnalysis(researchPrompt, product_name, brand, webResearchData)
    
    // Update output variables with ownership analysis results
    analysisStage.setVariables({
      inputVariables: {
        brand,
        product_name: product_name || 'Unknown product',
        hints: JSON.stringify(hints),
        web_research_data: webResearchData ? JSON.stringify(webResearchData) : null,
        query_analysis: queryAnalysis ? JSON.stringify(queryAnalysis) : null,
        prompt_version: promptVersion
      },
      outputVariables: {
        financial_beneficiary: ownership.financial_beneficiary,
        beneficiary_country: ownership.beneficiary_country,
        ownership_structure_type: ownership.ownership_structure_type,
        confidence_score: ownership.confidence_score,
        reasoning: ownership.reasoning,
        ownership_flow: ownership.ownership_flow,
        sources: ownership.sources
      },
      intermediateVariables: {
        web_research_success: webResearchData?.success || false,
        sources_count: webResearchData?.total_sources || 0,
        analysis_duration_ms: Date.now() - analysisStage.startTime
      }
    })
    
    analysisStage.reason(`Analysis complete: ${ownership.financial_beneficiary} (confidence: ${ownership.confidence_score}%)`, REASONING_TYPES.INFERENCE)
    analysisStage.trackConfidence(ownership.confidence_score, { 
      sources_count: ownership.sources?.length || 0,
      web_research_used: !!webResearchData?.success
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
      webResearchData,
      queryAnalysis,
      agentResults: {
        query_builder: queryAnalysis ? { success: true, data: queryAnalysis } : { success: false },
        web_research: webResearchData ? { success: webResearchData.success, data: webResearchData } : { success: false },
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
    
    const validated = validateAndSanitizeResults(ownership, brand, webResearchData)
    
    validationStage.reason(`Validation complete: ${validated.financial_beneficiary} (final confidence: ${validated.confidence_score}%)`, REASONING_TYPES.VALIDATION)
    
    validationStage.success({
      final_confidence_score: validated.confidence_score,
      warnings_count: validated.warnings?.length || 0,
      validation_passed: validated.financial_beneficiary !== 'Unknown'
    }, ['Validation and sanitization completed'])
    
    await emitProgress(queryId, 'validation', 'success', validationStage.stage.data)
    
    // Add metadata
    validated.beneficiary_flag = getCountryFlag(validated.beneficiary_country)
    validated.web_research_used = !!webResearchData?.success
    validated.web_sources_count = webResearchData?.total_sources || 0
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
      web_research: webResearchData ? {
        success: webResearchData.success,
        data: webResearchData,
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
    await emitProgress(queryId, 'database_save', 'started', { 
      financial_beneficiary: ownership.financial_beneficiary,
      confidence_score: ownership.confidence_score 
    })
    
    try {
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
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (saveError) throw saveError
      
      saveStage.success({ product_id: product.id }, ['Result saved to database'])
      await emitProgress(queryId, 'database_save', 'completed', { product_id: product.id })
      
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
    
    console.log(`[EnhancedAgentOwnershipResearch] Research complete:`, validated)
    
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
    
    const duration = Date.now() - startTime;
    console.log(`[AgentLog] Error in EnhancedAgentOwnershipResearch (${duration}ms):`, error.message);
    console.timeEnd('[AgentTimer] EnhancedAgentOwnershipResearch');
    return fallbackResult
  }
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
    return JSON.parse(text)
  } catch (error) {
    console.error(`[EnhancedAgentOwnershipResearch] JSON parse attempt ${attempt} failed:`, error)
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