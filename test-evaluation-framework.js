import { evaluationFramework } from './src/lib/services/evaluation-framework.js'

async function testEvaluationFramework() {
  console.log('🧪 Testing Evaluation Framework Integration...\n')

  try {
    // Test 1: Initialize the framework
    console.log('1. Testing initialization...')
    await evaluationFramework.initialize()
    console.log('✅ Framework initialized successfully\n')

    // Test 2: Create a new evaluation spreadsheet
    console.log('2. Testing spreadsheet creation...')
    const spreadsheetId = await evaluationFramework.createEvaluationSpreadsheet('Test Evaluation Framework')
    console.log(`✅ Created spreadsheet: ${spreadsheetId}\n`)

    // Test 3: Add a sample AI result
    console.log('3. Testing AI result logging...')
    const sampleAIResult = {
      case_id: 'test_case_001',
      agent_version: 'v1.0',
      output: {
        financial_beneficiary: 'Test Corporation',
        beneficiary_country: 'United States',
        confidence_score: 85,
        result_type: 'ai_research',
        sources: ['https://example.com/source1', 'https://example.com/source2'],
        reasoning: 'Based on web research and company filings'
      },
      evaluation_score: 8.5,
      logs: {
        warnings: ['Low source quality for one source'],
        source_quality: 7.5,
        hallucination_indicators: [],
        response_time_ms: 2500
      },
      execution_trace: {
        query_id: 'test_query_001',
        start_time: new Date().toISOString(),
        stages: [
          {
            stage: 'web_research',
            start_time: new Date().toISOString(),
            description: 'Searching for company ownership information',
            result: 'success',
            duration_ms: 1500
          }
        ],
        total_duration_ms: 2500
      },
      confidence_score: 85,
      sources_used: ['https://example.com/source1', 'https://example.com/source2'],
      fallback_reason: null,
      total_duration_ms: 2500
    }

    await evaluationFramework.addAIResult(sampleAIResult)
    console.log('✅ AI result logged successfully\n')

    // Test 4: Get evaluation statistics
    console.log('4. Testing statistics retrieval...')
    const stats = await evaluationFramework.getEvaluationStats()
    console.log('📊 Evaluation Statistics:')
    console.log(`   - Total Cases: ${stats.total_cases}`)
    console.log(`   - Active Cases: ${stats.active_cases}`)
    console.log(`   - Human Ratings: ${stats.total_human_ratings}`)
    console.log(`   - AI Results: ${stats.total_ai_results}`)
    console.log(`   - Avg Human Score: ${stats.average_human_score.toFixed(1)}`)
    console.log(`   - Avg AI Score: ${stats.average_ai_score.toFixed(1)}\n`)

    // Test 5: Get AI results for the test case
    console.log('5. Testing AI results retrieval...')
    const aiResults = await evaluationFramework.getAIResults('test_case_001')
    console.log(`✅ Retrieved ${aiResults.length} AI results for test case\n`)

    // Test 6: Test case validation
    console.log('6. Testing case validation...')
    const isValid = await evaluationFramework.validateCaseId('test_case_001')
    console.log(`✅ Case validation: ${isValid ? 'Valid' : 'Invalid'}\n`)

    // Test 7: Generate evaluation URL
    console.log('7. Testing URL generation...')
    const url = evaluationFramework.generateCaseUrl('test_case_001')
    console.log(`✅ Generated URL: ${url}\n`)

    console.log('🎉 All evaluation framework tests passed!')
    console.log('\n📋 Next Steps:')
    console.log('1. Set GOOGLE_SHEETS_EVALUATION_ID in your .env.local file')
    console.log('2. Configure your Google Service Account credentials')
    console.log('3. Use the dashboard to view evaluation data')
    console.log('4. Add human ratings through the Google Sheets interface')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('1. Check that GOOGLE_SERVICE_ACCOUNT_KEY_FILE is set in .env.local')
    console.error('2. Verify your Google Service Account has Sheets API access')
    console.error('3. Ensure the service account key file exists and is valid')
  }
}

// Run the test
testEvaluationFramework() 