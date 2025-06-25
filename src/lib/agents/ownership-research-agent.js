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

// Enhanced evaluation tracking system
const evaluationMetrics = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  ignoredViableSources: 0,
  usedWebResearch: 0,
  hallucinationDetected: 0,
  sourceQualityScores: [],
  confidenceAccuracy: [],
  responseTimes: [],
  failurePatterns: new Map(),
  sourceUsagePatterns: new Map(),
  // New metrics
  regionalAssumptions: 0,
  circularOwnership: 0,
  conflictingInformation: 0,
  lowQualitySources: 0,
  insufficientEvidence: 0,
  noCountryEvidence: 0,
  noStructureEvidence: 0,
  averageWarningsPerQuery: [],
  sourceTypes: new Map(),
  querySuccessBySource: new Map(),
  confidenceDistribution: new Map(),
  responseTimesByResult: {
    success: [],
    failure: []
  },
  // JSON parsing metrics
  jsonParseAttempts: 0,
  jsonParseSuccesses: 0,
  jsonParseFailures: 0,
  jsonParseStrategies: {
    direct: 0,
    cleaned: 0,
    fieldExtraction: 0,
    templateReconstruction: 0
  },
  jsonParseErrors: new Map(),
  retryAttempts: 0,
  fallbackResponses: 0,
  cachedResults: 0
}

/**
 * AgentOwnershipResearch - Performs web-based research to infer corporate ownership
 * @param {Object} params
 * @param {string} params.barcode - Product barcode
 * @param {string} params.product_name - Product name
 * @param {string} params.brand - Brand name
 * @param {Object} [params.hints] - Optional hints for research
 * @param {string} [params.hints.parent_company] - Known parent company
 * @param {string} [params.hints.country_of_origin] - Country of origin
 * @param {string} [params.hints.website_url] - Company website URL
 * @param {boolean} [params.enableEvaluation] - Enable detailed evaluation tracking
 * @returns {Promise<Object>} Ownership research results with evaluation data
 */
