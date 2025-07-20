#!/usr/bin/env node

import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

console.log('🔍 Environment Check Results:')
console.log('=============================')

// Check required environment variables
const requiredVars = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY', 
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'GOOGLE_SERVICE_ACCOUNT_KEY_JSON',
  'GOOGLE_API_KEY',
  'GOOGLE_CSE_ID'
]

const optionalVars = [
  'OPENCORPORATES_API_KEY',
  'GOOGLE_SHEET_EVALUATION_CASES',
  'GOOGLE_SHEET_EVALUATION_RESULTS', 
  'GOOGLE_SHEET_EVALUATION_STEPS',
  'GOOGLE_SHEET_OWNERSHIP_MAPPINGS'
]

console.log('\n📋 Required Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${varName}: NOT SET`)
  }
})

console.log('\n📋 Optional Variables:')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value}`)
  } else {
    console.log(`⚠️  ${varName}: NOT SET`)
  }
})

// Test Google Service Account Key parsing
console.log('\n🔑 Google Service Account Key Test:')
const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON
if (serviceAccountKey) {
  try {
    const parsed = JSON.parse(serviceAccountKey)
    console.log('✅ Service account key parsed successfully')
    console.log(`   Client email: ${parsed.client_email}`)
    console.log(`   Project ID: ${parsed.project_id}`)
    console.log(`   Private key length: ${parsed.private_key?.length || 0} characters`)
  } catch (error) {
    console.log('❌ Failed to parse service account key:', error.message)
  }
} else {
  console.log('❌ No service account key found')
}

console.log('\n🏁 Environment check complete!') 