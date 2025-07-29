/**
 * Agentic Web Research Agent
 * Uses LLM-guided search and analysis for corporate ownership research
 * 
 * Key Features:
 * - LLM-guided search query generation and refinement
 * - Intelligent source evaluation and prioritization
 * - LLM-powered content analysis and ownership extraction
 * - Multi-step reasoning with intermediate conclusions
 * - Structured output with confidence scoring
 */

import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

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

// Cost management configuration
const COST_CONFIG = {
  max_queries: parseInt(process.env.AGENTIC_MAX_QUERIES) || 8, // Limit queries to control cost
  max_tokens_per_query: parseInt(process.env.AGENTIC_MAX_TOKENS_PER_QUERY) || 1500,
  max_tokens_per_analysis: parseInt(process.env.AGENTIC_MAX_TOKENS_PER_ANALYSIS) || 2000,
  max_tokens_per_reasoning: parseInt(process.env.AGENTIC_MAX_TOKENS_PER_REASONING) || 2500,
  max_total_tokens: parseInt(process.env.AGENTIC_MAX_TOTAL_TOKENS) || 10000, // Overall token limit
  cost_estimate_per_query: 0.003, // Estimated cost per query in USD
  max_cost_per_request: parseFloat(process.env.AGENTIC_MAX_COST_PER_REQUEST) || 0.10 // Max $0.10 per request
}

/**
 * Agentic Web Research Agent
 * @param {Object} params
 * @param {string} params.brand - Brand name to research
 * @param {string} params.product_name - Product name (optional)
 * @param {Object} [params.hints] - Optional hints for research
 * @param {string} [params.hints.country_of_origin] - Country of origin
 * @param {string} [params.hints.website_url] - Known company website URL
 * @param {Object} [params.queryAnalysis] - Query analysis object
 * @returns {Promise<Object>} Agentic web research results
 */
export async function AgenticWebResearchAgent({
  brand,
  product_name,
  hints = {},
  queryAnalysis = null
}) {
  const startTime = Date.now()
  console.log('[AgentLog] Starting: AgenticWebResearchAgent')
  console.time('[AgentTimer] AgenticWebResearchAgent')
  
  const debugMode = queryAnalysis?.debugMode || false
  const contextUsed = queryAnalysis?.contextUsed || false
  
  console.log('[AgenticWebResearchAgent] Starting agentic research for:', { 
    brand, 
    product_name, 
    hints,
    debugMode,
    contextUsed
  })
  
  try {
    // Step 1: LLM-guided search strategy planning
    const searchStrategy = await planSearchStrategy(brand, product_name, hints)
    console.log('[AgenticWebResearchAgent] Search strategy planned:', searchStrategy.strategy)
    
    // Step 2: Generate and refine search queries using LLM (with cost limits)
    const refinedQueries = await generateRefinedQueries(brand, product_name, hints, searchStrategy)
    console.log(`[AgenticWebResearchAgent] Generated ${refinedQueries.length} refined queries (max: ${COST_CONFIG.max_queries})`)
    
    // Step 3: Execute searches with intelligent prioritization and retry logic
    console.log('[AgenticWebResearchAgent] 🔍 Executing intelligent searches with retry logic...')
    const { searchResults, queries_executed, validSourcesFound } = await executeIntelligentSearchesWithRetry(refinedQueries, brand, hints, debugMode)
    console.log(`[AgenticWebResearchAgent] ✅ Found ${validSourcesFound} valid sources`)
    
    if (debugMode) {
      console.log('[AgenticWebResearchAgent] 📊 Search execution details:', {
        queries_executed: queries_executed.length,
        queries_with_results: queries_executed.filter(q => searchResults.some(r => r.query === q)).length,
        total_pages_fetched: searchResults.reduce((sum, r) => sum + (r.results?.length || 0), 0)
      })
    }
    
    // Step 4: LLM-powered source evaluation and content analysis
    console.log('[AgenticWebResearchAgent] 🔍 Analyzing sources with LLM...')
    const analyzedSources = await analyzeSourcesWithLLM(searchResults, brand, hints)
    console.log(`[AgenticWebResearchAgent] ✅ Analyzed ${analyzedSources.length} sources`)
    
    // Step 5: Multi-step reasoning for ownership determination
    const ownershipAnalysis = await performMultiStepReasoning(analyzedSources, brand, product_name, hints)
    console.log('[AgenticWebResearchAgent] Multi-step reasoning completed')
    
    // Step 6: Compile final results with confidence scoring
    const results = compileAgenticResults(ownershipAnalysis, searchResults, analyzedSources)
    
    const duration = Date.now() - startTime
    console.log('[AgenticWebResearchAgent] Research complete:', {
      success: results.success,
      sources: results.sources.length,
      findings: results.findings.length,
      confidence: results.confidence,
      reasoning_steps: results.reasoning_steps?.length || 0
    })
    
    console.log(`[AgentLog] Completed: AgenticWebResearchAgent (${duration}ms)`)
    console.timeEnd('[AgentTimer] AgenticWebResearchAgent')
    
    return results
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[AgenticWebResearchAgent] Research failed:', error)
    console.log(`[AgentLog] Error in AgenticWebResearchAgent (${duration}ms):`, error.message)
    console.timeEnd('[AgentTimer] AgenticWebResearchAgent')
    
    return {
      success: false,
      sources: [],
      findings: [],
      confidence: 0,
      error: error.message,
      research_method: 'agentic_web_research'
    }
  }
}