export async function AgentOwnershipResearch({
  barcode,
  product_name,
  brand,
  hints = {},
  enableEvaluation = false
}) {
  const startTime = Date.now()
  const queryId = generateQueryId()
  
  // Initialize execution trace
  const executionTrace = {
    query_id: queryId,
    start_time: new Date().toISOString(),
    brand,
    product_name,
    barcode,
    hints,
    stages: [],
    final_result: null,
    total_duration_ms: 0
  }
  
  console.log(`[AgentOwnershipResearch] Starting research for:`, { product_name, brand, hints })
  
  try {
    evaluationMetrics.totalQueries++
    
    // Step 0: Check existing product record (cached result)
    const cacheStage = {
      stage: 'cache_check',
      start_time: new Date().toISOString(),
      description: 'Checking for existing cached result'
    }
    executionTrace.stages.push(cacheStage)
    
    // Emit progress update
    await emitProgress(queryId, 'cache_check', 'started', { barcode })
    
    console.log(`[AgentOwnershipResearch] Checking existing product record for barcode: ${barcode}`)
    const existingProduct = await getProductByBarcode(barcode)
    
    if (existingProduct && existingProduct.financial_beneficiary && existingProduct.financial_beneficiary !== 'Unknown') {
      console.log(`[AgentOwnershipResearch] Found cached result for ${brand}`)
      
      cacheStage.result = 'hit'
      cacheStage.duration_ms = Date.now() - startTime
      cacheStage.data = {
        financial_beneficiary: existingProduct.financial_beneficiary,
        confidence_score: existingProduct.confidence_score,
        result_type: existingProduct.result_type
      }
      
      // Emit progress update
      await emitProgress(queryId, 'cache_check', 'success', cacheStage.data)
      
      // Convert cached product to result format
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
        // Add execution trace
        agent_execution_trace: executionTrace,
        initial_llm_confidence: existingProduct.initial_llm_confidence,
        agent_results: existingProduct.agent_results,
        fallback_reason: existingProduct.fallback_reason
      }
      
      executionTrace.final_result = 'cached'
      executionTrace.total_duration_ms = Date.now() - startTime
      
      // Track metrics
      const responseTime = Date.now() - startTime
      evaluationMetrics.responseTimes.push(responseTime)
      evaluationMetrics.successfulQueries++
      evaluationMetrics.responseTimesByResult.success.push(responseTime)
      evaluationMetrics.cachedResults++
      
      console.log(`[AgentOwnershipResearch] Cached result:`, cachedResult)
      
      // Log cached result to evaluation framework with timeout protection
      try {
        logAIResultToEvaluationFramework(cachedResult, executionTrace, {
          responseTime: responseTime
        }).catch(err => {
          console.warn('[AgentOwnershipResearch] Evaluation logging failed (non-blocking):', err.message)
        })
      } catch (err) {
        console.warn('[AgentOwnershipResearch] Evaluation logging error (non-blocking):', err.message)
      }
      
      return cachedResult
    }
    
    cacheStage.result = 'miss'
    cacheStage.duration_ms = Date.now() - startTime
    
    // Emit progress update
    await emitProgress(queryId, 'cache_check', 'completed', { result: 'miss' })
    
    // Step 1: Check static ownership mappings
    const staticMappingStage = {
      stage: 'static_mapping',
      start_time: new Date().toISOString(),
      description: 'Checking static ownership mappings'
    }
    executionTrace.stages.push(staticMappingStage)
    
    // Emit progress update
    await emitProgress(queryId, 'static_mapping', 'started', { brand })
    
    console.log(`[AgentOwnershipResearch] Checking static ownership mappings for: ${brand}`)
    const staticMapping = await lookupOwnershipMapping(brand)
    
    if (staticMapping) {
      console.log(`[AgentOwnershipResearch] Found static mapping for ${brand}`)
      
      staticMappingStage.result = 'hit'
      staticMappingStage.duration_ms = Date.now() - startTime
      staticMappingStage.data = {
        financial_beneficiary: staticMapping.financial_beneficiary,
        confidence_score: staticMapping.confidence_score || 95
      }
      
      // Emit progress update
      await emitProgress(queryId, 'static_mapping', 'success', staticMappingStage.data)
      
      const result = mappingToResult(staticMapping)
      
      // Add metadata
      result.beneficiary_flag = getCountryFlag(result.beneficiary_country)
      result.web_research_used = false
      result.web_sources_count = 0
      result.query_analysis_used = false
      result.static_mapping_used = true
      result.cached = false
      result.agent_execution_trace = executionTrace
      result.initial_llm_confidence = result.confidence_score
      result.agent_results = {
        static_mapping: {
          success: true,
          data: staticMapping,
          reasoning: 'Found in static ownership mappings database'
        }
      }
      
      executionTrace.final_result = 'static_mapping'
      executionTrace.total_duration_ms = Date.now() - startTime
      
      // Save to database
      const productData = ownershipResultToProductData(barcode, product_name, brand, result)
      await upsertProduct(productData)
      
      // Track metrics
      const responseTime = Date.now() - startTime
      evaluationMetrics.responseTimes.push(responseTime)
      evaluationMetrics.successfulQueries++
      evaluationMetrics.responseTimesByResult.success.push(responseTime)
      
      console.log(`[AgentOwnershipResearch] Static mapping result:`, result)
      
      // Log static mapping result to evaluation framework with timeout protection
      try {
        logAIResultToEvaluationFramework(result, executionTrace, {
          responseTime: responseTime
        }).catch(err => {
          console.warn('[AgentOwnershipResearch] Evaluation logging failed (non-blocking):', err.message)
        })
      } catch (err) {
        console.warn('[AgentOwnershipResearch] Evaluation logging error (non-blocking):', err.message)
      }
      
      return result
    }
    
    staticMappingStage.result = 'miss'
    staticMappingStage.duration_ms = Date.now() - startTime
    
    // Emit progress update
    await emitProgress(queryId, 'static_mapping', 'completed', { result: 'miss' })
    
    console.log(`[AgentOwnershipResearch] No static mapping found, proceeding with research`)
    
    // Step 2: Query Builder Analysis
    const queryBuilderStage = {
      stage: 'query_builder',
      start_time: new Date().toISOString(),
      description: 'Analyzing brand for optimal search queries'
    }
    executionTrace.stages.push(queryBuilderStage)
    
    // Emit progress update
    await emitProgress(queryId, 'query_builder', 'started', { brand })
    
    let queryAnalysis = null
    if (isQueryBuilderAvailable()) {
      try {
        console.log(`[AgentOwnershipResearch] Using query builder for: ${brand}`)
        queryAnalysis = await QueryBuilderAgent({
          brand,
          product_name,
          barcode,
          hints
        })
        
        queryBuilderStage.result = 'success'
        queryBuilderStage.duration_ms = Date.now() - startTime
        queryBuilderStage.data = {
          company_type: queryAnalysis.company_type,
          country_guess: queryAnalysis.country_guess,
          query_count: queryAnalysis.recommended_queries.length,
          flags: queryAnalysis.flags
        }
        
        // Emit progress update
        await emitProgress(queryId, 'query_builder', 'success', queryBuilderStage.data)
        
        console.log(`[AgentOwnershipResearch] Query analysis:`, {
          companyType: queryAnalysis.company_type,
          countryGuess: queryAnalysis.country_guess,
          queryCount: queryAnalysis.recommended_queries.length,
          flags: queryAnalysis.flags
        })
        
      } catch (error) {
        console.error('[AgentOwnershipResearch] Query builder failed:', error)
        queryBuilderStage.result = 'error'
        queryBuilderStage.duration_ms = Date.now() - startTime
        queryBuilderStage.error = error.message
        
        // Emit progress update
        await emitProgress(queryId, 'query_builder', 'error', null, error.message)
        // Continue without query builder
      }
    } else {
      console.log(`[AgentOwnershipResearch] Query builder not available, using default queries`)
      queryBuilderStage.result = 'not_available'
      queryBuilderStage.duration_ms = Date.now() - startTime
      
      // Emit progress update
      await emitProgress(queryId, 'query_builder', 'completed', { result: 'not_available' })
    }
    
    // Step 3: Web Research
    const webResearchStage = {
      stage: 'web_research',
      start_time: new Date().toISOString(),
      description: 'Performing web research for ownership information'
    }
    executionTrace.stages.push(webResearchStage)
    
    // Emit progress update
    await emitProgress(queryId, 'web_research', 'started', { brand, hasQueryAnalysis: !!queryAnalysis })
    
    let webResearchData = null
    if (isWebResearchAvailable()) {
      console.log(`[AgentOwnershipResearch] Performing actual web research...`)
      evaluationMetrics.usedWebResearch++
      
      try {
        webResearchData = await WebResearchAgent({
          brand,
          product_name,
          hints,
          queryAnalysis // Pass query analysis to web research agent
        })
        
        webResearchStage.result = 'success'
        webResearchStage.duration_ms = Date.now() - startTime
        webResearchStage.data = {
          success: webResearchData.success,
          total_sources: webResearchData.total_sources,
          search_results_count: webResearchData.search_results_count,
          scraped_sites_count: webResearchData.scraped_sites_count,
          findings_count: webResearchData.findings?.length || 0
        }
        
        // Emit progress update
        await emitProgress(queryId, 'web_research', 'success', webResearchStage.data)
        
        console.log(`[AgentOwnershipResearch] Web research results:`, {
          success: webResearchData.success,
          total_sources: webResearchData.total_sources,
          search_results_count: webResearchData.search_results_count,
          scraped_sites_count: webResearchData.scraped_sites_count
        })
        
      } catch (error) {
        console.error('[AgentOwnershipResearch] Web research failed:', error)
        webResearchData = { success: false, findings: [] }
        webResearchStage.result = 'error'
        webResearchStage.duration_ms = Date.now() - startTime
        webResearchStage.error = error.message
        
        // Emit progress update
        await emitProgress(queryId, 'web_research', 'error', null, error.message)
      }
    } else {
      console.log(`[AgentOwnershipResearch] Web research not available, using knowledge agent only`)
      evaluationMetrics.ignoredViableSources++
      webResearchStage.result = 'not_available'
      webResearchStage.duration_ms = Date.now() - startTime
      
      // Emit progress update
      await emitProgress(queryId, 'web_research', 'completed', { result: 'not_available' })
    }

    // Step 4: Ownership Analysis
    const ownershipAnalysisStage = {
      stage: 'ownership_analysis',
      start_time: new Date().toISOString(),
      description: 'Performing LLM-based ownership analysis'
    }
    executionTrace.stages.push(ownershipAnalysisStage)
    
    // Emit progress update
    await emitProgress(queryId, 'ownership_analysis', 'started', { 
      hasWebResearch: !!webResearchData?.success,
      sourcesCount: webResearchData?.total_sources || 0
    })
    
    // Get current prompt version and build prompt using registry
    const promptVersion = getCurrentPromptVersion('OWNERSHIP_RESEARCH')
    const promptBuilder = getPromptBuilder('OWNERSHIP_RESEARCH', promptVersion)
    const researchPrompt = promptBuilder(product_name, brand, hints, webResearchData, queryAnalysis)
    
    // Add prompt version to execution trace
    executionTrace.prompt_version = promptVersion
    
    const ownership = await performOwnershipAnalysis(researchPrompt, product_name, brand, webResearchData)
    
    ownershipAnalysisStage.result = 'success'
    ownershipAnalysisStage.duration_ms = Date.now() - startTime
    ownershipAnalysisStage.data = {
      confidence_score: ownership.confidence_score,
      financial_beneficiary: ownership.financial_beneficiary,
      beneficiary_country: ownership.beneficiary_country,
      sources_count: ownership.sources?.length || 0
    }
    
    // Emit progress update
    await emitProgress(queryId, 'ownership_analysis', 'success', ownershipAnalysisStage.data)
    
    // Step 5: Validation and Sanitization
    const validationStage = {
      stage: 'validation',
      start_time: new Date().toISOString(),
      description: 'Validating and sanitizing results'
    }
    executionTrace.stages.push(validationStage)
    
    // Emit progress update
    await emitProgress(queryId, 'validation', 'started', { initial_confidence: ownership.confidence_score })
    
    const validated = validateAndSanitizeResults(ownership, brand, webResearchData)
    
    validationStage.result = 'success'
    validationStage.duration_ms = Date.now() - startTime
    validationStage.data = {
      final_confidence_score: validated.confidence_score,
      warnings_count: validated.warnings?.length || 0,
      validation_passed: validated.financial_beneficiary !== 'Unknown'
    }
    
    // Emit progress update
    await emitProgress(queryId, 'validation', 'success', validationStage.data)
    
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
    validated.agent_execution_trace = executionTrace
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
        data: {
          total_sources: webResearchData.total_sources,
          findings_count: webResearchData.findings?.length || 0,
          search_results_count: webResearchData.search_results_count
        },
        reasoning: webResearchData.success ? 
          'Web research found relevant sources and extracted ownership information' :
          'Web research failed or returned no useful results'
      } : {
        success: false,
        reasoning: 'Web research not available'
      },
      ownership_analysis: {
        success: validated.financial_beneficiary !== 'Unknown',
        data: {
          initial_confidence: ownership.confidence_score,
          final_confidence: validated.confidence_score,
          sources_used: validated.sources?.length || 0
        },
        reasoning: validated.reasoning || 'LLM analyzed available information to determine ownership'
      }
    }
    
    // Determine fallback reason if applicable
    if (validated.confidence_score < 50) {
      validated.fallback_reason = 'Low confidence score - may need additional research'
    } else if (!webResearchData?.success) {
      validated.fallback_reason = 'Web research unavailable or failed'
    } else if (webResearchData.findings?.length === 0) {
      validated.fallback_reason = 'No web research findings available'
    }

    // Step 6: Save to database
    const saveStage = {
      stage: 'database_save',
      start_time: new Date().toISOString(),
      description: 'Saving result to database'
    }
    executionTrace.stages.push(saveStage)
    
    // Emit progress update
    await emitProgress(queryId, 'database_save', 'started', { 
      beneficiary: validated.financial_beneficiary,
      confidence: validated.confidence_score
    })
    
    console.log(`[AgentOwnershipResearch] Saving result to database`)
    const productData = ownershipResultToProductData(barcode, product_name, brand, validated)
    const saveResult = await upsertProduct(productData)
    
    if (saveResult.success) {
      console.log(`[AgentOwnershipResearch] Result saved to database`)
      validated.product_id = saveResult.data.id
      saveStage.result = 'success'
      saveStage.duration_ms = Date.now() - startTime
      
      // Emit progress update
      await emitProgress(queryId, 'database_save', 'success', { product_id: saveResult.data.id })
    } else {
      console.error(`[AgentOwnershipResearch] Failed to save to database:`, saveResult.error)
      saveStage.result = 'error'
      saveStage.duration_ms = Date.now() - startTime
      saveStage.error = saveResult.error
      
      // Emit progress update
      await emitProgress(queryId, 'database_save', 'error', null, saveResult.error)
    }

    // Step 7: Evaluation (if enabled)
    if (enableEvaluation) {
      const evaluationStage = {
        stage: 'evaluation',
        start_time: new Date().toISOString(),
        description: 'Running evaluation metrics'
      }
      executionTrace.stages.push(evaluationStage)
      
      // Emit progress update
      await emitProgress(queryId, 'evaluation', 'started')
      
      const evaluation = evaluateAgentBehavior(validated, webResearchData, brand, {
        queryAnalysis,
        startTime,
        queryId
      })
      validated.evaluation = evaluation
      
      evaluationStage.result = 'success'
      evaluationStage.duration_ms = Date.now() - startTime
      evaluationStage.data = {
        source_quality_score: evaluation.sourceQualityScore,
        warnings_count: evaluation.warnings?.length || 0
      }
      
      // Emit progress update
      await emitProgress(queryId, 'evaluation', 'success', evaluationStage.data)
    }

    // Step 8: Metrics Tracking
    const responseTime = Date.now() - startTime
    evaluationMetrics.responseTimes.push(responseTime)
    
    if (validated.financial_beneficiary !== 'Unknown') {
      evaluationMetrics.successfulQueries++
      evaluationMetrics.responseTimesByResult.success.push(responseTime)
      executionTrace.final_result = 'success'
    } else {
      evaluationMetrics.failedQueries++
      evaluationMetrics.responseTimesByResult.failure.push(responseTime)
      executionTrace.final_result = 'failure'
    }
    
    executionTrace.total_duration_ms = responseTime
    
    trackEvaluationMetrics(validated, webResearchData, queryAnalysis)

    console.log(`[AgentOwnershipResearch] Research complete:`, validated)
    
    // Log AI result to evaluation framework with timeout protection
    try {
      logAIResultToEvaluationFramework(validated, executionTrace, {
        overallScore: evaluationData.overallScore,
        warnings: evaluationData.warnings,
        sourceQualityScore: evaluationData.sourceQualityScore,
        hallucinationIndicators: evaluationData.hallucinationIndicators,
        responseTime: responseTime
      }).catch(err => {
        console.warn('[AgentOwnershipResearch] Evaluation logging failed (non-blocking):', err.message)
      })
    } catch (err) {
      console.warn('[AgentOwnershipResearch] Evaluation logging error (non-blocking):', err.message)
    }
    
    return validated

  } catch (error) {
    console.error('[AgentOwnershipResearch] Research failed:', error)
    
    const errorStage = {
      stage: 'error_recovery',
      start_time: new Date().toISOString(),
      description: 'Error recovery and fallback response',
      result: 'error',
      duration_ms: Date.now() - startTime,
      error: error.message
    }
    executionTrace.stages.push(errorStage)
    executionTrace.final_result = 'error'
    executionTrace.total_duration_ms = Date.now() - startTime
    
    const responseTime = Date.now() - startTime
    evaluationMetrics.failedQueries++
    evaluationMetrics.responseTimesByResult.failure.push(responseTime)
    
    return {
      financial_beneficiary: 'Unknown',
      beneficiary_country: 'Unknown',
      beneficiary_flag: '🏳️',
      ownership_structure_type: 'Unknown',
      confidence_score: 20,
      ownership_flow: [],
      sources: ['Error recovery'],
      reasoning: `Research failed: ${error.message}`,
      web_research_used: false,
      web_sources_count: 0,
      query_analysis_used: false,
      static_mapping_used: false,
      result_type: 'error',
      cached: false,
      error: error.message,
      agent_execution_trace: executionTrace,
      initial_llm_confidence: 20,
      agent_results: {
        error: {
          success: false,
          error: error.message,
          reasoning: 'Research process failed with error'
        }
      },
      fallback_reason: `Research failed: ${error.message}`
    }
  }
}

