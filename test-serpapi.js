/**
 * Test SerpAPI Google Shopping Search
 * 
 * This script tests the SerpAPI integration for barcode reverse search
 * Run this after adding your SERP_API_KEY to environment variables
 */

import { tryGoogleShopping } from './src/lib/apis/google-shopping-lookup.js'

async function testSerpAPI() {
  console.log('🧪 Testing SerpAPI Google Shopping Search...\n')
  
  // Check if API key is configured
  const serpApiKey = process.env.SERP_API_KEY
  
  if (!serpApiKey) {
    console.log('❌ SERP_API_KEY not found in environment variables')
    console.log('   Please add SERP_API_KEY=your_key_here to your .env.local file')
    return
  }
  
  console.log('✅ SERP_API_KEY found')
  console.log('   Key preview:', serpApiKey.substring(0, 10) + '...')
  
  // Test barcodes
  const testBarcodes = [
    '7318690499534', // ICA Tuna (Swedish)
    '5000112548604', // Nestle KitKat (UK)
    '4007817327321', // German product
    '1234567890123'  // Invalid/unknown barcode
  ]
  
  for (const barcode of testBarcodes) {
    console.log(`\n🔍 Testing barcode: ${barcode}`)
    console.log('─'.repeat(50))
    
    try {
      const startTime = Date.now()
      const result = await tryGoogleShopping(barcode)
      const duration = Date.now() - startTime
      
      if (result.success) {
        console.log('✅ Success!')
        console.log('   Product:', result.product_name)
        console.log('   Brand:', result.brand)
        console.log('   Price:', result.price)
        console.log('   Source:', result.source_url)
        console.log('   Duration:', duration + 'ms')
      } else {
        console.log('❌ Failed')
        console.log('   Reason:', result.reason)
        console.log('   Duration:', duration + 'ms')
      }
      
    } catch (error) {
      console.log('❌ Error:', error.message)
    }
  }
  
  console.log('\n📊 Test Summary')
  console.log('─'.repeat(50))
  console.log('• SerpAPI is ready for integration')
  console.log('• Add SERP_API_KEY to Vercel environment variables for deployment')
  console.log('• The enhanced lookup pipeline will automatically use this when available')
}

// Run the test
testSerpAPI().catch(console.error) 