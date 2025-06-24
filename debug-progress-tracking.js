import dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })

console.log('🔍 Debugging progress tracking...')

async function debugProgressTracking() {
  try {
    console.log('Step 1: Importing progress tracking...')
    const { emitProgress } = await import('./src/lib/utils.ts')
    console.log('✅ Progress tracking imported')
    
    console.log('Step 2: Testing progress emit...')
    await emitProgress('test-123', 'cache_check', 'started', { barcode: '123456789' })
    console.log('✅ Progress emit completed')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Add timeout
const timeout = setTimeout(() => {
  console.error('⏰ TIMEOUT: Progress tracking hung for more than 10 seconds')
  process.exit(1)
}, 10000)

debugProgressTracking().finally(() => {
  clearTimeout(timeout)
}) 