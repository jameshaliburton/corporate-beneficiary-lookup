/**
 * Enhanced Web-Search-Powered Ownership Research Agent
 * Implements LLM-led web search with structured confidence scoring and multi-language support
 * 
 * Key Features:
 * - Always attempts web search first
 * - Extracts ownership information only from explicit mentions
 * - Tiered confidence system based on source authority and recency
 * - Structured JSON output with sources and confidence scores
 * - Multi-language support for global brands
 * - Validation and chain resolution with conflict handling
 * - Configurable timeout and retry logic with exponential backoff
 * - Follow-up context integration with intelligent re-research
 * - Enhanced debug logging for query execution and source parsing
 */

import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import { AgenticWebResearchAgent, isAgenticWebResearchAvailable } from './agentic-web-research-agent.js'
import { QueryBuilderAgent } from './query-builder-agent.js'
import { parseContextHints, mergeContextHints } from '../services/context-parser.js'
import { safeJSONParse } from '../utils/json-repair.js'
import { supabase } from '../supabase.ts'
import { emitProgress } from '../utils.ts'
import { getTrustedSource, isTrustedSource, getTrustLevel } from './trustedSources.ts'

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

// Configuration for timeout and retry behavior
const TIMEOUT_CONFIG = {
  enhanced_web_search: parseInt(process.env.ENHANCED_AGENT_TIMEOUT_MS) || 30000, // 30 seconds default
  retry_attempts: 2,
  retry_delay_base: 2000, // 2 seconds base delay
  retry_delay_multiplier: 2 // Exponential backoff multiplier
}

/**
 * Evaluate source trust and determine verification status
 * @param {Array} sources - Array of source URLs
 * @param {Object} dataConsistency - Object containing consistency metrics
 * @param {boolean} multipleConfirmations - Whether multiple sources confirm the same owner
 * @returns {Object} Verification status and reasoning
 */
function evaluateSourceTrust(sources, dataConsistency, multipleConfirmations) {
  console.log('[SourceTrust] Evaluating sources:', sources.length, 'sources')
  
  // Extract domains from sources
  const domains = sources.map(source => {
    try {
      const url = new URL(source)
      return url.hostname
    } catch (error) {
      console.warn('[SourceTrust] Invalid URL:', source)
      return null
    }
  }).filter(Boolean)
  
  console.log('[SourceTrust] Extracted domains:', domains)
  
  // Check for trusted sources
  const trustedSources = domains.filter(domain => isTrustedSource(domain))
  const verifiedSources = trustedSources.filter(domain => getTrustLevel(domain) === 'verified')
  const highlyLikelySources = trustedSources.filter(domain => getTrustLevel(domain) === 'highly_likely')
  
  console.log('[SourceTrust] Trust analysis:', {
    totalSources: sources.length,
    trustedSources: trustedSources.length,
    verifiedSources: verifiedSources.length,
    highlyLikelySources: highlyLikelySources.length,
    dataConsistency,
    multipleConfirmations
  })
  
  // Determine verification status based on criteria
  let verificationStatus = 'unverified'
  let verificationReasoning = []
  
  // Criteria 1: Verified sources + consistent data + multiple confirmations
  if (verifiedSources.length > 0 && dataConsistency.consistencyScore >= 0.8 && multipleConfirmations) {
    verificationStatus = 'verified'
    verificationReasoning.push(`Found ${verifiedSources.length} verified source(s): ${verifiedSources.join(', ')}`)
    verificationReasoning.push(`Data consistency score: ${dataConsistency.consistencyScore}`)
    verificationReasoning.push('Multiple sources confirm the same ownership structure')
  }
  // Criteria 2: Multiple LLM passes confirming same owner (≥2 sources)
  else if (multipleConfirmations && sources.length >= 2) {
    verificationStatus = 'highly_likely'
    verificationReasoning.push(`Multiple sources (${sources.length}) confirm the same ownership structure`)
    if (trustedSources.length > 0) {
      verificationReasoning.push(`Includes ${trustedSources.length} trusted source(s): ${trustedSources.join(', ')}`)
    }
  }
  // Criteria 3: Single verified source with high consistency
  else if (verifiedSources.length > 0 && dataConsistency.consistencyScore >= 0.9) {
    verificationStatus = 'highly_likely'
    verificationReasoning.push(`Found verified source: ${verifiedSources.join(', ')}`)
    verificationReasoning.push(`High data consistency: ${dataConsistency.consistencyScore}`)
  }
  // Criteria 4: Multiple trusted sources (not necessarily verified)
  else if (trustedSources.length >= 2) {
    verificationStatus = 'highly_likely'
    verificationReasoning.push(`Found ${trustedSources.length} trusted sources: ${trustedSources.join(', ')}`)
  }
  // Default: Unverified
  else {
    verificationStatus = 'unverified'
    verificationReasoning.push('Limited or no trusted sources found')
    if (sources.length > 0) {
      verificationReasoning.push(`Found ${sources.length} source(s) but none are in trusted list`)
    }
  }
  
  const result = {
    verificationStatus,
    verificationReasoning: verificationReasoning.join('. '),
    trustedSources: trustedSources,
    verifiedSources: verifiedSources,
    highlyLikelySources: highlyLikelySources,
    totalSources: sources.length,
    dataConsistency,
    multipleConfirmations
  }
  
  console.log('[SourceTrust] Verification result:', result)
  return result
}

