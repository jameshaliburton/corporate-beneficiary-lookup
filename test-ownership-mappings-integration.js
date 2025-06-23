import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js'
import { lookupOwnershipMapping, getAllOwnershipMappings, addOwnershipMapping } from './src/lib/database/ownership-mappings.js'

/**
 * Test Ownership Mappings Integration
 * Verifies that static mappings are properly integrated into the research pipeline
 */

async function testOwnershipMappingsIntegration() {
  console.log('🧪 Testing Ownership Mappings Integration\n')
  
  // Test 1: Check database connection and existing mappings
  console.log('📊 Test 1: Database Connection & Existing Mappings')
  try {
    const { success, data } = await getAllOwnershipMappings()
    if (success) {
      console.log(`✅ Found ${data.length} existing mappings`)
      console.log('Sample mappings:', data.slice(0, 3).map(m => `${m.brand_name} → ${m.ultimate_owner_name}`))
    } else {
      console.log('❌ Failed to get mappings')
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message)
  }
  
  // Test 2: Direct mapping lookups
  console.log('\n🔍 Test 2: Direct Mapping Lookups')
  const testBrands = ['Kit Kat', 'Coca-Cola', 'Snickers', 'UnknownBrand']
  
  for (const brand of testBrands) {
    try {
      const mapping = await lookupOwnershipMapping(brand)
      if (mapping) {
        console.log(`✅ ${brand} → ${mapping.ultimate_owner_name} (${mapping.ultimate_owner_country})`)
      } else {
        console.log(`❌ ${brand} → No mapping found`)
      }
    } catch (error) {
      console.log(`❌ ${brand} → Error: ${error.message}`)
    }
  }
  
  // Test 3: Full research pipeline with known mappings
  console.log('\n🚀 Test 3: Full Research Pipeline (Known Mappings)')
  const knownBrands = ['Kit Kat', 'Coca-Cola']
  
  for (const brand of knownBrands) {
    console.log(`\n--- Testing ${brand} ---`)
    try {
      const result = await AgentOwnershipResearch({
        barcode: '123456789',
        product_name: `${brand} Product`,
        brand: brand,
        hints: {},
        enableEvaluation: true
      })
      
      console.log(`Result: ${result.financial_beneficiary} (${result.beneficiary_country})`)
      console.log(`Confidence: ${result.confidence_score}%`)
      console.log(`Static mapping used: ${result.static_mapping_used}`)
      console.log(`Web research used: ${result.web_research_used}`)
      console.log(`Result type: ${result.result_type}`)
      
      if (result.static_mapping_used) {
        console.log('✅ Static mapping correctly used')
      } else {
        console.log('⚠️ Static mapping not used (fallback to AI research)')
      }
      
    } catch (error) {
      console.log(`❌ Research failed: ${error.message}`)
    }
  }
  
  // Test 4: Full research pipeline with unknown brands
  console.log('\n🔬 Test 4: Full Research Pipeline (Unknown Brands)')
  const unknownBrands = ['TestBrand123', 'FictionalCorp']
  
  for (const brand of unknownBrands) {
    console.log(`\n--- Testing ${brand} ---`)
    try {
      const result = await AgentOwnershipResearch({
        barcode: '987654321',
        product_name: `${brand} Product`,
        brand: brand,
        hints: {},
        enableEvaluation: true
      })
      
      console.log(`Result: ${result.financial_beneficiary} (${result.beneficiary_country})`)
      console.log(`Confidence: ${result.confidence_score}%`)
      console.log(`Static mapping used: ${result.static_mapping_used}`)
      console.log(`Web research used: ${result.web_research_used}`)
      console.log(`Result type: ${result.result_type}`)
      
      if (!result.static_mapping_used) {
        console.log('✅ Correctly fell back to AI research')
      } else {
        console.log('⚠️ Unexpectedly used static mapping')
      }
      
    } catch (error) {
      console.log(`❌ Research failed: ${error.message}`)
    }
  }
  
  // Test 5: Add new mapping and test
  console.log('\n➕ Test 5: Add New Mapping & Test')
  try {
    const newMapping = {
      brand_name: 'TestBrandXYZ',
      regional_entity: 'TestBrand XYZ Ltd.',
      intermediate_entity: 'TestBrand Holdings',
      ultimate_owner_name: 'TestCorp International',
      ultimate_owner_country: 'United States',
      ultimate_owner_flag: '🇺🇸',
      notes: 'Test mapping for integration testing'
    }
    
    const addResult = await addOwnershipMapping(newMapping)
    if (addResult.success) {
      console.log('✅ Added new test mapping')
      
      // Test the new mapping
      const testResult = await AgentOwnershipResearch({
        barcode: '555666777',
        product_name: 'TestBrandXYZ Product',
        brand: 'TestBrandXYZ',
        hints: {},
        enableEvaluation: true
      })
      
      console.log(`New mapping result: ${testResult.financial_beneficiary} (${testResult.beneficiary_country})`)
      console.log(`Static mapping used: ${testResult.static_mapping_used}`)
      
      if (testResult.static_mapping_used && testResult.financial_beneficiary === 'TestCorp International') {
        console.log('✅ New mapping correctly integrated')
      } else {
        console.log('❌ New mapping not working correctly')
      }
      
    } else {
      console.log('❌ Failed to add new mapping:', addResult.error)
    }
    
  } catch (error) {
    console.log('❌ Add mapping test failed:', error.message)
  }
  
  // Test 6: Performance comparison
  console.log('\n⚡ Test 6: Performance Comparison')
  const performanceTests = [
    { brand: 'Kit Kat', expectedType: 'static' },
    { brand: 'UnknownPerformanceBrand', expectedType: 'ai' }
  ]
  
  for (const test of performanceTests) {
    console.log(`\n--- Performance test: ${test.brand} ---`)
    const startTime = Date.now()
    
    try {
      const result = await AgentOwnershipResearch({
        barcode: '111222333',
        product_name: `${test.brand} Product`,
        brand: test.brand,
        hints: {},
        enableEvaluation: false // Disable evaluation for cleaner timing
      })
      
      const duration = Date.now() - startTime
      console.log(`Duration: ${duration}ms`)
      console.log(`Result type: ${result.result_type}`)
      console.log(`Static mapping used: ${result.static_mapping_used}`)
      
      if (test.expectedType === 'static' && result.static_mapping_used) {
        console.log('✅ Static mapping performance as expected')
      } else if (test.expectedType === 'ai' && !result.static_mapping_used) {
        console.log('✅ AI research performance as expected')
      } else {
        console.log('⚠️ Unexpected result type')
      }
      
    } catch (error) {
      console.log(`❌ Performance test failed: ${error.message}`)
    }
  }
  
  console.log('\n🎉 Ownership Mappings Integration Test Complete!')
}

// Run the test
testOwnershipMappingsIntegration().catch(console.error) 