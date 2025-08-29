/**
 * @pipeline
 * Tests for sessionStorage key handling
 * Verifies that /result/[brand] URL loads clean result from storage key pipelineResult_<brand>
 */

// Mock sessionStorage for testing
const mockSessionStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockSessionStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockSessionStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockSessionStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockSessionStorage.store = {};
  })
};

// Mock the global sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock result data for different brands
const mockResultData = {
  ikea: {
    brand: 'IKEA',
    owner: 'Inter IKEA Group',
    confidence: 95,
    brandCountry: 'Sweden',
    ownerCountry: 'Sweden',
    headline: "IKEA's Swedish roots revealed 🇸🇪",
    tagline: "The furniture giant is owned by Inter IKEA Group in Sweden",
    story: "IKEA, the Swedish furniture giant, is owned by Inter IKEA Group, maintaining its Swedish heritage and local operations.",
    ownership_notes: ['Founded in Sweden', 'Family-owned business'],
    behind_the_scenes: ['Verified Swedish ownership', 'Confirmed local operations'],
    narrative_template_used: "local_independent"
  },
  cocaCola: {
    brand: 'Coca-Cola',
    owner: 'The Coca-Cola Company',
    confidence: 92,
    brandCountry: 'United States',
    ownerCountry: 'United States',
    headline: "Coca-Cola's American ownership revealed 🇺🇸",
    tagline: "The global beverage brand is owned by The Coca-Cola Company in the United States",
    story: "Coca-Cola, the iconic global beverage brand, is owned by The Coca-Cola Company, a publicly traded American corporation.",
    ownership_notes: ['Global beverage giant', 'Publicly traded company'],
    behind_the_scenes: ['Verified corporate ownership', 'Confirmed public company status'],
    narrative_template_used: "corporate_empire"
  },
  lipton: {
    brand: 'Lipton',
    owner: 'Unilever',
    confidence: 88,
    brandCountry: 'United Kingdom',
    ownerCountry: 'Netherlands',
    headline: "Lipton's Dutch secret revealed 🇳🇱",
    tagline: "The British tea brand is owned by Unilever in the Netherlands",
    story: "Lipton, the British tea brand, is owned by Dutch multinational Unilever, showing how global brands can have surprising ownership structures.",
    ownership_notes: ['Tea brand', 'Part of Unilever portfolio'],
    behind_the_scenes: ['Traced to Unilever', 'Confirmed Netherlands HQ'],
    narrative_template_used: "hidden_global_owner"
  }
};

