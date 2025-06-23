/**
 * Multi-source barcode lookup with European support and AI fallback
 */
import { supabase } from '@/lib/supabase'
import { AgentOwnershipResearch } from '../agents/ownership-research-agent.js'

// Try ownership mappings database for brand-based ownership lookup
async function tryOwnershipMappings(brand) {
  try {
    if (!brand) {
      return { success: false, source: 'ownership_mappings' }
    }

    // Search ownership_mappings table for brand match (case-insensitive)
    const { data, error } = await supabase
      .from('ownership_mappings')
      .select('*')
      .ilike('brand_name', `%${brand}%`)
      .maybeSingle()
    
    if (error) {
      console.error('Ownership mappings lookup error:', error)
      return { success: false, source: 'ownership_mappings' }
    }
    
    if (data) {
      // Build ownership flow array
      const ownership_flow = [
        data.brand_name,
        data.regional_entity,
        data.intermediate_entity,
        data.ultimate_owner_name
      ].filter(Boolean) // Remove null/undefined values
      
      return {
        success: true,
        financial_beneficiary: data.ultimate_owner_name,
        beneficiary_country: data.ultimate_owner_country,
        beneficiary_flag: data.ultimate_owner_flag,
        ownership_flow,
        source: 'ownership_mappings',
        result_type: 'static-ownership-mapping'
      }
    }
    
    return { success: false, source: 'ownership_mappings' }
  } catch (err) {
    console.error('Ownership mappings lookup error:', err)
    return { success: false, source: 'ownership_mappings' }
  }
}

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
export async function lookupProduct(barcode, userData = null) {
  console.log(`Looking up barcode: ${barcode}`, userData ? `with user data: ${JSON.stringify(userData)}` : '')
  
  // If user data is provided, use it directly
  if (userData && userData.product_name && userData.brand) {
    console.log('Using user-contributed data for lookup')
    
    // Step 1: Try ownership mappings first
    console.log('Trying ownership mappings for user-provided brand:', userData.brand)
    const ownershipResult = await tryOwnershipMappings(userData.brand)
    
    if (ownershipResult.success) {
      console.log('Found ownership mapping for user-provided brand')
      return {
        success: true,
        product_name: userData.product_name,
        brand: userData.brand,
        barcode,
        financial_beneficiary: ownershipResult.financial_beneficiary,
        beneficiary_country: ownershipResult.beneficiary_country,
        beneficiary_flag: ownershipResult.beneficiary_flag,
        ownership_flow: ownershipResult.ownership_flow,
        source: 'user_contribution + ownership_mappings',
        result_type: 'user_contributed_with_mapping',
        user_contributed: true
      }
    }
    
    // Step 2: If ownership mappings fail, invoke AgentOwnershipResearch
    console.log('Ownership mappings failed, invoking AgentOwnershipResearch')
    try {
      const agentResult = await AgentOwnershipResearch({
        barcode,
        product_name: userData.product_name,
        brand: userData.brand,
        hints: {
          country_of_origin: userData.region_hint
        }
      })
      
      console.log('AgentOwnershipResearch result:', agentResult)
      
      return {
        success: true,
        product_name: userData.product_name,
        brand: userData.brand,
        barcode,
        financial_beneficiary: agentResult.financial_beneficiary,
        beneficiary_country: agentResult.beneficiary_country,
        beneficiary_flag: agentResult.beneficiary_flag,
        ownership_structure_type: agentResult.ownership_structure_type,
        confidence_score: agentResult.confidence_score,
        ownership_flow: agentResult.ownership_flow,
        sources: agentResult.sources,
        reasoning: agentResult.reasoning,
        source: 'user_contribution + agent_research',
        result_type: 'agent-inferred',
        user_contributed: true
      }
    } catch (agentError) {
      console.error('AgentOwnershipResearch failed:', agentError)
      
      // Return user data with unknown ownership
      return {
        success: true,
        product_name: userData.product_name,
        brand: userData.brand,
        barcode,
        financial_beneficiary: null,
        beneficiary_country: null,
        confidence_score: 0,
        ownership_structure_type: null,
        source: 'user_contribution',
        result_type: 'user_contributed_no_match',
        user_contributed: true
      }
    }
  }
  
  // Stage 1: Check products table for exact barcode match
  const { data: cached, error: cacheError } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle()
  
  if (cacheError) {
    console.error('Products table lookup error:', cacheError)
  } else if (cached) {
    console.log('Found exact match in products table')
    return {
      success: true,
      product_name: cached.product_name,
      brand: cached.brand,
      barcode,
      financial_beneficiary: cached.financial_beneficiary,
      beneficiary_country: cached.beneficiary_country,
      confidence_score: cached.confidence_score,
      ownership_structure_type: cached.ownership_structure_type,
      source: 'products_cache',
      result_type: 'cached'
    }
  }
  
  // Stage 2: Query external APIs for product info
  let productInfo = null
  
  // Try UPCitemdb first (fast US database)
  const upcResult = await tryUPCItemDB(barcode)
  if (upcResult.success) {
    console.log('Found in UPCitemdb')
    productInfo = upcResult
  } else {
    // Try Open Food Facts (European coverage)
    const offResult = await tryOpenFoodFacts(barcode)
    if (offResult.success) {
      console.log('Found in Open Food Facts')
      productInfo = offResult
    } else {
      // AI fallback - infer from barcode pattern
      console.log('Using AI inference fallback')
      productInfo = await tryAIBarcodeInference(barcode)
    }
  }
  
  // Stage 3: Try ownership mappings if we have a brand
  if (productInfo && productInfo.brand) {
    console.log('Trying ownership mappings for brand:', productInfo.brand)
    const ownershipResult = await tryOwnershipMappings(productInfo.brand)
    
    if (ownershipResult.success) {
      // Merge product info with ownership data
      return {
        ...productInfo,
        financial_beneficiary: ownershipResult.financial_beneficiary,
        beneficiary_country: ownershipResult.beneficiary_country,
        beneficiary_flag: ownershipResult.beneficiary_flag,
        ownership_flow: ownershipResult.ownership_flow,
        result_type: ownershipResult.result_type
      }
    }
  }
  
  // Stage 4: Return product info without ownership (will trigger AI agent in route.ts)
  return {
    ...productInfo,
    result_type: 'external_api_only'
  }
}