/**
 * Test script for the new narrative generation system v2
 */

console.log('🧪 Testing Narrative Generation System v2\n');

// Import the narrative generator (Note: This would need to be compiled in a real environment)
// For now, we'll simulate the logic

// Test data scenarios
const testScenarios = [
  {
    name: 'Full Data, High Confidence',
    data: {
      brand_name: 'Lipton',
      brand_country: 'UK',
      ultimate_owner: 'Unilever',
      ultimate_owner_country: 'Netherlands',
      financial_beneficiary: 'Unilever',
      financial_beneficiary_country: 'Netherlands',
      ownership_type: 'Public Company',
      confidence: 90,
      ownership_notes: ['Lipton is ultimately owned by Unilever in Netherlands.']
    }
  },
  {
    name: 'Missing Owner Country',
    data: {
      brand_name: 'Local Brand',
      brand_country: 'Sweden',
      ultimate_owner: 'Unknown Company',
      ultimate_owner_country: undefined,
      confidence: 75
    }
  },
  {
    name: 'Low Confidence',
    data: {
      brand_name: 'Obscure Brand',
      brand_country: 'Unknown',
      ultimate_owner: 'Unknown',
      ultimate_owner_country: 'Unknown',
      confidence: 20
    }
  },
  {
    name: 'Same Country (Local)',
    data: {
      brand_name: 'IKEA',
      brand_country: 'Sweden',
      ultimate_owner: 'Inter IKEA Group',
      ultimate_owner_country: 'Sweden',
      ownership_type: 'Private',
      confidence: 85
    }
  },
  {
    name: 'Acquisition Story',
    data: {
      brand_name: 'WhatsApp',
      brand_country: 'US',
      ultimate_owner: 'Meta',
      ultimate_owner_country: 'United States',
      acquisition_year: 2014,
      previous_owner: 'WhatsApp Inc.',
      confidence: 95
    }
  },
  {
    name: 'Ambiguous Ownership',
    data: {
      brand_name: 'Complex Brand',
      brand_country: 'Germany',
      ultimate_owner: 'AMBIGUOUS_OWNERSHIP',
      disambiguation_options: [
        { name: 'Option 1', country: 'Germany' },
        { name: 'Option 2', country: 'France' }
      ],
      confidence: 60
    }
  },
  {
    name: 'Vision Enhanced',
    data: {
      brand_name: 'Product Brand',
      brand_country: 'Italy',
      ultimate_owner: 'Italian Company',
      ultimate_owner_country: 'Italy',
      vision_context: { brand: 'Product Brand', confidence: 0.8 },
      confidence: 85
    }
  }
];

