import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js'
import { adaptedEvaluationFramework } from './src/lib/services/adapted-evaluation-framework.js'

async function minimalAgentTest() {
  console.log('🧪 Minimal Agent Test...\n')

  try {
    // Get initial count
    const initialResults = await adaptedEvaluationFramework.getEvaluationResults()
    console.log(`📊 Initial results: ${initialResults.length}`)

    console.log('\n🔍 Testing with "Nestlé" (should hit static mapping)...')
    const startTime = Date.now()
    
    // Test with a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Agent test timed out after 30 seconds')), 30000)
    })
    
    const agentPromise = AgentOwnershipResearch({
      barcode: '8888888888888',
      product_name: 'Nestlé Test Product',
      brand: 'Nestlé',
      hints: {},
      enableEvaluation: true
    })
    
    const result = await Promise.race([agentPromise, timeoutPromise])
    
    const duration = Date.now() - startTime
    console.log(`✅ Agent completed in ${duration}ms!`)
    console.log(`Result: ${result.financial_beneficiary} (${result.confidence_score}% confidence)`)
    console.log(`Result type: ${result.result_type}`)

    // Wait for logging
    console.log('\n⏳ Waiting for logging...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const updatedResults = await adaptedEvaluationFramework.getEvaluationResults()
    console.log(`📊 Updated results: ${updatedResults.length}`)

    if (updatedResults.length > initialResults.length) {
      console.log('🎉 SUCCESS: Agent result was logged!')
      const latest = updatedResults[updatedResults.length - 1]
      console.log(`Latest: ${latest.test_id} - ${latest.actual_owner} (${latest.match_result})`)
    } else {
      console.log('⚠️  No new results logged')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.message.includes('timed out')) {
      console.log('💡 The agent is hanging somewhere in the pipeline')
    }
  }
}

minimalAgentTest() 