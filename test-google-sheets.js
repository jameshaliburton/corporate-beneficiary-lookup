const { GoogleSheetsEvaluationService } = require('./src/lib/services/google-sheets-evaluation.js')

async function testGoogleSheets() {
  console.log('Testing Google Sheets initialization...')
  
  try {
    const sheetsService = new GoogleSheetsEvaluationService()
    
    console.log('Service created, attempting to initialize...')
    await sheetsService.initialize()
    
    console.log('✅ Initialization successful!')
    
    console.log('Testing sheet validation...')
    const validation = await sheetsService.validateSheets()
    console.log('Validation results:', validation)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  }
}

testGoogleSheets() 