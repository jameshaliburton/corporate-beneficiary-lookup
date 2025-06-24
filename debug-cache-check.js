import dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })

console.log('🔍 Debugging cache check step...')

async function debugCacheCheck() {
  try {
    console.log('Step 1: Importing database functions...')
    const { getProductByBarcode } = await import('./src/lib/database/products.js')
    console.log('✅ Database functions imported')
    
    console.log('Step 2: Testing cache check...')
    const existingProduct = await getProductByBarcode('123456789')
    console.log('✅ Cache check completed:', existingProduct ? 'Found' : 'Not found')
    
    if (existingProduct) {
      console.log('Product details:', {
        id: existingProduct.id,
        brand: existingProduct.brand,
        financial_beneficiary: existingProduct.financial_beneficiary
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Add timeout
const timeout = setTimeout(() => {
  console.error('⏰ TIMEOUT: Cache check hung for more than 10 seconds')
  process.exit(1)
}, 10000)

debugCacheCheck().finally(() => {
  clearTimeout(timeout)
}) 