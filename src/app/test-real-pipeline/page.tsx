'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProductResult } from '@/components/ProductResult';
import { AppHeader } from '@/components/AppHeader';

interface PipelineResult {
  success: boolean;
  product_name?: string;
  brand?: string;
  barcode?: string;
  financial_beneficiary?: string;
  beneficiary_country?: string;
  beneficiary_flag?: string;
  confidence_score?: number;
  confidence_level?: string;
  confidence_factors?: Record<string, number>;
  confidence_breakdown?: Record<string, number>;
  confidence_reasoning?: string;
  ownership_structure_type?: string;
  ownership_flow?: Array<{
    name: string;
    type?: string;
    country?: string;
    flag?: string;
    ultimate?: boolean;
  }>;
  sources?: string[];
  reasoning?: string;
  agent_execution_trace?: {
    sections?: Array<{
      id?: string;
      title?: string;
      label?: string;
      stages: Array<{
        id?: string;
        stage?: string;
        status?: string;
        details?: string;
        duration?: number;
        durationMs?: number;
        output?: any;
        notes?: string;
        variables?: any;
        intermediate?: any;
        model?: string;
        promptTemplate?: string;
        completionSample?: string;
      }>;
    }>;
    stages?: Array<{
      stage: string;
      status: string;
      details: string;
      duration?: number;
    }>;
  };
  result_type?: string;
  user_contributed?: boolean;
}

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

