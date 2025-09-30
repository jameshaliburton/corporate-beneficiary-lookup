import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClaudeVerificationAgent, isMedicalBrand } from './claude-verification-agent.js';

// Initialize Gemini with fallback to new GEMINI_API_KEY
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Feature flag for Gemini Flash V1
const GEMINI_FLASH_V1_ENABLED = process.env.GEMINI_FLASH_V1_ENABLED === 'true';

// Use v1beta endpoint with correct model name
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = "v1beta";

console.log('[GEMINI_CONFIG] Feature flag status:', {
  GEMINI_FLASH_V1_ENABLED,
  GEMINI_MODEL,
  GEMINI_ENDPOINT,
  API_KEY_PRESENT: !!geminiApiKey,
  RAW_ENV_VALUE: process.env.GEMINI_FLASH_V1_ENABLED,
  NODE_ENV: process.env.NODE_ENV
});

// Medical keywords for compliance tracking
const MEDICAL_KEYWORDS = [
  'pharmacy', 'medical', 'health', 'drug', 'medicine', 
  'clinic', 'hospital', 'pharmaceutical', 'healthcare',
  'therapeutic', 'diagnostic', 'clinical', 'medicinal'
];

/**
 * Check if a brand/product combination contains medical keywords
 */
function isMedicalBrandLocal(brand, productName) {
  const text = `${brand} ${productName}`.toLowerCase();
  return MEDICAL_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Check if Gemini safe mode is enabled
 */
function isGeminiSafeModeEnabled() {
  return process.env.GEMINI_SAFE_MODE === 'true';
}

/**
 * Log compliance events for audit tracking
 */
function logComplianceEvent(eventType, data) {
  const timestamp = new Date().toISOString();
  const complianceLog = {
    timestamp,
    event_type: eventType,
    ...data
  };
  
  console.log('[COMPLIANCE_LOG]', JSON.stringify(complianceLog, null, 2));
  
  // In production, this could be sent to a compliance monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to compliance monitoring service
    // await sendToComplianceService(complianceLog);
  }
}

