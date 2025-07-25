import React, { useState } from 'react';
import ProductHeader from './ProductHeader';
import OwnershipTrail from './OwnershipTrail';
import EnhancedConfidenceAttribution from './EnhancedConfidenceAttribution';
import { ProcessTrace } from './ProcessTrace';
import EnhancedTraceViewer from './EnhancedTraceViewer';
import Trace from './Trace';
import ErrorFallback from './ErrorFallback';
import ManualEntryForm from './ManualEntryForm';
import StickyActionBar from './StickyActionBar';
import LookupTrace from './LookupTrace';
import { ContextualCluesDisplay } from './ContextualCluesDisplay';
import { InlineBuildInfo } from '@/components/BuildInfo';

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
  confidence_level?: string;
  confidence_factors?: Record<string, number>;
  confidence_breakdown?: Record<string, number>;
  confidence_reasoning?: string;
  ownership_structure_type?: string;
  user_contributed?: boolean;
  ownership_flow?: Array<{
    name: string;
    country?: string;
    type?: string;
    source?: string;
    flag?: string;
    ultimate?: boolean;
  }>;
  lookup_trace?: {
    barcode: string;
    start_time: string;
    attempts: Array<{
      source: string;
      success: boolean;
      timestamp: string;
      reason?: string;
      error?: string;
    }>;
    final_result: string;
    total_duration_ms: number;
  };
  agent_execution_trace?: {
    trace_id?: string;
    start_time?: string;
    brand?: string;
    product_name?: string;
    barcode?: string;
    stages?: Array<{
      stage_id?: string;
      stage?: string;
      description?: string;
      start_time?: string;
      end_time?: string;
      status?: string;
      reasoning?: Array<{
        timestamp: string;
        type: string;
        content: string;
      }>;
      decisions?: Array<{
        timestamp: string;
        decision: string;
        alternatives: string[];
        reasoning: string;
      }>;
      data?: any;
      error?: string;
      duration_ms?: number;
      name?: string;
      result?: string;
      duration?: number;
      details?: string;
    }>;
    decisions?: Array<{
      stage: string;
      timestamp: string;
      decision: string;
      alternatives: string[];
      reasoning: string;
    }>;
    reasoning_chain?: Array<{
      stage: string;
      timestamp: string;
      type: string;
      content: string;
    }>;
    performance_metrics?: {
      total_duration_ms: number;
      stage_durations: Record<string, number>;
      memory_usage?: number;
      api_calls: number;
      token_usage: number;
    };
    final_result?: string;
    error_details?: string;
    confidence_evolution?: Array<{
      stage: string;
      timestamp: string;
      confidence: number;
      factors: Record<string, any>;
    }>;
  };
  contextual_clues?: {
    step: string;
    step_name: string;
    extracted_data: {
      brand_name: string;
      product_name: string;
      product_type: string;
      confidence: number;
      reasoning: string;
      language_indicators: string[];
      country_indicators: string[];
      product_style: string;
      packaging_characteristics: string[];
      regional_clues: string[];
      certification_marks: string[];
      store_brand_indicators: boolean;
      premium_indicators: boolean;
      dietary_indicators: string[];
      size_format: string;
    };
    raw_extraction: string;
    extraction_timestamp: string;
    quality_assessment?: {
      step: string;
      step_name: string;
      result: any;
      needs_escalation: boolean;
    };
    vision_agent?: {
      step: string;
      step_name: string;
      used: boolean;
      result?: any;
      improved_results?: boolean;
      reason?: string;
    };
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

  // Ownership trail: always show at least brand and unknown owner if no parent found
  const ownershipTrailData = result ? (
    result.ownership_flow && result.ownership_flow.length > 0 ? 
      result.ownership_flow.map((company, index) => ({
        name: company.name,
        country: company.country || 'Unknown',
        type: company.type || 'Unknown',
        flag: company.flag || getFlag(company.country),
        ultimate: company.ultimate || index === result.ownership_flow!.length - 1,
      })) : [
        {
          name: result.brand || 'Unknown Brand',
          country: 'Unknown',
          type: 'Brand',
          flag: '🏳️',
          ultimate: false,
        },
        {
          name: 'Unknown Owner',
          country: 'Unknown',
          type: 'Ultimate Owner',
          flag: '❓',
          ultimate: true,
        }
      ]
  ) : mockData.ownershipTrail;

  const confidenceData = result ? {
    confidence: (() => {
      if (!result.confidence_score) return 'Low' as 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
      if (result.confidence_score >= 90) return 'Very High' as 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
      if (result.confidence_score >= 80) return 'High' as 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
      if (result.confidence_score >= 60) return 'Medium' as 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
      if (result.confidence_score >= 30) return 'Low' as 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
      return 'Very Low' as 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
    })(),
    attribution: result.confidence_score || 0,
    sources: result.sources?.length || 0,
    // Enhanced confidence data
    factors: result.confidence_factors,
    breakdown: result.confidence_breakdown ? Object.entries(result.confidence_breakdown).map(([factor, score]) => ({
      factor,
      score,
      weight: 16.67, // Equal weight for each factor
      contribution: (score * 16.67) / 100
    })) : undefined,
    reasoning: result.confidence_reasoning,
  } : {
    confidence: 'Medium' as 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low',
    attribution: mockData.attribution,
    sources: mockData.sources,
  };

  // Trace: map backend fields correctly
  const traceData = result?.agent_execution_trace?.stages ? 
    result.agent_execution_trace.stages.map((stage: any) => {
      let status: 'success' | 'error' | 'in_progress' | 'pending' = 'pending';
      if (stage.result === 'success') status = 'success';
      else if (stage.result === 'error') status = 'error';
      else if (stage.result === 'in_progress') status = 'in_progress';
      else if (stage.result === 'hit') status = 'success';
      else if (stage.result === 'miss') status = 'error';
      else if (stage.result === 'not_available') status = 'pending';
      return {
        step: stage.stage || 'Unknown Step',
        description: stage.description || 'No description available',
        status,
        duration: stage.duration_ms || 0,
        details: stage.data ? JSON.stringify(stage.data) : (stage.error || 'No details available'),
      };
    }) : mockData.trace;

  // Helper function to check if we have enhanced trace data
  const hasEnhancedTrace = (trace: any): boolean => {
    return trace && trace.trace_id && trace.start_time && trace.brand && trace.product_name && trace.barcode;
  };

  const [manualResult, setManualResult] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');

  const handleManualSubmit = async (data: any) => {
    setManualLoading(true);
    setManualError('');
    try {
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: data.brandName || data.companyName,
          product_name: data.productName,
          manual: true,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setManualResult(result);
      } else {
        setManualError(result.error || 'No result returned');
      }
    } catch (err) {
      setManualError('Error: ' + (err?.message || err));
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 pb-24">
      <ProductHeader product={productData} />
      
      {/* Show contextual clues from image analysis if available */}
      {result?.contextual_clues && (
        <ContextualCluesDisplay contextualClues={result.contextual_clues} />
      )}
      
      {/* Show lookup trace if available */}
      {result?.lookup_trace && (
        <LookupTrace trace={result.lookup_trace} />
      )}
      
      <OwnershipTrail steps={ownershipTrailData} />
      <EnhancedConfidenceAttribution 
        confidence={confidenceData.confidence} 
        score={confidenceData.attribution}
        factors={confidenceData.factors}
        breakdown={confidenceData.breakdown}
        reasoning={confidenceData.reasoning}
      />
      <ProcessTrace reasoning={result?.reasoning || data.reasoning || 'No reasoning available'} />
      {result?.agent_execution_trace && hasEnhancedTrace(result.agent_execution_trace) ? (
        <EnhancedTraceViewer trace={result.agent_execution_trace as any} />
      ) : result?.agent_execution_trace ? (
        <Trace trace={traceData} />
      ) : null}
      {result?.error && (
        <ErrorFallback scenario="AI Research Error" message={result.error} />
      )}
      <ManualEntryForm 
        productName={productData.name} 
        brandName={productData.brand} 
        onSubmit={handleManualSubmit}
      />
      {manualLoading && <div className="text-center text-blue-600 mt-2">Looking up ownership...</div>}
      {manualError && <div className="text-center text-red-600 mt-2">{manualError}</div>}
      {manualResult && <div className="text-center text-green-600 mt-2">Ownership found: {JSON.stringify(manualResult)}</div>}
      <StickyActionBar onScanAnother={onScanAnother} />
      
      {/* Build info for version tracking */}
      <div className="mt-8 text-center">
        <InlineBuildInfo variant="compact" className="text-gray-400" />
      </div>
    </div>
  );
};

export default ProductResultScreen; 