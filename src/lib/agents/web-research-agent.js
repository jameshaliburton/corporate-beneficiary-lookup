/**
 * WebResearchAgent - Performs actual web research for corporate ownership
 * Uses real search APIs and web scraping to find current information
 */

import dotenv from 'dotenv'
import OpenAI from 'openai'

// Only load .env.local in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' })
}

// API Keys (you'll need to add these to .env.local)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || process.env.NEXT_PUBLIC_GOOGLE_CSE_ID
const OPENCORPORATES_API_KEY = process.env.OPENCORPORATES_API_KEY || process.env.NEXT_PUBLIC_OPENCORPORATES_API_KEY

// Simple in-memory cache
const searchCache = new Map()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Debug logging
console.log('[WebResearchAgent] Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  GOOGLE_API_KEY_EXISTS: !!GOOGLE_API_KEY,
  GOOGLE_CSE_ID_EXISTS: !!GOOGLE_CSE_ID,
  OPENCORPORATES_API_KEY_EXISTS: !!OPENCORPORATES_API_KEY,
  GOOGLE_API_KEY_LENGTH: GOOGLE_API_KEY?.length,
  GOOGLE_CSE_ID_LENGTH: GOOGLE_CSE_ID?.length,
  HAS_REGULAR_GOOGLE_KEY: !!process.env.GOOGLE_API_KEY,
  HAS_PUBLIC_GOOGLE_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
  HAS_REGULAR_CSE_ID: !!process.env.GOOGLE_CSE_ID,
  HAS_PUBLIC_CSE_ID: !!process.env.NEXT_PUBLIC_GOOGLE_CSE_ID
})

/**
 * WebResearchAgent - Performs actual web research
 * @param {Object} params
 * @param {string} params.brand - Brand name to research
 * @param {string} params.product_name - Product name (optional)
 * @param {Object} [params.hints] - Optional hints for research
 * @param {string} [params.hints.country_of_origin] - Country of origin
 * @param {string} [params.hints.website_url] - Known company website URL
 * @param {Object} [params.queryAnalysis] - Query analysis object
 * @returns {Promise<Object>} Web research results
 */
export async function WebResearchAgent({
  brand,
  product_name,
  hints = {},
  queryAnalysis = null
}) {
  console.log('[WebResearchAgent] Starting web research for:', { brand, product_name, hints })
  
  try {
    // Step 1: Generate smart search queries (use query analysis if available)
    let queries = []
    if (queryAnalysis && queryAnalysis.recommended_queries && queryAnalysis.recommended_queries.length > 0) {
      console.log(`[WebResearchAgent] Using query analysis with ${queryAnalysis.recommended_queries.length} queries`)
      queries = queryAnalysis.recommended_queries.slice(0, 8) // Limit to 8 queries
    } else {
      console.log(`[WebResearchAgent] Using default query generation`)
      queries = generateSmartQueries(brand, product_name, hints)
    }
    
    console.log(`[WebResearchAgent] Executing ${queries.length} smart search queries`)
    
    // Step 2: Perform web searches
    const searchResults = await performSmartWebSearches(brand, product_name, hints, queries)
    
    // Step 3: Prioritize and filter results
    const prioritizedResults = prioritizeSearchResults(searchResults, brand, hints)
    console.log(`[WebResearchAgent] Found ${prioritizedResults.length} prioritized search results`)
    
    // Step 4: Scrape relevant websites
    const scrapedData = await scrapeRelevantWebsites(prioritizedResults, brand)
    console.log(`[WebResearchAgent] Scraped ${scrapedData.length} high-priority websites`)
    
    // Step 5: Search business databases
    const businessData = await searchBusinessDatabases(brand, hints)
    console.log(`[WebResearchAgent] Found ${businessData.length} business database results`)
    
    // Step 6: Compile all results
    const results = compileResearchResults(searchResults, scrapedData, businessData)
    
    console.log('[WebResearchAgent] Research complete:', {
      success: results.success,
      sources: results.sources.length,
      findings: results.findings.length,
      total_sources: results.total_sources,
      search_results_count: results.search_results_count,
      scraped_sites_count: results.scraped_sites_count,
      business_databases_count: results.business_databases_count,
      average_priority_score: results.average_priority_score
    })
    
    return results
    
  } catch (error) {
    console.error('[WebResearchAgent] Research failed:', error)
    return {
      success: false,
      sources: [],
      findings: [],
      total_sources: 0,
      search_results_count: 0,
      scraped_sites_count: 0,
      business_databases_count: 0,
      average_priority_score: 0,
      error: error.message
    }
  }
}

