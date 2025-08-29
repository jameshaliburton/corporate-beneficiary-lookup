/**
 * @ui
 * Tests for ProductResultV2 component rendering
 * Asserts proper field render based on full/partial result object
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductResultV2 from '@/components/ProductResultV2';

// Mock narrative data
const mockNarrative = {
  headline: "Test Brand's ownership revealed 🇺🇸",
  tagline: "The test brand is owned by Test Owner in the United States",
  story: "This is a test story about the ownership structure of Test Brand, showing how it connects to Test Owner in the United States.",
  ownership_notes: [
    "Test ownership note 1",
    "Test ownership note 2",
    "95% confidence in ownership data"
  ],
  behind_the_scenes: [
    "Test behind the scenes step 1",
    "Test behind the scenes step 2",
    "Test behind the scenes step 3"
  ],
  template_used: "test_template"
};

// Mock result data for different scenarios
const mockResultData = {
  // Full data scenario
  full: {
    brand_name: 'Test Brand',
    ultimate_owner: 'Test Owner',
    confidence: 95,
    brandCountry: 'United States',
    ownerCountry: 'United States',
    ownershipChain: [
      { name: 'Test Brand', country: 'United States', type: 'Brand' },
      { name: 'Test Owner', country: 'United States', type: 'Ultimate Owner' }
    ],
    structureType: 'Private Company',
    analysisText: 'Test analysis text',
    traces: [],
    sources: ['Test Source 1', 'Test Source 2']
  },

  // Partial data scenario
  partial: {
    brand_name: 'Partial Brand',
    ultimate_owner: 'Partial Owner',
    confidence: 60,
    brandCountry: 'Canada',
    ownerCountry: 'Canada',
    ownershipChain: [],
    structureType: 'Unknown',
    analysisText: '',
    traces: [],
    sources: []
  },

  // Missing data scenario
  minimal: {
    brand_name: 'Minimal Brand',
    ultimate_owner: 'Minimal Owner',
    confidence: 30,
    brandCountry: 'Unknown',
    ownerCountry: 'Unknown',
    ownershipChain: [],
    structureType: 'Unknown',
    analysisText: '',
    traces: [],
    sources: []
  }
};

describe('@ui ProductResultV2 Component Rendering', () => {
  it('should render full data scenario correctly', () => {
    render(
      <ProductResultV2 
        result={mockResultData.full} 
        narrative={mockNarrative}
      />
    );

    // Check brand name is displayed
    expect(screen.getByText('Test Brand')).toBeInTheDocument();

    // Check narrative content is displayed
    expect(screen.getByText("Test Brand's ownership revealed 🇺🇸")).toBeInTheDocument();
    expect(screen.getByText("The test brand is owned by Test Owner in the United States")).toBeInTheDocument();
    expect(screen.getByText("This is a test story about the ownership structure of Test Brand, showing how it connects to Test Owner in the United States.")).toBeInTheDocument();

    // Check ownership notes are displayed
    expect(screen.getByText("Test ownership note 1")).toBeInTheDocument();
    expect(screen.getByText("Test ownership note 2")).toBeInTheDocument();
    expect(screen.getByText("95% confidence in ownership data")).toBeInTheDocument();

    // Check behind the scenes section
    expect(screen.getByText("Behind the Scenes (3)")).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should render partial data scenario with fallbacks', () => {
    render(
      <ProductResultV2 
        result={mockResultData.partial} 
        narrative={mockNarrative}
      />
    );

    // Check brand name is displayed
    expect(screen.getByText('Partial Brand')).toBeInTheDocument();

    // Check narrative content is still displayed
    expect(screen.getByText("Test Brand's ownership revealed 🇺🇸")).toBeInTheDocument();

    // Check that partial data doesn't break rendering
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should render minimal data scenario gracefully', () => {
    render(
      <ProductResultV2 
        result={mockResultData.minimal} 
        narrative={mockNarrative}
      />
    );

    // Check brand name is displayed
    expect(screen.getByText('Minimal Brand')).toBeInTheDocument();

    // Check narrative content is still displayed
    expect(screen.getByText("Test Brand's ownership revealed 🇺🇸")).toBeInTheDocument();

    // Check that minimal data doesn't break rendering
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should handle missing narrative gracefully', () => {
    render(
      <ProductResultV2 
        result={mockResultData.full} 
        narrative={undefined}
      />
    );

    // Check brand name is still displayed
    expect(screen.getByText('Test Brand')).toBeInTheDocument();

    // Check fallback text is displayed
    expect(screen.getByText('Fallback')).toBeInTheDocument();

    // Check that missing narrative doesn't break rendering
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
    expect(screen.getByText("Share This Result")).toBeInTheDocument();
  });

  it('should display ownership summary correctly', () => {
    render(
      <ProductResultV2 
        result={mockResultData.full} 
        narrative={mockNarrative}
      />
    );

    // Check ownership summary section
    expect(screen.getByText("Ownership Summary")).toBeInTheDocument();

    // Check brand card
    expect(screen.getByText("Test Brand")).toBeInTheDocument();
    expect(screen.getByText("Brand • United States")).toBeInTheDocument();

    // Check ultimate owner card
    expect(screen.getByText("Test Owner")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • United States")).toBeInTheDocument();

    // Check revenue flow
    expect(screen.getByText("Revenue from Test Brand ultimately flows to Test Owner")).toBeInTheDocument();
    expect(screen.getByText("in 🇺🇸 United States")).toBeInTheDocument();
  });

  it('should display country flags correctly', () => {
    render(
      <ProductResultV2 
        result={mockResultData.full} 
        narrative={mockNarrative}
      />
    );

    // Check that country flags are displayed
    expect(screen.getByText("🇺🇸")).toBeInTheDocument();
  });

  it('should handle different country scenarios', () => {
    const differentCountryData = {
      ...mockResultData.full,
      brandCountry: 'Germany',
      ownerCountry: 'Netherlands'
    };

    render(
      <ProductResultV2 
        result={differentCountryData} 
        narrative={mockNarrative}
      />
    );

    // Check that different countries are displayed
    expect(screen.getByText("Brand • Germany")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Netherlands")).toBeInTheDocument();
  });

  it('should display debug info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ProductResultV2 
        result={mockResultData.full} 
        narrative={mockNarrative}
      />
    );

    // Check debug info is displayed
    expect(screen.getByText("Debug Info")).toBeInTheDocument();
    expect(screen.getByText("Template Used: test_template")).toBeInTheDocument();
    expect(screen.getByText("Confidence: 95%")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not display debug info in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ProductResultV2 
        result={mockResultData.full} 
        narrative={mockNarrative}
      />
    );

    // Check debug info is not displayed
    expect(screen.queryByText("Debug Info")).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle empty ownership notes gracefully', () => {
    const emptyNotesNarrative = {
      ...mockNarrative,
      ownership_notes: []
    };

    render(
      <ProductResultV2 
        result={mockResultData.full} 
        narrative={emptyNotesNarrative}
      />
    );

    // Check that component still renders
    expect(screen.getByRole('heading', { name: 'Test Brand' })).toBeInTheDocument();
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
  });

  it('should handle empty behind the scenes gracefully', () => {
    const emptyBehindNarrative = {
      ...mockNarrative,
      behind_the_scenes: []
    };

    render(
      <ProductResultV2 
        result={mockResultData.full} 
        narrative={emptyBehindNarrative}
      />
    );

    // Check that component still renders
    expect(screen.getByRole('heading', { name: 'Test Brand' })).toBeInTheDocument();
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument();
  });

  it('should maintain proper component structure', () => {
    render(
      <ProductResultV2 
        result={mockResultData.full} 
        narrative={mockNarrative}
      />
    );

    // Check that all main sections are present
    expect(screen.getByRole('heading', { name: 'Test Brand' })).toBeInTheDocument(); // Header
    expect(screen.getByText("Ownership Summary")).toBeInTheDocument(); // Ownership section
    expect(screen.getByText("Ownership Notes")).toBeInTheDocument(); // Notes section
    expect(screen.getByText("Behind the Scenes (3)")).toBeInTheDocument(); // Behind scenes section
    expect(screen.getByText("Scan Another Product")).toBeInTheDocument(); // Action buttons
  });
});
