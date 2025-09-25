# Cache System Documentation

## Overview

The cache system provides structured logging and error handling for cache operations in the OwnedBy application. It includes both a legacy cache system and a new cache module with enhanced debugging capabilities.

## Architecture

### Components

1. **Supabase Client (`src/lib/supabase.ts`)**
   - Role-based client creation (service-role vs anonymous)
   - Environment validation and logging
   - Backward compatibility with existing code

2. **Cache Hash (`src/lib/cache/hash.ts`)**
   - Deterministic hash generation for cache keys
   - Canonical JSON serialization with sorted keys
   - Versioned cache key format: `v<cacheVersion>:<pipelineName>:<locale?>:<stableHash>`

3. **Cache Module (`src/lib/cache/index.ts`)**
   - Structured logging with tags: `[CACHE_READ]`, `[CACHE_HIT]`, `[CACHE_MISS]`, `[CACHE_WRITE]`, `[CACHE_WRITE_OK]`, `[CACHE_WRITE_ERR]`
   - Error handling for RLS, schema, and environment issues
   - TTL support with configurable expiry
   - Feature flag support for enforcing cache writes

4. **Health Probe (`src/app/api/admin/cache-health/route.ts`)**
   - End-to-end cache functionality testing
   - Environment validation
   - Structured JSON response

## Configuration

### Environment Variables

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Anonymous key for public operations
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for cache operations
- `CACHE_ENFORCE_WRITES` - When true, fails pipeline if cache write fails (default: false)
- `USE_NEW_CACHE_SYSTEM` - When true, uses new cache module (default: false)

### Cache Configuration

```typescript
const CACHE_CONFIG = {
  tableName: 'products',
  ttlHours: 24,
  enforceWrites: process.env.CACHE_ENFORCE_WRITES === 'true',
}
```

## Usage

### Basic Cache Operations

```typescript
import { lookupCachedResult, cachePipelineResult } from '@/lib/cache'

// Lookup cached result
const cacheResult = await lookupCachedResult('manual_entry', { brand: 'Nike' })

// Save to cache
const saveResult = await cachePipelineResult('manual_entry', { brand: 'Nike' }, result)
```

### Health Check

```bash
# API endpoint
curl https://your-app.com/api/admin/cache-health

# CLI script
node scripts/cache-health.js
```

## Logging Taxonomy

### Cache Operations
- `[CACHE_READ]` - Cache lookup initiated
- `[CACHE_HIT]` - Cache hit with row count
- `[CACHE_MISS]` - Cache miss
- `[CACHE_EXPIRED]` - Cache entry expired
- `[CACHE_WRITE]` - Cache write initiated
- `[CACHE_WRITE_OK]` - Cache write successful
- `[CACHE_WRITE_ERR]` - Cache write failed

### Error Types
- `[RLS_DENIED]` - Row-level security policy violation
- `[SCHEMA_ERROR]` - Database schema mismatch
- `[ENV_MISSING]` - Required environment variable missing
- `[SERVICE_ROLE_USED]` - Service role client used

### System Status
- `[NEW_CACHE_LOOKUP]` - New cache system lookup
- `[NEW_CACHE_HIT]` - New cache system hit
- `[NEW_CACHE_MISS]` - New cache system miss
- `[NEW_CACHE_SAVE]` - New cache system save
- `[NEW_CACHE_SAVE_SUCCESS]` - New cache system save success
- `[NEW_CACHE_SAVE_ERROR]` - New cache system save error

## Testing

### Verification Plan

1. **Environment Sanity Check**
   ```bash
   # Check environment variables
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Health Probe**
   ```bash
   # API endpoint
   curl -s https://your-app.com/api/admin/cache-health | jq '.'
   
   # CLI script
   node scripts/cache-health.js
   ```

3. **Cache Hit/Miss Test**
   ```bash
   # First lookup (expect miss + write)
   curl -s https://your-app.com/api/lookup?query=Nike | jq '.hit'
   # -> false
   
   # Second lookup (expect hit)
   curl -s https://your-app.com/api/lookup?query=Nike | jq '.hit'
   # -> true
   ```

4. **Log Verification**
   Look for these log patterns:
   - `[CACHE_READ] key=...`
   - `[CACHE_MISS]` then `[CACHE_WRITE]` then `[CACHE_WRITE_OK]`
   - Next call: `[CACHE_HIT]`

## Troubleshooting

### Common Issues

1. **RLS Policy Violations**
   - Error: `new row violates row-level security policy`
   - Solution: Check RLS policies on cache table

2. **Schema Mismatches**
   - Error: `Could not find the 'column_name' column`
   - Solution: Apply database migrations

3. **Environment Issues**
   - Error: `SUPABASE_SERVICE_ROLE_KEY not found`
   - Solution: Set environment variables in Vercel

### Debug Commands

```bash
# Check Vercel logs
vercel logs https://your-app.com | grep -E "CACHE_|RLS_|ENV_"

# Test cache health
curl -s https://your-app.com/api/admin/cache-health | jq '.status'

# Force new cache system
USE_NEW_CACHE_SYSTEM=true npm run dev
```

## Migration Guide

### Enabling New Cache System

1. Set environment variable: `USE_NEW_CACHE_SYSTEM=true`
2. Monitor logs for `[NEW_CACHE_*]` entries
3. Compare performance with legacy system
4. Gradually migrate to new system

### RLS Policy Template

```sql
-- Allow service role full access on cache table
-- CHECKPOINT REQUIRED BEFORE APPLYING
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY cache_service_role_all
ON public.products
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

## Performance Considerations

- Cache keys use SHA-256 hash (first 16 chars) for shorter keys
- TTL is configurable (default: 24 hours)
- Service role client bypasses RLS for cache operations
- Structured logging adds minimal overhead
- Feature flags allow gradual rollout

