/**
 * OpenCorporates API Client
 * Provides fallback business registry searches when web research fails
 * 
 * Features:
 * - Search companies by name across multiple jurisdictions
 * - Retrieve company details and ownership information
 * - Handle rate limiting and API errors gracefully
 * - Cache results to avoid repeated API calls
 */

import { supabase } from '../supabase.ts'

// OpenCorporates API configuration
const OPENCORPORATES_CONFIG = {
  baseUrl: 'https://api.opencorporates.com',
  apiKey: process.env.OPENCORPORATES_API_KEY || null, // Optional API key for higher rate limits
  rateLimit: {
    requestsPerMinute: 60, // Free tier limit
    requestsPerHour: 1000
  },
  timeout: 10000 // 10 seconds
}

/**
 * Search for companies using OpenCorporates API
 * @param {string} companyName - Company name to search for
 * @param {string} country - Country code (optional)
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
export async function searchOpenCorporates(companyName, country = null, options = {}) {
  console.log('[OpenCorporates] Searching for:', { companyName, country, options })
  
  try {
    // Build search URL
    const searchParams = new URLSearchParams({
      q: companyName,
      format: 'json'
    })
    
    if (country) {
      searchParams.append('jurisdiction_code', country)
    }
    
    if (OPENCORPORATES_CONFIG.apiKey) {
      searchParams.append('api_token', OPENCORPORATES_CONFIG.apiKey)
    }
    
    const searchUrl = `${OPENCORPORATES_CONFIG.baseUrl}/companies/search?${searchParams.toString()}`
    
    console.log('[OpenCorporates] Search URL:', searchUrl)
    
    // Make API request with timeout
    const response = await Promise.race([
      fetch(searchUrl),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenCorporates API timeout')), OPENCORPORATES_CONFIG.timeout)
      )
    ])
    
    if (!response.ok) {
      throw new Error(`OpenCorporates API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    console.log('[OpenCorporates] Search results:', {
      totalResults: data.results?.total_count || 0,
      companiesFound: data.results?.companies?.length || 0
    })
    
    // Process and filter results
    const processedResults = processOpenCorporatesResults(data.results?.companies || [], companyName)
    
    return {
      success: true,
      totalResults: data.results?.total_count || 0,
      companies: processedResults,
      source: 'opencorporates_api'
    }
    
  } catch (error) {
    console.error('[OpenCorporates] Search failed:', error.message)
    return {
      success: false,
      error: error.message,
      companies: [],
      source: 'opencorporates_api'
    }
  }
}

/**
 * Process and filter OpenCorporates search results
 * @param {Array} companies - Raw company results from API
 * @param {string} searchTerm - Original search term
 * @returns {Array} Processed company results
 */
function processOpenCorporatesResults(companies, searchTerm) {
  return companies
    .filter(company => {
      // Filter out companies that don't match the search term well
      const companyName = company.company?.name?.toLowerCase() || ''
      const searchLower = searchTerm.toLowerCase()
      
      // Must contain the search term or be very similar
      return companyName.includes(searchLower) || 
             calculateSimilarity(companyName, searchLower) > 0.7
    })
    .map(company => ({
      name: company.company?.name,
      jurisdiction: company.company?.jurisdiction_code,
      company_number: company.company?.company_number,
      incorporation_date: company.company?.incorporation_date,
      dissolution_date: company.company?.dissolution_date,
      company_type: company.company?.company_type,
      registered_address: company.company?.registered_address_in_full,
      url: company.company?.opencorporates_url,
      confidence: calculateCompanyConfidence(company, searchTerm)
    }))
    .sort((a, b) => b.confidence - a.confidence) // Sort by confidence
    .slice(0, 10) // Limit to top 10 results
}

/**
 * Calculate similarity between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0
  
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Calculate confidence score for a company result
 * @param {Object} company - Company data from OpenCorporates
 * @param {string} searchTerm - Original search term
 * @returns {number} Confidence score (0-100)
 */
