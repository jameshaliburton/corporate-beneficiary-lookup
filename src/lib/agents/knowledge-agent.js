import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

// Only load .env.local in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' })
}

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY is not set. Please set it in your environment variables.')
}

// Debug logging right before creating the Anthropic client
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY)
console.log('ANTHROPIC_API_KEY first 10 chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10))

let anthropic
try {
  anthropic = new Anthropic({
    apiKey
  })
} catch (err) {
  console.error('Error creating Anthropic client:', err)
  throw err
}

/**
 * Calls Anthropic Claude to get corporate ownership knowledge for a product/brand.
 * @param {string} productName
 * @param {string} brandName
 * @returns {Promise<Object>} Structured ownership data
 */
/**
 * Enhanced corporate ownership research with European/Swedish market awareness
 */
export async function getOwnershipKnowledge(productName, brandName, source = null, regionHint = null) {
  // Enhanced prompt with European market awareness
  const prompt = `You are a corporate ownership research assistant with expertise in global markets, especially European and Swedish companies. 

Given a product and brand, identify the ultimate financial beneficiary (company that ultimately profits), the country where profits go, the ownership structure, and your confidence level.

SPECIAL FOCUS: Pay attention to Swedish/Nordic companies like:
- ICA (Swedish retailer)
- Coop (Swedish/Nordic retailer) 
- H&M (Swedish fashion)
- IKEA (Swedish furniture)
- Volvo (Swedish, now Chinese-owned)
- Spotify (Swedish)
- Electrolux (Swedish)

Consider European ownership structures and subsidiaries of global companies operating in Europe.

If this appears to be a Swedish store brand (ICA, Coop, etc.), research the specific ownership structure.

Respond in JSON format:
{
  "financial_beneficiary": "<company>",
  "beneficiary_country": "<country>",
  "confidence_score": <0-100>,
  "ownership_structure_type": "<direct/subsidiary/licensing/franchise>",
  "reasoning": "<brief explanation including any European/Swedish context>"
}

Product: ${productName}
Brand: ${brandName}${source ? `\nData Source: ${source}` : ''}${regionHint ? `\nRegion Hint: ${regionHint}` : ''}

Answer:`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
    
    const text = response.content?.[0]?.text || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error('No JSON found in LLM response: ' + text)
    }
    
    const ownership = JSON.parse(match[0].replace(/([a-zA-Z0-9_]+):/g, '"$1":'))
    return ownership
  } catch (err) {
    console.error('Knowledge Agent error:', err)
    return {
      financial_beneficiary: null,
      beneficiary_country: null,
      confidence_score: 0,
      ownership_structure_type: null,
      reasoning: 'Error: ' + err.message
    }
  }
}