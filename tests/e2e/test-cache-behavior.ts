#!/usr/bin/env npx tsx

/**
 * Cache Behavior Test Script
 * Tests the shared cache system for read/write operations
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface CacheTestResult {
  testName: string;
  success: boolean;
  cacheHit: boolean | null;
  beneficiary: string | null;
  duration: number;
  error?: string;
}

async function testCacheBehavior(): Promise<void> {
  console.log('🧪 CACHE BEHAVIOR TEST');
  console.log('======================');
  
  const baseUrl = 'http://localhost:3000/api/lookup';
  const testCases = [
    { brand: 'Jordan', product: 'Athletic Shoes' },
    { brand: 'Nike', product: 'Running Shoes' },
    { brand: 'Apple', product: 'iPhone' }
  ];
  
  const results: CacheTestResult[] = [];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.brand} + ${testCase.product}`);
    
    // First request - should be cache miss
    console.log('  🔍 First request (expected cache miss)...');
    const firstResult = await makeRequest(testCase.brand, testCase.product, 'First Request');
    results.push(firstResult);
    
    // Second request - should be cache hit
    console.log('  🔍 Second request (expected cache hit)...');
    const secondResult = await makeRequest(testCase.brand, testCase.product, 'Second Request');
    results.push(secondResult);
    
    // Wait a moment between test cases
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate report
  console.log('\n📊 CACHE TEST RESULTS');
  console.log('=====================');
  
  let totalTests = 0;
  let successfulWrites = 0;
  let successfulHits = 0;
  
  for (const result of results) {
    totalTests++;
    if (result.success) successfulWrites++;
    if (result.cacheHit === true) successfulHits++;
    
    const status = result.success ? '✅' : '❌';
    const cacheStatus = result.cacheHit === true ? 'HIT' : result.cacheHit === false ? 'MISS' : 'UNKNOWN';
    
    console.log(`${status} ${result.testName}: ${cacheStatus} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  console.log('\n📈 SUMMARY');
  console.log('===========');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Successful Writes: ${successfulWrites}/${totalTests} (${Math.round(successfulWrites/totalTests*100)}%)`);
  console.log(`Cache Hits: ${successfulHits}/${totalTests} (${Math.round(successfulHits/totalTests*100)}%)`);
  
  if (successfulHits === 0) {
    console.log('\n🚨 CACHE SYSTEM ISSUE DETECTED');
    console.log('Cache writes may be failing or cache reads are not working properly.');
  } else {
    console.log('\n✅ CACHE SYSTEM WORKING');
  }
}

async function makeRequest(brand: string, product: string, testName: string): Promise<CacheTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand,
        product_name: product,
        barcode: null,
        hints: {},
        evaluation_mode: false
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        testName,
        success: false,
        cacheHit: null,
        beneficiary: null,
        duration,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    
    return {
      testName,
      success: data.success || false,
      cacheHit: data.cache_hit || false,
      beneficiary: data.financial_beneficiary || null,
      duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      testName,
      success: false,
      cacheHit: null,
      beneficiary: null,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test
if (require.main === module) {
  testCacheBehavior().catch(console.error);
}

export { testCacheBehavior };
