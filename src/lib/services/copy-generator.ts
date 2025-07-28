import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GeneratedCopy {
  headline: string;
  subheadline: string;
  description: string;
  countryFact: string;
  traceSummary: {
    vision: string;
    retrieval: string;
    mapping: string;
  };
}

export async function generateOwnershipCopy(
  ownershipData: any
): Promise<GeneratedCopy> {
  try {
    const systemPrompt = `You are an AI copywriter for OwnedBy – an app that reveals who really owns consumer brands.
Your job is to create short, punchy, factual content that feels exciting and shareable.

RULES:
	•	Analyze the ownership chain and ultimate owner country.
	•	Decide the most interesting angle:
	1.	✅ Local independent company → "This is a homegrown brand 🇸🇪"
	2.	✅ Foreign-owned brand → "Your money ultimately supports a company abroad 🇺🇸"
	3.	✅ Conglomerate brand → "Part of a massive global empire"
	•	Lead with ultimate owner and country as the main story.
	•	Always mention which country ultimately benefits.
	•	Tone: engaging, factual, never misleading.
	•	Return valid JSON only – no extra text.

OUTPUT KEYS:
	•	headline: Punchy hook (≤ 10 words)
	•	subheadline: Factual ownership summary
	•	description: 1–2 sentences expanding on the story
	•	countryFact: 1 sentence about where the money goes
	•	traceSummary.vision: What the AI vision system did (past tense)
	•	traceSummary.retrieval: What the retrieval stage found (past tense)
	•	traceSummary.mapping: What the ownership mapping confirmed (past tense)`;

    const userPrompt = `Here is the data for the brand:

${JSON.stringify(ownershipData, null, 2)}

OUTPUT FORMAT:
Return only valid JSON like this:

{
  "headline": "Clinique is a homegrown beauty brand 🇺🇸",
  "subheadline": "Owned by The Estée Lauder Companies in the United States.",
  "description": "Clinique is part of the iconic Estée Lauder family, meaning every purchase supports one of America's biggest beauty powerhouses.",
  "countryFact": "Your money ultimately goes to the United States 🇺🇸.",
  "traceSummary": {
    "vision": "Analyzed the product photo and detected the Clinique logo and packaging details.",
    "retrieval": "Fetched corporate ownership data from company filings and global databases.",
    "mapping": "Confirmed The Estée Lauder Companies (USA) as the ultimate parent company."
  }
}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
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
    const requiredFields = ['headline', 'subheadline', 'description', 'countryFact', 'traceSummary'];
    for (const field of requiredFields) {
      if (!generatedCopy[field as keyof GeneratedCopy]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate traceSummary sub-fields
    const requiredTraceFields = ['vision', 'retrieval', 'mapping'];
    for (const field of requiredTraceFields) {
      if (!generatedCopy.traceSummary[field as keyof typeof generatedCopy.traceSummary]) {
        throw new Error(`Missing required traceSummary field: ${field}`);
      }
    }

    return generatedCopy;
  } catch (error) {
    console.error('Error generating copy:', error);
    
    // Fallback copy if LLM fails
    const brand = ownershipData.brand || 'This brand';
    const owner = ownershipData.ultimateOwner || 'a larger company';
    const country = ownershipData.ultimateCountry || 'abroad';
    
    return {
      headline: `${brand} isn't as independent as you think 👀`,
      subheadline: `It's owned by ${owner} (${country})`,
      description: `${brand} is part of a larger corporate structure controlled by ${owner}, headquartered in ${country}.`,
      countryFact: `Your money ultimately goes to ${country}`,
      traceSummary: {
        vision: "Analyzed the product photo and detected brand details.",
        retrieval: "Fetched corporate ownership data from company databases.",
        mapping: "Confirmed the ultimate parent company and ownership structure."
      }
    };
  }
} 