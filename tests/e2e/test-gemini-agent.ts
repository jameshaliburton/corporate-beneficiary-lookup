/**
 * Test Gemini Ownership Analysis Agent
 * Tests the second-opinion analysis functionality
 */

import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

interface GeminiTestResult {
  brand: string
  product: string
  gemini_triggered: boolean
  gemini_result: any
  merged_result_keys: string[]
  success: boolean
  error?: string
}

const GEMINI_TEST_CASES = [
  { brand: 'Therabreath', product: 'Oral Rinse' },
  { brand: 'Nestlé Toll House', product: 'Chocolate Chips' },
  { brand: 'Sephora', product: 'Beauty Products' },
  { brand: 'Jordan', product: 'Athletic Shoes' }
]

async function testGeminiAgent(brand: string, product: string): Promise<GeminiTestResult> {
  console.log(`\n🧪 Testing Gemini Agent: ${brand} | ${product}`)
  
  try {
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand,
        product_name: product,
        barcode: null,
        hints: {},
        evaluation_mode: false
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Check if Gemini analysis is present
    const geminiAnalysis = data.agent_results?.gemini_analysis
    const geminiTriggered = geminiAnalysis?.success === true
    const geminiResult = geminiAnalysis?.data || null
    
    // Get all keys from the merged result
    const mergedResultKeys = Object.keys(data)
    
    console.log(`[GEMINI_TEST_RESULT]`, {
      brand,
      gemini_triggered,
      gemini_result: geminiResult ? {
        summary: geminiResult.summary,
        legitimacy_assessment: geminiResult.legitimacy_assessment,
        bias_flags: geminiResult.bias_flags,
        fraud_risk: geminiResult.fraud_risk
      } : null,
      merged_result_keys: mergedResultKeys.filter(key => 
        key.includes('gemini') || key.includes('agent_results')
      )
    })

    return {
      brand,
      product,
      gemini_triggered,
      gemini_result: geminiResult,
      merged_result_keys: mergedResultKeys,
      success: true
    }
    
  } catch (error) {
    console.error(`❌ Error testing ${brand}:`, error)
    return {
      brand,
      product,
      gemini_triggered: false,
      gemini_result: null,
      merged_result_keys: [],
      success: false,
      error: error.message
    }
  }
}

async function runGeminiTests() {
  console.log('🚀 Starting Gemini Ownership Analysis Agent Tests')
  console.log('=' .repeat(60))
  
  const results: GeminiTestResult[] = []
  
  for (const testCase of GEMINI_TEST_CASES) {
    const result = await testGeminiAgent(testCase.brand, testCase.product)
    results.push(result)
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Generate summary report
  console.log('\n📊 GEMINI AGENT TEST SUMMARY')
  console.log('=' .repeat(60))
  
  const successful = results.filter(r => r.success)
  const geminiTriggered = results.filter(r => r.gemini_triggered)
  
  console.log(`Total Tests: ${results.length}`)
  console.log(`Successful API Calls: ${successful.length}`)
  console.log(`Gemini Triggered: ${geminiTriggered.length}`)
  console.log(`Gemini Success Rate: ${geminiTriggered.length}/${results.length} (${(geminiTriggered.length/results.length*100).toFixed(1)}%)`)
  
  console.log('\n📋 DETAILED RESULTS:')
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.brand} | ${result.product}`)
    console.log(`   Success: ${result.success ? '✅' : '❌'}`)
    console.log(`   Gemini Triggered: ${result.gemini_triggered ? '✅' : '❌'}`)
    if (result.gemini_result) {
      console.log(`   Summary: ${result.gemini_result.summary?.substring(0, 100)}...`)
      console.log(`   Legitimacy Score: ${result.gemini_result.legitimacy_assessment?.score || 'N/A'}`)
      console.log(`   Bias Flags: ${result.gemini_result.bias_flags?.length || 0}`)
      console.log(`   Fraud Risk: ${result.gemini_result.fraud_risk?.level || 'N/A'}`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })
  
  // Check for missing Gemini results
  const missingGemini = results.filter(r => r.success && !r.gemini_triggered)
  if (missingGemini.length > 0) {
    console.log('\n⚠️  MISSING GEMINI RESULTS:')
    missingGemini.forEach(result => {
      console.log(`   - ${result.brand} | ${result.product}`)
    })
  }
  
  console.log('\n🎯 RECOMMENDATIONS:')
  if (geminiTriggered.length === 0) {
    console.log('   - Check GOOGLE_API_KEY environment variable')
    console.log('   - Verify Gemini agent integration in enhanced-ownership-research-agent.js')
    console.log('   - Check if FORCE_GEMINI_TESTING=true is set for testing')
  } else if (geminiTriggered.length < results.length) {
    console.log('   - Some tests triggered Gemini, others did not - check trigger conditions')
    console.log('   - Review confidence thresholds and trigger logic')
  } else {
    console.log('   - All tests triggered Gemini successfully!')
    console.log('   - Review Gemini analysis quality and results')
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runGeminiTests().catch(console.error)
}

export { testGeminiAgent, runGeminiTests, GEMINI_TEST_CASES }
