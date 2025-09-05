import { getServiceRoleClient } from '../supabase'
import { generateCacheKey } from './hash'

export interface CacheResult<T = any> {
  hit: boolean
  data?: T
  error?: string
}

export interface CacheWriteResult {
  success: boolean
  rowId?: string
  error?: string
}

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  tableName: 'products',
  ttlHours: 24,
  enforceWrites: process.env.CACHE_ENFORCE_WRITES === 'true',
}

/**
 * Reads from cache with structured logging
 */
export async function readCache<T = any>(
  key: string,
  pipelineName: string
): Promise<CacheResult<T>> {
  console.log(`[CACHE_READ] key=${key} pipeline=${pipelineName}`)
  
  try {
    const client = getServiceRoleClient()
    
    // Query cache table using cache_key column
    const { data, error } = await client
      .from(CACHE_CONFIG.tableName)
      .select('cache_key, cache_data, expires_at')
      .eq('cache_key', key)
      .single()
    
    console.log(`[CACHE_READ_QUERY] key=${key} error=${error?.code} data=${!!data}`)
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - cache miss
        console.log(`[CACHE_MISS] key=${key} - No rows found`)
        return { hit: false }
      }
      
      // Other database error
      console.error(`[CACHE_READ_ERR] key=${key} code=${error.code} msg=${error.message}`)
      return { hit: false, error: error.message }
    }
    
    // Check if expired (if TTL is implemented)
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.log(`[CACHE_EXPIRED] key=${key} expires_at=${data.expires_at}`)
      return { hit: false }
    }
    
    console.log(`[CACHE_HIT] key=${key} rows=1 data_keys=${Object.keys(data.cache_data || {}).length}`)
    return { hit: true, data: data.cache_data }
    
  } catch (error) {
    console.error(`[CACHE_READ_ERR] key=${key} error=${error}`)
    return { hit: false, error: String(error) }
  }
}

/**
 * Writes to cache with structured logging and error handling
 */
