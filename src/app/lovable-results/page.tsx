'use client';

import React from 'react';
import { ProductResult } from '@/components/ProductResult';

// Sample data for testing
const sampleData = {
  brand: "L'Oréal Paris",
  owner: "L'Oréal Group",
  confidence: 95,
  productImage: "https://via.placeholder.com/128x128/FF6B6B/FFFFFF?text=L'Oreal",
  ownershipChain: [
    {
      name: "L'Oréal Paris",
      country: "France",
      countryFlag: "🇫🇷",
      avatar: "https://via.placeholder.com/44x44/FF6B6B/FFFFFF?text=L'Oreal"
    },
    {
      name: "L'Oréal Group",
      country: "France",
      countryFlag: "🇫🇷",
      avatar: "https://via.placeholder.com/44x44/4ECDC4/FFFFFF?text=Group"
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

export default function LovableResultsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 p-4">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">Lovable Results Test</h1>
          <p className="text-body text-neutral-600">Testing the exact Lovable components</p>
        </div>
        
        <ProductResult {...sampleData} />
      </div>
    </div>
  );
} 