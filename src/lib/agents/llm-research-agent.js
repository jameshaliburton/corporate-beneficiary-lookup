/**
 * LLM-First Research Agent
 * Replaces deprecated web scraping with direct LLM-based research
 * 
 * Key Features:
 * - Direct LLM research without external APIs
 * - Context-aware search strategies
 * - Multi-language support
 * - Structured confidence scoring
 * - Registry-specific research prompts
 * - Fallback strategies for small companies
 */

import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import { parseContextHints } from '../services/context-parser.js'
import { safeJSONParse } from '../utils/json-repair.js'
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

// Configuration for research behavior
const RESEARCH_CONFIG = {
  max_research_rounds: 3,
  research_timeout_ms: 30000,
  confidence_threshold: 0.7,
  registry_priority: ['virk.dk', 'brreg.no', 'allabolag.se', 'companieshouse.gov.uk', 'sec.gov']
}

/**
 * Main LLM Research Agent
 * Performs direct LLM-based ownership research without external APIs
 */
export async function LLMResearchAgent({
  brand,
  product_name,
  hints = {},
  queryId = null,
  followUpContext = null
}) {
  console.log('🚨🚨🚨🚨🚨 LLMResearchAgent FUNCTION ENTRY POINT REACHED 🚨🚨🚨🚨🚨')
  console.log('🚨🚨🚨 LLMResearchAgent CALLED for:', { brand, product_name })
  console.log('[LLMResearchAgent] 🚀 Starting LLM-first research for:', { brand, product_name, hints })
  
  try {
    // Step 1: Parse context hints for research strategy
    console.log('[RETURN_CHECK_1] Before parseContextHints')
    const contextHints = await parseContextHints(brand, product_name, hints.context || '')
    console.log('[RETURN_CHECK_1] After parseContextHints - no early return')
    console.log('[LLMResearchAgent] 📊 Context hints:', contextHints)
    
    // Step 2: Generate research strategy based on context
    console.log('[RETURN_CHECK_2] Before generateResearchStrategy')
    const researchStrategy = generateResearchStrategy(brand, product_name, contextHints)
    console.log('[RETURN_CHECK_2] After generateResearchStrategy - no early return')
    console.log('[LLMResearchAgent] 🎯 Research strategy:', researchStrategy)
    
    // Step 3: Execute multi-round LLM research
    console.log('[RETURN_CHECK_3] Before executeMultiRoundResearch')
    const researchResults = await executeMultiRoundResearch(brand, product_name, researchStrategy, contextHints)
    console.log('[RETURN_CHECK_3] After executeMultiRoundResearch - no early return')
    console.log('[LLMResearchAgent] 📈 Research results:', {
      rounds: researchResults.rounds.length,
      confidence: researchResults.final_confidence,
      sources: researchResults.sources.length
    })
    
    // Step 4: Check for disambiguation needs
    console.log('🚨🚨🚨 DISAMBIGUATION DEBUG: About to check disambiguation for:', { brand, product_name })
    let disambiguationNeeded
    try {
      disambiguationNeeded = await checkDisambiguationNeeds(brand, product_name, researchResults, contextHints)
      console.log('[LLMResearchAgent] 🔍 DISAMBIGUATION DEBUG: Disambiguation check result:', {
        needed: disambiguationNeeded.needed,
        reason: disambiguationNeeded.reason,
        pattern: disambiguationNeeded.pattern,
        options: disambiguationNeeded.options
      })
    } catch (disambiguationError) {
      console.error('[LLMResearchAgent] 🔍 DISAMBIGUATION ERROR:', disambiguationError.message)
      disambiguationNeeded = { needed: false, reason: 'disambiguation_check_failed', error: disambiguationError.message }
    }
    
    // Step 5: Validate and structure final results
    console.log('[RETURN_CHECK_4] Before validateAndStructureLLMResults')
    const finalResult = validateAndStructureLLMResults(researchResults, brand, product_name)
    console.log('[RETURN_CHECK_4] After validateAndStructureLLMResults - no early return')
    
    // Add disambiguation options if needed
    if (disambiguationNeeded.needed) {
      finalResult.disambiguation_options = disambiguationNeeded.options
      finalResult.disambiguation_triggered = true
      console.log('[LLMResearchAgent] 🔄 Disambiguation options added:', disambiguationNeeded.options?.length || 0)
    } else {
      finalResult.disambiguation_options = []
      finalResult.disambiguation_triggered = false
    }
    
    console.log('[LLMResearchAgent] ✅ Research complete:', {
      success: finalResult.success,
      confidence: finalResult.final_confidence,
      ownership_chain_length: finalResult.ownership_chain?.length || 0,
      disambiguation_triggered: finalResult.disambiguation_triggered
    })
    
    return finalResult
    
  } catch (error) {
    console.error('[LLMResearchAgent] ❌ Research failed:', error.message)
    return {
      success: false,
      brand,
      product_name,
      ownership_chain: [],
      final_confidence: 0,
      sources: [],
      error: error.message,
      fallback_reason: 'llm_research_failure'
    }
  }
}

