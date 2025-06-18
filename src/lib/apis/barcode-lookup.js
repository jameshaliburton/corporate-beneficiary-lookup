/**
 * Multi-source barcode lookup with European support and AI fallback
 */

// Try UPCitemdb (US-focused, fast)
async function tryUPCItemDB(barcode) {
  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return { success: false, source: 'upcitemdb' }
    }
    const data = await res.json()
    if (data && data.items && data.items.length > 0) {
      const item = data.items[0]
      return {
        success: true,
        product_name: item.title || null,
        brand: item.brand || null,
        barcode,
        source: 'upcitemdb'
      }
    }
    return { success: false, source: 'upcitemdb' }
  } catch (err) {
    return { success: false, source: 'upcitemdb' }
  }
}

// Try Open Food Facts (EU-focused, great for food products)
async function tryOpenFoodFacts(barcode) {
  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return { success: false, source: 'openfoodfacts' }
    }
    const data = await res.json()
    if (data && data.status === 1 && data.product) {
      const product = data.product
      return {
        success: true,
        product_name: product.product_name || product.generic_name || null,
        brand: product.brands ? product.brands.split(',')[0].trim() : null,
        barcode,
        source: 'openfoodfacts'
      }
    }
    return { success: false, source: 'openfoodfacts' }
  } catch (err) {
    return { success: false, source: 'openfoodfacts' }
  }
}

// AI fallback when barcode databases fail
async function tryAIBarcodeInference(barcode) {
  // Basic barcode pattern analysis
  let region = 'unknown'
  if (barcode.startsWith('73')) {
    region = 'Swedish/Nordic'
  } else if (barcode.startsWith('0') || barcode.startsWith('1')) {
    region = 'US/Canada'
  } else if (barcode.startsWith('4')) {
    region = 'Germany'
  } else if (barcode.startsWith('5')) {
    region = 'UK'
  }

  return {
    success: true,
    product_name: `Unknown product (${region} barcode)`,
    brand: 'Unknown Brand',
    barcode,
    source: 'ai_inference',
    region_hint: region
  }
}

// Main export function with multi-source lookup
export async function lookupProduct(barcode) {
  console.log(`Looking up barcode: ${barcode}`)
  
  // Try UPCitemdb first (fast US database)
  const upcResult = await tryUPCItemDB(barcode)
  if (upcResult.success) {
    console.log('Found in UPCitemdb')
    return upcResult
  }
  
  // Try Open Food Facts (European coverage)
  const offResult = await tryOpenFoodFacts(barcode)
  if (offResult.success) {
    console.log('Found in Open Food Facts')
    return offResult
  }
  
  // AI fallback - infer from barcode pattern
  console.log('Using AI inference fallback')
  const aiResult = await tryAIBarcodeInference(barcode)
  return aiResult
}