/**
 * Brand Disambiguation Agent
 * Uses contextual clues to distinguish between multiple companies with similar brand names
 */

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
 * Disambiguate brand using contextual clues
 * @param {Object} extractionData - Data from the extraction phase
 * @param {Array} candidateCompanies - Array of potential companies with similar names
 * @returns {Object} Disambiguation result
 */
export async function disambiguateBrand(extractionData, candidateCompanies = []) {
  console.log('🔍 Starting brand disambiguation for:', extractionData.brand_name);
  console.log('📊 Contextual clues:', {
    language_indicators: extractionData.language_indicators,
    country_indicators: extractionData.country_indicators,
    product_style: extractionData.product_style,
    regional_clues: extractionData.regional_clues,
    packaging_characteristics: extractionData.packaging_characteristics
  });

  try {
    // Build contextual clues summary
    const contextualClues = buildContextualCluesSummary(extractionData);
    
    // If we have candidate companies, use them for targeted disambiguation
    if (candidateCompanies.length > 0) {
      return await disambiguateWithCandidates(extractionData, candidateCompanies, contextualClues);
    }
    
    // Otherwise, do a general disambiguation search
    return await performGeneralDisambiguation(extractionData, contextualClues);
    
  } catch (error) {
    console.error('❌ Error in brand disambiguation:', error);
    return {
      success: false,
      disambiguated_brand: extractionData.brand_name,
      disambiguation_confidence: 0,
      reasoning: 'Error in disambiguation process',
      candidate_companies: [],
      contextual_clues_used: [],
      error: error.message
    };
  }
}

/**
 * Build a summary of contextual clues for disambiguation
 */
function buildContextualCluesSummary(extractionData) {
  const clues = [];
  
  // Language indicators
  if (extractionData.language_indicators && extractionData.language_indicators.length > 0) {
    clues.push(`Languages detected: ${extractionData.language_indicators.join(', ')}`);
  }
  
  // Country indicators
  if (extractionData.country_indicators && extractionData.country_indicators.length > 0) {
    clues.push(`Country indicators: ${extractionData.country_indicators.join(', ')}`);
  }
  
  // Product style
  if (extractionData.product_style && extractionData.product_style !== 'Unknown') {
    clues.push(`Product style: ${extractionData.product_style}`);
  }
  
  // Regional clues
  if (extractionData.regional_clues && extractionData.regional_clues.length > 0) {
    clues.push(`Regional indicators: ${extractionData.regional_clues.join(', ')}`);
  }
  
  // Packaging characteristics
  if (extractionData.packaging_characteristics && extractionData.packaging_characteristics.length > 0) {
    clues.push(`Packaging: ${extractionData.packaging_characteristics.join(', ')}`);
  }
  
  // Premium indicators
  if (extractionData.premium_indicators) {
    clues.push('Premium/luxury product indicators present');
  }
  
  // Store brand indicators
  if (extractionData.store_brand_indicators) {
    clues.push('Appears to be a store/private label brand');
  }
  
  // Dietary indicators
  if (extractionData.dietary_indicators && extractionData.dietary_indicators.length > 0) {
    clues.push(`Dietary features: ${extractionData.dietary_indicators.join(', ')}`);
  }
  
  return clues.join('; ');
}

/**
 * Disambiguate with specific candidate companies
 */
async function disambiguateWithCandidates(extractionData, candidateCompanies, contextualClues) {
  const prompt = `You are a brand disambiguation expert. Given a brand name and contextual clues, determine which company is most likely the correct match.

BRAND TO DISAMBIGUATE: "${extractionData.brand_name}"
PRODUCT: "${extractionData.product_name}"
CONTEXTUAL CLUES: ${contextualClues}

CANDIDATE COMPANIES:
${candidateCompanies.map((company, index) => 
  `${index + 1}. ${company.name} (${company.country || 'Unknown country'}) - ${company.description || 'No description'}`
).join('\n')}

ANALYSIS INSTRUCTIONS:
1. Consider the contextual clues carefully (language, country indicators, product style, regional clues)
2. Look for specific matches between the clues and company characteristics
3. Consider the product type and whether it matches the company's typical products
4. Pay attention to regional/country indicators that might point to a specific company
5. If multiple companies seem equally likely, note this and explain why

Return JSON:
{
  "most_likely_company": {
    "name": "string",
    "country": "string",
    "confidence": number (0-100),
    "reasoning": "string"
  },
  "alternative_companies": [
    {
      "name": "string",
      "country": "string", 
      "confidence": number (0-100),
      "reasoning": "string"
    }
  ],
  "disambiguation_confidence": number (0-100),
  "contextual_clues_used": ["array of clues that were most helpful"],
  "reasoning": "string (overall disambiguation reasoning)"
}`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const content = response.content[0].text;
  console.log('🔍 Disambiguation response:', content);

  try {
    const result = JSON.parse(content);
    return {
      success: true,
      disambiguated_brand: result.most_likely_company?.name || extractionData.brand_name,
      disambiguation_confidence: result.disambiguation_confidence || 0,
      reasoning: result.reasoning || 'Disambiguation completed',
      candidate_companies: [
        result.most_likely_company,
        ...(result.alternative_companies || [])
      ].filter(Boolean),
      contextual_clues_used: result.contextual_clues_used || [],
      disambiguation_method: 'candidate_matching'
    };
  } catch (parseError) {
    console.error('❌ Error parsing disambiguation response:', parseError);
    return {
      success: false,
      disambiguated_brand: extractionData.brand_name,
      disambiguation_confidence: 0,
      reasoning: 'Error parsing disambiguation response',
      candidate_companies: [],
      contextual_clues_used: [],
      error: parseError.message
    };
  }
}