/**
 * Check if disambiguation is needed based on brand ambiguity patterns
 */
async function checkDisambiguationNeeds(brand, product_name, researchResults, contextHints) {
  console.log('[LLMResearchAgent] 🔍 Checking disambiguation needs for:', { brand, product_name })
  
  // Define ambiguous brand patterns
  const ambiguousBrands = {
    'jordan': {
      patterns: ['jordan'],
      alternatives: [
        { name: 'Jordan (Nike)', company: 'Nike, Inc.', country: 'United States', context: 'athletic shoes, sports apparel' },
        { name: 'Jordan (Colgate)', company: 'Colgate-Palmolive Company', country: 'United States', context: 'oral care products' }
      ],
      trigger_confidence_threshold: 90 // Trigger disambiguation if confidence is high but ambiguous
    },
    'samsung': {
      patterns: ['samsung'],
      alternatives: [
        { name: 'Samsung Electronics', company: 'Samsung Group', country: 'South Korea', context: 'electronics, smartphones' },
        { name: 'Samsung Heavy Industries', company: 'Samsung Group', country: 'South Korea', context: 'shipbuilding, construction' },
        { name: 'Samsung C&T', company: 'Samsung Group', country: 'South Korea', context: 'construction, trading' }
      ],
      trigger_confidence_threshold: 85
    },
    'nestle': {
      patterns: ['nestlé', 'nestle'],
      alternatives: [
        { name: 'Nestlé S.A.', company: 'Nestlé S.A.', country: 'Switzerland', context: 'food and beverage products' }
      ],
      trigger_confidence_threshold: 95,
      special_triggers: ['tm_symbol', 'trademark']
    }
  }
  
  // Check if brand matches ambiguous patterns
  const normalizedBrand = brand.toLowerCase().trim()
  let matchedPattern = null
  
  for (const [patternName, pattern] of Object.entries(ambiguousBrands)) {
    for (const patternStr of pattern.patterns) {
      if (normalizedBrand.includes(patternStr)) {
        matchedPattern = { name: patternName, ...pattern }
        break
      }
    }
    if (matchedPattern) break
  }
  
  if (!matchedPattern) {
    console.log('[LLMResearchAgent] 🔍 No ambiguous pattern matched for:', normalizedBrand)
    return { needed: false, reason: 'no_ambiguous_pattern' }
  }
  
  console.log('[LLMResearchAgent] 🔍 Matched ambiguous pattern:', matchedPattern.name)
  
  // Check confidence threshold
  const confidence = researchResults.final_confidence || 0
  if (confidence < matchedPattern.trigger_confidence_threshold) {
    console.log('[LLMResearchAgent] 🔍 Confidence too low for disambiguation:', confidence, '<', matchedPattern.trigger_confidence_threshold)
    return { needed: false, reason: 'confidence_too_low', confidence }
  }
  
  // Check for special triggers (like TM symbols)
  if (matchedPattern.special_triggers) {
    const hasSpecialTrigger = matchedPattern.special_triggers.some(trigger => {
      if (trigger === 'tm_symbol') {
        return brand.includes('™') || brand.includes('®')
      }
      return false
    })
    
    if (!hasSpecialTrigger) {
      console.log('[LLMResearchAgent] 🔍 Special trigger not found for:', matchedPattern.name)
      return { needed: false, reason: 'special_trigger_not_found' }
    }
  }
  
  // Check if product context suggests disambiguation
  const productContext = product_name?.toLowerCase() || ''
  const relevantAlternatives = matchedPattern.alternatives.filter(alt => {
    // Check if product context matches alternative context
    if (alt.context) {
      const contextWords = alt.context.toLowerCase().split(/[,\s]+/)
      return contextWords.some(word => productContext.includes(word))
    }
    return true
  })
  
  if (relevantAlternatives.length <= 1) {
    console.log('[LLMResearchAgent] 🔍 Not enough relevant alternatives for disambiguation:', relevantAlternatives.length)
    return { needed: false, reason: 'insufficient_alternatives' }
  }
  
  // Generate disambiguation options
  const disambiguationOptions = relevantAlternatives.map((alt, index) => ({
    id: `${matchedPattern.name}_${index}`,
    name: alt.name,
    company: alt.company,
    country: alt.country,
    context: alt.context,
    confidence: Math.max(confidence - 10, 70), // Slightly lower confidence for disambiguation
    reasoning: `Based on product context "${productContext}" and brand "${brand}"`
  }))
  
  console.log('[LLMResearchAgent] 🔄 Disambiguation needed:', {
    pattern: matchedPattern.name,
    confidence,
    alternatives: disambiguationOptions.length,
    reason: 'ambiguous_brand_with_high_confidence'
  })
  
  return {
    needed: true,
    reason: 'ambiguous_brand_with_high_confidence',
    pattern: matchedPattern.name,
    confidence,
    options: disambiguationOptions
  }
}

