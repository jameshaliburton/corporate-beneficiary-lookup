/**
 * Claude Verification Agent
 * Fallback agent for brand ownership verification when Gemini cannot be used
 * (e.g., medical brands, safe mode enabled, or Gemini unavailable)
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
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
export function isMedicalBrand(brand, productName) {
  const text = `${brand} ${productName}`.toLowerCase();
  return MEDICAL_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Perform web searches for ownership information
 * Reuses the same search logic as Gemini agent
 */
async function performWebSearches(queries) {
  try {
    console.log('[CLAUDE_DEBUG] Checking Google API configuration...');
    console.log('[CLAUDE_DEBUG] GOOGLE_API_KEY exists:', !!process.env.GOOGLE_API_KEY);
    console.log('[CLAUDE_DEBUG] GOOGLE_CSE_ID exists:', !!process.env.GOOGLE_CSE_ID);
    
    // Try to use Google Custom Search API if available
    const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID || process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
    
    if (apiKey && cseId) {
      console.log('[CLAUDE_DEBUG] Using Google Custom Search API');
      const results = [];
      for (const query of queries) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=3`
          );
          const data = await response.json();
          
          if (data.items) {
            console.log('[CLAUDE_DEBUG] Found', data.items.length, 'results for query:', query);
            results.push(...data.items.map(item => ({
              title: item.title,
              content: item.snippet,
              source: item.displayLink,
              url: item.link
            })));
          } else {
            console.warn('[CLAUDE_DEBUG] No items in Google search response for query:', query);
            if (data.error) {
              console.warn('[CLAUDE_DEBUG] Google API error:', data.error);
            }
          }
        } catch (searchError) {
          console.warn('[CLAUDE_DEBUG] Google search failed for query:', query, searchError);
        }
      }
      
      if (results.length > 0) {
        console.log('[CLAUDE_DEBUG] Returning', results.length, 'real search results');
        return removeDuplicateSnippets(results);
      } else {
        console.warn('[CLAUDE_DEBUG] No real search results found - returning empty results');
        return [];
      }
    } else {
      console.warn('[CLAUDE_DEBUG] Google API keys not available - returning empty results');
      return [];
    }
    
  } catch (error) {
    console.error('[CLAUDE_DEBUG] Web search failed:', error);
    return [];
  }
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

/**
 * Perform Claude-based ownership analysis
 */
export async function performClaudeOwnershipAnalysis(brand, productName, existingResult) {
  try {
    console.log('[CLAUDE_DEBUG] Starting Claude ownership analysis for:', brand);
    
    // Build search queries (same as Gemini agent)
    const searchQueries = [
      `${brand} ownership parent company`,
      `${brand} subsidiary of`,
      `who owns ${brand}`,
      `${brand} corporate structure`,
      `${brand} ultimate parent`
    ];
    
    console.log('[CLAUDE_DEBUG] Search queries:', searchQueries);
    
    // Perform web searches
    const webSnippets = await performWebSearches(searchQueries);
    console.log('[CLAUDE_DEBUG] First snippet title:', webSnippets[0]?.title || 'No snippets');
    
    // Analyze with Claude
    const prompt = `You are an expert corporate ownership analyst. Analyze the following web search results to determine the ownership of ${brand}.

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

CRITICAL: Your response must be ONLY the JSON block above, wrapped in triple backticks. No additional text, no explanations, no markdown formatting outside the JSON.`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const text = message.content[0].text;
    
    // 🔍 COMPREHENSIVE RAW CLAUDE RESPONSE LOGGING
    console.log('[CLAUDE_DEBUG] Raw Claude response:', text);
    console.log('[CLAUDE_RAW_RESPONSE] Raw Claude output:', {
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
      console.log('[CLAUDE_PARSE_SUCCESS] Direct JSON parsing succeeded');
    } catch (directParseError) {
      console.log('[CLAUDE_PARSE_ATTEMPT] Direct parsing failed, trying extraction methods...');
      
      try {
        // Second attempt: Extract JSON from code blocks
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          parseAttempt = 'code_block';
          verificationResult = JSON.parse(codeBlockMatch[1]);
          console.log('[CLAUDE_PARSE_SUCCESS] Code block extraction succeeded');
        } else {
          throw new Error('No code block found');
        }
      } catch (codeBlockError) {
        console.log('[CLAUDE_PARSE_ATTEMPT] Code block extraction failed, trying regex extraction...');
        
        try {
          // Third attempt: Extract JSON using regex for { ... } block
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parseAttempt = 'regex_extraction';
            verificationResult = JSON.parse(jsonMatch[0]);
            console.log('[CLAUDE_PARSE_SUCCESS] Regex extraction succeeded');
          } else {
            throw new Error('No JSON block found with regex');
          }
        } catch (regexError) {
          console.log('[CLAUDE_PARSE_ATTEMPT] Regex extraction failed, using fallback...');
          
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
              missing_evidence: [`Failed to parse Claude response - attempted: ${parseAttempt}`]
            },
            summary: 'Verification failed due to parsing error',
            reasoning: `Claude response could not be parsed as valid JSON. Parse attempts: direct, code_block, regex_extraction. Raw response length: ${text.length}`
          };
          
          console.error('[CLAUDE_PARSE_FAILED] All parsing attempts failed:', {
            directError: directParseError.message,
            codeBlockError: codeBlockError.message,
            regexError: regexError.message,
            rawResponse: text.substring(0, 500) + (text.length > 500 ? '...' : '')
          });
        }
      }
    }
    
    console.log('[CLAUDE_PARSE_RESULT] Final parsing result:', {
      parseAttempt,
      verification_status: verificationResult.verification_status,
      has_confidence_assessment: !!verificationResult.confidence_assessment,
      has_evidence_analysis: !!verificationResult.evidence_analysis
    });
    
    console.log('[CLAUDE_DEBUG] Verification result:', verificationResult);
    
    // 🔍 COMPREHENSIVE VERIFICATION AGENT WRAPPER
    let verificationStatus = 'not_enough_info';
    let verificationNotes = 'No structured verification info returned';
    let agentExecutionTrace = null;
    let verificationEvidence = null;
    let confidenceAssessment = null;

    try {
      // Extract structured data from parsed Claude result
      if (verificationResult?.verification_status) {
        verificationStatus = verificationResult.verification_status;
        verificationNotes = verificationResult.summary || verificationResult.reasoning || '';
        agentExecutionTrace = verificationResult.evidence_analysis || null;
        verificationEvidence = verificationResult.evidence_analysis || null;
        confidenceAssessment = verificationResult.confidence_assessment || null;
        
        console.log('[CLAUDE_VERIFICATION_AGENT] Successfully extracted structured data:', {
          brand,
          owner: existingResult.financial_beneficiary,
          verificationStatus,
          verificationNotes: verificationNotes.substring(0, 100) + (verificationNotes.length > 100 ? '...' : ''),
          hasAgentExecutionTrace: !!agentExecutionTrace,
          agentExecutionTraceKeys: agentExecutionTrace ? Object.keys(agentExecutionTrace) : [],
          hasConfidenceAssessment: !!confidenceAssessment
        });

        // 🔍 VERIFICATION EVIDENCE LOGGING
        console.log('[CLAUDE_VERIFICATION_EVIDENCE_LOG] Evidence analysis:', {
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
        console.warn('[CLAUDE_VERIFICATION_AGENT] Missing verification_status in Claude result');
      }

      // Validate agent_execution_trace structure
      if (agentExecutionTrace) {
        const expectedKeys = ['supporting_evidence', 'contradicting_evidence', 'neutral_evidence', 'missing_evidence'];
        const hasAllKeys = expectedKeys.every(key => key in agentExecutionTrace);
        
        if (!hasAllKeys) {
          console.warn('[CLAUDE_VERIFICATION_AGENT] Incomplete agent_execution_trace structure:', {
            expectedKeys,
            actualKeys: Object.keys(agentExecutionTrace),
            missingKeys: expectedKeys.filter(key => !(key in agentExecutionTrace))
          });
        } else {
          console.log('[CLAUDE_VERIFICATION_AGENT] Valid agent_execution_trace structure confirmed:', {
            supportingEvidenceCount: agentExecutionTrace.supporting_evidence?.length || 0,
            contradictingEvidenceCount: agentExecutionTrace.contradicting_evidence?.length || 0,
            neutralEvidenceCount: agentExecutionTrace.neutral_evidence?.length || 0,
            missingEvidenceCount: agentExecutionTrace.missing_evidence?.length || 0
          });
        }
      } else {
        console.warn('[CLAUDE_VERIFICATION_AGENT] Missing agent_execution_trace in Claude result');
      }

    } catch (err) {
      console.error('[CLAUDE_VERIFICATION_AGENT] Failed to extract structured data from Claude result:', {
        error: err.message,
        verificationResult: verificationResult ? Object.keys(verificationResult) : 'null',
        parseAttempt: parseAttempt
      });
      
      // Fallback to safe defaults
      verificationStatus = 'unverified_due_to_parsing_error';
      verificationNotes = 'Failed to extract structured verification data from Claude response';
      agentExecutionTrace = {
        supporting_evidence: [],
        contradicting_evidence: [],
        neutral_evidence: [],
        missing_evidence: ['Failed to parse Claude verification response']
      };
    }
    
    return {
      ...existingResult,
      verification_status: verificationStatus,
      verification_confidence_change: confidenceAssessment?.confidence_change || 'unchanged',
      verification_evidence: verificationEvidence,
      verified_at: new Date().toISOString(),
      verification_method: 'claude_analysis', // Different from Gemini
      verification_notes: verificationNotes,
      confidence_assessment: confidenceAssessment,
      llm_source: 'claude', // Track that this result was generated by Claude
      // Store evidence analysis for pipeline orchestrator to use
      claude_evidence_analysis: agentExecutionTrace, // Different field name
      agent_path: [...(existingResult.agent_path || []), 'claude_verification']
    };
    
  } catch (error) {
    console.error('[CLAUDE_DEBUG] Claude analysis failed:', error);
    
    // 🔍 ERROR HANDLING WITH STRUCTURED FALLBACK
    const errorAgentExecutionTrace = {
      supporting_evidence: [],
      contradicting_evidence: [],
      neutral_evidence: [],
      missing_evidence: ['Claude analysis failed: ' + error.message]
    };
    
    console.log('[CLAUDE_VERIFICATION_AGENT] Error fallback with structured trace:', {
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
      verification_method: 'claude_analysis_failed',
      verification_notes: 'Verification failed due to technical error',
      llm_source: 'claude', // Track that this result was generated by Claude (even if failed)
      confidence_assessment: {
        original_confidence: existingResult.confidence_score || 0,
        verified_confidence: existingResult.confidence_score || 0,
        confidence_change: 'unchanged'
      },
      // Store evidence analysis for pipeline orchestrator to use
      claude_evidence_analysis: errorAgentExecutionTrace,
      agent_path: [...(existingResult.agent_path || []), 'claude_verification_failed']
    };
  }
}

export function isClaudeVerificationAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export class ClaudeVerificationAgent {
  constructor() {
    // Don't check availability at construction time
  }
  
  async analyze(brand, productName, existingResult) {
    console.log('[CLAUDE_VERIFICATION_AGENT] Running ClaudeVerificationAgent for brand:', brand);
    
    // Check availability at runtime
    if (!isClaudeVerificationAvailable()) {
      throw new Error('Claude API key not available');
    }
    
    const result = await performClaudeOwnershipAnalysis(brand, productName, existingResult);
    
    console.log('[CLAUDE_VERIFICATION_AGENT] Output fields:', {
      verification_status: result.verification_status,
      verified_at: result.verified_at,
      verification_method: result.verification_method,
      verification_notes: result.verification_notes,
      confidence_assessment: result.confidence_assessment,
    });
    
    return result;
  }
}