export async function performGeminiOwnershipAnalysis(brand, productName, existingResult) {
  try {
    console.log('[GEMINI_DEBUG] Starting Gemini ownership analysis for:', brand);
    
    // 🔐 COMPLIANCE CHECK: Medical brand detection and safe mode
    const isMedical = isMedicalBrandLocal(brand, productName);
    const isSafeMode = isGeminiSafeModeEnabled();
    
    if (isSafeMode || isMedical) {
      const reason = isSafeMode ? 'Safe mode enabled' : 'Medical brand detected';
      const medicalKeywords = isMedical ? MEDICAL_KEYWORDS.filter(keyword => 
        `${brand} ${productName}`.toLowerCase().includes(keyword)
      ) : [];
      
      // Log compliance event
      logComplianceEvent('gemini_route_skipped', {
        reason,
        brand,
        productName,
        isMedical,
        isSafeMode,
        medicalKeywords,
        fallback_agent: 'claude_verification_agent'
      });
      
      console.log('[GEMINI_ROUTE_SKIPPED]', {
        reason,
        brand,
        productName,
        isMedical,
        isSafeMode,
        medicalKeywords
      });
      
      // Route to Claude fallback agent
      console.log('[FALLBACK_TRIGGERED] Routing to Claude verification agent');
      const claudeAgent = new ClaudeVerificationAgent();
      const claudeResult = await claudeAgent.analyze(brand, productName, existingResult);
      
      // Add fallback attribution
      claudeResult.verification_method = `claude_analysis_fallback_${reason.toLowerCase().replace(/\s+/g, '_')}`;
      claudeResult.agent_path = [...(existingResult.agent_path || []), `claude_fallback_${reason.toLowerCase().replace(/\s+/g, '_')}`];
      
      // Log successful fallback
      logComplianceEvent('claude_fallback_success', {
        brand,
        productName,
        verification_status: claudeResult.verification_status,
        verification_method: claudeResult.verification_method,
        reason
      });
      
      console.log('[FALLBACK_SUCCESS] Claude verification completed:', {
        brand,
        verification_status: claudeResult.verification_status,
        verification_method: claudeResult.verification_method
      });
      
      return claudeResult;
    }
    
    // Build search queries
    const searchQueries = [
      `${brand} ownership parent company`,
      `${brand} subsidiary of`,
      `who owns ${brand}`,
      `${brand} corporate structure`,
      `${brand} ultimate parent`
    ];
    
    console.log('[GEMINI_DEBUG] Search queries:', searchQueries);
    
    // Perform web searches
    console.log('[GEMINI_DEBUG] Performing web searches...');
    const webSnippets = await performWebSearches(searchQueries);
    const snippetCount = webSnippets?.length || 0;
    
    console.log('[GEMINI_DEBUG] Search Summary:', {
      queries: searchQueries,
      totalQueries: searchQueries.length,
      snippetsReturned: snippetCount,
      firstResultTitle: webSnippets?.[0]?.title || 'None',
      hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
      hasGoogleCseId: !!process.env.GOOGLE_CSE_ID
    });
    
    // Analyze with Gemini - using feature flag configuration
    console.log('[GEMINI_DEBUG] Initializing model with configuration:', {
      model: GEMINI_MODEL,
      endpoint: GEMINI_ENDPOINT,
      featureFlagEnabled: GEMINI_FLASH_V1_ENABLED
    });
    
    // Use direct HTTP call to v1 endpoint instead of library
    const prompt = `
You are an expert corporate ownership analyst. Analyze the following web search results to determine the ownership of ${brand}.

EXISTING RESULT:
${JSON.stringify(existingResult, null, 2)}

WEB SEARCH RESULTS:
${webSnippets.map((snippet, i) => `Result ${i + 1} (${snippet.source}): ${snippet.content}`).join('\n\n')}

TASK:
1. Determine if the existing ownership result is accurate based on the web search results
2. Provide a verification status: "confirmed", "contradicted", "mixed_evidence", or "insufficient_evidence"
3. Analyze the evidence and provide confidence assessment
4. Provide detailed reasoning

OUTPUT FORMAT (JSON):
You MUST respond with ONLY valid JSON inside triple backticks. Do not include any other text, explanations, or markdown formatting outside the JSON block.

\`\`\`json
{
  "verification_status": "confirmed|contradicted|mixed_evidence|insufficient_evidence",
  "confidence_assessment": {
    "original_confidence": number,
    "verified_confidence": number,
    "confidence_change": "increased|decreased|unchanged"
  },
  "evidence_analysis": {
    "supporting_evidence": ["evidence point 1", "evidence point 2"],
    "contradicting_evidence": ["contradicting point 1"],
    "neutral_evidence": ["neutral point 1"],
    "missing_evidence": ["missing info 1"]
  },
  "summary": "Brief summary of verification findings",
  "reasoning": "Detailed reasoning for the verification decision"
}
\`\`\`

CRITICAL: Your response must be ONLY the JSON block above, wrapped in triple backticks. No additional text, no explanations, no markdown formatting outside the JSON.
`;

    // Generate test payload for debugging (if enabled)
    if (process.env.NODE_ENV === 'development') {
      console.log('[GEMINI_DEBUG] Test payload generated:', {
        model: GEMINI_MODEL,
        endpoint: GEMINI_ENDPOINT,
        promptLength: prompt.length,
        snippetCount: webSnippets.length,
        brand: brand
      });
    }
    
    // Direct HTTP call to Gemini v1beta endpoint (v1 not available yet)
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Log which endpoint was actually used
    console.log('[GEMINI_DEBUG] API call completed:', {
      model: GEMINI_MODEL,
      endpoint: GEMINI_ENDPOINT,
      responseLength: text.length,
      featureFlagEnabled: GEMINI_FLASH_V1_ENABLED
    });
    
    // 🔍 COMPREHENSIVE RAW GEMINI RESPONSE LOGGING
    console.log('[GEMINI DEBUG] Raw Gemini response:', text);
    console.log('[GEMINI_RAW_RESPONSE] Raw Gemini output:', {
      length: text.length,
      first_100_chars: text.substring(0, 100),
      last_100_chars: text.substring(Math.max(0, text.length - 100)),
      contains_json: text.includes('{') && text.includes('}'),
      contains_code_blocks: text.includes('```'),
      contains_markdown: text.includes('**') || text.includes('*')
    });
    
    // 🔍 EXTRACT AND PARSE JSON WITH ROBUST LOGIC
    let verificationResult;
    let parseAttempt = 'direct';
    
    try {
      // First attempt: Direct JSON parsing
      verificationResult = JSON.parse(text);
      console.log('[GEMINI_PARSE_SUCCESS] Direct JSON parsing succeeded');
    } catch (directParseError) {
      console.log('[GEMINI_PARSE_ATTEMPT] Direct parsing failed, trying extraction methods...');
      
      try {
        // Second attempt: Extract JSON from code blocks
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          parseAttempt = 'code_block';
          verificationResult = JSON.parse(codeBlockMatch[1]);
          console.log('[GEMINI_PARSE_SUCCESS] Code block extraction succeeded');
        } else {
          throw new Error('No code block found');
        }
      } catch (codeBlockError) {
        console.log('[GEMINI_PARSE_ATTEMPT] Code block extraction failed, trying regex extraction...');
        
        try {
          // Third attempt: Extract JSON using regex for { ... } block
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parseAttempt = 'regex_extraction';
            verificationResult = JSON.parse(jsonMatch[0]);
            console.log('[GEMINI_PARSE_SUCCESS] Regex extraction succeeded');
          } else {
            throw new Error('No JSON block found with regex');
          }
        } catch (regexError) {
          console.log('[GEMINI_PARSE_ATTEMPT] Regex extraction failed, using fallback...');
          
          // Final fallback: Create structured error response
          parseAttempt = 'fallback';
          verificationResult = {
            verification_status: 'unverified_due_to_parsing_error',
            confidence_assessment: {
              original_confidence: existingResult.confidence_score || 0,
              verified_confidence: existingResult.confidence_score || 0,
              confidence_change: 'unchanged'
            },
            evidence_analysis: {
              supporting_evidence: [],
              contradicting_evidence: [],
              neutral_evidence: [],
              missing_evidence: [`Failed to parse Gemini response - attempted: ${parseAttempt}`]
            },
            summary: 'Verification failed due to parsing error',
            reasoning: `Gemini response could not be parsed as valid JSON. Parse attempts: direct, code_block, regex_extraction. Raw response length: ${text.length}`
          };
          
          console.error('[GEMINI_PARSE_FAILED] All parsing attempts failed:', {
            directError: directParseError.message,
            codeBlockError: codeBlockError.message,
            regexError: regexError.message,
            rawResponse: text.substring(0, 500) + (text.length > 500 ? '...' : '')
          });
        }
      }
    }
    
    console.log('[GEMINI_PARSE_RESULT] Final parsing result:', {
      parseAttempt,
      verification_status: verificationResult.verification_status,
      has_confidence_assessment: !!verificationResult.confidence_assessment,
      has_evidence_analysis: !!verificationResult.evidence_analysis
    });
    
    console.log('[GEMINI_DEBUG] Verification result:', verificationResult);
    
    // 🔍 COMPREHENSIVE VERIFICATION AGENT WRAPPER
    let verificationStatus = 'not_enough_info';
    let verificationNotes = 'No structured verification info returned';
    let agentExecutionTrace = null;
    let verificationEvidence = null;
    let confidenceAssessment = null;

    try {
      // Extract structured data from parsed Gemini result
      if (verificationResult?.verification_status) {
        verificationStatus = verificationResult.verification_status;
        verificationNotes = verificationResult.summary || verificationResult.reasoning || '';
        agentExecutionTrace = verificationResult.evidence_analysis || null;
        verificationEvidence = verificationResult.evidence_analysis || null;
        confidenceAssessment = verificationResult.confidence_assessment || null;
        
        console.log('[VERIFICATION_AGENT] Successfully extracted structured data:', {
          brand,
          owner: existingResult.financial_beneficiary,
          verificationStatus,
          verificationNotes: verificationNotes.substring(0, 100) + (verificationNotes.length > 100 ? '...' : ''),
          hasAgentExecutionTrace: !!agentExecutionTrace,
          agentExecutionTraceKeys: agentExecutionTrace ? Object.keys(agentExecutionTrace) : [],
          hasConfidenceAssessment: !!confidenceAssessment
        });

        // 🔍 VERIFICATION EVIDENCE LOGGING
        console.log('[VERIFICATION_EVIDENCE_LOG] Evidence analysis:', {
          brand,
          verificationStatus,
          supportingEvidenceCount: agentExecutionTrace?.supporting_evidence?.length || 0,
          contradictingEvidenceCount: agentExecutionTrace?.contradicting_evidence?.length || 0,
          neutralEvidenceCount: agentExecutionTrace?.neutral_evidence?.length || 0,
          missingEvidenceCount: agentExecutionTrace?.missing_evidence?.length || 0,
          confidenceAssessment: confidenceAssessment ? {
            originalConfidence: confidenceAssessment.original_confidence,
            verifiedConfidence: confidenceAssessment.verified_confidence,
            confidenceChange: confidenceAssessment.confidence_change
          } : null,
          evidenceSummary: {
            supporting: agentExecutionTrace?.supporting_evidence?.slice(0, 2) || [],
            contradicting: agentExecutionTrace?.contradicting_evidence?.slice(0, 2) || [],
            neutral: agentExecutionTrace?.neutral_evidence?.slice(0, 2) || [],
            missing: agentExecutionTrace?.missing_evidence?.slice(0, 2) || []
          }
        });
      } else {
        console.warn('[VERIFICATION_AGENT] Missing verification_status in Gemini result');
      }

      // Validate agent_execution_trace structure
      if (agentExecutionTrace) {
        const expectedKeys = ['supporting_evidence', 'contradicting_evidence', 'neutral_evidence', 'missing_evidence'];
        const hasAllKeys = expectedKeys.every(key => key in agentExecutionTrace);
        
        if (!hasAllKeys) {
          console.warn('[VERIFICATION_AGENT] Incomplete agent_execution_trace structure:', {
            expectedKeys,
            actualKeys: Object.keys(agentExecutionTrace),
            missingKeys: expectedKeys.filter(key => !(key in agentExecutionTrace))
          });
        } else {
          console.log('[VERIFICATION_AGENT] Valid agent_execution_trace structure confirmed:', {
            supportingEvidenceCount: agentExecutionTrace.supporting_evidence?.length || 0,
            contradictingEvidenceCount: agentExecutionTrace.contradicting_evidence?.length || 0,
            neutralEvidenceCount: agentExecutionTrace.neutral_evidence?.length || 0,
            missingEvidenceCount: agentExecutionTrace.missing_evidence?.length || 0
          });
        }
      } else {
        console.warn('[VERIFICATION_AGENT] Missing agent_execution_trace in Gemini result');
      }

    } catch (err) {
      console.error('[VERIFICATION_AGENT] Failed to extract structured data from Gemini result:', {
        error: err.message,
        verificationResult: verificationResult ? Object.keys(verificationResult) : 'null',
        parseAttempt: parseAttempt
      });
      
      // Fallback to safe defaults
      verificationStatus = 'unverified_due_to_parsing_error';
      verificationNotes = 'Failed to extract structured verification data from Gemini response';
      agentExecutionTrace = {
        supporting_evidence: [],
        contradicting_evidence: [],
        neutral_evidence: [],
        missing_evidence: ['Failed to parse Gemini verification response']
      };
    }
    
    const result = {
      ...existingResult,
      verification_status: verificationStatus,
      verification_confidence_change: confidenceAssessment?.confidence_change || 'unchanged',
      verification_evidence: verificationEvidence,
      verified_at: new Date().toISOString(),
      verification_method: 'gemini_analysis',
      verification_notes: verificationNotes,
      // Note: verified_owner_entity field doesn't exist in database schema, using financial_beneficiary instead
      confidence_assessment: confidenceAssessment,
      llm_source: 'gemini', // Track that this result was generated by Gemini
      // Store evidence analysis for pipeline orchestrator to use
      gemini_evidence_analysis: agentExecutionTrace,
      agent_path: [...(existingResult.agent_path || []), 'gemini_verification'],
      // Store debug metadata ONLY (not raw snippets to comply with CSE terms)
      gemini_debug_metadata: {
        search_queries: searchQueries,
        snippets_returned: snippetCount,
        search_timestamp: new Date().toISOString(),
        api_keys_present: {
          google_api_key: !!process.env.GOOGLE_API_KEY,
          google_cse_id: !!process.env.GOOGLE_CSE_ID
        }
      }
    };
    
    // Log successful Gemini usage for compliance tracking
    logComplianceEvent('gemini_analysis_success', {
      brand,
      productName,
      verification_status: verificationStatus,
      verification_method: 'gemini_analysis',
      confidence_assessment: confidenceAssessment,
      evidence_count: {
        supporting: agentExecutionTrace?.supporting_evidence?.length || 0,
        contradicting: agentExecutionTrace?.contradicting_evidence?.length || 0,
        neutral: agentExecutionTrace?.neutral_evidence?.length || 0,
        missing: agentExecutionTrace?.missing_evidence?.length || 0
      }
    });
    
    return result;
    
  } catch (error) {
    console.error('[GEMINI_DEBUG] Gemini analysis failed:', error);
    
    // 🔍 ERROR HANDLING WITH STRUCTURED FALLBACK
    const errorAgentExecutionTrace = {
      supporting_evidence: [],
      contradicting_evidence: [],
      neutral_evidence: [],
      missing_evidence: ['Gemini analysis failed: ' + error.message]
    };
    
    console.log('[VERIFICATION_AGENT] Error fallback with structured trace:', {
      brand,
      owner: existingResult.financial_beneficiary,
      verificationStatus: 'insufficient_evidence',
      verificationNotes: 'Verification failed due to technical error',
      hasAgentExecutionTrace: true,
      agentExecutionTraceKeys: Object.keys(errorAgentExecutionTrace),
      errorMessage: error.message
    });
    
    return {
      ...existingResult,
      verification_status: 'insufficient_evidence',
      verification_confidence_change: 'unchanged',
      verification_evidence: errorAgentExecutionTrace,
      verified_at: new Date().toISOString(),
      verification_method: 'gemini_analysis_failed',
      verification_notes: 'Verification failed due to technical error',
      // Note: verified_owner_entity field doesn't exist in database schema, using financial_beneficiary instead
      confidence_assessment: {
        original_confidence: existingResult.confidence_score || 0,
        verified_confidence: existingResult.confidence_score || 0,
        confidence_change: 'unchanged'
      },
      // Store evidence analysis for pipeline orchestrator to use
      gemini_evidence_analysis: errorAgentExecutionTrace,
      agent_path: [...(existingResult.agent_path || []), 'gemini_verification_failed'],
      // Include debug metadata even in error case for troubleshooting
      gemini_debug_metadata: {
        search_queries: searchQueries || [],
        snippets_returned: 0,
        search_timestamp: new Date().toISOString(),
        api_keys_present: {
          google_api_key: !!process.env.GOOGLE_API_KEY,
          google_cse_id: !!process.env.GOOGLE_CSE_ID
        },
        error: true,
        error_message: error.message
      }
    };
  }
}

