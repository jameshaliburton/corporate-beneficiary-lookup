/**
 * Google Shopping Reverse Search
 * Extracts product name/brand by searching barcode on Google Shopping
 * 
 * This is a last resort fallback when all other sources fail
 * Uses SerpAPI or similar service for structured results
 */

// Try Google Shopping search for barcode
export async function tryGoogleShopping(barcode) {
  try {
    // Check if we have SerpAPI key configured
    const serpApiKey = process.env.SERP_API_KEY
    
    if (!serpApiKey) {
      return {
        success: false,
        source: 'google_shopping',
        reason: 'No SerpAPI key configured'
      }
    }

    // SerpAPI Google Shopping search
    const searchUrl = `https://serpapi.com/search.json`
    const params = new URLSearchParams({
      engine: 'google_shopping',
      q: barcode,
      api_key: serpApiKey,
      num: 5 // Limit to 5 results
    })

    const response = await fetch(`${searchUrl}?${params}`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        source: 'google_shopping',
        reason: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    
    if (!data.shopping_results || data.shopping_results.length === 0) {
      return {
        success: false,
        source: 'google_shopping',
        reason: 'No shopping results found'
      }
    }

    // Extract product information from the first result
    const firstResult = data.shopping_results[0]
    
    let productName = null
    let brand = null
    let price = null
    let source = null
    
    if (firstResult.title) {
      productName = firstResult.title
    }
    
    if (firstResult.source) {
      source = firstResult.source
    }
    
    if (firstResult.price) {
      price = firstResult.price
    }
    
    // Try to extract brand from title or source
    if (firstResult.title) {
      // Common brand patterns
      const brandPatterns = [
        /^([A-Z][a-z]+)\s/, // Capitalized word at start
        /by\s+([A-Z][a-z]+)/i, // "by Brand"
        /from\s+([A-Z][a-z]+)/i, // "from Brand"
        /([A-Z][A-Z]+)\s/, // All caps brand
      ]
      
      for (const pattern of brandPatterns) {
        const match = firstResult.title.match(pattern)
        if (match && match[1]) {
          brand = match[1]
          break
        }
      }
    }

    return {
      success: true,
      source: 'google_shopping',
      product_name: productName,
      brand: brand,
      price: price,
      source_url: source,
      barcode: barcode,
      raw_data: data
    }

  } catch (error) {
    console.error('Google Shopping lookup error:', error)
    return {
      success: false,
      source: 'google_shopping',
      reason: 'API error',
      error: error.message
    }
  }
}

// Fallback: Try basic web search if SerpAPI is not available
export async function tryBasicWebSearch(barcode) {
  try {
    // This is a simplified fallback that doesn't require API keys
    // In a real implementation, you might use a different service
    
    // For now, return a basic inference based on barcode pattern
    const region = getBarcodeRegion(barcode)
    
    return {
      success: true,
      source: 'basic_web_search',
      product_name: `Product with ${barcode} (${region} region)`,
      brand: 'Unknown Brand',
      barcode: barcode,
      region_hint: region,
      confidence: 'low'
    }

  } catch (error) {
    console.error('Basic web search error:', error)
    return {
      success: false,
      source: 'basic_web_search',
      reason: 'Search error',
      error: error.message
    }
  }
}

// Helper function to determine barcode region
function getBarcodeRegion(barcode) {
  if (!barcode || barcode.length < 2) {
    return 'unknown'
  }
  
  const prefix = barcode.substring(0, 2)
  
  const regionMap = {
    '00': 'US/Canada',
    '01': 'US/Canada',
    '02': 'US/Canada',
    '03': 'US/Canada',
    '04': 'US/Canada',
    '05': 'US/Canada',
    '06': 'US/Canada',
    '07': 'US/Canada',
    '08': 'US/Canada',
    '09': 'US/Canada',
    '10': 'US/Canada',
    '11': 'US/Canada',
    '12': 'US/Canada',
    '13': 'US/Canada',
    '20': 'US/Canada',
    '21': 'US/Canada',
    '22': 'US/Canada',
    '23': 'US/Canada',
    '24': 'US/Canada',
    '25': 'US/Canada',
    '26': 'US/Canada',
    '27': 'US/Canada',
    '28': 'US/Canada',
    '29': 'US/Canada',
    '30': 'France',
    '31': 'France',
    '32': 'France',
    '33': 'France',
    '34': 'France',
    '35': 'France',
    '36': 'France',
    '37': 'France',
    '40': 'Germany',
    '41': 'Germany',
    '42': 'Germany',
    '43': 'Germany',
    '44': 'Germany',
    '45': 'Japan',
    '46': 'Russia',
    '47': 'Russia',
    '48': 'Russia',
    '49': 'Japan',
    '50': 'UK',
    '51': 'UK',
    '52': 'UK',
    '53': 'UK',
    '54': 'UK',
    '55': 'UK',
    '56': 'UK',
    '57': 'UK',
    '58': 'UK',
    '59': 'UK',
    '60': 'Australia',
    '61': 'Australia',
    '62': 'Australia',
    '63': 'Australia',
    '64': 'Australia',
    '65': 'Australia',
    '66': 'Australia',
    '67': 'Australia',
    '68': 'Australia',
    '69': 'Australia',
    '70': 'Norway',
    '71': 'Norway',
    '72': 'Norway',
    '73': 'Sweden',
    '74': 'Sweden',
    '75': 'Sweden',
    '76': 'Switzerland',
    '77': 'Switzerland',
    '78': 'Switzerland',
    '79': 'Switzerland',
    '80': 'Italy',
    '81': 'Italy',
    '82': 'Italy',
    '83': 'Italy',
    '84': 'Spain',
    '85': 'Spain',
    '86': 'Spain',
    '87': 'Spain',
    '88': 'Spain',
    '89': 'Spain',
    '90': 'Austria',
    '91': 'Austria',
    '92': 'Austria',
    '93': 'Austria',
    '94': 'Austria',
    '95': 'Austria',
    '96': 'Austria',
    '97': 'Austria',
    '98': 'Austria',
    '99': 'Austria'
  }
  
  return regionMap[prefix] || 'unknown'
} 