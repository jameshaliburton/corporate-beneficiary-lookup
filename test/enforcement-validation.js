#!/usr/bin/env node

/**
 * Phase 1 Enforcement Validation Tests
 * Tests the mandatory early sequence, cache hit logic, and database save behavior
 */

const API_BASE = 'http://localhost:3000/api';

async function testEnforcement() {
  console.log('🧪 Phase 1 Enforcement Validation Tests\n');
  
  // Test 1: First-time scan - triggers full pipeline, ends with DB save
  console.log('📋 Test 1: First-time scan (full pipeline)');
  const test1Result = await runTest({
    brand: 'UniqueTestBrand123',
    product_name: 'UniqueTestProduct123',
    evaluation_mode: true
  });
  
  console.log('✅ Test 1 Result:', {
    success: test1Result.success,
    beneficiary: test1Result.financial_beneficiary,
    traceStages: test1Result.agent_execution_trace?.stages?.map(s => s.stage) || []
  });
  
  // Test 2: Second-time scan - returns cache hit, no LLM or save
  console.log('\n📋 Test 2: Second-time scan (cache hit)');
  const test2Result = await runTest({
    brand: 'Coca-Cola',
    product_name: 'Coca-Cola Classic',
    evaluation_mode: true
  });
  
  console.log('✅ Test 2 Result:', {
    success: test2Result.success,
    beneficiary: test2Result.financial_beneficiary,
    traceStages: test2Result.agent_execution_trace?.stages?.map(s => s.stage) || [],
    isCacheHit: test2Result.result_type === 'cache_hit'
  });
  
  // Test 3: Known bad input - trace shows skipped downstream agents
  console.log('\n📋 Test 3: Known bad input (skipped agents)');
  const test3Result = await runTest({
    brand: 'Unknown Brand',
    product_name: 'Unknown Product',
    evaluation_mode: true
  });
  
  console.log('✅ Test 3 Result:', {
    success: test3Result.success,
    beneficiary: test3Result.financial_beneficiary,
    traceStages: test3Result.agent_execution_trace?.stages?.map(s => s.stage) || [],
    skippedStages: test3Result.trace_stages?.skipped_stages || {}
  });
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`- Test 1 (Full Pipeline): ${test1Result.success ? '✅' : '❌'}`);
  console.log(`- Test 2 (Cache Hit): ${test2Result.result_type === 'cache_hit' ? '✅' : '❌'}`);
  console.log(`- Test 3 (Skipped Agents): ${test3Result.trace_stages?.skipped_stages?.database_save ? '✅' : '❌'}`);
}

async function runTest(payload) {
  try {
    const response = await fetch(`${API_BASE}/lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testEnforcement().catch(console.error);
}

module.exports = { testEnforcement, runTest }; 