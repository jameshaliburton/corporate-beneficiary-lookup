'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ManualInput } from "@/components/ManualInput";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function ManualPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [showContextAfterFailure, setShowContextAfterFailure] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState(""); // Track the last search term
  const router = useRouter();

  const handleSearch = async (searchTerm: string, context?: string) => {
    console.log('🔍 ManualPage: Search triggered', { searchTerm, context });
    setIsSearching(true);
    setShowContextAfterFailure(false); // Reset on new search
    setLastSearchTerm(searchTerm); // Store the search term
    
    try {
      console.log('🔍 Manual search triggered:', searchTerm);
      if (context) {
        console.log('📝 Additional context provided:', context);
      } else {
        console.log('⚠️ No additional context provided');
      }
      
      // Call the real pipeline API with the search term
      const requestBody = {
        brand: searchTerm,
        product_name: searchTerm,
        user_context: context,
      };
      
      console.log('📡 API request body:', requestBody);
      
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawPipelineResult = await response.json();
      console.log('📦 Raw pipeline result:', rawPipelineResult);

      // Check if the search was successful (confidence > 30)
      if (rawPipelineResult.success && rawPipelineResult.brand && rawPipelineResult.confidence_score > 30) {
        // Successful search - proceed to results
        const pipelineResult = cleanPipelineResult(rawPipelineResult);
        
        // Store the full API response in sessionStorage for the results page
        console.log('💾 Storing full API response in sessionStorage:', {
          hasGeneratedCopy: !!rawPipelineResult.generated_copy,
          generatedCopyKeys: rawPipelineResult.generated_copy ? Object.keys(rawPipelineResult.generated_copy) : [],
          brand: rawPipelineResult.brand,
          confidence: rawPipelineResult.confidence_score,
          threshold: 50
        });
        
        // Log the actual generated_copy content
        if (rawPipelineResult.generated_copy) {
          console.log('🎨 Generated copy content:', JSON.stringify(rawPipelineResult.generated_copy, null, 2));
        }
        
        const sessionData = JSON.stringify(rawPipelineResult);
        console.log('💾 Session data size:', sessionData.length, 'characters');
        console.log('🔍 Manual search - verification fields being stored:', {
          verification_status: rawPipelineResult.verification_status,
          verified_at: rawPipelineResult.verified_at,
          confidence_assessment: rawPipelineResult.confidence_assessment,
          verification_evidence: rawPipelineResult.verification_evidence
        });
        
        sessionStorage.setItem('pipelineResult', sessionData);
        
        // Verify it was stored correctly
        const storedData = sessionStorage.getItem('pipelineResult');
        console.log('✅ Verification - stored data has generated_copy:', storedData ? JSON.parse(storedData).generated_copy ? 'YES' : 'NO' : 'NO DATA');
        
        const brandSlug = encodeURIComponent(rawPipelineResult.brand || 'unknown');
        const searchParams = new URLSearchParams({
          success: 'true',
          brand: rawPipelineResult.brand || 'unknown',
          confidence: rawPipelineResult.confidence_score?.toString() || '0'
        });
        
        const resultUrl = `/result/${brandSlug}?${searchParams.toString()}`;
        console.log('🚀 Navigating to:', resultUrl);
        
        router.push(resultUrl);
      } else {
        // Failed search or low confidence - show context option
        console.log('❌ Search failed or returned low confidence:', {
          success: rawPipelineResult.success,
          brand: rawPipelineResult.brand,
          confidence: rawPipelineResult.confidence_score
        });
        
        setShowContextAfterFailure(true);
        setIsSearching(false);
      }
    } catch (error) {
      console.error('❌ Manual search failed:', error);
      setShowContextAfterFailure(true);
      setIsSearching(false);
    }
  };

  function cleanPipelineResult(result: any) {
    return {
      success: result.success,
      brand: result.brand,
      product_name: result.product_name,
      owner: result.owner,
      ultimate_owner: result.ultimate_owner,
      ownership_chain: result.ownership_chain,
      confidence_score: result.confidence_score,
      generated_copy: result.generated_copy, // Ensure generated_copy is included
      traces: result.traces || [],
      ownership_flow: result.ownership_flow || [],
      // Gemini verification fields
      verification_status: result.verification_status,
      verified_at: result.verified_at,
      verification_method: result.verification_method,
      verification_notes: result.verification_notes,
      confidence_assessment: result.confidence_assessment,
      verification_evidence: result.verification_evidence,
      agent_path: result.agent_path
    };
  }

  // Show loading screen during processing
  if (isSearching) {
    return (
      <div className="min-h-screen bg-background dark-gradient">
        <AppHeader />
        <LoadingScreen context="manual" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 py-8">
        <ManualInput
          onSearch={handleSearch}
          showContextAfterFailure={showContextAfterFailure}
          initialValue={lastSearchTerm} // Pass the last search term to preserve it
        />
      </div>
    </div>
  );
} 