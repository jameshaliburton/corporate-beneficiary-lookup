/**
 * Enhanced Query Builder Agent
 * Generates localized queries with country-specific legal suffixes and registry searches
 */

import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import { safeJSONParse } from '../utils/json-repair.js'

dotenv.config()

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

/**
 * Generate localized search queries for ownership research
 * @param {string} brand - Brand name
 * @param {string} product_name - Product name
 * @param {Object} hints - Context hints including country, legal suffixes, etc.
 * @returns {Array} Array of search query objects
 */
export async function QueryBuilderAgent(brand, product_name, hints = {}) {
  console.log('[QueryBuilderAgent] Generating localized queries for:', { brand, product_name, hints })
  
  try {
    // Detect language and country
    const detectedLanguage = detectLanguage(brand, hints)
    const country = hints.country_of_origin || hints.country_guess
    
    // Generate base queries
    const baseQueries = generateBaseQueries(brand, product_name, hints)
    
    // Add localized queries
    const localizedQueries = await generateLocalizedQueries(brand, product_name, hints, detectedLanguage)
    
    // Add country-specific registry queries
    const registryQueries = generateRegistryQueries(brand, product_name, hints, country)
    
    // Add legal suffix variations (ENHANCED)
    const suffixQueries = generateEnhancedSuffixQueries(brand, hints)
    
    // Add About-page specific queries
    const aboutPageQueries = generateAboutPageQueries(brand, product_name, hints, country)
    
    // Add fallback templates for small companies
    const fallbackQueries = generateFallbackTemplates(brand, product_name, hints, country)
    
    // Combine and prioritize all queries
    const allQueries = [
      ...baseQueries,
      ...localizedQueries,
      ...registryQueries,
      ...suffixQueries,
      ...aboutPageQueries,
      ...fallbackQueries
    ]
    
    // Remove duplicates and limit for cost control
    const uniqueQueries = removeDuplicateQueries(allQueries)
    const limitedQueries = uniqueQueries.slice(0, 20) // Increased limit for better coverage
    
    console.log(`[QueryBuilderAgent] Generated ${limitedQueries.length} unique queries`)
    
    return limitedQueries
    
  } catch (error) {
    console.error('[QueryBuilderAgent] Failed to generate queries:', error)
    return generateFallbackQueries(brand, product_name, hints)
  }
}

/**
 * Generate base search queries
 */
function generateBaseQueries(brand, product_name, hints) {
  const queries = [
    {
      query: `"${brand}" parent company`,
      purpose: 'find parent company information',
      priority: 5,
      expected_sources: ['company websites', 'financial news']
    },
    {
      query: `"${brand}" ultimate owner`,
      purpose: 'find ultimate ownership',
      priority: 5,
      expected_sources: ['financial filings', 'corporate registries']
    },
    {
      query: `"${brand}" acquired by`,
      purpose: 'find acquisition information',
      priority: 4,
      expected_sources: ['news articles', 'financial filings']
    },
    {
      query: `"${brand}" corporate structure`,
      purpose: 'find corporate structure',
      priority: 4,
      expected_sources: ['company websites', 'annual reports']
    },
    {
      query: `"${brand}" subsidiary of`,
      purpose: 'find subsidiary relationships',
      priority: 4,
      expected_sources: ['financial filings', 'corporate registries']
    },
    {
      query: `"${brand}" ownership`,
      purpose: 'find ownership information',
      priority: 4,
      expected_sources: ['company websites', 'financial news']
    },
    {
      query: `"${brand}" who owns`,
      purpose: 'find ownership information',
      priority: 4,
      expected_sources: ['news articles', 'company websites']
    }
  ]
  
  return queries
}

/**
 * Generate localized queries using LLM
 */
