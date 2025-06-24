import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js'

async function testProgressTracking() {
  console.log('🧪 Testing Progress Tracking System')
  console.log('====================================')
  
  const testCase = {
    barcode: '9999999999999',
    product_name: 'Progress Test Product',
    brand: 'ProgressTestBrand',
    hints: {}
  }
  
  console.log(`📋 Testing: ${testCase.brand}`)
  console.log(`Barcode: ${testCase.barcode}`)
  
  try {
    const startTime = Date.now()
    
    // Start progress tracking in a separate process
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`🔍 Query ID: ${queryId}`)
    
    // Start progress monitoring
    const progressMonitor = startProgressMonitoring(queryId)
    
    // Run the research
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
    
    // Stop progress monitoring
    progressMonitor.stop()
    
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
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`)
  }
  
  console.log('\n🎉 Progress Tracking Test Complete!')
}

function startProgressMonitoring(queryId) {
  let eventSource = null
  let isRunning = true
  
  const start = () => {
    try {
      eventSource = new EventSource(`http://localhost:3001/api/progress?queryId=${queryId}`)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'connected') {
            console.log(`🔗 Progress tracking connected for query: ${data.queryId}`)
          } else if (data.type === 'progress') {
            console.log(`📈 Progress: ${data.stage} - ${data.status}`)
            if (data.data) {
              console.log(`   Data: ${JSON.stringify(data.data).substring(0, 100)}...`)
            }
            if (data.error) {
              console.log(`   Error: ${data.error}`)
            }
          }
        } catch (error) {
          console.error('Error parsing progress update:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('Progress tracking error:', error)
        if (isRunning) {
          // Reconnect after a delay
          setTimeout(() => {
            if (isRunning) {
              console.log('🔄 Reconnecting to progress tracking...')
              start()
            }
          }, 1000)
        }
      }
      
    } catch (error) {
      console.error('Failed to start progress monitoring:', error)
    }
  }
  
  start()
  
  return {
    stop: () => {
      isRunning = false
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }
  }
}

// Run the test
testProgressTracking().catch(console.error) 