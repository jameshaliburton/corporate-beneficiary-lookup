import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js'

console.log('🧪 Testing hanging fix...')

try {
  const result = await AgentOwnershipResearch({
    barcode: '123456789',
    product_name: 'Test Product',
    brand: 'Nestlé',
    hints: {}
  })
  
  console.log('✅ Test completed successfully!')
  console.log('Result:', result)
} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Stack:', error.stack)
} 