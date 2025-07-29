/**
 * Generate unique result IDs for deep linking
 * Creates deterministic IDs based on brand, product, and timestamp
 */

import { createHash } from 'crypto'

/**
 * Generate a unique result ID based on brand, product, and timestamp
 * @param brand - Brand name
 * @param product_name - Product name (optional)
 * @param timestamp - Timestamp for uniqueness (optional, defaults to current time)
 * @returns A unique result ID string
 */
export function generateResultId(
  brand: string, 
  product_name?: string, 
  timestamp?: string
): string {
  const currentTimestamp = timestamp || new Date().toISOString()
  const normalizedBrand = brand.toLowerCase().trim()
  const normalizedProduct = product_name ? product_name.toLowerCase().trim() : ''
  
  // Create a deterministic hash from brand + product + timestamp
  const hashInput = `${normalizedBrand}::${normalizedProduct}::${currentTimestamp}`
  const hash = createHash('sha256').update(hashInput).digest('hex')
  
  // Return first 12 characters for readability (still unique enough)
  return hash.substring(0, 12)
}

/**
 * Generate a result ID with current timestamp
 * @param brand - Brand name
 * @param product_name - Product name (optional)
 * @returns A unique result ID string
 */
export function generateCurrentResultId(brand: string, product_name?: string): string {
  return generateResultId(brand, product_name)
}

/**
 * Validate if a result ID is in the correct format
 * @param resultId - The result ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidResultId(resultId: string): boolean {
  // Check if it's a 12-character hex string
  return /^[a-f0-9]{12}$/.test(resultId)
}

/**
 * Extract information from a result ID (for debugging)
 * Note: This is not reversible, but can be used for validation
 * @param resultId - The result ID to analyze
 * @returns Basic info about the result ID
 */
export function analyzeResultId(resultId: string): {
  isValid: boolean
  length: number
  format: string
} {
  return {
    isValid: isValidResultId(resultId),
    length: resultId.length,
    format: '12-character hex'
  }
} 