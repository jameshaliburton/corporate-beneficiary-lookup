import { evaluationFramework } from './src/lib/services/evaluation-framework.js'

async function checkSheetStructure() {
  console.log('🔍 Checking existing Google Sheets structure...\n')

  try {
    // Initialize the framework
    await evaluationFramework.initialize()
    console.log('✅ Framework initialized successfully\n')

    // Check if the spreadsheet exists and get its structure
    console.log('📊 Examining spreadsheet structure...')
    
    try {
      // Try to get evaluation cases to see if the sheet exists
      const cases = await evaluationFramework.getEvaluationCases()
      console.log(`✅ Found ${cases.length} existing evaluation cases`)
      
      if (cases.length > 0) {
        console.log('\n📋 Sample case structure:')
        console.log(JSON.stringify(cases[0], null, 2))
      }
    } catch (error) {
      console.log('⚠️  No existing evaluation cases found - sheet may be empty or have different structure')
    }

    // Try to get AI results
    try {
      const aiResults = await evaluationFramework.getAIResults()
      console.log(`✅ Found ${aiResults.length} existing AI results`)
    } catch (error) {
      console.log('⚠️  No existing AI results found')
    }

    // Try to get human ratings
    try {
      const humanRatings = await evaluationFramework.getHumanRatings()
      console.log(`✅ Found ${humanRatings.length} existing human ratings`)
    } catch (error) {
      console.log('⚠️  No existing human ratings found')
    }

    // Get overall statistics
    try {
      const stats = await evaluationFramework.getEvaluationStats()
      console.log('\n📈 Current Statistics:')
      console.log(`   - Total Cases: ${stats.total_cases}`)
      console.log(`   - Active Cases: ${stats.active_cases}`)
      console.log(`   - Human Ratings: ${stats.total_human_ratings}`)
      console.log(`   - AI Results: ${stats.total_ai_results}`)
      console.log(`   - Avg Human Score: ${stats.average_human_score.toFixed(1)}`)
      console.log(`   - Avg AI Score: ${stats.average_ai_score.toFixed(1)}`)
    } catch (error) {
      console.log('⚠️  Could not retrieve statistics')
    }

    console.log('\n🎯 Next Steps:')
    console.log('1. If sheets are empty, we can create the proper structure')
    console.log('2. If sheets have existing data, we can adapt our framework')
    console.log('3. We can test the evaluation mode with a sample case')

  } catch (error) {
    console.error('❌ Error checking sheet structure:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('1. Check that GOOGLE_SHEETS_EVALUATION_ID is set correctly')
    console.error('2. Verify your service account has access to the spreadsheet')
    console.error('3. Ensure the spreadsheet exists and is shared with the service account')
  }
}

// Run the check
checkSheetStructure() 