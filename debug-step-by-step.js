import dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })

console.log('🔍 Step-by-step debugging...')

async function debugStepByStep() {
  try {
    console.log('Step 1: Importing agent...')
    const { AgentOwnershipResearch } = await import('./src/lib/agents/ownership-research-agent.js')
    console.log('✅ Agent imported successfully')
    
    console.log('Step 2: Calling agent with minimal params...')
    const result = await AgentOwnershipResearch({
      barcode: '123456789',
      product_name: 'Test Product',
      brand: 'Nestlé',
      hints: {}
    })
    
    console.log('✅ Agent completed successfully!')
    console.log('Result:', result)
    
  } catch (error) {
    console.error('❌ Error at step:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Add timeout to prevent infinite hang
const timeout = setTimeout(() => {
  console.error('⏰ TIMEOUT: Agent hung for more than 30 seconds')
  process.exit(1)
}, 30000)

debugStepByStep().finally(() => {
  clearTimeout(timeout)
}) 