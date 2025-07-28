'use client';

import { ProductResult } from '@/components/ProductResult';
import { AppHeader } from '@/components/AppHeader';

const sampleData = {
  brand: "L'Oréal Paris",
  owner: "L'Oréal Group",
  confidence: 95,
  productImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23FF6B6B'/%3E%3Ctext x='64' y='64' font-family='Arial' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3EL'Oreal%3C/text%3E%3C/svg%3E",
  ownershipChain: [
    {
      name: "L'Oréal Paris",
      country: "France",
      countryFlag: "🇫🇷",
      avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Crect width='44' height='44' fill='%23FF6B6B'/%3E%3Ctext x='22' y='22' font-family='Arial' font-size='10' fill='white' text-anchor='middle' dy='.3em'%3EL'Oreal%3C/text%3E%3C/svg%3E"
    },
    {
      name: "L'Oréal Group",
      country: "France",
      countryFlag: "🇫🇷",
      avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Crect width='44' height='44' fill='%234ECDC4'/%3E%3Ctext x='22' y='22' font-family='Arial' font-size='10' fill='white' text-anchor='middle' dy='.3em'%3EGroup%3C/text%3E%3C/svg%3E"
    }
  ],
  structureType: "Public Company",
  analysisText: "L'Oréal Paris is a subsidiary of L'Oréal Group, a French multinational beauty company. The company operates in over 150 countries and is the world's largest cosmetics company.",
  acquisitionYear: 1909,
  publicTicker: "OR.PA",
  traces: [
    {
      stage: "vision" as const,
      status: "success" as const,
      details: "Successfully identified L'Oréal Paris branding and logo",
      duration: 1200
    },
    {
      stage: "retrieval" as const,
      status: "success" as const,
      details: "Found ownership data from multiple reliable sources",
      duration: 800
    },
    {
      stage: "ownership" as const,
      status: "success" as const,
      details: "Confirmed L'Oréal Group as ultimate parent company",
      duration: 600
    }
  ]
};

export default function LovableTestPage() {
  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">Lovable Results Test</h1>
          <p className="text-body text-muted-foreground">Testing the exact Lovable components</p>
        </div>
        <ProductResult {...sampleData} />
      </div>
    </div>
  );
} 