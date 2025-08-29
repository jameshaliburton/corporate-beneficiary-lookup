/**
 * @fallback
 * Tests for partial data resilience
 * Provides only partial ownership object and verifies safe rendering
 */

import { generateNarrativeFromResult } from '@/lib/services/narrative-generator-v3';

// Mock ownership data with various levels of completeness
const mockPartialData = {
  // Only brand name
  brandOnly: {
    brand_name: 'Test Brand'
  },

  // Brand and owner only
  brandAndOwner: {
    brand_name: 'Test Brand',
    ultimate_owner: 'Test Owner'
  },

  // Brand, owner, and confidence
  brandOwnerConfidence: {
    brand_name: 'Test Brand',
    ultimate_owner: 'Test Owner',
    confidence: 75
  },

  // Missing brand name
  missingBrand: {
    ultimate_owner: 'Test Owner',
    ultimate_owner_country: 'United States',
    confidence: 80
  },

  // Missing owner
  missingOwner: {
    brand_name: 'Test Brand',
    brand_country: 'United States',
    confidence: 70
  },

  // Missing countries
  missingCountries: {
    brand_name: 'Test Brand',
    ultimate_owner: 'Test Owner',
    confidence: 85
  },

  // Missing confidence
  missingConfidence: {
    brand_name: 'Test Brand',
    ultimate_owner: 'Test Owner',
    brand_country: 'United States',
    ultimate_owner_country: 'United States'
  },

  // Missing ownership type
  missingOwnershipType: {
    brand_name: 'Test Brand',
    ultimate_owner: 'Test Owner',
    brand_country: 'United States',
    ultimate_owner_country: 'United States',
    confidence: 90
  },

  // Missing notes and behind the scenes
  missingNotes: {
    brand_name: 'Test Brand',
    ultimate_owner: 'Test Owner',
    brand_country: 'United States',
    ultimate_owner_country: 'United States',
    confidence: 85,
    ownership_type: 'Private Company'
  },

  // All fields present but some empty
  emptyFields: {
    brand_name: '',
    ultimate_owner: '',
    brand_country: '',
    ultimate_owner_country: '',
    confidence: 0,
    ownership_type: '',
    ownership_notes: [],
    behind_the_scenes: []
  },

  // Null values
  nullValues: {
    brand_name: null,
    ultimate_owner: null,
    brand_country: null,
    ultimate_owner_country: null,
    confidence: null,
    ownership_type: null,
    ownership_notes: null,
    behind_the_scenes: null
  },

  // Undefined values
  undefinedValues: {
    brand_name: undefined,
    ultimate_owner: undefined,
    brand_country: undefined,
    ultimate_owner_country: undefined,
    confidence: undefined,
    ownership_type: undefined,
    ownership_notes: undefined,
    behind_the_scenes: undefined
  },

  // Mixed null/undefined values
  mixedNullUndefined: {
    brand_name: 'Test Brand',
    ultimate_owner: null,
    brand_country: undefined,
    ultimate_owner_country: 'United States',
    confidence: 60,
    ownership_type: null,
    ownership_notes: undefined,
    behind_the_scenes: []
  }
};

describe('@fallback Partial Data Resilience Tests', () => {
  beforeEach(() => {
    // Mock console.log to capture logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle brand name only', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.brandOnly);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that brand name is used
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
  });

  it('should handle brand and owner only', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.brandAndOwner);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that both brand and owner are used
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle brand, owner, and confidence', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.brandOwnerConfidence);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that all available data is used
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle missing brand name', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.missingBrand);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that available data is used
    expect(result.story).toContain('Test Owner');
  });

  it('should handle missing owner', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.missingOwner);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that available data is used
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
  });

  it('should handle missing countries', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.missingCountries);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that available data is used
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle missing confidence', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.missingConfidence);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that available data is used
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle missing ownership type', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.missingOwnershipType);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that available data is used
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle missing notes and behind the scenes', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.missingNotes);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that available data is used
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle empty fields', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.emptyFields);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is generated
    expect(result.headline).toBeDefined();
    expect(result.story).toBeDefined();
  });

  it('should handle null values', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.nullValues);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is generated
    expect(result.headline).toBeDefined();
    expect(result.story).toBeDefined();
  });

  it('should handle undefined values', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.undefinedValues);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is generated
    expect(result.headline).toBeDefined();
    expect(result.story).toBeDefined();
  });

  it('should handle mixed null/undefined values', async () => {
    const result = await generateNarrativeFromResult(mockPartialData.mixedNullUndefined);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that available data is used
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
  });

  it('should maintain consistent structure across all partial data scenarios', async () => {
    const testCases = Object.values(mockPartialData);

    for (const testCase of testCases) {
      const result = await generateNarrativeFromResult(testCase);

      // Check that all results have consistent structure
      expect(result).toHaveProperty('headline');
      expect(result).toHaveProperty('tagline');
      expect(result).toHaveProperty('story');
      expect(result).toHaveProperty('ownership_notes');
      expect(result).toHaveProperty('behind_the_scenes');
      expect(result).toHaveProperty('template_used');

      // Check that all results have defined values
      expect(result.headline).toBeDefined();
      expect(result.tagline).toBeDefined();
      expect(result.story).toBeDefined();
      expect(result.ownership_notes).toBeDefined();
      expect(result.behind_the_scenes).toBeDefined();
      expect(result.template_used).toBeDefined();
    }
  });

  it('should handle completely empty object', async () => {
    const result = await generateNarrativeFromResult({});

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is generated
    expect(result.headline).toBeDefined();
    expect(result.story).toBeDefined();
  });

  it('should handle undefined input', async () => {
    const result = await generateNarrativeFromResult(undefined as any);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is generated
    expect(result.headline).toBeDefined();
    expect(result.story).toBeDefined();
  });

  it('should handle null input', async () => {
    const result = await generateNarrativeFromResult(null as any);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is generated
    expect(result.headline).toBeDefined();
    expect(result.story).toBeDefined();
  });

  it('should log partial data scenarios', async () => {
    await generateNarrativeFromResult(mockPartialData.brandOnly);

    // Check that logging occurs
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[NARRATIVE_GEN_V3]'),
      expect.any(Object)
    );
  });

  it('should handle partial data with country information', async () => {
    const partialWithCountry = {
      brand_name: 'Test Brand',
      ultimate_owner: 'Test Owner',
      brand_country: 'United States',
      ultimate_owner_country: 'United States'
    };

    const result = await generateNarrativeFromResult(partialWithCountry);

    // Check that result is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that country information is used
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });
});