export async function writeCache<T = any>(
  key: string,
  data: T,
  pipelineName: string,
  inputHash?: string,
  input?: any
): Promise<CacheWriteResult> {
  console.log(`[CACHE_WRITE] key=${key} pipeline=${pipelineName}`)
  
  try {
    const client = getServiceRoleClient()
    
    // Calculate expiry time
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + CACHE_CONFIG.ttlHours)
    
    // Extract ownership data from cache_data for individual columns
    const extractOwnershipData = (data: any, input: any) => {
      console.log('[CACHE_EXTRACTION] Extracting data from:', Object.keys(data))
      console.log('[CACHE_EXTRACTION] Sample fields:', {
        financial_beneficiary: data.financial_beneficiary,
        confidence_score: data.confidence_score,
        brand: data.brand
      })
      
      // Convert confidence_score to integer (0-100) if it's a float
      let confidenceScore = data.confidence_score || null;
      if (confidenceScore !== null) {
        if (typeof confidenceScore === 'string') {
          confidenceScore = parseFloat(confidenceScore);
        }
        if (typeof confidenceScore === 'number') {
          // If it's a decimal (0.0-1.0), convert to percentage (0-100)
          if (confidenceScore <= 1.0) {
            confidenceScore = Math.round(confidenceScore * 100);
          }
          // Ensure it's within valid range
          confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)));
        }
      }
      
      console.log('[CACHE_EXTRACTION] Converted confidence_score:', {
        original: data.confidence_score,
        converted: confidenceScore,
        type: typeof confidenceScore
      });
      
      return {
        // Basic ownership fields
        financial_beneficiary: data.financial_beneficiary || null,
        beneficiary_country: data.beneficiary_country || null,
        confidence_score: confidenceScore,
        ownership_structure_type: data.ownership_structure_type || null,
        ownership_flow: data.ownership_flow || null,
        beneficiary_flag: data.beneficiary_flag || null,
        
        // Research fields
        query_analysis_used: data.query_analysis_used || false,
        result_type: data.result_type || null,
        static_mapping_used: data.static_mapping_used || false,
        web_research_used: data.web_research_used || false,
        web_sources_count: data.web_sources_count || 0,
        sources: data.sources || null,
        reasoning: data.reasoning || null,
        
        // Agent execution trace
        agent_execution_trace: data.agent_execution_trace || null,
        initial_llm_confidence: data.initial_llm_confidence || null,
        agent_results: data.agent_results || null,
        fallback_reason: data.fallback_reason || null,
        
        // Verification fields
        verification_status: data.verification_status || null,
        verified_at: data.verified_at || null,
        verification_method: data.verification_method || null,
        verification_notes: data.verification_notes || null,
        confidence_assessment: data.confidence_assessment || null,
        agent_path: data.agent_path || null,
        verification_evidence: data.verification_evidence || null,
        verification_confidence_change: data.verification_confidence_change || null,
        
        // Brand and product info (extract from input if available)
        brand: input.brand || data.brand || null,
        product_name: input.product_name || data.product_name || null,
        
        // System fields
        user_contributed: false,
        inferred: true,
      }
    }

    // Prepare upsert payload with both cache-specific and ownership columns
    const payload = {
      // Cache-specific columns
      cache_key: key,
      cache_data: data,
      pipeline_name: pipelineName,
      input_hash: inputHash,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Add a unique barcode for the products table constraint
      barcode: `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
              // Extract ownership data for individual columns
        ...extractOwnershipData(data, input),
    }
    
    console.log(`[CACHE_WRITE] upsert=${JSON.stringify(payload).substring(0, 200)}...`)
    
    // Perform upsert with conflict resolution
    const { data: result, error } = await client
      .from(CACHE_CONFIG.tableName)
      .upsert(payload, {
        onConflict: 'cache_key',
        ignoreDuplicates: false,
      })
      .select('id')
      .single()
    
    if (error) {
      console.error(`[CACHE_WRITE_ERR] key=${key} code=${error.code} msg=${error.message}`)
      
      // Check for RLS errors
      if (error.code === '42501') {
        console.error(`[RLS_DENIED] key=${key} code=${error.code} msg=${error.message}`)
      }
      
      // Check for schema errors
      if (error.code === 'PGRST204') {
        console.error(`[SCHEMA_ERROR] key=${key} code=${error.code} msg=${error.message}`)
      }
      
      // If enforce writes is enabled, throw error
      if (CACHE_CONFIG.enforceWrites) {
        throw new Error(`Cache write failed: ${error.message}`)
      }
      
      return { success: false, error: error.message }
    }
    
    console.log(`[CACHE_WRITE_OK] key=${key} row_id=${result.id}`)
    return { success: true, rowId: result.id }
    
  } catch (error) {
    console.error(`[CACHE_WRITE_ERR] key=${key} error=${error}`)
    
    // If enforce writes is enabled, re-throw
    if (CACHE_CONFIG.enforceWrites) {
      throw error
    }
    
    return { success: false, error: String(error) }
  }
}

/**
 * Cache wrapper for pipeline results
 */
export async function cachePipelineResult<T = any>(
  pipelineName: string,
  input: any,
  result: T,
  locale?: string
): Promise<CacheWriteResult> {
  const key = generateCacheKey(pipelineName, input, locale)
  const inputHash = require('./hash').stableHash(input)
  
  return writeCache(key, result, pipelineName, inputHash, input)
}

/**
 * Cache lookup for pipeline results
 */
export async function lookupCachedResult<T = any>(
  pipelineName: string,
  input: any,
  locale?: string
): Promise<CacheResult<T>> {
  const key = generateCacheKey(pipelineName, input, locale)
  
  return readCache<T>(key, pipelineName)
}

/**
 * Health check for cache system
 */
export async function cacheHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy'
  details: any
}> {
  console.log('[CACHE_HEALTH] Starting health check')
  
  try {
    const testKey = `health-check:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
    const testData = { test: true, timestamp: new Date().toISOString() }
    
    // Test write
    const writeResult = await writeCache(testKey, testData, 'health-check')
    
    if (!writeResult.success) {
      return {
        status: 'unhealthy',
        details: { writeError: writeResult.error }
      }
    }
    
    // Test read
    const readResult = await readCache(testKey, 'health-check')
    
    if (!readResult.hit) {
      return {
        status: 'unhealthy',
        details: { readError: 'Cache hit failed after write' }
      }
    }
    
    // Clean up test data
    try {
      const client = getServiceRoleClient()
      await client.from(CACHE_CONFIG.tableName).delete().eq('cache_key', testKey)
    } catch (cleanupError) {
      console.warn('[CACHE_HEALTH] Cleanup failed:', cleanupError)
    }
    
    console.log('[CACHE_HEALTH] Health check passed')
    return {
      status: 'healthy',
      details: { writeSuccess: true, readSuccess: true }
    }
    
  } catch (error) {
    console.error('[CACHE_HEALTH] Health check failed:', error)
    return {
      status: 'unhealthy',
      details: { error: String(error) }
    }
  }
}