/**
 * Generate research strategy based on brand and context
 */
function generateResearchStrategy(brand, product_name, contextHints) {
  const strategy = {
    primary_approach: 'registry_research',
    secondary_approaches: ['news_research', 'corporate_structure'],
    language_priority: ['en'],
    registry_focus: [],
    legal_suffixes: [],
    industry_keywords: []
  }
  
  // Determine country-specific strategy
  if (contextHints.country_guess) {
    const country = contextHints.country_guess.toLowerCase()
    
    if (country.includes('denmark') || country.includes('danish')) {
      strategy.registry_focus = ['virk.dk']
      strategy.legal_suffixes = ['A/S', 'ApS', 'I/S']
      strategy.language_priority = ['da', 'en']
    } else if (country.includes('norway') || country.includes('norwegian')) {
      strategy.registry_focus = ['brreg.no']
      strategy.legal_suffixes = ['AS', 'ASA', 'ANS']
      strategy.language_priority = ['no', 'en']
    } else if (country.includes('sweden') || country.includes('swedish')) {
      strategy.registry_focus = ['allabolag.se']
      strategy.legal_suffixes = ['AB', 'HB', 'KB']
      strategy.language_priority = ['sv', 'en']
    } else if (country.includes('germany') || country.includes('german')) {
      strategy.registry_focus = ['handelsregister.de']
      strategy.legal_suffixes = ['GmbH', 'AG', 'UG']
      strategy.language_priority = ['de', 'en']
    } else if (country.includes('uk') || country.includes('british')) {
      strategy.registry_focus = ['companieshouse.gov.uk']
      strategy.legal_suffixes = ['Ltd', 'PLC', 'LLP']
      strategy.language_priority = ['en']
    } else if (country.includes('us') || country.includes('american')) {
      strategy.registry_focus = ['sec.gov']
      strategy.legal_suffixes = ['Inc', 'Corp', 'LLC']
      strategy.language_priority = ['en']
    }
  }
  
  // Add industry-specific keywords
  if (contextHints.industry_hints) {
    strategy.industry_keywords = contextHints.industry_hints
  }
  
  // Add legal suffixes from context
  if (contextHints.likely_entity_suffixes) {
    strategy.legal_suffixes = [...new Set([...strategy.legal_suffixes, ...contextHints.likely_entity_suffixes])]
  }
  
  return strategy
}

/**
 * Execute multi-round LLM research with different strategies
 */
