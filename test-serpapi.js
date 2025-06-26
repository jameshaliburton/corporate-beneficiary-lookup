/**
 * Test SerpAPI Google Shopping Search
 * 
 * This script tests the SerpAPI integration for barcode reverse search
 * Run this after adding your SERP_API_KEY to environment variables
 */

import { config } from 'dotenv'
import { tryGoogleShopping } from './src/lib/apis/google-shopping-lookup.js'

// Load environment variables from .env.local
config({ path: '.env.local' })

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
    '7318690499534', // Swedish ICA tuna
    '4007817327321', // German product
    '5012345678900'  // UK product
  ]
  
  for (const barcode of testBarcodes) {
    console.log(`\n🔍 Testing barcode: ${barcode}`)
    
    try {
      const result = await tryGoogleShopping(barcode)
      
      if (result.success) {
        console.log('✅ Success!')
        console.log('   Product:', result.product_name || 'Unknown')
        console.log('   Brand:', result.brand || 'Unknown')
        console.log('   Price:', result.price || 'Unknown')
        console.log('   Source URL:', result.source_url || 'Unknown')
      } else {
        console.log('❌ Failed:', result.reason || result.error || 'Unknown error')
      }
    } catch (error) {
      console.log('❌ Error:', error.message)
    }
  }
  
  console.log('\n🎉 SerpAPI test complete!')
}

testSerpAPI().catch(console.error) 