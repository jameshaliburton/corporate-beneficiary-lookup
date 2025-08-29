/**
 * @pipeline
 * Tests for vision input with OCR brand and no metadata
 * Simulates image scan with OCR brand and no metadata
 */

import { transformPipelineData } from '@/lib/utils/pipeline-transformer';

// Mock pipeline result data for vision input scenarios
const mockVisionResults = {
  // Full vision input with OCR-extracted brand
  fullVision: {
    brand: 'Coca-Cola',
    financial_beneficiary: 'The Coca-Cola Company',
    confidence_score: 92,
    ownership_structure_type: 'Public Company',
    reasoning: 'Vision analysis identified Coca-Cola brand from product packaging',
    brand_country: 'United States',
    beneficiary_country: 'United States',
    ownership_notes: ['Global beverage giant', 'Publicly traded company'],
    behind_the_scenes: ['OCR extracted brand name', 'Verified corporate ownership'],
    headline: "Coca-Cola's American ownership revealed 🇺🇸",
    tagline: "The global beverage brand is owned by The Coca-Cola Company in the United States",
    story: "Coca-Cola, the iconic global beverage brand, is owned by The Coca-Cola Company, a publicly traded American corporation.",
    narrative_template_used: "corporate_empire",
    traces: [
      {
        stage: 'image_processing',
        status: 'success',
        data: { image_processed: true, quality: 'high' }
      },
      {
        stage: 'ocr_extraction',
        status: 'success',
        data: { brand_detected: 'Coca-Cola', confidence: 95 }
      },
      {
        stage: 'ownership_research',
        status: 'success',
        data: { owner: 'The Coca-Cola Company', country: 'United States' }
      }
    ],
    sources: ['Vision analysis', 'OCR extraction', 'Corporate database']
  },

  // Vision input with low OCR confidence
  lowConfidenceVision: {
    brand: 'Pepsi',
    financial_beneficiary: 'PepsiCo',
    confidence_score: 65,
    ownership_structure_type: 'Public Company',
    reasoning: 'Vision analysis with low confidence OCR extraction',
    brand_country: 'United States',
    beneficiary_country: 'United States',
    ownership_notes: ['Beverage company', 'Publicly traded'],
    behind_the_scenes: ['OCR extracted with low confidence', 'Verified ownership'],
    headline: "Pepsi's American ownership revealed 🇺🇸",
    tagline: "The beverage brand is owned by PepsiCo in the United States",
    story: "Pepsi is owned by PepsiCo, a publicly traded American beverage company.",
    narrative_template_used: "corporate_empire",
    traces: [
      {
        stage: 'image_processing',
        status: 'success',
        data: { image_processed: true, quality: 'medium' }
      },
      {
        stage: 'ocr_extraction',
        status: 'success',
        data: { brand_detected: 'Pepsi', confidence: 65 }
      },
      {
        stage: 'ownership_research',
        status: 'success',
        data: { owner: 'PepsiCo', country: 'United States' }
      }
    ],
    sources: ['Vision analysis', 'OCR extraction', 'Corporate database']
  },

  // Vision input with ambiguous brand detection
  ambiguousVision: {
    brand: 'Unknown Brand',
    financial_beneficiary: 'Unknown',
    confidence_score: 30,
    ownership_structure_type: 'Unknown',
    reasoning: 'Vision analysis could not clearly identify brand',
    brand_country: 'Unknown',
    beneficiary_country: 'Unknown',
    ownership_notes: ['Limited brand information'],
    behind_the_scenes: ['OCR extraction failed', 'Insufficient image quality'],
    headline: "Unknown Brand's ownership revealed",
    tagline: "The brand has unclear ownership",
    story: "This brand has unclear ownership structure due to limited information.",
    narrative_template_used: "fallback",
    traces: [
      {
        stage: 'image_processing',
        status: 'success',
        data: { image_processed: true, quality: 'low' }
      },
      {
        stage: 'ocr_extraction',
        status: 'failed',
        data: { brand_detected: null, confidence: 0 }
      },
      {
        stage: 'ownership_research',
        status: 'failed',
        data: { owner: null, country: null }
      }
    ],
    sources: ['Vision analysis']
  },

  // Vision input with country divergence
  divergentVision: {
    brand: 'Lipton',
    financial_beneficiary: 'Unilever',
    confidence_score: 88,
    ownership_structure_type: 'Public Company',
    reasoning: 'Vision analysis identified Lipton brand from tea packaging',
    brand_country: 'United Kingdom',
    beneficiary_country: 'Netherlands',
    ownership_notes: ['Tea brand', 'Part of Unilever portfolio'],
    behind_the_scenes: ['OCR extracted Lipton brand', 'Traced to Unilever ownership'],
    headline: "Lipton's Dutch secret revealed 🇳🇱",
    tagline: "The British tea brand is owned by Unilever in the Netherlands",
    story: "Lipton, the British tea brand, is owned by Dutch multinational Unilever, showing how global brands can have surprising ownership structures.",
    narrative_template_used: "hidden_global_owner",
    traces: [
      {
        stage: 'image_processing',
        status: 'success',
        data: { image_processed: true, quality: 'high' }
      },
      {
        stage: 'ocr_extraction',
        status: 'success',
        data: { brand_detected: 'Lipton', confidence: 90 }
      },
      {
        stage: 'ownership_research',
        status: 'success',
        data: { owner: 'Unilever', country: 'Netherlands' }
      }
    ],
    sources: ['Vision analysis', 'OCR extraction', 'Corporate database']
  }
};

