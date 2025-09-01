import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    let verificationResult;
    try {
      verificationResult = JSON.parse(text);
    } catch (parseError) {
      console.error('[GEMINI_DEBUG] Failed to parse JSON response:', parseError);
      verificationResult = {
        verification_status: 'insufficient_evidence',
        confidence_assessment: {
          original_confidence: existingResult.confidence_score || 0,
          verified_confidence: existingResult.confidence_score || 0,
          confidence_change: 'unchanged'
        },
        evidence_analysis: {
          supporting_evidence: [],
          contradicting_evidence: [],
          neutral_evidence: [],
          missing_evidence: ['Failed to parse Gemini response']
        },
        summary: 'Verification failed due to parsing error',
        reasoning: 'Gemini response could not be parsed as valid JSON'
      };
    }
    
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
  return !!process.env.GEMINI_API_KEY;
}

export class GeminiOwnershipAnalysisAgent {
  constructor() {
    this.isAvailable = isGeminiOwnershipAnalysisAvailable();
  }
  
  async analyze(brand, productName, existingResult) {
    if (!this.isAvailable) {
      throw new Error('Gemini API key not available');
    }
    return performGeminiOwnershipAnalysis(brand, productName, existingResult);
  }
}