async function executeMultiRoundResearch(brand, product_name, strategy, contextHints) {
  const rounds = []
  let bestResult = null
  let bestConfidence = 0
  
  // Round 1: Registry-specific research
  console.log('[LLMResearchAgent] 🔍 Round 1: Registry research')
  const registryResult = await performRegistryResearch(brand, product_name, strategy, contextHints)
  rounds.push(registryResult)
  
  if (registryResult.confidence > bestConfidence) {
    bestResult = registryResult
    bestConfidence = registryResult.confidence
  }
  
  // Round 2: News and corporate structure research
  if (bestConfidence < RESEARCH_CONFIG.confidence_threshold) {
    console.log('[LLMResearchAgent] 🔍 Round 2: News research')
    const newsResult = await performNewsResearch(brand, product_name, strategy, contextHints)
    rounds.push(newsResult)
    
    if (newsResult.confidence > bestConfidence) {
      bestResult = newsResult
      bestConfidence = newsResult.confidence
    }
  }
  
  // Round 3: Fallback research with broader scope
  if (bestConfidence < RESEARCH_CONFIG.confidence_threshold) {
    console.log('[LLMResearchAgent] 🔍 Round 3: Fallback research')
    const fallbackResult = await performFallbackResearch(brand, product_name, strategy, contextHints)
    rounds.push(fallbackResult)
    
    if (fallbackResult.confidence > bestConfidence) {
      bestResult = fallbackResult
      bestConfidence = fallbackResult.confidence
    }
  }
  
  return {
    rounds,
    best_result: bestResult,
    final_confidence: bestConfidence,
    sources: bestResult?.sources || [],
    ownership_chain: bestResult?.ownership_chain || [],
    research_summary: bestResult?.research_summary || 'No conclusive ownership information found'
  }
}

/**
 * Perform registry-specific research using LLM
 */
async function performRegistryResearch(brand, product_name, strategy, contextHints) {
  const systemPrompt = buildRegistryResearchPrompt(brand, product_name, strategy, contextHints)
  const userPrompt = buildRegistryResearchUserPrompt(brand, product_name, strategy)
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
    
    const analysis = parseLLMResearchResponse(response.content[0].text)
    
    return {
      round: 'registry_research',
      confidence: analysis.confidence || 0,
      ownership_chain: analysis.ownership_chain || [],
      sources: analysis.sources || [],
      research_summary: analysis.research_summary || '',
      strategy_used: strategy
    }
    
  } catch (error) {
    console.error('[LLMResearchAgent] Registry research failed:', error.message)
    return {
      round: 'registry_research',
      confidence: 0,
      ownership_chain: [],
      sources: [],
      research_summary: 'Registry research failed',
      error: error.message
    }
  }
}

/**
 * Perform news and corporate structure research
 */
async function performNewsResearch(brand, product_name, strategy, contextHints) {
  const systemPrompt = buildNewsResearchPrompt(brand, product_name, strategy, contextHints)
  const userPrompt = buildNewsResearchUserPrompt(brand, product_name, strategy)
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
    
    const analysis = parseLLMResearchResponse(response.content[0].text)
    
    return {
      round: 'news_research',
      confidence: analysis.confidence || 0,
      ownership_chain: analysis.ownership_chain || [],
      sources: analysis.sources || [],
      research_summary: analysis.research_summary || '',
      strategy_used: strategy
    }
    
  } catch (error) {
    console.error('[LLMResearchAgent] News research failed:', error.message)
    return {
      round: 'news_research',
      confidence: 0,
      ownership_chain: [],
      sources: [],
      research_summary: 'News research failed',
      error: error.message
    }
  }
}

/**
 * Perform fallback research with broader scope
 */
async function performFallbackResearch(brand, product_name, strategy, contextHints) {
  const systemPrompt = buildFallbackResearchPrompt(brand, product_name, strategy, contextHints)
  const userPrompt = buildFallbackResearchUserPrompt(brand, product_name, strategy)
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
    
    const analysis = parseLLMResearchResponse(response.content[0].text)
    
    return {
      round: 'fallback_research',
      confidence: analysis.confidence || 0,
      ownership_chain: analysis.ownership_chain || [],
      sources: analysis.sources || [],
      research_summary: analysis.research_summary || '',
      strategy_used: strategy
    }
    
  } catch (error) {
    console.error('[LLMResearchAgent] Fallback research failed:', error.message)
    return {
      round: 'fallback_research',
      confidence: 0,
      ownership_chain: [],
      sources: [],
      research_summary: 'Fallback research failed',
      error: error.message
    }
  }
}

/**
 * Build registry research system prompt
 */
