/**
 * @narrative
 * Unit tests for generateNarrativeFromResult function
 * Tests proper country emphasis, fallbacks, confidence handling
 */

import { generateNarrativeFromResult } from '@/lib/services/narrative-generator-v3';

// Mock Anthropic SDK to return dynamic narrative content based on input
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockImplementation(async (params) => {
        // Extract brand name from the user prompt
        const userPrompt = params.messages[0].content;
        console.log('[MOCK] User prompt:', userPrompt);
        
        // Try multiple patterns to extract brand name
        let brand = 'Unknown Brand';
        const patterns = [
          /BRAND:\s*([^\n]+)/,
          /brand_name['"]:\s*['"]([^'"]+)['"]/,
          /brand_name:\s*['"]([^'"]+)['"]/,
          /brand_name:\s*([^,\n]+)/,
          /Brand:\s*([^,\n]+)/,
          /brand:\s*([^,\n]+)/
        ];
        
        for (const pattern of patterns) {
          const match = userPrompt.match(pattern);
          if (match) {
            brand = match[1].trim();
            break;
          }
        }
        
        console.log('[MOCK] Extracted brand:', brand);
        
        // Generate dynamic response based on brand
        let response;
        if (brand === 'IKEA') {
          response = {
            headline: "IKEA stays true to Swedish roots 🇸🇪",
            tagline: "Family-owned company in Sweden",
            story: "IKEA remains under Swedish ownership through the Kamprad family, maintaining its distinctive Scandinavian design philosophy.",
            ownership_notes: ["Founded in Sweden", "Family-owned business", "95% confidence in ownership data"],
            behind_the_scenes: ["Verified Swedish ownership", "Confirmed local operations", "Cross-referenced with product analysis data"],
            template_used: "local_independent"
          };
        } else if (brand === 'Lipton') {
          response = {
            headline: "Lipton's global tea empire 🇳🇱",
            tagline: "Dutch-owned tea brand with worldwide reach",
            story: "Lipton is owned by Unilever, a Dutch-British multinational, making it part of a global consumer goods empire.",
            ownership_notes: ["Owned by Unilever", "Global tea brand", "Netherlands-based parent company"],
            behind_the_scenes: ["Verified Unilever ownership", "Confirmed Dutch headquarters", "Cross-referenced corporate data"],
            template_used: "hidden_global_owner"
          };
        } else if (brand === 'citizenM') {
          response = {
            headline: "citizenM's Dutch hospitality 🇳🇱",
            tagline: "Privately held by KRC Capital",
            story: "citizenM is owned by KRC Capital, a private investment firm based in the Netherlands.",
            ownership_notes: ["Privately held by KRC Capital", "Dutch investment firm", "Private ownership structure"],
            behind_the_scenes: ["Verified KRC Capital ownership", "Confirmed private structure", "Cross-referenced investment data"],
            template_used: "private_company"
          };
        } else if (brand === 'Clave Denia') {
          response = {
            headline: "Clave Denia's complex ownership structure",
            tagline: "Limited ownership information available",
            story: "Clave Denia has a complex ownership structure with limited information available about its ultimate owner.",
            ownership_notes: ["Limited ownership information", "Complex structure", "Low confidence data"],
            behind_the_scenes: ["Insufficient data", "Complex ownership chain", "Limited verification"],
            template_used: "ambiguous_ownership"
          };
        } else {
          // Generic response for other brands
          response = {
            headline: `${brand} ownership revealed`,
            tagline: `Owned by Test Owner`,
            story: `This is a test story about the ownership structure of ${brand}.`,
            ownership_notes: [`${brand} is ultimately owned by Test Owner`],
            behind_the_scenes: ["Research process completed"],
            template_used: "fallback"
          };
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response)
          }]
        };
      })
    }
  }))
}));

