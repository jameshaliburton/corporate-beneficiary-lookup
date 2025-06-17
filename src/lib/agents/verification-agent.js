import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

dotenv.config({ path: '.env.local' })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

/**
 * Verifies corporate ownership claims by performing systematic web research.
 * @param {Object} knowledgeResult - The result from the Knowledge Agent
 * @param {string} productName - The name of the product
 * @param {string} brandName - The name of the brand
 * @returns {Promise<Object>} Verification result with status, evidence, confidence adjustment, sources, and reasoning
 */
export async function verifyOwnership(knowledgeResult, productName, brandName) {
  const { financial_beneficiary, beneficiary_country, confidence_score, ownership_structure_type } = knowledgeResult

  const prompt = `You are a corporate ownership verification agent. Your job is to check if a given ownership claim is true using real, credible, and verifiable sources.

- Search for official company websites, annual reports, SEC filings, or reputable news outlets.
- NEVER invent or fabricate sources, URLs, or evidence. If you cannot find real, credible sources, you must return an empty sources array and set verification_status to "contradicted".
- If the brand or company does not exist or cannot be found in official or reputable sources, you must return:
  "verification_status": "contradicted",
  "sources": [],
  "evidence_found": "No credible sources found for this brand",
  "confidence_adjustment": -60,
  "reasoning": "No real evidence for this brand or company exists in public records or reputable sources."

Return ONLY valid JSON in this exact format:
{
  "verification_status": "confirmed|contradicted|insufficient_evidence",
  "evidence_found": "Brief description of sources found",
  "confidence_adjustment": 10,
  "sources": ["url1", "url2"],
  "reasoning": "Why we're more/less confident after verification"
}

Ownership claim: "${productName} is owned by ${financial_beneficiary} in ${beneficiary_country}"
`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const raw = response.content?.[0]?.text || ''
    // Direct JSON parse, as in debug-verification.js
    try {
      const parsed = JSON.parse(raw)
      return parsed
    } catch (error) {
      console.log('\n❌ JSON Parsing: FAILED')
      console.log('Raw LLM Response:')
      console.log(raw)
      console.log('Error:', error.message)
      return {
        verification_status: 'insufficient_evidence',
        evidence_found: 'Could not parse JSON from LLM response',
        confidence_adjustment: 0,
        sources: [],
        reasoning: 'Malformed or unparsable JSON in LLM response.'
      }
    }
  } catch (err) {
    console.error('Verification Agent error:', err)
    return {
      verification_status: 'insufficient_evidence',
      evidence_found: 'Error during verification',
      confidence_adjustment: 0,
      sources: [],
      reasoning: 'Error: ' + err.message
    }
  }
} 