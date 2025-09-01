import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface OwnershipResult {
  brand_name: string;
  brand_country?: string;
  ultimate_owner: string;
  ultimate_owner_country?: string;
  financial_beneficiary: string;
  financial_beneficiary_country?: string;
  ownership_type?: string;
  confidence?: number;
  confidence_score?: number;
  ownership_notes?: string[];
  behind_the_scenes?: string[];
  // Gemini verification fields
  verification_status?: string;
  verified_at?: string;
  verification_method?: string;
  verification_notes?: string;
  confidence_assessment?: any;
  verification_evidence?: any;
  verification_confidence_change?: string;
}

export interface NarrativeFields {
  headline: string;
  tagline: string;
  story: string;
  ownership_notes: string[];
  behind_the_scenes: string[];
  template_used: string;
}

export async function generateNarrativeFromResult(result: any) {
  try {
    const prompt = `
You are an expert storyteller creating engaging narratives about corporate ownership. Create a compelling story about ${result.brand_name} and its ownership.

BRAND DATA:
- Brand: ${result.brand_name}
- Brand Country: ${result.brand_country || 'Unknown'}
- Ultimate Owner: ${result.ultimate_owner}
- Owner Country: ${result.ultimate_owner_country || 'Unknown'}
- Ownership Type: ${result.ownership_type || 'Unknown'}
- Confidence: ${result.confidence || 0}%

TASK:
Create a narrative with these components:
1. Headline: Catchy, one-line summary
2. Tagline: Brief, memorable phrase
3. Story: Engaging 2-3 paragraph narrative
4. Ownership Notes: Key ownership details
5. Behind the Scenes: Interesting facts or context

OUTPUT FORMAT (JSON):
{
  "headline": "Catchy headline here",
  "tagline": "Memorable tagline here", 
  "story": "Engaging story paragraphs here...",
  "ownership_notes": "Key ownership details here...",
  "behind_the_scenes": "Interesting context here...",
  "template_used": "narrative_v3"
}
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        // Clean the response text before parsing JSON
        let cleanedText = content.text.trim();
        
        // Remove any markdown code blocks if present
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Clean control characters that break JSON parsing
        cleanedText = cleanedText
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
          .replace(/\n/g, '\\n') // Escape newlines
          .replace(/\r/g, '\\r') // Escape carriage returns
          .replace(/\t/g, '\\t'); // Escape tabs
        
        console.log('Cleaned narrative JSON text:', cleanedText.substring(0, 200) + '...');
        
        return JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse narrative JSON:', parseError);
        console.error('Raw response text:', content.text.substring(0, 500));
        return getFallbackNarrative(result);
      }
    }
    
    return getFallbackNarrative(result);
    
  } catch (error) {
    console.error('Narrative generation failed:', error);
    return getFallbackNarrative(result);
  }
}

function getFallbackNarrative(result: any) {
  return {
    headline: `${result.brand_name} is owned by ${result.ultimate_owner}`,
    tagline: "Discover the corporate connections behind your favorite brands",
    story: `${result.brand_name} is part of a larger corporate network. The brand is ultimately owned by ${result.ultimate_owner}, a major player in the industry. This ownership structure reflects the complex web of corporate relationships that shape the products we use every day.`,
    ownership_notes: `Ownership: ${result.ultimate_owner} | Country: ${result.ultimate_owner_country || 'Unknown'} | Confidence: ${result.confidence || 0}%`,
    behind_the_scenes: "Corporate ownership research involves analyzing public records, financial statements, and regulatory filings to trace the ultimate beneficiaries of brand ownership.",
    template_used: "fallback_narrative"
  };
}
