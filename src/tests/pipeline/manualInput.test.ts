/**
 * @pipeline
 * Tests for manual brand entry and full result flow
 * Simulates manual brand entry + check full result flow
 */

import { transformPipelineData } from '@/lib/utils/pipeline-transformer';

// Mock pipeline result data for manual input scenarios
const mockPipelineResults = {
  // Full manual input with complete data
  fullManual: {
    brand: 'IKEA',
    financial_beneficiary: 'Inter IKEA Group',
    confidence_score: 95,
    ownership_structure_type: 'Private Company',
    reasoning: 'Manual input for IKEA brand',
    brand_country: 'Sweden',
    beneficiary_country: 'Sweden',
    ownership_notes: ['Founded in Sweden', 'Family-owned business'],
    behind_the_scenes: ['Verified Swedish ownership', 'Confirmed local operations'],
    headline: "IKEA's Swedish roots revealed 🇸🇪",
    tagline: "The furniture giant is owned by Inter IKEA Group in Sweden",
    story: "IKEA, the Swedish furniture giant, is owned by Inter IKEA Group, maintaining its Swedish heritage and local operations.",
    narrative_template_used: "local_independent",
    traces: [
      {
        stage: 'manual_input',
        status: 'success',
        data: { brand: 'IKEA', input_type: 'manual' }
      },
      {
        stage: 'ownership_research',
        status: 'success',
        data: { owner: 'Inter IKEA Group', country: 'Sweden' }
      }
    ],
    sources: ['Manual input', 'Ownership database']
  },

  // Partial manual input with missing data
  partialManual: {
    brand: 'Test Brand',
    financial_beneficiary: 'Test Owner',
    confidence_score: 60,
    ownership_structure_type: 'Unknown',
    reasoning: 'Manual input with limited data',
    brand_country: 'Canada',
    beneficiary_country: 'Canada',
    ownership_notes: [],
    behind_the_scenes: [],
    headline: "Test Brand's ownership revealed 🇨🇦",
    tagline: "The test brand is owned by Test Owner in Canada",
    story: "Test Brand is owned by Test Owner in Canada.",
    narrative_template_used: "fallback",
    traces: [
      {
        stage: 'manual_input',
        status: 'success',
        data: { brand: 'Test Brand', input_type: 'manual' }
      }
    ],
    sources: ['Manual input']
  },

  // Manual input with country divergence
  divergentManual: {
    brand: 'Ben & Jerry\'s',
    financial_beneficiary: 'Unilever',
    confidence_score: 85,
    ownership_structure_type: 'Public Company',
    reasoning: 'Manual input for Ben & Jerry\'s brand',
    brand_country: 'United States',
    beneficiary_country: 'Netherlands',
    ownership_notes: ['Acquired by Unilever', 'Global ice cream brand'],
    behind_the_scenes: ['Traced to Unilever', 'Confirmed Netherlands HQ'],
    headline: "Ben & Jerry's Dutch secret revealed 🇳🇱",
    tagline: "The American ice cream brand is owned by Unilever in the Netherlands",
    story: "Ben & Jerry's, the American ice cream brand, is owned by Dutch multinational Unilever, showing how global brands can have surprising ownership structures.",
    narrative_template_used: "hidden_global_owner",
    traces: [
      {
        stage: 'manual_input',
        status: 'success',
        data: { brand: 'Ben & Jerry\'s', input_type: 'manual' }
      },
      {
        stage: 'ownership_research',
        status: 'success',
        data: { owner: 'Unilever', country: 'Netherlands' }
      }
    ],
    sources: ['Manual input', 'Corporate database']
  }
};

