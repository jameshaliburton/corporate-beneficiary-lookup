/**
 * Context Parser Service
 * Extracts structured hints from free-text context to enrich downstream agents
 */

import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

dotenv.config()

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

/**
 * Parse context hints from free-text input
 * @param {string} context - Free-text context (e.g., "pork rinds from Denmark I think")
 * @param {string} brand - Brand name for context
 * @param {string} product_name - Product name for context
 * @returns {Object} Structured hints object
 */
export async function parseContextHints(context, brand, product_name) {
  if (!context || context.trim().length === 0) {
    return {
      country_guess: null,
      product_type: null,
      likely_entity_suffixes: [],
      industry_hints: [],
      confidence: 0,
      extracted_context: {},
      language_hints: [],
      registry_hints: []
    }
  }

  try {
    const systemPrompt = `You are an expert context parser for corporate ownership research. Extract structured hints from free-text context.

CRITICAL REQUIREMENTS:
1. Extract country/region information (e.g., "Denmark", "German", "from France", "Norwegian")
2. Identify product type or industry (e.g., "pork rinds", "software", "automotive", "snacks")
3. Detect likely legal entity suffixes based on country:
   - Denmark: A/S, ApS, I/S
   - Norway: AS, ASA, ANS
   - Sweden: AB, HB, KB
   - Germany: GmbH, AG, UG
   - UK: Ltd, PLC, LLP
   - France: SARL, SAS, SA
4. Identify industry-specific hints and keywords
5. Detect language hints (Danish, Norwegian, Swedish, German, etc.)
6. Suggest appropriate business registries for the detected country
7. Assess confidence in extracted information

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "country_guess": "country name or null",
  "product_type": "product type or null", 
  "likely_entity_suffixes": ["A/S", "GmbH", "SARL"],
  "industry_hints": ["food", "automotive", "tech", "snacks"],
  "language_hints": ["da", "no", "sv", "de"],
  "registry_hints": ["virk.dk", "brreg.no", "allabolag.se"],
  "confidence": 0.0-1.0,
  "extracted_context": {
    "raw_text": "original context",
    "parsed_elements": ["list of what was extracted"],
    "uncertainty_notes": "any notes about uncertainty"
  }
}`

    const userPrompt = `Parse context hints from this input:

Brand: ${brand}
Product: ${product_name || 'N/A'}
Context: "${context}"

Extract country, product type, legal suffixes, industry hints, language hints, and registry suggestions.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const parsed = JSON.parse(response.content[0].text)
    
    console.log('[ContextParser] Extracted hints:', {
      country: parsed.country_guess,
      product: parsed.product_type,
      suffixes: parsed.likely_entity_suffixes,
      language: parsed.language_hints,
      registry: parsed.registry_hints,
      confidence: parsed.confidence
    })

    return parsed

  } catch (error) {
    console.error('[ContextParser] Failed to parse context:', error)
    
    // Fallback to basic regex extraction
    return fallbackContextExtraction(context, brand, product_name)
  }
}

/**
 * Fallback context extraction using regex patterns
 */
function fallbackContextExtraction(context, brand, product_name) {
  const hints = {
    country_guess: null,
    product_type: null,
    likely_entity_suffixes: [],
    industry_hints: [],
    confidence: 0.3,
    extracted_context: {
      raw_text: context,
      parsed_elements: [],
      uncertainty_notes: 'Fallback extraction used'
    }
  }

  // Country detection patterns
  const countryPatterns = {
    'Denmark': /\b(denmark|danish|\.dk)\b/i,
    'Germany': /\b(germany|german|deutschland|\.de)\b/i,
    'France': /\b(france|french|\.fr)\b/i,
    'Sweden': /\b(sweden|swedish|\.se)\b/i,
    'Norway': /\b(norway|norwegian|\.no)\b/i,
    'Netherlands': /\b(netherlands|dutch|holland|\.nl)\b/i,
    'Spain': /\b(spain|spanish|\.es)\b/i,
    'Italy': /\b(italy|italian|\.it)\b/i,
    'United Kingdom': /\b(uk|britain|british|england|\.co\.uk)\b/i,
    'United States': /\b(usa|american|\.com)\b/i,
    'Canada': /\b(canada|canadian|\.ca)\b/i,
    'Australia': /\b(australia|australian|\.au)\b/i,
    'Japan': /\b(japan|japanese|\.jp)\b/i,
    'China': /\b(china|chinese|\.cn)\b/i,
    'India': /\b(india|indian|\.in)\b/i
  }

  // Find country
  for (const [country, pattern] of Object.entries(countryPatterns)) {
    if (pattern.test(context)) {
      hints.country_guess = country
      hints.confidence += 0.2
      hints.extracted_context.parsed_elements.push(`country: ${country}`)
      break
    }
  }

  // Product type detection
  const productPatterns = {
    'food': /\b(food|snack|pork|rinds|meat|dairy|beverage|drink)\b/i,
    'automotive': /\b(car|auto|vehicle|tire|motor|engine)\b/i,
    'technology': /\b(software|tech|computer|digital|app|platform)\b/i,
    'pharmaceutical': /\b(pharma|medicine|drug|healthcare|medical)\b/i,
    'retail': /\b(retail|store|shop|commerce|ecommerce)\b/i,
    'manufacturing': /\b(manufacturing|factory|industrial|machinery)\b/i
  }

  for (const [type, pattern] of Object.entries(productPatterns)) {
    if (pattern.test(context)) {
      hints.product_type = type
      hints.industry_hints.push(type)
      hints.confidence += 0.1
      hints.extracted_context.parsed_elements.push(`product_type: ${type}`)
      break
    }
  }

  // Legal suffix detection based on country
  if (hints.country_guess) {
    const suffixMap = {
      'Denmark': ['A/S', 'ApS', 'I/S'],
      'Germany': ['GmbH', 'AG', 'KG'],
      'France': ['SARL', 'SA', 'SAS'],
      'Sweden': ['AB', 'Aktiebolag'],
      'Norway': ['AS', 'A/S'],
      'Netherlands': ['BV', 'NV'],
      'Spain': ['SA', 'SL'],
      'Italy': ['SRL', 'SpA'],
      'United Kingdom': ['Ltd', 'PLC', 'LLP'],
      'United States': ['Inc', 'LLC', 'Corp'],
      'Canada': ['Ltd', 'Inc', 'Corp'],
      'Australia': ['Pty Ltd', 'Ltd'],
      'Japan': ['株式会社', 'Kabushiki Kaisha', 'KK'],
      'China': ['有限公司', 'Limited', 'Ltd'],
      'India': ['Pvt Ltd', 'Ltd', 'Limited']
    }

    const suffixes = suffixMap[hints.country_guess] || []
    hints.likely_entity_suffixes = suffixes
    hints.extracted_context.parsed_elements.push(`suffixes: ${suffixes.join(', ')}`)
  }

  return hints
}

/**
 * Merge context hints with existing hints object
 * @param {Object} existingHints - Existing hints object
 * @param {Object} contextHints - New context hints
 * @returns {Object} Merged hints object
 */
export function mergeContextHints(existingHints, contextHints) {
  const merged = { ...existingHints }

  // Merge country information (context takes precedence)
  if (contextHints.country_guess && !merged.country_of_origin) {
    merged.country_of_origin = contextHints.country_guess
  }

  // Merge product type
  if (contextHints.product_type && !merged.product_type) {
    merged.product_type = contextHints.product_type
  }

  // Merge industry hints
  if (contextHints.industry_hints.length > 0) {
    merged.industry_hints = [
      ...(merged.industry_hints || []),
      ...contextHints.industry_hints
    ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
  }

  // Merge legal suffixes
  if (contextHints.likely_entity_suffixes.length > 0) {
    merged.likely_entity_suffixes = [
      ...(merged.likely_entity_suffixes || []),
      ...contextHints.likely_entity_suffixes
    ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
  }

  // Add context confidence
  merged.context_confidence = contextHints.confidence

  // Add extracted context info
  merged.extracted_context = contextHints.extracted_context

  console.log('[ContextParser] Merged hints:', {
    country: merged.country_of_origin,
    product: merged.product_type,
    suffixes: merged.likely_entity_suffixes,
    confidence: merged.context_confidence
  })

  return merged
}

/**
 * Extract follow-up context from user input
 * @param {string} userInput - User's follow-up input
 * @param {string} originalBrand - Original brand name
 * @param {string} originalProduct - Original product name
 * @returns {Object} Context hints object
 */
export async function extractFollowUpContext(userInput, originalBrand, originalProduct) {
  // Check if input contains follow-up context
  const contextIndicators = [
    'from', 'in', 'based in', 'located in', 'headquartered in',
    'I think', 'maybe', 'probably', 'likely',
    'sells', 'makes', 'produces', 'manufactures'
  ]

  const hasContext = contextIndicators.some(indicator => 
    userInput.toLowerCase().includes(indicator.toLowerCase())
  )

  if (!hasContext) {
    return null
  }

  console.log('[ContextParser] Detected follow-up context:', userInput)
  
  return await parseContextHints(userInput, originalBrand, originalProduct)
}

export default {
  parseContextHints,
  mergeContextHints,
  extractFollowUpContext
} 