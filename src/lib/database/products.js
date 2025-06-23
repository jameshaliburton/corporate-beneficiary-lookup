import { supabase } from '../supabase.ts'

/**
 * Products Database Operations
 * Handles product scan history, user contributions, and ownership tracking
 */

export async function checkBarcodeExists(barcode) {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('barcode', barcode)
    .maybeSingle()
  if (error) {
    console.error('Error checking barcode existence:', error)
    throw error
  }
  return !!data
}

export async function insertProduct(productData) {
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .maybeSingle()
  if (error) {
    console.error('Error inserting product:', error)
    throw error
  }
  return data
}

/**
 * Get product by barcode
 */
export async function getProductByBarcode(barcode) {
  try {
    if (!barcode) return null
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .limit(1)
    
    if (error) {
      console.error('[Products] Get by barcode error:', error)
      return null
    }
    
    return data && data.length > 0 ? data[0] : null
    
  } catch (error) {
    console.error('[Products] Get by barcode error:', error)
    return null
  }
}

export async function logScan(barcode, resultType) {
  const { data, error } = await supabase
    .from('scan_logs')
    .insert({ barcode, result_type: resultType })
    .select()
    .maybeSingle()
  if (error) {
    console.error('Error logging scan:', error)
    throw error
  }
  return data
}

/**
 * Create or update product record
 */
export async function upsertProduct(productData) {
  try {
    const { data, error } = await supabase
      .from('products')
      .upsert([productData], { onConflict: 'barcode' })
      .select()
    
    if (error) {
      console.error('[Products] Upsert error:', error)
      return { success: false, error }
    }
    
    console.log('[Products] Product upserted:', data[0])
    return { success: true, data: data[0] }
    
  } catch (error) {
    console.error('[Products] Upsert error:', error)
    return { success: false, error }
  }
}

/**
 * Update product ownership information
 */