/**
 * Plan search strategy using LLM
 */
async function planSearchStrategy(brand, product_name, hints) {
  const systemPrompt = `You are an expert corporate research strategist. Your task is to plan a comprehensive search strategy for finding ownership information about a brand.

CRITICAL REQUIREMENTS:
1. Consider multiple search approaches (direct company info, news articles, financial filings, etc.)
2. Plan for both current and historical ownership information
3. Account for potential name variations and subsidiaries
4. Consider regional and industry-specific sources
5. Plan for verification and cross-referencing

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "strategy": "brief description of overall approach",
  "search_phases": [
    {
      "phase": "phase name",
      "focus": "what to look for",
      "sources": ["source types"],
      "priority": 1-5
    }
  ],
  "verification_plan": "how to verify findings",
  "potential_challenges": ["list of challenges"]
}`

  const userPrompt = `Plan a search strategy for finding ownership information about:
Brand: ${brand}
Product: ${product_name || 'N/A'}
Country of Origin: ${hints.country_of_origin || 'Unknown'}
Known Website: ${hints.website_url || 'None'}

Focus on finding current ownership structure and any recent changes.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: COST_CONFIG.max_tokens_per_query,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const strategyText = response.content[0].text
    return JSON.parse(strategyText)
  } catch (error) {
    console.error('[AgenticWebResearchAgent] Strategy planning failed:', error)
    return {
      strategy: 'comprehensive ownership research',
      search_phases: [
        {
          phase: 'primary',
          focus: 'current ownership',
          sources: ['company websites', 'financial filings', 'news articles'],
          priority: 5
        }
      ],
      verification_plan: 'cross-reference multiple sources',
      potential_challenges: ['outdated information', 'complex ownership structures']
    }
  }
}

/**
 * Generate refined search queries using LLM
 */
async function generateRefinedQueries(brand, product_name, hints, searchStrategy) {
  const systemPrompt = `You are an expert search query generator for corporate ownership research. Generate specific, effective search queries to find ownership information.

CRITICAL REQUIREMENTS:
1. Generate queries that will find current ownership information
2. Include variations for different search engines and databases
3. Use specific terms that indicate ownership (parent company, subsidiary, acquired by, etc.)
4. Consider regional variations and industry-specific terms
5. Generate 8-12 high-quality queries

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "queries": [
    {
      "query": "exact search query",
      "purpose": "what this query aims to find",
      "priority": 1-5,
      "expected_sources": ["types of sources this should find"]
    }
  ]
}`

  // Detect language for multi-language query generation
  const detectedLanguage = detectLanguage(brand, hints)
  
  const userPrompt = `Generate refined search queries for finding ownership information about:
Brand: ${brand}
Product: ${product_name || 'N/A'}
Country: ${hints.country_of_origin || 'Unknown'}
Website: ${hints.website_url || 'None'}
Detected Language: ${detectedLanguage}

Search Strategy: ${searchStrategy.strategy}

IMPORTANT: Generate queries in both English AND the detected language (${detectedLanguage}) if it's not English. This is critical for global brand research.

Focus on queries that will find current, accurate ownership information.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: COST_CONFIG.max_tokens_per_query,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const queriesText = response.content[0].text
    const parsed = JSON.parse(queriesText)
    const queries = parsed.queries || []
    
    // Limit queries to control cost
    const limitedQueries = queries.slice(0, COST_CONFIG.max_queries)
    if (queries.length > COST_CONFIG.max_queries) {
      console.log(`[AgenticWebResearchAgent] Limited queries from ${queries.length} to ${COST_CONFIG.max_queries} for cost control`)
    }
    
    return limitedQueries
  } catch (error) {
    console.error('[AgenticWebResearchAgent] Query generation failed:', error)
    return [
      {
        query: `"${brand}" parent company ownership`,
        purpose: 'find parent company information',
        priority: 5,
        expected_sources: ['company websites', 'financial news']
      },
      {
        query: `"${brand}" acquired by`,
        purpose: 'find acquisition information',
        priority: 4,
        expected_sources: ['news articles', 'financial filings']
      }
    ]
  }
}

