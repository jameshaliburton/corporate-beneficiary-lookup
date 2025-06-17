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

const anthropic = new Anthropic({
  apiKey
})

/**
 * Calls Anthropic Claude to get corporate ownership knowledge for a product/brand.
 * @param {string} productName
 * @param {string} brandName
 * @returns {Promise<Object>} Structured ownership data
 */
export async function getOwnershipKnowledge(productName, brandName) {
  const prompt = `You are a corporate ownership research assistant. Given a product and brand, identify the ultimate financial beneficiary (company that ultimately profits), the country where profits go, the ownership structure (direct, subsidiary, licensing, franchise, etc), and your confidence (0-100). If there are complexities (like licensing or regional subsidiaries), explain them. Respond in the following JSON format:

{
  financial_beneficiary: "<company>",
  beneficiary_country: "<country>",
  confidence_score: <0-100>,
  ownership_structure_type: "<structure>",
  reasoning: "<brief explanation>"
}

Product: ${productName}
Brand: ${brandName}
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