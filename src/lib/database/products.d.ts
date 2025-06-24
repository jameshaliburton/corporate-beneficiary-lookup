declare module '*/products.js' {
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

  export function checkBarcodeExists(barcode: string): Promise<boolean>
  export function insertProduct(productData: ProductData): Promise<ProductData | null>
  export function getProductByBarcode(barcode: string): Promise<ProductData | null>
  export function logScan(barcode: string, resultType: string): Promise<any>
  export function upsertProduct(productData: ProductData): Promise<ProductData | null>
  export function updateProductOwnership(barcode: string, ownershipData: any): Promise<any>
  export function markProductAsUserContributed(barcode: string, userContribution: any): Promise<any>
  export function getAllProducts(limit?: number, offset?: number): Promise<any>
  export function searchProducts(query: string, limit?: number): Promise<any>
  export function getProductsByCountry(country: string, limit?: number): Promise<any>
  export function getProductsByResultType(resultType: string, limit?: number): Promise<any>
  export function getProductStats(): Promise<{ success: boolean; stats: ProductStats; error?: any }>
  export function getRecentScans(limit?: number): Promise<any>
  export function deleteProduct(barcode: string): Promise<any>
  export function validateProductData(productData: any): any
  export function ownershipResultToProductData(barcode: string, productName: string, brand: string, ownershipResult: any): any
  export function getFilteredProducts(options?: {
    limit?: number
    offset?: number
    search?: string
    country?: string
    result_type?: string
    sort_by?: string
    sort_order?: string
    minConfidence?: number
    maxConfidence?: number
  }): Promise<{ success: boolean; data: ProductData[]; error?: any }>
  export function getFilteredProductStats(options?: {
    search?: string
    country?: string
    result_type?: string
    minConfidence?: number
    maxConfidence?: number
  }): Promise<{ success: boolean; stats: ProductStats; error?: any }>
} 