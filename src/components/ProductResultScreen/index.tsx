import React from 'react';
import ProductHeader from './ProductHeader';
import OwnershipTrail from './OwnershipTrail';
import ConfidenceAttribution from './ConfidenceAttribution';
import { ProcessTrace } from './ProcessTrace';
import Trace from './Trace';
import ErrorFallback from './ErrorFallback';
import ManualEntryForm from './ManualEntryForm';
import StickyActionBar from './StickyActionBar';

// Mock data for demo
const mockData = {
  product: {
    name: "Hellmann's Real Mayonnaise 400g",
    brand: "Hellmann's",
    barcode: '5000184321064',
  },
  ownershipTrail: [
    { name: "Hellmann's", country: 'UK', type: 'Brand', flag: '🇬🇧' },
    { name: 'Unilever PLC', country: 'UK', type: 'Parent Company', flag: '🇬🇧' },
    { name: 'Unilever Group', country: 'UK', type: 'Ultimate Owner', flag: '🇬🇧', ultimate: true },
  ],
  confidence: 'High' as 'High',
  attribution: 92,
  sources: 12,
  reasoning:
    "To determine the ownership, the AI agent analyzed the barcode, queried multiple databases, and traced the chain of corporate entities. The result is based on the most recent filings and public records available. Confidence is high due to corroborating sources.",
  trace: [
    {
      step: 'Barcode Analysis',
      description: 'Analyzed product barcode and extracted brand information',
      status: 'success' as const,
      duration: 245,
      details: 'Found brand: Hellmann\'s, Product: Real Mayonnaise 400g'
    },
    {
      step: 'Database Query',
      description: 'Searched corporate ownership databases',
      status: 'success' as const,
      duration: 1234,
      details: 'Queried 3 databases, found 2 relevant records'
    },
    {
      step: 'Web Research',
      description: 'Performed web search for ownership information',
      status: 'success' as const,
      duration: 3456,
      details: 'Scraped 5 websites, found ownership chain'
    },
    {
      step: 'Ownership Analysis',
      description: 'Analyzed ownership structure and relationships',
      status: 'success' as const,
      duration: 892,
      details: 'Identified 3-tier ownership: Brand → Parent → Ultimate Owner'
    },
    {
      step: 'Confidence Assessment',
      description: 'Calculated confidence score based on sources',
      status: 'success' as const,
      duration: 156,
      details: 'High confidence (92%) due to multiple corroborating sources'
    }
  ],
  error: null, // No error in this demo
};

interface ProductResult {
  success: boolean;
  product_name?: string;
  brand?: string;
  barcode?: string;
  financial_beneficiary?: string;
  beneficiary_country?: string;
  beneficiary_flag?: string;
  confidence?: number;
  verification_status?: string;
  sources?: string[];
  reasoning?: string;
  result_type?: string;
  error?: string;
  confidence_score?: number;
  ownership_structure_type?: string;
  user_contributed?: boolean;
  ownership_flow?: Array<{
    name: string;
    country?: string;
    type?: string;
    source?: string;
  }>;
  agent_execution_trace?: {
    stages?: Array<{
      name?: string;
      description?: string;
      status?: string;
      duration?: number;
      details?: string;
    }>;
  };
}

interface ProductResultScreenProps {
  onScanAnother?: () => void;
  result?: ProductResult;
}

const ProductResultScreen: React.FC<ProductResultScreenProps> = ({ onScanAnother, result }) => {
  // Use real result data if provided, otherwise use mock data for demo
  const data = result || mockData;
  
  // Helper function to get flag emoji
  function getFlag(country: string): string {
    if (!country || country === 'Unknown') return '🏳️';
    const flagMap: { [key: string]: string } = {
      'Sweden': '🇸🇪',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Netherlands': '🇳🇱',
      'Switzerland': '🇨🇭',
      'Japan': '🇯🇵',
      'China': '🇨🇳',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Denmark': '🇩🇰',
      'Norway': '🇳🇴',
      'Finland': '🇫🇮',
      'South Korea': '🇰🇷',
      'Brazil': '🇧🇷',
      'India': '🇮🇳',
      'Mexico': '🇲🇽',
    };
    return flagMap[country] || '🏳️';
  }
  
  // Convert real result data to the format expected by components
  const productData = result ? {
    name: result.product_name || 'Unknown Product',
    brand: result.brand || 'Unknown Brand',
    barcode: result.barcode || 'Unknown Barcode',
  } : mockData.product;

  const ownershipTrailData = result?.ownership_flow ? result.ownership_flow.map((company, index) => ({
    name: company.name,
    country: company.country || 'Unknown',
    type: company.type || 'Unknown',
    flag: company.country ? getFlag(company.country) : '🏳️',
    ultimate: index === result.ownership_flow!.length - 1,
  })) : mockData.ownershipTrail;

  const confidenceData = result ? {
    confidence: (() => {
      if (!result.confidence_score) return 'Low';
      if (result.confidence_score >= 80) return 'High';
      if (result.confidence_score >= 60) return 'Medium';
      return 'Low';
    })(),
    attribution: result.confidence_score || 0,
    sources: result.sources?.length || 0,
  } : {
    confidence: mockData.confidence,
    attribution: mockData.attribution,
    sources: mockData.sources,
  };

  const traceData = result?.agent_execution_trace?.stages ? 
    result.agent_execution_trace.stages.map((stage: any) => {
      let status: 'success' | 'error' | 'in_progress' | 'pending' = 'pending';
      if (stage.status === 'success') status = 'success';
      else if (stage.status === 'error') status = 'error';
      else if (stage.status === 'in_progress') status = 'in_progress';
      
      return {
        step: stage.name || 'Unknown Step',
        description: stage.description || 'No description available',
        status,
        duration: stage.duration || 0,
        details: stage.details || 'No details available',
      };
    }) : mockData.trace;

  return (
    <div className="max-w-lg mx-auto p-4 pb-24">
      <ProductHeader product={productData} />
      <OwnershipTrail steps={ownershipTrailData} />
      <ConfidenceAttribution confidence={confidenceData.confidence} score={confidenceData.attribution} />
      <ProcessTrace reasoning={data.reasoning || 'No reasoning available'} />
      <Trace trace={traceData} />
      {result?.error && (
        <ErrorFallback scenario="AI Research Error" message={result.error} />
      )}
      <ManualEntryForm productName={productData.name} brandName={productData.brand} />
      <StickyActionBar onScanAnother={onScanAnother} />
    </div>
  );
};

export default ProductResultScreen; 