/**
 * Perform general disambiguation search
 */
async function performGeneralDisambiguation(extractionData, contextualClues) {
  const prompt = `You are a brand disambiguation expert. Given a brand name and contextual clues, search for and identify multiple companies that might match this brand name.

BRAND TO DISAMBIGUATE: "${extractionData.brand_name}"
PRODUCT: "${extractionData.product_name}"
CONTEXTUAL CLUES: ${contextualClues}

SEARCH INSTRUCTIONS:
1. Search for companies with this exact brand name or very similar names
2. Consider different countries and regions where this brand might exist
3. Look for companies that match the contextual clues (language, country, product style, etc.)
4. Include both exact matches and similar brand names
5. For each company found, provide:
   - Company name and country
   - Brief description of what they do
   - How well they match the contextual clues
   - Confidence level (0-100)

Return JSON:
{
  "discovered_companies": [
    {
      "name": "string",
      "country": "string",
      "description": "string",
      "contextual_match_score": number (0-100),
      "confidence": number (0-100),
      "reasoning": "string"
    }
  ],
  "most_likely_match": {
    "name": "string",
    "country": "string",
    "confidence": number (0-100),
    "reasoning": "string"
  },
  "disambiguation_confidence": number (0-100),
  "contextual_clues_used": ["array of clues that were most helpful"],
  "reasoning": "string (overall disambiguation reasoning)"
}`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const content = response.content[0].text;
  console.log('🔍 General disambiguation response:', content);

  try {
    const result = JSON.parse(content);
    return {
      success: true,
      disambiguated_brand: result.most_likely_match?.name || extractionData.brand_name,
      disambiguation_confidence: result.disambiguation_confidence || 0,
      reasoning: result.reasoning || 'General disambiguation completed',
      candidate_companies: result.discovered_companies || [],
      contextual_clues_used: result.contextual_clues_used || [],
      disambiguation_method: 'general_search'
    };
  } catch (parseError) {
    console.error('❌ Error parsing general disambiguation response:', parseError);
    return {
      success: false,
      disambiguated_brand: extractionData.brand_name,
      disambiguation_confidence: 0,
      reasoning: 'Error parsing general disambiguation response',
      candidate_companies: [],
      contextual_clues_used: [],
      error: parseError.message
    };
  }
}

/**
 * Check if disambiguation is needed based on contextual clues
 */
export function shouldDisambiguate(extractionData) {
  // Check for multiple language indicators
  const hasMultipleLanguages = extractionData.language_indicators && 
    extractionData.language_indicators.length > 1;
  
  // Check for country indicators that might suggest international brand
  const hasCountryIndicators = extractionData.country_indicators && 
    extractionData.country_indicators.length > 0;
  
  // Check for regional clues that might suggest multiple markets
  const hasRegionalClues = extractionData.regional_clues && 
    extractionData.regional_clues.length > 0;
  
  // Check if brand name is common/generic
  const isCommonBrandName = isGenericBrandName(extractionData.brand_name);
  
  return hasMultipleLanguages || hasCountryIndicators || hasRegionalClues || isCommonBrandName;
}

/**
 * Check if brand name is common/generic and might need disambiguation
 */
function isGenericBrandName(brandName) {
  const commonBrandNames = [
    'johnny', 'johnnys', 'johnny\'s',
    'mike', 'mikes', 'mike\'s',
    'joe', 'joes', 'joe\'s',
    'dave', 'daves', 'dave\'s',
    'bob', 'bobs', 'bob\'s',
    'tom', 'toms', 'tom\'s',
    'pete', 'petes', 'pete\'s',
    'sam', 'sams', 'sam\'s',
    'dan', 'dans', 'dan\'s',
    'mark', 'marks', 'mark\'s',
    'chris', 'chriss', 'chris\'s',
    'alex', 'alexs', 'alex\'s',
    'pat', 'pats', 'pat\'s',
    'lee', 'lees', 'lee\'s',
    'ray', 'rays', 'ray\'s',
    'jay', 'jays', 'jay\'s',
    'kay', 'kays', 'kay\'s',
    'may', 'mays', 'may\'s'
  ];
  
  return commonBrandNames.includes(brandName.toLowerCase().replace(/[^a-z]/g, ''));
}

export default {
  disambiguateBrand,
  shouldDisambiguate
}; 