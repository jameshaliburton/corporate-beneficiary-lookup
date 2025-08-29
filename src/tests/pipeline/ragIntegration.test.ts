/**
 * @pipeline
 * Tests for RAG integration with partial metadata
 * Simulates RAG fetch with partial metadata and asserts story text changes
 */

import { transformPipelineData } from '@/lib/utils/pipeline-transformer';

// Mock pipeline result data for RAG integration scenarios
const mockRAGResults = {
  // RAG with enhanced background information
  enhancedRAG: {
    brand: 'Nestlé',
    financial_beneficiary: 'Nestlé S.A.',
    confidence_score: 90,
    ownership_structure_type: 'Public Company',
    reasoning: 'RAG retrieval provided enhanced background information about Nestlé',
    brand_country: 'Switzerland',
    beneficiary_country: 'Switzerland',
    ownership_notes: [
      'Swiss multinational food company',
      'Founded in 1866',
      'Publicly traded on SIX Swiss Exchange'
    ],
    behind_the_scenes: [
      'RAG retrieved company history',
      'Verified Swiss headquarters',
      'Confirmed public company status'
    ],
    headline: "Nestlé's Swiss heritage revealed 🇨🇭",
    tagline: "The global food giant is owned by Nestlé S.A. in Switzerland",
    story: "Nestlé, the Swiss multinational food and beverage company founded in 1866, is owned by Nestlé S.A., a publicly traded company headquartered in Switzerland. The company's long history and global reach make it one of the world's largest food companies.",
    narrative_template_used: "corporate_empire",
    traces: [
      {
        stage: 'rag_retrieval',
        status: 'success',
        data: { 
          retrieved_documents: 5,
          relevant_info: ['company_history', 'headquarters', 'ownership_structure']
        }
      },
      {
        stage: 'ownership_research',
        status: 'success',
        data: { owner: 'Nestlé S.A.', country: 'Switzerland' }
      }
    ],
    sources: ['RAG knowledge base', 'Corporate database', 'Company filings']
  },

  // RAG with limited information
  limitedRAG: {
    brand: 'Local Brand',
    financial_beneficiary: 'Local Owner',
    confidence_score: 70,
    ownership_structure_type: 'Private Company',
    reasoning: 'RAG retrieval provided limited information about local brand',
    brand_country: 'Canada',
    beneficiary_country: 'Canada',
    ownership_notes: [
      'Local Canadian business',
      'Limited public information'
    ],
    behind_the_scenes: [
      'RAG retrieved limited information',
      'Verified local ownership'
    ],
    headline: "Local Brand's Canadian ownership revealed 🇨🇦",
    tagline: "The local brand is owned by Local Owner in Canada",
    story: "Local Brand is owned by Local Owner in Canada. Limited information is available about this local business.",
    narrative_template_used: "local_independent",
    traces: [
      {
        stage: 'rag_retrieval',
        status: 'success',
        data: { 
          retrieved_documents: 2,
          relevant_info: ['local_business', 'ownership']
        }
      },
      {
        stage: 'ownership_research',
        status: 'success',
        data: { owner: 'Local Owner', country: 'Canada' }
      }
    ],
    sources: ['RAG knowledge base', 'Local business registry']
  },

  // RAG with conflicting information
  conflictingRAG: {
    brand: 'Controversial Brand',
    financial_beneficiary: 'Controversial Owner',
    confidence_score: 60,
    ownership_structure_type: 'Complex',
    reasoning: 'RAG retrieval found conflicting information about brand ownership',
    brand_country: 'United States',
    beneficiary_country: 'United States',
    ownership_notes: [
      'Conflicting ownership information',
      'Multiple potential owners identified',
      'Requires further verification'
    ],
    behind_the_scenes: [
      'RAG retrieved conflicting documents',
      'Multiple ownership claims found',
      'Low confidence due to conflicts'
    ],
    headline: "Controversial Brand's ownership revealed 🇺🇸",
    tagline: "The controversial brand has unclear ownership in the United States",
    story: "Controversial Brand has unclear ownership structure in the United States. Multiple potential owners have been identified, requiring further verification.",
    narrative_template_used: "ambiguous_ownership",
    traces: [
      {
        stage: 'rag_retrieval',
        status: 'success',
        data: { 
          retrieved_documents: 8,
          relevant_info: ['conflicting_ownership', 'multiple_claims'],
          conflicts: true
        }
      },
      {
        stage: 'ownership_research',
        status: 'partial',
        data: { owner: 'Controversial Owner', country: 'United States', confidence: 'low' }
      }
    ],
    sources: ['RAG knowledge base', 'Multiple sources', 'Conflicting reports']
  },

  // RAG with no relevant information
  noRelevantRAG: {
    brand: 'Unknown Brand',
    financial_beneficiary: 'Unknown',
    confidence_score: 25,
    ownership_structure_type: 'Unknown',
    reasoning: 'RAG retrieval found no relevant information about brand',
    brand_country: 'Unknown',
    beneficiary_country: 'Unknown',
    ownership_notes: [
      'No relevant information found'
    ],
    behind_the_scenes: [
      'RAG retrieval returned no results',
      'Insufficient information for analysis'
    ],
    headline: "Unknown Brand's ownership revealed",
    tagline: "The unknown brand has unclear ownership",
    story: "Unknown Brand has unclear ownership structure due to insufficient information.",
    narrative_template_used: "fallback",
    traces: [
      {
        stage: 'rag_retrieval',
        status: 'failed',
        data: { 
          retrieved_documents: 0,
          relevant_info: []
        }
      },
      {
        stage: 'ownership_research',
        status: 'failed',
        data: { owner: null, country: null }
      }
    ],
    sources: ['RAG knowledge base']
  }
};