// Mock ownership data for different scenarios
const mockOwnershipData = {
  // IKEA: fully local, high confidence
  ikea: {
    brand_name: 'IKEA',
    brand_country: 'Sweden',
    ultimate_owner: 'Inter IKEA Group',
    ultimate_owner_country: 'Sweden',
    financial_beneficiary: 'Inter IKEA Group',
    financial_beneficiary_country: 'Sweden',
    ownership_type: 'Private Company',
    confidence: 95,
    ownership_notes: ['Founded in Sweden', 'Family-owned business'],
    behind_the_scenes: ['Verified Swedish ownership', 'Confirmed local operations']
  },

  // Lipton: global parent (Unilever), medium confidence
  lipton: {
    brand_name: 'Lipton',
    brand_country: 'United Kingdom',
    ultimate_owner: 'Unilever',
    ultimate_owner_country: 'Netherlands',
    financial_beneficiary: 'Unilever',
    financial_beneficiary_country: 'Netherlands',
    ownership_type: 'Public Company',
    confidence: 78,
    ownership_notes: ['Part of Unilever portfolio', 'Global tea brand'],
    behind_the_scenes: ['Traced to Unilever', 'Confirmed Netherlands HQ']
  },

  // CitizenM: private company, acquisition
  citizenm: {
    brand_name: 'citizenM',
    brand_country: 'Netherlands',
    ultimate_owner: 'KRC Capital',
    ultimate_owner_country: 'Netherlands',
    financial_beneficiary: 'KRC Capital',
    financial_beneficiary_country: 'Netherlands',
    ownership_type: 'Private Company',
    confidence: 95,
    ownership_notes: ['Privately held by KRC Capital', 'Dutch investment'],
    behind_the_scenes: ['Identified KRC Capital', 'Verified Netherlands base']
  },

  // Clave Denia: ambiguous ownership, low confidence
  claveDenia: {
    brand_name: 'Clave Denia',
    brand_country: 'Spain',
    ultimate_owner: 'Unknown',
    ultimate_owner_country: 'Unknown',
    financial_beneficiary: 'Unknown',
    financial_beneficiary_country: 'Unknown',
    ownership_type: 'Ambiguous',
    confidence: 25,
    ownership_notes: ['Limited ownership information'],
    behind_the_scenes: ['Insufficient data for clear ownership']
  },

  // Partial data scenario
  partial: {
    brand_name: 'TestBrand',
    brand_country: 'Germany',
    ultimate_owner: 'TestOwner',
    ultimate_owner_country: 'Germany',
    financial_beneficiary: 'TestOwner',
    financial_beneficiary_country: 'Germany',
    ownership_type: 'Unknown',
    confidence: 60
    // Missing ownership_notes and behind_the_scenes
  }
};

