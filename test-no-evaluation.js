import dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })

console.log('🧪 Testing agent without evaluation logging...')

// Create a minimal test that bypasses evaluation logging
try {
  // Import only the core components we need
  const { lookupOwnershipMapping, mappingToResult } = await import('./src/lib/database/ownership-mappings.js')
  const { upsertProduct, ownershipResultToProductData } = await import('./src/lib/database/products.js')
  
  console.log('🔍 Testing with "Nestlé" brand (should hit static mapping)...')
  
  // Step 1: Check static mapping
  const mapping = await lookupOwnershipMapping('Nestlé')
  console.log('✅ Static mapping lookup:', mapping ? 'Found' : 'Not found')
  
  if (mapping) {
    // Step 2: Convert to result
    const result = mappingToResult(mapping)
    console.log('✅ Result conversion:', result.financial_beneficiary)
    
    // Step 3: Save to database (without evaluation logging)
    const productData = ownershipResultToProductData('123456789', 'Nestlé Test Product', 'Nestlé', result)
    const dbResult = await upsertProduct(productData)
    console.log('✅ Database save:', dbResult.success ? 'Success' : 'Failed')
    
    console.log('🎯 Test completed successfully!')
    console.log('Final result:', {
      financial_beneficiary: result.financial_beneficiary,
      confidence_score: result.confidence_score,
      result_type: result.result_type
    })
  } else {
    console.log('❌ No static mapping found for Nestlé')
  }
} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Stack:', error.stack)
} 