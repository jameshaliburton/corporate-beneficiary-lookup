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
import { adaptedEvaluationFramework } from '../services/adapted-evaluation-framework.js'
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
  enableEvaluation = false
}) {
  const startTime = Date.now()
  const queryId = generateQueryId()
  
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
        agent_execution_trace: traceLogger.toDatabaseFormat(),
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
    
    // Step 1: Static Mapping Check
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
      result.agent_execution_trace = traceLogger.toDatabaseFormat()
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
    
    // Step 2: LLM-First Analysis
    const llmFirstStage = new EnhancedStageTracker(traceLogger, 'llm_first_analysis', 'Attempting initial LLM analysis of brand ownership')
    await emitProgress(queryId, 'llm_first_analysis', 'started', { brand, product_name })
    
    llmFirstStage.reason(`Attempting LLM-first analysis for brand: ${brand}`, REASONING_TYPES.INFO)
    
    try {
      const llmFirstPrompt = `You are an expert corporate ownership researcher. Analyze the following brand and product to determine the ultimate financial beneficiary (parent company or owner).

Brand: ${brand}
Product: ${product_name || 'Unknown product'}
Barcode: ${barcode}
Additional hints: ${JSON.stringify(hints)}

Based on your knowledge of corporate structures and brand ownership, provide a detailed analysis:

1. What type of company is this brand likely associated with?
2. What is the ultimate financial beneficiary (parent company or owner)?
3. What country is the ultimate owner based in?
4. What is your confidence level (0-100) in this assessment?
5. What reasoning supports your conclusion?

Respond in JSON format:
{
  "company_type": "string",
  "financial_beneficiary": "string", 
  "beneficiary_country": "string",
  "confidence_score": number,
  "reasoning": "string",
  "ownership_structure_type": "string"
}

If you cannot determine with reasonable confidence, set financial_beneficiary to "Unknown" and confidence_score to a low value.`

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
        
        llmFirstStage.reason(`LLM analysis complete: ${llmFirstResult.financial_beneficiary} (confidence: ${llmFirstResult.confidence_score}%)`, REASONING_TYPES.ANALYSIS)
        
        // If LLM has high confidence (>70), use it directly
        if (llmFirstResult.confidence_score > 70 && llmFirstResult.financial_beneficiary !== 'Unknown') {
          llmFirstStage.decide('Use LLM-first result', ['Proceed with web research'], 'LLM analysis provides high-confidence result')
          
          const result = {
            financial_beneficiary: llmFirstResult.financial_beneficiary,
            beneficiary_country: llmFirstResult.beneficiary_country,
            beneficiary_flag: getCountryFlag(llmFirstResult.beneficiary_country),
            ownership_structure_type: llmFirstResult.ownership_structure_type,
            confidence_score: llmFirstResult.confidence_score,
            confidence_level: getConfidenceLabel(llmFirstResult.confidence_score),
            sources: [`LLM analysis of ${brand}`],
            reasoning: llmFirstResult.reasoning,
            ownership_flow: [brand, llmFirstResult.financial_beneficiary],
            web_research_used: false,
            web_sources_count: 0,
            query_analysis_used: false,
            static_mapping_used: false,
            result_type: 'llm_first_analysis',
            cached: false,
            agent_execution_trace: traceLogger.toDatabaseFormat(),
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
    
    // Step 3: Query Builder Analysis
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
    
    // Step 4: Web Research
    const webStage = new EnhancedStageTracker(traceLogger, 'web_research', 'Performing web research for ownership information')
    await emitProgress(queryId, 'web_research', 'started', { brand, hasQueryAnalysis: !!queryAnalysis })
    
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
    
    // Step 5: Ownership Analysis
    const analysisStage = new EnhancedStageTracker(traceLogger, 'ownership_analysis', 'Performing LLM-based ownership analysis')
    await emitProgress(queryId, 'ownership_analysis', 'started', { 
      hasWebResearch: !!webResearchData?.success,
      sourcesCount: webResearchData?.total_sources || 0
    })
    
    // Get current prompt version and build prompt using registry
    const promptVersion = getCurrentPromptVersion('OWNERSHIP_RESEARCH')
    const promptBuilder = getPromptBuilder('OWNERSHIP_RESEARCH', promptVersion)
    const researchPrompt = promptBuilder(product_name, brand, hints, webResearchData, queryAnalysis)
    
    analysisStage.reason(`Using prompt version: ${promptVersion}`, REASONING_TYPES.INFO)
    analysisStage.reason(`Analyzing ownership with ${webResearchData?.total_sources || 0} sources`, REASONING_TYPES.ANALYSIS)
    
    const ownership = await performOwnershipAnalysis(researchPrompt, product_name, brand, webResearchData)
    
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
    
    // Step 6: Enhanced Confidence Calculation
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
    
    // Step 7: Validation and Sanitization
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
    
    // Add detailed agent results
    validated.agent_execution_trace = traceLogger.toDatabaseFormat()
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
    
    // Step 8: Database Save
    const saveStage = new EnhancedStageTracker(traceLogger, 'database_save', 'Saving result to database')
    await emitProgress(queryId, 'database_save', 'started', { 
      beneficiary: validated.financial_beneficiary,
      confidence: validated.confidence_score
    })
    
    saveStage.reason('Saving research result to database', REASONING_TYPES.INFO)
    const productData = ownershipResultToProductData(barcode, product_name, brand, validated)
    const saveResult = await upsertProduct(productData)
    
    if (saveResult.success) {
      validated.product_id = saveResult.data.id
      saveStage.success({ product_id: saveResult.data.id }, ['Result saved to database successfully'])
      await emitProgress(queryId, 'database_save', 'success', { product_id: saveResult.data.id })
    } else {
      saveStage.error(new Error(saveResult.error), {}, ['Failed to save to database'])
      await emitProgress(queryId, 'database_save', 'error', null, saveResult.error)
    }
    
    // Set final result
    traceLogger.setFinalResult(validated.financial_beneficiary !== 'Unknown' ? 'success' : 'failure')
    
    console.log(`[EnhancedAgentOwnershipResearch] Research complete:`, validated)
    
    return validated
    
  } catch (error) {
    console.error('[EnhancedAgentOwnershipResearch] Research failed:', error)
    
    const errorStage = new EnhancedStageTracker(traceLogger, 'error_recovery', 'Error recovery and fallback response')
    errorStage.reason(`Research failed: ${error.message}`, REASONING_TYPES.ERROR)
    errorStage.error(error, {}, ['Research process encountered an error'])
    
    traceLogger.setFinalResult('error', error.message)
    
    // Create fallback response
    const fallbackResult = createFallbackResponse(brand, error.message)
    fallbackResult.agent_execution_trace = traceLogger.toDatabaseFormat()
    
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
  
  return validated
} 