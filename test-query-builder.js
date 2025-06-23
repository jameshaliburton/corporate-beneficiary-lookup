import { QueryBuilderAgent, isQueryBuilderAvailable, getQueryBuilderStatus } from './src/lib/agents/query-builder-agent.js'

async function testQueryBuilder() {
  console.log('🧪 Testing Query Builder Agent')
  console.log('==============================')
  
  // Check availability
  const status = getQueryBuilderStatus()
  console.log('Status:', status)
  
  if (!status.available) {
    console.log('❌ Query builder not available - missing API key')
    return
  }
  
  // Test cases
  const testCases = [
    {
      brand: 'Kit Kat',
      product_name: 'Kit Kat Chocolate Bar',
      barcode: '5000159407236',
      hints: { country_of_origin: 'United Kingdom' }
    },
    {
      brand: 'ICA',
      product_name: 'ICA Basic Solrosolja',
      barcode: '7310865000000',
      hints: { country_of_origin: 'Sweden' }
    },
    {
      brand: 'Coop',
      product_name: 'Coop Änglamark Organic Milk',
      barcode: '7310865000000',
      hints: { country_of_origin: 'Sweden' }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.brand}`)
    console.log('Input:', testCase)
    
    try {
      const result = await QueryBuilderAgent(testCase)
      
      console.log('✅ Query Builder Result:')
      console.log('- Company Type:', result.company_type)
      console.log('- Country Guess:', result.country_guess)
      console.log('- Flags:', result.flags)
      console.log('- Query Count:', result.recommended_queries.length)
      console.log('- First 3 Queries:', result.recommended_queries.slice(0, 3))
      console.log('- Reasoning:', result.reasoning.substring(0, 100) + '...')
      
    } catch (error) {
      console.log('❌ Query Builder Failed:', error.message)
    }
  }
}

// Run the test
testQueryBuilder().catch(console.error) 