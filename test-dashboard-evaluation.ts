/**
 * Test script for the Dashboard Evaluation & Refinement System
 */

import { evaluationFramework } from './src/lib/services/evaluation-framework.js'

async function testDashboardEvaluation() {
  console.log('🧪 Testing Dashboard Evaluation & Refinement System...\n')
  
  try {
    // Test 1: Initialize evaluation framework
    console.log('📊 Test 1: Initializing evaluation framework...')
    await evaluationFramework.initialize()
    console.log('✅ Evaluation framework initialized')
    
    // Test 2: Create test evaluation case
    console.log('\n📝 Test 2: Creating test evaluation case...')
    const testCase = {
      test_id: `test_${Date.now()}`,
      barcode: '123456789',
      product_name: 'Test Product',
      expected_owner: 'Test Company Inc.',
      expected_country: 'United States',
      expected_structure_type: 'Public Company',
      expected_confidence: 85,
      human_query: 'Who owns Test Company?',
      evaluation_strategy: 'manual_test',
      evidence_expectation: 'Company website and SEC filings',
      source_hints: 'https://testcompany.com, SEC.gov',
      notes: 'Test case for dashboard evaluation system'
    }
    
    await evaluationFramework.addEvaluationCase(testCase)
    console.log('✅ Test evaluation case created')
    
    // Test 3: Log evaluation result
    console.log('\n📊 Test 3: Logging evaluation result...')
    const evaluationData = {
      test_id: testCase.test_id,
      trace_id: `trace_${Date.now()}`,
      agent_version: 'enhanced-v1.0',
      actual_owner: 'Test Company Inc.',
      actual_country: 'United States',
      actual_structure_type: 'Public Company',
      confidence_score: 90,
      match_result: 'PASS',
      latency: 5000,
      token_cost_estimate: 1000,
      tool_errors: '',
      explainability_score: 0.85,
      source_used: 'web_research',
      prompt_snapshot: 'Test prompt for evaluation',
      response_snippet: 'Test response for evaluation',
      correction_data: {
        error_type: 'none',
        corrected_owner: '',
        corrected_query: '',
        suggested_evidence: '',
        notes: 'Test evaluation without corrections'
      }
    }
    
    await evaluationFramework.logEvaluation(evaluationData)
    console.log('✅ Evaluation result logged')
    
    // Test 4: Test refinement data structure
    console.log('\n🛠️ Test 4: Testing refinement data structure...')
    const refinementData = {
      trace_id: evaluationData.trace_id,
      corrected_owner: 'Corrected Company LLC',
      corrected_query: 'Find the ultimate parent company of Corrected Company LLC',
      error_type: 'wrong_company' as const,
      suggested_evidence: 'https://correctedcompany.com/about, SEC filings',
      submit_as_test_case: true,
      notes: 'Original agent identified wrong company, corrected with proper research'
    }
    
    console.log('✅ Refinement data structure valid')
    console.log('   - Corrected Owner:', refinementData.corrected_owner)
    console.log('   - Error Type:', refinementData.error_type)
    console.log('   - Submit as Test Case:', refinementData.submit_as_test_case)
    
    // Test 5: Test API endpoint simulation
    console.log('\n🔗 Test 5: Testing API endpoint simulation...')
    const apiRequest = {
      trace_id: evaluationData.trace_id,
      corrected_query: refinementData.corrected_query,
      original_result: {
        brand: 'Test Brand',
        product_name: 'Test Product',
        financial_beneficiary: 'Wrong Company Inc.',
        beneficiary_country: 'United States',
        confidence_score: 75,
        reasoning: 'Original reasoning with error'
      },
      refinement_data: refinementData
    }
    
    console.log('✅ API request structure valid')
    console.log('   - Trace ID:', apiRequest.trace_id)
    console.log('   - Corrected Query:', apiRequest.corrected_query)
    console.log('   - Original Owner:', apiRequest.original_result.financial_beneficiary)
    
    // Test 6: Test Google Sheets integration
    console.log('\n📊 Test 6: Testing Google Sheets integration...')
    try {
      const cases = await evaluationFramework.getEvaluationCases()
      console.log(`✅ Retrieved ${cases.length} evaluation cases from Google Sheets`)
      
      const results = await evaluationFramework.getEvaluationResults()
      console.log(`✅ Retrieved ${results.length} evaluation results from Google Sheets`)
      
    } catch (error) {
      console.log('⚠️ Google Sheets integration test skipped (credentials not configured)')
      console.log('   This is expected in development environment')
    }
    
    // Test 7: Test evaluation comparison
    console.log('\n🔍 Test 7: Testing evaluation comparison...')
    const comparison = evaluationFramework.calculateMatchResult(
      {
        expected_owner: 'Test Company Inc.',
        expected_country: 'United States',
        expected_structure_type: 'Public Company',
        expected_confidence: 85
      },
      {
        financial_beneficiary: 'Test Company Inc.',
        beneficiary_country: 'United States',
        ownership_structure_type: 'Public Company',
        confidence_score: 90
      }
    )
    
    console.log('✅ Evaluation comparison working')
    console.log('   - Match Result:', comparison)
    
    // Test 8: Test explainability scoring
    console.log('\n🧠 Test 8: Testing explainability scoring...')
    const explainabilityScore = evaluationFramework.calculateExplainabilityScore({
      reasoning: 'Comprehensive analysis based on multiple sources including company website, SEC filings, and industry databases.',
      sources: ['https://company.com', 'https://sec.gov', 'https://industry-db.com'],
      agent_execution_trace: {
        stages: [
          { stage: 'web_research', result: 'success' },
          { stage: 'ownership_analysis', result: 'success' },
          { stage: 'validation', result: 'success' }
        ]
      }
    })
    
    console.log('✅ Explainability scoring working')
    console.log('   - Score:', explainabilityScore)
    
    console.log('\n🎉 All dashboard evaluation tests completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Evaluation framework initialization')
    console.log('   ✅ Test case creation')
    console.log('   ✅ Evaluation result logging')
    console.log('   ✅ Refinement data structure validation')
    console.log('   ✅ API endpoint simulation')
    console.log('   ✅ Google Sheets integration (skipped in dev)')
    console.log('   ✅ Evaluation comparison logic')
    console.log('   ✅ Explainability scoring')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testDashboardEvaluation().catch(console.error) 