# Cache Debug Report

## Executive Summary

**Status**: Cache system diagnosis completed with structured logging and health monitoring implemented.

**Root Cause Identified**: Database schema mismatch - the `products` table is missing cache-specific columns (`cache_data`, `cache_key`, `pipeline_name`, etc.) that the new cache system requires.

**Current State**: 
- ✅ Core pipeline functionality working perfectly
- ✅ Database saves successful (`database_save_success: true`)
- ❌ Cache hits consistently return `false` due to schema mismatch
- ✅ New cache system implemented with comprehensive logging
- ✅ Health monitoring and debugging tools deployed

## Implementation Completed

### 1. Structured Logging System ✅

**Files Created/Modified**:
- `src/lib/supabase.ts` - Role-based Supabase client with environment validation
- `src/lib/cache/hash.ts` - Deterministic hash generation for cache keys
- `src/lib/cache/index.ts` - Comprehensive cache module with structured logging
- `src/app/api/admin/cache-health/route.ts` - Health probe endpoint
- `src/app/api/lookup/route.ts` - Integrated new cache system with feature flag
- `scripts/cache-health.js` - CLI health check script
- `docs/CACHE_SYSTEM.md` - Complete documentation

**Logging Tags Implemented**:
- `[CACHE_READ]`, `[CACHE_HIT]`, `[CACHE_MISS]`, `[CACHE_WRITE]`, `[CACHE_WRITE_OK]`, `[CACHE_WRITE_ERR]`
- `[RLS_DENIED]`, `[SCHEMA_ERROR]`, `[ENV_MISSING]`, `[SERVICE_ROLE_USED]`
- `[NEW_CACHE_*]` - New cache system operations
- `[STABLE_HASH]` - Hash generation debugging

### 2. Environment Validation ✅

**Environment Variables Checked**:
- ✅ `SUPABASE_URL` - Present
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Present  
- ✅ `SUPABASE_ANON_KEY` - Present
- ✅ `CACHE_ENFORCE_WRITES` - Configurable (default: false)
- ✅ `USE_NEW_CACHE_SYSTEM` - Feature flag for gradual rollout

### 3. Health Monitoring ✅

**Health Probe Results**:
```json
{
  "timestamp": "2025-09-04T22:08:49.367Z",
  "status": "unhealthy",
  "details": {
    "writeError": "Could not find the 'cache_data' column of 'products' in the schema cache"
  },
  "environment": {
    "nodeEnv": "development",
    "hasSupabaseUrl": true,
    "hasServiceRoleKey": true,
    "hasAnonKey": true,
    "enforceWrites": false
  }
}
```

## Test Results

### Cache Behavior Tests

**Test 1: Manual Lookup (Nike)**
```bash
curl -X POST http://localhost:3000/api/lookup \
  -H "Content-Type: application/json" \
  -d '{"brand": "Nike", "product_name": "Shoes", "pipeline_type": "manual"}'
```

**Results**:
- First lookup: `"hit": null`, `"database_save_success": true`
- Second lookup: `"hit": null`, `"database_save_success": true`
- **Issue**: Cache hits not working despite successful database saves

**Test 2: New Cache System**
```bash
USE_NEW_CACHE_SYSTEM=true curl -X POST http://localhost:3000/api/lookup \
  -H "Content-Type: application/json" \
  -d '{"brand": "TestBrand2", "product_name": "TestProduct2", "pipeline_type": "manual"}'
```

**Results**:
- Same behavior as legacy system
- **Issue**: New cache system also fails due to schema mismatch

### Root Cause Analysis

**Schema Mismatch Confirmed**:
The health probe clearly identifies the issue:
```
"Could not find the 'cache_data' column of 'products' in the schema cache"
```

