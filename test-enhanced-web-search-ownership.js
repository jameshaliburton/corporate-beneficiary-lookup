/**
 * Test script for Enhanced Web-Search-Powered Ownership Agent
 * Tests the new LLM-led, web-search-powered approach with structured confidence scoring
 */

import { EnhancedWebSearchOwnershipAgent, isEnhancedWebSearchOwnershipAvailable } from './src/lib/agents/enhanced-web-search-ownership-agent.js'

async function testEnhancedWebSearchOwnership() {
  console.log('🧪 Testing Enhanced Web-Search-Powered Ownership Agent')
  console.log('=' .repeat(60))
  
  // Check if the agent is available
  console.log('\n📋 Environment Check:')
  console.log('- Enhanced Web Search Ownership Available:', isEnhancedWebSearchOwnershipAvailable())
  console.log('- ANTHROPIC_API_KEY:', !!process.env.ANTHROPIC_API_KEY)
  console.log('- GOOGLE_API_KEY:', !!process.env.GOOGLE_API_KEY)
  console.log('- GOOGLE_CSE_ID:', !!process.env.GOOGLE_CSE_ID)
  
  if (!isEnhancedWebSearchOwnershipAvailable()) {
    console.log('\n❌ Enhanced Web Search Ownership Agent is not available')
    console.log('Required environment variables:')
    console.log('- ANTHROPIC_API_KEY')
    console.log('- GOOGLE_API_KEY')
    console.log('- GOOGLE_CSE_ID')
    return
  }
  
  // Test cases with different types of brands
  const testCases = [
    {
      name: 'Global Consumer Brand',
      brand: 'Nabisco',
      product_name: 'Oreo Cookies',
      hints: { country_of_origin: 'United States' }
    },
    {
      name: 'European Brand',
      brand: 'L\'Oreal',
      product_name: 'Paris Hair Care',
      hints: { country_of_origin: 'France' }
    },
    {
      name: 'Asian Brand',
      brand: 'Toyota',
      product_name: 'Camry Sedan',
      hints: { country_of_origin: 'Japan' }
    },
    {
      name: 'Independent Brand',
      brand: 'Patagonia',
      product_name: 'Outdoor Clothing',
      hints: { country_of_origin: 'United States' }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`)
    console.log(`Brand: ${testCase.brand}`)
    console.log(`Product: ${testCase.product_name}`)
    console.log('-'.repeat(40))
    
    try {
      const startTime = Date.now()
      
      const result = await EnhancedWebSearchOwnershipAgent({
        brand: testCase.brand,
        product_name: testCase.product_name,
        hints: testCase.hints,
        queryId: `test_${Date.now()}`
      })
      
      const duration = Date.now() - startTime
      
      console.log('✅ Research completed successfully')
      console.log(`⏱️  Duration: ${duration}ms`)
      console.log(`📊 Final Confidence: ${result.final_confidence}`)
      console.log(`🔗 Ownership Chain Length: ${result.ownership_chain?.length || 0}`)
      console.log(`📚 Sources Count: ${result.sources?.length || 0}`)
      console.log(`📝 Notes: ${result.notes || 'None'}`)
      
      if (result.ownership_chain && result.ownership_chain.length > 0) {
        console.log('\n🏢 Ownership Chain:')
        result.ownership_chain.forEach((entity, index) => {
          console.log(`  ${index + 1}. ${entity.name} (${entity.role}) - ${entity.country}`)
          if (entity.sources && entity.sources.length > 0) {
            console.log(`     Sources: ${entity.sources.length} (avg confidence: ${(entity.sources.reduce((sum, s) => sum + s.confidence, 0) / entity.sources.length).toFixed(2)})`)
          }
        })
      }
      
      // Validate the result structure
      console.log('\n🔍 Result Validation:')
      console.log('- Has ownership_chain:', !!result.ownership_chain)
      console.log('- Has final_confidence:', typeof result.final_confidence === 'number')
      console.log('- Has sources:', !!result.sources)
      console.log('- Has notes:', !!result.notes)
      console.log('- Research method:', result.research_method)
      
      // Check for tiered confidence system
      if (result.sources && result.sources.length > 0) {
        const tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0 }
        result.sources.forEach(source => {
          if (source.tier >= 1 && source.tier <= 4) {
            tierCounts[source.tier]++
          }
        })
        
        console.log('\n📈 Source Tier Distribution:')
        Object.entries(tierCounts).forEach(([tier, count]) => {
          console.log(`  Tier ${tier}: ${count} sources`)
        })
      }
      
    } catch (error) {
      console.log('❌ Research failed:', error.message)
      console.log('Stack trace:', error.stack)
    }
    
    console.log('\n' + '='.repeat(60))
  }
  
  console.log('\n🎉 Enhanced Web-Search-Powered Ownership Agent test completed!')
}

// Run the test
testEnhancedWebSearchOwnership().catch(console.error) 