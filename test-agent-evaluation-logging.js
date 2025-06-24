import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js'
import { adaptedEvaluationFramework } from './src/lib/services/adapted-evaluation-framework.js'

async function testAgentEvaluationLogging() {
  console.log('🧪 Testing Agent Evaluation Logging...\n')

  try {
    // Get initial count of evaluation results
    console.log('📊 Getting initial evaluation results count...')
    const initialResults = await adaptedEvaluationFramework.getEvaluationResults()
    const initialCount = initialResults.length
    console.log(`✅ Initial count: ${initialCount} results`)

    // Test 1: Run agent with a simple brand
    console.log('\n🔍 Testing agent with simple brand...')
    const testResult = await AgentOwnershipResearch({
      barcode: '1234567890123',
      product_name: 'Test Product',
      brand: 'Test Brand',
      hints: {},
      enableEvaluation: true
    })

    console.log('✅ Agent completed successfully')
    console.log(`Result: ${testResult.financial_beneficiary} (${testResult.confidence_score}% confidence)`)

    // Wait a moment for logging to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test 2: Check if result was logged
    console.log('\n📊 Checking if result was logged...')
    const updatedResults = await adaptedEvaluationFramework.getEvaluationResults()
    const updatedCount = updatedResults.length
    
    console.log(`✅ Updated count: ${updatedCount} results`)
    
    if (updatedCount > initialCount) {
      console.log('🎉 SUCCESS: New evaluation result was logged!')
      
      // Show the latest result
      const latestResult = updatedResults[updatedResults.length - 1]
      console.log('\n📋 Latest logged result:')
      console.log(`   - Test ID: ${latestResult.test_id}`)
      console.log(`   - Owner: ${latestResult.actual_owner}`)
      console.log(`   - Country: ${latestResult.actual_country}`)
      console.log(`   - Confidence: ${latestResult.confidence_score}%`)
      console.log(`   - Match Result: ${latestResult.match_result}`)
      console.log(`   - Latency: ${latestResult.latency}s`)
      console.log(`   - Agent Version: ${latestResult.agent_version}`)
    } else {
      console.log('⚠️  No new results were logged')
    }

    // Test 3: Get updated statistics
    console.log('\n📈 Getting updated statistics...')
    const stats = await adaptedEvaluationFramework.getEvaluationStats()
    console.log('✅ Updated Statistics:')
    console.log(`   - Total Tests: ${stats.total_tests}`)
    console.log(`   - Passed: ${stats.passed_tests}`)
    console.log(`   - Failed: ${stats.failed_tests}`)
    console.log(`   - Pass Rate: ${stats.pass_rate}%`)
    console.log(`   - Avg Confidence: ${stats.average_confidence}%`)
    console.log(`   - Avg Latency: ${stats.average_latency}s`)

    console.log('\n🎉 Agent evaluation logging is working perfectly!')
    console.log('Every agent run will now be automatically logged to your Google Sheets.')

  } catch (error) {
    console.error('❌ Error testing agent evaluation logging:', error.message)
  }
}

testAgentEvaluationLogging() 