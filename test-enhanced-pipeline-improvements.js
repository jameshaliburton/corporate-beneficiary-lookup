/**
 * Test Enhanced Pipeline Improvements
 * Tests the new features: structured context extraction, localized queries, 
 * disambiguation, incremental research, and follow-up context handling
 */

import dotenv from 'dotenv'
import { EnhancedWebSearchOwnershipAgent, isEnhancedWebSearchOwnershipAvailable } from './src/lib/agents/enhanced-web-search-ownership-agent.js'
import { QueryBuilderAgent } from './src/lib/agents/query-builder-agent.js'
import { parseContextHints, mergeContextHints } from './src/lib/services/context-parser.js'
import { safeJSONParse } from './src/lib/utils/json-repair.js'

dotenv.config()

async function testEnhancedPipelineImprovements() {
  console.log('\n🧪 Testing Enhanced Pipeline Improvements')
  console.log('==========================================')
  
  // Check environment
  console.log('\n📋 Environment Check:')
  console.log('- ANTHROPIC_API_KEY:', !!process.env.ANTHROPIC_API_KEY)
  console.log('- Enhanced Web Search Available:', isEnhancedWebSearchOwnershipAvailable())
  
  if (!isEnhancedWebSearchOwnershipAvailable()) {
    console.log('\n❌ Enhanced Web Search Ownership Agent not available')
    console.log('Please check your ANTHROPIC_API_KEY environment variable')
    return
  }
  
  console.log('\n✅ Enhanced Web Search Ownership Agent is available')
  
  // Test 1: Structured Context Extraction
  console.log('\n🔍 Test 1: Structured Context Extraction')
  console.log('----------------------------------------')
  
  const testContexts = [
    'pork rinds from Denmark I think',
    'software company based in Germany',
    'automotive parts from Japan',
    'food products from France'
  ]
  
  for (const context of testContexts) {
    console.log(`\nTesting context: "${context}"`)
    try {
      const hints = await parseContextHints(context, 'TestBrand', 'TestProduct')
      console.log('✅ Extracted hints:', {
        country: hints.country_guess,
        product: hints.product_type,
        suffixes: hints.likely_entity_suffixes,
        confidence: hints.confidence
      })
    } catch (error) {
      console.log('❌ Context extraction failed:', error.message)
    }
  }
  
  // Test 2: Enhanced Query Builder
  console.log('\n🔍 Test 2: Enhanced Query Builder')
  console.log('--------------------------------')
  
  const testCases = [
    {
      brand: 'Nike',
      product: 'Air Max',
      hints: { country_of_origin: 'United States' }
    },
    {
      brand: 'Volkswagen',
      product: 'Golf',
      hints: { country_of_origin: 'Germany' }
    },
    {
      brand: 'Toyota',
      product: 'Camry',
      hints: { country_of_origin: 'Japan' }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\nTesting query builder for: ${testCase.brand} - ${testCase.product}`)
    try {
      const queries = await QueryBuilderAgent(testCase.brand, testCase.product, testCase.hints)
      console.log(`✅ Generated ${queries.length} queries`)
      
      // Show first few queries
      queries.slice(0, 3).forEach((query, i) => {
        console.log(`  ${i + 1}. ${query.query} (${query.purpose})`)
      })
    } catch (error) {
      console.log('❌ Query builder failed:', error.message)
    }
  }
  
  // Test 3: Follow-up Context Integration
  console.log('\n🔍 Test 3: Follow-up Context Integration')
  console.log('----------------------------------------')
  
  const followUpTest = {
    brand: 'OK Snacks',
    product: 'Chips',
    hints: {},
    followUpContext: 'pork rinds from Denmark I think'
  }
  
  console.log(`\nTesting follow-up context: "${followUpTest.followUpContext}"`)
  try {
    const result = await EnhancedWebSearchOwnershipAgent({
      brand: followUpTest.brand,
      product_name: followUpTest.product,
      hints: followUpTest.hints,
      followUpContext: followUpTest.followUpContext
    })
    
    if (result) {
      console.log('✅ Follow-up context research completed')
      console.log('- Success:', result.success)
      console.log('- Sources:', result.sources?.length || 0)
      console.log('- Confidence:', result.final_confidence)
      console.log('- Research method:', result.research_method)
      
      if (result.alternatives) {
        console.log('- Alternatives:', result.alternatives.length)
      }
      
      if (result.confidence_explanation) {
        console.log('- Confidence explanation:', result.confidence_explanation)
      }
      
      if (result.research_summary) {
        console.log('- Research summary:', result.research_summary)
      }
    } else {
      console.log('❌ Follow-up context research failed')
    }
  } catch (error) {
    console.log('❌ Follow-up context test failed:', error.message)
  }
  
  // Test 4: JSON Repair Utility
  console.log('\n🔍 Test 4: JSON Repair Utility')
  console.log('-----------------------------')
  
  const malformedJSONs = [
    '{name: "test", value: 123}',
    '{"name": "test", "value": 123,}',
    '{"name": \'test\', "value": 123}',
    '```json\n{"name": "test", "value": 123}\n```'
  ]
  
  for (const malformed of malformedJSONs) {
    console.log(`\nTesting repair for: ${malformed.substring(0, 30)}...`)
    try {
      const repaired = safeJSONParse(malformed, 'test')
      if (repaired) {
        console.log('✅ JSON repaired successfully:', repaired)
      } else {
        console.log('❌ JSON repair failed')
      }
    } catch (error) {
      console.log('❌ JSON repair error:', error.message)
    }
  }
  
  // Test 5: Multi-company Disambiguation
  console.log('\n🔍 Test 5: Multi-company Disambiguation')
  console.log('----------------------------------------')
  
  const disambiguationTest = {
    brand: 'Apple',
    product: 'iPhone',
    hints: { country_of_origin: 'United States' }
  }
  
  console.log(`\nTesting disambiguation for: ${disambiguationTest.brand}`)
  try {
    const result = await EnhancedWebSearchOwnershipAgent({
      brand: disambiguationTest.brand,
      product_name: disambiguationTest.product,
      hints: disambiguationTest.hints
    })
    
    if (result) {
      console.log('✅ Disambiguation research completed')
      console.log('- Success:', result.success)
      console.log('- Verification status:', result.verification_status)
      
      if (result.alternatives && result.alternatives.length > 0) {
        console.log('- Found alternatives:')
        result.alternatives.forEach((alt, i) => {
          console.log(`  ${i + 1}. ${alt.name} (${alt.role}) - ${alt.confidence} confidence`)
        })
      }
      
      if (result.disambiguation_notes) {
        console.log('- Disambiguation notes:', result.disambiguation_notes)
      }
    } else {
      console.log('❌ Disambiguation research failed')
    }
  } catch (error) {
    console.log('❌ Disambiguation test failed:', error.message)
  }
  
  console.log('\n✅ Enhanced Pipeline Improvements Test Complete')
  console.log('=============================================')
}

// Run the test
testEnhancedPipelineImprovements().catch(console.error) 