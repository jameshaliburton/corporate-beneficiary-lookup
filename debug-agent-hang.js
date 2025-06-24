import dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })

console.log('🔍 Debugging agent hang...')

// Test 1: Basic imports
console.log('1. Testing basic imports...')
try {
  const { lookupOwnershipMapping } = await import('./src/lib/database/ownership-mappings.js')
  console.log('✅ Ownership mappings import OK')
} catch (error) {
  console.error('❌ Ownership mappings import failed:', error.message)
}

// Test 2: Database operations
console.log('2. Testing database operations...')
try {
  const { getProductByBarcode } = await import('./src/lib/database/products.js')
  console.log('✅ Products database import OK')
  
  const result = await getProductByBarcode('123456789')
  console.log('✅ Database query OK:', result ? 'Found' : 'Not found')
} catch (error) {
  console.error('❌ Database operations failed:', error.message)
}

// Test 3: Evaluation framework
console.log('3. Testing evaluation framework...')
try {
  const { adaptedEvaluationFramework } = await import('./src/lib/services/adapted-evaluation-framework.js')
  console.log('✅ Evaluation framework import OK')
  
  const results = await adaptedEvaluationFramework.getResults()
  console.log('✅ Evaluation framework query OK:', results.length, 'results')
} catch (error) {
  console.error('❌ Evaluation framework failed:', error.message)
}

// Test 4: Progress tracking
console.log('4. Testing progress tracking...')
try {
  const { emitProgress } = await import('./src/lib/utils.ts')
  console.log('✅ Progress tracking import OK')
  
  await emitProgress('test-123', 'test', 'started', { test: true })
  console.log('✅ Progress tracking OK')
} catch (error) {
  console.error('❌ Progress tracking failed:', error.message)
}

// Test 5: Static mapping lookup
console.log('5. Testing static mapping...')
try {
  const { lookupOwnershipMapping } = await import('./src/lib/database/ownership-mappings.js')
  const mapping = await lookupOwnershipMapping('Nestlé')
  console.log('✅ Static mapping lookup OK:', mapping ? 'Found' : 'Not found')
} catch (error) {
  console.error('❌ Static mapping failed:', error.message)
}

console.log('🎯 All basic components tested. If we get here, the hang is in the agent logic itself.') 