/**
 * Enhanced Web-Search-Powered Ownership Research Agent with timeout and retry logic
 * @param {Object} params
 * @param {string} params.brand - Brand name to research
 * @param {string} params.product_name - Product name (optional)
 * @param {Object} [params.hints] - Optional hints for research
 * @param {string} [params.hints.country_of_origin] - Country of origin
 * @param {string} [params.hints.website_url] - Known company website URL
 * @param {string} [params.queryId] - Query ID for progress tracking
 * @returns {Promise<Object|null>} Ownership research results or null on failure
 */
export async function EnhancedWebSearchOwnershipAgent({
  brand,
  product_name,
  hints = {},
  queryId = null,
  followUpContext = null
}) {
  const startTime = Date.now()
  console.log('[AgentLog] Starting: EnhancedWebSearchOwnershipAgent')
  console.time('[AgentTimer] EnhancedWebSearchOwnershipAgent')
  
  console.log('[EnhancedWebSearchOwnershipAgent] Starting research for:', { brand, product_name, hints, followUpContext })
  console.log('[EnhancedWebSearchOwnershipAgent] Timeout config:', TIMEOUT_CONFIG)
  
  // Always parse follow-up context if provided
  let enhancedHints = { ...hints }
  let contextUsed = false
  
  if (followUpContext) {
    console.log('[EnhancedWebSearchOwnershipAgent] 🔍 Processing follow-up context:', followUpContext)
    const contextHints = await parseContextHints(followUpContext, brand, product_name)
    enhancedHints = mergeContextHints(hints, contextHints)
    contextUsed = true
    console.log('[EnhancedWebSearchOwnershipAgent] ✅ Context hints merged:', {
      country: enhancedHints.country_guess || enhancedHints.country_of_origin,
      product_type: enhancedHints.product_type,
      legal_suffixes: enhancedHints.likely_entity_suffixes,
      industry_hints: enhancedHints.industry_hints
    })
  }
  
  // Execute with timeout and retry logic
  try {
    const result = await executeWithTimeoutAndRetry(
      () => performEnhancedWebSearchResearch(brand, product_name, enhancedHints, queryId, contextUsed),
      TIMEOUT_CONFIG.enhanced_web_search,
      TIMEOUT_CONFIG.retry_attempts,
      TIMEOUT_CONFIG.retry_delay_base,
      TIMEOUT_CONFIG.retry_delay_multiplier,
      brand
    )
    
    if (result) {
      console.log('[EnhancedWebSearchOwnershipAgent] Research completed successfully:', {
        success: result.success,
        ownership_chain_length: result.ownership_chain?.length || 0,
        final_confidence: result.final_confidence,
        sources_count: result.sources?.length || 0
      })
      
      if (queryId) {
        await emitProgress(queryId, 'web_search', 'completed', {
          success: result.success,
          confidence: result.final_confidence,
          chain_length: result.ownership_chain?.length || 0
        })
      }
      
      console.timeEnd('[AgentTimer] EnhancedWebSearchOwnershipAgent')
      return result
    } else {
      console.log('[EnhancedWebSearchOwnershipAgent] Research failed - returning null for fallback')
      console.timeEnd('[AgentTimer] EnhancedWebSearchOwnershipAgent')
      return null
    }
    
  } catch (error) {
    console.error('[EnhancedWebSearchOwnershipAgent] Unexpected error during research:', error)
    
    if (queryId) {
      await emitProgress(queryId, 'web_search', 'error', { error: error.message })
    }
    
    console.timeEnd('[AgentTimer] EnhancedWebSearchOwnershipAgent')
    return null // Return null instead of throwing to allow fallback
  }
}

