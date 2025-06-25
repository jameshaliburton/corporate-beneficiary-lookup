/**
 * GS1 GEPIR (Global Electronic Party Information Registry) Lookup
 * Identifies the company that owns a barcode prefix
 * 
 * GEPIR API: https://gepir.gs1.org/index.php/search-by-gtin/
 * Note: Requires registration for API access
 */

// Extract prefix from barcode (first 7-9 digits)
function extractPrefix(barcode) {
  if (!barcode || barcode.length < 7) {
    return null
  }
  
  // For GTIN-13, prefix is typically 7-9 digits
  // For GTIN-12 (UPC), prefix is typically 6-8 digits
  const length = barcode.length
  
  if (length === 13) {
    // Try 7, 8, or 9 digit prefixes
    return barcode.substring(0, 7) // Start with 7 digits
  } else if (length === 12) {
    // UPC format
    return barcode.substring(0, 6) // Start with 6 digits
  } else if (length === 14) {
    // GTIN-14
    return barcode.substring(0, 8) // Start with 8 digits
  }
  
  return null
}

// Try GEPIR lookup for company information
export async function tryGEPIR(barcode) {
  try {
    const prefix = extractPrefix(barcode)
    if (!prefix) {
      return {
        success: false,
        source: 'gepir',
        reason: 'Invalid barcode format for prefix extraction'
      }
    }

    // GEPIR API endpoint (requires registration)
    // For now, we'll use a mock implementation
    // TODO: Replace with actual GEPIR API call when credentials are available
    
    // Mock GEPIR response for testing
    const mockGEPIRData = {
      '7318690': {
        companyName: 'ICA Sverige AB',
        country: 'SE',
        address: 'Solna, Sweden',
        gs1Member: true
      },
      '5000112': {
        companyName: 'Nestlé UK Ltd',
        country: 'GB',
        address: 'York, United Kingdom',
        gs1Member: true
      },
      '4007817': {
        companyName: 'Schwartau Werke GmbH & Co KG',
        country: 'DE',
        address: 'Bad Schwartau, Germany',
        gs1Member: true
      }
    }

    const companyInfo = mockGEPIRData[prefix]
    
    if (companyInfo) {
      return {
        success: true,
        source: 'gepir',
        company_name: companyInfo.companyName,
        country: companyInfo.country,
        address: companyInfo.address,
        gs1_member: companyInfo.gs1Member,
        prefix: prefix,
        barcode: barcode,
        raw_data: companyInfo
      }
    }

    // If no mock data, try actual GEPIR API (when available)
    // const gepirUrl = `https://gepir.gs1.org/api/v1/party/${prefix}`
    // const response = await fetch(gepirUrl, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.GEPIR_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   }
    // })
    
    // if (response.ok) {
    //   const data = await response.json()
    //   return {
    //     success: true,
    //     source: 'gepir',
    //     company_name: data.companyName,
    //     country: data.country,
    //     address: data.address,
    //     gs1_member: data.gs1Member,
    //     prefix: prefix,
    //     barcode: barcode,
    //     raw_data: data
    //   }
    // }

    return {
      success: false,
      source: 'gepir',
      reason: 'No company found for prefix',
      prefix: prefix
    }

  } catch (error) {
    console.error('GEPIR lookup error:', error)
    return {
      success: false,
      source: 'gepir',
      reason: 'API error',
      error: error.message
    }
  }
}

// Get country flag emoji from country code
export function getCountryFlag(countryCode) {
  const flagMap = {
    'SE': '🇸🇪',
    'GB': '🇬🇧',
    'DE': '🇩🇪',
    'US': '🇺🇸',
    'CA': '🇨🇦',
    'FR': '🇫🇷',
    'IT': '🇮🇹',
    'ES': '🇪🇸',
    'NL': '🇳🇱',
    'BE': '🇧🇪',
    'CH': '🇨🇭',
    'AT': '🇦🇹',
    'NO': '🇳🇴',
    'DK': '🇩🇰',
    'FI': '🇫🇮'
  }
  
  return flagMap[countryCode] || '🏳️'
} 