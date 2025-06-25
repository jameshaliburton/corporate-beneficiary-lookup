/**
 * Wikidata Lookup for GTIN-13 and brand information
 * Uses Wikidata's SPARQL endpoint to find product/brand data
 * 
 * Wikidata SPARQL: https://query.wikidata.org/
 * GTIN-13 property: wdt:P3960
 */

// Try Wikidata lookup for product/brand information
export async function tryWikidata(barcode) {
  try {
    // Wikidata SPARQL endpoint
    const sparqlEndpoint = 'https://query.wikidata.org/sparql'
    
    // SPARQL query to find items with the given GTIN-13
    const sparqlQuery = `
      SELECT ?item ?itemLabel ?brand ?brandLabel ?instance ?instanceLabel
      WHERE {
        ?item wdt:P3960 "${barcode}" .
        OPTIONAL { ?item wdt:P171 ?brand . }
        OPTIONAL { ?item wdt:P31 ?instance . }
        SERVICE wikibase:label { 
          bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" . 
        }
      }
      LIMIT 10
    `

    const url = `${sparqlEndpoint}?query=${encodeURIComponent(sparqlQuery)}&format=json`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'OwnedBy/1.0 (https://ownedby.app; contact@ownedby.app)'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        source: 'wikidata',
        reason: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    
    if (!data.results || !data.results.bindings || data.results.bindings.length === 0) {
      return {
        success: false,
        source: 'wikidata',
        reason: 'No results found for GTIN'
      }
    }

    const result = data.results.bindings[0]
    
    // Extract product name and brand
    let productName = null
    let brand = null
    let instanceType = null
    
    if (result.itemLabel && result.itemLabel.value) {
      productName = result.itemLabel.value
    }
    
    if (result.brandLabel && result.brandLabel.value) {
      brand = result.brandLabel.value
    }
    
    if (result.instanceLabel && result.instanceLabel.value) {
      instanceType = result.instanceLabel.value
    }

    // If we found a brand but no product name, try to get more info
    if (brand && !productName) {
      // Try to get product name from the item itself
      const productQuery = `
        SELECT ?itemLabel ?description
        WHERE {
          wd:${result.item.value.replace('http://www.wikidata.org/entity/', '')} rdfs:label ?itemLabel .
          OPTIONAL { wd:${result.item.value.replace('http://www.wikidata.org/entity/', '')} schema:description ?description . }
          FILTER(LANG(?itemLabel) = "en")
        }
        LIMIT 1
      `
      
      try {
        const productUrl = `${sparqlEndpoint}?query=${encodeURIComponent(productQuery)}&format=json`
        const productResponse = await fetch(productUrl, {
          headers: {
            'Accept': 'application/sparql-results+json',
            'User-Agent': 'OwnedBy/1.0 (https://ownedby.app; contact@ownedby.app)'
          }
        })
        
        if (productResponse.ok) {
          const productData = await productResponse.json()
          if (productData.results && productData.results.bindings && productData.results.bindings.length > 0) {
            const productResult = productData.results.bindings[0]
            if (productResult.itemLabel && productResult.itemLabel.value) {
              productName = productResult.itemLabel.value
            }
          }
        }
      } catch (productError) {
        console.warn('Failed to get additional product info from Wikidata:', productError)
      }
    }

    return {
      success: true,
      source: 'wikidata',
      product_name: productName,
      brand: brand,
      instance_type: instanceType,
      barcode: barcode,
      wikidata_id: result.item ? result.item.value.replace('http://www.wikidata.org/entity/', '') : null,
      raw_data: data
    }

  } catch (error) {
    console.error('Wikidata lookup error:', error)
    return {
      success: false,
      source: 'wikidata',
      reason: 'API error',
      error: error.message
    }
  }
}

// Try to find brand information by searching Wikidata
export async function tryWikidataBrandSearch(brandName) {
  try {
    const sparqlEndpoint = 'https://query.wikidata.org/sparql'
    
    // Search for brands with similar names
    const sparqlQuery = `
      SELECT ?brand ?brandLabel ?country ?countryLabel ?website ?websiteLabel
      WHERE {
        ?brand wdt:P31 wd:Q431289 .  # Instance of brand
        ?brand rdfs:label ?brandLabel .
        FILTER(CONTAINS(LCASE(?brandLabel), LCASE("${brandName}")))
        OPTIONAL { ?brand wdt:P17 ?country . }
        OPTIONAL { ?brand wdt:P856 ?website . }
        SERVICE wikibase:label { 
          bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" . 
        }
      }
      LIMIT 5
    `

    const url = `${sparqlEndpoint}?query=${encodeURIComponent(sparqlQuery)}&format=json`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'OwnedBy/1.0 (https://ownedby.app; contact@ownedby.app)'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        source: 'wikidata_brand',
        reason: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    
    if (!data.results || !data.results.bindings || data.results.bindings.length === 0) {
      return {
        success: false,
        source: 'wikidata_brand',
        reason: 'No brand found'
      }
    }

    const result = data.results.bindings[0]
    
    return {
      success: true,
      source: 'wikidata_brand',
      brand_name: result.brandLabel ? result.brandLabel.value : null,
      country: result.countryLabel ? result.countryLabel.value : null,
      website: result.websiteLabel ? result.websiteLabel.value : null,
      wikidata_id: result.brand ? result.brand.value.replace('http://www.wikidata.org/entity/', '') : null,
      raw_data: data
    }

  } catch (error) {
    console.error('Wikidata brand search error:', error)
    return {
      success: false,
      source: 'wikidata_brand',
      reason: 'API error',
      error: error.message
    }
  }
} 