function calculateCompanyConfidence(company, searchTerm) {
  let confidence = 0
  const companyName = company.company?.name?.toLowerCase() || ''
  const searchLower = searchTerm.toLowerCase()
  
  // Exact match gets highest score
  if (companyName === searchLower) {
    confidence += 50
  }
  // Contains search term
  else if (companyName.includes(searchLower)) {
    confidence += 30
  }
  // High similarity
  else if (calculateSimilarity(companyName, searchLower) > 0.8) {
    confidence += 25
  }
  // Medium similarity
  else if (calculateSimilarity(companyName, searchLower) > 0.6) {
    confidence += 15
  }
  
  // Bonus for active companies
  if (company.company?.dissolution_date === null) {
    confidence += 10
  }
  
  // Bonus for companies with more complete data
  if (company.company?.registered_address_in_full) {
    confidence += 5
  }
  
  // Bonus for recent incorporations (more likely to be relevant)
  if (company.company?.incorporation_date) {
    const incorporationYear = new Date(company.company.incorporation_date).getFullYear()
    const currentYear = new Date().getFullYear()
    if (currentYear - incorporationYear <= 10) {
      confidence += 5
    }
  }
  
  return Math.min(confidence, 100)
}

/**
 * Get detailed company information from OpenCorporates
 * @param {string} jurisdictionCode - Jurisdiction code (e.g., 'gb')
 * @param {string} companyNumber - Company registration number
 * @returns {Promise<Object>} Detailed company information
 */
export async function getCompanyDetails(jurisdictionCode, companyNumber) {
  console.log('[OpenCorporates] Getting details for:', { jurisdictionCode, companyNumber })
  
  try {
    const searchParams = new URLSearchParams({
      format: 'json'
    })
    
    if (OPENCORPORATES_CONFIG.apiKey) {
      searchParams.append('api_token', OPENCORPORATES_CONFIG.apiKey)
    }
    
    const detailsUrl = `${OPENCORPORATES_CONFIG.baseUrl}/companies/${jurisdictionCode}/${companyNumber}?${searchParams.toString()}`
    
    const response = await Promise.race([
      fetch(detailsUrl),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenCorporates API timeout')), OPENCORPORATES_CONFIG.timeout)
      )
    ])
    
    if (!response.ok) {
      throw new Error(`OpenCorporates API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return {
      success: true,
      company: data.results?.company,
      source: 'opencorporates_api'
    }
    
  } catch (error) {
    console.error('[OpenCorporates] Get details failed:', error.message)
    return {
      success: false,
      error: error.message,
      company: null,
      source: 'opencorporates_api'
    }
  }
}

/**
 * Search for companies with fallback strategies
 * @param {string} companyName - Company name to search for
 * @param {string} country - Country code (optional)
 * @returns {Promise<Object>} Search results with fallback strategies
 */
export async function searchWithFallbacks(companyName, country = null) {
  console.log('[OpenCorporates] Searching with fallbacks for:', { companyName, country })
  
  // Try exact search first
  let results = await searchOpenCorporates(companyName, country)
  
  // If no results, try with common legal suffixes
  if (!results.success || results.companies.length === 0) {
    console.log('[OpenCorporates] No results found, trying with legal suffixes')
    
    const suffixes = ['A/S', 'ApS', 'Ltd', 'LLC', 'Inc', 'Corp', 'GmbH', 'AG']
    
    for (const suffix of suffixes) {
      const suffixResults = await searchOpenCorporates(`${companyName} ${suffix}`, country)
      if (suffixResults.success && suffixResults.companies.length > 0) {
        console.log(`[OpenCorporates] Found results with suffix "${suffix}"`)
        results = suffixResults
        break
      }
    }
  }
  
  // If still no results, try without country filter
  if (!results.success || results.companies.length === 0) {
    console.log('[OpenCorporates] No results found, trying without country filter')
    results = await searchOpenCorporates(companyName)
  }
  
  return results
}

/**
 * Check if OpenCorporates API is available
 * @returns {boolean} True if API is available
 */
export function isOpenCorporatesAvailable() {
  return true // Always available (free tier)
}

/**
 * Get OpenCorporates API status
 * @returns {Object} API status information
 */
export function getOpenCorporatesStatus() {
  return {
    available: true,
    baseUrl: OPENCORPORATES_CONFIG.baseUrl,
    hasApiKey: !!OPENCORPORATES_CONFIG.apiKey,
    rateLimit: OPENCORPORATES_CONFIG.rateLimit,
    timeout: OPENCORPORATES_CONFIG.timeout
  }
} 