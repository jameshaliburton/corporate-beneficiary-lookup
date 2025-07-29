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
    // Include the LLM-generated copy
    generated_copy: result.generated_copy,
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

  const handleCapture = async (imageData?: string) => {
    if (!imageData) {
      console.log('❌ No image data provided, not proceeding with API call');
      return; // Don't proceed if no image was captured
    }

    // Immediately set scanning to true to hide camera
    setIsScanning(true);
    
    // Add a small delay to ensure the state update is processed
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      console.log('📸 Camera capture triggered, calling real pipeline API...');
      console.log('📸 Image data provided:', !!imageData);
      console.log('📸 Image data length:', imageData.length);
      
      // Send the captured image to the API
      const requestBody = {
        image_base64: imageData
      };
      
      console.log('📸 Sending image data to API (length:', imageData.length, ')');
      
      // Call the real pipeline API
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
      const cleanResult = cleanPipelineResult(rawPipelineResult);
      
      console.log('🧹 Cleaned pipeline result:', {
        success: cleanResult.success,
        brand: cleanResult.brand,
        confidence: cleanResult.confidence_score,
        hasGeneratedCopy: !!rawPipelineResult.generated_copy
      });

      // Test JSON serializability
      try {
        JSON.stringify(cleanResult);
        console.log('✅ Cleaned result is JSON serializable');
      } catch (err) {
        console.error('❌ Cleaned result is NOT JSON serializable:', err);
      }

      if (cleanResult.success) {
        // Store the full API response in sessionStorage for the results page
        console.log('💾 Storing full API response in sessionStorage:', {
          hasGeneratedCopy: !!cleanResult.generated_copy,
          generatedCopyKeys: cleanResult.generated_copy ? Object.keys(cleanResult.generated_copy) : [],
          brand: cleanResult.brand,
          confidence: cleanResult.confidence_score
        });
        
        // Log the actual generated_copy content
        if (cleanResult.generated_copy) {
          console.log('🎨 Generated copy content:', JSON.stringify(cleanResult.generated_copy, null, 2));
        }
        
        const sessionData = JSON.stringify(cleanResult);
        console.log('💾 Session data size:', sessionData.length, 'characters');
        
        sessionStorage.setItem('pipelineResult', sessionData);
        
        // Verify it was stored correctly
        const storedData = sessionStorage.getItem('pipelineResult');
        console.log('✅ Verification - stored data has generated_copy:', storedData ? JSON.parse(storedData).generated_copy ? 'YES' : 'NO' : 'NO DATA');
        
        const searchParams = new URLSearchParams({
          success: 'true',
          brand: cleanResult.brand || 'unknown',
          confidence: cleanResult.confidence_score?.toString() || '0'
        });
        
        const resultUrl = `/result/${encodeURIComponent(cleanResult.brand || 'unknown')}?${searchParams.toString()}`;
        console.log('🚀 Navigating to:', resultUrl);
        
        router.push(resultUrl);
      } else {
        const searchParams = new URLSearchParams({
          success: 'false',
          error: 'No product found'
        });
        
        const resultUrl = `/result/unknown?${searchParams.toString()}`;
        console.log('❌ Navigating to error page:', resultUrl);
        
        router.push(resultUrl);
      }
      
    } catch (error) {
      console.error('❌ Error during API call:', error);
      
      const searchParams = new URLSearchParams({
        success: 'false',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      const resultUrl = `/result/error?${searchParams.toString()}`;
      console.log('❌ Navigating to error page:', resultUrl);
      
      router.push(resultUrl);
    }
  };

  // Show loading screen when scanning - completely separate from camera page
  if (isScanning) {
    return (
      <div className="min-h-screen bg-background dark-gradient flex items-center justify-center">
        <div className="container mx-auto max-w-md px-4">
          <LoadingScreen context="image" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="mt-8 space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">
              Scan Product
            </h1>
            <p className="text-muted-foreground">
              Point your camera at a product to reveal its ownership
            </p>
          </div>
          
          {!isScanning && (
            <VideoCapture onCapture={handleCapture} isScanning={isScanning} />
          )}
          
          {!isScanning && (
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/manual')}
                className="text-muted-foreground hover:text-foreground"
              >
                Search by name instead
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 