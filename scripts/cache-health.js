#!/usr/bin/env node

/**
 * Cache Health Check Script
 * Tests cache read/write functionality and returns structured results
 */

const { cacheHealthCheck } = require('../src/lib/cache/index.ts')

async function main() {
  console.log('[CACHE_HEALTH_SCRIPT] Starting cache health check...')
  
  try {
    const result = await cacheHealthCheck()
    
    console.log('[CACHE_HEALTH_SCRIPT] Health check completed:')
    console.log(JSON.stringify(result, null, 2))
    
    if (result.status === 'healthy') {
      console.log('[CACHE_HEALTH_SCRIPT] ✅ Cache system is healthy')
      process.exit(0)
    } else {
      console.log('[CACHE_HEALTH_SCRIPT] ❌ Cache system is unhealthy')
      process.exit(1)
    }
  } catch (error) {
    console.error('[CACHE_HEALTH_SCRIPT] Health check failed:', error)
    process.exit(1)
  }
}

main()
