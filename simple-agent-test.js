import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js'
import { adaptedEvaluationFramework } from './src/lib/services/adapted-evaluation-framework.js'

async function simpleAgentTest() {
  console.log('🧪 Simple Agent Test...\n')

  try {
    // Get initial count
    const initialResults = await adaptedEvaluationFramework.getEvaluationResults()
    console.log(`📊 Initial results: ${initialResults.length}`)

    // Test with a known brand that should hit static mapping
    console.log('\n🔍 Testing with "ICA" brand...')
    const result = await AgentOwnershipResearch({
      barcode: '9999999999999',
      product_name: 'ICA Test Product',
      brand: 'ICA',
      hints: {},
      enableEvaluation: true
    })

    console.log('✅ Agent completed!')
    console.log(`Result: ${result.financial_beneficiary} (${result.confidence_score}% confidence)`)
    console.log(`Result type: ${result.result_type}`)

    // Wait and check for new results
    console.log('\n⏳ Waiting for logging to complete...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    const updatedResults = await adaptedEvaluationFramework.getEvaluationResults()
    console.log(`📊 Updated results: ${updatedResults.length}`)

    if (updatedResults.length > initialResults.length) {
      console.log('🎉 SUCCESS: New result was logged!')
      const latest = updatedResults[updatedResults.length - 1]
      console.log(`Latest: ${latest.test_id} - ${latest.actual_owner}`)
    } else {
      console.log('⚠️  No new results logged')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

simpleAgentTest() 