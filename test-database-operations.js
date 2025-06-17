import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function testDatabaseOperations() {
  console.log('Testing database operations...')
  
  // Test 1: Insert a test product
  const { data: insertData, error: insertError } = await supabase
    .from('products')
    .insert({
      barcode: '798235653183',
      product_name: 'Coca-Cola Coke Zero Cans 12-pk',
      brand: 'Coca Cola Company',
      financial_beneficiary: 'The Coca-Cola Company',
      beneficiary_country: 'United States',
      confidence_score: 95,
      ownership_structure_type: 'direct'
    })
    .select()

  if (insertError) {
    console.error('❌ Insert failed:', insertError)
  } else {
    console.log('✅ Insert successful:', insertData)
  }

  // Test 2: Read the data back
  const { data: selectData, error: selectError } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', '798235653183')

  if (selectError) {
    console.error('❌ Select failed:', selectError)
  } else {
    console.log('✅ Data retrieved:', selectData)
  }

  // Test 3: Log a scan
  const { data: logData, error: logError } = await supabase
    .from('scan_logs')
    .insert({
      barcode: '798235653183',
      result_type: 'cached'
    })
    .select()

  if (logError) {
    console.error('❌ Scan log failed:', logError)
  } else {
    console.log('✅ Scan logged:', logData)
  }
}

testDatabaseOperations()