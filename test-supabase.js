import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey ? 'Found' : 'Missing')
  
  try {
    const { data, error } = await supabase.from('test').select('*')
    if (error) {
      console.log('✅ Connected to Supabase! (Expected error since no tables exist yet)')
      console.log('Error details:', error.message)
    } else {
      console.log('✅ Connected successfully:', data)
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message)
  }
}

testConnection()