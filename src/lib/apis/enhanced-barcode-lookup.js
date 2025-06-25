/**
 * Enhanced Barcode Lookup Pipeline
 * 
 * Multi-source barcode lookup with modular fallback system:
 * 1. Supabase cache
 * 2. UPCitemdb
 * 3. Open Food Facts
 * 4. Wikidata (GTIN match)
 * 5. GS1 GEPIR (prefix-based)
 * 6. Google Shopping fallback
 * 7. AI inference
 */

import { supabase } from '../supabase.ts'
import { EnhancedAgentOwnershipResearch } from '../agents/enhanced-ownership-research-agent.js'
import { tryGEPIR, getCountryFlag } from './gepir-lookup.js'
import { tryWikidata, tryWikidataBrandSearch } from './wikidata-lookup.js'
import { tryGoogleShopping, tryBasicWebSearch } from './google-shopping-lookup.js'

// Common result format for all lookup sources
const createLookupResult = (data) => ({
  product_name: data.product_name || null,
  brand: data.brand || null,
  source: data.source || 'unknown',
  status: data.success ? 'found' : 'unresolved',
  raw_data: data.raw_data || null,
  ...data
})

// Try ownership mappings database for brand-based ownership lookup
async function tryOwnershipMappings(brand) {
  try {
    if (!brand) {
      return { success: false, source: 'ownership_mappings' }
    }

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
      const ownership_flow = [
        data.brand_name,
        data.regional_entity,
        data.intermediate_entity,
        data.ultimate_owner_name
      ].filter(Boolean)
      
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
        source: 'upcitemdb',
        raw_data: data
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
        source: 'openfoodfacts',
        raw_data: data
      }
    }
    return { success: false, source: 'openfoodfacts' }
  } catch (err) {
    return { success: false, source: 'openfoodfacts' }
  }
}

// AI fallback when all databases fail
async function tryAIBarcodeInference(barcode) {
  let region = 'unknown'
  let regionFlag = '🏳️'
  let confidence = 'low'
  
  if (barcode.startsWith('73')) {
    region = 'Swedish/Nordic'
    regionFlag = '🇸🇪'
  } else if (barcode.startsWith('0') || barcode.startsWith('1')) {
    region = 'US/Canada'
    regionFlag = '🇺🇸'
  } else if (barcode.startsWith('4')) {
    region = 'Germany'
    regionFlag = '🇩🇪'
  } else if (barcode.startsWith('5')) {
    region = 'UK'
    regionFlag = '🇬🇧'
  } else if (barcode.startsWith('30') || barcode.startsWith('31') || barcode.startsWith('32') || barcode.startsWith('33') || barcode.startsWith('34') || barcode.startsWith('35') || barcode.startsWith('36') || barcode.startsWith('37')) {
    region = 'France'
    regionFlag = '🇫🇷'
  } else if (barcode.startsWith('80') || barcode.startsWith('81') || barcode.startsWith('82') || barcode.startsWith('83')) {
    region = 'Italy'
    regionFlag = '🇮🇹'
  } else if (barcode.startsWith('84') || barcode.startsWith('85') || barcode.startsWith('86') || barcode.startsWith('87') || barcode.startsWith('88') || barcode.startsWith('89')) {
    region = 'Spain'
    regionFlag = '🇪🇸'
  } else if (barcode.startsWith('90') || barcode.startsWith('91') || barcode.startsWith('92') || barcode.startsWith('93') || barcode.startsWith('94') || barcode.startsWith('95') || barcode.startsWith('96') || barcode.startsWith('97') || barcode.startsWith('98') || barcode.startsWith('99')) {
    region = 'Austria'
    regionFlag = '🇦🇹'
  }

  return {
    success: true,
    product_name: `Unknown product (${region} barcode)`,
    brand: 'Unknown Brand',
    barcode,
    source: 'ai_inference',
    region_hint: region,
    region_flag: regionFlag,
    confidence: confidence,
    reasoning: `Barcode pattern analysis indicates this is a ${region} product. The barcode prefix suggests the product was registered in this region, but no specific product information was found in our databases.`
  }
}