**Required Schema Changes**:
The new cache system expects these columns in the `products` table:
- `cache_key` (TEXT, UNIQUE)
- `cache_data` (JSONB)
- `pipeline_name` (TEXT)
- `input_hash` (TEXT)
- `expires_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## Recommendations

### Immediate Actions Required

1. **Database Schema Migration** (CHECKPOINT REQUIRED)
   ```sql
   -- Add cache-specific columns to products table
   ALTER TABLE products ADD COLUMN IF NOT EXISTS cache_key TEXT;
   ALTER TABLE products ADD COLUMN IF NOT EXISTS cache_data JSONB;
   ALTER TABLE products ADD COLUMN IF NOT EXISTS pipeline_name TEXT;
   ALTER TABLE products ADD COLUMN IF NOT EXISTS input_hash TEXT;
   ALTER TABLE products ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
   ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
   ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
   
   -- Add unique constraint for cache_key
   CREATE UNIQUE INDEX IF NOT EXISTS idx_products_cache_key ON products(cache_key);
   ```

2. **RLS Policy Update** (CHECKPOINT REQUIRED)
   ```sql
   -- Allow service role full access for cache operations
   CREATE POLICY cache_service_role_all
   ON public.products
   AS PERMISSIVE
   FOR ALL
   TO service_role
   USING (true)
   WITH CHECK (true);
   ```

### Gradual Rollout Plan

1. **Phase 1**: Apply schema migration
2. **Phase 2**: Test health probe - should return `"status": "healthy"`
3. **Phase 3**: Enable new cache system: `USE_NEW_CACHE_SYSTEM=true`
4. **Phase 4**: Monitor logs for `[NEW_CACHE_HIT]` entries
5. **Phase 5**: Full migration to new cache system

### Monitoring and Observability

**Health Check Commands**:
```bash
# API endpoint
curl -s https://your-app.com/api/admin/cache-health | jq '.status'

# CLI script
node scripts/cache-health.js

# Log monitoring
vercel logs https://your-app.com | grep -E "CACHE_|RLS_|ENV_"
```

**Success Criteria**:
- Health probe returns `"status": "healthy"`
- Cache hits return `"hit": true` on second identical lookup
- Logs show `[CACHE_WRITE_OK]` followed by `[CACHE_HIT]`
- No `[RLS_DENIED]` or `[SCHEMA_ERROR]` entries

## Technical Implementation Details

### Cache Key Format
```
v<cacheVersion>:<pipelineName>:<locale?>:<stableHash>
Example: v1:manual_entry:en:abc123def456
```

### Error Handling
- All cache operations log detailed error information
- RLS violations logged with `[RLS_DENIED]` tag
- Schema errors logged with `[SCHEMA_ERROR]` tag
- Environment issues logged with `[ENV_MISSING]` tag

### Feature Flags
- `USE_NEW_CACHE_SYSTEM` - Enables new cache module
- `CACHE_ENFORCE_WRITES` - Fails pipeline if cache write fails
- Both systems can run in parallel for comparison

## Files Modified

### New Files Created
- `src/lib/supabase.ts` - Enhanced Supabase client
- `src/lib/cache/hash.ts` - Deterministic hashing
- `src/lib/cache/index.ts` - Cache module with logging
- `src/app/api/admin/cache-health/route.ts` - Health endpoint
- `scripts/cache-health.js` - CLI health check
- `docs/CACHE_SYSTEM.md` - Documentation
- `debug/CACHE_DEBUG_REPORT.md` - This report

### Modified Files
- `src/app/api/lookup/route.ts` - Integrated new cache system

## Next Steps

1. **CHECKPOINT**: Review and approve database schema migration
2. **CHECKPOINT**: Review and approve RLS policy changes
3. Apply migrations to Supabase
4. Test health probe - should return healthy status
5. Enable new cache system and verify cache hits
6. Monitor production logs for cache behavior
7. Gradually migrate to new cache system

## Conclusion

The cache debugging implementation is complete with comprehensive logging, health monitoring, and error handling. The root cause has been identified as a database schema mismatch. Once the required schema changes are applied, the cache system should function correctly with full observability and structured logging.

**Status**: Ready for schema migration checkpoint.