/**
 * Execute a function with timeout and retry logic
 * @param {Function} fn - Function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay for retries in milliseconds
 * @param {number} delayMultiplier - Multiplier for exponential backoff
 * @param {string} brand - Brand name for logging
 * @returns {Promise<Object|null>} Result or null on failure
 */
async function executeWithTimeoutAndRetry(fn, timeoutMs, maxRetries, baseDelay, delayMultiplier, brand) {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    console.log(`🔍 [EnhancedAgent] Attempt ${attempt} for "${brand}"`)
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ])
      
      console.log(`✅ [EnhancedAgent] Success on attempt ${attempt}`)
      return result
      
    } catch (error) {
      const isLastAttempt = attempt > maxRetries
      const isTransientError = isTransientErrorType(error)
      
      console.log(`❌ [EnhancedAgent] Attempt ${attempt} failed:`, error.message)
      
      if (isLastAttempt) {
        console.log(`❌ [EnhancedAgent] Failed after ${maxRetries + 1} attempts - falling back`)
        return null
      }
      
      if (!isTransientError) {
        console.log(`❌ [EnhancedAgent] Non-transient error - not retrying`)
        return null
      }
      
      const delay = baseDelay * Math.pow(delayMultiplier, attempt - 1)
      console.log(`⏳ [EnhancedAgent] Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return null
}

/**
 * Determine if an error is transient and should be retried
 * @param {Error} error - The error to check
 * @returns {boolean} True if error is transient
 */
function isTransientErrorType(error) {
  const transientErrorPatterns = [
    /timeout/i,
    /network/i,
    /connection/i,
    /rate limit/i,
    /429/i,
    /5\d{2}/i, // 5xx HTTP errors
    /ECONNRESET/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i
  ]
  
  const errorMessage = error.message || error.toString()
  return transientErrorPatterns.some(pattern => pattern.test(errorMessage))
}

/**
 * Perform the actual enhanced web search research
 * @param {string} brand - Brand name
 * @param {string} product_name - Product name
 * @param {Object} hints - Research hints
 * @param {string} queryId - Query ID for progress tracking
 * @returns {Promise<Object>} Research results
 */
async function performEnhancedWebSearchResearch(brand, product_name, hints, queryId, contextUsed = false) {
  console.log('[EnhancedWebSearchOwnershipAgent] 📊 Research parameters:', {
    brand,
    product_name,
    hints: {
      country: hints.country_guess || hints.country_of_origin,
      product_type: hints.product_type,
      legal_suffixes: hints.likely_entity_suffixes,
      industry_hints: hints.industry_hints
    },
    contextUsed
  })
  
  // Step 1: Generate enhanced search queries using QueryBuilderAgent
  console.log('[EnhancedWebSearchOwnershipAgent] 🔧 Generating queries with QueryBuilderAgent...')
  const searchQueries = await QueryBuilderAgent(brand, product_name, hints)
  console.log(`[EnhancedWebSearchOwnershipAgent] ✅ Generated ${searchQueries.length} enhanced search queries`)
  
  // Log which queries were generated for debugging
  console.log('[EnhancedWebSearchOwnershipAgent] 📝 Generated queries:', searchQueries.map(q => ({
    query: q.query,
    purpose: q.purpose,
    priority: q.priority
  })))
  
  if (queryId) {
    await emitProgress(queryId, 'web_search', 'started', { 
      brand, 
      product_name, 
      query_count: searchQueries.length,
      contextUsed
    })
  }
  
  // Step 2: Perform web searches using the new AgenticWebResearchAgent
  console.log('[EnhancedWebSearchOwnershipAgent] 🔍 Starting AgenticWebResearchAgent with enhanced logging...')
  const webResearchData = await AgenticWebResearchAgent({
    brand,
    product_name,
    hints,
    queryAnalysis: { 
      recommended_queries: searchQueries,
      contextUsed,
      debugMode: true
    }
  })
  
  console.log('[EnhancedWebSearchOwnershipAgent] ✅ Web research completed:', {
    success: webResearchData.success,
    sources: webResearchData.sources?.length || 0,
    findings: webResearchData.findings?.length || 0,
    alternatives: webResearchData.alternatives?.length || 0,
    verification_status: webResearchData.verification_status,
    research_summary: webResearchData.research_summary
  })
  
  // Step 3: LLM-led analysis of web search results with structured confidence scoring
  const ownershipAnalysis = await performEnhancedLLMAnalysis(brand, product_name, webResearchData, hints)
  
  // Step 4: Validate and structure the results with conflict resolution
  const validatedResults = validateAndStructureResults(ownershipAnalysis, brand, webResearchData)
  
  // Step 5: Calculate final confidence score using tiered system
  const finalConfidence = calculateTieredConfidence(validatedResults, webResearchData)
  
  // Step 6: Evaluate source trust and determine verification status
  const sourceUrls = validatedResults.sources.map(source => source.url).filter(Boolean)
  const dataConsistency = {
    consistencyScore: webResearchData.data_consistency?.score || 0.5,
    conflictingSources: webResearchData.data_consistency?.conflicts || 0,
    totalSources: sourceUrls.length
  }
  const multipleConfirmations = sourceUrls.length >= 2 && dataConsistency.consistencyScore >= 0.7
  
  const verificationResult = evaluateSourceTrust(sourceUrls, dataConsistency, multipleConfirmations)
  
  const result = {
    success: true,
    brand: brand,
    product_name: product_name,
    ownership_chain: validatedResults.ownership_chain,
    final_confidence: finalConfidence,
    notes: validatedResults.notes,
    sources: validatedResults.sources,
    web_research_data: webResearchData,
    research_method: 'enhanced_web_search_powered',
    timestamp: new Date().toISOString(),
    // Add verification status and reasoning
    verification_status: verificationResult.verificationStatus,
    verification_reasoning: verificationResult.verificationReasoning,
    trusted_sources: verificationResult.trustedSources,
    verified_sources: verificationResult.verifiedSources,
    highly_likely_sources: verificationResult.highlyLikelySources
  }
  
  return result
}

/**
 * Generate multi-language search queries for global brand research
 * Implements the tiered query approach from requirements
 */
function generateMultiLanguageQueries(brand, product_name, hints) {
  const queries = []
  const detectedLanguage = detectLanguage(brand, hints)
  
  // Base queries in English (as specified in requirements)
  const baseQueries = [
    `"${brand}" parent company`,
    `"${brand}" ultimate owner`,
    `"${brand}" acquired by`,
    `"${brand}" owner site:wikipedia.org`,
    `"${brand}" corporate structure`,
    `"${brand}" subsidiary of`,
    `"${brand}" owned by site:bloomberg.com`,
    `"${brand}" owned by site:reuters.com`,
    `"${brand}" owned by site:ft.com`,
    `"${brand}" owned by site:wsj.com`,
    `"${brand}" investor relations`,
    `"${brand}" annual report 2024`,
    `"${brand}" annual report 2025`,
    `"${brand}" SEC filing`,
    `"${brand}" corporate registry`
  ]
  
  // Add product-specific queries if available
  if (product_name) {
    baseQueries.push(
      `"${brand}" "${product_name}" parent company`,
      `"${brand}" "${product_name}" owner`,
      `"${brand}" "${product_name}" corporate structure`
    )
  }
  
  queries.push(...baseQueries)
  
  // Add language-specific queries for global brands
  if (detectedLanguage !== 'en') {
    const translatedQueries = translateQueries(baseQueries, detectedLanguage)
    queries.push(...translatedQueries)
  }
  
  // Add country-specific queries if country hint is provided
  if (hints.country_of_origin) {
    queries.push(
      `"${brand}" owner ${hints.country_of_origin}`,
      `"${brand}" parent company ${hints.country_of_origin}`,
      `"${brand}" corporate registry ${hints.country_of_origin}`,
      `"${brand}" annual report ${hints.country_of_origin}`
    )
  }
  
  return queries.slice(0, 20) // Limit to 20 queries for efficiency
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
 * Translate queries to target language for global brand research
 */
function translateQueries(queries, targetLanguage) {
  // Enhanced translation map for global brands
  const translations = {
    zh: {
      'parent company': '母公司',
      'ultimate owner': '最终所有者',
      'acquired by': '被收购',
      'owner': '所有者',
      'corporate structure': '公司结构',
      'subsidiary of': '子公司',
      'owned by': '拥有者',
      'investor relations': '投资者关系',
      'annual report': '年度报告',
      'SEC filing': 'SEC文件',
      'corporate registry': '公司注册'
    },
    es: {
      'parent company': 'empresa matriz',
      'ultimate owner': 'propietario final',
      'acquired by': 'adquirido por',
      'owner': 'propietario',
      'corporate structure': 'estructura corporativa',
      'subsidiary of': 'subsidiaria de',
      'owned by': 'propiedad de',
      'investor relations': 'relaciones con inversores',
      'annual report': 'informe anual',
      'SEC filing': 'presentación SEC',
      'corporate registry': 'registro corporativo'
    },
    fr: {
      'parent company': 'société mère',
      'ultimate owner': 'propriétaire ultime',
      'acquired by': 'acquis par',
      'owner': 'propriétaire',
      'corporate structure': 'structure corporative',
      'subsidiary of': 'filiale de',
      'owned by': 'détenu par',
      'investor relations': 'relations investisseurs',
      'annual report': 'rapport annuel',
      'SEC filing': 'dépôt SEC',
      'corporate registry': 'registre corporatif'
    },
    de: {
      'parent company': 'Muttergesellschaft',
      'ultimate owner': 'letzter Eigentümer',
      'acquired by': 'erworben von',
      'owner': 'Eigentümer',
      'corporate structure': 'Unternehmensstruktur',
      'subsidiary of': 'Tochtergesellschaft von',
      'owned by': 'im Besitz von',
      'investor relations': 'Investor Relations',
      'annual report': 'Jahresbericht',
      'SEC filing': 'SEC-Einreichung',
      'corporate registry': 'Unternehmensregister'
    },
    ja: {
      'parent company': '親会社',
      'ultimate owner': '最終所有者',
      'acquired by': '買収された',
      'owner': '所有者',
      'corporate structure': '企業構造',
      'subsidiary of': '子会社',
      'owned by': '所有されている',
      'investor relations': '投資家関係',
      'annual report': '年次報告書',
      'SEC filing': 'SEC提出書類',
      'corporate registry': '企業登録'
    }
  }
  
  if (!translations[targetLanguage]) return []
  
  const translatedQueries = []
  const translationMap = translations[targetLanguage]
  
  for (const query of queries) {
    let translatedQuery = query
    for (const [english, translated] of Object.entries(translationMap)) {
      translatedQuery = translatedQuery.replace(new RegExp(english, 'gi'), translated)
    }
    translatedQueries.push(translatedQuery)
  }
  
  return translatedQueries
}

/**
 * Perform enhanced LLM-led analysis with structured confidence scoring
 */
async function performEnhancedLLMAnalysis(brand, product_name, webResearchData, hints) {
  const systemPrompt = buildEnhancedAnalysisSystemPrompt(brand, product_name, hints)
  const userPrompt = buildEnhancedAnalysisUserPrompt(brand, product_name, webResearchData)
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })
    
    const analysisText = response.content[0].text
    console.log('[EnhancedWebSearchOwnershipAgent] Enhanced LLM analysis completed')
    
    return parseEnhancedAnalysisResponse(analysisText)
    
  } catch (error) {
    console.error('[EnhancedWebSearchOwnershipAgent] Error in enhanced LLM analysis:', error)
    throw new Error(`Enhanced LLM analysis failed: ${error.message}`)
  }
}

/**
 * Build enhanced system prompt for LLM analysis with tiered confidence system
 */
function buildEnhancedAnalysisSystemPrompt(brand, product_name, hints) {
  return `You are an expert corporate ownership analyst specializing in global brand ownership research. Your task is to analyze web search results and extract accurate, current ownership information for the brand "${brand}".

CRITICAL REQUIREMENTS:
1. ONLY extract ownership information that is EXPLICITLY mentioned in the provided sources
2. Use the tiered confidence system based on source authority and recency
3. Identify and exclude outdated ownership information (e.g., past acquirers like "Kraft Foods" for Nabisco)
4. Support multi-language sources and global brands
5. Return structured JSON with ownership chain, sources, and confidence scores
6. Prefer entities backed by multiple high-confidence sources
7. Include specific URLs, publication dates, and authority tiers for all sources

AUTHORITY TIERS (as specified in requirements):
- Tier 1 (0.9-1.0): Official corporate registry, investor relations, Wikipedia/Wikidata
- Tier 2 (0.7-0.9): Reuters, Bloomberg, FT, CNBC, Crunchbase, PitchBook
- Tier 3 (0.5-0.7): Local media, trade publications
- Tier 4 (0.3-0.5): Brand's own About page, low-authority blogs/forums

CONFIDENCE SCORING GUIDELINES:
- Higher confidence for sources that explicitly mention "current owner", "as of 2024/2025", "currently owned by"
- Lower confidence for sources that mention "formerly owned", "sold to", "previously owned", "was acquired by"
- If multiple owners are found, prioritize the one with the LATEST acquisition date
- Cross-reference acquisition dates to ensure you're using the most recent information

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "ownership_chain": [
    {
      "name": "Brand/Company Name",
      "country": "Country",
      "role": "Brand|Parent|Ultimate Owner",
      "sources": [
        {
          "url": "https://example.com",
          "title": "Page Title",
          "date": "YYYY-MM-DD",
          "tier": 1-4,
          "confidence": 0.0-1.0
        }
      ]
    }
  ],
  "final_confidence": 0.0-1.0,
  "notes": "Analysis notes including any conflicts, limitations, or 'Limited Verified Information' if only low-tier sources exist"
}`
}

/**
 * Build enhanced user prompt for LLM analysis
 */
function buildEnhancedAnalysisUserPrompt(brand, product_name, webResearchData) {
  const sources = webResearchData.sources || []
  const findings = webResearchData.findings || []
  
  let prompt = `Analyze the following web search results for brand "${brand}"${product_name ? ` and product "${product_name}"` : ''}:

WEB SEARCH SOURCES:
${sources.map((source, index) => `${index + 1}. ${source.title || 'Untitled'} (${source.url})
   Date: ${source.date || 'Unknown'}
   Content: ${source.content || source.snippet || 'No content available'}`).join('\n\n')}

ADDITIONAL FINDINGS:
${findings.map((finding, index) => `${index + 1}. ${finding.description || finding.content}`).join('\n')}

INSTRUCTIONS:
1. Extract ONLY ownership information explicitly mentioned in these sources
2. Build an ownership chain from brand to ultimate owner
3. Assign confidence scores based on source authority and recency using the tiered system
4. Exclude outdated or conflicting information unless explicitly confirmed as current
5. Include specific URLs and dates for all sources
6. If information is limited, note this in the "notes" field with "Limited Verified Information"
7. If conflict exists, pick the highest-confidence chain but include uncertainty in notes
8. Remove outdated owners (e.g., past acquirers) unless explicitly confirmed as current

Return your analysis as valid JSON following the specified format.`
  
  return prompt
}

/**
 * Parse enhanced LLM analysis response
 */
function parseEnhancedAnalysisResponse(analysisText) {
  try {
    // Extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate required fields
    if (!parsed.ownership_chain || !Array.isArray(parsed.ownership_chain)) {
      throw new Error('Invalid ownership_chain in response')
    }
    
    if (typeof parsed.final_confidence !== 'number') {
      throw new Error('Invalid final_confidence in response')
    }
    
    return parsed
    
  } catch (error) {
    console.error('[EnhancedWebSearchOwnershipAgent] Error parsing enhanced LLM response:', error)
    throw new Error(`Failed to parse enhanced LLM analysis: ${error.message}`)
  }
}

/**
 * Validate and structure the analysis results with conflict resolution
 */
function validateAndStructureResults(analysis, brand, webResearchData) {
  const validatedChain = []
  const allSources = []
  
  // Validate each entity in the ownership chain
  for (const entity of analysis.ownership_chain) {
    if (!entity.name || !entity.role) {
      console.warn('[EnhancedWebSearchOwnershipAgent] Skipping invalid entity:', entity)
      continue
    }
    
    // Validate sources for this entity
    const validatedSources = entity.sources?.filter(source => {
      return source.url && source.title && typeof source.confidence === 'number' && source.tier >= 1 && source.tier <= 4
    }) || []
    
    if (validatedSources.length === 0) {
      console.warn('[EnhancedWebSearchOwnershipAgent] Entity has no valid sources:', entity.name)
      continue
    }
    
    validatedChain.push({
      ...entity,
      sources: validatedSources
    })
    
    allSources.push(...validatedSources)
  }
  
  // Remove duplicates from sources
  const uniqueSources = removeDuplicateSources(allSources)
  
  // Check for conflicts and resolve them
  const conflictResolution = resolveOwnershipConflicts(validatedChain, brand)
  
  return {
    ownership_chain: conflictResolution.resolved_chain,
    sources: uniqueSources,
    notes: analysis.notes || conflictResolution.notes || 'Analysis completed based on web search results'
  }
}

/**
 * Remove duplicate sources based on URL
 */
function removeDuplicateSources(sources) {
  const seen = new Set()
  return sources.filter(source => {
    if (seen.has(source.url)) {
      return false
    }
    seen.add(source.url)
    return true
  })
}

/**
 * Resolve ownership conflicts by prioritizing highest-confidence sources
 */
function resolveOwnershipConflicts(ownershipChain, brand) {
  const resolvedChain = []
  const conflicts = []
  
  // Group entities by role to identify conflicts
  const entitiesByRole = {}
  
  for (const entity of ownershipChain) {
    if (!entitiesByRole[entity.role]) {
      entitiesByRole[entity.role] = []
    }
    entitiesByRole[entity.role].push(entity)
  }
  
  // Resolve conflicts for each role
  for (const [role, entities] of Object.entries(entitiesByRole)) {
    if (entities.length === 1) {
      resolvedChain.push(entities[0])
    } else {
      // Multiple entities for same role - resolve conflict
      const resolvedEntity = resolveEntityConflict(entities, role)
      resolvedChain.push(resolvedEntity.entity)
      
      if (resolvedEntity.hasConflict) {
        conflicts.push({
          role,
          entities: entities.map(e => e.name),
          resolved: resolvedEntity.entity.name,
          reason: resolvedEntity.reason
        })
      }
    }
  }
  
  let notes = ''
  if (conflicts.length > 0) {
    notes = `Conflicts resolved: ${conflicts.map(c => `${c.role} (${c.entities.join(' vs ')}) → ${c.resolved}`).join('; ')}. `
  }
  
  return {
    resolved_chain: resolvedChain,
    conflicts,
    notes
  }
}

/**
 * Resolve conflict between multiple entities for the same role
 */
function resolveEntityConflict(entities, role) {
  // Sort by average confidence of sources
  const entitiesWithConfidence = entities.map(entity => {
    const avgConfidence = entity.sources.reduce((sum, source) => sum + source.confidence, 0) / entity.sources.length
    return { ...entity, avgConfidence }
  })
  
  entitiesWithConfidence.sort((a, b) => b.avgConfidence - a.avgConfidence)
  
  const highestConfidence = entitiesWithConfidence[0]
  const hasConflict = entitiesWithConfidence.length > 1 && 
    (entitiesWithConfidence[1].avgConfidence > highestConfidence.avgConfidence * 0.8)
  
  return {
    entity: highestConfidence,
    hasConflict,
    reason: hasConflict ? 'Multiple high-confidence sources found, selected highest' : 'Clear winner based on confidence'
  }
}

/**
 * Calculate tiered confidence score based on source authority and recency
 */
function calculateTieredConfidence(validatedResults, webResearchData) {
  if (!validatedResults.ownership_chain || validatedResults.ownership_chain.length === 0) {
    return 0.0
  }
  
  // Calculate confidence based on tiered system
  const tierWeights = {
    1: 1.0,   // Tier 1 sources get full weight
    2: 0.8,   // Tier 2 sources get 80% weight
    3: 0.6,   // Tier 3 sources get 60% weight
    4: 0.4    // Tier 4 sources get 40% weight
  }
  
  let totalWeightedConfidence = 0
  let totalWeight = 0
  
  for (const source of validatedResults.sources) {
    const weight = tierWeights[source.tier] || 0.4
    totalWeightedConfidence += source.confidence * weight
    totalWeight += weight
  }
  
  let finalConfidence = totalWeight > 0 ? totalWeightedConfidence / totalWeight : 0
  
  // Adjust based on source count and quality
  const highTierSources = validatedResults.sources.filter(source => source.tier <= 2).length
  const totalSources = validatedResults.sources.length
  
  // Boost confidence if we have multiple high-tier sources
  if (highTierSources >= 2) {
    finalConfidence = Math.min(1.0, finalConfidence + 0.1)
  }
  
  // Reduce confidence if we have very few sources
  if (totalSources < 2) {
    finalConfidence = Math.max(0.0, finalConfidence - 0.2)
  }
  
  // Reduce confidence if we have mostly low-tier sources
  const lowTierRatio = (totalSources - highTierSources) / totalSources
  if (lowTierRatio > 0.7) {
    finalConfidence = Math.max(0.0, finalConfidence - 0.15)
  }
  
  // Add "Limited Verified Information" note if only low-tier sources
  if (highTierSources === 0 && totalSources > 0) {
    if (!validatedResults.notes) validatedResults.notes = ''
    validatedResults.notes += ' Limited Verified Information: Only low-authority sources available.'
  }
  
  return Math.round(finalConfidence * 100) / 100 // Round to 2 decimal places
}

/**
 * Check if enhanced web search ownership agent is available
 */
export function isEnhancedWebSearchOwnershipAvailable() {
  return isAgenticWebResearchAvailable()
}

/**
 * Get required environment variables for enhanced web search ownership agent
 */
export function getEnhancedWebSearchOwnershipRequiredEnvVars() {
  return getAgenticWebResearchRequiredEnvVars()
} 