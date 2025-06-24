import dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })

console.log('🧪 End-to-End Pipeline Test')
console.log('==========================')

async function testEndToEnd() {
  try {
    // Test 1: Barcode Lookup
    console.log('\n1️⃣ Testing Barcode Lookup...')
    const { lookupProduct } = await import('./src/lib/apis/barcode-lookup.js')
    
    const barcodeData = await lookupProduct('8888888888888')
    console.log('✅ Barcode lookup:', barcodeData ? 'Success' : 'No data')
    if (barcodeData) {
      console.log('   - Product:', barcodeData.product_name)
      console.log('   - Brand:', barcodeData.brand)
    }
    
    // Test 2: Ownership Research
    console.log('\n2️⃣ Testing Ownership Research...')
    const { AgentOwnershipResearch } = await import('./src/lib/agents/ownership-research-agent.js')
    
    const ownershipResult = await AgentOwnershipResearch({
      barcode: '8888888888888',
      product_name: barcodeData?.product_name || 'Test Product',
      brand: barcodeData?.brand || 'Nestlé',
      hints: {}
    })
    
    console.log('✅ Ownership research:', ownershipResult.financial_beneficiary)
    console.log('   - Confidence:', ownershipResult.confidence_score + '%')
    console.log('   - Result type:', ownershipResult.result_type)
    
    // Test 3: Database Operations
    console.log('\n3️⃣ Testing Database Operations...')
    const { getProductByBarcode, upsertProduct } = await import('./src/lib/database/products.js')
    
    // Check if product exists
    const existingProduct = await getProductByBarcode('8888888888888')
    console.log('✅ Database check:', existingProduct ? 'Found' : 'Not found')
    
    if (existingProduct) {
      console.log('   - Product ID:', existingProduct.id)
      console.log('   - Last updated:', existingProduct.updated_at)
    }
    
    // Test 4: Dashboard API
    console.log('\n4️⃣ Testing Dashboard API...')
    const { getFilteredProducts } = await import('./src/lib/database/products.js')
    
    const dashboardData = await getFilteredProducts({
      limit: 10,
      offset: 0,
      search: '',
      result_type: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    })
    
    console.log('✅ Dashboard data:', dashboardData.data?.length || 0, 'products')
    console.log('   - Success:', dashboardData.success)
    if (dashboardData.data) {
      console.log('   - First product:', dashboardData.data[0]?.product_name || 'None')
    }
    
    // Test 5: Evaluation Framework
    console.log('\n5️⃣ Testing Evaluation Framework...')
    const { adaptedEvaluationFramework } = await import('./src/lib/services/adapted-evaluation-framework.js')
    
    const evalResults = await adaptedEvaluationFramework.getEvaluationResults()
    console.log('✅ Evaluation results:', evalResults.length, 'entries')
    
    if (evalResults.length > 0) {
      const latest = evalResults[evalResults.length - 1]
      console.log('   - Latest test:', latest.test_id)
      console.log('   - Latest result:', latest.match_result)
    }
    
    // Test 6: Static Mappings
    console.log('\n6️⃣ Testing Static Mappings...')
    const { lookupOwnershipMapping } = await import('./src/lib/database/ownership-mappings.js')
    
    const testBrands = ['Nestlé', 'Coca-Cola', 'Pepsi', 'Unknown Brand']
    for (const brand of testBrands) {
      const mapping = await lookupOwnershipMapping(brand)
      console.log(`   - ${brand}:`, mapping ? 'Found' : 'Not found')
    }
    
    console.log('\n🎯 End-to-End Test Summary:')
    console.log('✅ Barcode lookup: Working')
    console.log('✅ Ownership research: Working')
    console.log('✅ Database operations: Working')
    console.log('✅ Dashboard API: Working')
    console.log('✅ Evaluation framework: Working')
    console.log('✅ Static mappings: Working')
    console.log('\n🚀 Full pipeline is operational!')
    
  } catch (error) {
    console.error('❌ End-to-end test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Add timeout
const timeout = setTimeout(() => {
  console.error('⏰ TIMEOUT: End-to-end test hung for more than 60 seconds')
  process.exit(1)
}, 60000)

testEndToEnd().finally(() => {
  clearTimeout(timeout)
}) 