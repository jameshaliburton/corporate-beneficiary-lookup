/**
 * Paywall Detection System
 * Detects and caches domains that are behind paywalls to skip them in future queries
 */

export interface PaywalledDomain {
  domain: string
  detectedAt: string
  reason: 'http_403' | 'http_402' | 'http_429' | 'html_pattern' | 'redirect_pattern'
  pattern?: string
  lastChecked: string
}

export interface PaywallPattern {
  pattern: string
  description: string
  confidence: 'high' | 'medium' | 'low'
}

// Common paywall patterns to detect
const PAYWALL_PATTERNS: PaywallPattern[] = [
  {
    pattern: 'subscribe to read',
    description: 'Generic subscription prompt',
    confidence: 'high'
  },
  {
    pattern: 'paywall',
    description: 'Direct paywall mention',
    confidence: 'high'
  },
  {
    pattern: 'premium content',
    description: 'Premium content indicator',
    confidence: 'medium'
  },
  {
    pattern: 'sign up to continue',
    description: 'Sign-up requirement',
    confidence: 'medium'
  },
  {
    pattern: 'limited access',
    description: 'Access limitation',
    confidence: 'medium'
  },
  {
    pattern: 'free trial',
    description: 'Trial requirement',
    confidence: 'low'
  },
  {
    pattern: 'membership required',
    description: 'Membership requirement',
    confidence: 'medium'
  },
  {
    pattern: 'login to read',
    description: 'Login requirement',
    confidence: 'medium'
  }
]

// In-memory cache of paywalled domains (in production, this would be persisted)
const paywalledDomainsCache = new Map<string, PaywalledDomain>()

/**
 * Check if a domain is paywalled based on HTTP status code
 * @param statusCode - HTTP status code
 * @returns True if status indicates paywall
 */
export function isPaywallStatusCode(statusCode: number): boolean {
  return [402, 403, 429].includes(statusCode)
}

/**
 * Check if HTML content contains paywall patterns
 * @param htmlContent - HTML content to analyze
 * @returns Paywall detection result
 */
export function detectPaywallInHTML(htmlContent: string): {
  isPaywalled: boolean
  patterns: string[]
  confidence: 'high' | 'medium' | 'low'
} {
  const lowerContent = htmlContent.toLowerCase()
  const detectedPatterns: string[] = []
  let highestConfidence: 'high' | 'medium' | 'low' = 'low'

  for (const pattern of PAYWALL_PATTERNS) {
    if (lowerContent.includes(pattern.pattern)) {
      detectedPatterns.push(pattern.description)
      
      // Update confidence level
      if (pattern.confidence === 'high') {
        highestConfidence = 'high'
      } else if (pattern.confidence === 'medium' && highestConfidence !== 'high') {
        highestConfidence = 'medium'
      }
    }
  }

  return {
    isPaywalled: detectedPatterns.length > 0,
    patterns: detectedPatterns,
    confidence: highestConfidence
  }
}

/**
 * Check if a domain is in the paywall cache
 * @param domain - Domain to check
 * @returns True if domain is cached as paywalled
 */
export function isDomainPaywalled(domain: string): boolean {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '')
  return paywalledDomainsCache.has(normalizedDomain)
}

/**
 * Add a domain to the paywall cache
 * @param domain - Domain to mark as paywalled
 * @param reason - Reason for paywall detection
 * @param pattern - Optional pattern that triggered detection
 */
export function markDomainAsPaywalled(
  domain: string, 
  reason: PaywalledDomain['reason'], 
  pattern?: string
): void {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '')
  const now = new Date().toISOString()
  
  paywalledDomainsCache.set(normalizedDomain, {
    domain: normalizedDomain,
    detectedAt: now,
    reason,
    pattern,
    lastChecked: now
  })
  
  console.log(`[PaywallDetection] Marked domain as paywalled: ${normalizedDomain} (${reason})`)
}

/**
 * Check if a URL should be skipped due to paywall
 * @param url - URL to check
 * @returns True if URL should be skipped
 */
export function shouldSkipUrl(url: string): boolean {
  try {
    const domain = new URL(url).hostname
    return isDomainPaywalled(domain)
  } catch (error) {
    console.warn(`[PaywallDetection] Invalid URL: ${url}`)
    return false
  }
}

/**
 * Filter out paywalled URLs from a list
 * @param urls - List of URLs to filter
 * @returns URLs that are not paywalled
 */
export function filterPaywalledUrls(urls: string[]): string[] {
  return urls.filter(url => !shouldSkipUrl(url))
}

/**
 * Get all paywalled domains (for debugging/admin)
 * @returns Array of paywalled domain info
 */
export function getPaywalledDomains(): PaywalledDomain[] {
  return Array.from(paywalledDomainsCache.values())
}

/**
 * Clear paywall cache (for testing/admin)
 */
export function clearPaywallCache(): void {
  paywalledDomainsCache.clear()
  console.log('[PaywallDetection] Paywall cache cleared')
}

/**
 * Get paywall cache statistics
 * @returns Cache statistics
 */
export function getPaywallCacheStats(): {
  totalDomains: number
  byReason: Record<string, number>
} {
  const byReason: Record<string, number> = {}
  
  for (const domain of paywalledDomainsCache.values()) {
    byReason[domain.reason] = (byReason[domain.reason] || 0) + 1
  }
  
  return {
    totalDomains: paywalledDomainsCache.size,
    byReason
  }
} 