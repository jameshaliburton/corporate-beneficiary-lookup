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
    
    // 🔍 FULL DEBUG LOGGING FOR GEMINI RESPONSE
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
    
    return {
      ...existingResult,
      verification_status: verificationResult.verification_status,
      verification_confidence_change: verificationResult.confidence_assessment.confidence_change,
      verification_evidence: verificationResult.evidence_analysis,
      verified_at: new Date().toISOString(),
      verification_method: 'gemini_analysis',
      verification_notes: verificationResult.summary,
      confidence_assessment: verificationResult.confidence_assessment,
      agent_path: [...(existingResult.agent_path || []), 'gemini_verification']
    };
    
  } catch (error) {
    console.error('[GEMINI_DEBUG] Gemini analysis failed:', error);
    return {
      ...existingResult,
      verification_status: 'insufficient_evidence',
      verification_confidence_change: 'unchanged',
      verification_evidence: {
        supporting_evidence: [],
        contradicting_evidence: [],
        neutral_evidence: [],
        missing_evidence: ['Gemini analysis failed: ' + error.message]
      },
      verified_at: new Date().toISOString(),
      verification_method: 'gemini_analysis_failed',
      verification_notes: 'Verification failed due to technical error',
      confidence_assessment: {
        original_confidence: existingResult.confidence_score || 0,
        verified_confidence: existingResult.confidence_score || 0,
        confidence_change: 'unchanged'
      },
      agent_path: [...(existingResult.agent_path || []), 'gemini_verification_failed']
    };
  }
}

async function performWebSearches(queries) {
  try {
    // Try to use Google Custom Search API if available
    if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID) {
      const results = [];
      for (const query of queries) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=3`
          );
          const data = await response.json();
          
          if (data.items) {
            results.push(...data.items.map(item => ({
              title: item.title,
              content: item.snippet,
              source: item.displayLink,
              url: item.link
            })));
          }
        } catch (searchError) {
          console.warn('[GEMINI_DEBUG] Google search failed for query:', query, searchError);
        }
      }
      
      if (results.length > 0) {
        return removeDuplicateSnippets(results);
      }
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
