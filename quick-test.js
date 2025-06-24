import { adaptedEvaluationFramework } from './src/lib/services/adapted-evaluation-framework.js'

async function quickTest() {
  console.log('🧪 Quick Test - Direct Evaluation Logging...\n')

  try {
    // Get initial count
    const initialResults = await adaptedEvaluationFramework.getEvaluationResults()
    console.log(`📊 Initial results: ${initialResults.length}`)

    // Test direct logging
    console.log('\n➕ Adding test evaluation result directly...')
    const testResult = {
      test_id: 'T999',
      trace_id: 'quick-test-123',
      agent_version: 'v1.4.0',
      actual_owner: 'Test Company AB',
      actual_country: 'Sweden',
      actual_structure_type: 'Private',
      confidence_score: 85,
      match_result: 'pass',
      latency: '5.2',
      token_cost_estimate: 300,
      tool_errors: '',
      explainability_score: 4,
      source_used: 'Direct test',
      prompt_snapshot: 'Test prompt',
      response_snippet: 'Test response'
    }

    await adaptedEvaluationFramework.addEvaluationResult(testResult)
    console.log('✅ Test result added successfully')

    // Check if it was added
    const updatedResults = await adaptedEvaluationFramework.getEvaluationResults()
    console.log(`📊 Updated results: ${updatedResults.length}`)

    if (updatedResults.length > initialResults.length) {
      console.log('🎉 SUCCESS: Direct logging works!')
      const latest = updatedResults[updatedResults.length - 1]
      console.log(`Latest: ${latest.test_id} - ${latest.actual_owner}`)
    } else {
      console.log('⚠️  Direct logging failed')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

quickTest() 