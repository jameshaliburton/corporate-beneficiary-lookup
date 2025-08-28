// Cache utilities for brand lookup pipeline
export interface CachedLookupResult {
  brand: string;
  success: boolean;
  confidence_score: number;
  financial_beneficiary?: string;
  beneficiary_country?: string;
  ownership_flow: any[];
  ambiguous_results?: any[];
  possible_entities?: any[];
  generated_copy?: any;
  headline?: string;
  tagline?: string;
  cache_hit: boolean;
  hit_type?: 'exact' | 'rag' | 'llm';
  processing_steps?: string[];
  timestamp: number;
}

export interface CacheUtils {
  get: (key: string) => CachedLookupResult | null;
  set: (key: string, result: CachedLookupResult) => void;
  remove: (key: string) => void;
  clear: () => void;
  list: () => string[];
}

// Browser sessionStorage-based cache implementation
export const sessionCache: CacheUtils = {
  get: (key: string): CachedLookupResult | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = window.sessionStorage.getItem(key);
      if (!cached) return null;
      
      const result = JSON.parse(cached);
      console.log(`[CACHE] Retrieved cached result for key: ${key}`);
      return result;
    } catch (error) {
      console.error(`[CACHE] Error retrieving cached result for key: ${key}:`, error);
      return null;
    }
  },

  set: (key: string, result: CachedLookupResult): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const enrichedResult = {
        ...result,
        cache_hit: false,
        timestamp: Date.now()
      };
      
      window.sessionStorage.setItem(key, JSON.stringify(enrichedResult));
      console.log(`[CACHE] Stored normalized result for ${result.brand}:`, {
        success: result.success,
        confidence: result.confidence_score,
        ambiguous_results: result.ambiguous_results?.length || 0,
        possible_entities: result.possible_entities?.length || 0
      });
    } catch (error) {
      console.error(`[CACHE] Error storing cached result for key: ${key}:`, error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      window.sessionStorage.removeItem(key);
      console.log(`[CACHE] Removed cached result for key: ${key}`);
    } catch (error) {
      console.error(`[CACHE] Error removing cached result for key: ${key}:`, error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(window.sessionStorage).filter(key => 
        key.startsWith('lookup_') || key.startsWith('pipelineResult_')
      );
      keys.forEach(key => window.sessionStorage.removeItem(key));
      console.log(`[CACHE] Cleared ${keys.length} cached lookup results`);
    } catch (error) {
      console.error(`[CACHE] Error clearing cache:`, error);
    }
  },

  list: (): string[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      return Object.keys(window.sessionStorage).filter(key => 
        key.startsWith('lookup_') || key.startsWith('pipelineResult_')
      );
    } catch (error) {
      console.error(`[CACHE] Error listing cache keys:`, error);
      return [];
    }
  }
};

// Generate cache key for brand lookup
export function generateCacheKey(brand: string): string {
  const normalizedBrand = brand.toLowerCase().trim();
  return `lookup_${normalizedBrand}_${Date.now()}`;
}

// Check if cached result is still valid (within 24 hours)
export function isCacheValid(result: CachedLookupResult): boolean {
  const now = Date.now();
  const cacheAge = now - result.timestamp;
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  return cacheAge < maxAge;
}

// Get cached lookup result for brand
export async function getCachedResult(searchTerm: string): Promise<CachedLookupResult | null> {
  if (typeof window === 'undefined') {
    console.log(`[CACHE] Server-side execution - skipping cache for: ${searchTerm}`);
    return null;
  }
  
  const normalizedTerm = searchTerm.toLowerCase().trim();
  const cacheKey = `pipelineResult_${normalizedTerm}`;
  
  try {
    const cached = window.sessionStorage.getItem(cacheKey);
    if (!cached) {
      console.log(`[CACHE] No cached result found for: ${searchTerm}`);
      return null;
    }

    const parsed = JSON.parse(cached);
    
    // Validate expiry (24h)
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      console.log(`[CACHE] Expired cache for ${searchTerm}`);
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    console.log(`[CACHE] Hit for ${searchTerm}`, {
      success: parsed.success,
      confidence: parsed.confidence_score,
      ambiguous_results: parsed.ambiguous_results?.length || 0
    });
    
    return {
      ...parsed,
      cache_hit: true
    };
  } catch (error) {
    console.error(`[CACHE] Error parsing cached result for ${searchTerm}:`, error);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(cacheKey);
    }
    return null;
  }
}

// Store enriched lookup result in cache
export async function storeResultInCache(searchTerm: string, result: any): Promise<void> {
  if (typeof window === 'undefined') {
    console.log(`[CACHE] Server-side execution - skipping cache store for: ${searchTerm}`);
    return;
  }
  
  const normalizedTerm = searchTerm.toLowerCase().trim();
  const cacheKey = `pipelineResult_${normalizedTerm}`;
  
  const enrichedResult = {
    ...result,
    cache_hit: false, // Default false for new store
    hit_type: 'exact',
    timestamp: Date.now(),
  };

  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify(enrichedResult));
    console.log(`[CACHE] Stored normalized result for ${searchTerm}:`, {
      success: enrichedResult.success,
      confidence: enrichedResult.confidence_score,
      hit_type: enrichedResult.hit_type,
    });
  } catch (error) {
    console.error(`[CACHE] Error storing result for ${searchTerm}:`, error);
  }
} 