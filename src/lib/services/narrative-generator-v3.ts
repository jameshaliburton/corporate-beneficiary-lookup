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
  verification_confidence_change?: "increased" | "decreased" | "unchanged";
  // LLM source tracking for attribution
  llm_source?: "gemini" | "claude";
}

export interface NarrativeFields {
  headline: string;
  tagline: string;
  story: string;
  ownership_notes: string[];
  behind_the_scenes: string[];
  template_used: string;
}

// Helper function to sanitize narrative fields
function sanitizeNarrativeField(str: string | null | undefined): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
}

// Helper function to sanitize narrative array fields
function sanitizeNarrativeArray(arr: string[] | null | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => sanitizeNarrativeField(item)).filter(item => item.length > 0);
}

export async function generateNarrativeFromResult(result: any) {
  console.log('[COPY_AGENT] 🔍 Entered generateNarrativeFromResult()');
  console.log('[COPY_AGENT] Narrative function reached - generateNarrativeFromResult called');
  console.log('[COPY_AGENT] Starting narrative generation for:', {
    brand: result.brand_name,
    owner: result.ultimate_owner,
    confidence: result.confidence,
    country: result.ultimate_owner_country
  });

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

    console.log('[COPY_AGENT] Calling Anthropic API for narrative generation...');
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

    console.log('[COPY_AGENT] Received response from Anthropic API');
    const content = response.content[0];
    if (content.type === 'text') {
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
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove problematic control characters but keep \n, \r, \t
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n') // Convert remaining \r to \n
        .replace(/\n/g, ' ') // Replace newlines with spaces to avoid JSON parsing issues
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
        .trim(); // Remove leading/trailing whitespace
      
      try {
        console.log('Cleaned narrative JSON text:', cleanedText.substring(0, 200) + '...');
        
        const parsed = JSON.parse(cleanedText);
        console.log('✅ Successfully parsed narrative JSON');
        
        // Sanitize all narrative fields to prevent JSON parsing issues
        const sanitizedNarrative = {
          headline: sanitizeNarrativeField(parsed.headline),
          tagline: sanitizeNarrativeField(parsed.tagline),
          story: sanitizeNarrativeField(parsed.story),
          ownership_notes: sanitizeNarrativeArray(parsed.ownership_notes),
          behind_the_scenes: sanitizeNarrativeArray(parsed.behind_the_scenes),
          template_used: sanitizeNarrativeField(parsed.template_used) || 'narrative_v3'
        };
        
        console.log('🧹 Sanitized narrative fields for safe JSON serialization');
        console.log('[COPY_AGENT] Successfully generated narrative:', {
          headline: sanitizedNarrative.headline,
          tagline: sanitizedNarrative.tagline,
          story: sanitizedNarrative.story ? sanitizedNarrative.story.substring(0, 100) + '...' : 'none',
          ownership_notes: sanitizedNarrative.ownership_notes,
          behind_the_scenes: sanitizedNarrative.behind_the_scenes,
          template_used: sanitizedNarrative.template_used
        });
        console.log('[COPY_AGENT] Done ✅');
        return sanitizedNarrative;
      } catch (parseError) {
        console.error('❌ Failed to parse narrative JSON:', parseError);
        console.error('Raw response text length:', content.text.length);
        console.error('Raw response text (first 500 chars):', content.text.substring(0, 500));
        console.error('Cleaned text length:', cleanedText.length);
        console.error('Cleaned text (first 500 chars):', cleanedText.substring(0, 500));
        console.error('Parse error details:', {
          message: parseError.message,
          position: parseError.message.match(/position (\d+)/)?.[1],
          line: parseError.message.match(/line (\d+)/)?.[1]
        });
        
        // Try to extract JSON from the response if it's embedded in other text
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            console.log('🔄 Attempting to parse extracted JSON...');
            const extractedJson = jsonMatch[0];
            const parsed = JSON.parse(extractedJson);
            console.log('✅ Successfully parsed extracted JSON');
            
            // Sanitize all narrative fields to prevent JSON parsing issues
            const sanitizedNarrative = {
              headline: sanitizeNarrativeField(parsed.headline),
              tagline: sanitizeNarrativeField(parsed.tagline),
              story: sanitizeNarrativeField(parsed.story),
              ownership_notes: sanitizeNarrativeArray(parsed.ownership_notes),
              behind_the_scenes: sanitizeNarrativeArray(parsed.behind_the_scenes),
              template_used: sanitizeNarrativeField(parsed.template_used) || 'narrative_v3'
            };
            
            console.log('🧹 Sanitized extracted narrative fields for safe JSON serialization');
            console.log('[COPY_AGENT] Successfully generated narrative from extracted JSON:', {
              headline: sanitizedNarrative.headline,
              tagline: sanitizedNarrative.tagline,
              story: sanitizedNarrative.story ? sanitizedNarrative.story.substring(0, 100) + '...' : 'none',
              ownership_notes: sanitizedNarrative.ownership_notes,
              behind_the_scenes: sanitizedNarrative.behind_the_scenes,
              template_used: sanitizedNarrative.template_used
            });
            console.log('[COPY_AGENT] Done ✅ (extracted JSON)');
            return sanitizedNarrative;
          } catch (extractError) {
            console.error('❌ Failed to parse extracted JSON:', extractError);
          }
        }
        
        console.log('🔄 Falling back to fallback narrative due to JSON parsing failure');
        const fallbackNarrative = getFallbackNarrative(result);
        console.log('[COPY_AGENT] Using fallback narrative:', {
          headline: fallbackNarrative.headline,
          tagline: fallbackNarrative.tagline,
          story: fallbackNarrative.story ? fallbackNarrative.story.substring(0, 100) + '...' : 'none',
          ownership_notes: fallbackNarrative.ownership_notes,
          behind_the_scenes: fallbackNarrative.behind_the_scenes,
          template_used: fallbackNarrative.template_used
        });
        console.log('[COPY_AGENT] Done ✅ (fallback)');
        return fallbackNarrative;
      }
    }
    
    const finalFallbackNarrative = getFallbackNarrative(result);
    console.log('[COPY_AGENT] Using final fallback narrative (no text content):', {
      headline: finalFallbackNarrative.headline,
      tagline: finalFallbackNarrative.tagline,
      story: finalFallbackNarrative.story ? finalFallbackNarrative.story.substring(0, 100) + '...' : 'none',
      ownership_notes: finalFallbackNarrative.ownership_notes,
      behind_the_scenes: finalFallbackNarrative.behind_the_scenes,
      template_used: finalFallbackNarrative.template_used
    });
    console.log('[COPY_AGENT] Done ✅ (final fallback)');
    return finalFallbackNarrative;
    
  } catch (error) {
    console.error('Narrative generation failed:', error);
    console.log('🔄 Falling back to fallback narrative for:', result.brand_name);
    const fallbackNarrative = getFallbackNarrative(result);
    console.log('[COPY_AGENT] Using error fallback narrative:', {
      headline: fallbackNarrative.headline,
      tagline: fallbackNarrative.tagline,
      story: fallbackNarrative.story ? fallbackNarrative.story.substring(0, 100) + '...' : 'none',
      ownership_notes: fallbackNarrative.ownership_notes,
      behind_the_scenes: fallbackNarrative.behind_the_scenes,
      template_used: fallbackNarrative.template_used
    });
    console.log('[COPY_AGENT] Done ✅ (error fallback)');
    return fallbackNarrative;
  }
}