function buildRegistryResearchPrompt(brand, product_name, strategy, contextHints) {
  return `You are an expert corporate research analyst specializing in business registry research and ownership analysis.

CRITICAL REQUIREMENTS:
1. Research the ownership structure of "${brand}" using business registry knowledge
2. Focus on official registries: ${strategy.registry_focus.join(', ')}
3. Consider legal entity suffixes: ${strategy.legal_suffixes.join(', ')}
4. Look for parent companies, ultimate owners, and ownership chains
5. Provide confidence scores based on data quality and source reliability
6. Return structured JSON with ownership chain, sources, and confidence

RESEARCH STRATEGY:
- Search for "${brand}" in official business registries
- Look for variations with legal suffixes (${strategy.legal_suffixes.join(', ')})
- Identify parent companies and ultimate owners
- Cross-reference with multiple sources when possible
- Prioritize recent and official information

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "confidence": 0.0-1.0,
  "ownership_chain": [
    {
      "name": "Company Name",
      "type": "Brand|Parent|Ultimate Owner",
      "country": "Country",
      "flag": "🇺🇸",
      "ultimate": false
    }
  ],
  "sources": [
    {
      "name": "Source Name",
      "url": "https://example.com",
      "type": "registry|news|official",
      "reliability": 0.0-1.0
    }
  ],
  "research_summary": "Brief summary of findings",
  "data_quality": {
    "completeness": 0.0-1.0,
    "recency": 0.0-1.0,
    "consistency": 0.0-1.0
  }
}`
}

/**
 * Build registry research user prompt
 */
function buildRegistryResearchUserPrompt(brand, product_name, strategy) {
  return `Research the ownership of "${brand}" (product: ${product_name}) using business registry knowledge.

Focus on:
- Official business registries: ${strategy.registry_focus.join(', ')}
- Legal entity variations: ${strategy.legal_suffixes.join(', ')}
- Parent companies and ultimate owners
- Recent ownership changes or acquisitions

Provide detailed research findings with confidence scoring.`
}

/**
 * Build news research system prompt
 */
function buildNewsResearchPrompt(brand, product_name, strategy, contextHints) {
  return `You are an expert business analyst researching corporate ownership through news and public sources.

CRITICAL REQUIREMENTS:
1. Research "${brand}" ownership through business news and public sources
2. Look for acquisition news, corporate announcements, and ownership changes
3. Focus on recent developments and official announcements
4. Cross-reference multiple sources for verification
5. Provide confidence scores based on source reliability and data consistency

RESEARCH FOCUS:
- Recent acquisitions or ownership changes
- Corporate announcements and press releases
- Industry news and business reports
- Official company statements
- Regulatory filings and disclosures

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "confidence": 0.0-1.0,
  "ownership_chain": [
    {
      "name": "Company Name",
      "type": "Brand|Parent|Ultimate Owner",
      "country": "Country",
      "flag": "🇺🇸",
      "ultimate": false
    }
  ],
  "sources": [
    {
      "name": "Source Name",
      "url": "https://example.com",
      "type": "news|official|press",
      "reliability": 0.0-1.0
    }
  ],
  "research_summary": "Brief summary of findings",
  "data_quality": {
    "completeness": 0.0-1.0,
    "recency": 0.0-1.0,
    "consistency": 0.0-1.0
  }
}`
}

/**
 * Build news research user prompt
 */
function buildNewsResearchUserPrompt(brand, product_name, strategy) {
  return `Research the ownership of "${brand}" (product: ${product_name}) through business news and public sources.

Look for:
- Recent acquisitions or ownership changes
- Corporate announcements and press releases
- Industry news and business reports
- Official company statements
- Regulatory filings and disclosures

Provide detailed research findings with confidence scoring.`
}

/**
 * Build fallback research system prompt
 */
function buildFallbackResearchPrompt(brand, product_name, strategy, contextHints) {
  return `You are an expert business researcher conducting comprehensive ownership analysis.

CRITICAL REQUIREMENTS:
1. Research "${brand}" ownership using all available knowledge
2. Consider multiple research angles and sources
3. Look for any ownership information, even if incomplete
4. Provide confidence scores based on available data quality
5. Be thorough but honest about limitations

RESEARCH APPROACH:
- Business registry knowledge
- Industry knowledge and company databases
- Corporate structure analysis
- Brand ownership patterns
- Market knowledge and industry trends

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "confidence": 0.0-1.0,
  "ownership_chain": [
    {
      "name": "Company Name",
      "type": "Brand|Parent|Ultimate Owner",
      "country": "Country",
      "flag": "🇺🇸",
      "ultimate": false
    }
  ],
  "sources": [
    {
      "name": "Source Name",
      "url": "https://example.com",
      "type": "knowledge|analysis|inference",
      "reliability": 0.0-1.0
    }
  ],
  "research_summary": "Brief summary of findings",
  "data_quality": {
    "completeness": 0.0-1.0,
    "recency": 0.0-1.0,
    "consistency": 0.0-1.0
  }
}`
}