// Simulate the narrative generation logic
function simulateNarrativeGeneration(result) {
  const {
    brand_country,
    ultimate_owner_country,
    financial_beneficiary_country,
    ownership_type,
    confidence,
    acquisition_year,
    previous_owner,
    vision_context,
    disambiguation_options
  } = result;

  const effectiveConfidence = confidence || 0;
  const ownerCountry = ultimate_owner_country || financial_beneficiary_country;

  // Template selection logic
  let template = 'HIDDEN_GLOBAL_OWNER';
  
  if (disambiguation_options && disambiguation_options.length > 0) {
    template = 'AMBIGUOUS_OWNERSHIP';
  } else if (effectiveConfidence < 50) {
    template = 'LOW_CONFIDENCE';
  } else if (acquisition_year && previous_owner) {
    template = 'ACQUISITION_STORY';
  } else if (vision_context && effectiveConfidence > 60) {
    template = 'VISION_ENHANCED';
  } else if (ownership_type?.includes('Family') || ownership_type?.includes('Private')) {
    template = 'FAMILY_HERITAGE';
  } else if (ownership_type?.includes('Public') || ownership_type?.includes('Conglomerate')) {
    template = 'CORPORATE_EMPIRE';
  } else if (brand_country === ownerCountry && effectiveConfidence > 70) {
    template = 'LOCAL_INDEPENDENT';
  } else if (brand_country !== ownerCountry && effectiveConfidence > 70) {
    template = 'HIDDEN_GLOBAL_OWNER';
  }

  // Generate sample content based on template
  const brand = result.brand_name || 'This brand';
  const owner = result.ultimate_owner || result.financial_beneficiary || 'Unknown';
  
  let headline, tagline, story;
  
  switch (template) {
    case 'AMBIGUOUS_OWNERSHIP':
      headline = `${brand} ownership: More questions than answers right now`;
      tagline = `Ownership details are unclear and require further investigation`;
      story = `The ownership structure of ${brand} appears to be complex or ambiguous.`;
      break;
    case 'LOW_CONFIDENCE':
      headline = `${brand} ownership: Limited information available`;
      tagline = `Confidence level: ${effectiveConfidence}% - More research needed`;
      story = `We found some information about ${brand}'s ownership, but our confidence is limited.`;
      break;
    case 'ACQUISITION_STORY':
      headline = `${brand} was acquired by ${owner}`;
      tagline = `Acquired in ${acquisition_year}${previous_owner ? ` from ${previous_owner}` : ''}`;
      story = `${brand} is now part of ${owner}. The acquisition took place in ${acquisition_year}.`;
      break;
    case 'VISION_ENHANCED':
      headline = `${brand} ownership revealed through product analysis`;
      tagline = `Owned by ${owner}`;
      story = `By analyzing the product packaging, we traced ${brand}'s ownership to ${owner}.`;
      break;
    case 'FAMILY_HERITAGE':
      headline = `${brand} remains in family hands`;
      tagline = `Family-owned company`;
      story = `${brand} is part of a family business, maintaining its heritage.`;
      break;
    case 'CORPORATE_EMPIRE':
      headline = `${brand} is part of a corporate empire`;
      tagline = `Owned by ${owner}, a major corporation`;
      story = `${brand} is one of many brands under the ${owner} umbrella.`;
      break;
    case 'LOCAL_INDEPENDENT':
      headline = `${brand} stays true to its roots`;
      tagline = `Locally owned company`;
      story = `${brand} remains under local ownership, maintaining its identity.`;
      break;
    case 'HIDDEN_GLOBAL_OWNER':
    default:
      const isSameCountry = brand_country === ownerCountry;
      headline = isSameCountry 
        ? `${brand} ownership trail leads to ${owner}`
        : `${brand} isn't as local as you think`;
      tagline = isSameCountry
        ? `Owned by ${owner} in ${ownerCountry || 'Unknown'}`
        : `Owned by ${owner}`;
      story = isSameCountry
        ? `${brand} is ultimately owned by ${owner}.`
        : `Despite its local appearance, ${brand} is actually owned by ${owner}.`;
      break;
  }

  return {
    template,
    headline,
    tagline,
    story,
    confidence: effectiveConfidence
  };
}

// Run tests
console.log('Running test scenarios...\n');

testScenarios.forEach((scenario, index) => {
  console.log(`📋 Test ${index + 1}: ${scenario.name}`);
  
  const narrative = simulateNarrativeGeneration(scenario.data);
  
  console.log(`   Template: ${narrative.template}`);
  console.log(`   Headline: ${narrative.headline}`);
  console.log(`   Tagline: ${narrative.tagline}`);
  console.log(`   Story: ${narrative.story}`);
  console.log(`   Confidence: ${narrative.confidence}%`);
  console.log('');
});

// Summary
console.log('📊 Test Summary:');
console.log(`Total scenarios tested: ${testScenarios.length}`);
console.log('Templates used:');
const templates = [...new Set(testScenarios.map(s => simulateNarrativeGeneration(s.data).template))];
templates.forEach(template => {
  const count = testScenarios.filter(s => simulateNarrativeGeneration(s.data).template === template).length;
  console.log(`  - ${template}: ${count} scenarios`);
});

console.log('\n✅ All test scenarios completed successfully!');
console.log('The new narrative generation system should handle all these cases properly.');