async function generateLocalizedQueries(brand, product_name, hints, detectedLanguage) {
  if (detectedLanguage === 'en') {
    return []
  }
  
  try {
    const systemPrompt = `You are an expert search query generator for global corporate research. Generate search queries in the detected language for finding ownership information.

CRITICAL REQUIREMENTS:
1. Generate queries in the detected language (${detectedLanguage})
2. Use appropriate ownership terminology for that language
3. Include variations for different search engines
4. Focus on finding current ownership information
5. Generate 5-8 high-quality queries

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "queries": [
    {
      "query": "exact search query in target language",
      "purpose": "what this query aims to find",
      "priority": 1-5,
      "expected_sources": ["types of sources this should find"]
    }
  ]
}`

    const userPrompt = `Generate localized search queries for finding ownership information about:
Brand: ${brand}
Product: ${product_name || 'N/A'}
Country: ${hints.country_of_origin || 'Unknown'}
Language: ${detectedLanguage}

Focus on queries that will find current, accurate ownership information in ${detectedLanguage}.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const queriesText = response.content[0].text
    const parsed = safeJSONParse(queriesText, 'QueryBuilderAgent localized queries')
    
    if (parsed && parsed.queries) {
      return parsed.queries
    }
    
    return []
    
  } catch (error) {
    console.error('[QueryBuilderAgent] Failed to generate localized queries:', error)
    return []
  }
}

/**
 * Generate registry-specific queries based on country hints
 */
function generateRegistryQueries(brand, product_name, hints, country) {
  const queries = []
  
  // ENHANCED: Registry templates with context-aware queries
  const registryTemplates = {
    dk: [
      `site:virk.dk "${brand}"`,
      `"${brand}" CVR site:virk.dk`,
      `"${brand}" ejerskab site:virk.dk`,
      `"${brand}" ejere site:virk.dk`,
      `"${brand}" virksomhed site:virk.dk`,
      `"${brand}" A/S site:virk.dk`,
      `"${brand}" ApS site:virk.dk`
    ],
    no: [
      `site:brreg.no "${brand}"`,
      `"${brand}" AS site:brreg.no`,
      `"${brand}" ASA site:brreg.no`,
      `"${brand}" eiere site:brreg.no`,
      `"${brand}" bedrift site:brreg.no`
    ],
    se: [
      `site:allabolag.se "${brand}"`,
      `"${brand}" AB site:allabolag.se`,
      `"${brand}" HB site:allabolag.se`,
      `"${brand}" ägare site:allabolag.se`,
      `"${brand}" företag site:allabolag.se`
    ],
    de: [
      `site:unternehmensregister.de "${brand}"`,
      `"${brand}" GmbH site:unternehmensregister.de`,
      `"${brand}" AG site:unternehmensregister.de`,
      `"${brand}" Inhaber site:unternehmensregister.de`
    ],
    uk: [
      `site:find-and-update.company-information.service.gov.uk "${brand}"`,
      `"${brand}" Ltd site:find-and-update.company-information.service.gov.uk`,
      `"${brand}" PLC site:find-and-update.company-information.service.gov.uk`
    ],
    us: [
      `site:sec.gov "${brand}"`,
      `"${brand}" Inc site:sec.gov`,
      `"${brand}" Corp site:sec.gov`,
      `"${brand}" LLC site:sec.gov`
    ]
  }
  
  // Add global registries as fallbacks
  const globalRegistries = [
    `site:opencorporates.com "${brand}"`,
    `site:wikidata.org "${brand}"`,
    `site:wikipedia.org "${brand}" company`,
    `site:bloomberg.com "${brand}"`,
    `site:reuters.com "${brand}"`,
    `site:ft.com "${brand}"`,
    `site:wsj.com "${brand}"`
  ]
  
  // Add country-specific queries if country is known
  if (country) {
    const countryCode = getCountryCode(country)
    if (registryTemplates[countryCode]) {
      registryTemplates[countryCode].forEach((template, index) => {
        queries.push({
          query: template,
          purpose: `registry search for ${country}`,
          priority: 6 - index, // Higher priority for registry searches
          expected_sources: [`${country} business registry`]
        })
      })
    }
  }
  
  // Always add global registries as fallbacks
  globalRegistries.forEach((template, index) => {
    queries.push({
      query: template,
      purpose: 'global registry search',
      priority: 3 - index,
      expected_sources: ['global business registries', 'financial news']
    })
  })
  
  console.log(`[QueryBuilderAgent] Generated ${queries.length} registry queries for country: ${country}`)
  return queries
}

/**
 * Get country code from country name
 */
function getCountryCode(country) {
  const countryMap = {
    'denmark': 'dk',
    'danish': 'dk',
    'norway': 'no', 
    'norwegian': 'no',
    'sweden': 'se',
    'swedish': 'se',
    'germany': 'de',
    'german': 'de',
    'united kingdom': 'uk',
    'uk': 'uk',
    'britain': 'uk',
    'united states': 'us',
    'usa': 'us',
    'american': 'us',
    'france': 'fr',
    'french': 'fr'
  }
  
  return countryMap[country.toLowerCase()] || null
}

/**
 * Generate enhanced suffix queries with context awareness
 */
function generateEnhancedSuffixQueries(brand, hints = {}) {
  const queries = []
  
  // Detect country from context hints
  const country = hints.country || hints.country_guess || detectCountryFromContext(hints)
  const language = hints.language || detectLanguageFromContext(hints)
  
  // Global suffixes for all countries
  const globalSuffixes = [
    'Ltd', 'LLC', 'Inc', 'Corp', 'Company', 'Co', 'Limited', 'Corporation'
  ]
  
  // Country-specific legal forms with priority
  const countrySuffixes = {
    dk: ['A/S', 'ApS', 'IVS', 'P/S'], // Denmark
    no: ['AS', 'ANS', 'KS', 'ASA'], // Norway
    se: ['AB', 'HB', 'KB', 'Ekonomisk förening'], // Sweden
    fi: ['Oy', 'Ky', 'Osakeyhtiö'], // Finland
    de: ['GmbH', 'AG', 'KG', 'OHG'], // Germany
    uk: ['Ltd', 'PLC', 'LLP', 'Limited'], // UK
    us: ['LLC', 'Inc', 'Corp', 'Ltd'], // USA
    ca: ['Ltd', 'Inc', 'Corp', 'Limited'], // Canada
    au: ['Pty Ltd', 'Ltd', 'Limited'], // Australia
    nz: ['Ltd', 'Limited', 'Inc'] // New Zealand
  }
  
  // Registry-specific search templates
  const registryTemplates = {
    dk: [
      'site:virk.dk "{BRAND}"',
      '"{BRAND}" CVR site:virk.dk',
      '"{BRAND}" ejerforhold site:virk.dk',
      '"{BRAND}" virksomhedsregister site:virk.dk'
    ],
    no: [
      'site:brreg.no "{BRAND}"',
      '"{BRAND}" organisasjonsnummer site:brreg.no'
    ],
    se: [
      'site:allabolag.se "{BRAND}"',
      '"{BRAND}" bolagsform site:allabolag.se'
    ],
    fi: [
      'site:ytj.fi "{BRAND}"',
      '"{BRAND}" y-tunnus site:ytj.fi'
    ],
    de: [
      'site:handelsregister.de "{BRAND}"',
      '"{BRAND}" HRB site:handelsregister.de'
    ],
    uk: [
      'site:find-and-update.company-information.service.gov.uk "{BRAND}"',
      '"{BRAND}" company number site:companieshouse.gov.uk'
    ],
    us: [
      'site:sec.gov "{BRAND}"',
      '"{BRAND}" SEC filings site:sec.gov'
    ]
  }
  
  // Language-specific keywords
  const languageKeywords = {
    da: ['ejerforhold', 'ejere', 'virksomhed', 'selskab', 'dansk virksomhed'],
    no: ['eierskap', 'eiere', 'bedrift', 'selskap', 'norsk bedrift'],
    sv: ['ägarskap', 'ägare', 'företag', 'bolag', 'svenskt företag'],
    fi: ['omistajuus', 'omistajat', 'yritys', 'yhtiö', 'suomalainen yritys'],
    de: ['eigentümerschaft', 'eigentümer', 'unternehmen', 'gesellschaft', 'deutsches unternehmen'],
    en: ['ownership', 'owners', 'company', 'corporation', 'parent company']
  }
  
  // Get country-specific suffixes and registry templates
  const localSuffixes = countrySuffixes[country] || []
  const localRegistryTemplates = registryTemplates[country] || []
  const localKeywords = languageKeywords[language] || languageKeywords.en
  
  // Generate queries with local legal suffixes first (higher priority)
  for (const suffix of localSuffixes) {
    queries.push({
      query: `"${brand} ${suffix}"`,
      purpose: 'legal_suffix',
      priority: 1,
      country: country,
      language: language
    })
  }
  
  // Generate registry-specific queries
  for (const template of localRegistryTemplates) {
    queries.push({
      query: template.replace('{BRAND}', brand),
      purpose: 'registry_search',
      priority: 2,
      country: country,
      language: language
    })
  }
  
  // Generate queries with local language keywords
  for (const keyword of localKeywords.slice(0, 3)) { // Limit to top 3 keywords
    queries.push({
      query: `"${brand}" ${keyword}`,
      purpose: 'local_keyword',
      priority: 3,
      country: country,
      language: language
    })
  }
  
  // Add global suffixes as fallback
  for (const suffix of globalSuffixes.slice(0, 5)) { // Limit global suffixes
    queries.push({
      query: `"${brand} ${suffix}"`,
      purpose: 'global_suffix',
      priority: 4,
      country: country,
      language: language
    })
  }
  
  // Add generic company query
  queries.push({
    query: `"${brand}" company`,
    purpose: 'generic',
    priority: 5,
    country: country,
    language: language
  })
  
  return queries
}

/**
 * Generate About-page specific queries
 */
function generateAboutPageQueries(brand, product_name, hints, country) {
  const queries = []
  
  // Generic About-page queries with prioritization
  queries.push({
    query: `about "${brand}"`,
    purpose: 'find company About pages with high priority',
    priority: 4,
    expected_sources: ['company website']
  })
  
  queries.push({
    query: `"${brand}" about site:${brand.toLowerCase().replace(/\s+/g, '')}.com`,
    purpose: 'find company About page on main domain',
    priority: 3,
    expected_sources: ['company website']
  })
  
  // Country-specific About-page queries with registry integration
  if (country) {
    const countryTLDs = {
      'Denmark': '.dk',
      'Germany': '.de',
      'France': '.fr',
      'Sweden': '.se',
      'Norway': '.no',
      'Netherlands': '.nl',
      'Spain': '.es',
      'Italy': '.it',
      'United Kingdom': '.co.uk',
      'United States': '.com',
      'Canada': '.ca',
      'Australia': '.au',
      'Japan': '.jp',
      'China': '.cn',
      'India': '.in'
    }
    
    const tld = countryTLDs[country]
    if (tld) {
      queries.push({
        query: `"${brand}" about site:*${tld}`,
        purpose: `find ${country} company About pages`,
        priority: 3,
        expected_sources: ['company websites']
      })
      
      // Enhanced About-page queries with registry integration
      if (country === 'Denmark') {
        queries.push({
          query: `"${brand}" about site:virk.dk`,
          purpose: 'find About page in Danish corporate registry',
          priority: 5,
          expected_sources: ['corporate registry', 'official filings']
        })
      }
    }
  }
  
  return queries
}

/**
 * Generate fallback templates for small companies and edge cases
 */
function generateFallbackTemplates(brand, product_name, hints, country) {
  const queries = []
  
  // ENHANCED: Industry-specific fallback terms
  const industryTerms = {
    food: ['food company', 'snack company', 'food manufacturer', 'snack manufacturer'],
    snacks: ['snack company', 'snack manufacturer', 'snack producer', 'snack brand'],
    automotive: ['car company', 'automotive company', 'vehicle manufacturer', 'auto company'],
    tech: ['tech company', 'software company', 'technology company', 'IT company'],
    retail: ['retail company', 'retailer', 'store chain', 'retail brand'],
    fashion: ['fashion company', 'clothing company', 'apparel company', 'fashion brand']
  }
  
  // ENHANCED: Country-specific translated terms
  const translatedTerms = {
    dk: ['dansk virksomhed', 'dansk selskab', 'dansk firma', 'dansk ejer'],
    no: ['norsk bedrift', 'norsk selskap', 'norsk firma', 'norsk eier'],
    se: ['svenskt företag', 'svenskt bolag', 'svenskt firma', 'svensk ägare'],
    de: ['deutsches Unternehmen', 'deutsche Firma', 'deutscher Inhaber'],
    fr: ['entreprise française', 'société française', 'propriétaire français'],
    uk: ['British company', 'UK company', 'British owner'],
    us: ['American company', 'US company', 'American owner']
  }
  
  // ENHANCED: Small company specific terms
  const smallCompanyTerms = [
    'corporate structure',
    'acquired by',
    'private equity',
    'founder',
    'owner',
    'annual report',
    'investor relations',
    'corporate governance',
    'board of directors',
    'shareholders',
    'subsidiary',
    'parent company',
    'holding company',
    'investment',
    'merger',
    'acquisition'
  ]
  
  // Add industry-specific queries
  if (hints.industry_hints && hints.industry_hints.length > 0) {
    hints.industry_hints.forEach(industry => {
      if (industryTerms[industry]) {
        industryTerms[industry].forEach(term => {
          queries.push({
            query: `"${brand}" ${term}`,
            purpose: `find ${brand} as ${industry} company`,
            priority: 3,
            expected_sources: ['industry directories', 'company websites']
          })
        })
      }
    })
  }
  
  // Add country-specific translated queries
  const countryCode = getCountryCode(country)
  if (countryCode && translatedTerms[countryCode]) {
    translatedTerms[countryCode].forEach(term => {
      queries.push({
        query: `"${brand}" ${term}`,
        purpose: `find ${brand} with ${country} language terms`,
        priority: 4,
        expected_sources: [`${country} business directories`, 'local websites']
      })
    })
  }
  
  // Add small company specific queries
  smallCompanyTerms.forEach(term => {
    queries.push({
      query: `"${brand}" ${term}`,
      purpose: `find ${brand} ${term} information`,
      priority: 3,
      expected_sources: ['company websites', 'financial filings', 'news articles']
    })
  })
  
  // Add product-specific queries if available
  if (product_name && product_name !== brand) {
    queries.push({
      query: `"${brand}" "${product_name}" owner`,
      purpose: `find owner of ${brand} ${product_name}`,
      priority: 4,
      expected_sources: ['company websites', 'product registrations']
    })
  }
  
  console.log(`[QueryBuilderAgent] Generated ${queries.length} fallback templates for country: ${country}`)
  return queries
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
 * Detect country from context hints
 */
function detectCountryFromContext(hints) {
  if (hints.country) return hints.country
  if (hints.country_guess) return hints.country_guess
  
  // Extract country from context string
  const context = hints.context || hints.followUpContext || ''
  const contextLower = context.toLowerCase()
  
  const countryIndicators = {
    dk: ['denmark', 'danish', 'dansk', 'copenhagen', 'københavn'],
    no: ['norway', 'norwegian', 'norsk', 'oslo'],
    se: ['sweden', 'swedish', 'svensk', 'stockholm'],
    fi: ['finland', 'finnish', 'suomi', 'helsinki'],
    de: ['germany', 'german', 'deutsch', 'berlin'],
    uk: ['united kingdom', 'british', 'england', 'london'],
    us: ['united states', 'american', 'usa', 'new york'],
    ca: ['canada', 'canadian', 'toronto'],
    au: ['australia', 'australian', 'sydney'],
    nz: ['new zealand', 'zealand', 'auckland']
  }
  
  for (const [country, indicators] of Object.entries(countryIndicators)) {
    if (indicators.some(indicator => contextLower.includes(indicator))) {
      return country
    }
  }
  
  return 'us' // Default to US if no country detected
}

/**
 * Detect language from context hints
 */
function detectLanguageFromContext(hints) {
  if (hints.language) return hints.language
  
  const country = detectCountryFromContext(hints)
  const languageMap = {
    dk: 'da', no: 'no', se: 'sv', fi: 'fi', de: 'de', uk: 'en', us: 'en', ca: 'en', au: 'en', nz: 'en'
  }
  
  return languageMap[country] || 'en'
}

/**
 * Remove duplicate queries based on query text
 */
function removeDuplicateQueries(queries) {
  const seen = new Set()
  return queries.filter(query => {
    const key = query.query.toLowerCase().trim()
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Generate fallback queries if LLM fails
 */
function generateFallbackQueries(brand, product_name, hints) {
  const queries = [
    {
      query: `"${brand}" parent company`,
      purpose: 'find parent company information',
      priority: 5,
      expected_sources: ['company websites', 'financial news']
    },
    {
      query: `"${brand}" ultimate owner`,
      purpose: 'find ultimate ownership',
      priority: 5,
      expected_sources: ['financial filings', 'corporate registries']
    }
  ]
  
  // Add country-specific queries if available
  if (hints.country_of_origin) {
    queries.push({
      query: `"${brand}" ${hints.country_of_origin}`,
      purpose: `find ${hints.country_of_origin} company information`,
      priority: 4,
      expected_sources: ['local registries', 'company websites']
    })
  }
  
  return queries
}

/**
 * Check if the QueryBuilderAgent is available and properly configured
 * @returns {boolean} True if the agent is available
 */
export function isQueryBuilderAvailable() {
  try {
    // Check if required environment variables are set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[QueryBuilderAgent] ANTHROPIC_API_KEY not configured')
      return false
    }
    
    // Check if Anthropic client can be initialized
    if (!anthropic) {
      console.warn('[QueryBuilderAgent] Anthropic client not initialized')
      return false
    }
    
    return true
  } catch (error) {
    console.error('[QueryBuilderAgent] Error checking availability:', error)
    return false
  }
}

/**
 * Get the current status of the QueryBuilderAgent
 * @returns {Object} Status object with availability and configuration details
 */
export function getQueryBuilderStatus() {
  return {
    available: isQueryBuilderAvailable(),
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    hasClient: !!anthropic,
    timestamp: new Date().toISOString()
  }
}

export default {
  QueryBuilderAgent
} 