import { createHash } from 'crypto'

/**
 * Creates a stable hash from input data for cache key generation
 * Uses canonical JSON serialization (sorted keys) for deterministic results
 */
export function stableHash(input: any): string {
  try {
    // Normalize input to ensure consistent serialization
    const normalized = normalizeForHashing(input)
    
    // Create canonical JSON with sorted keys
    const canonicalJson = JSON.stringify(normalized, Object.keys(normalized).sort())
    
    // Generate hash
    const hash = createHash('sha256').update(canonicalJson).digest('hex')
    
    // Log for debugging
    console.log(`[STABLE_HASH] Input: ${JSON.stringify(input).substring(0, 100)}...`)
    console.log(`[STABLE_HASH] Normalized: ${JSON.stringify(normalized).substring(0, 100)}...`)
    console.log(`[STABLE_HASH] Hash: ${hash}`)
    
    return hash.substring(0, 16) // Use first 16 chars for shorter keys
  } catch (error) {
    console.error('[STABLE_HASH_ERROR]', error)
    throw new Error(`Failed to generate stable hash: ${error}`)
  }
}

/**
 * Normalizes input data for consistent hashing
 */
function normalizeForHashing(input: any): any {
  if (input === null || input === undefined) {
    return null
  }
  
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    return input
  }
  
  if (Array.isArray(input)) {
    return input.map(normalizeForHashing)
  }
  
  if (typeof input === 'object') {
    const normalized: any = {}
    
    // Sort keys for consistent ordering
    const sortedKeys = Object.keys(input).sort()
    
    for (const key of sortedKeys) {
      // Skip undefined values
      if (input[key] !== undefined) {
        normalized[key] = normalizeForHashing(input[key])
      }
    }
    
    return normalized
  }
  
  // Fallback for other types
  return String(input)
}

/**
 * Generates a cache key with version and pipeline information
 * Standardized format: v1:pipeline_type:brand::product
 */
export function generateCacheKey(
  pipelineName: string,
  input: any,
  locale?: string,
  cacheVersion: string = 'v1'
): string {
  console.log(`[CACHE_KEY_GEN] Input:`, { pipelineName, input, locale, cacheVersion })
  
  // [CACHE_KEY_NORMALIZATION] For ownership lookups, use brand::product format for consistency (ownership-por-v1.1)
  if (input.brand && input.product_name) {
    // [CACHE_KEY_DEFENSIVE] Handle undefined/null product_name safely
    const normalizedBrand = input.brand?.trim().toLowerCase() || '';
    const normalizedProduct = input.product_name?.trim().toLowerCase() || '';
    
    if (!normalizedBrand) {
      console.warn('[CACHE_KEY_WARNING] Empty brand name in cache key generation');
      return '';
    }
    
    const key = `${cacheVersion}:${pipelineName}:${normalizedBrand}::${normalizedProduct}`
    console.log(`[CACHE_KEY_GEN] Generated brand+product key:`, key)
    return key
  } else if (input.brand) {
    const normalizedBrand = input.brand?.trim().toLowerCase() || '';
    
    if (!normalizedBrand) {
      console.warn('[CACHE_KEY_WARNING] Empty brand name in cache key generation');
      return '';
    }
    
    const key = `${cacheVersion}:${pipelineName}:${normalizedBrand}`
    console.log(`[CACHE_KEY_GEN] Generated brand-only key:`, key)
    return key
  }
  
  // Fallback to hash-based key for other inputs
  const inputHash = stableHash(input)
  const localePart = locale ? `:${locale}` : ''
  const key = `${cacheVersion}:${pipelineName}${localePart}:${inputHash}`
  console.log(`[CACHE_KEY_GEN] Generated hash-based key:`, key)
  return key
}