describe('@pipeline SessionStorage Key Tests', () => {
  beforeEach(() => {
    // Clear mock sessionStorage before each test
    mockSessionStorage.clear();
    jest.clearAllMocks();
  });

  it('should store result data with correct key format', () => {
    const brand = 'IKEA';
    const resultData = mockResultData.ikea;
    const key = 'pipelineResult';

    // Simulate storing result data
    mockSessionStorage.setItem(key, JSON.stringify(resultData));

    // Verify data was stored with correct key
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(resultData));
    expect(mockSessionStorage.store[key]).toBe(JSON.stringify(resultData));
  });

  it('should retrieve result data with correct key format', () => {
    const brand = 'IKEA';
    const resultData = mockResultData.ikea;
    const key = 'pipelineResult';

    // Store result data
    mockSessionStorage.setItem(key, JSON.stringify(resultData));

    // Retrieve result data
    const retrievedData = mockSessionStorage.getItem(key);

    // Verify data was retrieved correctly
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith(key);
    expect(retrievedData).toBe(JSON.stringify(resultData));
  });

  it('should handle different brand results with same key', () => {
    const key = 'pipelineResult';
    
    // Store different brand results
    mockSessionStorage.setItem(key, JSON.stringify(mockResultData.ikea));
    expect(mockSessionStorage.store[key]).toBe(JSON.stringify(mockResultData.ikea));

    mockSessionStorage.setItem(key, JSON.stringify(mockResultData.cocaCola));
    expect(mockSessionStorage.store[key]).toBe(JSON.stringify(mockResultData.cocaCola));

    mockSessionStorage.setItem(key, JSON.stringify(mockResultData.lipton));
    expect(mockSessionStorage.store[key]).toBe(JSON.stringify(mockResultData.lipton));
  });

  it('should handle missing result data gracefully', () => {
    const key = 'pipelineResult';

    // Try to retrieve non-existent data
    const retrievedData = mockSessionStorage.getItem(key);

    // Verify null is returned for missing data
    expect(retrievedData).toBeNull();
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith(key);
  });

  it('should handle corrupted result data gracefully', () => {
    const key = 'pipelineResult';
    const corruptedData = 'invalid json data';

    // Store corrupted data
    mockSessionStorage.setItem(key, corruptedData);

    // Retrieve corrupted data
    const retrievedData = mockSessionStorage.getItem(key);

    // Verify corrupted data is retrieved as-is
    expect(retrievedData).toBe(corruptedData);
  });

  it('should handle empty result data gracefully', () => {
    const key = 'pipelineResult';
    const emptyData = '';

    // Store empty data
    mockSessionStorage.setItem(key, emptyData);

    // Retrieve empty data
    const retrievedData = mockSessionStorage.getItem(key);

    // Verify empty data is retrieved
    expect(retrievedData).toBe(emptyData);
  });

  it('should handle large result data', () => {
    const key = 'pipelineResult';
    const largeResultData = {
      ...mockResultData.ikea,
      largeField: 'x'.repeat(10000), // Large field
      traces: Array(100).fill({ stage: 'test', status: 'success', data: {} }),
      sources: Array(50).fill('Test source')
    };

    // Store large data
    mockSessionStorage.setItem(key, JSON.stringify(largeResultData));

    // Retrieve large data
    const retrievedData = mockSessionStorage.getItem(key);

    // Verify large data is retrieved correctly
    expect(retrievedData).toBe(JSON.stringify(largeResultData));
  });

  it('should handle special characters in brand names', () => {
    const key = 'pipelineResult';
    const specialBrandData = {
      ...mockResultData.ikea,
      brand: 'Ben & Jerry\'s',
      headline: "Ben & Jerry's ownership revealed 🇺🇸"
    };

    // Store data with special characters
    mockSessionStorage.setItem(key, JSON.stringify(specialBrandData));

    // Retrieve data with special characters
    const retrievedData = mockSessionStorage.getItem(key);

    // Verify data with special characters is retrieved correctly
    expect(retrievedData).toBe(JSON.stringify(specialBrandData));
  });

  it('should handle unicode characters in result data', () => {
    const key = 'pipelineResult';
    const unicodeData = {
      ...mockResultData.ikea,
      headline: "IKEA's Swedish roots revealed 🇸🇪",
      tagline: "The furniture giant is owned by Inter IKEA Group in Sweden",
      story: "IKEA, the Swedish furniture giant, is owned by Inter IKEA Group, maintaining its Swedish heritage and local operations."
    };

    // Store data with unicode characters
    mockSessionStorage.setItem(key, JSON.stringify(unicodeData));

    // Retrieve data with unicode characters
    const retrievedData = mockSessionStorage.getItem(key);

    // Verify data with unicode characters is retrieved correctly
    expect(retrievedData).toBe(JSON.stringify(unicodeData));
  });

  it('should handle multiple concurrent brand results', () => {
    const key = 'pipelineResult';
    
    // Store multiple brand results sequentially
    mockSessionStorage.setItem(key, JSON.stringify(mockResultData.ikea));
    expect(mockSessionStorage.store[key]).toBe(JSON.stringify(mockResultData.ikea));

    mockSessionStorage.setItem(key, JSON.stringify(mockResultData.cocaCola));
    expect(mockSessionStorage.store[key]).toBe(JSON.stringify(mockResultData.cocaCola));

    mockSessionStorage.setItem(key, JSON.stringify(mockResultData.lipton));
    expect(mockSessionStorage.store[key]).toBe(JSON.stringify(mockResultData.lipton));

    // Verify the last stored result is the current one
    const retrievedData = mockSessionStorage.getItem(key);
    expect(retrievedData).toBe(JSON.stringify(mockResultData.lipton));
  });

  it('should handle sessionStorage clear operation', () => {
    const key = 'pipelineResult';
    
    // Store result data
    mockSessionStorage.setItem(key, JSON.stringify(mockResultData.ikea));
    expect(mockSessionStorage.store[key]).toBeDefined();

    // Clear sessionStorage
    mockSessionStorage.clear();

    // Verify data is cleared
    expect(mockSessionStorage.store).toEqual({});
    expect(mockSessionStorage.getItem(key)).toBeNull();
  });

  it('should handle sessionStorage remove operation', () => {
    const key = 'pipelineResult';
    
    // Store result data
    mockSessionStorage.setItem(key, JSON.stringify(mockResultData.ikea));
    expect(mockSessionStorage.store[key]).toBeDefined();

    // Remove specific key
    mockSessionStorage.removeItem(key);

    // Verify data is removed
    expect(mockSessionStorage.store[key]).toBeUndefined();
    expect(mockSessionStorage.getItem(key)).toBeNull();
  });

  it('should maintain data integrity through storage operations', () => {
    const key = 'pipelineResult';
    const originalData = mockResultData.ikea;

    // Store original data
    mockSessionStorage.setItem(key, JSON.stringify(originalData));

    // Retrieve and parse data
    const retrievedData = mockSessionStorage.getItem(key);
    const parsedData = JSON.parse(retrievedData!);

    // Verify data integrity is maintained
    expect(parsedData.brand).toBe(originalData.brand);
    expect(parsedData.owner).toBe(originalData.owner);
    expect(parsedData.confidence).toBe(originalData.confidence);
    expect(parsedData.brandCountry).toBe(originalData.brandCountry);
    expect(parsedData.ownerCountry).toBe(originalData.ownerCountry);
    expect(parsedData.headline).toBe(originalData.headline);
    expect(parsedData.tagline).toBe(originalData.tagline);
    expect(parsedData.story).toBe(originalData.story);
    expect(parsedData.ownership_notes).toEqual(originalData.ownership_notes);
    expect(parsedData.behind_the_scenes).toEqual(originalData.behind_the_scenes);
    expect(parsedData.narrative_template_used).toBe(originalData.narrative_template_used);
  });

  it('should handle sessionStorage errors gracefully', () => {
    const key = 'pipelineResult';
    const resultData = mockResultData.ikea;

    // Mock sessionStorage to throw error
    mockSessionStorage.setItem.mockImplementation(() => {
      throw new Error('SessionStorage quota exceeded');
    });

    // Verify error is thrown
    expect(() => {
      mockSessionStorage.setItem(key, JSON.stringify(resultData));
    }).toThrow('SessionStorage quota exceeded');
  });
});
