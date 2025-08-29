/**
 * @ui
 * Tests for fallback text handling
 * Verifies "Not enough info yet" displays when data is missing
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductResultV2 from '@/components/ProductResultV2';

// Mock result data with missing fields
const mockResultData = {
  // Missing narrative
  noNarrative: {
    brand_name: 'Test Brand',
    ultimate_owner: 'Test Owner',
    confidence: 95,
    brandCountry: 'United States',
    ownerCountry: 'United States',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  },

  // Missing brand name
  noBrandName: {
    brand_name: '',
    ultimate_owner: 'Test Owner',
    confidence: 95,
    brandCountry: 'United States',
    ownerCountry: 'United States',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  },

  // Missing owner
  noOwner: {
    brand_name: 'Test Brand',
    ultimate_owner: '',
    confidence: 95,
    brandCountry: 'United States',
    ownerCountry: 'United States',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  },

  // Missing countries
  noCountries: {
    brand_name: 'Test Brand',
    ultimate_owner: 'Test Owner',
    confidence: 95,
    brandCountry: '',
    ownerCountry: '',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  },

  // Missing confidence
  noConfidence: {
    brand_name: 'Test Brand',
    ultimate_owner: 'Test Owner',
    confidence: 0,
    brandCountry: 'United States',
    ownerCountry: 'United States',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  },

  // Completely empty
  empty: {
    brand_name: '',
    ultimate_owner: '',
    confidence: 0,
    brandCountry: '',
    ownerCountry: '',
    ownershipChain: [],
    structureType: '',
    analysisText: '',
    traces: [],
    sources: []
  }
};

// Mock narrative with missing fields
const mockNarrative = {
  headline: "Test Brand's ownership revealed 🇺🇸",
  tagline: "The test brand is owned by Test Owner in the United States",
  story: "This is a test story about the ownership structure.",
  ownership_notes: ["Test ownership note"],
  behind_the_scenes: ["Test behind the scenes step"],
  template_used: "test_template"
};

// Mock narrative with missing fields
const mockPartialNarrative = {
  headline: "Fallback",
  tagline: "Fallback",
  story: "Fallback",
  ownership_notes: [],
  behind_the_scenes: [],
  template_used: "fallback"
};

describe('@ui Fallback Text Tests', () => {
  it('should display fallback text when narrative is missing', () => {
    render(
      <ProductResultV2 
        result={mockResultData.noNarrative} 
        narrative={undefined}
      />
    );

    // Check that fallback text is displayed
    expect(screen.getByText('Fallback')).toBeInTheDocument();
    
    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should display fallback text when narrative has missing fields', () => {
    render(
      <ProductResultV2 
        result={mockResultData.noNarrative} 
        narrative={mockPartialNarrative}
      />
    );

    // Check that fallback text is displayed
    expect(screen.getByText('Fallback')).toBeInTheDocument();
    
    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should handle missing brand name gracefully', () => {
    render(
      <ProductResultV2 
        result={mockResultData.noBrandName} 
        narrative={mockNarrative}
      />
    );

    // Check that fallback brand name is displayed
    expect(screen.getByText('Unknown Brand')).toBeInTheDocument();
    
    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should handle missing owner gracefully', () => {
    render(
      <ProductResultV2 
        result={mockResultData.noOwner} 
        narrative={mockNarrative}
      />
    );

    // Check that fallback owner is displayed
    expect(screen.getByText('Unknown Owner')).toBeInTheDocument();
    
    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should handle missing countries gracefully', () => {
    render(
      <ProductResultV2 
        result={mockResultData.noCountries} 
        narrative={mockNarrative}
      />
    );

    // Check that fallback country text is displayed
    expect(screen.getByText("Brand • Not available")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Not available")).toBeInTheDocument();
    
    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should handle zero confidence gracefully', () => {
    render(
      <ProductResultV2 
        result={mockResultData.noConfidence} 
        narrative={mockNarrative}
      />
    );

    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should handle completely empty data gracefully', () => {
    render(
      <ProductResultV2 
        result={mockResultData.empty} 
        narrative={undefined}
      />
    );

    // Check that fallback text is displayed
    expect(screen.getByText('Fallback')).toBeInTheDocument();
    expect(screen.getByText('Unknown Brand')).toBeInTheDocument();
    expect(screen.getByText('Unknown Owner')).toBeInTheDocument();
    
    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should display "Not available" instead of "Unknown" for countries', () => {
    render(
      <ProductResultV2 
        result={mockResultData.noCountries} 
        narrative={mockNarrative}
      />
    );

    // Check that "Not available" is used instead of "Unknown"
    expect(screen.getByText("Brand • Not available")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Not available")).toBeInTheDocument();
    
    // Ensure "Unknown" is not displayed for countries
    expect(screen.queryByText("Brand • Unknown")).not.toBeInTheDocument();
    expect(screen.queryByText("Ultimate Owner • Unknown")).not.toBeInTheDocument();
  });

  it('should handle empty ownership notes gracefully', () => {
    const emptyNotesNarrative = {
      ...mockNarrative,
      ownership_notes: []
    };

    render(
      <ProductResultV2 
        result={mockResultData.noNarrative} 
        narrative={emptyNotesNarrative}
      />
    );

    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should handle empty behind the scenes gracefully', () => {
    const emptyBehindNarrative = {
      ...mockNarrative,
      behind_the_scenes: []
    };

    render(
      <ProductResultV2 
        result={mockResultData.noNarrative} 
        narrative={emptyBehindNarrative}
      />
    );

    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should maintain component structure with missing data', () => {
    render(
      <ProductResultV2 
        result={mockResultData.empty} 
        narrative={undefined}
      />
    );

    // Check that all main sections are still present
    expect(screen.getByText("Ownership Summary")).toBeInTheDocument();
    expect(screen.getByText("Ownership Notes")).toBeInTheDocument();
    expect(screen.getByText("Behind the Scenes")).toBeInTheDocument();
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should handle null values gracefully', () => {
    const nullResult = {
      brand_name: null,
      ultimate_owner: null,
      confidence: null,
      brandCountry: null,
      ownerCountry: null,
      ownershipChain: null,
      structureType: null,
      analysisText: null,
      traces: null,
      sources: null
    };

    render(
      <ProductResultV2 
        result={nullResult as any} 
        narrative={undefined}
      />
    );

    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should handle undefined values gracefully', () => {
    const undefinedResult = {
      brand_name: undefined,
      ultimate_owner: undefined,
      confidence: undefined,
      brandCountry: undefined,
      ownerCountry: undefined,
      ownershipChain: undefined,
      structureType: undefined,
      analysisText: undefined,
      traces: undefined,
      sources: undefined
    };

    render(
      <ProductResultV2 
        result={undefinedResult as any} 
        narrative={undefined}
      />
    );

    // Check that component still renders
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should not display placeholder text like "..." or "null"', () => {
    render(
      <ProductResultV2 
        result={mockResultData.empty} 
        narrative={undefined}
      />
    );

    // Check that placeholder text is not displayed
    expect(screen.queryByText("...")).not.toBeInTheDocument();
    expect(screen.queryByText("null")).not.toBeInTheDocument();
    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
  });

  it('should display meaningful fallback text for all missing fields', () => {
    render(
      <ProductResultV2 
        result={mockResultData.empty} 
        narrative={undefined}
      />
    );

    // Check that meaningful fallback text is displayed
    expect(screen.getByText('Fallback')).toBeInTheDocument();
    expect(screen.getByText('Unknown Brand')).toBeInTheDocument();
    expect(screen.getByText('Unknown Owner')).toBeInTheDocument();
    expect(screen.getByText("Brand • Not available")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Not available")).toBeInTheDocument();
  });
});