export default function TestRealPipelinePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const testRealPipeline = async (testCase: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🧪 Testing real pipeline with: ${testCase}`);
      
      // Prepare test data based on test case
      let requestData: any = {};
      
      switch (testCase) {
        case 'nike':
          requestData = {
            brand: 'Nike',
            product_name: 'Nike Air Max 270',
            evaluation_mode: true
          };
          break;
        case 'apple':
          requestData = {
            brand: 'Apple',
            product_name: 'iPhone 15 Pro',
            evaluation_mode: true
          };
          break;
        case 'coca-cola':
          requestData = {
            brand: 'Coca-Cola',
            product_name: 'Coca-Cola Classic',
            evaluation_mode: true
          };
          break;
        case 'loreal':
          requestData = {
            brand: "L'Oréal",
            product_name: "L'Oréal Paris Excellence Hair Color",
            evaluation_mode: true
          };
          break;
        default:
          requestData = {
            brand: 'Test Brand',
            product_name: 'Test Product',
            evaluation_mode: true
          };
      }

      console.log('📤 Sending request to API:', requestData);
      
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result: PipelineResult = await response.json();
      console.log('📥 Received pipeline result:', result);
      
      setPipelineResult(result);
      
      // Store in sessionStorage for results page testing
      sessionStorage.setItem('scanResult', JSON.stringify(result));
      
    } catch (err) {
      console.error('❌ Pipeline test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Transform pipeline data to ProductResult props (same logic as results page)
  const transformPipelineData = (pipelineResult: PipelineResult) => {
    console.log('🔄 Transforming pipeline data:', {
      brand: pipelineResult.brand,
      financial_beneficiary: pipelineResult.financial_beneficiary,
      confidence_score: pipelineResult.confidence_score,
      ownership_flow: pipelineResult.ownership_flow?.length || 0,
      agent_execution_trace: pipelineResult.agent_execution_trace ? 'present' : 'missing'
    });

    // Transform ownership_flow to OwnershipNode[]
    const ownershipChain: OwnershipNode[] = pipelineResult.ownership_flow?.map((node, index) => {
      console.log(`🏢 Processing ownership node ${index}:`, node);
      return {
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
      };
    }) || [];

    // Transform agent_execution_trace to TraceData[]
    const traces: TraceData[] = [];
    if (pipelineResult.agent_execution_trace?.sections) {
      console.log('📊 Processing agent execution trace sections:', pipelineResult.agent_execution_trace.sections.length);
      
      pipelineResult.agent_execution_trace.sections.forEach((section, sectionIndex) => {
        console.log(`📋 Section ${sectionIndex}:`, section.title || section.id);
        
        section.stages.forEach((stage, stageIndex) => {
          console.log(`  Stage ${stageIndex}:`, stage.stage || stage.id, 'Status:', stage.status);
          
          // Map stage names to ProductResult stage types
          let stageType: "vision" | "retrieval" | "ownership" = "ownership";
          const stageName = stage.stage || stage.id || '';
          
          if (stageName.includes('vision') || stageName.includes('image') || stageName.includes('ocr') || stageName.includes('image_processing')) {
            stageType = "vision";
          } else if (stageName.includes('cache') || stageName.includes('lookup') || stageName.includes('api') || stageName.includes('retrieval')) {
            stageType = "retrieval";
          }

          // Map status
          let status: "success" | "partial" | "failed" = "success";
          const stageStatus = stage.status || 'completed';
          
          if (stageStatus === 'failed' || stageStatus === 'error') {
            status = "failed";
          } else if (stageStatus === 'partial' || stageStatus === 'incomplete') {
            status = "partial";
          }

          // Get details from stage output or use a default
          const details = stage.output?.details || stage.notes || stage.output?.success ? 'Completed successfully' : 'Processing...';

          traces.push({
            stage: stageType,
            status,
            details,
            duration: stage.durationMs || stage.duration
          });
        });
      });
    } else if (pipelineResult.agent_execution_trace?.stages) {
      // Handle legacy trace format
      console.log('📊 Processing legacy agent execution trace stages:', pipelineResult.agent_execution_trace.stages.length);
      
      pipelineResult.agent_execution_trace.stages.forEach((stage, index) => {
        console.log(`  Stage ${index}:`, stage.stage, 'Status:', stage.status);
        
        let stageType: "vision" | "retrieval" | "ownership" = "ownership";
        if (stage.stage.includes('vision') || stage.stage.includes('image') || stage.stage.includes('ocr')) {
          stageType = "vision";
        } else if (stage.stage.includes('cache') || stage.stage.includes('lookup') || stage.stage.includes('api')) {
          stageType = "retrieval";
        }

        let status: "success" | "partial" | "failed" = "success";
        if (stage.status === 'failed' || stage.status === 'error') {
          status = "failed";
        } else if (stage.status === 'partial' || stage.status === 'incomplete') {
          status = "partial";
        }

        traces.push({
          stage: stageType,
          status,
          details: stage.details || 'Completed successfully',
          duration: stage.duration
        });
      });
    } else {
      console.log('⚠️ No agent execution trace found in pipeline result');
    }

    const transformedData = {
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

    console.log('✅ Transformed data:', {
      brand: transformedData.brand,
      owner: transformedData.owner,
      confidence: transformedData.confidence,
      ownershipChainLength: transformedData.ownershipChain.length,
      tracesLength: transformedData.traces.length
    });

    return transformedData;
  };

  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">Real Pipeline Test</h1>
          <p className="text-body text-muted-foreground">Test the actual pipeline with real API calls</p>
        </div>
        
        {/* Test Controls */}
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => testRealPipeline('nike')}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Test Nike
            </Button>
            <Button
              onClick={() => testRealPipeline('apple')}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Test Apple
            </Button>
            <Button
              onClick={() => testRealPipeline('coca-cola')}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Test Coca-Cola
            </Button>
            <Button
              onClick={() => testRealPipeline('loreal')}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Test L'Oréal
            </Button>
          </div>
          
          {isLoading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-body text-muted-foreground">Calling real pipeline...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
        
        {/* Results */}
        {pipelineResult && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-subheadline mb-2">Pipeline Result</h2>
              <p className="text-body text-muted-foreground">
                Raw data: {pipelineResult.brand} → {pipelineResult.financial_beneficiary} ({pipelineResult.confidence_score}% confidence)
              </p>
            </div>
            
            <ProductResult {...transformPipelineData(pipelineResult)} />
            
            <div className="text-center">
              <Button
                onClick={() => router.push('/results')}
                variant="outline"
                size="sm"
              >
                Test Results Page
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 