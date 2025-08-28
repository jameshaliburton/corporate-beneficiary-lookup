/**
 * New Narrative Generation System v2
 * 
 * This system generates engaging, shareable ownership insights focusing on
 * the country of the ultimate financial beneficiary. It uses only existing
 * pipeline result fields and provides fallback-friendly values.
 */

export interface OwnershipResult {
  // Core brand data
  brand_name?: string;
  brand_country?: string;
  
  // Ownership data
  ultimate_owner?: string;
  ultimate_owner_country?: string;
  financial_beneficiary?: string;
  financial_beneficiary_country?: string;
  
  // Ownership structure
  ownership_type?: string;
  ownership_structure_type?: string;
  relationship_type?: string;
  
  // Confidence and quality
  confidence?: number;
  confidence_score?: number;
  
  // Additional context
  acquisition_year?: number;
  previous_owner?: string;
  vision_context?: any;
  disambiguation_options?: any[];
  
  // Existing narrative fields (if any)
  headline?: string;
  tagline?: string;
  story?: string;
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
 * Country flag emoji mapping
 */
const COUNTRY_FLAGS: Record<string, string> = {
  'Sweden': '🇸🇪',
  'Netherlands': '🇳🇱',
  'United States': '🇺🇸',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'Switzerland': '🇨🇭',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Denmark': '🇩🇰',
  'Norway': '🇳🇴',
  'Finland': '🇫🇮',
  'South Korea': '🇰🇷',
  'Brazil': '🇧🇷',
  'India': '🇮🇳',
  'Mexico': '🇲🇽',
  'Unknown': '🏳️'
};

/**
 * Get country flag emoji
 */
function getCountryFlag(country?: string): string {
  if (!country || country === 'Unknown') return '🏳️';
  return COUNTRY_FLAGS[country] || '🏳️';
}

/**
 * Get country adjective for storytelling
 */
function getCountryAdjective(country?: string): string {
  if (!country || country === 'Unknown') return '';
  
  const adjectives: Record<string, string> = {
    'Sweden': 'Swedish',
    'Netherlands': 'Dutch',
    'United States': 'American',
    'Germany': 'German',
    'France': 'French',
    'United Kingdom': 'British',
    'UK': 'British',
    'Japan': 'Japanese',
    'China': 'Chinese',
    'Switzerland': 'Swiss',
    'Canada': 'Canadian',
    'Australia': 'Australian',
    'Italy': 'Italian',
    'Spain': 'Spanish',
    'Denmark': 'Danish',
    'Norway': 'Norwegian',
    'Finland': 'Finnish',
    'South Korea': 'South Korean',
    'Brazil': 'Brazilian',
    'India': 'Indian',
    'Mexico': 'Mexican'
  };
  
  return adjectives[country] || country;
}

/**
 * Select narrative template based on ownership data
 */
function selectNarrativeTemplate(result: OwnershipResult): string {
  const {
    brand_country,
    ultimate_owner_country,
    financial_beneficiary_country,
    ownership_type,
    ownership_structure_type,
    confidence,
    confidence_score,
    acquisition_year,
    previous_owner,
    vision_context,
    disambiguation_options
  } = result;

  const effectiveConfidence = confidence || confidence_score || 0;
  const ownerCountry = ultimate_owner_country || financial_beneficiary_country;

  // Priority 1: Ambiguous ownership
  if (disambiguation_options && disambiguation_options.length > 0) {
    return 'AMBIGUOUS_OWNERSHIP';
  }

  // Priority 2: Low confidence
  if (effectiveConfidence < 50) {
    return 'LOW_CONFIDENCE';
  }

  // Priority 3: Acquisition story
  if (acquisition_year && previous_owner) {
    return 'ACQUISITION_STORY';
  }

  // Priority 4: Vision-enhanced
  if (vision_context && effectiveConfidence > 60) {
    return 'VISION_ENHANCED';
  }

  // Priority 5: Same country (local) - check this before family/private
  if (brand_country === ownerCountry && effectiveConfidence > 70) {
    return 'LOCAL_INDEPENDENT';
  }

  // Priority 6: Family/Private ownership
  if (ownership_type?.includes('Family') || ownership_structure_type?.includes('Family') ||
      ownership_type?.includes('Private') || ownership_structure_type?.includes('Private')) {
    return 'FAMILY_HERITAGE';
  }

  // Priority 6: Public company/Conglomerate
  if (ownership_type?.includes('Public') || ownership_structure_type?.includes('Public') ||
      ownership_type?.includes('Conglomerate') || ownership_structure_type?.includes('Conglomerate')) {
    return 'CORPORATE_EMPIRE';
  }

  // Priority 7: Different country (global)
  if (brand_country !== ownerCountry && effectiveConfidence > 70) {
    return 'HIDDEN_GLOBAL_OWNER';
  }

  // Default fallback
  return 'HIDDEN_GLOBAL_OWNER';
}

/**
 * Generate narrative content using template-based approach
 */
export function generateNarrativeFromResult(result: OwnershipResult): NarrativeFields {
  const template = selectNarrativeTemplate(result);
  
  // Log template selection
  console.log('[NARRATIVE_GEN]', {
    brand: result.brand_name,
    template,
    confidence: result.confidence || result.confidence_score,
    brand_country: result.brand_country,
    owner_country: result.ultimate_owner_country || result.financial_beneficiary_country
  });

  // Generate content based on template
  switch (template) {
    case 'AMBIGUOUS_OWNERSHIP':
      return generateAmbiguousOwnershipNarrative(result);
    case 'LOW_CONFIDENCE':
      return generateLowConfidenceNarrative(result);
    case 'ACQUISITION_STORY':
      return generateAcquisitionStoryNarrative(result);
    case 'VISION_ENHANCED':
      return generateVisionEnhancedNarrative(result);
    case 'FAMILY_HERITAGE':
      return generateFamilyHeritageNarrative(result);
    case 'CORPORATE_EMPIRE':
      return generateCorporateEmpireNarrative(result);
    case 'LOCAL_INDEPENDENT':
      return generateLocalIndependentNarrative(result);
    case 'HIDDEN_GLOBAL_OWNER':
    default:
      return generateHiddenGlobalOwnerNarrative(result);
  }
}

/**
 * Template: Ambiguous Ownership
 */
function generateAmbiguousOwnershipNarrative(result: OwnershipResult): NarrativeFields {
  const brand = result.brand_name || 'This brand';
  const ownerCountry = result.ultimate_owner_country || result.financial_beneficiary_country;
  const countryFlag = getCountryFlag(ownerCountry);
  const countryAdjective = getCountryAdjective(ownerCountry);

  return {
    headline: `${brand} ownership: More questions than answers right now`,
    tagline: `Ownership details are unclear and require further investigation`,
    story: `The ownership structure of ${brand} appears to be complex or ambiguous. While we've identified some potential connections, the exact corporate relationships need additional verification. This is common with multinational companies or those with complex holding structures.`,
    ownership_notes: [
      `Multiple potential ownership paths identified for ${brand}`,
      `Further research needed to determine ultimate beneficiary`,
      ownerCountry ? `Potential connection to ${countryAdjective} companies` : 'Geographic origin unclear'
    ],
    behind_the_scenes: [
      'Analyzed multiple corporate databases',
      'Identified conflicting ownership information',
      'Flagged for additional verification'
    ],
    template_used: 'AMBIGUOUS_OWNERSHIP'
  };
}

/**
 * Template: Low Confidence
 */
function generateLowConfidenceNarrative(result: OwnershipResult): NarrativeFields {
  const brand = result.brand_name || 'This brand';
  const confidence = result.confidence || result.confidence_score || 0;

  return {
    headline: `${brand} ownership: Limited information available`,
    tagline: `Confidence level: ${confidence}% - More research needed`,
    story: `We found some information about ${brand}'s ownership, but our confidence in the accuracy is limited. This could be due to limited public information, complex corporate structures, or the brand being relatively new or private.`,
    ownership_notes: [
      `Confidence score: ${confidence}%`,
      'Limited public information available',
      'Additional verification recommended'
    ],
    behind_the_scenes: [
      'Searched multiple corporate databases',
      'Found limited public records',
      'Confidence assessment completed'
    ],
    template_used: 'LOW_CONFIDENCE'
  };
}

/**
 * Template: Acquisition Story
 */
function generateAcquisitionStoryNarrative(result: OwnershipResult): NarrativeFields {
  const brand = result.brand_name || 'This brand';
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  const ownerCountry = result.ultimate_owner_country || result.financial_beneficiary_country;
  const countryFlag = getCountryFlag(ownerCountry);
  const countryAdjective = getCountryAdjective(ownerCountry);
  const acquisitionYear = result.acquisition_year;
  const previousOwner = result.previous_owner;

  return {
    headline: `${brand} was acquired by ${countryFlag} ${owner}`,
    tagline: `Acquired in ${acquisitionYear}${previousOwner ? ` from ${previousOwner}` : ''}`,
    story: `${brand} is now part of ${owner}, a ${countryAdjective} company. ${acquisitionYear ? `The acquisition took place in ${acquisitionYear}` : 'The acquisition details show'} how this brand became part of a larger corporate structure.`,
    ownership_notes: [
      `Acquired by ${owner} in ${acquisitionYear || 'recent years'}`,
      previousOwner ? `Previously owned by ${previousOwner}` : 'Previous ownership history available',
      `Ultimate beneficiary: ${owner} (${ownerCountry || 'Unknown'})`
    ],
    behind_the_scenes: [
      'Analyzed acquisition records',
      'Verified corporate ownership changes',
      'Confirmed current ownership structure'
    ],
    template_used: 'ACQUISITION_STORY'
  };
}

/**
 * Template: Vision Enhanced
 */
function generateVisionEnhancedNarrative(result: OwnershipResult): NarrativeFields {
  const brand = result.brand_name || 'This brand';
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  const ownerCountry = result.ultimate_owner_country || result.financial_beneficiary_country;
  const countryFlag = getCountryFlag(ownerCountry);
  const countryAdjective = getCountryAdjective(ownerCountry);

  return {
    headline: `${brand} ownership revealed through product analysis`,
    tagline: `Owned by ${countryFlag} ${owner}`,
    story: `By analyzing the product packaging and visual elements, we were able to trace ${brand}'s ownership to ${owner}, a ${countryAdjective} company. This vision-enhanced analysis provided additional context about the brand's corporate connections.`,
    ownership_notes: [
      `Vision analysis confirmed ownership by ${owner}`,
      `Product packaging revealed ${countryAdjective} connections`,
      `Ultimate beneficiary: ${owner} (${ownerCountry || 'Unknown'})`
    ],
    behind_the_scenes: [
      'Analyzed product packaging visually',
      'Extracted text and logo information',
      'Cross-referenced with corporate databases'
    ],
    template_used: 'VISION_ENHANCED'
  };
}

/**
 * Template: Family Heritage
 */
function generateFamilyHeritageNarrative(result: OwnershipResult): NarrativeFields {
  const brand = result.brand_name || 'This brand';
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  const ownerCountry = result.ultimate_owner_country || result.financial_beneficiary_country;
  const countryFlag = getCountryFlag(ownerCountry);
  const countryAdjective = getCountryAdjective(ownerCountry);

  return {
    headline: `${brand} remains in ${countryFlag} family hands`,
    tagline: `Family-owned ${countryAdjective} company`,
    story: `${brand} is part of a ${countryAdjective} family business, maintaining its heritage and local connections. This family ownership structure often means the brand stays true to its original values and maintains strong ties to its country of origin.`,
    ownership_notes: [
      `Family-owned business structure`,
      `Maintains ${countryAdjective} heritage`,
      `Ultimate beneficiary: ${owner} (${ownerCountry || 'Unknown'})`
    ],
    behind_the_scenes: [
      'Verified family ownership structure',
      'Confirmed local business connections',
      'Analyzed corporate governance'
    ],
    template_used: 'FAMILY_HERITAGE'
  };
}

/**
 * Template: Corporate Empire
 */
function generateCorporateEmpireNarrative(result: OwnershipResult): NarrativeFields {
  const brand = result.brand_name || 'This brand';
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  const ownerCountry = result.ultimate_owner_country || result.financial_beneficiary_country;
  const countryFlag = getCountryFlag(ownerCountry);
  const countryAdjective = getCountryAdjective(ownerCountry);

  return {
    headline: `${brand} is part of a ${countryFlag} corporate empire`,
    tagline: `Owned by ${owner}, a major ${countryAdjective} corporation`,
    story: `${brand} is one of many brands under the ${owner} umbrella, a major ${countryAdjective} corporation. This corporate structure allows the brand to benefit from significant resources while maintaining its market presence.`,
    ownership_notes: [
      `Part of ${owner} corporate portfolio`,
      `Major ${countryAdjective} corporation`,
      `Ultimate beneficiary: ${owner} (${ownerCountry || 'Unknown'})`
    ],
    behind_the_scenes: [
      'Analyzed corporate portfolio structure',
      'Verified parent company connections',
      'Confirmed multinational operations'
    ],
    template_used: 'CORPORATE_EMPIRE'
  };
}

/**
 * Template: Local Independent
 */
function generateLocalIndependentNarrative(result: OwnershipResult): NarrativeFields {
  const brand = result.brand_name || 'This brand';
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  const ownerCountry = result.ultimate_owner_country || result.financial_beneficiary_country;
  const countryFlag = getCountryFlag(ownerCountry);
  const countryAdjective = getCountryAdjective(ownerCountry);

  return {
    headline: `${brand} stays true to its ${countryFlag} roots`,
    tagline: `Locally owned ${countryAdjective} company`,
    story: `${brand} remains under ${countryAdjective} ownership, maintaining its local identity and connections. This local ownership structure often means the brand stays close to its original market and maintains strong community ties.`,
    ownership_notes: [
      `Locally owned in ${ownerCountry}`,
      `Maintains ${countryAdjective} identity`,
      `Ultimate beneficiary: ${owner} (${ownerCountry || 'Unknown'})`
    ],
    behind_the_scenes: [
      'Verified local ownership structure',
      'Confirmed domestic operations',
      'Analyzed local market presence'
    ],
    template_used: 'LOCAL_INDEPENDENT'
  };
}

/**
 * Template: Hidden Global Owner (Default)
 */
function generateHiddenGlobalOwnerNarrative(result: OwnershipResult): NarrativeFields {
  const brand = result.brand_name || 'This brand';
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  const ownerCountry = result.ultimate_owner_country || result.financial_beneficiary_country;
  const brandCountry = result.brand_country;
  const countryFlag = getCountryFlag(ownerCountry);
  const countryAdjective = getCountryAdjective(ownerCountry);
  const brandCountryFlag = getCountryFlag(brandCountry);

  const isSameCountry = brandCountry === ownerCountry;
  const headline = isSameCountry 
    ? `${brand} ownership trail leads to ${countryFlag} ${owner}`
    : `${brand} isn't as ${brandCountryFlag} as you think`;

  const tagline = isSameCountry
    ? `Owned by ${owner} in ${ownerCountry || 'Unknown'}`
    : `Owned by ${countryFlag} ${owner}`;

  const story = isSameCountry
    ? `${brand} is ultimately owned by ${owner}, a ${countryAdjective} company. This ownership structure shows how the brand maintains its local connections while being part of a larger corporate framework.`
    : `Despite its ${brandCountryFlag} appearance, ${brand} is actually owned by ${owner}, a ${countryAdjective} company. This is a common pattern in global business, where brands maintain local identities while being part of international corporate structures.`;

  return {
    headline,
    tagline,
    story,
    ownership_notes: [
      `Ultimate beneficiary: ${owner} (${ownerCountry || 'Unknown'})`,
      brandCountry ? `Brand origin: ${brandCountry}` : 'Brand origin: Unknown',
      `Ownership structure: ${result.ownership_type || result.ownership_structure_type || 'Corporate'}`
    ],
    behind_the_scenes: [
      'Analyzed corporate ownership chains',
      'Verified ultimate beneficiary',
      'Confirmed international connections'
    ],
    template_used: 'HIDDEN_GLOBAL_OWNER'
  };
}
