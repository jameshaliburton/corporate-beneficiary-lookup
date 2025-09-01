'use client';

import { ProductResult } from "@/components/ProductResult";

export default function TestStoryPage() {
  const testData = {
    brand: "Nike",
    owner: "Nike Inc.",
    confidence: 85,
    narrative: {
      story: "The story of Nike: This iconic brand is part of the Nike family, created by the American company Nike Inc. From their headquarters in the United States, they've been building their brand presence and market share.",
      emoji: "👟",
      what_we_found: "Nike is owned by Nike Inc.",
      how_we_figured_it_out: "AI analysis of available data sources"
    },
    financial_beneficiary: "Nike Inc.",
    beneficiary_country: "United States",
    ownership_flow: [
      { name: "Nike", type: "Brand" },
      { name: "Nike Inc.", type: "Company" }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Story Feature Test</h1>
        <ProductResult {...testData} />
      </div>
    </div>
  );
}
