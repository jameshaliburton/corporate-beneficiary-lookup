/**
 * Looks up product information by barcode using the UPCitemdb API.
 * @param {string} barcode
 * @returns {Promise<Object>} Structured product data
 */
export async function lookupProduct(barcode) {
  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return {
        success: false,
        error: `API error: ${res.status} ${res.statusText}`,
        barcode,
        source: 'upcitemdb'
      }
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
    } else {
      return {
        success: false,
        error: 'No product found for this barcode',
        barcode,
        source: 'upcitemdb'
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      barcode,
      source: 'upcitemdb'
    }
  }
} 