/**
 * Evaluates agent behavior and source usage patterns
 */
function evaluateAgentBehavior(validatedData, webResearchData, brand, evaluationData) {
  const evaluation = {
    sourceQualityScore: 0,
    viableSourcesIgnored: 0,
    sourceUsagePattern: [],
    hallucinationIndicators: [],
    warnings: []
  }

  // Evaluate source quality
  if (validatedData.sources && validatedData.sources.length > 0) {
    evaluation.sourceQualityScore = calculateSourceQualityScore(validatedData.sources, webResearchData)
  }

  // Check for ignored viable sources
  if (webResearchData && webResearchData.success && webResearchData.findings.length > 0) {
    const usedSources = validatedData.sources || []
    const availableSources = webResearchData.findings.map(f => f.url)
    
    const ignoredSources = availableSources.filter(source => 
      !usedSources.some(used => used.includes(source) || source.includes(used))
    )
    
    evaluation.viableSourcesIgnored = ignoredSources.length
    evaluation.sourceUsagePattern = {
      available: availableSources.length,
      used: usedSources.length,
      ignored: ignoredSources.length,
      ignoredUrls: ignoredSources
    }
  }

  // Detect hallucination indicators
  evaluation.hallucinationIndicators = detectHallucinationIndicators(validatedData, webResearchData)

  // Check for warnings
  const warnings = []
  if (validatedData.financial_beneficiary !== 'Unknown') {
    // Check for circular ownership
    if (validatedData.financial_beneficiary.toLowerCase() === brand.toLowerCase()) {
      warnings.push('Circular ownership detected')
      validatedData.confidence_score *= 0.5
    }
    
    // Check for regional assumptions
    if (implicitRegionalCheck(validatedData.reasoning)) {
      warnings.push('Regional assumption detected')
      validatedData.confidence_score *= 0.7
    }
    
    // Check source quality
    const sourceQualityScore = calculateSourceQualityScore(validatedData.sources, webResearchData)
    if (sourceQualityScore < 50) {
      warnings.push('Low quality sources')
      validatedData.confidence_score *= (sourceQualityScore / 100)
    }
    
    // Check for sufficient evidence
    if (!webResearchData || !webResearchData.findings || webResearchData.findings.length === 0) {
      warnings.push('No web research evidence')
      validatedData.confidence_score *= 0.6
    }
    
    // Check for conflicting information
    if (webResearchData?.findings) {
      const conflictingOwners = new Set()
      for (const finding of webResearchData.findings) {
        if (finding.owner && finding.owner !== validatedData.financial_beneficiary) {
          conflictingOwners.add(finding.owner)
        }
      }
      if (conflictingOwners.size > 0) {
        warnings.push('Conflicting ownership information found')
        validatedData.confidence_score *= (1 - (conflictingOwners.size * 0.2))
      }
    }
  }
  
  // Validate country
  if (validatedData.beneficiary_country !== 'Unknown') {
    // Check for country evidence
    let hasCountryEvidence = false
    if (webResearchData?.findings) {
      for (const finding of webResearchData.findings) {
        if (finding.country && finding.country === validatedData.beneficiary_country) {
          hasCountryEvidence = true
          break
        }
      }
    }
    if (!hasCountryEvidence) {
      warnings.push('No direct evidence for beneficiary country')
      validatedData.confidence_score *= 0.8
    }
  }
  
  // Validate ownership structure
  if (validatedData.ownership_structure_type !== 'Unknown') {
    // Check for structure evidence
    let hasStructureEvidence = false
    const structureKeywords = {
      'Public': ['publicly traded', 'listed company', 'stock exchange'],
      'Private': ['privately held', 'private company'],
      'Subsidiary': ['subsidiary', 'wholly owned', 'division of'],
      'Cooperative': ['cooperative', 'co-op', 'member-owned'],
      'State-owned': ['state-owned', 'government-owned', 'public sector', 'state enterprise']
    }
    
    const keywords = structureKeywords[validatedData.ownership_structure_type] || []
    if (webResearchData?.findings) {
      for (const finding of webResearchData.findings) {
        if (keywords.some(keyword => finding.content?.toLowerCase().includes(keyword))) {
          hasStructureEvidence = true
          break
        }
      }
    }
    if (!hasStructureEvidence) {
      warnings.push('No direct evidence for ownership structure type')
      validatedData.confidence_score *= 0.8
    }
  }
  
  // Final confidence adjustments
  validatedData.confidence_score = Math.max(20, Math.min(100, Math.round(validatedData.confidence_score)))
  
  // If too many warnings, mark as unknown
  if (warnings.length >= 3 || validatedData.confidence_score < 30) {
    validatedData.financial_beneficiary = 'Unknown'
    validatedData.beneficiary_country = 'Unknown'
    validatedData.ownership_structure_type = 'Unknown'
    validatedData.confidence_score = 20
  }
  
  // Add warnings to reasoning
  if (warnings.length > 0) {
    validatedData.reasoning += '\n\nWarnings:\n- ' + warnings.join('\n- ')
  }
  
  evaluation.warnings = warnings

  return evaluation
}

/**
 * Validates source credibility based on multiple factors
 */