export async function updateProductOwnership(barcode, ownershipData) {
  try {
    const updateData = {
      financial_beneficiary: ownershipData.financial_beneficiary,
      beneficiary_country: ownershipData.beneficiary_country,
      beneficiary_flag: ownershipData.beneficiary_flag,
      ownership_structure_type: ownershipData.ownership_structure_type,
      confidence_score: ownershipData.confidence_score,
      ownership_flow: ownershipData.ownership_flow,
      sources: ownershipData.sources,
      reasoning: ownershipData.reasoning,
      web_research_used: ownershipData.web_research_used,
      web_sources_count: ownershipData.web_sources_count,
      query_analysis_used: ownershipData.query_analysis_used,
      static_mapping_used: ownershipData.static_mapping_used,
      result_type: ownershipData.result_type,
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('barcode', barcode)
      .select()
    
    if (error) {
      console.error('[Products] Update ownership error:', error)
      return { success: false, error }
    }
    
    if (data && data.length > 0) {
      console.log('[Products] Ownership updated:', data[0])
      return { success: true, data: data[0] }
    } else {
      console.log('[Products] No product found to update for barcode:', barcode)
      return { success: false, error: 'Product not found' }
    }
    
  } catch (error) {
    console.error('[Products] Update ownership error:', error)
    return { success: false, error }
  }
}

/**
 * Mark product as user contributed
 */
export async function markProductAsUserContributed(barcode, userContribution) {
  try {
    const updateData = {
      user_contributed: true,
      inferred: false,
      financial_beneficiary: userContribution.financial_beneficiary,
      beneficiary_country: userContribution.beneficiary_country,
      beneficiary_flag: userContribution.beneficiary_flag,
      ownership_structure_type: userContribution.ownership_structure_type,
      confidence_score: 100, // User contributions are 100% confident
      ownership_flow: userContribution.ownership_flow,
      sources: ['User contribution'],
      reasoning: userContribution.reasoning || 'User provided ownership information',
      web_research_used: false,
      web_sources_count: 0,
      query_analysis_used: false,
      static_mapping_used: false,
      result_type: 'user_contribution',
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('barcode', barcode)
      .select()
    
    if (error) {
      console.error('[Products] Mark user contributed error:', error)
      return { success: false, error }
    }
    
    if (data && data.length > 0) {
      console.log('[Products] Marked as user contributed:', data[0])
      return { success: true, data: data[0] }
    } else {
      console.log('[Products] No product found to mark as user contributed for barcode:', barcode)
      return { success: false, error: 'Product not found' }
    }
    
  } catch (error) {
    console.error('[Products] Mark user contributed error:', error)
    return { success: false, error }
  }
}

/**
 * Get all products
 */
export async function getAllProducts(limit = 100, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('[Products] Get all error:', error)
      return { success: false, error, data: [] }
    }
    
    return { success: true, data: data || [] }
    
  } catch (error) {
    console.error('[Products] Get all products error:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Search products
 */
export async function searchProducts(query, limit = 50) {
  try {
    if (!query) return { success: true, data: [] }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`product_name.ilike.%${query}%,brand.ilike.%${query}%,financial_beneficiary.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('[Products] Search error:', error)
      return { success: false, error, data: [] }
    }
    
    return { success: true, data: data || [] }
    
  } catch (error) {
    console.error('[Products] Search products error:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Get products by beneficiary country
 */
export async function getProductsByCountry(country, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('beneficiary_country', country)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('[Products] Get by country error:', error)
      return { success: false, error, data: [] }
    }
    
    return { success: true, data: data || [] }
    
  } catch (error) {
    console.error('[Products] Get by country error:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Get products by result type
 */
export async function getProductsByResultType(resultType, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('result_type', resultType)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('[Products] Get by result type error:', error)
      return { success: false, error, data: [] }
    }
    
    return { success: true, data: data || [] }
    
  } catch (error) {
    console.error('[Products] Get by result type error:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Get product statistics
 */
export async function getProductStats() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('beneficiary_country, result_type, user_contributed, inferred')
    
    if (error) {
      console.error('[Products] Get stats error:', error)
      return { success: false, error }
    }
    
    const stats = {
      total: data.length,
      byCountry: {},
      byResultType: {},
      userContributed: 0,
      inferred: 0,
      byConfidence: {
        high: 0,    // 80-100
        medium: 0,  // 50-79
        low: 0      // 0-49
      }
    }
    
    data.forEach(product => {
      // Count by country
      const country = product.beneficiary_country || 'Unknown'
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1
      
      // Count by result type
      const resultType = product.result_type || 'unknown'
      stats.byResultType[resultType] = (stats.byResultType[resultType] || 0) + 1
      
      // Count user contributions
      if (product.user_contributed) stats.userContributed++
      if (product.inferred) stats.inferred++
      
      // Count by confidence
      const confidence = product.confidence_score || 0
      if (confidence >= 80) stats.byConfidence.high++
      else if (confidence >= 50) stats.byConfidence.medium++
      else stats.byConfidence.low++
    })
    
    return { success: true, stats }
    
  } catch (error) {
    console.error('[Products] Get stats error:', error)
    return { success: false, error }
  }
}

/**
 * Get recent scans
 */
export async function getRecentScans(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('[Products] Get recent scans error:', error)
      return { success: false, error, data: [] }
    }
    
    return { success: true, data: data || [] }
    
  } catch (error) {
    console.error('[Products] Get recent scans error:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Delete product
 */
export async function deleteProduct(barcode) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('barcode', barcode)
    
    if (error) {
      console.error('[Products] Delete error:', error)
      return { success: false, error }
    }
    
    console.log('[Products] Deleted product with barcode:', barcode)
    return { success: true }
    
  } catch (error) {
    console.error('[Products] Delete product error:', error)
    return { success: false, error }
  }
}

/**
 * Validate product data
 */
export function validateProductData(productData) {
  const errors = []
  
  if (!productData.barcode || productData.barcode.trim().length === 0) {
    errors.push('Barcode is required')
  }
  
  if (!productData.product_name || productData.product_name.trim().length === 0) {
    errors.push('Product name is required')
  }
  
  if (!productData.brand || productData.brand.trim().length === 0) {
    errors.push('Brand is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Convert ownership result to product data
 */
export function ownershipResultToProductData(barcode, productName, brand, ownershipResult) {
  return {
    barcode,
    product_name: productName,
    brand,
    financial_beneficiary: ownershipResult.financial_beneficiary,
    beneficiary_country: ownershipResult.beneficiary_country,
    beneficiary_flag: ownershipResult.beneficiary_flag,
    ownership_structure_type: ownershipResult.ownership_structure_type,
    confidence_score: ownershipResult.confidence_score,
    ownership_flow: ownershipResult.ownership_flow,
    sources: ownershipResult.sources,
    reasoning: ownershipResult.reasoning,
    web_research_used: ownershipResult.web_research_used,
    web_sources_count: ownershipResult.web_sources_count,
    query_analysis_used: ownershipResult.query_analysis_used,
    static_mapping_used: ownershipResult.static_mapping_used,
    result_type: ownershipResult.result_type,
    user_contributed: false,
    inferred: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
} 