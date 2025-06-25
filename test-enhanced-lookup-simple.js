/**
 * Simple test for Enhanced Barcode Lookup Pipeline
 * Tests the new modular fallback system with a few key barcodes
 */

import { enhancedLookupProduct } from './src/lib/apis/enhanced-barcode-lookup.js'

async function testSimple() {
  console.log('🧪 Simple Enhanced Barcode Lookup Test\n')
  
  // Test a few key barcodes
  const testCases = [
    '7318690499534', // Swedish ICA (should hit GEPIR mock)
    '5000112634567', // UK Nestlé (should hit GEPIR mock)
    '4007817323456', // German Schwartau (should hit GEPIR mock)
    '9999999999999', // Unknown (should fall to AI inference)
  ]
  
  for (const barcode of testCases) {
    console.log(`\n🔍 Testing: ${barcode}`)
    console.log('-'.repeat(40))
    
    try {
      const result = await enhancedLookupProduct(barcode)
      
      console.log(`✅ Success: ${result.success}`)
      console.log(`📦 Product: ${result.product_name || 'Unknown'}`)
      console.log(`🏷️  Brand: ${result.brand || 'Unknown'}`)
      console.log(`🔗 Source: ${result.source || 'Unknown'}`)
      
      if (result.lookup_trace) {
        console.log(`📊 Attempts: ${result.lookup_trace.attempts.length}`)
        result.lookup_trace.attempts.forEach(attempt => {
          const status = attempt.success ? '✅' : '❌'
          console.log(`  ${status} ${attempt.source}`)
        })
      }
      
      if (result.financial_beneficiary) {
        console.log(`💰 Owner: ${result.financial_beneficiary}`)
        console.log(`🌍 Country: ${result.beneficiary_country}`)
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`)
    }
  }
  
  console.log('\n✅ Test completed!')
}

// Run the test
testSimple().catch(console.error) 