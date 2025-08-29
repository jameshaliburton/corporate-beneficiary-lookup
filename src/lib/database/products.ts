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
  beneficiary_flag?: string
  confidence_score?: number
  ownership_structure_type?: string
  result_type?: string
  static_mapping_used?: boolean
  web_research_used?: boolean
  user_contributed?: boolean
  inferred?: boolean
  created_at?: string
  updated_at?: string
  ownership_flow?: any[]
  sources?: string[]
  reasoning?: string
  web_sources_count?: number
  query_analysis_used?: boolean
  agent_execution_trace?: any
  initial_llm_confidence?: number
  agent_results?: any
  fallback_reason?: string
  verification_status?: string
  verification_confidence_change?: string
  verification_evidence?: any
  verified_at?: string
  verification_method?: string
  confidence_assessment?: any
  verification_notes?: string
}

export interface ProductStats {
  total: number
  byCountry: Record<string, number>
  byResultType: Record<string, number>
  userContributed: number
  inferred: number
  byConfidence: {
    high: number
    medium: number
    low: number
  }
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

export async function upsertProduct(productData: ProductData): Promise<ProductData | null> {
  const { data, error } = await supabase
    .from('products')
    .upsert([productData], { onConflict: 'barcode' })
    .select()
    .maybeSingle()
  if (error) {
    console.error('Error upserting product:', error)
    throw error
  }
  return data as ProductData
}

// Add the missing functions from the JavaScript version
export async function getFilteredProducts({
  limit = 100,
  offset = 0,
  search = '',
  country = '',
  result_type = '',
  sort_by = 'created_at',
  sort_order = 'desc',
  minConfidence,
  maxConfidence
}: {
  limit?: number
  offset?: number
  search?: string
  country?: string
  result_type?: string
  sort_by?: string
  sort_order?: string
  minConfidence?: number
  maxConfidence?: number
} = {}): Promise<{ success: boolean; data: ProductData[]; error?: any }> {
  try {
    let query = supabase
      .from('products')
      .select('*')

    if (search) {
      query = query.or(`product_name.ilike.%${search}%,brand.ilike.%${search}%,financial_beneficiary.ilike.%${search}%`)
    }
    if (country) {
      query = query.eq('beneficiary_country', country)
    }
    if (result_type) {
      query = query.eq('result_type', result_type)
    }
    if (minConfidence !== undefined) {
      query = query.gte('confidence_score', minConfidence)
    }
    if (maxConfidence !== undefined) {
      query = query.lte('confidence_score', maxConfidence)
    }
    if (sort_by) {
      query = query.order(sort_by, { ascending: sort_order === 'asc' })
    }
    if (typeof offset === 'number' && typeof limit === 'number') {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query
    if (error) {
      console.error('[Products] Filtered fetch error:', error)
      return { success: false, error, data: [] }
    }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('[Products] getFilteredProducts error:', error)
    return { success: false, error, data: [] }
  }
}

export async function getProductStats(): Promise<{ success: boolean; stats?: ProductStats; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('beneficiary_country, result_type, user_contributed, inferred, confidence_score')
    
    if (error) {
      console.error('[Products] Get stats error:', error)
      return { success: false, error }
    }
    
    const stats: ProductStats = {
      total: data.length,
      byCountry: {},
      byResultType: {},
      userContributed: 0,
      inferred: 0,
      byConfidence: {
        high: 0,    // 80-100
        medium: 0,  // 50-79
        low: 0      // 0-49
      }
    }
    
    data.forEach(product => {
      // Count by country
      const country = product.beneficiary_country || 'Unknown'
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1
      
      // Count by result type
      const resultType = product.result_type || 'unknown'
      stats.byResultType[resultType] = (stats.byResultType[resultType] || 0) + 1
      
      // Count user contributions
      if (product.user_contributed) stats.userContributed++
      if (product.inferred) stats.inferred++
      
      // Count by confidence
      const confidence = product.confidence_score || 0
      if (confidence >= 80) stats.byConfidence.high++
      else if (confidence >= 50) stats.byConfidence.medium++
      else stats.byConfidence.low++
    })
    
    return { success: true, stats }
    
  } catch (error) {
    console.error('[Products] Get stats error:', error)
    return { success: false, error }
  }
}

export async function getFilteredProductStats({
  search = '',
  country = '',
  result_type = '',
  minConfidence,
  maxConfidence
}: {
  search?: string
  country?: string
  result_type?: string
  minConfidence?: number
  maxConfidence?: number
} = {}): Promise<{ success: boolean; stats?: ProductStats; error?: any }> {
  try {
    let query = supabase
      .from('products')
      .select('beneficiary_country, result_type, user_contributed, inferred, confidence_score')
    
    if (search) {
      query = query.or(`product_name.ilike.%${search}%,brand.ilike.%${search}%,financial_beneficiary.ilike.%${search}%`)
    }
    if (country) {
      query = query.eq('beneficiary_country', country)
    }
    if (result_type) {
      query = query.eq('result_type', result_type)
    }
    if (minConfidence !== undefined) {
      query = query.gte('confidence_score', minConfidence)
    }
    if (maxConfidence !== undefined) {
      query = query.lte('confidence_score', maxConfidence)
    }

    const { data, error } = await query
    
    if (error) {
      console.error('[Products] Get filtered stats error:', error)
      return { success: false, error }
    }
    
    const stats: ProductStats = {
      total: data.length,
      byCountry: {},
      byResultType: {},
      userContributed: 0,
      inferred: 0,
      byConfidence: {
        high: 0,    // 80-100
        medium: 0,  // 50-79
        low: 0      // 0-49
      }
    }
    
    data.forEach(product => {
      // Count by country
      const country = product.beneficiary_country || 'Unknown'
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1
      
      // Count by result type
      const resultType = product.result_type || 'unknown'
      stats.byResultType[resultType] = (stats.byResultType[resultType] || 0) + 1
      
      // Count user contributions
      if (product.user_contributed) stats.userContributed++
      if (product.inferred) stats.inferred++
      
      // Count by confidence
      const confidence = product.confidence_score || 0
      if (confidence >= 80) stats.byConfidence.high++
      else if (confidence >= 50) stats.byConfidence.medium++
      else stats.byConfidence.low++
    })
    
    return { success: true, stats }
    
  } catch (error) {
    console.error('[Products] Get filtered stats error:', error)
    return { success: false, error }
  }
} 