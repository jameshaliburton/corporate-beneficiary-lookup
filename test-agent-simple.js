import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js'
import { adaptedEvaluationFramework } from './src/lib/services/adapted-evaluation-framework.js'

async function testAgentSimple() {
  console.log('🧪 Simple Agent Test...\n')

  try {
    // Get initial count
    const initialResults = await adaptedEvaluationFramework.getEvaluationResults()
    console.log(`📊 Initial results: ${initialResults.length}`)

    // Test with a brand that should hit static mapping quickly
    console.log('\n🔍 Testing with "Nestlé" brand (should hit static mapping)...')
    const startTime = Date.now()
    
    const result = await AgentOwnershipResearch({
      barcode: '8888888888888',
      product_name: 'Nestlé Test Product',
      brand: 'Nestlé',
      hints: {},
      enableEvaluation: true
    })

    const duration = Date.now() - startTime
    console.log(`✅ Agent completed in ${duration}ms!`)
    console.log(`Result: ${result.financial_beneficiary} (${result.confidence_score}% confidence)`)
    console.log(`Result type: ${result.result_type}`)

    // Wait for logging to complete
    console.log('\n⏳ Waiting for logging to complete...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const updatedResults = await adaptedEvaluationFramework.getEvaluationResults()
    console.log(`📊 Updated results: ${updatedResults.length}`)

    if (updatedResults.length > initialResults.length) {
      console.log('🎉 SUCCESS: Agent result was logged!')
      const latest = updatedResults[updatedResults.length - 1]
      console.log(`Latest: ${latest.test_id} - ${latest.actual_owner} (${latest.match_result})`)
      
      // Show some details
      console.log(`   - Latency: ${latest.latency}s`)
      console.log(`   - Confidence: ${latest.confidence_score}%`)
      console.log(`   - Agent Version: ${latest.agent_version}`)
    } else {
      console.log('⚠️  No new results logged - agent may have failed')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testAgentSimple() 