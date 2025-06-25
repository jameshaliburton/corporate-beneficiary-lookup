/**
 * Test Enhanced Barcode Lookup Pipeline
 * 
 * Tests the new modular fallback system with various barcode types:
 * - Swedish/Nordic barcodes (73xxxxx)
 * - UK barcodes (50xxxxx)
 * - German barcodes (40xxxxx)
 * - US barcodes (0xxxxxx)
 */

import { enhancedLookupProduct } from './src/lib/apis/enhanced-barcode-lookup.js'

// Test barcodes for different regions and sources
const testBarcodes = [
  // Swedish ICA products (should hit GEPIR mock data)
  '7318690499534', // ICA Tonfisk
  '7318690123456', // ICA Basic product
  
  // UK Nestlé products (should hit GEPIR mock data)
  '5000112634567', // Nestlé UK product
  '5000112789012', // Another Nestlé UK product
  
  // German products (should hit GEPIR mock data)
  '4007817323456', // Schwartau product
  '4007817456789', // Another Schwartau product
  
  // US products (should hit UPCitemdb)
  '0123456789012', // US product
  '1234567890123', // Another US product
  
  // European food products (should hit Open Food Facts)
  '3017620422003', // French product
  '4007817323456', // German product
  
  // Unknown barcodes (should fall through to AI inference)
  '9999999999999', // Unknown
  '8888888888888', // Another unknown
]

async function testEnhancedLookup() {
  console.log('🧪 Testing Enhanced Barcode Lookup Pipeline\n')
  console.log('=' .repeat(80))
  
  const results = []
  
  for (const barcode of testBarcodes) {
    console.log(`\n🔍 Testing barcode: ${barcode}`)
    console.log('-'.repeat(50))
    
    try {
      const startTime = Date.now()
      const result = await enhancedLookupProduct(barcode)
      const duration = Date.now() - startTime
      
      console.log(`✅ Result: ${result.success ? 'SUCCESS' : 'FAILED'}`)
      console.log(`📦 Product: ${result.product_name || 'Unknown'}`)
      console.log(`🏷️  Brand: ${result.brand || 'Unknown'}`)
      console.log(`🔗 Source: ${result.source || 'Unknown'}`)
      console.log(`⏱️  Duration: ${duration}ms`)
      
      if (result.lookup_trace) {
        console.log(`📊 Lookup trace:`)
        result.lookup_trace.attempts.forEach(attempt => {
          const status = attempt.success ? '✅' : '❌'
          console.log(`  ${status} ${attempt.source} (${attempt.timestamp})`)
        })
        console.log(`📈 Final result: ${result.lookup_trace.final_result}`)
        console.log(`⏱️  Total duration: ${result.lookup_trace.total_duration_ms}ms`)
      }
      
      if (result.financial_beneficiary) {
        console.log(`💰 Financial beneficiary: ${result.financial_beneficiary}`)
        console.log(`🌍 Country: ${result.beneficiary_country}`)
        console.log(`🏳️  Flag: ${result.beneficiary_flag}`)
      }
      
      results.push({
        barcode,
        success: result.success,
        product_name: result.product_name,
        brand: result.brand,
        source: result.source,
        duration,
        has_ownership: !!result.financial_beneficiary,
        lookup_trace: result.lookup_trace
      })
      
    } catch (error) {
      console.error(`❌ Error testing barcode ${barcode}:`, error.message)
      results.push({
        barcode,
        success: false,
        error: error.message
      })
    }
  }
  
  // Summary statistics
  console.log('\n' + '='.repeat(80))
  console.log('📊 SUMMARY STATISTICS')
  console.log('='.repeat(80))
  
  const successful = results.filter(r => r.success)
  const withOwnership = results.filter(r => r.has_ownership)
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length
  
  console.log(`📈 Total tests: ${results.length}`)
  console.log(`✅ Successful lookups: ${successful.length} (${(successful.length / results.length * 100).toFixed(1)}%)`)
  console.log(`💰 With ownership data: ${withOwnership.length} (${(withOwnership.length / results.length * 100).toFixed(1)}%)`)
  console.log(`⏱️  Average duration: ${avgDuration.toFixed(0)}ms`)
  
  // Source breakdown
  const sourceCounts = {}
  results.forEach(r => {
    if (r.source) {
      sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1
    }
  })
  
  console.log('\n📊 Source breakdown:')
  Object.entries(sourceCounts).forEach(([source, count]) => {
    console.log(`  ${source}: ${count} (${(count / results.length * 100).toFixed(1)}%)`)
  })
  
  // Detailed results table
  console.log('\n📋 DETAILED RESULTS')
  console.log('='.repeat(80))
  console.log('Barcode'.padEnd(15) + 'Product'.padEnd(30) + 'Brand'.padEnd(20) + 'Source'.padEnd(20) + 'Ownership'.padEnd(10) + 'Duration')
  console.log('-'.repeat(120))
  
  results.forEach(r => {
    const product = (r.product_name || 'Unknown').substring(0, 28) + (r.product_name && r.product_name.length > 28 ? '..' : '')
    const brand = (r.brand || 'Unknown').substring(0, 18) + (r.brand && r.brand.length > 18 ? '..' : '')
    const ownership = r.has_ownership ? 'Yes' : 'No'
    const duration = r.duration ? `${r.duration}ms` : 'N/A'
    
    console.log(
      r.barcode.padEnd(15) +
      product.padEnd(30) +
      brand.padEnd(20) +
      (r.source || 'Unknown').padEnd(20) +
      ownership.padEnd(10) +
      duration
    )
  })
  
  return results
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedLookup()
    .then(results => {
      console.log('\n✅ Enhanced barcode lookup test completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}

export { testEnhancedLookup } 