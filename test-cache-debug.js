#!/usr/bin/env node

// Simple test to debug cache lookup
const { lookupCachedResult } = require('./src/lib/cache/index.ts');
const { generateCacheKey } = require('./src/lib/cache/hash.ts');

async function testCacheLookup() {
  console.log('Testing cache lookup...');
  
  const pipelineName = 'manual_entry';
  const input = { brand: 'DebugTest', product_name: 'DebugProduct' };
  
  console.log('Input:', input);
  
  // Generate cache key
  const cacheKey = generateCacheKey(pipelineName, input);
  console.log('Generated cache key:', cacheKey);
  
  // Try to lookup
  try {
    const result = await lookupCachedResult(pipelineName, input);
    console.log('Cache lookup result:', result);
  } catch (error) {
    console.error('Cache lookup error:', error);
  }
}

testCacheLookup().catch(console.error);
