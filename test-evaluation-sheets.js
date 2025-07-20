import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEvaluationSheets() {
  try {
    console.log('🔍 Testing Evaluation Google Sheets Access...\n');
    
    // Parse service account credentials
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Test each evaluation sheet
    const evaluationSheets = [
      {
        name: 'Ownership Mappings',
        id: '1goFKiB9Khp4R0ASvVqn3TbGX2YW1gFVVToPYK9foBKo',
        range: 'A1:D5'
      },
      {
        name: 'Eval Tests',
        id: '1m5P9LxLg_g_tek2m1DQZJf2WnrRlp4N-Y00UksUdCA0',
        range: 'A1:D5'
      },
      {
        name: 'Eval Steps',
        id: '1BSq_d9dZzI1N-NOuT_uJff5eZUO5BN7cEh3bwrbQvmg',
        range: 'A1:D5'
      },
      {
        name: 'Eval Results',
        id: '1Pa844D_sTypLVNxRphJPCCEfOP03sHWIYLmiXCNT9vs',
        range: 'A1:D5'
      }
    ];
    
    for (const sheet of evaluationSheets) {
      console.log(`📊 Testing ${sheet.name}...`);
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheet.id,
          range: sheet.range
        });
        
        console.log(`✅ ${sheet.name} - Access successful!`);
        console.log(`   📋 Found ${response.data.values?.length || 0} rows`);
        if (response.data.values && response.data.values.length > 0) {
          console.log(`   📝 Sample data: ${JSON.stringify(response.data.values[0])}`);
        }
      } catch (error) {
        console.log(`❌ ${sheet.name} - Access failed: ${error.message}`);
        if (error.code === 403) {
          console.log(`   💡 Make sure the sheet is shared with: ${credentials.client_email}`);
        }
      }
      console.log('');
    }
    
    console.log('🏁 Evaluation sheets test complete!');
    
  } catch (error) {
    console.log('❌ Error testing evaluation sheets:');
    console.log(error.message);
  }
}

testEvaluationSheets(); 