// Enhanced lookup pipeline with comprehensive logging
export async function enhancedLookupProduct(barcode, userData = null) {
  console.log(`🔍 Enhanced lookup for barcode: ${barcode}`)
  
  const lookupTrace = {
    barcode,
    start_time: new Date().toISOString(),
    attempts: [],
    final_result: null,
    total_duration_ms: 0
  }

  const startTime = Date.now()

  // If user data is provided, use it directly
  if (userData && userData.product_name && userData.brand) {
    console.log('📝 Using user-contributed data')
    lookupTrace.attempts.push({
      source: 'user_contribution',
      success: true,
      timestamp: new Date().toISOString()
    })
    
    // Try ownership mappings first
    const ownershipResult = await tryOwnershipMappings(userData.brand)
    lookupTrace.attempts.push({
      source: 'ownership_mappings',
      success: ownershipResult.success,
      timestamp: new Date().toISOString()
    })
    
    if (ownershipResult.success) {
      lookupTrace.final_result = 'user_contribution_with_mapping'
      lookupTrace.total_duration_ms = Date.now() - startTime
      
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
        user_contributed: true,
        lookup_trace: lookupTrace
      }
    }
    
    // If ownership mappings fail, invoke EnhancedAgentOwnershipResearch
    try {
      const agentResult = await EnhancedAgentOwnershipResearch({
        barcode,
        product_name: userData.product_name,
        brand: userData.brand,
        hints: {
          country_of_origin: userData.region_hint
        }
      })
      
      lookupTrace.attempts.push({
        source: 'enhanced_agent_research',
        success: true,
        timestamp: new Date().toISOString()
      })
      
      lookupTrace.final_result = 'enhanced_agent_inferred'
      lookupTrace.total_duration_ms = Date.now() - startTime
      
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
        confidence_level: agentResult.confidence_level,
        confidence_factors: agentResult.confidence_factors,
        confidence_breakdown: agentResult.confidence_breakdown,
        confidence_reasoning: agentResult.confidence_reasoning,
        ownership_flow: agentResult.ownership_flow,
        sources: agentResult.sources,
        reasoning: agentResult.reasoning,
        source: 'user_contribution + enhanced_agent_research',
        result_type: 'enhanced-agent-inferred',
        user_contributed: true,
        agent_execution_trace: agentResult.agent_execution_trace,
        lookup_trace: lookupTrace
      }
    } catch (agentError) {
      console.error('EnhancedAgentOwnershipResearch failed:', agentError)
      lookupTrace.attempts.push({
        source: 'enhanced_agent_research',
        success: false,
        error: agentError.message,
        timestamp: new Date().toISOString()
      })
      
      lookupTrace.final_result = 'user_contributed_no_match'
      lookupTrace.total_duration_ms = Date.now() - startTime
      
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
        user_contributed: true,
        lookup_trace: lookupTrace
      }
    }
  }
  
  // Stage 1: Check Supabase cache
  console.log('🔍 Stage 1: Checking Supabase cache')
  const { data: cached, error: cacheError } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle()
  
  lookupTrace.attempts.push({
    source: 'supabase_cache',
    success: !cacheError && !!cached,
    timestamp: new Date().toISOString()
  })
  
  if (cacheError) {
    console.error('Products table lookup error:', cacheError)
  } else if (cached) {
    console.log('✅ Found in Supabase cache')
    lookupTrace.final_result = 'cached'
    lookupTrace.total_duration_ms = Date.now() - startTime
    
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
      result_type: 'cached',
      lookup_trace: lookupTrace
    }
  }
  
  // Stage 2: External API lookups
  console.log('🔍 Stage 2: External API lookups')
  let productInfo = null
  
  // Try UPCitemdb first (fast US database)
  console.log('  → Trying UPCitemdb')
  const upcResult = await tryUPCItemDB(barcode)
  lookupTrace.attempts.push({
    source: 'upcitemdb',
    success: upcResult.success,
    timestamp: new Date().toISOString()
  })
  
  if (upcResult.success) {
    console.log('✅ Found in UPCitemdb')
    productInfo = upcResult
  } else {
    // Try Open Food Facts (European coverage)
    console.log('  → Trying Open Food Facts')
    const offResult = await tryOpenFoodFacts(barcode)
    lookupTrace.attempts.push({
      source: 'openfoodfacts',
      success: offResult.success,
      timestamp: new Date().toISOString()
    })
    
    if (offResult.success) {
      console.log('✅ Found in Open Food Facts')
      productInfo = offResult
    } else {
      // Try Wikidata (GTIN match)
      console.log('  → Trying Wikidata')
      const wikidataResult = await tryWikidata(barcode)
      lookupTrace.attempts.push({
        source: 'wikidata',
        success: wikidataResult.success,
        timestamp: new Date().toISOString()
      })
      
      if (wikidataResult.success) {
        console.log('✅ Found in Wikidata')
        productInfo = wikidataResult
      } else {
        // Try GS1 GEPIR (prefix-based) - TEMPORARILY DISABLED
        console.log('  → GEPIR lookup temporarily disabled (waiting for API access)')
        lookupTrace.attempts.push({
          source: 'gepir',
          success: false,
          reason: 'Temporarily disabled - waiting for API access',
          timestamp: new Date().toISOString()
        })
        
        // Try Google Shopping fallback
        console.log('  → Trying Google Shopping')
        const googleResult = await tryGoogleShopping(barcode)
        lookupTrace.attempts.push({
          source: 'google_shopping',
          success: googleResult.success,
          timestamp: new Date().toISOString()
        })
        
        if (googleResult.success) {
          console.log('✅ Found in Google Shopping')
          productInfo = googleResult
        } else {
          // Try basic web search
          console.log('  → Trying basic web search')
          const basicResult = await tryBasicWebSearch(barcode)
          lookupTrace.attempts.push({
            source: 'basic_web_search',
            success: basicResult.success,
            timestamp: new Date().toISOString()
          })
          
          if (basicResult.success) {
            console.log('✅ Found with basic web search')
            productInfo = basicResult
          } else {
            // AI inference fallback
            console.log('  → Using AI inference fallback')
            productInfo = await tryAIBarcodeInference(barcode)
            lookupTrace.attempts.push({
              source: 'ai_inference',
              success: true,
              timestamp: new Date().toISOString()
            })
          }
        }
      }
    }
  }
  
  // Stage 3: Try ownership mappings if we have a brand
  if (productInfo && productInfo.brand) {
    console.log('🔍 Stage 3: Trying ownership mappings for brand:', productInfo.brand)
    const ownershipResult = await tryOwnershipMappings(productInfo.brand)
    lookupTrace.attempts.push({
      source: 'ownership_mappings',
      success: ownershipResult.success,
      timestamp: new Date().toISOString()
    })
    
    if (ownershipResult.success) {
      console.log('✅ Found ownership mapping')
      lookupTrace.final_result = 'external_api_with_mapping'
      lookupTrace.total_duration_ms = Date.now() - startTime
      
      return {
        ...productInfo,
        financial_beneficiary: ownershipResult.financial_beneficiary,
        beneficiary_country: ownershipResult.beneficiary_country,
        beneficiary_flag: ownershipResult.beneficiary_flag,
        ownership_flow: ownershipResult.ownership_flow,
        result_type: ownershipResult.result_type,
        lookup_trace: lookupTrace
      }
    }
  }
  
  // Stage 4: Return product info without ownership (will trigger AI agent in route.ts)
  console.log('📋 Stage 4: Returning product info without ownership')
  lookupTrace.final_result = 'external_api_only'
  lookupTrace.total_duration_ms = Date.now() - startTime
  
  return {
    ...productInfo,
    result_type: 'external_api_only',
    lookup_trace: lookupTrace
  }
}

// Export the enhanced lookup function
export { enhancedLookupProduct as lookupProduct } 