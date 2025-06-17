import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export async function checkBarcodeExists(barcode) {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('barcode', barcode)
    .maybeSingle()
  if (error) {
    console.error('Error checking barcode existence:', error)
    throw error
  }
  return !!data
}

export async function insertProduct(productData) {
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .maybeSingle()
  if (error) {
    console.error('Error inserting product:', error)
    throw error
  }
  return data
}

export async function getProductByBarcode(barcode) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle()
  if (error) {
    console.error('Error retrieving product:', error)
    throw error
  }
  return data
}

export async function logScan(barcode, resultType) {
  const { data, error } = await supabase
    .from('scan_logs')
    .insert({ barcode, result_type: resultType })
    .select()
    .maybeSingle()
  if (error) {
    console.error('Error logging scan:', error)
    throw error
  }
  return data
} 