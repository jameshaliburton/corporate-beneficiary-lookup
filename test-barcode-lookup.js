import { lookupProduct } from './src/lib/apis/barcode-lookup.js'

async function testBarcodeLookup() {
  console.log('Testing Barcode Lookup Service...\n')
  
  const testBarcodes = [
    { barcode: '798235653183', expected: 'Coca-Cola' },
    { barcode: '030772121108', expected: 'Tide' },
    { barcode: '4902201746640', expected: 'Kit Kat' },
    { barcode: '123456789', expected: 'Should fail' }
  ]
  
  for (const test of testBarcodes) {
    console.log(`Testing barcode: ${test.barcode} (${test.expected})`)
    try {
      const result = await lookupProduct(test.barcode)
      console.log('Result:', JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('❌ Error:', error.message)
    }
    console.log('---')
  }
}

testBarcodeLookup()