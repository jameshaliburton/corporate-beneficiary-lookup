import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function debugVerification() {
  console.log('Debugging Verification Agent LLM Response...\n')
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Verify this ownership claim: "Kit Kat is owned by Nestlé S.A. in Switzerland"
          
          Return ONLY valid JSON in this exact format:
          {
            "verification_status": "confirmed",
            "evidence_found": "Brief description",
            "confidence_adjustment": 10,
            "sources": ["url1"],
            "reasoning": "Why we're confident"
          }`
        }
      ]
    })
    
    console.log('Raw LLM Response:')
    console.log('================')
    console.log(response.content[0].text)
    console.log('================')
    
    // Try to parse it
    try {
      const parsed = JSON.parse(response.content[0].text)
      console.log('\n✅ JSON Parsing: SUCCESS')
      console.log(parsed)
    } catch (error) {
      console.log('\n❌ JSON Parsing: FAILED')
      console.log('Error:', error.message)
    }
    
  } catch (error) {
    console.error('API Error:', error)
  }
}

debugVerification()