/**
 * Build fallback research user prompt
 */
function buildFallbackResearchUserPrompt(brand, product_name, strategy) {
  return `Research the ownership of "${brand}" (product: ${product_name}) using comprehensive business knowledge.

Consider:
- Business registry knowledge
- Industry knowledge and company databases
- Corporate structure analysis
- Brand ownership patterns
- Market knowledge and industry trends

Provide detailed research findings with confidence scoring, even if information is limited.`
}

/**
 * Parse LLM research response
 */
function parseLLMResearchResponse(responseText) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    
    const parsed = safeJSONParse(jsonMatch[0])
    
    // Validate required fields
    if (!parsed || typeof parsed.confidence !== 'number') {
      throw new Error('Invalid response format - missing confidence')
    }
    
    return {
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      ownership_chain: Array.isArray(parsed.ownership_chain) ? parsed.ownership_chain : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      research_summary: parsed.research_summary || '',
      data_quality: parsed.data_quality || { completeness: 0.5, recency: 0.5, consistency: 0.5 }
    }
    
  } catch (error) {
    console.error('[LLMResearchAgent] Failed to parse response:', error.message)
    return {
      confidence: 0,
      ownership_chain: [],
      sources: [],
      research_summary: 'Failed to parse research response',
      data_quality: { completeness: 0, recency: 0, consistency: 0 }
    }
  }
}

/**
 * Validate and structure final LLM results
 */
function validateAndStructureLLMResults(researchResults, brand, product_name) {
  const { best_result, final_confidence, sources, ownership_chain, research_summary } = researchResults
  
  if (!best_result || final_confidence < 0.1) {
    return {
      success: false,
      brand,
      product_name,
      ownership_chain: [],
      final_confidence: 0,
      sources: [],
      reasoning: 'No conclusive ownership information found through LLM research',
      fallback_reason: 'llm_research_no_results',
      research_method: 'llm_first_research',
      total_sources: 0,
      notes: 'LLM research completed but no conclusive findings'
    }
  }
  
  // Calculate verification status based on source quality
  const verifiedSources = sources.filter(s => s.type === 'registry' && s.reliability > 0.8)
  const highlyLikelySources = sources.filter(s => s.reliability > 0.7)
  
  let verificationStatus = 'unverified'
  if (verifiedSources.length > 0) {
    verificationStatus = 'verified'
  } else if (highlyLikelySources.length > 0) {
    verificationStatus = 'highly_likely'
  }
  
  // Convert ownership chain to the format expected by the enhanced ownership research agent
  const formattedOwnershipChain = ownership_chain.map((entity, index) => ({
    name: entity.name,
    role: entity.type,
    country: entity.country,
    flag: entity.flag,
    ultimate: entity.ultimate,
    sources: sources.filter(s => s.reliability > 0.7).map(source => ({
      url: source.url,
      name: source.name,
      type: source.type,
      confidence: source.reliability,
      tier: source.type === 'registry' ? 1 : source.type === 'official' ? 2 : 3
    }))
  }))
  
  return {
    success: true,
    brand,
    product_name,
    ownership_chain: formattedOwnershipChain,
    final_confidence,
    sources,
    verification_status: verificationStatus,
    verification_reasoning: `Found ${sources.length} sources with ${verifiedSources.length} verified sources`,
    research_summary,
    data_quality: best_result.data_quality || { completeness: 0.5, recency: 0.5, consistency: 0.5 },
    debug_info: {
      research_rounds: researchResults.rounds.length,
      best_round: best_result.round,
      strategy_used: best_result.strategy_used
    },
    // Normalized fields for downstream compatibility
    research_method: 'llm_first_research',
    total_sources: sources.length,
    notes: research_summary || 'Ownership determined via LLM reasoning and verified sources.',
    trusted_sources: sources.filter(s => s.type === 'registry') || [],
    verified_sources: verifiedSources || [],
    highly_likely_sources: highlyLikelySources || []
  }
}

/**
 * Check if LLM Research Agent is available
 */
export function isLLMResearchAvailable() {
  return !!process.env.ANTHROPIC_API_KEY
}

/**
 * Get required environment variables for LLM Research Agent
 */
export function getLLMResearchRequiredEnvVars() {
  return ['ANTHROPIC_API_KEY']
} 