/**
 * @fallback
 * Tests for LLM failure handling
 * Forces narrative generation to fail (mock Anthropic) and confirms fallback text
 */

import { generateNarrativeFromResult } from '@/lib/services/narrative-generator-v3';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn()
    }
  }))
}));

// Mock ownership data for testing
const mockOwnershipData = {
  valid: {
    brand_name: 'Test Brand',
    brand_country: 'United States',
    ultimate_owner: 'Test Owner',
    ultimate_owner_country: 'United States',
    financial_beneficiary: 'Test Owner',
    financial_beneficiary_country: 'United States',
    ownership_type: 'Private Company',
    confidence: 95,
    ownership_notes: ['Test ownership note'],
    behind_the_scenes: ['Test behind the scenes step']
  },
  minimal: {
    brand_name: 'Minimal Brand',
    brand_country: 'Canada',
    ultimate_owner: 'Minimal Owner',
    ultimate_owner_country: 'Canada',
    financial_beneficiary: 'Minimal Owner',
    financial_beneficiary_country: 'Canada',
    ownership_type: 'Unknown',
    confidence: 60
  }
};

describe('@fallback LLM Failure Handling Tests', () => {
  beforeEach(() => {
    // Mock console.log to capture logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle Anthropic API timeout error', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API timeout error
    mockAnthropic.messages.create.mockRejectedValue(new Error('Request timeout'));

    const result = await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle Anthropic API rate limit error', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API rate limit error
    mockAnthropic.messages.create.mockRejectedValue(new Error('Rate limit exceeded'));

    const result = await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle Anthropic API authentication error', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API authentication error
    mockAnthropic.messages.create.mockRejectedValue(new Error('Invalid API key'));

    const result = await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle Anthropic API network error', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API network error
    mockAnthropic.messages.create.mockRejectedValue(new Error('Network error'));

    const result = await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle Anthropic API invalid response error', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API invalid response error
    mockAnthropic.messages.create.mockRejectedValue(new Error('Invalid response format'));

    const result = await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle Anthropic API unexpected error', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API unexpected error
    mockAnthropic.messages.create.mockRejectedValue(new Error('Unexpected error'));

    const result = await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle Anthropic API returning invalid JSON', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API returning invalid JSON
    mockAnthropic.messages.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'This is not valid JSON'
        }
      ]
    });

    const result = await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle Anthropic API returning empty response', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API returning empty response
    mockAnthropic.messages.create.mockResolvedValue({
      content: []
    });

    const result = await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle Anthropic API returning null response', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API returning null response
    mockAnthropic.messages.create.mockResolvedValue(null);

    const result = await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle Anthropic API returning undefined response', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API returning undefined response
    mockAnthropic.messages.create.mockResolvedValue(undefined);

    const result = await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Test Brand');
    expect(result.story).toContain('Test Brand');
    expect(result.story).toContain('Test Owner');
  });

  it('should handle minimal data with LLM failure', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API failure
    mockAnthropic.messages.create.mockRejectedValue(new Error('API failure'));

    const result = await generateNarrativeFromResult(mockOwnershipData.minimal);

    // Check that fallback narrative is generated
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.tagline).toBeDefined();
    expect(result.story).toBeDefined();
    expect(result.ownership_notes).toBeDefined();
    expect(result.behind_the_scenes).toBeDefined();
    expect(result.template_used).toBeDefined();

    // Check that fallback content is meaningful
    expect(result.headline).toContain('Minimal Brand');
    expect(result.story).toContain('Minimal Brand');
    expect(result.story).toContain('Minimal Owner');
  });

  it('should log error when LLM fails', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API failure
    mockAnthropic.messages.create.mockRejectedValue(new Error('API failure'));

    await generateNarrativeFromResult(mockOwnershipData.valid);

    // Check that error is logged
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error generating narrative'),
      expect.any(Error)
    );
  });

  it('should maintain consistent fallback structure across different failures', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    const errorTypes = [
      new Error('Request timeout'),
      new Error('Rate limit exceeded'),
      new Error('Invalid API key'),
      new Error('Network error'),
      new Error('Invalid response format'),
      new Error('Unexpected error')
    ];

    for (const error of errorTypes) {
      mockAnthropic.messages.create.mockRejectedValue(error);

      const result = await generateNarrativeFromResult(mockOwnershipData.valid);

      // Check that all results have consistent structure
      expect(result).toHaveProperty('headline');
      expect(result).toHaveProperty('tagline');
      expect(result).toHaveProperty('story');
      expect(result).toHaveProperty('ownership_notes');
      expect(result).toHaveProperty('behind_the_scenes');
      expect(result).toHaveProperty('template_used');

      // Check that all results have meaningful content
      expect(result.headline).toContain('Test Brand');
      expect(result.story).toContain('Test Brand');
      expect(result.story).toContain('Test Owner');
    }
  });

  it('should handle concurrent LLM failures gracefully', async () => {
    const { Anthropic } = require('@anthropic-ai/sdk');
    const mockAnthropic = new Anthropic();
    
    // Mock API failure
    mockAnthropic.messages.create.mockRejectedValue(new Error('API failure'));

    // Run multiple concurrent requests
    const promises = Array(5).fill(null).map(() => 
      generateNarrativeFromResult(mockOwnershipData.valid)
    );

    const results = await Promise.all(promises);

    // Check that all results are generated
    results.forEach(result => {
      expect(result).toBeDefined();
      expect(result.headline).toBeDefined();
      expect(result.tagline).toBeDefined();
      expect(result.story).toBeDefined();
      expect(result.ownership_notes).toBeDefined();
      expect(result.behind_the_scenes).toBeDefined();
      expect(result.template_used).toBeDefined();
    });
  });
});