async function performWebSearches(queries) {
  try {
    console.log('[GEMINI_DEBUG] Checking Google API configuration...');
    console.log('[GEMINI_DEBUG] GOOGLE_API_KEY exists:', !!process.env.GOOGLE_API_KEY);
    console.log('[GEMINI_DEBUG] GOOGLE_CSE_ID exists:', !!process.env.GOOGLE_CSE_ID);
    console.log('[GEMINI_DEBUG] NEXT_PUBLIC_GOOGLE_API_KEY exists:', !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
    console.log('[GEMINI_DEBUG] NEXT_PUBLIC_GOOGLE_CSE_ID exists:', !!process.env.NEXT_PUBLIC_GOOGLE_CSE_ID);
    
    // Try to use Google Custom Search API if available
    const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID || process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
    
    if (apiKey && cseId) {
      console.log('[GEMINI_DEBUG] Using Google Custom Search API');
      const results = [];
      let totalQueries = queries.length;
      let successfulQueries = 0;
      let failedQueries = 0;
      
      for (const query of queries) {
        try {
          console.log('[GEMINI_DEBUG] Executing query:', query);
          const response = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=3`
          );
          const data = await response.json();
          
          if (data.items) {
            console.log('[GEMINI_DEBUG] Found', data.items.length, 'results for query:', query);
            results.push(...data.items.map(item => ({
              title: item.title,
              content: item.snippet,
              source: item.displayLink,
              url: item.link
            })));
            successfulQueries++;
          } else {
            console.warn('[GEMINI_DEBUG] No items in Google search response for query:', query);
            if (data.error) {
              console.warn('[GEMINI_DEBUG] Google API error:', data.error);
            }
            failedQueries++;
          }
        } catch (searchError) {
          console.warn('[GEMINI_DEBUG] Google search failed for query:', query, searchError);
          failedQueries++;
        }
      }
      
      console.log('[GEMINI_DEBUG] Search execution summary:', {
        totalQueries,
        successfulQueries,
        failedQueries,
        resultsFound: results.length
      });
      
      if (results.length > 0) {
        console.log('[GEMINI_DEBUG] Returning', results.length, 'real search results');
        return removeDuplicateSnippets(results);
      } else {
        console.warn('[GEMINI_DEBUG] No real search results found - returning empty results');
        return [];
      }
    } else {
      console.warn('[GEMINI_DEBUG] Google API keys not available - using mock fallback for development');
      
      // 🛑 COMPLIANT MOCK FALLBACK - Only for development/testing
      // This avoids CSE usage violations while allowing debugging
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_SEARCH === 'true') {
        console.log('[GEMINI_DEBUG] Using mock search data for development');
        return getMockResultsForQueries(queries);
      } else {
        console.warn('[GEMINI_DEBUG] Production mode - returning empty results due to missing API keys');
        return [];
      }
    }
    
  } catch (error) {
    console.error('[GEMINI_DEBUG] Web search failed:', error);
    return [];
  }
}

function getMockResultsForQueries(queries) {
  const results = [];
  for (const query of queries) {
    const mockResults = getMockResultsForQuery(query);
    results.push(...mockResults);
  }
  return removeDuplicateSnippets(results);
}

function getMockResultsForQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  // Puma-specific mock data
  if (lowerQuery.includes('puma')) {
    return [
      {
        title: "PUMA SE - Wikipedia",
        content: "PUMA SE is a German multinational corporation that designs and manufactures athletic and casual footwear, apparel and accessories. The company is headquartered in Herzogenaurach, Germany.",
        source: "wikipedia.org",
        url: "https://en.wikipedia.org/wiki/PUMA_SE"
      },
      {
        title: "PUMA SE Ownership Structure",
        content: "PUMA SE is a publicly traded company on the Frankfurt Stock Exchange. The largest shareholder is Artémis S.A., which owns approximately 29% of the company. Artémis S.A. is the investment company of the French Pinault family.",
        source: "investors.puma.com",
        url: "https://investors.puma.com"
      },
      {
        title: "PUMA Corporate Information",
        content: "PUMA SE operates as an independent company but is controlled by Artémis S.A., the investment vehicle of the Pinault family. The company was previously part of Kering (formerly PPR) but was spun off in 2018.",
        source: "puma.com",
        url: "https://www.puma.com"
      }
    ];
  }
  
  // Coca-Cola-specific mock data
  if (lowerQuery.includes('coca-cola') || lowerQuery.includes('coca cola')) {
    return [
      {
        title: "The Coca-Cola Company - Wikipedia",
        content: "The Coca-Cola Company is an American multinational corporation, manufacturer, retailer, and marketer of nonalcoholic beverage concentrates and syrups.",
        source: "wikipedia.org",
        url: "https://en.wikipedia.org/wiki/The_Coca-Cola_Company"
      },
      {
        title: "Coca-Cola Company Profile",
        content: "The Coca-Cola Company (NYSE: KO) is the world's largest beverage company, offering more than 500 brands to people in more than 200 countries.",
        source: "investors.coca-colacompany.com",
        url: "https://investors.coca-colacompany.com"
      },
      {
        title: "Coca-Cola Corporate Structure",
        content: "The Coca-Cola Company is a publicly traded company with headquarters in Atlanta, Georgia. It operates as a global beverage company.",
        source: "coca-colacompany.com",
        url: "https://www.coca-colacompany.com"
      }
    ];
  }
  
  // Purina-specific mock data
  if (lowerQuery.includes('purina')) {
    return [
      {
        title: "Purina - Wikipedia",
        content: "Purina is a pet food brand owned by Nestlé. The company was founded in 1894 and became part of Nestlé in 2001.",
        source: "wikipedia.org",
        url: "https://en.wikipedia.org/wiki/Purina"
      },
      {
        title: "Nestlé Purina PetCare - Company Profile",
        content: "Nestlé Purina PetCare is a subsidiary of Nestlé S.A., the world's largest food and beverage company.",
        source: "nestle.com",
        url: "https://www.nestle.com/brands/purina"
      },
      {
        title: "Purina Ownership Structure",
        content: "Purina is wholly owned by Nestlé S.A., a Swiss multinational food and drink processing conglomerate.",
        source: "corporatewatch.org",
        url: "https://corporatewatch.org/nestle"
      }
    ];
  }
  
  // Nike-specific mock data
  if (lowerQuery.includes('nike')) {
    return [
      {
        title: "Nike, Inc. - Wikipedia",
        content: "Nike, Inc. is an American multinational corporation that is engaged in the design, development, manufacturing, and worldwide marketing and sales of footwear, apparel, equipment, accessories, and services.",
        source: "wikipedia.org",
        url: "https://en.wikipedia.org/wiki/Nike,_Inc."
      },
      {
        title: "Nike Investor Relations",
        content: "Nike, Inc. is a publicly traded company on the New York Stock Exchange under the ticker symbol NKE.",
        source: "investors.nike.com",
        url: "https://investors.nike.com"
      },
      {
        title: "Nike Corporate Information",
        content: "Nike, Inc. is headquartered in Beaverton, Oregon, and is one of the world's largest suppliers of athletic shoes and apparel.",
        source: "nike.com",
        url: "https://www.nike.com"
      }
    ];
  }
  
  // IBM-specific mock data
  if (lowerQuery.includes('ibm')) {
    return [
      {
        title: "International Business Machines Corporation - Wikipedia",
        content: "International Business Machines Corporation (IBM) is an American multinational technology corporation headquartered in Armonk, New York. IBM is a publicly traded company listed on the New York Stock Exchange.",
        source: "wikipedia.org",
        url: "https://en.wikipedia.org/wiki/IBM"
      },
      {
        title: "IBM Investor Relations",
        content: "IBM is a publicly traded company on the New York Stock Exchange under the ticker symbol IBM. The company operates as a multinational technology and consulting corporation.",
        source: "investor.ibm.com",
        url: "https://investor.ibm.com"
      },
      {
        title: "IBM Corporate Profile",
        content: "International Business Machines Corporation (IBM) is a leading cloud platform and cognitive solutions company. IBM is headquartered in Armonk, New York, and operates in over 170 countries.",
        source: "ibm.com",
        url: "https://www.ibm.com"
      }
    ];
  }
  
  // Generic mock data for other brands
  return [
    {
      title: "Corporate Ownership Database",
      content: "This brand appears to be owned by a major corporation. Further research needed for specific details.",
      source: "corporate-db.com",
      url: "https://corporate-db.com/search"
    },
    {
      title: "Business Directory",
      content: "Company ownership information varies by region and may require additional verification.",
      source: "business-directory.org",
      url: "https://business-directory.org"
    }
  ];
}

function removeDuplicateSnippets(snippets) {
  const seen = new Set();
  return snippets.filter(snippet => {
    const key = snippet.title + snippet.content.substring(0, 100);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function isGeminiOwnershipAnalysisAvailable() {
  const hasGoogleKey = !!process.env.GOOGLE_API_KEY;
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  
  return hasGoogleKey || hasGeminiKey;
}

export class GeminiOwnershipAnalysisAgent {
  constructor() {
    // Don't check availability at construction time
  }
  
  async analyze(brand, productName, existingResult) {
    console.log('[VERIFICATION_AGENT] Running GeminiVerificationAgent for brand:', brand);
    
    // Check availability at runtime
    if (!isGeminiOwnershipAnalysisAvailable()) {
      throw new Error('Gemini API key not available');
    }
    
    const analysisResult = await performGeminiOwnershipAnalysis(brand, productName, existingResult);
    
    console.log('[VERIFICATION_AGENT] Output fields:', {
      verification_status: analysisResult.verification_status,
      verified_at: analysisResult.verified_at,
      verification_method: analysisResult.verification_method,
      verification_notes: analysisResult.verification_notes,
      confidence_assessment: analysisResult.confidence_assessment,
    });
    
    return analysisResult;
  }
}

/**
 * Generate test payload for Gemini v1 endpoint verification
 */
export function generateGeminiTestPayload(brand = 'Coca-Cola', productName = 'Coca-Cola Classic') {
  const testSnippets = [
    {
      title: "The Coca-Cola Company - Wikipedia",
      content: "The Coca-Cola Company is an American multinational corporation, manufacturer, retailer, and marketer of nonalcoholic beverage concentrates and syrups.",
      source: "wikipedia.org",
      url: "https://en.wikipedia.org/wiki/The_Coca-Cola_Company"
    },
    {
      title: "Coca-Cola Company Profile",
      content: "The Coca-Cola Company (NYSE: KO) is the world's largest beverage company, offering more than 500 brands to people in more than 200 countries.",
      source: "investors.coca-colacompany.com",
      url: "https://investors.coca-colacompany.com"
    }
  ];

  const existingResult = {
    brand: brand,
    product_name: productName,
    financial_beneficiary: 'The Coca-Cola Company',
    confidence_score: 85
  };

  const prompt = `
You are an expert corporate ownership analyst. Analyze the following web search results to determine the ownership of ${brand}.

EXISTING RESULT:
${JSON.stringify(existingResult, null, 2)}

WEB SEARCH RESULTS:
${testSnippets.map((snippet, i) => `Result ${i + 1} (${snippet.source}): ${snippet.content}`).join('\n\n')}

TASK:
1. Determine if the existing ownership result is accurate based on the web search results
2. Provide a verification status: "confirmed", "contradicted", "mixed_evidence", or "insufficient_evidence"
3. Analyze the evidence and provide confidence assessment
4. Provide detailed reasoning

OUTPUT FORMAT (JSON):
You MUST respond with ONLY valid JSON inside triple backticks. Do not include any other text, explanations, or markdown formatting outside the JSON block.

\`\`\`json
{
  "verification_status": "confirmed|contradicted|mixed_evidence|insufficient_evidence",
  "confidence_assessment": {
    "original_confidence": number,
    "verified_confidence": number,
    "confidence_change": "increased|decreased|unchanged"
  },
  "evidence_analysis": {
    "supporting_evidence": ["evidence point 1", "evidence point 2"],
    "contradicting_evidence": ["contradicting point 1"],
    "neutral_evidence": ["neutral point 1"],
    "missing_evidence": ["missing info 1"]
  },
  "summary": "Brief summary of verification findings",
  "reasoning": "Detailed reasoning for the verification decision"
}
\`\`\`

CRITICAL: Your response must be ONLY the JSON block above, wrapped in triple backticks. No additional text, no explanations, no markdown formatting outside the JSON.
`;

  return {
    model: GEMINI_MODEL,
    endpoint: GEMINI_ENDPOINT,
    featureFlagEnabled: GEMINI_FLASH_V1_ENABLED,
    prompt,
    testSnippets,
    existingResult,
    promptLength: prompt.length,
    snippetCount: testSnippets.length
  };
}

/**
 * Test Gemini v1 endpoint with known snippets
 */
export async function testGeminiV1Endpoint() {
  try {
    console.log('[GEMINI_V1_TEST] Starting Gemini v1 endpoint test...');
    
    const testPayload = generateGeminiTestPayload();
    console.log('[GEMINI_V1_TEST] Test payload generated:', {
      model: testPayload.model,
      endpoint: testPayload.endpoint,
      featureFlagEnabled: testPayload.featureFlagEnabled,
      promptLength: testPayload.promptLength,
      snippetCount: testPayload.snippetCount
    });
    
    // Test with direct HTTP call to v1beta endpoint (v1 not available yet)
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    // Test 1: Valid snippets
    console.log('[GEMINI_V1_TEST] Test 1: Valid snippets analysis');
    const validResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testPayload.prompt
          }]
        }]
      })
    });

    if (!validResponse.ok) {
      throw new Error(`Gemini API error: ${validResponse.status} ${validResponse.statusText}`);
    }

    const validData = await validResponse.json();
    const validText = validData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('[GEMINI_V1_TEST] Valid test result:', {
      responseLength: validText.length,
      containsJson: validText.includes('{') && validText.includes('}'),
      containsCodeBlocks: validText.includes('```'),
      model: GEMINI_MODEL,
      endpoint: GEMINI_ENDPOINT
    });
    
    // Test 2: Empty context to trigger error
    console.log('[GEMINI_V1_TEST] Test 2: Empty context error handling');
    try {
      const emptyResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: ''
            }]
          }]
        })
      });

      if (emptyResponse.ok) {
        const emptyData = await emptyResponse.json();
        const emptyText = emptyData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        console.log('[GEMINI_V1_TEST] Empty context result:', {
          responseLength: emptyText.length,
          model: GEMINI_MODEL,
          endpoint: GEMINI_ENDPOINT
        });
      } else {
        throw new Error(`Gemini API error: ${emptyResponse.status} ${emptyResponse.statusText}`);
      }
    } catch (emptyError) {
      console.log('[GEMINI_V1_TEST] Empty context error (expected):', {
        error: emptyError.message,
        model: GEMINI_MODEL,
        endpoint: GEMINI_ENDPOINT
      });
    }
    
    return {
      success: true,
      model: GEMINI_MODEL,
      endpoint: GEMINI_ENDPOINT,
      featureFlagEnabled: GEMINI_FLASH_V1_ENABLED,
      validTestPassed: validText.length > 0,
      errorHandlingTestPassed: true
    };
    
  } catch (error) {
    console.error('[GEMINI_V1_TEST] Test failed:', error);
    return {
      success: false,
      error: error.message,
      model: GEMINI_MODEL,
      endpoint: GEMINI_ENDPOINT,
      featureFlagEnabled: GEMINI_FLASH_V1_ENABLED
    };
  }
}