function getFallbackNarrative(result: any) {
  const brandName = result.brand_name || 'Unknown Brand';
  const ultimateOwner = result.ultimate_owner || 'Unknown Owner';
  const ownerCountry = result.ultimate_owner_country || 'Unknown';
  const confidence = result.confidence || 0;
  
  console.log('🔧 [Fallback] Generating fallback narrative with:', {
    brandName,
    ultimateOwner,
    ownerCountry,
    confidence
  });
  
  const fallbackNarrative = {
    headline: `${brandName} is owned by ${ultimateOwner}`,
    tagline: "Discover the corporate connections behind your favorite brands",
    story: `${brandName} is part of a larger corporate network. The brand is ultimately owned by ${ultimateOwner}, a major player in the industry. This ownership structure reflects the complex web of corporate relationships that shape the products we use every day.`,
    ownership_notes: `Ownership: ${ultimateOwner} | Country: ${ownerCountry} | Confidence: ${confidence}%`,
    behind_the_scenes: "Corporate ownership research involves analyzing public records, financial statements, and regulatory filings to trace the ultimate beneficiaries of brand ownership.",
    template_used: "fallback_narrative"
  };
  
  // Sanitize all fallback narrative fields to prevent JSON parsing issues
  return {
    headline: sanitizeNarrativeField(fallbackNarrative.headline),
    tagline: sanitizeNarrativeField(fallbackNarrative.tagline),
    story: sanitizeNarrativeField(fallbackNarrative.story),
    ownership_notes: sanitizeNarrativeArray([fallbackNarrative.ownership_notes]),
    behind_the_scenes: sanitizeNarrativeArray([fallbackNarrative.behind_the_scenes]),
    template_used: sanitizeNarrativeField(fallbackNarrative.template_used)
  };
}
