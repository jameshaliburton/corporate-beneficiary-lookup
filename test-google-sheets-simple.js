import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGoogleSheets() {
  try {
    console.log('🔍 Testing Google Sheets API Access...\n');
    
    // Check if service account key is available
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
    if (!serviceAccountKey) {
      console.log('❌ GOOGLE_SERVICE_ACCOUNT_KEY_JSON not found in environment');
      return;
    }
    
    console.log('✅ Service account key found');
    
    // Parse the service account key
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
      console.log('✅ Service account key parsed successfully');
      console.log(`📧 Client email: ${credentials.client_email}`);
    } catch (error) {
      console.log('❌ Failed to parse service account key:', error.message);
      return;
    }
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    console.log('✅ Auth client created');
    
    // Create sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Sheets API client created');
    
    // Test with a simple sheet read (using a public sheet for testing)
    const testSheetId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'; // Google's sample sheet
    
    console.log('\n📊 Testing sheet access...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: testSheetId,
      range: 'A1:A5'
    });
    
    console.log('✅ Successfully accessed Google Sheets API!');
    console.log('📋 Sample data from test sheet:');
    console.log(response.data.values);
    
  } catch (error) {
    console.log('❌ Error testing Google Sheets API:');
    console.log(error.message);
    
    if (error.code === 403) {
      console.log('\n💡 This might be due to:');
      console.log('   - Google Sheets API not enabled in Google Cloud Console');
      console.log('   - Service account lacks proper permissions');
      console.log('   - Sheet not shared with service account email');
    }
  }
}

testGoogleSheets(); 