/**
 * Execute intelligent searches (simulated for now)
 */
async function executeIntelligentSearches(queries, brand, hints) {
  // This would integrate with actual search APIs
  // For now, we'll simulate the search results
  console.log('[AgenticWebResearchAgent] Simulating intelligent searches...')
  
  const searchResults = []
  for (const query of queries.slice(0, 5)) { // Limit to 5 queries for demo
    searchResults.push({
      query: query.query,
      purpose: query.purpose,
      priority: query.priority,
      results: [
        {
          title: `Sample result for ${brand}`,
          url: `https://example.com/${brand.toLowerCase()}`,
          snippet: `Information about ${brand} ownership structure`,
          relevance_score: 0.8
        }
      ]
    })
  }
  
  return searchResults
}

/**
 * Execute intelligent searches with retry logic and enhanced logging
 */
async function executeIntelligentSearchesWithRetry(queries, brand, hints, debugMode = false) {
  console.log('[AgenticWebResearchAgent] 🔄 Starting intelligent searches with retry logic...')
  
  const searchResults = []
  let validSourcesFound = 0
  let queriesExecuted = 0
  let queries_executed = [] // FIXED: Initialize queries_executed array
  
  for (const query of queries.slice(0, COST_CONFIG.max_queries)) {
    queriesExecuted++
    queries_executed.push(query.query) // FIXED: Track each query executed
    
    if (debugMode) {
      console.log(`[AgenticWebResearchAgent] 📝 Executing query ${queriesExecuted}/${Math.min(queries.length, COST_CONFIG.max_queries)}: "${query.query}"`)
    }
    
    try {
      // Execute the search with timeout and retry
      const searchResult = await executeWithTimeoutAndRetry(query.query, brand, hints)
      
      if (searchResult && searchResult.results && searchResult.results.length > 0) {
        validSourcesFound += searchResult.results.length
        searchResults.push(searchResult)
        
        if (debugMode) {
          console.log(`[AgenticWebResearchAgent] ✅ Query "${query.query}" found ${searchResult.results.length} results`)
        }
        
        // Early exit if we have enough sources
        if (validSourcesFound >= 3) {
          if (debugMode) {
            console.log(`[AgenticWebResearchAgent] 🎯 Early exit: Found ${validSourcesFound} sources`)
          }
          break
        }
      } else {
        if (debugMode) {
          console.log(`[AgenticWebResearchAgent] ⚠️ Query "${query.query}" returned no results`)
        }
      }
      
      // Try alternate query if original failed
      if (query.alternate && (!searchResult || searchResult.results.length === 0)) {
        queries_executed.push(query.alternate) // FIXED: Track alternate queries too
        
        if (debugMode) {
          console.log(`[AgenticWebResearchAgent] 🔄 Trying alternate query: "${query.alternate}"`)
        }
        
        const alternateResult = await executeWithTimeoutAndRetry(query.alternate, brand, hints)
        
        if (alternateResult && alternateResult.results && alternateResult.results.length > 0) {
          validSourcesFound += alternateResult.results.length
          searchResults.push(alternateResult)
          
          if (debugMode) {
            console.log(`[AgenticWebResearchAgent] ✅ Alternate query found ${alternateResult.results.length} results`)
          }
        }
      }
      
      // Try repaired query if both original and alternate failed
      if (query.repaired && (!searchResult || searchResult.results.length === 0) && 
          (!query.alternate || !alternateResult || alternateResult.results.length === 0)) {
        queries_executed.push(query.repaired) // FIXED: Track repaired queries too
        
        if (debugMode) {
          console.log(`[AgenticWebResearchAgent] 🔧 Trying repaired query: "${query.repaired}"`)
        }
        
        const repairedResult = await executeWithTimeoutAndRetry(query.repaired, brand, hints)
        
        if (repairedResult && repairedResult.results && repairedResult.results.length > 0) {
          validSourcesFound += repairedResult.results.length
          searchResults.push(repairedResult)
          
          if (debugMode) {
            console.log(`[AgenticWebResearchAgent] ✅ Repaired query found ${repairedResult.results.length} results`)
          }
        }
      }
      
    } catch (error) {
      console.error(`[AgenticWebResearchAgent] ❌ Error executing query "${query.query}":`, error.message)
    }
  }
  
  if (debugMode) {
    console.log('[AgenticWebResearchAgent] 📊 Search execution summary:', {
      queries_executed: queries_executed.length, // FIXED: Use the tracked array length
      valid_sources_found: validSourcesFound,
      successful_queries: searchResults.length,
      early_exit: validSourcesFound >= 3,
      executed_queries: queries_executed // FIXED: Include the actual queries executed
    })
  }
  
  return {
    searchResults,
    queries_executed,
    validSourcesFound,
    queriesExecuted
  }
}