function validateSourceCredibility(source, webResearchData = null) {
  const credibility = {
    score: 0,
    factors: [],
    warnings: []
  }
  
  if (!source || typeof source !== 'string') {
    credibility.warnings.push('Invalid source format')
    return credibility
  }
  
  const url = source.toLowerCase()
  
  // Domain credibility scoring
  if (url.includes('sec.gov')) {
    credibility.score += 100
    credibility.factors.push('SEC official source')
  } else if (url.includes('bloomberg.com') || url.includes('reuters.com')) {
    credibility.score += 90
    credibility.factors.push('Major financial news')
  } else if (url.includes('investor.') || url.includes('ir.')) {
    credibility.score += 85
    credibility.factors.push('Investor relations')
  } else if (url.includes('.gov')) {
    credibility.score += 85
    credibility.factors.push('Government source')
  } else if (url.includes('annualreport') || url.includes('annual-report')) {
    credibility.score += 80
    credibility.factors.push('Annual report')
  } else if (url.includes('opencorporates.com')) {
    credibility.score += 75
    credibility.factors.push('Business database')
  } else if (url.includes('wikipedia.org')) {
    credibility.score += 40
    credibility.factors.push('Wikipedia')
    credibility.warnings.push('Wikipedia requires verification')
  } else if (url.includes('reddit.com')) {
    credibility.score += 20
    credibility.factors.push('Social media')
    credibility.warnings.push('Social media source - low reliability')
  } else {
    credibility.score += 30
    credibility.factors.push('Unknown domain')
  }
  
  // Content analysis if available
  if (webResearchData && webResearchData.findings) {
    const matchingFinding = webResearchData.findings.find(finding => 
      finding.url && finding.url.toLowerCase() === url
    )
    
    if (matchingFinding) {
      const content = (matchingFinding.content || '').toLowerCase()
      const title = (matchingFinding.title || '').toLowerCase()
      
      // Positive content indicators
      if (content.includes('wholly owned subsidiary')) {
        credibility.score += 15
        credibility.factors.push('Direct ownership statement')
      }
      if (content.includes('parent company')) {
        credibility.score += 15
        credibility.factors.push('Parent company reference')
      }
      if (content.includes('sec filing') || content.includes('form 10-k')) {
        credibility.score += 20
        credibility.factors.push('SEC filing reference')
      }
      if (content.includes('annual report') || content.includes('financial report')) {
        credibility.score += 15
        credibility.factors.push('Financial report')
      }
      if (content.includes('press release')) {
        credibility.score += 10
        credibility.factors.push('Official press release')
      }
      
      // Negative content indicators
      if (content.includes('rumor') || content.includes('speculation')) {
        credibility.score -= 25
        credibility.warnings.push('Contains rumors or speculation')
      }
      if (content.includes('unconfirmed') || content.includes('unofficial')) {
        credibility.score -= 20
        credibility.warnings.push('Unconfirmed information')
      }
      if (content.includes('reportedly') || content.includes('sources say')) {
        credibility.score -= 15
        credibility.warnings.push('Second-hand information')
      }
      
      // Content length and quality
      if (content.length < 100) {
        credibility.score -= 10
        credibility.warnings.push('Very short content')
      } else if (content.length > 2000) {
        credibility.score += 5
        credibility.factors.push('Detailed content')
      }
    }
  }
  
  // Normalize score
  credibility.score = Math.max(0, Math.min(100, Math.round(credibility.score)))
  
  return credibility
}

/**
 * Calculates quality score for research sources
 */
function calculateSourceQualityScore(sources, webResearchData = null) {
  if (!sources || !Array.isArray(sources)) return 0
  
  let totalScore = 0
  let weightedCount = 0
  const sourceScores = []
  
  for (const source of sources) {
    if (!source || typeof source !== 'string') continue
    
    // Use the new credibility validation
    const credibility = validateSourceCredibility(source, webResearchData)
    let score = credibility.score
    
    // Source type tracking
    const sourceType = getSourceType(source)
    evaluationMetrics.sourceTypes.set(
      sourceType, 
      (evaluationMetrics.sourceTypes.get(sourceType) || 0) + 1
    )
    
    sourceScores.push({ 
      url: source, 
      score, 
      type: sourceType,
      credibility: credibility
    })
    totalScore += score
    weightedCount++
  }
  
  // Log source quality details for debugging
  if (sourceScores.length > 0) {
    console.log('[AgentOwnershipResearch] Source quality scores:', sourceScores.map(s => ({
      url: s.url.substring(0, 50) + '...',
      score: s.score,
      type: s.type,
      factors: s.credibility.factors,
      warnings: s.credibility.warnings
    })))
  }
  
  return weightedCount > 0 ? Math.round(totalScore / weightedCount) : 0
}

/**
 * Detects potential hallucination indicators
 */
function detectHallucinationIndicators(validatedData, webResearchData) {
  const indicators = []

  // Check for high confidence without good sources
  if (validatedData.confidence_score > 70 && (!validatedData.sources || validatedData.sources.length === 0)) {
    indicators.push('high_confidence_no_sources')
  }

  // Check for suspicious reasoning patterns
  const suspiciousPatterns = [
    /based on.*pattern/i,
    /likely.*owned/i,
    /probably.*subsidiary/i,
    /appears.*to be/i,
    /common.*industry/i,
    /typically.*owned/i,
    /usually.*owned/i,
    /most.*companies/i
  ]

  if (validatedData.reasoning) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(validatedData.reasoning)) {
        indicators.push('suspicious_reasoning_pattern')
        break
      }
    }
  }

  // Check for ignoring available web research
  if (webResearchData && webResearchData.success && webResearchData.findings.length > 0) {
    const usedWebData = webResearchData.findings.some(finding => 
      validatedData.reasoning && validatedData.reasoning.toLowerCase().includes(finding.url?.toLowerCase() || '')
    )
    
    if (!usedWebData && validatedData.financial_beneficiary !== 'Unknown') {
      indicators.push('ignored_web_research')
    }
  }

  // Check for generic sources with specific claims
  if (validatedData.financial_beneficiary !== 'Unknown') {
    const genericSources = ['Web research', 'AI analysis', 'Internet search', 'Online research']
    const hasSpecificSources = validatedData.sources && validatedData.sources.some(source => 
      !genericSources.includes(source)
    )
    
    if (!hasSpecificSources) {
      indicators.push('generic_sources_specific_claims')
    }
  }

  return indicators
}

/**
 * Tracks evaluation metrics for analysis
 */
function trackEvaluationMetrics(validatedData, webResearchData, queryAnalysis) {
  // Track source quality scores
  if (validatedData.sources && validatedData.sources.length > 0) {
    const sourceQualityScore = calculateSourceQualityScore(validatedData.sources, webResearchData)
    evaluationMetrics.sourceQualityScores.push(sourceQualityScore)
  }

  // Track ignored viable sources
  if (validatedData.financial_beneficiary === 'Unknown' || validatedData.confidence_score < 30) {
    evaluationMetrics.ignoredViableSources++
  }

  // Track hallucination detection
  if (validatedData.financial_beneficiary === 'Unknown' || validatedData.confidence_score < 30) {
    evaluationMetrics.hallucinationDetected++
  }

  // Track failure patterns
  if (validatedData.financial_beneficiary === 'Unknown' || validatedData.confidence_score < 30) {
    const failureType = validatedData.financial_beneficiary === 'Unknown' ? 'hallucination' : 'insufficient_data'
    const currentCount = evaluationMetrics.failurePatterns.get(failureType) || 0
    evaluationMetrics.failurePatterns.set(failureType, currentCount + 1)
  }

  // Track source usage patterns
  const patternKey = `${validatedData.sources?.length || 0}_${validatedData.sources?.length || 0}`
  const currentCount = evaluationMetrics.sourceUsagePatterns.get(patternKey) || 0
  evaluationMetrics.sourceUsagePatterns.set(patternKey, currentCount + 1)

  // Track warning types
  if (validatedData.sources) {
    for (const source of validatedData.sources) {
      if (!source || typeof source !== 'object') continue
      const sourceType = getSourceType(source.url)
      const currentCount = evaluationMetrics.sourceTypes.get(sourceType) || 0
      evaluationMetrics.sourceTypes.set(sourceType, currentCount + 1)

      // Track success rate by source type
      const key = `${sourceType}_${validatedData.financial_beneficiary !== 'Unknown' ? 'success' : 'failure'}`
      const successCount = evaluationMetrics.querySuccessBySource.get(key) || 0
      evaluationMetrics.querySuccessBySource.set(key, successCount + 1)
    }
  }

  // Track confidence distribution
  const confidenceBucket = Math.floor(validatedData.confidence_score / 10) * 10
  const currentConfCount = evaluationMetrics.confidenceDistribution.get(confidenceBucket) || 0
  evaluationMetrics.confidenceDistribution.set(confidenceBucket, currentConfCount + 1)

  // Track response times by result
  const responseTime = Date.now() - validatedData.startTime
  if (responseTime) {
    if (validatedData.financial_beneficiary !== 'Unknown' && validatedData.confidence_score >= 30) {
      evaluationMetrics.responseTimesByResult.success.push(responseTime)
    } else {
      evaluationMetrics.responseTimesByResult.failure.push(responseTime)
    }
  }

  // Track query analysis usage
  if (queryAnalysis) {
    evaluationMetrics.queryAnalysisUsed++
  }
}

/**
 * Generates a unique query ID for tracking
 */
