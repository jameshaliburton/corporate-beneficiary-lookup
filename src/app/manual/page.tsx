'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ManualInput } from "@/components/ManualInput";
import { LoadingScreen } from "@/components/LoadingScreen";
import { unwrapGeneratedCopy } from "@/lib/utils/unwrapGeneratedCopy";

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
    // Include the new narrative fields
    headline: result.headline,
    tagline: result.tagline,
    story: result.story,
    ownership_notes: result.ownership_notes,
    behind_the_scenes: result.behind_the_scenes,
    narrative_template_used: result.narrative_template_used,
    // Include verification fields
    verification_status: result.verification_status,
    verified_at: result.verified_at,
    verification_method: result.verification_method,
    confidence_assessment: result.confidence_assessment,
    verification_evidence: result.verification_evidence,
    verification_notes: result.verification_notes,
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
    } : {
      // Provide fallback trace structure for UI display
      sections: [{
        id: 'no_agents_triggered',
        title: 'No Agents Triggered',
        label: 'No Agents Triggered',
        stages: [{
          id: 'fallback_stage',
          stage: 'no_agents_triggered',
          status: 'skipped',
          details: 'No agents were triggered for this lookup',
          duration: 0
        }]
      }],
      show_skipped_stages: true,
      mark_skipped_stages: true
    }
  };
}

export default function ManualPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [showContextAfterFailure, setShowContextAfterFailure] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState(""); // Track the last search term
  const [pipelineResult, setPipelineResult] = useState<any>(null); // Track pipeline result for sessionStorage
  const [sessionStorageStatus, setSessionStorageStatus] = useState<string>(''); // Track sessionStorage status
  const router = useRouter();

  // useEffect to handle sessionStorage writes when pipelineResult changes
  useEffect(() => {
    if (typeof window !== 'undefined' && pipelineResult && pipelineResult.brand) {
      try {
        const sessionData = JSON.stringify(pipelineResult);
        const key = `pipelineResult_${pipelineResult.brand}`;
        
        console.log('🔥 [HOTFIX_SESSION_WRITE] Writing to sessionStorage:', {
          key,
          dataSize: sessionData.length,
          hasStory: !!pipelineResult.story,
          hasHeadline: !!pipelineResult.headline,
          hasTagline: !!pipelineResult.tagline
        });
        
        sessionStorage.setItem(key, sessionData);
        console.log('✅ [SESSION_STORAGE_SUCCESS] Successfully stored pipeline result');
        setSessionStorageStatus('✅ sessionStorage write succeeded');
        
        // Also store with generic key for backward compatibility
        sessionStorage.setItem('pipelineResult', sessionData);
        
      } catch (err) {
        console.error('❌ [SESSION_STORAGE_WRITE_ERROR]', { err, brand: pipelineResult.brand, result: pipelineResult });
        setSessionStorageStatus('❌ sessionStorage write failed');
      }
    }
  }, [pipelineResult]);

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
        const cleanedResult = cleanPipelineResult(rawPipelineResult);
        
        // Unwrap generated_copy fields to top level for UI compatibility
        const pipelineResult = unwrapGeneratedCopy(cleanedResult);
        console.log('📦 [UNWRAP] Unwrapped manual search result:', {
          hasHeadline: !!pipelineResult.headline,
          hasStory: !!pipelineResult.story,
          hasTagline: !!pipelineResult.tagline,
          hasOwnershipNotes: !!pipelineResult.ownership_notes,
          hasBehindTheScenes: !!pipelineResult.behind_the_scenes,
          hasGeneratedCopy: !!pipelineResult.hasGeneratedCopy
        });
        
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
        
        // Log both result and brand right before sessionStorage.setItem
        console.log('🔍 [SESSION_STORAGE_DEBUG] About to store:', {
          result: pipelineResult,
          brand: pipelineResult.brand,
          hasNarrativeFields: {
            headline: !!(pipelineResult as any).headline,
            tagline: !!(pipelineResult as any).tagline,
            story: !!(pipelineResult as any).story,
            ownership_notes: !!(pipelineResult as any).ownership_notes,
            behind_the_scenes: !!(pipelineResult as any).behind_the_scenes
          }
        });
        
        // Set the pipeline result state - this will trigger the useEffect to write to sessionStorage
        console.log('🔄 [SESSION_STORAGE_TRIGGER] Setting pipeline result state:', {
          hasResult: !!pipelineResult,
          hasBrand: !!pipelineResult?.brand,
          hasStory: !!(pipelineResult as any)?.story,
          hasHeadline: !!(pipelineResult as any)?.headline
        });
        
        setPipelineResult(pipelineResult);
        
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
        
        {/* Temporary sessionStorage status indicator */}
        {sessionStorageStatus && (
          <div className="mt-4 p-3 rounded-lg bg-blue-100 border border-blue-300 text-sm">
            <strong>SessionStorage Status:</strong> {sessionStorageStatus}
          </div>
        )}
      </div>
    </div>
  );
} 