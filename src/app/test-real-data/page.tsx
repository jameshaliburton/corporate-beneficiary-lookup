'use client';

import React from 'react';
import { ProductResult } from '@/components/ProductResult';

// Simulate real pipeline data structure
const mockPipelineResult = {
  success: true,
  product_name: "L'Oréal Paris Excellence Hair Color",
  brand: "L'Oréal",
  barcode: "3600520000000",
  financial_beneficiary: "L'Oréal Group",
  beneficiary_country: "France",
  beneficiary_flag: "🇫🇷",
  confidence_score: 85,
  confidence_level: "high",
  confidence_factors: {
    "official_sources": 90,
    "recent_data": 85,
    "cross_verification": 80
  },
  confidence_breakdown: {
    "ownership_evidence": 90,
    "source_quality": 85,
    "data_recency": 80
  },
  confidence_reasoning: "Multiple high-quality sources confirm L'Oréal Group as the ultimate parent company. Official company filings and recent financial reports provide strong evidence of ownership structure.",
  ownership_structure_type: "Public Company",
  ownership_flow: [
    {
      name: "L'Oréal Paris",
      type: "Brand",
      country: "France",
      flag: "🇫🇷",
      ultimate: false
    },
    {
      name: "L'Oréal USA",
      type: "Regional Subsidiary",
      country: "United States",
      flag: "🇺🇸",
      ultimate: false
    },
    {
      name: "L'Oréal Group",
      type: "Ultimate Owner",
      country: "France",
      flag: "🇫🇷",
      ultimate: true
    }
  ],
  sources: [
    "L'Oréal Group Annual Report 2023",
    "SEC Filings - L'Oréal USA",
    "Bloomberg Company Profile"
  ],
  reasoning: "L'Oréal Paris is a consumer brand owned by L'Oréal USA, which is a subsidiary of L'Oréal Group. The company is publicly traded on the Euronext Paris exchange and headquartered in France. The ownership structure is well-documented through official filings and financial reports.",
  agent_execution_trace: {
    sections: [
      {
        title: "Image Processing",
        stages: [
          {
            stage: "image_processing",
            status: "success",
            details: "Successfully extracted brand name 'L'Oréal' from product image",
            duration: 1200
          },
          {
            stage: "ocr_extraction",
            status: "success",
            details: "OCR identified product name and barcode information",
            duration: 800
          }
        ]
      },
      {
        title: "Data Retrieval",
        stages: [
          {
            stage: "cache_check",
            status: "success",
            details: "Found existing ownership data in database cache",
            duration: 150
          },
          {
            stage: "ownership_mappings",
            status: "success",
            details: "Located ownership mapping for L'Oréal brand",
            duration: 200
          }
        ]
      },
      {
        title: "Ownership Research",
        stages: [
          {
            stage: "llm_first_analysis",
            status: "success",
            details: "AI analysis confirmed L'Oréal Group as ultimate owner with 85% confidence",
            duration: 3000
          },
          {
            stage: "web_research",
            status: "success",
            details: "Verified ownership through official company filings and financial reports",
            duration: 2500
          },
          {
            stage: "database_save",
            status: "success",
            details: "Saved ownership result to database for future lookups",
            duration: 300
          }
        ]
      }
    ]
  },
  result_type: "llm-rag-success",
  user_contributed: false
};

interface OwnershipNode {
  name: string;
  country: string;
  countryFlag: string;
  avatar: string;
}

interface TraceData {
  stage: "vision" | "retrieval" | "ownership";
  status: "success" | "partial" | "failed";
  details: string;
  sources?: string[];
  duration?: number;
}

export default function TestRealDataPage() {
  // Transform pipeline data to ProductResult props (same logic as results page)
  const transformPipelineData = (pipelineResult: any) => {
    // Transform ownership_flow to OwnershipNode[]
    const ownershipChain: OwnershipNode[] = pipelineResult.ownership_flow?.map((node: any, index: number) => ({
      name: node.name,
      country: node.country || 'Unknown',
      countryFlag: node.flag || '🏳️',
      avatar: `data:image/svg+xml;base64,${btoa(`
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="44" height="44" rx="22" fill="${index === 0 ? '#FF6B6B' : '#4ECDC4'}"/>
          <text x="22" y="28" text-anchor="middle" fill="white" font-family="Inter" font-size="16" font-weight="600">
            ${node.name.charAt(0).toUpperCase()}
          </text>
        </svg>
      `)}`
    })) || [];

    // Transform agent_execution_trace to TraceData[]
    const traces: TraceData[] = [];
    if (pipelineResult.agent_execution_trace?.sections) {
      pipelineResult.agent_execution_trace.sections.forEach((section: any) => {
        section.stages.forEach((stage: any) => {
          // Map stage names to ProductResult stage types
          let stageType: "vision" | "retrieval" | "ownership" = "ownership";
          if (stage.stage.includes('vision') || stage.stage.includes('image') || stage.stage.includes('ocr')) {
            stageType = "vision";
          } else if (stage.stage.includes('cache') || stage.stage.includes('lookup') || stage.stage.includes('api')) {
            stageType = "retrieval";
          }

          // Map status
          let status: "success" | "partial" | "failed" = "success";
          if (stage.status === 'failed' || stage.status === 'error') {
            status = "failed";
          } else if (stage.status === 'partial' || stage.status === 'incomplete') {
            status = "partial";
          }

          traces.push({
            stage: stageType,
            status,
            details: stage.details,
            duration: stage.duration
          });
        });
      });
    }

    return {
      brand: pipelineResult.brand || 'Unknown Brand',
      owner: pipelineResult.financial_beneficiary || 'Unknown Owner',
      confidence: pipelineResult.confidence_score || 0,
      productImage: `data:image/svg+xml;base64,${btoa(`
        <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="128" height="128" rx="64" fill="#FF6B6B"/>
          <text x="64" y="80" text-anchor="middle" fill="white" font-family="Inter" font-size="48" font-weight="600">
            ${(pipelineResult.brand || 'P').charAt(0).toUpperCase()}
          </text>
        </svg>
      `)}`,
      ownershipChain,
      structureType: pipelineResult.ownership_structure_type,
      analysisText: pipelineResult.reasoning,
      traces,
      // Optional props
      acquisitionYear: undefined, // Not available in pipeline
      publicTicker: undefined // Not available in pipeline
    };
  };

  const productResultProps = transformPipelineData(mockPipelineResult);

  return (
    <div className="min-h-screen bg-background dark-gradient">
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="text-center mb-6">
          <h1 className="text-headline mb-2">Real Data Test</h1>
          <p className="text-body text-muted-foreground">Testing ProductResult with simulated pipeline data</p>
        </div>
        <ProductResult {...productResultProps} />
      </div>
    </div>
  );
} 