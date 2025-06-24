import { adaptedEvaluationFramework } from './src/lib/services/adapted-evaluation-framework.js'

async function testAdaptedFramework() {
  console.log('🧪 Testing Adapted Evaluation Framework...\n')

  try {
    // Test 1: Get existing results
    console.log('📊 Getting existing evaluation results...')
    const results = await adaptedEvaluationFramework.getEvaluationResults()
    console.log(`✅ Found ${results.length} existing results`)

    if (results.length > 0) {
      console.log('\n📋 Sample result:')
      console.log(JSON.stringify(results[0], null, 2))
    }

    // Test 2: Get statistics
    console.log('\n📈 Getting evaluation statistics...')
    const stats = await adaptedEvaluationFramework.getEvaluationStats()
    console.log('✅ Statistics:')
    console.log(`   - Total Tests: ${stats.total_tests}`)
    console.log(`   - Passed: ${stats.passed_tests}`)
    console.log(`   - Failed: ${stats.failed_tests}`)
    console.log(`   - Pass Rate: ${stats.pass_rate}%`)
    console.log(`   - Avg Confidence: ${stats.average_confidence}%`)
    console.log(`   - Avg Latency: ${stats.average_latency}s`)
    console.log(`   - Total Token Cost: ${stats.total_token_cost}`)

    // Test 3: Add a test result (optional - uncomment to test)
    /*
    console.log('\n➕ Adding test evaluation result...')
    const testResult = {
      test_id: 'T002',
      trace_id: 'test-trace-123',
      agent_version: 'v1.4.0',
      actual_owner: 'Test Company AB',
      actual_country: 'Sweden',
      actual_structure_type: 'Private',
      confidence_score: 85,
      match_result: 'pass',
      latency: 12.5,
      token_cost_estimate: 650,
      tool_errors: '',
      explainability_score: 4,
      source_used: 'test-source.com',
      prompt_snapshot: 'Test prompt for evaluation',
      response_snippet: 'Test response snippet'
    }
    
    await adaptedEvaluationFramework.addEvaluationResult(testResult)
    console.log('✅ Test result added successfully')
    */

    console.log('\n🎉 Adapted framework is working perfectly!')
    console.log('Ready to integrate with your agent evaluation workflow.')

  } catch (error) {
    console.error('❌ Error testing adapted framework:', error.message)
  }
}

testAdaptedFramework() 