/**
 * Generates smart search queries based on brand characteristics
 */
function generateSmartQueries(brand, product_name, hints) {
  const queries = []
  const cleanBrand = brand.replace(/[^\w\s]/g, '').trim()
  const country = hints.country_of_origin ? hints.country_of_origin.trim() : ''
  
  // Core ownership queries
  queries.push(
    `${cleanBrand} company ownership structure`,
    `${cleanBrand} parent company owner`,
    `${cleanBrand} corporate structure`,
    `${cleanBrand} company information`
  )
  
  // Business database queries
  queries.push(
    `${cleanBrand} bloomberg company profile`,
    `${cleanBrand} reuters company profile`,
    `${cleanBrand} opencorporates`,
    `${cleanBrand} company registration`
  )
  
  // Financial and regulatory queries
  queries.push(
    `${cleanBrand} annual report`,
    `${cleanBrand} investor relations`,
    `${cleanBrand} sec filing`,
    `${cleanBrand} merger acquisition`
  )
  
  // Add product-specific queries if available
  if (product_name) {
    const cleanProduct = product_name.replace(/[^\w\s]/g, '').trim()
    queries.push(
      `${cleanBrand} ${cleanProduct} manufacturer`,
      `who makes ${cleanBrand} ${cleanProduct}`
    )
  }
  
  // Add country-specific queries if available
  if (country && country.toLowerCase() !== 'unknown') {
    queries.push(
      `${cleanBrand} company registration ${country}`,
      `${cleanBrand} corporate headquarters ${country}`,
      `${cleanBrand} business registry ${country}`
    )
  }
  
  // Randomize and limit queries to avoid patterns
  return shuffleArray(queries).slice(0, 8)
}

// Fisher-Yates shuffle
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Performs smart web searches with optimized queries
 */
