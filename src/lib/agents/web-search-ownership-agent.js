/**
 * Web-Search-Powered Ownership Research Agent
 * Implements LLM-led web search with structured confidence scoring and multi-language support
 */

import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import { WebResearchAgent, isWebResearchAvailable } from './web-research-agent.js'
import { supabase } from '../supabase.ts'
import { emitProgress } from '../utils.ts'

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
 * Web-Search-Powered Ownership Research Agent
 * @param {Object} params
 * @param {string} params.brand - Brand name to research
 * @param {string} params.product_name - Product name (optional)
 * @param {Object} [params.hints] - Optional hints for research
 * @param {string} [params.hints.country_of_origin] - Country of origin
 * @param {string} [params.hints.website_url] - Known company website URL
 * @param {string} [params.queryId] - Query ID for progress tracking
 * @returns {Promise<Object>} Ownership research results
 */
export async function WebSearchOwnershipAgent({
  brand,
  product_name,
  hints = {},
  queryId = null
}) {
  const startTime = Date.now()
  console.log('[AgentLog] Starting: WebSearchOwnershipAgent')
  console.time('[AgentTimer] WebSearchOwnershipAgent')
  
  console.log('[WebSearchOwnershipAgent] Starting research for:', { brand, product_name, hints })
  
  try {
    // Step 1: Generate multi-language search queries
    const searchQueries = generateMultiLanguageQueries(brand, product_name, hints)
    console.log(`[WebSearchOwnershipAgent] Generated ${searchQueries.length} search queries`)
    
    if (queryId) {
      await emitProgress(queryId, 'web_search', 'started', { 
        brand, 
        product_name, 
        query_count: searchQueries.length 
      })
    }
    
    // Step 2: Perform web searches using the existing WebResearchAgent
    const webResearchData = await WebResearchAgent({
      brand,
      product_name,
      hints,
      queryAnalysis: { recommended_queries: searchQueries }
    })
    
    console.log('[WebSearchOwnershipAgent] Web research completed:', {
      success: webResearchData.success,
      sources: webResearchData.sources?.length || 0,
      findings: webResearchData.findings?.length || 0
    })
    
    // Step 3: LLM-led analysis of web search results
    const ownershipAnalysis = await performLLMAnalysis(brand, product_name, webResearchData, hints)
    
    // Step 4: Validate and structure the results
    const validatedResults = validateAndStructureResults(ownershipAnalysis, brand, webResearchData)
    
    // Step 5: Calculate final confidence score
    const finalConfidence = calculateFinalConfidence(validatedResults, webResearchData)
    
    const result = {
      success: true,
      brand: brand,
      product_name: product_name,
      ownership_chain: validatedResults.ownership_chain,
      final_confidence: finalConfidence,
      notes: validatedResults.notes,
      sources: validatedResults.sources,
      web_research_data: webResearchData,
      research_method: 'web_search_powered',
      timestamp: new Date().toISOString()
    }
    
    console.log('[WebSearchOwnershipAgent] Research complete:', {
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
    
    console.timeEnd('[AgentTimer] WebSearchOwnershipAgent')
    return result
    
  } catch (error) {
    console.error('[WebSearchOwnershipAgent] Error during research:', error)
    
    if (queryId) {
      await emitProgress(queryId, 'web_search', 'error', { error: error.message })
    }
    
    console.timeEnd('[AgentTimer] WebSearchOwnershipAgent')
    throw error
  }
}

/**
 * Generate multi-language search queries for global brand research
 */
function generateMultiLanguageQueries(brand, product_name, hints) {
  const queries = []
  const detectedLanguage = detectLanguage(brand, hints)
  
  // Base queries in English
  const baseQueries = [
    `"${brand}" parent company`,
    `"${brand}" ultimate owner`,
    `"${brand}" acquired by`,
    `"${brand}" owner site:wikipedia.org`,
    `"${brand}" corporate structure`,
    `"${brand}" subsidiary of`,
    `"${brand}" owned by site:bloomberg.com`,
    `"${brand}" owned by site:reuters.com`
  ]
  
  // Add product-specific queries if available
  if (product_name) {
    baseQueries.push(
      `"${brand}" "${product_name}" parent company`,
      `"${brand}" "${product_name}" owner`
    )
  }
  
  queries.push(...baseQueries)
  
  // Add language-specific queries
  if (detectedLanguage !== 'en') {
    const translatedQueries = translateQueries(baseQueries, detectedLanguage)
    queries.push(...translatedQueries)
  }
  
  // Add country-specific queries if country hint is provided
  if (hints.country_of_origin) {
    queries.push(
      `"${brand}" owner ${hints.country_of_origin}`,
      `"${brand}" parent company ${hints.country_of_origin}`
    )
  }
  
  return queries.slice(0, 15) // Limit to 15 queries
}

/**
 * Detect language from brand name and hints
 */
function detectLanguage(brand, hints) {
  // Simple language detection based on character sets
  const chineseRegex = /[\u4e00-\u9fff]/
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/
  const koreanRegex = /[\uac00-\ud7af]/
  const arabicRegex = /[\u0600-\u06ff]/
  const cyrillicRegex = /[\u0400-\u04ff]/
  
  if (chineseRegex.test(brand)) return 'zh'
  if (japaneseRegex.test(brand)) return 'ja'
  if (koreanRegex.test(brand)) return 'ko'
  if (arabicRegex.test(brand)) return 'ar'
  if (cyrillicRegex.test(brand)) return 'ru'
  
  // Check hints for language preference
  if (hints.language) return hints.language
  
  return 'en' // Default to English
}

/**
 * Translate queries to target language (simplified implementation)
 */
function translateQueries(queries, targetLanguage) {
  // This is a simplified translation - in production, you'd use a proper translation API
  const translations = {
    zh: {
      'parent company': '母公司',
      'ultimate owner': '最终所有者',
      'acquired by': '被收购',
      'owner': '所有者',
      'corporate structure': '公司结构',
      'subsidiary of': '子公司',
      'owned by': '拥有者'
    },
    es: {
      'parent company': 'empresa matriz',
      'ultimate owner': 'propietario final',
      'acquired by': 'adquirido por',
      'owner': 'propietario',
      'corporate structure': 'estructura corporativa',
      'subsidiary of': 'subsidiaria de',
      'owned by': 'propiedad de'
    },
    fr: {
      'parent company': 'société mère',
      'ultimate owner': 'propriétaire ultime',
      'acquired by': 'acquis par',
      'owner': 'propriétaire',
      'corporate structure': 'structure corporative',
      'subsidiary of': 'filiale de',
      'owned by': 'détenu par'
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
 * Perform LLM-led analysis of web search results
 */
async function performLLMAnalysis(brand, product_name, webResearchData, hints) {
  const systemPrompt = buildAnalysisSystemPrompt(brand, product_name, hints)
  const userPrompt = buildAnalysisUserPrompt(brand, product_name, webResearchData)
  
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
    console.log('[WebSearchOwnershipAgent] LLM analysis completed')
    
    return parseAnalysisResponse(analysisText)
    
  } catch (error) {
    console.error('[WebSearchOwnershipAgent] Error in LLM analysis:', error)
    throw new Error(`LLM analysis failed: ${error.message}`)
  }
}

/**
 * Build system prompt for LLM analysis
 */
function buildAnalysisSystemPrompt(brand, product_name, hints) {
  return `You are an expert corporate ownership analyst. Your task is to analyze web search results and extract accurate ownership information for the brand "${brand}".

CRITICAL REQUIREMENTS:
1. ONLY extract ownership information that is EXPLICITLY mentioned in the provided sources
2. Assign confidence scores (0-1) based on source authority and recency
3. Identify and exclude outdated ownership information
4. Support multi-language sources and global brands
5. Return structured JSON with ownership chain, sources, and confidence scores

AUTHORITY TIERS:
- Tier 1 (0.9-1.0): Official corporate registry, investor relations, Wikipedia/Wikidata
- Tier 2 (0.7-0.9): Reuters, Bloomberg, FT, CNBC, Crunchbase, PitchBook
- Tier 3 (0.5-0.7): Local media, trade publications
- Tier 4 (0.3-0.5): Brand's own About page, low-authority blogs/forums

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
  "notes": "Analysis notes including any conflicts or limitations"
}`
}

/**
 * Build user prompt for LLM analysis
 */
function buildAnalysisUserPrompt(brand, product_name, webResearchData) {
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
3. Assign confidence scores based on source authority and recency
4. Exclude outdated or conflicting information unless explicitly confirmed as current
5. Include specific URLs and dates for all sources
6. If information is limited, note this in the "notes" field

Return your analysis as valid JSON following the specified format.`
  
  return prompt
}

/**
 * Parse LLM analysis response
 */
function parseAnalysisResponse(analysisText) {
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
    console.error('[WebSearchOwnershipAgent] Error parsing LLM response:', error)
    throw new Error(`Failed to parse LLM analysis: ${error.message}`)
  }
}

/**
 * Validate and structure the analysis results
 */
function validateAndStructureResults(analysis, brand, webResearchData) {
  const validatedChain = []
  const allSources = []
  
  // Validate each entity in the ownership chain
  for (const entity of analysis.ownership_chain) {
    if (!entity.name || !entity.role) {
      console.warn('[WebSearchOwnershipAgent] Skipping invalid entity:', entity)
      continue
    }
    
    // Validate sources for this entity
    const validatedSources = entity.sources?.filter(source => {
      return source.url && source.title && typeof source.confidence === 'number'
    }) || []
    
    if (validatedSources.length === 0) {
      console.warn('[WebSearchOwnershipAgent] Entity has no valid sources:', entity.name)
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
  
  return {
    ownership_chain: validatedChain,
    sources: uniqueSources,
    notes: analysis.notes || 'Analysis completed based on web search results'
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
 * Calculate final confidence score
 */
function calculateFinalConfidence(validatedResults, webResearchData) {
  if (!validatedResults.ownership_chain || validatedResults.ownership_chain.length === 0) {
    return 0.0
  }
  
  // Calculate average confidence from all sources
  const allConfidences = validatedResults.sources.map(source => source.confidence)
  const averageConfidence = allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length
  
  // Adjust based on source count and quality
  const highTierSources = validatedResults.sources.filter(source => source.tier <= 2).length
  const totalSources = validatedResults.sources.length
  
  let finalConfidence = averageConfidence
  
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
  
  return Math.round(finalConfidence * 100) / 100 // Round to 2 decimal places
}

/**
 * Check if web search ownership agent is available
 */
export function isWebSearchOwnershipAvailable() {
  return isWebResearchAvailable() && !!process.env.ANTHROPIC_API_KEY
}

/**
 * Get required environment variables for web search ownership agent
 */
export function getWebSearchOwnershipRequiredEnvVars() {
  const required = ['ANTHROPIC_API_KEY']
  const webResearchVars = getRequiredEnvVars()
  return [...required, ...webResearchVars]
} 