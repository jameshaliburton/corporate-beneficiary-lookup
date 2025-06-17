import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
)

export interface ProductData {
  id?: number
  barcode: string
  product_name?: string
  brand?: string
  financial_beneficiary: string
  beneficiary_country: string
  confidence_score?: number
  ownership_structure_type?: string
  created_at?: string
}

export interface ScanLog {
  id?: number
  barcode: string
  timestamp?: string
  result_type: string
}

export async function checkBarcodeExists(barcode: string): Promise<boolean> {
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

export async function insertProduct(productData: ProductData): Promise<ProductData | null> {
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .maybeSingle()
  if (error) {
    console.error('Error inserting product:', error)
    throw error
  }
  return data as ProductData
}

export async function getProductByBarcode(barcode: string): Promise<ProductData | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle()
  if (error) {
    console.error('Error retrieving product:', error)
    throw error
  }
  return data as ProductData
}

export async function logScan(barcode: string, resultType: string): Promise<ScanLog | null> {
  const { data, error } = await supabase
    .from('scan_logs')
    .insert({ barcode, result_type: resultType })
    .select()
    .maybeSingle()
  if (error) {
    console.error('Error logging scan:', error)
    throw error
  }
  return data as ScanLog
} 