import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js'

async function testExecutionTrace() {
  console.log('🧪 Testing Execution Trace Functionality')
  console.log('==========================================')
  
  const testCases = [
    {
      name: 'Known Brand (Static Mapping)',
      barcode: '1234567890123',
      product_name: 'Test Product',
      brand: 'Nestlé',
      hints: {}
    },
    {
      name: 'Completely New Brand (Full AI Research)',
      barcode: '1111111111111',
      product_name: 'Brand New Product',
      brand: 'CompletelyNewBrand123',
      hints: {}
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`)
    console.log(`Brand: ${testCase.brand}`)
    console.log(`Barcode: ${testCase.barcode}`)
    
    try {
      const startTime = Date.now()
      const result = await AgentOwnershipResearch({
        barcode: testCase.barcode,
        product_name: testCase.product_name,
        brand: testCase.brand,
        hints: testCase.hints,
        enableEvaluation: true
      })
      const duration = Date.now() - startTime
      
      console.log(`\n✅ Result: ${result.financial_beneficiary}`)
      console.log(`Confidence: ${result.confidence_score}%`)
      console.log(`Duration: ${duration}ms`)
      
      // Check execution trace
      if (result.agent_execution_trace) {
        console.log('\n📊 Execution Trace:')
        console.log(`Query ID: ${result.agent_execution_trace.query_id}`)
        console.log(`Total Duration: ${result.agent_execution_trace.total_duration_ms}ms`)
        console.log(`Final Result: ${result.agent_execution_trace.final_result}`)
        console.log(`Stages: ${result.agent_execution_trace.stages.length}`)
        
        result.agent_execution_trace.stages.forEach((stage, index) => {
          console.log(`  ${index + 1}. ${stage.stage}: ${stage.result || 'pending'} (${stage.duration_ms || 0}ms)`)
        })
      } else {
        console.log('❌ No execution trace found')
      }
      
      // Check agent results
      if (result.agent_results) {
        console.log('\n🤖 Agent Results:')
        Object.entries(result.agent_results).forEach(([agentName, agentResult]) => {
          console.log(`  ${agentName}: ${agentResult.success ? '✅ Success' : '❌ Failed'}`)
          console.log(`    Reasoning: ${agentResult.reasoning}`)
          if ('data' in agentResult && agentResult.data) {
            console.log(`    Data: ${JSON.stringify(agentResult.data).substring(0, 100)}...`)
          }
          if ('error' in agentResult && agentResult.error) {
            console.log(`    Error: ${agentResult.error}`)
          }
        })
      } else {
        console.log('❌ No agent results found')
      }
      
      // Check fallback reason
      if (result.fallback_reason) {
        console.log(`\n⚠️  Fallback Reason: ${result.fallback_reason}`)
      }
      
      // Check initial LLM confidence
      if (result.initial_llm_confidence) {
        console.log(`\n🧠 Initial LLM Confidence: ${result.initial_llm_confidence}%`)
        if (result.initial_llm_confidence !== result.confidence_score) {
          console.log(`   Final Confidence: ${result.confidence_score}%`)
          console.log(`   Confidence Change: ${result.confidence_score - result.initial_llm_confidence}%`)
        }
      }
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`)
    }
  }
  
  console.log('\n🎉 Execution Trace Test Complete!')
}

// Run the test
testExecutionTrace().catch(console.error) 