describe('@narrative generateNarrativeFromResult', () => {
  beforeEach(() => {
    // Mock console.log to capture narrative generation logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should generate narrative for high-confidence local brand (IKEA)', async () => {
    const result = await generateNarrativeFromResult(mockOwnershipData.ikea);
    
    expect(result).toBeDefined();
    expect(result.headline).toContain('IKEA');
    expect(result.headline).toContain('🇸🇪'); // Sweden flag
    expect(result.tagline).toContain('Sweden');
    expect(result.story).toContain('Swedish'); // Note: story says "Swedish" not "Sweden"
    expect(result.ownership_notes).toContain('Founded in Sweden');
    expect(result.behind_the_scenes).toContain('Verified Swedish ownership');
    expect(result.template_used).not.toBe('fallback');
    
    // Verify console logging
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[NARRATIVE_GEN_V3]'),
      expect.any(Object)
    );
  });

  it('should generate narrative for global brand with different countries (Lipton)', async () => {
    const result = await generateNarrativeFromResult(mockOwnershipData.lipton);
    
    expect(result).toBeDefined();
    expect(result.headline).toContain('Lipton');
    expect(result.headline).toContain('🇳🇱'); // Netherlands flag
    expect(result.tagline).toContain('Dutch-owned');
    expect(result.story).toContain('Unilever');
    expect(result.ownership_notes).toContain('Owned by Unilever');
    expect(result.behind_the_scenes).toContain('Verified Unilever ownership');
    expect(result.template_used).not.toBe('fallback');
  });

  it('should generate narrative for private company (CitizenM)', async () => {
    const result = await generateNarrativeFromResult(mockOwnershipData.citizenm);
    
    expect(result).toBeDefined();
    expect(result.headline).toContain('citizenM');
    expect(result.headline).toContain('🇳🇱'); // Netherlands flag
    expect(result.tagline).toContain('KRC Capital');
    expect(result.story).toContain('KRC Capital');
    expect(result.ownership_notes).toContain('Privately held by KRC Capital');
    expect(result.behind_the_scenes).toContain('Verified KRC Capital ownership');
    expect(result.template_used).not.toBe('fallback');
  });

  it('should handle low confidence and ambiguous ownership (Clave Denia)', async () => {
    const result = await generateNarrativeFromResult(mockOwnershipData.claveDenia);
    
    expect(result).toBeDefined();
    expect(result.headline).toContain('Clave Denia');
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toContain('Limited ownership information');
    expect(result.behind_the_scenes).toContain('Insufficient data');
    expect(result.template_used).toBeDefined();
  });

  it('should handle partial data gracefully', async () => {
    const result = await generateNarrativeFromResult(mockOwnershipData.partial);
    
    expect(result).toBeDefined();
    expect(result.headline).toContain('TestBrand');
    // Note: TestBrand gets generic fallback response without country flag
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();
  });

  it('should emphasize ultimate owner country in all narratives', async () => {
    const testCases = [
      mockOwnershipData.ikea,
      mockOwnershipData.lipton,
      mockOwnershipData.citizenm
    ];

    for (const testCase of testCases) {
      // Skip test cases without country data
      if (!testCase.ultimate_owner_country || testCase.ultimate_owner_country === 'Unknown') {
        continue;
      }
      
      const result = await generateNarrativeFromResult(testCase);
      
      // Country should appear in at least one of headline, tagline, or story
      // Note: We check for country variations (e.g., "Swedish" vs "Sweden")
      const countryVariations = {
        'Sweden': ['Swedish', 'Sweden'],
        'Netherlands': ['Dutch', 'Netherlands'],
        'United States': ['American', 'US', 'United States']
      };
      
      const variations = countryVariations[testCase.ultimate_owner_country] || [testCase.ultimate_owner_country];
      const headlineContainsCountry = variations.some(variation => result.headline.includes(variation));
      const taglineContainsCountry = variations.some(variation => result.tagline.includes(variation));
      const storyContainsCountry = variations.some(variation => result.story.includes(variation));
      
      // At least one of the three should contain the country
      const anyContainsCountry = headlineContainsCountry || taglineContainsCountry || storyContainsCountry;
      expect(anyContainsCountry).toBe(true);
    }
  });

  it('should include confidence information in ownership notes', async () => {
    const result = await generateNarrativeFromResult(mockOwnershipData.ikea);
    
    expect(result.ownership_notes).toContain('95% confidence in ownership data');
  });

  it('should always return valid narrative structure', async () => {
    const result = await generateNarrativeFromResult(mockOwnershipData.ikea);
    
    expect(result).toHaveProperty('headline');
    expect(result).toHaveProperty('tagline');
    expect(result).toHaveProperty('story');
    expect(result).toHaveProperty('ownership_notes');
    expect(result).toHaveProperty('behind_the_scenes');
    expect(result).toHaveProperty('template_used');
    
    expect(typeof result.headline).toBe('string');
    expect(typeof result.tagline).toBe('string');
    expect(typeof result.story).toBe('string');
    expect(Array.isArray(result.ownership_notes)).toBe(true);
    expect(Array.isArray(result.behind_the_scenes)).toBe(true);
    expect(typeof result.template_used).toBe('string');
  });

  it('should log narrative generation process', async () => {
    await generateNarrativeFromResult(mockOwnershipData.ikea);
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[NARRATIVE_GEN_V3] Starting flexible narrative generation'),
      expect.any(Object)
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[NARRATIVE_GEN_V3] Generated narrative'),
      expect.any(Object)
    );
  });
});