describe('@pipeline Vision Input Tests', () => {
  it('should handle full vision input with OCR-extracted brand', () => {
    const result = transformPipelineData(mockVisionResults.fullVision);

    // Check that all data is properly transformed
    expect(result.brand).toBe('Coca-Cola');
    expect(result.owner).toBe('The Coca-Cola Company');
    expect(result.confidence).toBe(92);
    expect(result.structureType).toBe('Public Company');
    expect(result.analysisText).toBe('Vision analysis identified Coca-Cola brand from product packaging');
    expect(result.brandCountry).toBe('United States');
    expect(result.ownerCountry).toBe('United States');

    // Check narrative fields are preserved
    expect(result.headline).toBe("Coca-Cola's American ownership revealed 🇺🇸");
    expect(result.tagline).toBe("The global beverage brand is owned by The Coca-Cola Company in the United States");
    expect(result.story).toBe("Coca-Cola, the iconic global beverage brand, is owned by The Coca-Cola Company, a publicly traded American corporation.");
    expect(result.ownership_notes).toEqual(['Global beverage giant', 'Publicly traded company']);
    expect(result.behind_the_scenes).toEqual(['OCR extracted brand name', 'Verified corporate ownership']);
    expect(result.narrative_template_used).toBe("corporate_empire");

    // Check traces include vision stages
    expect(result.traces).toHaveLength(3);
    expect(result.traces[0].stage).toBe('image_processing');
    expect(result.traces[1].stage).toBe('ocr_extraction');
    expect(result.traces[2].stage).toBe('ownership_research');

    // Check sources include vision analysis
    expect(result.sources).toEqual(['Vision analysis', 'OCR extraction', 'Corporate database']);
  });

  it('should handle vision input with low OCR confidence', () => {
    const result = transformPipelineData(mockVisionResults.lowConfidenceVision);

    // Check that low confidence is preserved
    expect(result.brand).toBe('Pepsi');
    expect(result.owner).toBe('PepsiCo');
    expect(result.confidence).toBe(65);
    expect(result.structureType).toBe('Public Company');

    // Check narrative fields are preserved
    expect(result.headline).toBe("Pepsi's American ownership revealed 🇺🇸");
    expect(result.tagline).toBe("The beverage brand is owned by PepsiCo in the United States");
    expect(result.story).toBe("Pepsi is owned by PepsiCo, a publicly traded American beverage company.");
    expect(result.narrative_template_used).toBe("corporate_empire");

    // Check traces include vision stages
    expect(result.traces).toHaveLength(3);
    expect(result.traces[0].stage).toBe('image_processing');
    expect(result.traces[1].stage).toBe('ocr_extraction');
    expect(result.traces[2].stage).toBe('ownership_research');

    // Check sources include vision analysis
    expect(result.sources).toEqual(['Vision analysis', 'OCR extraction', 'Corporate database']);
  });

  it('should handle vision input with ambiguous brand detection', () => {
    const result = transformPipelineData(mockVisionResults.ambiguousVision);

    // Check that ambiguous data is preserved
    expect(result.brand).toBe('Unknown Brand');
    expect(result.owner).toBe('Unknown');
    expect(result.confidence).toBe(30);
    expect(result.structureType).toBe('Unknown');
    expect(result.brandCountry).toBe('Unknown');
    expect(result.ownerCountry).toBe('Unknown');

    // Check narrative fields are preserved
    expect(result.headline).toBe("Unknown Brand's ownership revealed");
    expect(result.tagline).toBe("The brand has unclear ownership");
    expect(result.story).toBe("This brand has unclear ownership structure due to limited information.");
    expect(result.narrative_template_used).toBe("fallback");

    // Check traces include failed stages
    expect(result.traces).toHaveLength(3);
    expect(result.traces[0].stage).toBe('image_processing');
    expect(result.traces[1].stage).toBe('ocr_extraction');
    expect(result.traces[2].stage).toBe('ownership_research');

    // Check sources include vision analysis
    expect(result.sources).toEqual(['Vision analysis']);
  });

  it('should handle vision input with country divergence', () => {
    const result = transformPipelineData(mockVisionResults.divergentVision);

    // Check that country divergence is properly handled
    expect(result.brand).toBe('Lipton');
    expect(result.owner).toBe('Unilever');
    expect(result.confidence).toBe(88);
    expect(result.structureType).toBe('Public Company');
    expect(result.brandCountry).toBe('United Kingdom');
    expect(result.ownerCountry).toBe('Netherlands');

    // Check narrative fields emphasize owner country
    expect(result.headline).toBe("Lipton's Dutch secret revealed 🇳🇱");
    expect(result.tagline).toBe("The British tea brand is owned by Unilever in the Netherlands");
    expect(result.story).toContain('Netherlands');
    expect(result.story).toContain('Unilever');
    expect(result.narrative_template_used).toBe("hidden_global_owner");

    // Check ownership notes and behind the scenes
    expect(result.ownership_notes).toEqual(['Tea brand', 'Part of Unilever portfolio']);
    expect(result.behind_the_scenes).toEqual(['OCR extracted Lipton brand', 'Traced to Unilever ownership']);

    // Check traces include vision stages
    expect(result.traces).toHaveLength(3);
    expect(result.traces[0].stage).toBe('image_processing');
    expect(result.traces[1].stage).toBe('ocr_extraction');
    expect(result.traces[2].stage).toBe('ownership_research');

    // Check sources include vision analysis
    expect(result.sources).toEqual(['Vision analysis', 'OCR extraction', 'Corporate database']);
  });

  it('should preserve vision-specific trace data', () => {
    const result = transformPipelineData(mockVisionResults.fullVision);

    // Check that vision-specific trace data is preserved
    const imageProcessingTrace = result.traces.find(t => t.stage === 'image_processing');
    const ocrTrace = result.traces.find(t => t.stage === 'ocr_extraction');

    expect(imageProcessingTrace).toBeDefined();
    expect(imageProcessingTrace?.data).toEqual({ image_processed: true, quality: 'high' });

    expect(ocrTrace).toBeDefined();
    expect(ocrTrace?.data).toEqual({ brand_detected: 'Coca-Cola', confidence: 95 });
  });

  it('should handle vision input with no metadata gracefully', () => {
    const noMetadataResult = {
      ...mockVisionResults.fullVision,
      ownership_notes: [],
      behind_the_scenes: [],
      sources: ['Vision analysis']
    };

    const result = transformPipelineData(noMetadataResult);

    // Check that component still works with minimal data
    expect(result.brand).toBe('Coca-Cola');
    expect(result.owner).toBe('The Coca-Cola Company');
    expect(result.ownership_notes).toEqual([]);
    expect(result.behind_the_scenes).toEqual([]);
    expect(result.sources).toEqual(['Vision analysis']);
  });

  it('should maintain data integrity through vision transformation', () => {
    const result = transformPipelineData(mockVisionResults.fullVision);

    // Check that all original data is preserved
    expect(result.brand).toBe(mockVisionResults.fullVision.brand);
    expect(result.owner).toBe(mockVisionResults.fullVision.financial_beneficiary);
    expect(result.confidence).toBe(mockVisionResults.fullVision.confidence_score);
    expect(result.structureType).toBe(mockVisionResults.fullVision.ownership_structure_type);
    expect(result.analysisText).toBe(mockVisionResults.fullVision.reasoning);
    expect(result.brandCountry).toBe(mockVisionResults.fullVision.brand_country);
    expect(result.ownerCountry).toBe(mockVisionResults.fullVision.beneficiary_country);

    // Check that narrative fields are preserved exactly
    expect(result.headline).toBe(mockVisionResults.fullVision.headline);
    expect(result.tagline).toBe(mockVisionResults.fullVision.tagline);
    expect(result.story).toBe(mockVisionResults.fullVision.story);
    expect(result.ownership_notes).toEqual(mockVisionResults.fullVision.ownership_notes);
    expect(result.behind_the_scenes).toEqual(mockVisionResults.fullVision.behind_the_scenes);
    expect(result.narrative_template_used).toBe(mockVisionResults.fullVision.narrative_template_used);
  });

  it('should handle vision input with complex ownership structure', () => {
    const complexVisionResult = {
      ...mockVisionResults.fullVision,
      ownership_structure_type: 'Complex Corporate Structure',
      reasoning: 'Vision analysis with complex ownership structure',
      ownership_notes: ['Multiple subsidiaries', 'Complex corporate structure', 'International operations'],
      behind_the_scenes: ['OCR extracted brand', 'Analyzed corporate structure', 'Traced ownership chain']
    };

    const result = transformPipelineData(complexVisionResult);

    // Check that complex structure is preserved
    expect(result.structureType).toBe('Complex Corporate Structure');
    expect(result.analysisText).toBe('Vision analysis with complex ownership structure');
    expect(result.ownership_notes).toEqual(['Multiple subsidiaries', 'Complex corporate structure', 'International operations']);
    expect(result.behind_the_scenes).toEqual(['OCR extracted brand', 'Analyzed corporate structure', 'Traced ownership chain']);
  });
});
