'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoCapture } from '@/components/VideoCapture';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';

// Function to clean API response and remove circular references
function cleanPipelineResult(result: any) {
  return {
    success: result.success,
    product_name: result.product_name,
    brand: result.brand,
    barcode: result.barcode,
    financial_beneficiary: result.financial_beneficiary,
    beneficiary_country: result.beneficiary_country,
    beneficiary_flag: result.beneficiary_flag,
    confidence_score: result.confidence_score,
    confidence_level: result.confidence_level,
    confidence_factors: result.confidence_factors,
    confidence_breakdown: result.confidence_breakdown,
    confidence_reasoning: result.confidence_reasoning,
    ownership_structure_type: result.ownership_structure_type,
    ownership_flow: result.ownership_flow,
    sources: result.sources,
    reasoning: result.reasoning,
    result_type: result.result_type,
    user_contributed: result.user_contributed,
    // Simplify the agent_execution_trace to avoid circular references
    agent_execution_trace: result.agent_execution_trace ? {
      sections: result.agent_execution_trace.sections?.map((section: any) => ({
        id: section.id,
        title: section.title,
        label: section.label,
        stages: section.stages?.map((stage: any) => ({
          id: stage.id,
          stage: stage.stage,
          status: stage.status,
          details: stage.details,
          duration: stage.duration,
          durationMs: stage.durationMs
        }))
      }))
    } : undefined
  };
}

export default function CameraPage() {
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  const handleCapture = async () => {
    setIsScanning(true);
    
    try {
      console.log('📸 Camera capture triggered, calling real pipeline API...');
      
      // Call the real pipeline API - VideoCapture doesn't provide actual image data
      // so we'll provide a default search term for the vision-first pipeline
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Provide a default search term since the API requires at least one parameter
          brand: 'apple',
          product_name: 'apple'
        }),
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const rawPipelineResult = await response.json();
      
      console.log('✅ Raw pipeline API response received:', {
        success: rawPipelineResult.success,
        brand: rawPipelineResult.brand,
        confidence: rawPipelineResult.confidence_score
      });

      // Clean the result to remove circular references
      const pipelineResult = cleanPipelineResult(rawPipelineResult);
      
      console.log('🧹 Cleaned pipeline result:', {
        success: pipelineResult.success,
        brand: pipelineResult.brand,
        confidence: pipelineResult.confidence_score
      });

      // Test JSON serialization to catch circular reference early
      try {
        JSON.stringify(pipelineResult);
        console.log('✅ Pipeline result is serializable');
      } catch (serializeError) {
        console.error('❌ Pipeline result has circular reference:', serializeError);
        throw new Error('Pipeline result contains circular references');
      }

      if (!pipelineResult.success) {
        throw new Error('Pipeline processing failed');
      }

      // Navigate to results page with minimal data in URL
      const brandSlug = pipelineResult.brand?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'unknown';
      const searchParams = new URLSearchParams({
        success: 'true',
        brand: pipelineResult.brand || 'unknown',
        confidence: pipelineResult.confidence_score?.toString() || '0'
      });
      
      console.log('🚀 Navigating to results page:', `/result/${brandSlug}?${searchParams.toString()}`);
      router.push(`/result/${brandSlug}?${searchParams.toString()}`);
      
    } catch (error) {
      console.error('❌ Camera capture failed:', error);
      
      // Navigate to results page with error state
      const searchParams = new URLSearchParams({
        success: 'false',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.log('🚀 Navigating to error page:', `/result/error?${searchParams.toString()}`);
      router.push(`/result/error?${searchParams.toString()}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSearch = () => {
    router.push('/manual');
  };

  // Show loading screen during processing
  if (isScanning) {
    return (
      <div className="min-h-screen bg-background dark-gradient">
        <AppHeader />
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">Scan Product</h1>
          <p className="text-body text-muted-foreground">Take a photo of any product to reveal its ownership</p>
        </div>
        
        {/* Camera/Scan Entry Screen */}
        <div className="space-y-6">
          {/* Video Capture Component */}
          <div className="relative">
            <VideoCapture 
              onCapture={handleCapture}
              isScanning={isScanning}
            />
          </div>
          
          {/* Manual Search Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleManualSearch}
              className="text-small h-btn-primary rounded-component"
              size="sm"
            >
              Search by name instead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 