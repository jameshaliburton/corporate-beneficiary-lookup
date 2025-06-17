import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function testAnthropic() {
  console.log('Testing Anthropic connection...')
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Who owns the Kit Kat brand in Japan? Just give me the company name.'
        }
      ]
    })
    
    console.log('✅ Anthropic connected!')
    console.log('Response:', response.content[0].text)
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
  }
}

testAnthropic()