export function generateQueryId() {
  return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Gets comprehensive evaluation metrics
 */
export function getEvaluationMetrics() {
  const totalQueries = evaluationMetrics.totalQueries
  const successfulQueries = evaluationMetrics.successfulQueries
  const failedQueries = evaluationMetrics.failedQueries
  
  // Calculate averages
  const avgResponseTime = evaluationMetrics.responseTimes.length > 0 
    ? Math.round(evaluationMetrics.responseTimes.reduce((a, b) => a + b, 0) / evaluationMetrics.responseTimes.length)
    : 0
    
  const avgSourceQuality = evaluationMetrics.sourceQualityScores.length > 0
    ? Math.round(evaluationMetrics.sourceQualityScores.reduce((a, b) => a + b, 0) / evaluationMetrics.sourceQualityScores.length)
    : 0
    
  const avgWarningsPerQuery = evaluationMetrics.averageWarningsPerQuery.length > 0
    ? Math.round(evaluationMetrics.averageWarningsPerQuery.reduce((a, b) => a + b, 0) / evaluationMetrics.averageWarningsPerQuery.length * 10) / 10
    : 0
  
  // JSON parsing statistics
  const jsonParseSuccessRate = evaluationMetrics.jsonParseAttempts > 0
    ? Math.round((evaluationMetrics.jsonParseSuccesses / evaluationMetrics.jsonParseAttempts) * 100)
    : 0
    
  const jsonParseFailureRate = evaluationMetrics.jsonParseAttempts > 0
    ? Math.round((evaluationMetrics.jsonParseFailures / evaluationMetrics.jsonParseAttempts) * 100)
    : 0
    
  const retryRate = evaluationMetrics.totalQueries > 0
    ? Math.round((evaluationMetrics.retryAttempts / evaluationMetrics.totalQueries) * 100)
    : 0
    
  const fallbackRate = evaluationMetrics.totalQueries > 0
    ? Math.round((evaluationMetrics.fallbackResponses / evaluationMetrics.totalQueries) * 100)
    : 0
  
  return {
    // Basic metrics
    totalQueries,
    successfulQueries,
    failedQueries,
    successRate: totalQueries > 0 ? Math.round((successfulQueries / totalQueries) * 100) : 0,
    
    // Performance metrics
    avgResponseTime,
    avgSourceQuality,
    ignoredViableSources: evaluationMetrics.ignoredViableSources,
    usedWebResearch: evaluationMetrics.usedWebResearch,
    
    // Warning metrics
    warningTypes: {
      regionalAssumptions: evaluationMetrics.regionalAssumptions,
      circularOwnership: evaluationMetrics.circularOwnership,
      conflictingInformation: evaluationMetrics.conflictingInformation,
      lowQualitySources: evaluationMetrics.lowQualitySources,
      insufficientEvidence: evaluationMetrics.insufficientEvidence,
      noCountryEvidence: evaluationMetrics.noCountryEvidence,
      noStructureEvidence: evaluationMetrics.noStructureEvidence
    },
    avgWarningsPerQuery,
    
    // JSON parsing metrics
    jsonParsing: {
      attempts: evaluationMetrics.jsonParseAttempts,
      successes: evaluationMetrics.jsonParseSuccesses,
      failures: evaluationMetrics.jsonParseFailures,
      successRate: jsonParseSuccessRate,
      failureRate: jsonParseFailureRate,
      strategies: evaluationMetrics.jsonParseStrategies,
      retryAttempts: evaluationMetrics.retryAttempts,
      retryRate: retryRate,
      fallbackResponses: evaluationMetrics.fallbackResponses,
      fallbackRate: fallbackRate,
      errorPatterns: Object.fromEntries(evaluationMetrics.jsonParseErrors)
    },
    
    // Source usage patterns
    sourceTypes: Object.fromEntries(evaluationMetrics.sourceTypes),
    querySuccessBySource: Object.fromEntries(evaluationMetrics.querySuccessBySource),
    confidenceDistribution: Object.fromEntries(evaluationMetrics.confidenceDistribution),
    
    // Response time breakdown
    responseTimesByResult: {
      success: evaluationMetrics.responseTimesByResult.success.length > 0 
        ? Math.round(evaluationMetrics.responseTimesByResult.success.reduce((a, b) => a + b, 0) / evaluationMetrics.responseTimesByResult.success.length)
        : 0,
      failure: evaluationMetrics.responseTimesByResult.failure.length > 0
        ? Math.round(evaluationMetrics.responseTimesByResult.failure.reduce((a, b) => a + b, 0) / evaluationMetrics.responseTimesByResult.failure.length)
        : 0
    },

    // Query analysis metrics
    queryAnalysisUsed: evaluationMetrics.queryAnalysisUsed,
    queryAnalysis: evaluationMetrics.queryAnalysis
  }
}

/**
 * Resets evaluation metrics (useful for testing)
 */
export function resetEvaluationMetrics() {
  evaluationMetrics.totalQueries = 0
  evaluationMetrics.successfulQueries = 0
  evaluationMetrics.failedQueries = 0
  evaluationMetrics.ignoredViableSources = 0
  evaluationMetrics.usedWebResearch = 0
  evaluationMetrics.hallucinationDetected = 0
  evaluationMetrics.sourceQualityScores = []
  evaluationMetrics.confidenceAccuracy = []
  evaluationMetrics.responseTimes = []
  evaluationMetrics.failurePatterns.clear()
  evaluationMetrics.sourceUsagePatterns.clear()
  evaluationMetrics.regionalAssumptions = 0
  evaluationMetrics.circularOwnership = 0
  evaluationMetrics.conflictingInformation = 0
  evaluationMetrics.lowQualitySources = 0
  evaluationMetrics.insufficientEvidence = 0
  evaluationMetrics.noCountryEvidence = 0
  evaluationMetrics.noStructureEvidence = 0
  evaluationMetrics.averageWarningsPerQuery = []
  evaluationMetrics.sourceTypes.clear()
  evaluationMetrics.querySuccessBySource.clear()
  evaluationMetrics.confidenceDistribution.clear()
  evaluationMetrics.responseTimesByResult.success = []
  evaluationMetrics.responseTimesByResult.failure = []
}

/**
 * Builds a comprehensive research prompt with web research data
 */
function buildResearchPrompt(product_name, brand, hints, webResearchData, queryAnalysis) {
  let prompt = `OBJECTIVE:
You are a corporate ownership researcher tasked with identifying the ultimate financial beneficiary of the brand "${brand}". Your goal is to establish clear, evidence-based ownership relationships while maintaining high accuracy and avoiding assumptions.

RESEARCH STRATEGY:
1. Primary Sources (Highest Priority):
   - SEC filings, annual reports, official regulatory documents
   - Company's own investor relations or corporate structure pages
   - Stock exchange listings and official business registries

2. Secondary Sources (Medium Priority):
   - Financial news from reputable sources (Bloomberg, Reuters, FT, WSJ)
   - Business databases (OpenCorporates, D&B, ZoomInfo)
   - Press releases about acquisitions, mergers, or ownership changes

3. Supporting Sources (Low Priority):
   - Industry analysis reports
   - Company history pages
   - News articles about company operations

ANALYSIS FRAMEWORK:
1. Ownership Structure:
   - Direct ownership: Who directly owns the brand?
   - Ultimate ownership: Follow the chain up to the ultimate beneficiary
   - Structure type: Public, Private, Subsidiary, Cooperative, or State-owned

2. Evidence Quality:
   - Direct statements of ownership (strongest)
   - Official documentation (very strong)
   - Recent financial news (strong)
   - Indirect references (weak)
   - Regional/market presence (not evidence of ownership)

3. Confidence Assessment:
   - Multiple high-quality sources (90-100%)
   - Single high-quality source (70-89%)
   - Multiple secondary sources (50-69%)
   - Single secondary source (30-49%)
   - Weak/unclear evidence (<30%)

PRODUCT CONTEXT:
- Brand: ${brand}
- Product: ${product_name}${hints.parent_company ? '\n- Known Parent Company: ' + hints.parent_company : ''}`

  // Add query analysis information if available
  if (queryAnalysis) {
    prompt += `\n\nQUERY ANALYSIS INSIGHTS:
- Inferred Company Type: ${queryAnalysis.company_type}
- Geographic Market: ${queryAnalysis.country_guess}
- Analysis Flags: ${queryAnalysis.flags.join(', ')}
- Analysis Reasoning: ${queryAnalysis.reasoning}

COMPANY TYPE-SPECIFIC GUIDANCE:
${getCompanyTypeGuidance(queryAnalysis.company_type)}`
  }

  prompt += `\n\nCRITICAL GUIDELINES:
1. Evidence-Based: Every ownership claim must be supported by specific evidence
2. Source Quality: Prioritize official and financial sources over general web content
3. Chain of Ownership: Map the complete ownership chain when possible
4. Uncertainty: Default to "Unknown" when evidence is insufficient
5. Regional Context: Use location only for finding relevant sources, never for assumptions
6. Time Sensitivity: Prefer recent sources, especially for ownership changes
7. Conflicting Data: Address and explain any contradictory information
8. Source Utilization: Use ALL available sources, especially high-quality ones
9. Specific Evidence: Quote or reference specific content from sources when making claims`

  if (webResearchData && webResearchData.success && webResearchData.findings.length > 0) {
    prompt += `\n\nWEB RESEARCH FINDINGS (${webResearchData.findings.length} sources available):`;
    
    // Sort findings by priority score for better presentation
    const sortedFindings = [...webResearchData.findings].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    
    sortedFindings.forEach((finding, index) => {
      const sourceType = getSourceType(finding.url)
      const priorityLevel = finding.priorityScore >= 15 ? 'HIGH' : finding.priorityScore >= 10 ? 'MEDIUM' : 'LOW'
      
      prompt += `\n\nSource ${index + 1} [${priorityLevel} Priority - ${sourceType.toUpperCase()}]: ${finding.url}`;
      prompt += `\nTitle: ${finding.title}`;
      prompt += `\nSnippet: ${finding.snippet}`;
      if (finding.content) {
        // Extract key ownership-related content
        const content = finding.content.toLowerCase()
        const ownershipKeywords = ['owned', 'subsidiary', 'parent', 'acquisition', 'merger', 'investor', 'corporate', 'structure', 'annual report', 'financial']
        const hasOwnershipContent = ownershipKeywords.some(keyword => content.includes(keyword))
        
        if (hasOwnershipContent) {
          prompt += `\nContent: ${finding.content.substring(0, 800)}...`;
        } else {
          prompt += `\nContent: ${finding.content.substring(0, 300)}...`;
        }
      }
    });
    
    prompt += `\n\nSOURCE ANALYSIS INSTRUCTIONS:
1. Start with HIGH priority sources first
2. Look for direct ownership statements in official documents
3. Cross-reference information across multiple sources
4. Pay special attention to sources marked as regulatory, financial_news, or company_official
5. Use specific quotes or references from the content when making claims
6. If sources conflict, explain the conflict and which source you trust more and why`;
  } else {
    prompt += `\n\nNo web research data available. Apply the research strategy using only verifiable information from your training data. Maintain high standards for evidence quality.`;
  }

  prompt += `\n\nOUTPUT REQUIREMENTS:
You must respond with a VALID JSON object containing ONLY the following fields:

{
  "financial_beneficiary": "Ultimate owner or Unknown",
  "beneficiary_country": "Country of owner or Unknown",
  "ownership_structure_type": "Public/Private/Subsidiary/Cooperative/State-owned/Unknown",
  "confidence_score": 0-100,
  "sources": ["array", "of", "specific", "sources"],
  "reasoning": "Clear explanation with evidence"
}

CRITICAL JSON FORMATTING RULES:
1. ALL keys must be in double quotes
2. ALL string values must be in double quotes
3. Numbers (confidence_score) must NOT be in quotes
4. Arrays must use square brackets []
5. NO trailing commas
6. NO comments or additional text outside the JSON object
7. NO line breaks within the JSON object

Example of VALID response format:
{
  "financial_beneficiary": "Unknown",
  "beneficiary_country": "Unknown",
  "ownership_structure_type": "Unknown",
  "confidence_score": 30,
  "sources": ["Web research", "AI analysis"],
  "reasoning": "No clear evidence found in available sources."
}`;

  return prompt;
}

/**
 * Gets company type-specific guidance for the research prompt
 */
function getCompanyTypeGuidance(companyType) {
  switch (companyType) {
    case 'Public':
      return `PUBLIC COMPANY RESEARCH STRATEGY:
- Focus on SEC filings, annual reports, and investor relations pages
- Look for stock exchange listings and regulatory filings
- Check for recent acquisitions, mergers, or ownership changes
- Verify through official company statements and financial reports
- High confidence can be given to official regulatory documents`
      
    case 'Private':
      return `PRIVATE COMPANY RESEARCH STRATEGY:
- Focus on news articles about acquisitions, investments, or ownership changes
- Look for press releases and official company statements
- Check business databases and corporate registries
- Be more cautious with confidence scores due to limited public information
- Cross-reference multiple sources for verification`
      
    case 'State-owned':
      return `STATE-OWNED COMPANY RESEARCH STRATEGY:
- Focus on government records, official statements, and regulatory filings
- Look for government ownership declarations and official documents
- Check for privatization announcements or ownership changes
- Verify through official government sources
- Be aware of complex ownership structures with multiple government entities`
      
    case 'Cooperative':
      return `COOPERATIVE RESEARCH STRATEGY:
- Focus on cooperative registries and member information
- Look for cooperative federation or association records
- Check for member-owned structure and governance documents
- Verify through official cooperative statements
- Be aware of regional cooperative structures and hierarchies`
      
    case 'Franchise':
      return `FRANCHISE RESEARCH STRATEGY:
- Focus on franchisor information and franchise disclosure documents
- Look for parent company ownership of the franchisor
- Check for franchise agreements and corporate structure
- Verify through official franchisor statements
- Be aware of complex franchise ownership structures`
      
    default:
      return `GENERAL RESEARCH STRATEGY:
- Use a balanced approach across all source types
- Focus on official documents and reputable news sources
- Cross-reference information from multiple sources
- Be conservative with confidence scores when evidence is limited
- Default to "Unknown" when evidence is insufficient`
  }
}

/**
 * Performs the actual ownership analysis using AI
 */
async function performOwnershipAnalysis(researchPrompt, product_name, brand, webResearchData) {
  const maxRetries = 3
  let attempt = 0
  
  while (attempt < maxRetries) {
    attempt++
    console.log(`[AgentOwnershipResearch] Attempt ${attempt}/${maxRetries} for JSON parsing`)
    
    if (attempt > 1) {
      evaluationMetrics.retryAttempts++
    }
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: `You are a methodical corporate ownership researcher with expertise in:
1. Corporate structures and ownership patterns
2. Financial and regulatory documentation
3. Business intelligence and company research
4. Source evaluation and verification

Your analytical approach:
1. Start with highest-quality sources (SEC, official records)
2. Build ownership chains from direct evidence
3. Cross-reference multiple sources when available
4. Evaluate source credibility and recency
5. Identify and resolve conflicting information
6. Maintain clear evidence standards

Your key principles:
1. Evidence-based: Every claim requires specific supporting evidence
2. Source hierarchy: Prioritize official/financial sources over general web content
3. Clarity: Explain ownership relationships clearly
4. Skepticism: Question assumptions and indirect evidence
5. Transparency: Acknowledge limitations and uncertainties
6. Precision: Distinguish between ownership and other relationships

When evidence is insufficient:
1. Default to "Unknown" rather than make assumptions
2. Explain what evidence is missing
3. Suggest what additional research might help
4. Be explicit about uncertainty

CRITICAL: You MUST respond with valid JSON only. No additional text before or after the JSON object.

Remember: Your goal is accurate ownership determination, not complete answers. It's better to acknowledge uncertainty than make unsupported claims.`,
        messages: [
          { role: 'user', content: researchPrompt }
        ]
      })
      
      const text = response.content?.[0]?.text || ''
      console.log(`[AgentOwnershipResearch] AI response (attempt ${attempt}):`, text.substring(0, 200) + '...')
      
      // Try multiple JSON extraction strategies
      const ownership = await parseJSONResponse(text, attempt)
      
      if (ownership && ownership.financial_beneficiary !== undefined) {
        console.log(`[AgentOwnershipResearch] JSON parsing successful on attempt ${attempt}`)
        return ownership
      } else {
        console.log(`[AgentOwnershipResearch] Invalid ownership data on attempt ${attempt}, retrying...`)
        if (attempt === maxRetries) {
          throw new Error('Failed to get valid ownership data after all retries')
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
      
    } catch (error) {
      console.error(`[AgentOwnershipResearch] Attempt ${attempt} failed:`, error.message)
      
      if (attempt === maxRetries) {
        console.error('[AgentOwnershipResearch] All retry attempts failed, returning fallback response')
        return createFallbackResponse(brand, error.message)
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}

/**
 * Enhanced JSON parsing with multiple strategies
 */
async function parseJSONResponse(text, attempt) {
  evaluationMetrics.jsonParseAttempts++
  
  const strategies = [
    // Strategy 1: Direct JSON parsing
    () => {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON object found')
      const result = JSON.parse(match[0])
      evaluationMetrics.jsonParseStrategies.direct++
      return result
    },
    
    // Strategy 2: Clean and parse
    () => {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON object found')
      
      let cleanedJson = match[0]
        .replace(/([a-zA-Z0-9_]+):/g, '"$1":') // Quote unquoted keys
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/,\s*,/g, ',') // Remove double commas
        .replace(/\[\s*,/g, '[') // Remove leading commas in arrays
        .replace(/,\s*\]/g, ']') // Remove trailing commas in arrays
        .replace(/{\s*,/g, '{') // Remove leading commas in objects
        .replace(/,\s*}/g, '}') // Remove trailing commas in objects
        .replace(/\\"/g, '"') // Fix escaped quotes
        .replace(/\\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
      
      const result = JSON.parse(cleanedJson)
      evaluationMetrics.jsonParseStrategies.cleaned++
      return result
    },
    
    // Strategy 3: Field extraction
    () => {
      const result = extractFieldsFromText(text)
      evaluationMetrics.jsonParseStrategies.fieldExtraction++
      return result
    },
    
    // Strategy 4: Template-based reconstruction
    () => {
      const result = reconstructFromTemplate(text)
      evaluationMetrics.jsonParseStrategies.templateReconstruction++
      return result
    }
  ]
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = strategies[i]()
      if (validateOwnershipData(result)) {
        console.log(`[AgentOwnershipResearch] Strategy ${i + 1} succeeded`)
        evaluationMetrics.jsonParseSuccesses++
        return result
      }
    } catch (error) {
      console.log(`[AgentOwnershipResearch] Strategy ${i + 1} failed:`, error.message)
      
      // Track error patterns
      const errorType = error.message.substring(0, 50)
      evaluationMetrics.jsonParseErrors.set(
        errorType, 
        (evaluationMetrics.jsonParseErrors.get(errorType) || 0) + 1
      )
    }
  }
  
  evaluationMetrics.jsonParseFailures++
  throw new Error('All JSON parsing strategies failed')
}

/**
 * Validate ownership data structure
 */
function validateOwnershipData(data) {
  if (!data || typeof data !== 'object') return false
  
  const requiredFields = ['financial_beneficiary', 'beneficiary_country', 'ownership_structure_type', 'confidence_score']
  const hasRequiredFields = requiredFields.every(field => data[field] !== undefined)
  
  if (!hasRequiredFields) return false
  
  // Validate confidence score
  if (typeof data.confidence_score !== 'number' || data.confidence_score < 0 || data.confidence_score > 100) {
    data.confidence_score = Math.max(0, Math.min(100, parseInt(data.confidence_score) || 30))
  }
  
  // Ensure string fields are strings
  data.financial_beneficiary = String(data.financial_beneficiary || 'Unknown')
  data.beneficiary_country = String(data.beneficiary_country || 'Unknown')
  data.ownership_structure_type = String(data.ownership_structure_type || 'Unknown')
  
  // Ensure arrays are arrays
  data.sources = Array.isArray(data.sources) ? data.sources : ['Web research', 'AI analysis']
  data.ownership_flow = Array.isArray(data.ownership_flow) ? data.ownership_flow : []
  
  // Ensure reasoning is a string
  data.reasoning = String(data.reasoning || '')
  
  return true
}

/**
 * Reconstruct JSON from template when parsing fails
 */
function reconstructFromTemplate(text) {
  const template = {
    financial_beneficiary: 'Unknown',
    beneficiary_country: 'Unknown',
    ownership_structure_type: 'Unknown',
    confidence_score: 30,
    sources: ['Web research', 'AI analysis'],
    reasoning: 'Unable to parse AI response',
    ownership_flow: []
  }
  
  // Try to extract any available information
  const beneficiaryMatch = text.match(/financial_beneficiary["\s]*:["\s]*([^",}\]]+)/i)
  if (beneficiaryMatch) {
    template.financial_beneficiary = beneficiaryMatch[1].trim()
  }
  
  const countryMatch = text.match(/beneficiary_country["\s]*:["\s]*([^",}\]]+)/i)
  if (countryMatch) {
    template.beneficiary_country = countryMatch[1].trim()
  }
  
  const structureMatch = text.match(/ownership_structure_type["\s]*:["\s]*([^",}\]]+)/i)
  if (structureMatch) {
    template.ownership_structure_type = structureMatch[1].trim()
  }
  
  const confidenceMatch = text.match(/confidence_score["\s]*:["\s]*(\d+)/i)
  if (confidenceMatch) {
    template.confidence_score = parseInt(confidenceMatch[1])
  }
  
  const reasoningMatch = text.match(/reasoning["\s]*:["\s]*([^"]+)/i)
  if (reasoningMatch) {
    template.reasoning = reasoningMatch[1].trim()
  }
  
  return template
}

/**
 * Create fallback response when all parsing attempts fail
 */
function createFallbackResponse(brand, errorMessage) {
  evaluationMetrics.fallbackResponses++
  console.error(`[AgentOwnershipResearch] Creating fallback response for ${brand}: ${errorMessage}`)
  
  return {
    financial_beneficiary: 'Unknown',
    beneficiary_country: 'Unknown',
    ownership_structure_type: 'Unknown',
    confidence_score: 20,
    sources: ['Error recovery'],
    reasoning: `Unable to determine ownership for ${brand}. JSON parsing failed: ${errorMessage}`,
    ownership_flow: [],
    parse_error: errorMessage
  }
}

/**
 * Validates and sanitizes ownership research results
 */
function validateAndSanitizeResults(ownershipData, brand, webResearchData) {
  const validated = { ...ownershipData }
  const warnings = []
  
  // Initialize required fields
  validated.financial_beneficiary = validated.financial_beneficiary || 'Unknown'
  validated.beneficiary_country = validated.beneficiary_country || 'Unknown'
  validated.ownership_structure_type = validated.ownership_structure_type || 'Unknown'
  validated.confidence_score = validated.confidence_score || 0
  validated.sources = validated.sources || []
  validated.reasoning = validated.reasoning || ''
  
  // Track evidence strength
  let evidenceStrength = {
    ownership: 0,
    country: 0,
    structure: 0
  }
  
  // Validate financial beneficiary
  if (validated.financial_beneficiary !== 'Unknown') {
    // Check for circular ownership
    if (validated.financial_beneficiary.toLowerCase() === brand.toLowerCase()) {
      warnings.push('Circular ownership detected')
      validated.confidence_score *= 0.5
    }
    
    // Check for regional assumptions
    if (implicitRegionalCheck(validated.reasoning)) {
      warnings.push('Regional assumption detected')
      validated.confidence_score *= 0.7
    }
    
    // Check source quality
    const sourceQualityScore = calculateSourceQualityScore(validated.sources, webResearchData)
    if (sourceQualityScore < 50) {
      warnings.push('Low quality sources')
      validated.confidence_score *= (sourceQualityScore / 100)
    }
    
    // Check for sufficient evidence
    if (!webResearchData || !webResearchData.findings || webResearchData.findings.length === 0) {
      warnings.push('No web research evidence')
      validated.confidence_score *= 0.6
    }
    
    // Check for conflicting information
    if (webResearchData?.findings) {
      const conflictingOwners = new Set()
      for (const finding of webResearchData.findings) {
        if (finding.owner && finding.owner !== validated.financial_beneficiary) {
          conflictingOwners.add(finding.owner)
        }
      }
      if (conflictingOwners.size > 0) {
        warnings.push('Conflicting ownership information found')
        validated.confidence_score *= (1 - (conflictingOwners.size * 0.2))
      }
    }

    // Evaluate evidence strength for ownership
    if (webResearchData?.findings) {
      for (const finding of webResearchData.findings) {
        const content = (finding.content || '').toLowerCase()
        const title = (finding.title || '').toLowerCase()
        const url = (finding.url || '').toLowerCase()
        
        // Strong evidence
        if (content.includes('owned by') || content.includes('subsidiary of') || 
            content.includes('division of') || content.includes('parent company')) {
          evidenceStrength.ownership += 2
        }
        
        // Official sources
        if (url.includes('gov') || url.includes('official') || 
            url.includes('investor') || url.includes('corporate')) {
          evidenceStrength.ownership += 2
        }
        
        // Financial sources
        if (url.includes('bloomberg') || url.includes('reuters') || 
            url.includes('ft.com') || url.includes('wsj.com')) {
          evidenceStrength.ownership += 1
        }
      }
    }
  }
  
  // Validate country
  if (validated.beneficiary_country !== 'Unknown') {
    let hasCountryEvidence = false
    if (webResearchData?.findings) {
      for (const finding of webResearchData.findings) {
        const content = (finding.content || '').toLowerCase()
        if (content.includes(validated.beneficiary_country.toLowerCase())) {
          hasCountryEvidence = true
          evidenceStrength.country += 1
          
          // Stronger evidence if country mentioned with ownership
          if (content.includes('headquartered') || content.includes('based in') ||
              content.includes('registered in')) {
            evidenceStrength.country += 1
          }
        }
      }
    }
    if (!hasCountryEvidence) {
      warnings.push('No direct evidence for beneficiary country')
      validated.confidence_score *= 0.8
    }
  }
  
  // Validate ownership structure
  if (validated.ownership_structure_type !== 'Unknown') {
    let hasStructureEvidence = false
    const structureKeywords = {
      'Public': ['publicly traded', 'listed company', 'stock exchange'],
      'Private': ['privately held', 'private company'],
      'Subsidiary': ['subsidiary', 'wholly owned', 'division of'],
      'Cooperative': ['cooperative', 'co-op', 'member-owned'],
      'State-owned': ['state-owned', 'government-owned', 'public sector', 'state enterprise']
    }
    
    const keywords = structureKeywords[validated.ownership_structure_type] || []
    if (webResearchData?.findings) {
      for (const finding of webResearchData.findings) {
        const content = (finding.content || '').toLowerCase()
        if (keywords.some(keyword => content.includes(keyword))) {
          hasStructureEvidence = true
          evidenceStrength.structure += 1
          
          // Additional points for official sources
          const url = (finding.url || '').toLowerCase()
          if (url.includes('gov') || url.includes('official') || 
              url.includes('investor') || url.includes('corporate')) {
            evidenceStrength.structure += 1
          }
        }
      }
    }
    if (!hasStructureEvidence) {
      warnings.push('No direct evidence for ownership structure type')
      validated.confidence_score *= 0.8
    }
  }
  
  // Adjust confidence based on evidence strength
  const totalEvidenceStrength = evidenceStrength.ownership + 
                              evidenceStrength.country + 
                              evidenceStrength.structure
  
  // Don't mark as Unknown if we have strong evidence, even with warnings
  if (totalEvidenceStrength >= 4 && validated.financial_beneficiary !== 'Unknown') {
    // Boost confidence based on evidence strength
    validated.confidence_score = Math.min(100, validated.confidence_score * (1 + (totalEvidenceStrength * 0.1)))
    
    // If we have strong evidence but low confidence, set a minimum
    if (validated.confidence_score < 50) {
      validated.confidence_score = 50 + (totalEvidenceStrength * 5)
    }
  } else if (warnings.length >= 3 || validated.confidence_score < 30) {
    // Only mark as Unknown if we have multiple warnings AND weak evidence
    validated.financial_beneficiary = 'Unknown'
    validated.beneficiary_country = 'Unknown'
    validated.ownership_structure_type = 'Unknown'
    validated.confidence_score = 20
  }
  
  // Final confidence adjustments
  validated.confidence_score = Math.max(20, Math.min(100, Math.round(validated.confidence_score)))
  
  // Add warnings to reasoning
  if (warnings.length > 0) {
    validated.reasoning += '\n\nWarnings:\n- ' + warnings.join('\n- ')
  }
  
  // Add evidence strength to reasoning
  if (totalEvidenceStrength > 0) {
    validated.reasoning += `\n\nEvidence Strength:\n` +
      `- Ownership Evidence: ${evidenceStrength.ownership}\n` +
      `- Country Evidence: ${evidenceStrength.country}\n` +
      `- Structure Evidence: ${evidenceStrength.structure}`
  }
  
  return validated
}

/**
 * Fallback method to extract fields from text when JSON parsing fails
 */
function extractFieldsFromText(text) {
  const result = {}
  
  // Extract financial_beneficiary
  const beneficiaryMatch = text.match(/financial_beneficiary["\s]*:["\s]*([^",}\]]+)/i)
  if (beneficiaryMatch) {
    result.financial_beneficiary = beneficiaryMatch[1].trim()
  }
  
  // Extract beneficiary_country
  const countryMatch = text.match(/beneficiary_country["\s]*:["\s]*([^",}\]]+)/i)
  if (countryMatch) {
    result.beneficiary_country = countryMatch[1].trim()
  }
  
  // Extract ownership_structure_type
  const structureMatch = text.match(/ownership_structure_type["\s]*:["\s]*([^",}\]]+)/i)
  if (structureMatch) {
    result.ownership_structure_type = structureMatch[1].trim()
  }
  
  // Extract confidence_score
  const confidenceMatch = text.match(/confidence_score["\s]*:["\s]*(\d+)/i)
  if (confidenceMatch) {
    result.confidence_score = parseInt(confidenceMatch[1])
  }
  
  // Extract reasoning
  const reasoningMatch = text.match(/reasoning["\s]*:["\s]*([^"]+)/i)
  if (reasoningMatch) {
    result.reasoning = reasoningMatch[1].trim()
  }
  
  // Extract sources (simplified)
  result.sources = ['Web research', 'AI analysis']
  
  // Extract ownership_flow (simplified)
  result.ownership_flow = []
  
  return result
}

/**
 * Helper function to get country flag emoji
 */
function getCountryFlag(country) {
  if (!country || country === 'Unknown') return '🏳️'
  
  const flagMap = {
    'Sweden': '🇸🇪',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Netherlands': '🇳🇱',
    'Switzerland': '🇨🇭',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Denmark': '🇩🇰',
    'Norway': '🇳🇴',
    'Finland': '🇫🇮',
    'South Korea': '🇰🇷',
    'Brazil': '🇧🇷',
    'India': '🇮🇳',
    'Mexico': '🇲🇽'
  }
  
  return flagMap[country] || '🏳️'
}

/**
 * Checks for implicit regional assumptions in reasoning
 */
function implicitRegionalCheck(reasoning) {
  if (!reasoning) return false
  const sentences = reasoning.split(/[.!?]+/)
  return sentences.some(sentence => {
    const hasRegionalTerm = /(?:region|country|nordic|scandinavian|market|stores|chain|retail)/i.test(sentence)
    const hasOwnershipClaim = /(?:owned|subsidiary|part of|division|unit|branch)/i.test(sentence)
    return hasRegionalTerm && hasOwnershipClaim
  })
}

/**
 * Helper to categorize source types
 */
function getSourceType(url) {
  if (!url) return 'unknown'
  url = url.toLowerCase()
  
  if (url.includes('sec.gov')) return 'regulatory'
  if (url.includes('bloomberg.com') || url.includes('reuters.com') || url.includes('ft.com') || url.includes('wsj.com')) return 'financial_news'
  if (url.includes('opencorporates.com') || url.includes('dnb.com') || url.includes('zoominfo.com')) return 'business_database'
  if (url.includes('gov')) return 'government'
  if (url.includes('investor.') || url.includes('about.') || url.includes('corporate.')) return 'company_official'
  if (url.includes('wikipedia.org')) return 'wikipedia'
  if (url.includes('facebook.com') || url.includes('twitter.com') || url.includes('instagram.com')) return 'social_media'
  return 'other'
} 

/**
 * Log AI result to evaluation framework with timeout protection
 */
async function logAIResultToEvaluationFramework(result, executionTrace, evaluationData = {}) {
  try {
    // Always log to evaluation framework (no longer conditional)
    if (!process.env.GOOGLE_SHEETS_EVALUATION_ID) {
      console.log('[AgentOwnershipResearch] No evaluation spreadsheet configured, skipping log')
      return
    }

    // Generate test ID from barcode or brand
    const testId = result.barcode ? `T${result.barcode.slice(-6)}` : `T${Date.now().toString().slice(-6)}`
    
    // Determine match result based on confidence and beneficiary
    const matchResult = result.financial_beneficiary !== 'Unknown' && result.confidence_score >= 50 ? 'pass' : 'fail'
    
    // Calculate explainability score based on reasoning quality
    const explainabilityScore = result.reasoning && result.reasoning.length > 100 ? 4 : 
                               result.reasoning && result.reasoning.length > 50 ? 3 : 
                               result.reasoning && result.reasoning.length > 20 ? 2 : 1

    // Map to existing sheet structure
    const evaluationResult = {
      test_id: testId,
      trace_id: executionTrace.query_id || `trace_${Date.now()}`,
      agent_version: 'v1.4.0', // Update version as needed
      actual_owner: result.financial_beneficiary || 'Unknown',
      actual_country: result.beneficiary_country || 'Unknown',
      actual_structure_type: result.ownership_structure_type || 'Unknown',
      confidence_score: result.confidence_score || 0,
      match_result: matchResult,
      latency: (executionTrace.total_duration_ms / 1000).toFixed(1), // Convert to seconds
      token_cost_estimate: Math.round((executionTrace.total_duration_ms / 1000) * 50), // Rough estimate
      tool_errors: result.error || '',
      explainability_score: explainabilityScore,
      source_used: result.sources?.join(', ') || 'AI analysis',
      prompt_snapshot: `Research ownership of ${result.brand || 'brand'} product`,
      response_snippet: result.reasoning?.substring(0, 200) || 'No reasoning provided'
    }

    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Evaluation logging timeout')), 5000) // 5 second timeout
    })
    
    await Promise.race([
      adaptedEvaluationFramework.addEvaluationResult(evaluationResult),
      timeoutPromise
    ])
    
    console.log(`[AgentOwnershipResearch] Logged evaluation result for test: ${testId}`)
  } catch (error) {
    console.warn('[AgentOwnershipResearch] Failed to log evaluation result (non-blocking):', error.message)
    // Don't throw - this is optional logging
  }
} 