import { callLLM } from "@/lib/utils/llm-client";

export interface DynamicContentData {
  brandName: string;
  ultimateOwnerName: string;
  relationshipType?: string;
  country?: string;
  category?: string;
  confidence?: number;
  ownershipFlow?: any[];
}

export interface DynamicContent {
  emoji: string;
  tagline: string;
  description: string;
  notes: string[];
  shareText: string;
  tooltips: Record<string, string>;
}

export async function generateDynamicContent(data: DynamicContentData): Promise<DynamicContent> {
  const prompt = `
You are helping generate dynamic UI content for a corporate ownership transparency app.
Brand: ${data.brandName}
Ultimate Owner: ${data.ultimateOwnerName}
Relationship Type: ${data.relationshipType || 'ownership'}
Country: ${data.country || 'unknown'}
Category (if known): ${data.category || "unknown"}
Confidence: ${data.confidence || 0}

Return a JSON object with:
{
  "emoji": "💄",
  "tagline": "is part of an American cosmetics giant",
  "description": "Clinique is a premium skincare brand owned by Estée Lauder.",
  "notes": [
    "🌍 Clinique products in Europe are manufactured in Belgium and Switzerland.",
    "🤝 The brand maintains creative control while leveraging Estée Lauder's supply chain."
  ],
  "shareText": "Did you know Clinique is owned by Estée Lauder? 🧐 Find out who owns your favorite brands with OwnedBy.ai!",
  "tooltips": {
    "joint_venture_partner": "A company sharing ownership under a joint venture agreement.",
    "licensed_manufacturer": "A company licensed to produce and distribute the brand's products."
  }
}

Choose emoji based on category:
- Food/Candy: 🍫 🍪 🍬
- Cosmetics/Beauty: 💄 💅 🧴
- Cars/Automotive: 🚗 🏎️ 🚙
- Tech/Electronics: 💻 📱 🖥️
- Beverages: 🥤 🍺 ☕
- Fashion/Clothing: 👗 👠 👜
- Default: 🏢

Make tagline engaging and specific to the relationship type and country.
Keep description concise but informative.
Limit notes to 3 maximum.
Make share text viral and engaging.
`;

  try {
    const result = await callLLM(prompt);
    return JSON.parse(result);
  } catch (error) {
    console.error('Failed to generate dynamic content:', error);
    // Fallback defaults
    return {
      emoji: "🏢",
      tagline: `is owned by ${data.ultimateOwnerName}`,
      description: `${data.brandName} is owned by ${data.ultimateOwnerName}.`,
      notes: [],
      shareText: `Did you know ${data.brandName} is owned by ${data.ultimateOwnerName}? 🧐 Find out who owns your favorite brands with OwnedBy.ai!`,
      tooltips: {}
    };
  }
} 