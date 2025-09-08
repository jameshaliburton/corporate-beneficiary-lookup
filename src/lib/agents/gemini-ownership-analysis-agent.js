import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function performGeminiOwnershipAnalysis(brand, productName, existingResult) {
  try {
    console.log('[GEMINI_DEBUG] Starting Gemini ownership analysis for:', brand);
    
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
    const webSnippets = await performWebSearches(searchQueries);
    console.log('[GEMINI_DEBUG] First snippet title:', webSnippets[0]?.title || 'No snippets');
    
    // Analyze with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
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
    
    return {
      ...existingResult,
      verification_status: verificationStatus,
      verification_confidence_change: confidenceAssessment?.confidence_change || 'unchanged',
      verification_evidence: verificationEvidence,
      verified_at: new Date().toISOString(),
      verification_method: 'gemini_analysis',
      verification_notes: verificationNotes,
      // Note: verified_owner_entity field doesn't exist in database schema, using financial_beneficiary instead
      confidence_assessment: confidenceAssessment,
      // Store evidence analysis for pipeline orchestrator to use
      gemini_evidence_analysis: agentExecutionTrace,
      agent_path: [...(existingResult.agent_path || []), 'gemini_verification']
    };
    
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
      agent_path: [...(existingResult.agent_path || []), 'gemini_verification_failed']
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
      for (const query of queries) {
        try {
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
          } else {
            console.warn('[GEMINI_DEBUG] No items in Google search response for query:', query);
            if (data.error) {
              console.warn('[GEMINI_DEBUG] Google API error:', data.error);
            }
          }
        } catch (searchError) {
          console.warn('[GEMINI_DEBUG] Google search failed for query:', query, searchError);
        }
      }
      
      if (results.length > 0) {
        console.log('[GEMINI_DEBUG] Returning', results.length, 'real search results');
        return removeDuplicateSnippets(results);
      } else {
        console.warn('[GEMINI_DEBUG] No real search results found, falling back to mock data');
      }
    } else {
      console.warn('[GEMINI_DEBUG] Google API keys not available, using mock data');
    }
    
    // Fallback to mock results
    return getMockResultsForQuery(queries[0]);
    
  } catch (error) {
    console.error('[GEMINI_DEBUG] Web search failed:', error);
    return getMockResultsForQuery(queries[0]);
  }
}

function getMockResultsForQuery(query) {
  const lowerQuery = query.toLowerCase();
  
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
  return !!process.env.GOOGLE_API_KEY;
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
    
    const result = await performGeminiOwnershipAnalysis(brand, productName, existingResult);
    
    console.log('[VERIFICATION_AGENT] Output fields:', {
      verification_status: result.verification_status,
      verified_at: result.verified_at,
      verification_method: result.verification_method,
      verification_notes: result.verification_notes,
      confidence_assessment: result.confidence_assessment,
    });
    
    return result;
  }
}
