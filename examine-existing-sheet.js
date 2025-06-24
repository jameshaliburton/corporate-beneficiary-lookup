import dotenv from 'dotenv'
import { google } from 'googleapis'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function examineExistingSheet() {
  console.log('🔍 Examining existing sheet structure...\n')
  
  try {
    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })

    const authClient = await auth.getClient()
    const sheets = google.sheets({ version: 'v4', auth: authClient })
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_EVALUATION_ID
    
    // Get the first few rows to see the structure
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'eval_results!A1:Z10' // Get first 10 rows, up to 26 columns
    })
    
    const rows = response.data.values || []
    
    if (rows.length === 0) {
      console.log('📋 Sheet is empty - ready for our evaluation framework structure')
      return
    }
    
    console.log(`📊 Found ${rows.length} rows in the sheet`)
    console.log(`📋 First row (headers): ${rows[0].join(' | ')}`)
    
    if (rows.length > 1) {
      console.log('\n📝 Sample data rows:')
      for (let i = 1; i < Math.min(4, rows.length); i++) {
        console.log(`Row ${i + 1}: ${rows[i].join(' | ')}`)
      }
    }
    
    // Check if this looks like our expected structure
    const headers = rows[0] || []
    const expectedHeaders = [
      'case_id', 'task_type', 'input_context', 'expected_behavior',
      'agent_version', 'output', 'evaluation_score', 'logs',
      'timestamp', 'execution_trace', 'confidence_score'
    ]
    
    console.log('\n🎯 Structure Analysis:')
    console.log(`Current columns: ${headers.length}`)
    console.log(`Expected columns: ${expectedHeaders.length}`)
    
    // Check for key columns
    const hasCaseId = headers.includes('case_id')
    const hasOutput = headers.includes('output')
    const hasTimestamp = headers.includes('timestamp')
    
    console.log(`Has case_id: ${hasCaseId}`)
    console.log(`Has output: ${hasOutput}`)
    console.log(`Has timestamp: ${hasTimestamp}`)
    
    if (hasCaseId && hasOutput && hasTimestamp) {
      console.log('\n✅ Sheet structure looks compatible with our framework!')
      console.log('We can adapt our framework to work with your existing structure.')
    } else {
      console.log('\n⚠️  Sheet structure differs from our expected format')
      console.log('We may need to create new sheets or adapt the framework.')
    }
    
  } catch (error) {
    console.error('❌ Error examining sheet:', error.message)
  }
}

examineExistingSheet() 