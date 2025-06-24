import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

console.log('🔍 Environment Variable Debug:')
console.log('GOOGLE_SERVICE_ACCOUNT_KEY_FILE:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE)
console.log('GOOGLE_SHEETS_EVALUATION_ID:', process.env.GOOGLE_SHEETS_EVALUATION_ID)
console.log('ENABLE_EVALUATION_LOGGING:', process.env.ENABLE_EVALUATION_LOGGING)

// Check if the key file exists
import fs from 'fs'
const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE
if (keyFile) {
  const exists = fs.existsSync(keyFile)
  console.log('Key file exists:', exists)
  if (exists) {
    const stats = fs.statSync(keyFile)
    console.log('Key file size:', stats.size, 'bytes')
  }
} else {
  console.log('❌ GOOGLE_SERVICE_ACCOUNT_KEY_FILE not set')
} 