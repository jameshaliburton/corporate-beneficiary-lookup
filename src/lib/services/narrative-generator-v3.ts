/**
 * Narrative Generator V3 - Flexible LLM Approach
 * 
 * Instead of rigid templates, we provide examples and let the LLM be creative
 * while maintaining key requirements like country focus and engaging storytelling.
 */

import { safeLLMCall } from '@/lib/llm/safe-llm-adapter';

export interface OwnershipResult {
  brand_name?: string;
  brand_country?: string;
  ultimate_owner?: string;
  ultimate_owner_country?: string;
  financial_beneficiary?: string;
  financial_beneficiary_country?: string;
  ownership_type?: string;
  confidence?: number;
  acquisition_year?: number;
  previous_owner?: string;
  vision_context?: any;
  disambiguation_options?: any[];
  ownership_notes?: string[];
  behind_the_scenes?: string[];
}

export interface NarrativeFields {
  headline: string;
  tagline: string;
  story: string;
  ownership_notes: string[];
  behind_the_scenes: string[];
  template_used: string;
}

/**
 * Generate narrative content using flexible LLM approach
 */
export async function generateNarrativeFromResult(result: OwnershipResult): Promise<NarrativeFields> {
  console.log('[NARRATIVE_GEN_V3] Starting flexible narrative generation for:', {
    brand: result.brand_name,
    owner: result.ultimate_owner || result.financial_beneficiary,
    ownerCountry: result.ultimate_owner_country || result.financial_beneficiary_country,
    confidence: result.confidence
  });

  try {
    const systemPrompt = `You are a creative narrative writer for OwnedBy, an app that reveals corporate ownership connections. Your job is to create engaging, shareable content that helps users understand who really owns what.

KEY REQUIREMENTS:
- Always highlight the country of the ultimate financial beneficiary (this is crucial)
- Make content engaging and shareable (TikTok/Gen Z friendly)
- Be factual and credible, never invent information
- Use emoji flags (🇺🇸, 🇳🇱, etc.) to highlight countries
- Keep headlines under 10 words, taglines under 15 words
- Stories should be 1-2 sentences, engaging but informative
- Always provide fallback content if data is missing

OUTPUT FORMAT (respond with valid JSON only):
{
  "headline": "Your engaging headline here",
  "tagline": "Your descriptive tagline here", 
  "story": "Your engaging story here",
  "ownership_notes": ["Note 1", "Note 2"],
  "behind_the_scenes": ["Step 1", "Step 2"],
  "template_used": "flexible_creative"
}`;

    const userPrompt = `Create engaging narrative content for this ownership result:

BRAND: ${result.brand_name || 'Unknown Brand'}
BRAND COUNTRY: ${result.brand_country || 'Unknown'}
ULTIMATE OWNER: ${result.ultimate_owner || result.financial_beneficiary || 'Unknown'}
OWNER COUNTRY: ${result.ultimate_owner_country || result.financial_beneficiary_country || 'Unknown'}
CONFIDENCE: ${result.confidence || 0}%
OWNERSHIP TYPE: ${result.ownership_type || 'Unknown'}
${result.acquisition_year ? `ACQUISITION YEAR: ${result.acquisition_year}` : ''}
${result.previous_owner ? `PREVIOUS OWNER: ${result.previous_owner}` : ''}
${result.vision_context ? `VISION CONTEXT: Product analysis provided additional context` : ''}
${result.disambiguation_options?.length ? `DISAMBIGUATION: Multiple ownership options found` : ''}

EXAMPLES OF GOOD CONTENT:

Example 1 - Hidden Global Owner:
- headline: "Ben & Jerry's isn't as American as you think 🇳🇱"
- tagline: "Owned by Unilever in Netherlands"
- story: "Despite its Vermont roots and American branding, Ben & Jerry's is actually owned by Dutch-British conglomerate Unilever, which acquired it in 2000."

Example 2 - Local Independent:
- headline: "IKEA stays true to Swedish roots 🇸🇪"
- tagline: "Family-owned company in Sweden"
- story: "IKEA remains under Swedish ownership through the Kamprad family, maintaining its distinctive Scandinavian design philosophy."

Example 3 - Acquisition Story:
- headline: "WhatsApp's $19B journey to Meta 🇺🇸"
- tagline: "Acquired by Meta in 2014"
- story: "WhatsApp went from a small startup to a $19 billion acquisition by Facebook (now Meta) in 2014, becoming part of the social media giant's ecosystem."

Example 4 - Low Confidence:
- headline: "Limited info on this brand's ownership"
- tagline: "More research needed (${result.confidence || 0}% confidence)"
- story: "We found some information about this brand's ownership, but our confidence is limited. Additional research would help clarify the ownership structure."

Example 5 - Ambiguous:
- headline: "Complex ownership structure detected"
- tagline: "Multiple possible owners identified"
- story: "This brand appears to have a complex ownership structure with multiple possible parent companies. Further investigation is needed to determine the ultimate owner."

Create content that:
1. Emphasizes the country of the ultimate owner (use flag emojis)
2. Is engaging and shareable
3. Matches the tone of the examples above
4. Handles missing data gracefully
5. Is factually accurate based on the provided data

Respond with valid JSON only.`;

    const response = await safeLLMCall({
      system: systemPrompt,
      user: userPrompt,
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('[NARRATIVE_GEN_V3] LLM response:', response);

    // Parse the JSON response
    let narrativeData;
    try {
      narrativeData = JSON.parse(response);
    } catch (parseError) {
      console.error('[NARRATIVE_GEN_V3] Failed to parse LLM response as JSON:', parseError);
      console.log('[NARRATIVE_GEN_V3] Raw response:', response);
      
      // Fallback: try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          narrativeData = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('[NARRATIVE_GEN_V3] Second JSON parse attempt failed:', secondParseError);
          narrativeData = createFallbackNarrative(result);
        }
      } else {
        narrativeData = createFallbackNarrative(result);
      }
    }

    // Validate and ensure all required fields exist
    const narrative: NarrativeFields = {
      headline: narrativeData.headline || createFallbackHeadline(result),
      tagline: narrativeData.tagline || createFallbackTagline(result),
      story: narrativeData.story || createFallbackStory(result),
      ownership_notes: Array.isArray(narrativeData.ownership_notes) ? narrativeData.ownership_notes : [createFallbackNote(result)],
      behind_the_scenes: Array.isArray(narrativeData.behind_the_scenes) ? narrativeData.behind_the_scenes : [createFallbackBehindTheScenes(result)],
      template_used: narrativeData.template_used || 'flexible_creative'
    };

    console.log('[NARRATIVE_GEN_V3] Generated narrative:', narrative);
    return narrative;

  } catch (error) {
    console.error('[NARRATIVE_GEN_V3] Error generating narrative:', error);
    return createFallbackNarrative(result);
  }
}

