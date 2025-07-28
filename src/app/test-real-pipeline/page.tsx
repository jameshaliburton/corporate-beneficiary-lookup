'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProductResult } from '@/components/ProductResult';
import { AppHeader } from '@/components/AppHeader';
import { transformPipelineData, type PipelineResult } from '@/lib/utils/pipeline-transformer';

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
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [transformedProps, setTransformedProps] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Effect to transform pipeline data when it changes
  useEffect(() => {
    if (pipelineResult) {
      handleTransformPipelineData(pipelineResult);
    }
  }, [pipelineResult]);

  // Transform pipeline data to ProductResult props (using shared function)
  const handleTransformPipelineData = async (pipelineResult: PipelineResult) => {
    try {
      const result = await transformPipelineData(pipelineResult);
      setTransformedProps(result);
      return result;
    } catch (error) {
      console.error('❌ Error transforming pipeline data:', error);
      throw error;
    }
  };

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
            
            <ProductResult {...transformedProps} />
            
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