/**
 * Test script for the new Google Sheets Evaluation Framework
 */

import { evaluationFramework } from './src/lib/services/evaluation-framework.js'
import { EnhancedAgentOwnershipResearch } from './src/lib/agents/enhanced-ownership-research-agent.js'

async function testEvaluationFramework() {
  console.log('🧪 Testing Google Sheets Evaluation Framework...\n')
  
  try {
    // Initialize the framework
    await evaluationFramework.initialize()
    console.log('✅ Evaluation framework initialized')
    
    // Test 1: Create evaluation spreadsheet (if needed)
    console.log('\n📊 Test 1: Creating evaluation spreadsheet...')
    try {
      const spreadsheetId = await evaluationFramework.createEvaluationSpreadsheet('Test Evaluation Framework')
      console.log(`✅ Created spreadsheet: ${spreadsheetId}`)
    } catch (error) {
      console.log('ℹ️  Spreadsheet may already exist, continuing...')
    }
    
    // Test 2: Add a test evaluation case
    console.log('\n📝 Test 2: Adding evaluation case...')
    const testCase = {
      test_id: 'TEST_001',
      barcode: 'test_barcode_001',
      product_name: 'Nutella 1kg',
      expected_owner: 'Ferrero Group',
      expected_country: 'Italy',
      expected_structure_type: 'Subsidiary',
      expected_confidence: 90,
      human_query: 'Who owns Nutella?',
      evaluation_strategy: 'llm_first_analysis',
      evidence_expectation: 'High confidence ownership determination',
      source_hints: 'Ferrero is well-known chocolate manufacturer',
      notes: 'Test case for evaluation framework'
    }
    
    await evaluationFramework.addEvaluationCase(testCase)
    console.log('✅ Evaluation case added')
    
    // Test 3: Add an ownership mapping
    console.log('\n🗺️  Test 3: Adding ownership mapping...')
    const mapping = {
      brand_name: 'Ferrero Rocher',
      regional_entity: 'Ferrero',
      intermediate_entity: 'Ferrero Group',
      ultimate_owner_name: 'Ferrero Group',
      ultimate_owner_country: 'Italy',
      ultimate_owner_flag: '🇮🇹',
      notes: 'Direct ownership',
      source: 'Company website'
    }
    
    await evaluationFramework.addOwnershipMapping(mapping)
    console.log('✅ Ownership mapping added')
    
    // Test 4: Run an evaluation
    console.log('\n🔍 Test 4: Running evaluation...')
    const result = await EnhancedAgentOwnershipResearch({
      barcode: 'test_barcode_001',
      product_name: 'Nutella 1kg',
      brand: 'Ferrero',
      hints: { test_id: 'TEST_001' },
      enableEvaluation: true
    })
    
    console.log('✅ Evaluation completed')
    console.log(`   Result: ${result.financial_beneficiary} (${result.confidence_score}% confidence)`)
    
    // Test 5: Get evaluation cases
    console.log('\n📋 Test 5: Retrieving evaluation cases...')
    const cases = await evaluationFramework.getEvaluationCases()
    console.log(`✅ Retrieved ${cases.length} evaluation cases`)
    
    // Test 6: Get evaluation results
    console.log('\n📊 Test 6: Retrieving evaluation results...')
    const results = await evaluationFramework.getEvaluationResults()
    console.log(`✅ Retrieved ${results.length} evaluation results`)
    
    // Test 7: Get evaluation stats
    console.log('\n📈 Test 7: Getting evaluation statistics...')
    const stats = await evaluationFramework.getEvaluationStats()
    console.log('✅ Evaluation statistics:')
    console.log(`   Total evaluations: ${stats.total_evaluations}`)
    console.log(`   Success rate: ${stats.success_rate.toFixed(1)}%`)
    console.log(`   Average confidence: ${stats.average_confidence.toFixed(1)}%`)
    console.log(`   Average latency: ${stats.average_latency.toFixed(0)}ms`)
    
    // Test 8: Check ownership mapping
    console.log('\n🔍 Test 8: Checking ownership mapping...')
    const foundMapping = await evaluationFramework.checkOwnershipMapping('Ferrero Rocher')
    if (foundMapping) {
      console.log(`✅ Found mapping: ${foundMapping.brand_name} → ${foundMapping.ultimate_owner_name}`)
    } else {
      console.log('❌ No mapping found')
    }
    
    // Test 9: Compare evaluation
    console.log('\n⚖️  Test 9: Comparing evaluation...')
    const comparison = await evaluationFramework.compareEvaluation('TEST_001', result)
    console.log('✅ Evaluation comparison:')
    console.log(`   Match result: ${comparison.match_result}`)
    console.log(`   Expected: ${comparison.expected_owner}`)
    console.log(`   Actual: ${comparison.actual_owner}`)
    console.log(`   Explainability score: ${comparison.explainability_score}`)
    
    console.log('\n🎉 All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error(error.stack)
  }
}

// Run the test
testEvaluationFramework() 