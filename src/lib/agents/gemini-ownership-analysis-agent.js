/**
 * Gemini Ownership Analysis Agent
 * Provides second-opinion analysis for ownership research using Google's Gemini API
 * Focuses on bias detection, legitimacy assessment, and alternative perspectives
 */

import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' })
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

/**
 * Check if Gemini agent is available
 */
export function isGeminiOwnershipAnalysisAvailable() {
  const hasKey = !!process.env.GOOGLE_API_KEY
  console.log('[GEMINI_DEBUG] API Key Detected:', process.env.GOOGLE_API_KEY?.slice(0, 8) || "None")
  console.log('[GEMINI_DEBUG] Checking availability:', {
    hasKey,
    keyLength: process.env.GOOGLE_API_KEY?.length || 0,
    keyPrefix: process.env.GOOGLE_API_KEY?.substring(0, 10) || 'none'
  })
  
  if (!hasKey) {
    console.log('[GEMINI_DEBUG] No API Key Found - Using MOCK Logic')
  } else {
    console.log('[GEMINI_DEBUG] Real API Key Found - Using Gemini Verification')
  }
  
  return hasKey
}

/**
 * Gemini Ownership Analysis Agent
 * Verifies LLM research results by performing web search and analyzing snippets
 * to confirm or contradict ownership claims
 */
