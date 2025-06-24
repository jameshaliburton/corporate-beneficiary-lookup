import dotenv from 'dotenv'
import { google } from 'googleapis'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testSheetsConnection() {
  console.log('🔍 Testing Google Sheets connection...')
  console.log('Spreadsheet ID:', process.env.GOOGLE_SHEETS_EVALUATION_ID)
  
  try {
    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })

    console.log('✅ Auth initialized')
    
    const authClient = await auth.getClient()
    console.log('✅ Auth client created')
    
    const sheets = google.sheets({ version: 'v4', auth: authClient })
    console.log('✅ Sheets API initialized')
    
    // Try to get spreadsheet metadata
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_EVALUATION_ID
    })
    
    console.log('✅ Successfully connected to spreadsheet!')
    console.log('Title:', response.data.properties.title)
    console.log('Sheets:', response.data.sheets.map(s => s.properties.title))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code === 404) {
      console.error('Spreadsheet not found or access denied')
    } else if (error.code === 403) {
      console.error('Permission denied - check service account access')
    }
  }
}

testSheetsConnection() 