/**
 * Create fallback narrative when LLM fails
 */
function createFallbackNarrative(result: OwnershipResult): NarrativeFields {
  const brand = result.brand_name || 'This brand';
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  const ownerCountry = result.ultimate_owner_country || result.financial_beneficiary_country || 'Unknown';
  const confidence = result.confidence || 0;

  return {
    headline: confidence > 50 ? `${brand} ownership revealed` : `${brand} ownership unclear`,
    tagline: confidence > 50 ? `Owned by ${owner}` : `Limited information available`,
    story: confidence > 50 
      ? `${brand} is ultimately owned by ${owner}.`
      : `We found limited information about ${brand}'s ownership structure.`,
    ownership_notes: [`${brand} is ultimately owned by ${owner}`],
    behind_the_scenes: ['Research process completed'],
    template_used: 'fallback'
  };
}

function createFallbackHeadline(result: OwnershipResult): string {
  const brand = result.brand_name || 'This brand';
  const confidence = result.confidence || 0;
  return confidence > 50 ? `${brand} ownership revealed` : `${brand} ownership unclear`;
}

function createFallbackTagline(result: OwnershipResult): string {
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  const confidence = result.confidence || 0;
  return confidence > 50 ? `Owned by ${owner}` : `Limited information available`;
}

function createFallbackStory(result: OwnershipResult): string {
  const brand = result.brand_name || 'This brand';
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  const confidence = result.confidence || 0;
  return confidence > 50 
    ? `${brand} is ultimately owned by ${owner}.`
    : `We found limited information about ${brand}'s ownership structure.`;
}

function createFallbackNote(result: OwnershipResult): string {
  const brand = result.brand_name || 'This brand';
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  return `${brand} is ultimately owned by ${owner}`;
}

function createFallbackBehindTheScenes(result: OwnershipResult): string {
  return 'Research process completed';
}
