import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GeneratedCopy {
  headline: string;
  subheadline: string;
  description: string;
  socialShare: string;
  countryFact: string;
}

export async function generateOwnershipCopy(
  brand: string,
  owner: string,
  country: string,
  ownershipChain: any[],
  confidence: number
): Promise<GeneratedCopy> {
  try {
    const systemPrompt = `You are a copywriter creating short, viral, and informative text about brand ownership. Your goal is to make corporate ownership feel engaging and surprising.

Key principles:
- Be factual but entertaining
- Use emojis sparingly but effectively
- Keep headlines under 60 characters
- Make the ownership feel surprising or interesting
- Include the country prominently
- Use a conversational, viral tone for social sharing

Output format must be valid JSON with these exact fields:
- headline: Short, punchy headline (under 60 chars)
- subheadline: Brief explanation of ownership
- description: 1-2 sentence detailed explanation
- socialShare: Viral caption for social media
- countryFact: Fact about the country's role in ownership`;

    const userPrompt = `Generate fun, engaging, and factual copy for this brand ownership result.

Data:
Brand: ${brand}
Owner: ${owner}
Country: ${country}
Confidence: ${confidence}%
Ownership Chain: ${JSON.stringify(ownershipChain)}

Output in JSON:
{
  "headline": "...",
  "subheadline": "...", 
  "description": "...",
  "socialShare": "...",
  "countryFact": "..."
}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from LLM');
    }

    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const generatedCopy: GeneratedCopy = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    const requiredFields = ['headline', 'subheadline', 'description', 'socialShare', 'countryFact'];
    for (const field of requiredFields) {
      if (!generatedCopy[field as keyof GeneratedCopy]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return generatedCopy;
  } catch (error) {
    console.error('Error generating copy:', error);
    
    // Fallback copy if LLM fails
    return {
      headline: `${brand} isn't as independent as you think 👀`,
      subheadline: `It's owned by ${owner} (${country})`,
      description: `${brand} is part of a larger corporate structure controlled by ${owner}, headquartered in ${country}.`,
      socialShare: `${brand} isn't as independent as you think 👀 – it's owned by ${owner} (${country})`,
      countryFact: `This brand is ultimately controlled from ${country}`
    };
  }
} 