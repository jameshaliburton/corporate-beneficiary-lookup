'use client';

import React, { useState, useEffect } from 'react';
import ProductResultV2 from '@/components/ProductResultV2';

interface PipelineResult {
  success: boolean;
  product_name?: string;
  brand?: string;
  brand_country?: string;
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
  // New narrative fields
  headline?: string;
  tagline?: string;
  story?: string;
  ownership_notes?: string[];
  behind_the_scenes?: string[];
  narrative_template_used?: string;
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
  // Gemini verification fields
  verification_status?: string;
  verification_confidence_change?: string;
  verification_evidence?: any;
  verified_at?: string;
  verification_method?: string;
  confidence_assessment?: any;
  verification_notes?: string;
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

export default function ResultsPage() {
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedResult = sessionStorage.getItem('pipelineResult');
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        console.log('📊 Loaded pipeline result:', {
          success: parsedResult.success,
          brand: parsedResult.brand,
          confidence: parsedResult.confidence_score,
          hasNarrativeFields: {
            headline: !!parsedResult.headline,
            tagline: !!parsedResult.tagline,
            story: !!parsedResult.story,
            ownership_notes: !!parsedResult.ownership_notes,
            behind_the_scenes: !!parsedResult.behind_the_scenes
          }
        });
        setResult(parsedResult);
      } catch (error) {
        console.error('❌ [NARRATIVE_PARSE_ERROR] Error parsing stored result:', error);
        console.error('❌ [NARRATIVE_PARSE_ERROR] Raw stored data:', storedResult.substring(0, 500));
        
        // Try to recover by sanitizing the data
        try {
          const sanitizedData = storedResult.replace(/[\u0000-\u001F\u007F]/g, ' ');
          const recoveredResult = JSON.parse(sanitizedData);
          console.log('🔄 [NARRATIVE_RECOVERY] Successfully recovered result after sanitization');
          setResult(recoveredResult);
        } catch (recoveryError) {
          console.error('❌ [NARRATIVE_RECOVERY] Failed to recover result:', recoveryError);
        }
      }
    } else {
      console.log('⚠️ No stored result found in sessionStorage');
    }
    setLoading(false);
  }, []);

  // Transform pipeline data to ProductResult props
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-body text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background dark-gradient flex items-center justify-center">
        <div className="text-center">
          <p className="text-body text-muted-foreground">No results found</p>
        </div>
      </div>
    );
  }

  // Transform the result to match the new ProductResultV2 interface
  console.log('[ResultsPage] Raw result data:', {
    verification_status: result?.verification_status,
    verified_at: result?.verified_at,
    confidence_assessment: result?.confidence_assessment,
    verification_evidence: result?.verification_evidence
  });
  
  const ownershipResult = {
    brand_name: result?.brand,
    brand_country: result?.brand_country,
    ultimate_owner: result?.financial_beneficiary,
    ultimate_owner_country: result?.beneficiary_country,
    financial_beneficiary: result?.financial_beneficiary,
    financial_beneficiary_country: result?.beneficiary_country,
    ownership_type: result?.ownership_structure_type,
    confidence: result?.confidence_score,
    ownership_notes: result?.ownership_notes,
    behind_the_scenes: result?.behind_the_scenes,
    // Use the new narrative fields if available
    headline: result?.headline,
    tagline: result?.tagline,
    story: result?.story,
    // Gemini verification fields
    verification_status: result?.verification_status,
    verified_at: result?.verified_at,
    verification_method: result?.verification_method,
    verification_notes: result?.verification_notes,
    confidence_assessment: result?.confidence_assessment,
    verification_evidence: result?.verification_evidence,
    verification_confidence_change: result?.confidence_assessment?.confidence_change
  };

  return (
    <div className="min-h-screen bg-background dark-gradient">
      <div className="container mx-auto max-w-md px-4 pt-4">
        <ProductResultV2 
          result={ownershipResult}
          narrative={{
            headline: result?.headline,
            tagline: result?.tagline,
            story: result?.story,
            ownership_notes: result?.ownership_notes || [],
            behind_the_scenes: result?.behind_the_scenes || [],
            template_used: result?.narrative_template_used || 'fallback'
          }}
          onScanAnother={() => window.location.href = '/'}
          onShare={() => console.log('Share functionality')}
        />
      </div>
    </div>
  );
} 