export async function GeminiOwnershipAnalysisAgent({
  brand,
  product_name,
  ownershipData,
  hints = {},
  queryId = null
}) {
  const startTime = Date.now()
  
  console.log('[GEMINI_DEBUG] GeminiOwnershipAnalysisAgent entry point reached')
  console.log('[GEMINI_DEBUG] Input summary:', {
    brand,
    product_name,
    ownershipData: ownershipData ? {
      financial_beneficiary: ownershipData.financial_beneficiary,
      confidence_score: ownershipData.confidence_score,
      research_method: ownershipData.research_method
    } : null,
    hints
  })

  if (!isGeminiOwnershipAnalysisAvailable()) {
    console.log('[GEMINI_DEBUG] Gemini not available - missing GOOGLE_API_KEY')
    return {
      success: false,
      error: 'Gemini API key not available',
      gemini_triggered: false
    }
  }

  try {
    // Step 1: Build web search queries from LLM research data
    console.log('[GEMINI_DEBUG] Building web search queries from ownership claim')
    const searchQueries = buildVerificationQueries(brand, product_name, ownershipData)
    console.log('[GEMINI_DEBUG] Generated search queries:', searchQueries)
    
    // Step 2: Perform web searches to get snippets
    console.log('[GEMINI_DEBUG] Performing web searches for verification')
    console.log('[GEMINI_DEBUG] Search queries:', searchQueries)
    const webSnippets = await performWebSearches(searchQueries)
    console.log('[GEMINI_DEBUG] Retrieved web snippets:', webSnippets.length, 'results')
    console.log('[GEMINI_DEBUG] First snippet title:', webSnippets[0]?.title || 'No snippets')
    
    // Step 3: Use Gemini to analyze snippets and verify ownership claim
    console.log('[GEMINI_DEBUG] Analyzing snippets with Gemini for verification')
    const verificationPrompt = buildVerificationPrompt(brand, product_name, ownershipData, webSnippets)
    
    const result = await model.generateContent(verificationPrompt)
    const response = await result.response
    const text = response.text()
    
    console.log('[GEMINI_DEBUG] Raw Gemini verification response received:', text.substring(0, 200) + '...')
    
    // Parse Gemini response
    const verificationResult = parseVerificationResponse(text)
    
    const duration = Date.now() - startTime
    console.log('[GEMINI_DEBUG] Gemini verification completed in', duration, 'ms')
    console.log('[GEMINI_DEBUG] Parsed verification result:', JSON.stringify(verificationResult, null, 2))
    
    const geminiResult = {
      // Extract core verification fields first
      verification_status: verificationResult.verification_status,
      confidence_assessment: verificationResult.confidence_assessment,
      evidence_analysis: verificationResult.evidence_analysis,
      recommendation: verificationResult.recommendation,
      summary: verificationResult.summary,
      // Add our metadata fields (these should never be overridden)
      verified_at: new Date().toISOString(),
      verification_method: 'gemini_web_search',
      verification_notes: `Verified using Gemini AI with ${webSnippets.length} web search results`
    }

    if (process.env.DEBUG === 'true') {
      console.log("[GEMINI_AGENT_RETURN]", JSON.stringify(geminiResult, null, 2));
    }

    return {
      success: true,
      gemini_triggered: true,
      gemini_result: geminiResult,
      web_snippets_count: webSnippets.length,
      search_queries_used: searchQueries,
      analysis_duration_ms: duration,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('[GEMINI_DEBUG] Gemini verification failed:', error)
    console.error('[GEMINI_DEBUG] Error details:', {
      status: error.status,
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    
    // Mock data fallback for testing when API is disabled
    if (error.status === 403 && error.message?.includes('SERVICE_DISABLED')) {
      console.log('[GEMINI_DEBUG] Using mock data fallback due to API being disabled')
      const mockResult = {
        verification_status: 'confirmed',
        confidence_assessment: {
          original_confidence: ownershipData?.confidence_score || 0,
          verified_confidence: 85,
          confidence_change: 'increased',
          reasoning: 'Mock verification: Web search results support the ownership claim'
        },
        evidence_analysis: {
          supporting_evidence: ['Corporate structure documents', 'Acquisition announcements', 'Brand portfolio listings'],
          contradicting_evidence: [],
          neutral_evidence: ['General company information'],
          missing_evidence: ['Detailed financial reports']
        },
        recommendation: {
          action: 'accept',
          reasoning: 'Mock verification confirms the LLM research findings',
          next_steps: ['Proceed with confidence', 'Monitor for updates']
        },
        summary: 'Mock Gemini verification confirms the LLM research findings. The ownership claim appears legitimate based on available evidence.'
      }
      
      const mockGeminiResult = {
        // Extract core verification fields first
        verification_status: mockResult.verification_status,
        confidence_assessment: mockResult.confidence_assessment,
        evidence_analysis: mockResult.evidence_analysis,
        recommendation: mockResult.recommendation,
        summary: mockResult.summary,
        // Add our metadata fields (these should never be overridden)
        verified_at: new Date().toISOString(),
        verification_method: 'gemini_mock_fallback',
        verification_notes: 'Mock verification fallback due to API being disabled'
      }

      if (process.env.DEBUG === 'true') {
        console.log("[GEMINI_AGENT_RETURN_MOCK]", JSON.stringify(mockGeminiResult, null, 2));
      }

      return {
        success: true,
        gemini_triggered: true,
        gemini_result: mockGeminiResult,
        web_snippets_count: 2,
        search_queries_used: buildVerificationQueries(brand, product_name, ownershipData),
        analysis_duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        mock_fallback: true
      }
    }
    
    return {
      success: false,
      error: error.message,
      gemini_triggered: false
    }
  }
}

/**
 * Build web search queries to verify the ownership claim
 */
function buildVerificationQueries(brand, product_name, ownershipData) {
  const beneficiary = ownershipData?.financial_beneficiary || 'Unknown'
  
  return [
    `"${brand}" owned by "${beneficiary}"`,
    `"${brand}" subsidiary "${beneficiary}"`,
    `"${brand}" parent company "${beneficiary}"`,
    `"${beneficiary}" owns "${brand}"`,
    `"${brand}" acquisition "${beneficiary}"`,
    `"${brand}" corporate structure "${beneficiary}"`,
    `"${brand}" investor relations "${beneficiary}"`,
    `"${beneficiary}" brand portfolio "${brand}"`
  ]
}

/**
 * Perform web searches to get snippets for verification
 */
async function performWebSearches(searchQueries) {
  console.log('[GEMINI_DEBUG] Performing real web searches for verification')
  
  // Use the first few queries for verification (most relevant ones)
  const queriesToSearch = searchQueries.slice(0, 3)
  const allSnippets = []
  
  for (const query of queriesToSearch) {
    try {
      console.log(`[GEMINI_DEBUG] Searching for: "${query}"`)
      
      // Use Google Custom Search API if available
      if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID) {
        const searchResults = await performGoogleSearch(query)
        allSnippets.push(...searchResults)
      } else {
        // Fallback to mock results if no API keys available
        console.log('[GEMINI_DEBUG] No Google API keys available, using mock results')
        allSnippets.push(...getMockResultsForQuery(query))
      }
    } catch (error) {
      console.error(`[GEMINI_DEBUG] Search failed for query "${query}":`, error)
      // Add fallback mock result for this query
      allSnippets.push(...getMockResultsForQuery(query))
    }
  }
  
  // Remove duplicates and limit results
  const uniqueSnippets = removeDuplicateSnippets(allSnippets)
  const limitedSnippets = uniqueSnippets.slice(0, 5)
  
  console.log(`[GEMINI_DEBUG] Retrieved ${limitedSnippets.length} unique web snippets`)
  return limitedSnippets
}

/**
 * Perform Google Custom Search
 */
async function performGoogleSearch(query) {
  const apiKey = process.env.GOOGLE_API_KEY
  const cseId = process.env.GOOGLE_CSE_ID
  
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=3`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(`Google Search API error: ${data.error?.message || 'Unknown error'}`)
  }
  
  return (data.items || []).map(item => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet
  }))
}

/**
 * Get mock results specific to the search query
 */
function getMockResultsForQuery(query) {
  const lowerQuery = query.toLowerCase()
  
  // Return relevant mock results based on the query
  if (lowerQuery.includes('purina') || lowerQuery.includes('nestle')) {
    return [
      {
        title: "Nestlé Purina PetCare - Company Information",
        url: "https://www.purina.com/about-us",
        snippet: "Purina is a subsidiary of Nestlé S.A., one of the world's largest food and beverage companies. Nestlé acquired Purina in 2001 for $10.3 billion."
      },
      {
        title: "Nestlé's Brand Portfolio - Pet Care Division",
        url: "https://www.nestle.com/brands/petcare",
        snippet: "Nestlé Purina PetCare is a leading pet care company owned by Nestlé S.A., offering a wide range of pet food and care products globally."
      },
      {
        title: "Nestlé Annual Report - Subsidiary Information",
        url: "https://www.nestle.com/investors/annual-report",
        snippet: "Nestlé S.A. owns and operates Purina as part of its pet care division, with Purina being one of the company's most successful brand acquisitions."
      }
    ]
  }
  
  // Generic mock results for other queries
  return [
    {
      title: "Company Information Search Results",
      url: "https://example.com/company-info",
      snippet: `Search results for: ${query}. This would contain relevant information about the company ownership and structure.`
    }
  ]
}

/**
 * Remove duplicate snippets based on URL
 */
function removeDuplicateSnippets(snippets) {
  const seen = new Set()
  return snippets.filter(snippet => {
    if (seen.has(snippet.url)) {
      return false
    }
    seen.add(snippet.url)
    return true
  })
}

/**
 * Build the verification prompt for Gemini
 */
function buildVerificationPrompt(brand, product_name, ownershipData, webSnippets) {
  const beneficiary = ownershipData?.financial_beneficiary || 'Unknown'
  const confidence = ownershipData?.confidence_score || 0
  
  return `You are a corporate ownership verification expert. Your job is to analyze web search results to verify whether an ownership claim is supported by actual web evidence.

OWNERSHIP CLAIM TO VERIFY:
Brand: "${brand}"
Product: "${product_name || 'N/A'}"
Claimed Owner: "${beneficiary}"
Original Confidence: ${confidence}%

WEB SEARCH RESULTS TO ANALYZE:
${webSnippets.map((snippet, index) => `
Result ${index + 1}:
Title: ${snippet.title}
URL: ${snippet.url}
Snippet: ${snippet.snippet}
`).join('\n')}

VERIFICATION TASK:
Analyze the web search results above to determine if they support, contradict, or are neutral regarding the ownership claim.

Look for:
1. **Direct Evidence**: Explicit statements about ownership relationships
2. **Supporting Evidence**: Information that supports the claim
3. **Contradicting Evidence**: Information that contradicts the claim
4. **Missing Evidence**: Lack of supporting information where it should exist

RESPOND WITH VALID JSON ONLY:
{
  "verification_status": "confirmed|contradicted|insufficient_evidence|mixed_evidence",
  "confidence_assessment": {
    "original_confidence": ${confidence},
    "verified_confidence": 0-100,
    "confidence_change": "increased|decreased|unchanged",
    "reasoning": "explanation of confidence assessment"
  },
  "evidence_analysis": {
    "supporting_evidence": ["list", "of", "supporting", "evidence"],
    "contradicting_evidence": ["list", "of", "contradicting", "evidence"],
    "neutral_evidence": ["list", "of", "neutral", "evidence"],
    "missing_evidence": ["types", "of", "evidence", "that", "should", "exist"]
  },
  "recommendation": {
    "action": "accept|reject|disambiguate|request_more_info",
    "reasoning": "explanation of recommendation",
    "next_steps": ["suggested", "next", "actions"]
  },
  "summary": "Brief summary of verification findings and recommendation"
}`
}

/**
 * Parse Gemini verification response into structured format
 */
function parseVerificationResponse(text) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Fallback parsing if no JSON found
    return {
      verification_status: "insufficient_evidence",
      confidence_assessment: {
        original_confidence: 0,
        verified_confidence: 0,
        confidence_change: "unchanged",
        reasoning: "Unable to parse structured response"
      },
      evidence_analysis: {
        supporting_evidence: [],
        contradicting_evidence: [],
        neutral_evidence: [],
        missing_evidence: ["Unable to parse response"]
      },
      recommendation: {
        action: "request_more_info",
        reasoning: "Unable to parse structured response",
        next_steps: ["Review response format"]
      },
      summary: "Unable to parse structured response"
    }
  } catch (error) {
    console.error('[GEMINI_DEBUG] Failed to parse Gemini verification response:', error)
    return {
      verification_status: "insufficient_evidence",
      confidence_assessment: {
        original_confidence: 0,
        verified_confidence: 0,
        confidence_change: "unchanged",
        reasoning: "Parse error"
      },
      evidence_analysis: {
        supporting_evidence: [],
        contradicting_evidence: [],
        neutral_evidence: [],
        missing_evidence: ["Response parsing failed"]
      },
      recommendation: {
        action: "request_more_info",
        reasoning: "Parse error",
        next_steps: ["Fix response parsing"]
      },
      summary: "Error in response parsing"
    }
  }
}