describe('@pipeline RAG Integration Tests', () => {
  it('should handle RAG with enhanced background information', () => {
    const result = transformPipelineData(mockRAGResults.enhancedRAG);

    // Check that enhanced RAG data is properly transformed
    expect(result.brand).toBe('Nestlé');
    expect(result.owner).toBe('Nestlé S.A.');
    expect(result.confidence).toBe(90);
    expect(result.structureType).toBe('Public Company');
    expect(result.analysisText).toBe('RAG retrieval provided enhanced background information about Nestlé');
    expect(result.brandCountry).toBe('Switzerland');
    expect(result.ownerCountry).toBe('Switzerland');

    // Check narrative fields include enhanced information
    expect(result.headline).toBe("Nestlé's Swiss heritage revealed 🇨🇭");
    expect(result.tagline).toBe("The global food giant is owned by Nestlé S.A. in Switzerland");
    expect(result.story).toContain('founded in 1866');
    expect(result.story).toContain('Swiss multinational');
    expect(result.story).toContain('publicly traded');
    expect(result.narrative_template_used).toBe("corporate_empire");

    // Check ownership notes include enhanced information
    expect(result.ownership_notes).toEqual([
      'Swiss multinational food company',
      'Founded in 1866',
      'Publicly traded on SIX Swiss Exchange'
    ]);

    // Check behind the scenes include RAG steps
    expect(result.behind_the_scenes).toEqual([
      'RAG retrieved company history',
      'Verified Swiss headquarters',
      'Confirmed public company status'
    ]);

    // Check traces include RAG stage
    expect(result.traces).toHaveLength(2);
    expect(result.traces[0].stage).toBe('rag_retrieval');
    expect(result.traces[1].stage).toBe('ownership_research');

    // Check sources include RAG knowledge base
    expect(result.sources).toEqual(['RAG knowledge base', 'Corporate database', 'Company filings']);
  });

  it('should handle RAG with limited information', () => {
    const result = transformPipelineData(mockRAGResults.limitedRAG);

    // Check that limited RAG data is properly transformed
    expect(result.brand).toBe('Local Brand');
    expect(result.owner).toBe('Local Owner');
    expect(result.confidence).toBe(70);
    expect(result.structureType).toBe('Private Company');
    expect(result.analysisText).toBe('RAG retrieval provided limited information about local brand');
    expect(result.brandCountry).toBe('Canada');
    expect(result.ownerCountry).toBe('Canada');

    // Check narrative fields reflect limited information
    expect(result.headline).toBe("Local Brand's Canadian ownership revealed 🇨🇦");
    expect(result.tagline).toBe("The local brand is owned by Local Owner in Canada");
    expect(result.story).toContain('Limited information is available');
    expect(result.narrative_template_used).toBe("local_independent");

    // Check ownership notes reflect limited information
    expect(result.ownership_notes).toEqual([
      'Local Canadian business',
      'Limited public information'
    ]);

    // Check behind the scenes include RAG steps
    expect(result.behind_the_scenes).toEqual([
      'RAG retrieved limited information',
      'Verified local ownership'
    ]);

    // Check traces include RAG stage
    expect(result.traces).toHaveLength(2);
    expect(result.traces[0].stage).toBe('rag_retrieval');
    expect(result.traces[1].stage).toBe('ownership_research');

    // Check sources include RAG knowledge base
    expect(result.sources).toEqual(['RAG knowledge base', 'Local business registry']);
  });

  it('should handle RAG with conflicting information', () => {
    const result = transformPipelineData(mockRAGResults.conflictingRAG);

    // Check that conflicting RAG data is properly transformed
    expect(result.brand).toBe('Controversial Brand');
    expect(result.owner).toBe('Controversial Owner');
    expect(result.confidence).toBe(60);
    expect(result.structureType).toBe('Complex');
    expect(result.analysisText).toBe('RAG retrieval found conflicting information about brand ownership');
    expect(result.brandCountry).toBe('United States');
    expect(result.ownerCountry).toBe('United States');

    // Check narrative fields reflect conflicting information
    expect(result.headline).toBe("Controversial Brand's ownership revealed 🇺🇸");
    expect(result.tagline).toBe("The controversial brand has unclear ownership in the United States");
    expect(result.story).toContain('unclear ownership structure');
    expect(result.story).toContain('Multiple potential owners');
    expect(result.narrative_template_used).toBe("ambiguous_ownership");

    // Check ownership notes reflect conflicting information
    expect(result.ownership_notes).toEqual([
      'Conflicting ownership information',
      'Multiple potential owners identified',
      'Requires further verification'
    ]);

    // Check behind the scenes include RAG steps
    expect(result.behind_the_scenes).toEqual([
      'RAG retrieved conflicting documents',
      'Multiple ownership claims found',
      'Low confidence due to conflicts'
    ]);

    // Check traces include RAG stage with conflict data
    expect(result.traces).toHaveLength(2);
    expect(result.traces[0].stage).toBe('rag_retrieval');
    expect(result.traces[1].stage).toBe('ownership_research');

    // Check sources include multiple sources
    expect(result.sources).toEqual(['RAG knowledge base', 'Multiple sources', 'Conflicting reports']);
  });

  it('should handle RAG with no relevant information', () => {
    const result = transformPipelineData(mockRAGResults.noRelevantRAG);

    // Check that no relevant RAG data is properly transformed
    expect(result.brand).toBe('Unknown Brand');
    expect(result.owner).toBe('Unknown');
    expect(result.confidence).toBe(25);
    expect(result.structureType).toBe('Unknown');
    expect(result.analysisText).toBe('RAG retrieval found no relevant information about brand');
    expect(result.brandCountry).toBe('Unknown');
    expect(result.ownerCountry).toBe('Unknown');

    // Check narrative fields reflect no information
    expect(result.headline).toBe("Unknown Brand's ownership revealed");
    expect(result.tagline).toBe("The unknown brand has unclear ownership");
    expect(result.story).toContain('unclear ownership structure');
    expect(result.story).toContain('insufficient information');
    expect(result.narrative_template_used).toBe("fallback");

    // Check ownership notes reflect no information
    expect(result.ownership_notes).toEqual([
      'No relevant information found'
    ]);

    // Check behind the scenes include RAG steps
    expect(result.behind_the_scenes).toEqual([
      'RAG retrieval returned no results',
      'Insufficient information for analysis'
    ]);

    // Check traces include failed RAG stage
    expect(result.traces).toHaveLength(2);
    expect(result.traces[0].stage).toBe('rag_retrieval');
    expect(result.traces[1].stage).toBe('ownership_research');

    // Check sources include RAG knowledge base
    expect(result.sources).toEqual(['RAG knowledge base']);
  });

  it('should preserve RAG-specific trace data', () => {
    const result = transformPipelineData(mockRAGResults.enhancedRAG);

    // Check that RAG-specific trace data is preserved
    const ragTrace = result.traces.find(t => t.stage === 'rag_retrieval');

    expect(ragTrace).toBeDefined();
    expect(ragTrace?.data).toEqual({
      retrieved_documents: 5,
      relevant_info: ['company_history', 'headquarters', 'ownership_structure']
    });
  });

  it('should handle RAG with complex ownership structure', () => {
    const complexRAGResult = {
      ...mockRAGResults.enhancedRAG,
      ownership_structure_type: 'Complex Corporate Structure',
      reasoning: 'RAG retrieval provided complex ownership structure information',
      ownership_notes: [
        'Multiple subsidiaries',
        'Complex corporate structure',
        'International operations',
        'RAG retrieved detailed structure'
      ],
      behind_the_scenes: [
        'RAG retrieved complex structure',
        'Analyzed multiple subsidiaries',
        'Traced ownership chain',
        'Verified international operations'
      ]
    };

    const result = transformPipelineData(complexRAGResult);

    // Check that complex structure is preserved
    expect(result.structureType).toBe('Complex Corporate Structure');
    expect(result.analysisText).toBe('RAG retrieval provided complex ownership structure information');
    expect(result.ownership_notes).toEqual([
      'Multiple subsidiaries',
      'Complex corporate structure',
      'International operations',
      'RAG retrieved detailed structure'
    ]);
    expect(result.behind_the_scenes).toEqual([
      'RAG retrieved complex structure',
      'Analyzed multiple subsidiaries',
      'Traced ownership chain',
      'Verified international operations'
    ]);
  });

  it('should maintain data integrity through RAG transformation', () => {
    const result = transformPipelineData(mockRAGResults.enhancedRAG);

    // Check that all original data is preserved
    expect(result.brand).toBe(mockRAGResults.enhancedRAG.brand);
    expect(result.owner).toBe(mockRAGResults.enhancedRAG.financial_beneficiary);
    expect(result.confidence).toBe(mockRAGResults.enhancedRAG.confidence_score);
    expect(result.structureType).toBe(mockRAGResults.enhancedRAG.ownership_structure_type);
    expect(result.analysisText).toBe(mockRAGResults.enhancedRAG.reasoning);
    expect(result.brandCountry).toBe(mockRAGResults.enhancedRAG.brand_country);
    expect(result.ownerCountry).toBe(mockRAGResults.enhancedRAG.beneficiary_country);

    // Check that narrative fields are preserved exactly
    expect(result.headline).toBe(mockRAGResults.enhancedRAG.headline);
    expect(result.tagline).toBe(mockRAGResults.enhancedRAG.tagline);
    expect(result.story).toBe(mockRAGResults.enhancedRAG.story);
    expect(result.ownership_notes).toEqual(mockRAGResults.enhancedRAG.ownership_notes);
    expect(result.behind_the_scenes).toEqual(mockRAGResults.enhancedRAG.behind_the_scenes);
    expect(result.narrative_template_used).toBe(mockRAGResults.enhancedRAG.narrative_template_used);
  });

  it('should handle RAG with different confidence levels', () => {
    const testCases = [
      { data: mockRAGResults.enhancedRAG, expectedConfidence: 90 },
      { data: mockRAGResults.limitedRAG, expectedConfidence: 70 },
      { data: mockRAGResults.conflictingRAG, expectedConfidence: 60 },
      { data: mockRAGResults.noRelevantRAG, expectedConfidence: 25 }
    ];

    testCases.forEach(({ data, expectedConfidence }) => {
      const result = transformPipelineData(data);
      expect(result.confidence).toBe(expectedConfidence);
    });
  });
});