describe('@pipeline Manual Input Tests', () => {
  it('should handle full manual input with complete data', () => {
    const result = transformPipelineData(mockPipelineResults.fullManual);

    // Check that all data is properly transformed
    expect(result.brand).toBe('IKEA');
    expect(result.owner).toBe('Inter IKEA Group');
    expect(result.confidence).toBe(95);
    expect(result.structureType).toBe('Private Company');
    expect(result.analysisText).toBe('Manual input for IKEA brand');
    expect(result.brandCountry).toBe('Sweden');
    expect(result.ownerCountry).toBe('Sweden');

    // Check narrative fields are preserved
    expect(result.headline).toBe("IKEA's Swedish roots revealed 🇸🇪");
    expect(result.tagline).toBe("The furniture giant is owned by Inter IKEA Group in Sweden");
    expect(result.story).toBe("IKEA, the Swedish furniture giant, is owned by Inter IKEA Group, maintaining its Swedish heritage and local operations.");
    expect(result.ownership_notes).toEqual(['Founded in Sweden', 'Family-owned business']);
    expect(result.behind_the_scenes).toEqual(['Verified Swedish ownership', 'Confirmed local operations']);
    expect(result.narrative_template_used).toBe("local_independent");

    // Check traces are preserved
    expect(result.traces).toHaveLength(2);
    expect(result.traces[0].stage).toBe('manual_input');
    expect(result.traces[1].stage).toBe('ownership_research');

    // Check sources are preserved
    expect(result.sources).toEqual(['Manual input', 'Ownership database']);
  });

  it('should handle partial manual input with missing data', () => {
    const result = transformPipelineData(mockPipelineResults.partialManual);

    // Check that available data is properly transformed
    expect(result.brand).toBe('Test Brand');
    expect(result.owner).toBe('Test Owner');
    expect(result.confidence).toBe(60);
    expect(result.structureType).toBe('Unknown');
    expect(result.analysisText).toBe('Manual input with limited data');
    expect(result.brandCountry).toBe('Canada');
    expect(result.ownerCountry).toBe('Canada');

    // Check narrative fields are preserved
    expect(result.headline).toBe("Test Brand's ownership revealed 🇨🇦");
    expect(result.tagline).toBe("The test brand is owned by Test Owner in Canada");
    expect(result.story).toBe("Test Brand is owned by Test Owner in Canada.");
    expect(result.narrative_template_used).toBe("fallback");

    // Check empty arrays are handled
    expect(result.ownership_notes).toEqual([]);
    expect(result.behind_the_scenes).toEqual([]);

    // Check traces are preserved
    expect(result.traces).toHaveLength(1);
    expect(result.traces[0].stage).toBe('manual_input');

    // Check sources are preserved
    expect(result.sources).toEqual(['Manual input']);
  });

  it('should handle manual input with country divergence', () => {
    const result = transformPipelineData(mockPipelineResults.divergentManual);

    // Check that country divergence is properly handled
    expect(result.brand).toBe('Ben & Jerry\'s');
    expect(result.owner).toBe('Unilever');
    expect(result.confidence).toBe(85);
    expect(result.structureType).toBe('Public Company');
    expect(result.brandCountry).toBe('United States');
    expect(result.ownerCountry).toBe('Netherlands');

    // Check narrative fields emphasize owner country
    expect(result.headline).toBe("Ben & Jerry's Dutch secret revealed 🇳🇱");
    expect(result.tagline).toBe("The American ice cream brand is owned by Unilever in the Netherlands");
    expect(result.story).toContain('Netherlands');
    expect(result.story).toContain('Unilever');
    expect(result.narrative_template_used).toBe("hidden_global_owner");

    // Check ownership notes and behind the scenes
    expect(result.ownership_notes).toEqual(['Acquired by Unilever', 'Global ice cream brand']);
    expect(result.behind_the_scenes).toEqual(['Traced to Unilever', 'Confirmed Netherlands HQ']);

    // Check traces are preserved
    expect(result.traces).toHaveLength(2);
    expect(result.traces[0].stage).toBe('manual_input');
    expect(result.traces[1].stage).toBe('ownership_research');

    // Check sources are preserved
    expect(result.sources).toEqual(['Manual input', 'Corporate database']);
  });

  it('should preserve all narrative fields from pipeline result', () => {
    const result = transformPipelineData(mockPipelineResults.fullManual);

    // Check that all narrative fields are preserved
    expect(result).toHaveProperty('headline');
    expect(result).toHaveProperty('tagline');
    expect(result).toHaveProperty('story');
    expect(result).toHaveProperty('ownership_notes');
    expect(result).toHaveProperty('behind_the_scenes');
    expect(result).toHaveProperty('narrative_template_used');

    // Check that narrative fields are not undefined
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.narrative_template_used).toBeDefined();
  });

  it('should handle manual input with low confidence', () => {
    const lowConfidenceResult = {
      ...mockPipelineResults.partialManual,
      confidence_score: 25
    };

    const result = transformPipelineData(lowConfidenceResult);

    // Check that low confidence is preserved
    expect(result.confidence).toBe(25);

    // Check that narrative is still generated
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
  });

  it('should handle manual input with unknown countries', () => {
    const unknownCountryResult = {
      ...mockPipelineResults.partialManual,
      brand_country: 'Unknown',
      beneficiary_country: 'Unknown'
    };

    const result = transformPipelineData(unknownCountryResult);

    // Check that unknown countries are preserved
    expect(result.brandCountry).toBe('Unknown');
    expect(result.ownerCountry).toBe('Unknown');

    // Check that narrative is still generated
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
  });

  it('should maintain data integrity through transformation', () => {
    const result = transformPipelineData(mockPipelineResults.fullManual);

    // Check that all original data is preserved
    expect(result.brand).toBe(mockPipelineResults.fullManual.brand);
    expect(result.owner).toBe(mockPipelineResults.fullManual.financial_beneficiary);
    expect(result.confidence).toBe(mockPipelineResults.fullManual.confidence_score);
    expect(result.structureType).toBe(mockPipelineResults.fullManual.ownership_structure_type);
    expect(result.analysisText).toBe(mockPipelineResults.fullManual.reasoning);
    expect(result.brandCountry).toBe(mockPipelineResults.fullManual.brand_country);
    expect(result.ownerCountry).toBe(mockPipelineResults.fullManual.beneficiary_country);

    // Check that narrative fields are preserved exactly
    expect(result.headline).toBe(mockPipelineResults.fullManual.headline);
    expect(result.tagline).toBe(mockPipelineResults.fullManual.tagline);
    expect(result.story).toBe(mockPipelineResults.fullManual.story);
    expect(result.ownership_notes).toEqual(mockPipelineResults.fullManual.ownership_notes);
    expect(result.behind_the_scenes).toEqual(mockPipelineResults.fullManual.behind_the_scenes);
    expect(result.narrative_template_used).toBe(mockPipelineResults.fullManual.narrative_template_used);
  });

  it('should handle manual input with complex ownership structure', () => {
    const complexResult = {
      ...mockPipelineResults.fullManual,
      ownership_structure_type: 'Complex Corporate Structure',
      reasoning: 'Manual input with complex ownership structure analysis',
      ownership_notes: ['Multiple subsidiaries', 'Complex corporate structure', 'International operations'],
      behind_the_scenes: ['Analyzed corporate structure', 'Traced ownership chain', 'Verified subsidiaries']
    };

    const result = transformPipelineData(complexResult);

    // Check that complex structure is preserved
    expect(result.structureType).toBe('Complex Corporate Structure');
    expect(result.analysisText).toBe('Manual input with complex ownership structure analysis');
    expect(result.ownership_notes).toEqual(['Multiple subsidiaries', 'Complex corporate structure', 'International operations']);
    expect(result.behind_the_scenes).toEqual(['Analyzed corporate structure', 'Traced ownership chain', 'Verified subsidiaries']);
  });
});