async function performSmartWebSearches(brand, product_name, hints, queries) {
  const searchResults = []
  const processedUrls = new Set()
  
  try {
    for (const query of queries) {
      try {
        // Check cache first
        const cacheKey = query.toLowerCase()
        const cachedResults = searchCache.get(cacheKey)
        
        if (cachedResults && (Date.now() - cachedResults.timestamp) < CACHE_TTL) {
          console.log(`[WebResearchAgent] Using cached results for query: "${query}"`)
          for (const result of cachedResults.results) {
            if (!processedUrls.has(result.url)) {
              searchResults.push(result)
              processedUrls.add(result.url)
            }
          }
          continue
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const results = await googleSearch(query)
        
        // Cache the results
        searchCache.set(cacheKey, {
          results: results,
          timestamp: Date.now()
        })
        
        // Add only unique URLs
        for (const result of results) {
          if (!processedUrls.has(result.url)) {
            searchResults.push(result)
            processedUrls.add(result.url)
          }
        }
      } catch (error) {
        console.log(`[WebResearchAgent] Search failed for query "${query}":`, error.message)
        if (error.message.includes('429')) {
          console.log('[WebResearchAgent] Rate limit reached, stopping further queries')
          break
        }
      }
    }
    
    // Prioritize and limit results
    const prioritizedResults = prioritizeSearchResults(searchResults, brand, hints)
    
    console.log(`[WebResearchAgent] Found ${prioritizedResults.length} prioritized search results`)
    return prioritizedResults
    
  } catch (error) {
    console.error('[WebResearchAgent] Web search error:', error)
    return []
  }
}

/**
 * Prioritizes search results based on relevance and source quality
 */
function prioritizeSearchResults(searchResults, brand, hints) {
  // Score each result
  const scoredResults = searchResults.map(result => {
    let score = 0
    const url = result.url.toLowerCase()
    const title = result.title.toLowerCase()
    const snippet = result.snippet?.toLowerCase() || ''
    
    // Prioritize business and financial sources
    if (url.includes('bloomberg.com')) score += 10
    if (url.includes('reuters.com')) score += 10
    if (url.includes('ft.com')) score += 10
    if (url.includes('wsj.com')) score += 10
    if (url.includes('sec.gov')) score += 15
    if (url.includes('opencorporates.com')) score += 15
    if (url.includes('dnb.com')) score += 10
    if (url.includes('zoominfo.com')) score += 8
    if (url.includes('crunchbase.com')) score += 8
    
    // Prioritize official sources
    if (url.includes(brand.toLowerCase())) score += 12
    if (url.includes('investor')) score += 5
    if (url.includes('about')) score += 3
    
    // Prioritize ownership-related content
    if (title.includes('ownership')) score += 8
    if (title.includes('parent company')) score += 8
    if (title.includes('acquisition')) score += 6
    if (snippet.includes('owned by')) score += 5
    if (snippet.includes('subsidiary')) score += 5
    
    return { ...result, score }
  })
  
  // Sort by score and return top results
  return scoredResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

/**
 * Performs a Google Custom Search with rate limiting and caching
 */
async function googleSearch(query) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    console.log('[WebResearchAgent] Google API keys not configured')
    return []
  }

  // Check cache first
  const cacheKey = `google_search:${query}`
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[WebResearchAgent] Using cached search results for:', query)
    return cached.results
  }

  try {
    // Add random delay between searches (2-4 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))

    const url = 'https://www.googleapis.com/customsearch/v1'
    const params = new URLSearchParams({
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CSE_ID,
      q: query,
      num: 10, // Reduced from default to stay within quota
      fields: 'items(title,link,snippet)',
      safe: 'active'
    })

    const response = await fetch(`${url}?${params}`)
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log('[WebResearchAgent] Google API rate limit reached')
        return []
      }
      throw new Error(`Google API failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      console.error('[WebResearchAgent] Google API error:', data.error)
      return []
    }

    const results = (data.items || []).map(item => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet
    }))

    // Cache the results
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      results
    })

    return results

  } catch (error) {
    console.error('[WebResearchAgent] Google search error:', error)
    return []
  }
}

/**
 * Scrapes relevant websites with smart content extraction
 */
async function scrapeRelevantWebsites(searchResults, brand) {
  const scrapedData = []
  
  console.log(`[WebResearchAgent] Scraping ${searchResults.length} high-priority websites`)
  
  for (const result of searchResults) {
    try {
      const scrapedContent = await scrapeWebsite(result.url, brand)
      if (scrapedContent) {
        // LLM summarize company info
        const llmSummary = await summarizeCompanyInfo(scrapedContent.content, result.url)
        scrapedData.push({
          url: result.url,
          title: result.title,
          content: scrapedContent.content,
          ownershipInfo: scrapedContent.ownershipInfo,
          llm_company_summary: llmSummary,
          source: 'web_scraping',
          priorityScore: result.score
        })
      }
    } catch (error) {
      console.log(`[WebResearchAgent] Failed to scrape ${result.url}:`, error.message)
    }
  }
  
  return scrapedData
}

/**
 * Smart website scraping with ownership information extraction
 */
async function scrapeWebsite(url, brand) {
  try {
    // Check if we should skip this domain
    const domain = new URL(url).hostname.toLowerCase()
    const skipDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com']
    
    if (skipDomains.some(skipDomain => domain.includes(skipDomain))) {
      console.log(`[WebResearchAgent] Skipping social media site: ${url}`)
      return null
    }

    // Add random delay to avoid rate limits (1-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/'
      },
      timeout: 15000,
      redirect: 'follow'
    })
    
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        console.log(`[WebResearchAgent] Rate limited or blocked by ${url}`)
        return null
      }
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('text/html')) {
      console.log(`[WebResearchAgent] Skipping non-HTML content from ${url}`)
      return null
    }

    const html = await response.text()
    
    // Enhanced paywall detection
    if (isPaywalled(html, domain)) {
      console.log(`[WebResearchAgent] Hit paywall on ${url}`)
      return null
    }
    
    // Extract text content
    const textContent = extractTextFromHTML(html)
    
    // Skip if content is too short
    if (textContent.length < 100) {
      console.log(`[WebResearchAgent] Content too short from ${url}`)
      return null
    }
    
    // Extract ownership information
    const ownershipInfo = extractOwnershipInfo(textContent, brand, url)
    
    if (ownershipInfo.hasOwnershipInfo) {
      return {
        content: textContent.substring(0, 3000),
        ownershipInfo: ownershipInfo
      }
    }
    
    return null
    
  } catch (error) {
    console.log(`[WebResearchAgent] Website scraping failed for ${url}:`, error.message)
    return null
  }
}

/**
 * Enhanced paywall detection for various news sites
 */
function isPaywalled(html, domain) {
  const content = html.toLowerCase()
  
  // Common paywall indicators
  const paywallIndicators = [
    'subscribe to read',
    'subscribe to continue',
    'paywall',
    'premium content',
    'members only',
    'login required',
    'sign in to read',
    'subscribe now',
    'premium article',
    'limited access',
    'free article limit reached',
    'upgrade to premium'
  ]
  
  // Check for paywall indicators
  const hasPaywallIndicator = paywallIndicators.some(indicator => 
    content.includes(indicator)
  )
  
  if (hasPaywallIndicator) {
    return true
  }
  
  // Domain-specific paywall detection
  if (domain.includes('bloomberg.com')) {
    return content.includes('subscribe') && (
      content.includes('article') || 
      content.includes('story') || 
      content.includes('news')
    )
  }
  
  if (domain.includes('reuters.com')) {
    return content.includes('subscribe') && (
      content.includes('article') || 
      content.includes('story')
    )
  }
  
  if (domain.includes('ft.com')) {
    return content.includes('subscribe') || content.includes('premium')
  }
  
  if (domain.includes('wsj.com')) {
    return content.includes('subscribe') || content.includes('premium')
  }
  
  // Check for login/signup forms that might indicate paywall
  const loginForms = content.includes('login') && (
    content.includes('form') || 
    content.includes('email') || 
    content.includes('password')
  )
  
  return loginForms
}

/**
 * Extracts text content from HTML with better cleaning
 */
function extractTextFromHTML(html) {
  // Remove scripts, styles, and other non-content elements
  let text = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>.*?<\/noscript>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
    
    // Remove common navigation and footer elements
    .replace(/<nav[^>]*>.*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>.*?<\/footer>/gi, '')
    .replace(/<header[^>]*>.*?<\/header>/gi, '')
    .replace(/<aside[^>]*>.*?<\/aside>/gi, '')
    
    // Remove HTML tags but preserve some structure
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
  
  return text
}

/**
 * Extracts ownership information from text content
 */
function extractOwnershipInfo(textContent, brand, url) {
  const content = textContent.toLowerCase()
  const cleanBrand = brand.toLowerCase().replace(/[^\w\s]/g, '')
  
  const ownershipInfo = {
    hasOwnershipInfo: false,
    parentCompany: null,
    ownershipType: null,
    headquarters: null,
    founded: null,
    confidence: 0
  }
  
  // Ownership patterns to look for
  const ownershipPatterns = [
    // Parent company patterns
    { pattern: /(?:parent company|owned by|subsidiary of|part of)\s*[:\-]?\s*([^.\n]+)/gi, type: 'parent' },
    { pattern: new RegExp(`([^.\n]+)\\s+(?:owns|acquired|purchased)\\s+${cleanBrand.replace(/\s+/g, '\\s+')}`, 'gi'), type: 'parent' },
    { pattern: new RegExp(`${cleanBrand.replace(/\s+/g, '\\s+')}\\s+is\\s+(?:a|an)\\s+([^.\n]+)`, 'gi'), type: 'subsidiary' },
    
    // Headquarters patterns
    { pattern: /headquarters?\s*[:\-]?\s*([^.\n]+)/gi, type: 'headquarters' },
    { pattern: /based\s+in\s+([^.\n]+)/gi, type: 'headquarters' },
    { pattern: /located\s+in\s+([^.\n]+)/gi, type: 'headquarters' },
    
    // Founded patterns
    { pattern: /founded\s+in\s+([^.\n]+)/gi, type: 'founded' },
    { pattern: /established\s+in\s+([^.\n]+)/gi, type: 'founded' },
    { pattern: /since\s+([^.\n]+)/gi, type: 'founded' }
  ]
  
  // Check for ownership keywords
  const ownershipKeywords = [
    'parent company', 'subsidiary', 'owned by', 'acquisition', 'merger',
    'corporate structure', 'ownership', 'headquarters', 'founded',
    'acquired', 'purchased', 'part of', 'division of'
  ]
  
  const hasOwnershipKeywords = ownershipKeywords.some(keyword => 
    content.includes(keyword)
  )
  
  if (hasOwnershipKeywords) {
    ownershipInfo.hasOwnershipInfo = true
    ownershipInfo.confidence = 60
    
    // Extract specific information using patterns
    ownershipPatterns.forEach(({ pattern, type }) => {
      const matches = content.match(pattern)
      if (matches) {
        const extracted = matches[0].replace(pattern, '$1').trim()
        if (extracted && extracted.length > 2 && extracted.length < 100) {
          switch (type) {
            case 'parent':
              ownershipInfo.parentCompany = extracted
              ownershipInfo.confidence += 20
              break
            case 'headquarters':
              ownershipInfo.headquarters = extracted
              ownershipInfo.confidence += 10
              break
            case 'founded':
              ownershipInfo.founded = extracted
              ownershipInfo.confidence += 5
              break
          }
        }
      }
    })
  }
  
  // Domain-specific confidence adjustments
  if (url.includes('linkedin.com/company')) ownershipInfo.confidence += 15
  if (url.includes('crunchbase.com')) ownershipInfo.confidence += 15
  if (url.includes('wikipedia.org')) ownershipInfo.confidence += 10
  if (url.includes('sec.gov')) ownershipInfo.confidence += 20
  
  return ownershipInfo
}

/**
 * Searches business databases
 */
async function searchBusinessDatabases(brand, hints) {
  const businessData = []
  
  try {
    // Search OpenCorporates if API key is available
    if (OPENCORPORATES_API_KEY) {
      const openCorporatesData = await searchOpenCorporates(brand, hints)
      if (openCorporatesData) {
        businessData.push(openCorporatesData)
      }
    }
    
    // Could add other business databases here
    // - Bloomberg API
    // - Crunchbase API
    // - SEC EDGAR API
    
  } catch (error) {
    console.error('[WebResearchAgent] Business database search error:', error)
  }
  
  return businessData
}

/**
 * Searches OpenCorporates database
 */
async function searchOpenCorporates(brand, hints) {
  try {
    if (!OPENCORPORATES_API_KEY) {
      console.log('[WebResearchAgent] OpenCorporates API key not configured')
      return null
    }

    // Rate limiting - check if we've made too many requests recently
    const now = Date.now()
    const lastRequestTime = searchOpenCorporates.lastRequestTime || 0
    const minInterval = 1000 // 1 second between requests
    
    if (now - lastRequestTime < minInterval) {
      const waitTime = minInterval - (now - lastRequestTime)
      console.log(`[WebResearchAgent] Rate limiting OpenCorporates request, waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    searchOpenCorporates.lastRequestTime = Date.now()

    const query = hints.country_of_origin 
      ? `${brand} ${hints.country_of_origin}`
      : brand
    
    const url = `https://api.opencorporates.com/v0.4/companies/search`
    const params = new URLSearchParams({
      q: query,
      order: 'score',
      fields: 'company_name,company_number,jurisdiction_code,incorporation_date,company_type,registry_url,current_status'
    })
    
    console.log(`[WebResearchAgent] Searching OpenCorporates for: ${query}`)
    
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Token token=${OPENCORPORATES_API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'Corporate-Beneficiary-Research/1.0'
      },
      timeout: 10000 // 10 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[WebResearchAgent] OpenCorporates API error: ${response.status} ${response.statusText}`)
      console.error(`[WebResearchAgent] Error details: ${errorText}`)
      
      if (response.status === 401) {
        console.error('[WebResearchAgent] OpenCorporates API authentication failed. Check API key.')
        return null
      } else if (response.status === 429) {
        console.error('[WebResearchAgent] OpenCorporates API rate limit exceeded')
        return null
      } else if (response.status >= 500) {
        console.error('[WebResearchAgent] OpenCorporates API server error')
        return null
      }
      
      throw new Error(`OpenCorporates API failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (data.results && data.results.companies && data.results.companies.length > 0) {
      const company = data.results.companies[0].company
      console.log(`[WebResearchAgent] Found OpenCorporates company: ${company.name}`)
      return {
        name: company.name,
        jurisdiction: company.jurisdiction_code,
        incorporation_date: company.incorporation_date,
        company_number: company.company_number,
        company_type: company.company_type,
        registry_url: company.registry_url,
        current_status: company.current_status,
        source: 'opencorporates',
        url: company.opencorporates_url
      }
    } else {
      console.log(`[WebResearchAgent] No OpenCorporates results found for: ${query}`)
    }
    
    return null
    
  } catch (error) {
    console.error('[WebResearchAgent] OpenCorporates search error:', error)
    
    // Don't throw the error, just return null to continue with other sources
    return null
  }
}

/**
 * Removes duplicate search results
 */
function removeDuplicateResults(results) {
  const seen = new Set()
  return results.filter(result => {
    const key = result.url
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Compiles all research results into a structured format
 */
function compileResearchResults(searchResults, scrapedData, businessData) {
  const findings = []
  
  // Add search results
  searchResults.forEach(result => {
    findings.push({
      type: 'search_result',
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      source: result.source,
      priorityScore: result.score
    })
  })
  
  // Add scraped data
  scrapedData.forEach(data => {
    findings.push({
      type: 'scraped_content',
      title: data.title,
      url: data.url,
      content: data.content.substring(0, 800) + '...',
      ownershipInfo: data.ownershipInfo,
      source: data.source,
      priorityScore: data.priorityScore
    })
  })
  
  // Add business database data
  businessData.forEach(data => {
    findings.push({
      type: 'business_data',
      name: data.name,
      jurisdiction: data.jurisdiction,
      incorporation_date: data.incorporation_date,
      url: data.url,
      source: data.source
    })
  })
  
  return {
    success: true,
    sources: findings.map(f => f.url || f.source).filter(Boolean),
    findings: findings,
    total_sources: findings.length,
    search_results_count: searchResults.length,
    scraped_sites_count: scrapedData.length,
    business_databases_count: businessData.length,
    average_priority_score: searchResults.length > 0 
      ? searchResults.reduce((sum, r) => sum + (r.score || 0), 0) / searchResults.length 
      : 0
  }
}

/**
 * Helper function to check if web research is available
 */
export function isWebResearchAvailable() {
  const available = !!(GOOGLE_API_KEY && GOOGLE_CSE_ID)
  console.log('[WebResearchAgent] Web research available:', available, {
    hasGoogleKey: !!GOOGLE_API_KEY,
    hasGoogleCseId: !!GOOGLE_CSE_ID
  })
  return available
}

/**
 * Helper function to get required environment variables
 */
export function getRequiredEnvVars() {
  return {
    GOOGLE_API_KEY: !!GOOGLE_API_KEY,
    GOOGLE_CSE_ID: !!GOOGLE_CSE_ID,
    OPENCORPORATES_API_KEY: !!OPENCORPORATES_API_KEY
  }
}

// Add helper to summarize company info using LLM
async function summarizeCompanyInfo(text, url) {
  if (!text || text.length < 100) return null;
  try {
    const prompt = `You are a company information extraction agent. Given the following text from a company's website (possibly from an About, Company, or Footer page), extract the most likely company name, a one-sentence summary of what the company does, and any parent/ownership info if present. If no company name is found, return null for company. Respond in JSON:
{
  "company_name": string | null,
  "summary": string,
  "parent_company": string | null
}

Text:
"""
${text.substring(0, 3500)}
"""`;
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a company info extraction agent.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.2
    });
    const result = response.choices[0].message.content;
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[WebResearchAgent] LLM summarization failed:', e);
    return null;
  }
} 