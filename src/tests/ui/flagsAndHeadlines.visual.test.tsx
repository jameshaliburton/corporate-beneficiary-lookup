/**
 * @ui
 * Visual tests for country flags, emojis, and headlines
 * Ensures country flags, emojis, headlines are visible and correct
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductResultV2 from '@/components/ProductResultV2';

// Mock narrative data with different country scenarios
const mockNarratives = {
  us: {
    headline: "American Brand's ownership revealed 🇺🇸",
    tagline: "The American brand is owned by US Owner in the United States",
    story: "This American brand is owned by US Owner in the United States.",
    ownership_notes: ["US-based ownership"],
    behind_the_scenes: ["Verified US ownership"],
    template_used: "us_template"
  },
  netherlands: {
    headline: "Dutch Brand's ownership revealed 🇳🇱",
    tagline: "The Dutch brand is owned by Netherlands Owner in the Netherlands",
    story: "This Dutch brand is owned by Netherlands Owner in the Netherlands.",
    ownership_notes: ["Netherlands-based ownership"],
    behind_the_scenes: ["Verified Netherlands ownership"],
    template_used: "netherlands_template"
  },
  germany: {
    headline: "German Brand's ownership revealed 🇩🇪",
    tagline: "The German brand is owned by Germany Owner in Germany",
    story: "This German brand is owned by Germany Owner in Germany.",
    ownership_notes: ["Germany-based ownership"],
    behind_the_scenes: ["Verified Germany ownership"],
    template_used: "germany_template"
  },
  canada: {
    headline: "Canadian Brand's ownership revealed 🇨🇦",
    tagline: "The Canadian brand is owned by Canada Owner in Canada",
    story: "This Canadian brand is owned by Canada Owner in Canada.",
    ownership_notes: ["Canada-based ownership"],
    behind_the_scenes: ["Verified Canada ownership"],
    template_used: "canada_template"
  },
  sweden: {
    headline: "Swedish Brand's ownership revealed 🇸🇪",
    tagline: "The Swedish brand is owned by Sweden Owner in Sweden",
    story: "This Swedish brand is owned by Sweden Owner in Sweden.",
    ownership_notes: ["Sweden-based ownership"],
    behind_the_scenes: ["Verified Sweden ownership"],
    template_used: "sweden_template"
  },
  italy: {
    headline: "Italian Brand's ownership revealed 🇮🇹",
    tagline: "The Italian brand is owned by Italy Owner in Italy",
    story: "This Italian brand is owned by Italy Owner in Italy.",
    ownership_notes: ["Italy-based ownership"],
    behind_the_scenes: ["Verified Italy ownership"],
    template_used: "italy_template"
  }
};

// Mock result data for different countries
const mockResults = {
  us: {
    brand_name: 'American Brand',
    ultimate_owner: 'US Owner',
    confidence: 95,
    brandCountry: 'United States',
    ownerCountry: 'United States',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  },
  netherlands: {
    brand_name: 'Dutch Brand',
    ultimate_owner: 'Netherlands Owner',
    confidence: 95,
    brandCountry: 'Netherlands',
    ownerCountry: 'Netherlands',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  },
  germany: {
    brand_name: 'German Brand',
    ultimate_owner: 'Germany Owner',
    confidence: 95,
    brandCountry: 'Germany',
    ownerCountry: 'Germany',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  },
  canada: {
    brand_name: 'Canadian Brand',
    ultimate_owner: 'Canada Owner',
    confidence: 95,
    brandCountry: 'Canada',
    ownerCountry: 'Canada',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  },
  sweden: {
    brand_name: 'Swedish Brand',
    ultimate_owner: 'Sweden Owner',
    confidence: 95,
    brandCountry: 'Sweden',
    ownerCountry: 'Sweden',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  },
  italy: {
    brand_name: 'Italian Brand',
    ultimate_owner: 'Italy Owner',
    confidence: 95,
    brandCountry: 'Italy',
    ownerCountry: 'Italy',
    ownershipChain: [],
    structureType: 'Private Company',
    analysisText: '',
    traces: [],
    sources: []
  }
};

describe('@ui Flags and Headlines Visual Tests', () => {
  it('should display US flag and headline correctly', () => {
    render(
      <ProductResultV2 
        result={mockResults.us} 
        narrative={mockNarratives.us}
      />
    );

    // Check US flag is displayed
    expect(screen.getByText("🇺🇸")).toBeInTheDocument();
    
    // Check headline contains US flag
    expect(screen.getByText("American Brand's ownership revealed 🇺🇸")).toBeInTheDocument();
    
    // Check country information
    expect(screen.getByText("Brand • United States")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • United States")).toBeInTheDocument();
  });

  it('should display Netherlands flag and headline correctly', () => {
    render(
      <ProductResultV2 
        result={mockResults.netherlands} 
        narrative={mockNarratives.netherlands}
      />
    );

    // Check Netherlands flag is displayed
    expect(screen.getByText("🇳🇱")).toBeInTheDocument();
    
    // Check headline contains Netherlands flag
    expect(screen.getByText("Dutch Brand's ownership revealed 🇳🇱")).toBeInTheDocument();
    
    // Check country information
    expect(screen.getByText("Brand • Netherlands")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Netherlands")).toBeInTheDocument();
  });

  it('should display Germany flag and headline correctly', () => {
    render(
      <ProductResultV2 
        result={mockResults.germany} 
        narrative={mockNarratives.germany}
      />
    );

    // Check Germany flag is displayed
    expect(screen.getByText("🇩🇪")).toBeInTheDocument();
    
    // Check headline contains Germany flag
    expect(screen.getByText("German Brand's ownership revealed 🇩🇪")).toBeInTheDocument();
    
    // Check country information
    expect(screen.getByText("Brand • Germany")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Germany")).toBeInTheDocument();
  });

  it('should display Canada flag and headline correctly', () => {
    render(
      <ProductResultV2 
        result={mockResults.canada} 
        narrative={mockNarratives.canada}
      />
    );

    // Check Canada flag is displayed
    expect(screen.getByText("🇨🇦")).toBeInTheDocument();
    
    // Check headline contains Canada flag
    expect(screen.getByText("Canadian Brand's ownership revealed 🇨🇦")).toBeInTheDocument();
    
    // Check country information
    expect(screen.getByText("Brand • Canada")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Canada")).toBeInTheDocument();
  });

  it('should display Sweden flag and headline correctly', () => {
    render(
      <ProductResultV2 
        result={mockResults.sweden} 
        narrative={mockNarratives.sweden}
      />
    );

    // Check Sweden flag is displayed
    expect(screen.getByText("🇸🇪")).toBeInTheDocument();
    
    // Check headline contains Sweden flag
    expect(screen.getByText("Swedish Brand's ownership revealed 🇸🇪")).toBeInTheDocument();
    
    // Check country information
    expect(screen.getByText("Brand • Sweden")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Sweden")).toBeInTheDocument();
  });

  it('should display Italy flag and headline correctly', () => {
    render(
      <ProductResultV2 
        result={mockResults.italy} 
        narrative={mockNarratives.italy}
      />
    );

    // Check Italy flag is displayed
    expect(screen.getByText("🇮🇹")).toBeInTheDocument();
    
    // Check headline contains Italy flag
    expect(screen.getByText("Italian Brand's ownership revealed 🇮🇹")).toBeInTheDocument();
    
    // Check country information
    expect(screen.getByText("Brand • Italy")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Italy")).toBeInTheDocument();
  });

  it('should handle country divergence correctly', () => {
    const divergentResult = {
      ...mockResults.us,
      brandCountry: 'United States',
      ownerCountry: 'Netherlands'
    };

    const divergentNarrative = {
      headline: "American Brand's Dutch secret revealed 🇳🇱",
      tagline: "The American brand is owned by Netherlands Owner in the Netherlands",
      story: "This American brand is owned by Netherlands Owner in the Netherlands.",
      ownership_notes: ["Netherlands-based ownership"],
      behind_the_scenes: ["Verified Netherlands ownership"],
      template_used: "divergent_template"
    };

    render(
      <ProductResultV2 
        result={divergentResult} 
        narrative={divergentNarrative}
      />
    );

    // Check that both country flags are displayed
    expect(screen.getByText("🇺🇸")).toBeInTheDocument(); // Brand country
    expect(screen.getByText("🇳🇱")).toBeInTheDocument(); // Owner country
    
    // Check headline emphasizes owner country
    expect(screen.getByText("American Brand's Dutch secret revealed 🇳🇱")).toBeInTheDocument();
    
    // Check country information shows both countries
    expect(screen.getByText("Brand • United States")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Netherlands")).toBeInTheDocument();
  });

  it('should display flags in ownership summary cards', () => {
    render(
      <ProductResultV2 
        result={mockResults.netherlands} 
        narrative={mockNarratives.netherlands}
      />
    );

    // Check that flags appear in the ownership summary cards
    const flagElements = screen.getAllByText("🇳🇱");
    expect(flagElements.length).toBeGreaterThan(1); // Should appear multiple times
  });

  it('should display flags in revenue flow section', () => {
    render(
      <ProductResultV2 
        result={mockResults.netherlands} 
        narrative={mockNarratives.netherlands}
      />
    );

    // Check that flag appears in revenue flow
    expect(screen.getByText("in 🇳🇱 Netherlands")).toBeInTheDocument();
  });

  it('should handle unknown countries gracefully', () => {
    const unknownResult = {
      ...mockResults.us,
      brandCountry: 'Unknown',
      ownerCountry: 'Unknown'
    };

    const unknownNarrative = {
      headline: "Unknown Brand's ownership revealed",
      tagline: "The unknown brand has unclear ownership",
      story: "This brand has unclear ownership structure.",
      ownership_notes: ["Unknown ownership"],
      behind_the_scenes: ["Insufficient data"],
      template_used: "unknown_template"
    };

    render(
      <ProductResultV2 
        result={unknownResult} 
        narrative={unknownNarrative}
      />
    );

    // Check that component still renders without flags
    expect(screen.getByText("Unknown Brand's ownership revealed")).toBeInTheDocument();
    expect(screen.getByText("Brand • Unknown")).toBeInTheDocument();
    expect(screen.getByText("Ultimate Owner • Unknown")).toBeInTheDocument();
  });

  it('should maintain flag consistency across all sections', () => {
    render(
      <ProductResultV2 
        result={mockResults.sweden} 
        narrative={mockNarratives.sweden}
      />
    );

    // Check that Sweden flag appears consistently
    const swedenFlags = screen.getAllByText("🇸🇪");
    expect(swedenFlags.length).toBeGreaterThan(2); // Should appear in multiple places
    
    // Check that all flag instances are the same
    swedenFlags.forEach(flag => {
      expect(flag.textContent).toBe("🇸🇪");
    });
  });

  it('should display engaging headlines with proper formatting', () => {
    const testCases = [
      { country: 'us', flag: '🇺🇸' },
      { country: 'netherlands', flag: '🇳🇱' },
      { country: 'germany', flag: '🇩🇪' },
      { country: 'canada', flag: '🇨🇦' },
      { country: 'sweden', flag: '🇸🇪' },
      { country: 'italy', flag: '🇮🇹' }
    ];

    testCases.forEach(({ country, flag }) => {
      const { unmount } = render(
        <ProductResultV2 
          result={mockResults[country as keyof typeof mockResults]} 
          narrative={mockNarratives[country as keyof typeof mockNarratives]}
        />
      );

      // Check that headline is engaging and contains flag
      const headline = screen.getByText(new RegExp(`.*${flag}.*`));
      expect(headline).toBeInTheDocument();
      expect(headline.textContent).toContain(flag);
      expect(headline.textContent?.length).toBeGreaterThan(20); // Should be substantial

      unmount();
    });
  });
});
