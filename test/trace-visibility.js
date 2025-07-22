#!/usr/bin/env node

/**
 * Phase 2 Trace Visibility Validation Tests
 * Tests the structured trace format with sections and visibility rules
 */

const API_BASE = 'http://localhost:3000/api';

async function testTraceVisibility() {
  console.log('🧪 Phase 2 Trace Visibility Validation Tests\n');
  
  // Test 1: Full pipeline execution
  console.log('📋 Test 1: Full pipeline execution (all sections and stages)');
  const test1Result = await runTest({
    brand: 'UniqueTestBrand456',
    product_name: 'UniqueTestProduct456',
    evaluation_mode: true
  });
  
  console.log('✅ Test 1 Result:', {
    success: test1Result.success,
    beneficiary: test1Result.financial_beneficiary,
    traceSections: test1Result.agent_execution_trace?.sections?.map(s => ({ id: s.id, stageCount: s.stages.length })) || [],
    totalStages: test1Result.agent_execution_trace?.sections?.reduce((total, section) => total + section.stages.length, 0) || 0
  });
  
  // Test 2: Cache hit execution
  console.log('\n📋 Test 2: Cache hit execution (vision + cache_check only)');
  const test2Result = await runTest({
    brand: 'Coca-Cola',
    product_name: 'Coca-Cola Classic',
    evaluation_mode: true
  });
  
  console.log('✅ Test 2 Result:', {
    success: test2Result.success,
    beneficiary: test2Result.financial_beneficiary,
    traceSections: test2Result.agent_execution_trace?.sections?.map(s => ({ id: s.id, stageCount: s.stages.length })) || [],
    isCacheHit: test2Result.result_type === 'cache_hit',
    expectedSections: ['vision', 'retrieval']
  });
  
  // Test 3: Partial execution (some stages skipped)
  console.log('\n📋 Test 3: Partial execution (some stages skipped)');
  const test3Result = await runTest({
    brand: 'TestBrandPartial',
    product_name: 'TestProductPartial',
    evaluation_mode: true
  });
  
  console.log('✅ Test 3 Result:', {
    success: test3Result.success,
    beneficiary: test3Result.financial_beneficiary,
    traceSections: test3Result.agent_execution_trace?.sections?.map(s => ({ 
      id: s.id, 
      stageCount: s.stages.length,
      skippedStages: s.stages.filter(stage => stage.skipped).length
    })) || [],
    showSkippedStages: test3Result.agent_execution_trace?.show_skipped_stages,
    markSkippedStages: test3Result.agent_execution_trace?.mark_skipped_stages
  });
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`- Test 1 (Full Pipeline): ${test1Result.success ? '✅' : '❌'}`);
  console.log(`- Test 2 (Cache Hit): ${test2Result.result_type === 'cache_hit' ? '✅' : '❌'}`);
  console.log(`- Test 3 (Partial Execution): ${test3Result.success ? '✅' : '❌'}`);
  
  // Trace structure validation
  console.log('\n🔍 Trace Structure Validation:');
  
  // Validate Test 1 (Full Pipeline)
  const test1Trace = test1Result.agent_execution_trace;
  if (test1Trace?.sections) {
    const hasVision = test1Trace.sections.some(s => s.id === 'vision');
    const hasRetrieval = test1Trace.sections.some(s => s.id === 'retrieval');
    const hasOwnership = test1Trace.sections.some(s => s.id === 'ownership');
    const hasPersistence = test1Trace.sections.some(s => s.id === 'persistence');
    
    console.log(`  Test 1 Sections: Vision=${hasVision}, Retrieval=${hasRetrieval}, Ownership=${hasOwnership}, Persistence=${hasPersistence}`);
  }
  
  // Validate Test 2 (Cache Hit)
  const test2Trace = test2Result.agent_execution_trace;
  if (test2Trace?.sections) {
    const hasVision = test2Trace.sections.some(s => s.id === 'vision');
    const hasRetrieval = test2Trace.sections.some(s => s.id === 'retrieval');
    const hasOwnership = test2Trace.sections.some(s => s.id === 'ownership');
    const hasPersistence = test2Trace.sections.some(s => s.id === 'persistence');
    
    console.log(`  Test 2 Sections: Vision=${hasVision}, Retrieval=${hasRetrieval}, Ownership=${hasOwnership}, Persistence=${hasPersistence}`);
    console.log(`  Expected: Vision=true, Retrieval=true, Ownership=false, Persistence=false`);
  }
  
  // Validate Test 3 (Partial Execution)
  const test3Trace = test3Result.agent_execution_trace;
  if (test3Trace?.sections) {
    const totalStages = test3Trace.sections.reduce((total, section) => total + section.stages.length, 0);
    const skippedStages = test3Trace.sections.reduce((total, section) => 
      total + section.stages.filter(stage => stage.skipped).length, 0);
    
    console.log(`  Test 3: Total stages=${totalStages}, Skipped stages=${skippedStages}`);
  }
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
  testTraceVisibility().catch(console.error);
}

module.exports = { testTraceVisibility, runTest }; 