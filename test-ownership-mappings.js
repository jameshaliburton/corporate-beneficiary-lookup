import { lookupProduct } from './src/lib/apis/barcode-lookup.js'

async function testOwnershipMappings() {
  console.log('🧪 Testing Ownership Mappings Integration\n')
  
  // Test cases with known brands
  const testCases = [
    {
      barcode: '4902201746640',
      description: 'Kit Kat (Japan) - should find Nestlé ownership via brand inference'
    },
    {
      barcode: '049000028911',
      description: 'Coca-Cola - should find direct ownership'
    },
    {
      barcode: '028400090000',
      description: 'Pepsi - should find direct ownership'
    },
    {
      barcode: '028400090001',
      description: 'Unknown barcode - should fall back to AI inference'
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`📦 Testing: ${testCase.description}`)
    console.log(`   Barcode: ${testCase.barcode}`)
    
    try {
      const result = await lookupProduct(testCase.barcode)
      
      console.log(`   ✅ Success: ${result.success}`)
      console.log(`   📝 Product: ${result.product_name || 'N/A'}`)
      console.log(`   🏷️  Brand: ${result.brand || 'N/A'}`)
      console.log(`   💰 Beneficiary: ${result.financial_beneficiary || 'N/A'}`)
      console.log(`   🌍 Country: ${result.beneficiary_country || 'N/A'}`)
      console.log(`   🏳️  Flag: ${result.beneficiary_flag || 'N/A'}`)
      console.log(`   🔄 Result Type: ${result.result_type || 'N/A'}`)
      
      if (result.ownership_flow) {
        console.log(`   📊 Ownership Flow: ${result.ownership_flow.join(' → ')}`)
      }
      
      console.log(`   📡 Source: ${result.source || 'N/A'}`)
      console.log('')
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
      console.log('')
    }
  }
  
  console.log('🏁 Ownership mappings test complete!')
}

// Run the test
testOwnershipMappings().catch(console.error) 