/**
 * Execute a single search query
 */
async function executeSingleSearch(query, brand, hints) {
  // Simulated search execution
  return {
    query: query.query,
    purpose: query.purpose,
    priority: query.priority,
    results: [
      {
        title: `Sample result for ${brand}`,
        url: `https://example.com/${brand.toLowerCase()}`,
        snippet: `Information about ${brand} ownership structure`,
        relevance_score: 0.8
      }
    ]
  }
}

/**
 * Try alternate query variations with legal suffixes
 */
async function tryAlternateQueryVariations(originalQuery, brand, hints) {
  const legalSuffixes = hints.likely_entity_suffixes || ['A/S', 'GmbH', 'SARL', 'Ltd', 'Inc']
  const alternateQueries = []
  
  for (const suffix of legalSuffixes) {
    alternateQueries.push({
      query: `${originalQuery.query} ${suffix}`,
      purpose: `${originalQuery.purpose} with legal suffix`,
      priority: originalQuery.priority - 1
    })
  }
  
  // Try the first alternate query
  if (alternateQueries.length > 0) {
    return await executeSingleSearch(alternateQueries[0], brand, hints)
  }
  
  return { query: originalQuery.query, purpose: originalQuery.purpose, priority: originalQuery.priority, results: [] }
}

/**
 * Retry with JSON repair for parsing failures
 */
async function retryWithJSONRepair(query, brand, hints) {
  console.log('[AgenticWebResearchAgent] 🔧 Retrying with JSON repair...')
  
  // Simulate JSON repair retry
  return {
    query: query.query,
    purpose: `${query.purpose} (JSON repaired)`,
    priority: query.priority,
    results: [
      {
        title: `Repaired result for ${brand}`,
        url: `https://example.com/${brand.toLowerCase()}/repaired`,
        snippet: `Repaired information about ${brand} ownership structure`,
        relevance_score: 0.7
      }
    ]
  }
}

/**
 * Analyze sources with LLM
 */
async function analyzeSourcesWithLLM(searchResults, brand, hints) {
  const systemPrompt = `You are an expert corporate analyst. Analyze search results to extract ownership information.

CRITICAL REQUIREMENTS:
1. Extract only explicit ownership information
2. Evaluate source credibility and recency
3. Identify potential conflicts or outdated information
4. Assess confidence level for each finding
5. Look for verification opportunities

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "analyzed_sources": [
    {
      "url": "source URL",
      "title": "page title",
      "ownership_info": "extracted ownership information",
      "confidence": 0.0-1.0,
      "source_credibility": "high|medium|low",
      "verification_needed": true/false,
      "notes": "analysis notes"
    }
  ]
}`

  const userPrompt = `Analyze these search results for ownership information about ${brand}:

${JSON.stringify(searchResults, null, 2)}

Focus on finding current, accurate ownership information.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: COST_CONFIG.max_tokens_per_analysis,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const analysisText = response.content[0].text
    const parsed = JSON.parse(analysisText)
    return parsed.analyzed_sources || []
  } catch (error) {
    console.error('[AgenticWebResearchAgent] Source analysis failed:', error)
    return []
  }
}

/**
 * Perform multi-step reasoning for ownership determination with disambiguation
 */
async function performMultiStepReasoning(analyzedSources, brand, product_name, hints) {
  const systemPrompt = `You are an expert corporate ownership analyst. Perform multi-step reasoning to determine the current ownership structure, with special attention to disambiguating between similar companies.

CRITICAL REQUIREMENTS:
1. Evaluate all available evidence systematically
2. Resolve conflicts between sources
3. Consider recency and credibility
4. Build a logical ownership chain
5. Assess overall confidence
6. Handle multiple companies with similar names through disambiguation
7. Provide alternatives when ambiguity exists

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "ownership_chain": [
    {
      "name": "company name",
      "role": "Brand|Parent|Ultimate Owner",
      "country": "country", 
      "confidence": 0.0-1.0,
      "sources": [
        {
          "url": "source URL",
          "title": "source title",
          "date": "YYYY-MM-DD",
          "tier": 1-4,
          "confidence": 0.0-1.0
        }
      ]
    }
  ],
  "alternatives": [
    {
      "name": "alternative company name",
      "role": "Brand|Parent|Ultimate Owner",
      "country": "country",
      "confidence": 0.0-1.0,
      "reason": "why this alternative was considered",
      "sources": ["supporting sources"]
    }
  ],
  "reasoning_steps": [
    {
      "step": "step description",
      "conclusion": "what was determined",
      "confidence": 0.0-1.0,
      "evidence": ["supporting evidence"]
    }
  ],
  "overall_confidence": 0.0-1.0,
  "verification_status": "verified|needs_verification|uncertain",
  "confidence_explanation": "detailed explanation of confidence level",
  "disambiguation_notes": "notes about disambiguation process",
  "notes": "optional notes about findings"
}`

  const userPrompt = `Perform multi-step reasoning to determine ownership for:
Brand: ${brand}
Product: ${product_name || 'N/A'}

Analyzed Sources:
${JSON.stringify(analyzedSources, null, 2)}

Build a logical ownership chain and explain your reasoning.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: COST_CONFIG.max_tokens_per_reasoning,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const reasoningText = response.content[0].text
    return JSON.parse(reasoningText)
  } catch (error) {
    console.error('[AgenticWebResearchAgent] Multi-step reasoning failed:', error)
    return {
      ownership_chain: [],
      reasoning_steps: [],
      overall_confidence: 0,
      verification_status: 'uncertain'
    }
  }
}

/**
 * Detect language from brand name and hints
 */
function detectLanguage(brand, hints) {
  // Enhanced language detection for global brands
  const chineseRegex = /[\u4e00-\u9fff]/
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/
  const koreanRegex = /[\uac00-\ud7af]/
  const arabicRegex = /[\u0600-\u06ff]/
  const cyrillicRegex = /[\u0400-\u04ff]/
  const hindiRegex = /[\u0900-\u097f]/
  const thaiRegex = /[\u0e00-\u0e7f]/
  
  if (chineseRegex.test(brand)) return 'zh'
  if (japaneseRegex.test(brand)) return 'ja'
  if (koreanRegex.test(brand)) return 'ko'
  if (arabicRegex.test(brand)) return 'ar'
  if (cyrillicRegex.test(brand)) return 'ru'
  if (hindiRegex.test(brand)) return 'hi'
  if (thaiRegex.test(brand)) return 'th'
  
  // Check hints for language preference
  if (hints.language) return hints.language
  
  return 'en' // Default to English
}

/**
 * Compile final agentic results with enhanced fields
 */
function compileAgenticResults(ownershipAnalysis, searchResults, analyzedSources) {
  return {
    success: ownershipAnalysis.ownership_chain.length > 0,
    sources: analyzedSources.map(s => s.url),
    findings: ownershipAnalysis.ownership_chain,
    alternatives: ownershipAnalysis.alternatives || [],
    confidence: ownershipAnalysis.overall_confidence,
    confidence_explanation: ownershipAnalysis.confidence_explanation || '',
    reasoning_steps: ownershipAnalysis.reasoning_steps,
    verification_status: ownershipAnalysis.verification_status,
    disambiguation_notes: ownershipAnalysis.disambiguation_notes || '',
    research_summary: generateResearchSummary(searchResults, analyzedSources),
    research_method: 'agentic_web_research',
    total_sources: analyzedSources.length,
    search_results_count: searchResults.length,
    scraped_sites_count: 0, // Not applicable for agentic research
    timestamp: new Date().toISOString()
  }
}

/**
 * Generate research summary for user feedback
 */
function generateResearchSummary(searchResults, analyzedSources) {
  const highConfidenceSources = analyzedSources.filter(s => s.tier <= 2 && s.confidence > 0.7)
  const totalSources = analyzedSources.length
  const verifiedSources = highConfidenceSources.length
  
  if (verifiedSources === 0) {
    return `We searched multiple sources but found no verified ownership data. Searched ${totalSources} sources total.`
  }
  
  const sourceTypes = [...new Set(analyzedSources.map(s => s.source_type || 'unknown'))]
  
  return `Found ${verifiedSources} high-confidence sources out of ${totalSources} total sources. Searched: ${sourceTypes.join(', ')}.`
}

/**
 * Check if agentic web research is available
 */
export function isAgenticWebResearchAvailable() {
  return !!process.env.ANTHROPIC_API_KEY
}

/**
 * Get required environment variables for agentic web research
 */
export function getAgenticWebResearchRequiredEnvVars() {
  return {
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
  }
} 