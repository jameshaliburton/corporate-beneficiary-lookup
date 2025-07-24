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
import { QualityAssessmentAgent } from '../agents/quality-assessment-agent.js'
import { WebResearchAgent } from '../agents/web-research-agent.js'

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

// Enhanced AI fallback with better pattern recognition
async function tryAIBarcodeInference(barcode) {
  let region = 'unknown'
  let regionFlag = '🏳️'
  let confidence = 'low'
  let productType = 'unknown'
  let companyHint = null
  
  // Enhanced region detection with more patterns
  if (barcode.startsWith('73')) {
    region = 'Swedish/Nordic'
    regionFlag = '🇸🇪'
    confidence = 'medium'
    productType = 'likely_food'
  } else if (barcode.startsWith('0') || barcode.startsWith('1')) {
    region = 'US/Canada'
    regionFlag = '🇺🇸'
    confidence = 'medium'
    productType = 'general_retail'
  } else if (barcode.startsWith('4')) {
    region = 'Germany'
    regionFlag = '🇩🇪'
    confidence = 'medium'
    productType = 'likely_manufactured'
  } else if (barcode.startsWith('5')) {
    region = 'UK'
    regionFlag = '🇬🇧'
    confidence = 'medium'
    productType = 'general_retail'
  } else if (barcode.startsWith('30') || barcode.startsWith('31') || barcode.startsWith('32') || barcode.startsWith('33') || barcode.startsWith('34') || barcode.startsWith('35') || barcode.startsWith('36') || barcode.startsWith('37')) {
    region = 'France'
    regionFlag = '🇫🇷'
    confidence = 'medium'
    productType = 'likely_food'
  } else if (barcode.startsWith('80') || barcode.startsWith('81') || barcode.startsWith('82') || barcode.startsWith('83')) {
    region = 'Italy'
    regionFlag = '🇮🇹'
    confidence = 'medium'
    productType = 'likely_food'
  } else if (barcode.startsWith('84') || barcode.startsWith('85') || barcode.startsWith('86') || barcode.startsWith('87') || barcode.startsWith('88') || barcode.startsWith('89')) {
    region = 'Spain'
    regionFlag = '🇪🇸'
    confidence = 'medium'
    productType = 'likely_food'
  } else if (barcode.startsWith('90') || barcode.startsWith('91') || barcode.startsWith('92') || barcode.startsWith('93') || barcode.startsWith('94') || barcode.startsWith('95') || barcode.startsWith('96') || barcode.startsWith('97') || barcode.startsWith('98') || barcode.startsWith('99')) {
    region = 'Austria'
    regionFlag = '🇦🇹'
    confidence = 'medium'
    productType = 'likely_manufactured'
  } else if (barcode.startsWith('40') || barcode.startsWith('41') || barcode.startsWith('42') || barcode.startsWith('43') || barcode.startsWith('44')) {
    region = 'Germany'
    regionFlag = '🇩🇪'
    confidence = 'medium'
    productType = 'likely_manufactured'
  } else if (barcode.startsWith('45') || barcode.startsWith('46') || barcode.startsWith('47') || barcode.startsWith('48') || barcode.startsWith('49')) {
    region = 'Japan'
    regionFlag = '🇯🇵'
    confidence = 'medium'
    productType = 'likely_electronics'
  } else if (barcode.startsWith('50') || barcode.startsWith('51') || barcode.startsWith('52') || barcode.startsWith('53') || barcode.startsWith('54') || barcode.startsWith('55') || barcode.startsWith('56') || barcode.startsWith('57') || barcode.startsWith('58') || barcode.startsWith('59')) {
    region = 'UK'
    regionFlag = '🇬🇧'
    confidence = 'medium'
    productType = 'general_retail'
  } else if (barcode.startsWith('60') || barcode.startsWith('61') || barcode.startsWith('62') || barcode.startsWith('63') || barcode.startsWith('64') || barcode.startsWith('65') || barcode.startsWith('66') || barcode.startsWith('67') || barcode.startsWith('68') || barcode.startsWith('69')) {
    region = 'US/Canada'
    regionFlag = '🇺🇸'
    confidence = 'medium'
    productType = 'general_retail'
  } else if (barcode.startsWith('70') || barcode.startsWith('71') || barcode.startsWith('72') || barcode.startsWith('73') || barcode.startsWith('74') || barcode.startsWith('75') || barcode.startsWith('76') || barcode.startsWith('77') || barcode.startsWith('78') || barcode.startsWith('79')) {
    region = 'Norway'
    regionFlag = '🇳🇴'
    confidence = 'medium'
    productType = 'likely_food'
  }

  // Try to extract company prefix for better hints
  const prefix = barcode.substring(0, Math.min(7, barcode.length))
  
  // Known company prefixes (expand this database)
  const knownPrefixes = {
    '7318690': { company: 'ICA Sverige AB', country: 'SE', type: 'retailer' },
    '5000112': { company: 'Nestlé UK Ltd', country: 'GB', type: 'food_manufacturer' },
    '4007817': { company: 'Schwartau Werke GmbH', country: 'DE', type: 'food_manufacturer' },
    '3017620': { company: 'Danone France', country: 'FR', type: 'food_manufacturer' },
    '8003780': { company: 'Barilla Italy', country: 'IT', type: 'food_manufacturer' },
    '8410000': { company: 'Mercadona Spain', country: 'ES', type: 'retailer' },
    '9000000': { company: 'Spar Austria', country: 'AT', type: 'retailer' }
  }
  
  if (knownPrefixes[prefix]) {
    companyHint = knownPrefixes[prefix]
    confidence = 'high'
  }

  // Enhanced reasoning based on patterns
  let reasoning = `Barcode pattern analysis indicates this is a ${region} product. `
  
  if (companyHint) {
    reasoning += `The prefix ${prefix} matches known company ${companyHint.company} (${companyHint.country}). `
  }
  
  reasoning += `Based on the region and pattern, this appears to be a ${productType} product. `
  reasoning += `The barcode prefix suggests the product was registered in this region, but no specific product information was found in our databases.`

  return {
    success: true,
    product_name: `Unknown product (${region} barcode)`,
    brand: companyHint ? companyHint.company : 'Unknown Brand',
    barcode,
    source: 'ai_inference',
    region_hint: region,
    region_flag: regionFlag,
    confidence: confidence,
    product_type: productType,
    company_hint: companyHint,
    reasoning: reasoning
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
  
  // ===== CORRECTED PIPELINE =====
  
  // Stage 1: Check Supabase cache FIRST
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
  
  // Stage 2: Barcode/Product DBs (all in parallel for speed)
  console.log('🔍 Stage 2: Barcode/Product DBs')
  let productInfo = null
  
  // Run all DB lookups in parallel
  const dbLookups = [
    { name: 'upcitemdb', fn: () => tryUPCItemDB(barcode) },
    { name: 'openfoodfacts', fn: () => tryOpenFoodFacts(barcode) },
    { name: 'wikidata', fn: () => tryWikidata(barcode) },
    { name: 'google_shopping', fn: () => tryGoogleShopping(barcode) },
  ]
  
  const dbResults = await Promise.allSettled(dbLookups.map(lookup => lookup.fn()))
  
  // Log all attempts
  dbLookups.forEach((lookup, index) => {
    const result = dbResults[index]
    lookupTrace.attempts.push({
      source: lookup.name,
      success: result.status === 'fulfilled' && result.value.success,
      timestamp: new Date().toISOString(),
      error: result.status === 'rejected' ? result.reason.message : null
    })
  })
  
  // Find the first successful result
  for (let i = 0; i < dbResults.length; i++) {
    const result = dbResults[i]
    if (result.status === 'fulfilled' && result.value.success) {
      console.log(`✅ Found in ${dbLookups[i].name}`)
      productInfo = result.value
      break
    }
  }
  
  // If no DB found anything, use AI inference
  if (!productInfo) {
    console.log('  → Using AI inference fallback')
    productInfo = await tryAIBarcodeInference(barcode)
    lookupTrace.attempts.push({
      source: 'ai_inference',
      success: true,
      timestamp: new Date().toISOString()
    })
  }
  
  // Stage 3: Quality Assessment Agent
  console.log('🔍 Stage 3: Quality Assessment Agent')
  let qualityAssessment = null
  let requiresManualEntry = false
  
  if (productInfo) {
    try {
      const qualityAgent = new QualityAssessmentAgent();
      qualityAssessment = await qualityAgent.assessProductDataQuality(productInfo);
      
      lookupTrace.attempts.push({
        source: 'quality_assessment_agent',
        success: qualityAssessment.success,
        timestamp: new Date().toISOString(),
        reasoning: qualityAssessment.reasoning || (qualityAssessment.assessment && qualityAssessment.assessment.reasoning),
        issues: qualityAssessment.issues || (qualityAssessment.assessment && qualityAssessment.assessment.issues),
        is_meaningful: qualityAssessment.is_meaningful
      });
      
      // Check if quality is poor - if so, trigger manual entry
      if (qualityAssessment.success && qualityAssessment.is_meaningful === false) {
        console.log('❌ Quality assessment: Poor quality - triggering manual entry')
        requiresManualEntry = true
        lookupTrace.final_result = 'poor_quality_manual_entry'
        lookupTrace.total_duration_ms = Date.now() - startTime
        
        return {
          success: false,
          requires_manual_entry: true,
          product_name: productInfo.product_name || 'Unknown Product',
          brand: productInfo.brand || 'Unknown Brand',
          barcode,
          confidence_score: 0,
          source: 'barcode_dbs_poor_quality',
          result_type: 'poor_quality_manual_entry',
          quality_assessment: qualityAssessment,
          lookup_trace: lookupTrace
        }
      }
      
      // Attach quality assessment to productInfo
      productInfo.quality_assessment = qualityAssessment;
      
    } catch (err) {
      console.error('Quality assessment agent error:', err)
      lookupTrace.attempts.push({
        source: 'quality_assessment_agent',
        success: false,
        timestamp: new Date().toISOString(),
        error: err.message
      });
    }
  }
  
  // Stage 4: Try ownership mappings if we have a brand
  if (productInfo && productInfo.brand) {
    console.log('🔍 Stage 4: Trying ownership mappings for brand:', productInfo.brand)
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
        quality_assessment: qualityAssessment,
        lookup_trace: lookupTrace
      }
    }
  }
  
  // Stage 5: LLM/RAG Ownership Research (Enhanced Agent)
  console.log('🔍 Stage 5: LLM/RAG Ownership Research')
  try {
    const agentResult = await EnhancedAgentOwnershipResearch({
      barcode,
      product_name: productInfo?.product_name,
      brand: productInfo?.brand,
      hints: {
        country_of_origin: productInfo?.region_hint
      }
    })
    
    lookupTrace.attempts.push({
      source: 'enhanced_agent_research',
      success: true,
      timestamp: new Date().toISOString()
    })
    
    // Check if LLM/RAG returned good results
    const hasGoodResults = agentResult.confidence_score >= 50 || 
                          (agentResult.financial_beneficiary && agentResult.financial_beneficiary !== 'Unknown')
    
    if (hasGoodResults) {
      console.log('✅ LLM/RAG found good results')
      lookupTrace.final_result = 'llm_rag_success'
      lookupTrace.total_duration_ms = Date.now() - startTime
      
      return {
        ...productInfo,
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
        source: 'barcode_dbs + llm_rag',
        result_type: 'llm-rag-success',
        quality_assessment: qualityAssessment,
        agent_execution_trace: agentResult.agent_execution_trace,
        lookup_trace: lookupTrace
      }
    } else {
      console.log('⚠️ LLM/RAG returned poor results - web research DISABLED for performance')
      
      // Stage 6: Web Query Services DISABLED
      console.log('🔍 Stage 6: Web Query Services DISABLED (performance optimization)')
      
      // Web research temporarily disabled to speed up pipeline
      console.log('📋 Returning LLM/RAG results (web research disabled)')
      lookupTrace.final_result = 'llm_rag_poor_results_web_disabled'
      lookupTrace.total_duration_ms = Date.now() - startTime
      
      return {
        ...productInfo,
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
        source: 'barcode_dbs + llm_rag',
        result_type: 'llm-rag-poor-results',
        quality_assessment: qualityAssessment,
        agent_execution_trace: agentResult.agent_execution_trace,
        lookup_trace: lookupTrace
      }
    }
    
  } catch (agentError) {
    console.error('EnhancedAgentOwnershipResearch failed:', agentError)
    lookupTrace.attempts.push({
      source: 'enhanced_agent_research',
      success: false,
      error: agentError.message,
      timestamp: new Date().toISOString()
    })
  }
  
  // Stage 7: Final fallback - return product info without ownership
  console.log('📋 Stage 7: Final fallback - returning product info without ownership')
  lookupTrace.final_result = 'external_api_only'
  lookupTrace.total_duration_ms = Date.now() - startTime
  
  return {
    ...productInfo,
    result_type: 'external_api_only',
    quality_assessment: qualityAssessment,
    lookup_trace: lookupTrace
  }
}

// Export the enhanced lookup function
export { enhancedLookupProduct as lookupProduct } 