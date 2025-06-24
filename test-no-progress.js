import dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })

console.log('🧪 Testing agent without progress tracking...')

// Mock the emitProgress function to do nothing
const originalEmitProgress = await import('./src/lib/utils.ts')
const mockEmitProgress = async () => {
  // Do nothing - bypass progress tracking
  console.log('[Mock] Progress update skipped')
}

// Temporarily replace the emitProgress function
const utils = await import('./src/lib/utils.ts')
utils.emitProgress = mockEmitProgress

// Now test the agent
try {
  const { AgentOwnershipResearch } = await import('./src/lib/agents/ownership-research-agent.js')
  
  console.log('🔍 Testing with "Nestlé" brand (should hit static mapping)...')
  const result = await AgentOwnershipResearch({
    barcode: '123456789',
    product_name: 'Nestlé Test Product',
    brand: 'Nestlé',
    hints: {}
  })
  
  console.log('✅ Test completed successfully!')
  console.log('Result:', {
    financial_beneficiary: result.financial_beneficiary,
    confidence_score: result.confidence_score,
    result_type: result.result_type
  })
} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Stack:', error.stack)
} 