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
      
      // 🚨 DIAGNOSTIC: Check narrative fields from API
      console.log('🚨 [DIAGNOSTIC] API Response narrative fields:', {
        headline: rawPipelineResult.headline,
        tagline: rawPipelineResult.tagline,
        story: rawPipelineResult.story,
        hasStory: !!rawPipelineResult.story,
        storyLength: rawPipelineResult.story?.length || 0,
        ownership_notes: rawPipelineResult.ownership_notes?.length || 0,
        behind_the_scenes: rawPipelineResult.behind_the_scenes?.length || 0
      });

      // Check if the search was successful (confidence > 30)
      if (rawPipelineResult.success && rawPipelineResult.brand && rawPipelineResult.confidence_score > 30) {
        // Successful search - proceed to results
        const pipelineResult = cleanPipelineResult(rawPipelineResult);
        
        // 🚨 DIAGNOSTIC: Check narrative fields after cleaning
        console.log('🚨 [DIAGNOSTIC] After cleanPipelineResult:', {
          headline: pipelineResult.headline,
          tagline: pipelineResult.tagline,
          story: pipelineResult.story,
          hasStory: !!pipelineResult.story,
          storyLength: pipelineResult.story?.length || 0
        });
        
        // Store the cleaned pipeline result in sessionStorage for the results page
        console.log('💾 Storing cleaned pipeline result in sessionStorage:', {
          hasGeneratedCopy: !!pipelineResult.generated_copy,
          hasHeadline: !!pipelineResult.headline,
          hasStory: !!pipelineResult.story,
          hasTagline: !!pipelineResult.tagline,
          brand: pipelineResult.brand,
          confidence: pipelineResult.confidence_score,
          threshold: 50
        });
        
        // Log the narrative content being stored
        if (pipelineResult.story) {
          console.log('📖 Narrative story (first 100 chars):', pipelineResult.story.substring(0, 100) + '...');
        }
        
        const sessionData = JSON.stringify(pipelineResult);
        console.log('💾 Session data size:', sessionData.length, 'characters');
        console.log('🔍 Manual search - verification fields being stored:', {
          verification_status: pipelineResult.verification_status,
          verified_at: pipelineResult.verified_at,
          confidence_assessment: pipelineResult.confidence_assessment,
          verification_evidence: pipelineResult.verification_evidence
        });
        
        sessionStorage.setItem('pipelineResult', sessionData);
        
        // Verify it was stored correctly
        const storedData = sessionStorage.getItem('pipelineResult');
        const parsedStored = storedData ? JSON.parse(storedData) : null;
        console.log('✅ Verification - stored data check:', {
          hasStory: !!parsedStored?.story,
          hasHeadline: !!parsedStored?.headline,
          hasGeneratedCopy: !!parsedStored?.generated_copy
        });
        
        const brandSlug = encodeURIComponent(pipelineResult.brand || 'unknown');
        const searchParams = new URLSearchParams({
          success: 'true',
          brand: pipelineResult.brand || 'unknown',
          confidence: pipelineResult.confidence_score?.toString() || '0'
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
      generated_copy: result.generated_copy, // Legacy field (deprecated)
      traces: result.traces || [],
      ownership_flow: result.ownership_flow || [],
      // Narrative fields for engaging storytelling
      headline: result.headline,
      tagline: result.tagline,
      story: result.story,
      ownership_notes: result.ownership_notes,
      behind_the_scenes: result.behind_the_scenes,
      narrative_template_used: result.narrative_template_used,
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