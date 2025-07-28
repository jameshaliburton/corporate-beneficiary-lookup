'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ManualInput } from '@/components/ManualInput';
import { LoadingScreen } from '@/components/LoadingScreen';
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

export default function ManualPage() {
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (searchTerm: string) => {
    setIsSearching(true);
    
    try {
      console.log('🔍 Manual search triggered:', searchTerm);
      
      // Call the real pipeline API with the search term
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: searchTerm, // Pass the search term as brand
          product_name: searchTerm, // Also pass as product name for better matching
          // For manual search, we rely on the pipeline to research the brand
        }),
      });

      if (!response.ok) {
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
      
      router.push(`/result/${brandSlug}?${searchParams.toString()}`);
      
    } catch (error) {
      console.error('❌ Manual search failed:', error);
      
      // Navigate to results page with error state
      const searchParams = new URLSearchParams({
        success: 'false',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      router.push(`/result/error?${searchParams.toString()}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Show loading screen during processing
  if (isSearching) {
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
          <h1 className="text-headline mb-2">Manual Search</h1>
          <p className="text-body text-muted-foreground">Enter a brand or company name to find its ownership</p>
        </div>
        
        {/* Manual Input Component */}
        <div className="space-y-6">
          <ManualInput 
            onSearch={handleSearch}
            placeholder="Enter brand name (e.g., Nike, Apple, Coca-Cola)"
          />
        </div>
      </div>
    </div>
  );
} 