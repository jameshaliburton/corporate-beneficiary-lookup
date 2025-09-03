// Shared utility for transforming pipeline data to ProductResult props
// Extracted from test-simple-pipeline page for reuse across camera and manual flows

import { findCompanyLogo } from '@/lib/services/logo-finder';
import { unwrapGeneratedCopy } from '@/lib/utils/unwrapGeneratedCopy';

export interface PipelineResult {
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
  agent_results?: any;
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
  // LLM-generated copy for engaging storytelling
  generated_copy?: {
    headline: string;
    subheadline: string;
    description: string;
    countryFact: string;
    traceSummary: {
      vision: string;
      retrieval: string;
      mapping: string;
    };
  };
  // Narrative fields for story display
  headline?: string;
  tagline?: string;
  story?: string;
  ownership_notes?: string[];
  behind_the_scenes?: string[];
  narrative_template_used?: string;
  // Gemini verification fields
  verification_status?: string;
  verification_confidence_change?: string;
  verification_evidence?: any;
  verified_at?: string;
  verification_method?: string;
  confidence_assessment?: any;
  verification_notes?: string;
}

export interface OwnershipNode {
  name: string;
  country: string;
  countryFlag: string;
  avatar: string;
  logoUrl?: string; // Optional logo URL from authoritative sources
}

export interface TraceData {
  stage: "vision" | "retrieval" | "ownership";
  status: "success" | "partial" | "failed";
  details: string;
  sources?: string[];
  duration?: number;
}

export interface ProductResultProps {
  brand: string;
  brandCountry?: string;
  owner: string;
  ownerCountry?: string;
  ownerFlag?: string;
  confidence: number;
  productImage: string;
  ownershipChain: OwnershipNode[];
  structureType?: string;
  analysisText?: string;
  traces: TraceData[];
  acquisitionYear?: number;
  publicTicker?: string;
  // Agent results and execution trace for ResearchSummary
  agentResults?: any;
  agentExecutionTrace?: any;
  resultType?: string;
  sources?: string[];
  // LLM-generated copy for engaging storytelling
  generatedCopy?: {
    headline: string;
    subheadline: string;
    description: string;
    countryFact: string;
    traceSummary: {
      vision: string;
      retrieval: string;
      mapping: string;
    };
  };
  // Narrative fields for story display
  headline?: string;
  tagline?: string;
  story?: string;
  ownership_notes?: string[];
  behind_the_scenes?: string[];
  narrative_template_used?: string;
  // Gemini verification fields
  verificationStatus?: string;
  verificationConfidenceChange?: string;
  verificationEvidence?: any;
  verifiedAt?: string;
  verificationMethod?: string;
  confidenceAssessment?: any;
  verificationNotes?: string;
}

export async function transformPipelineData(pipelineResult: PipelineResult): Promise<ProductResultProps> {
  console.log('🔄 Transforming pipeline data:', {
    brand: pipelineResult.brand,
    financial_beneficiary: pipelineResult.financial_beneficiary,
    confidence_score: pipelineResult.confidence_score,
    ownership_flow: pipelineResult.ownership_flow?.length || 0,
    agent_execution_trace: pipelineResult.agent_execution_trace ? 'present' : 'missing'
  });

  // Unwrap generated_copy fields to top level for UI compatibility
  const unwrappedResult = unwrapGeneratedCopy(pipelineResult);
  console.log('📦 [UNWRAP] Unwrapped generated_copy fields:', {
    hasHeadline: !!unwrappedResult.headline,
    hasStory: !!unwrappedResult.story,
    hasTagline: !!unwrappedResult.tagline,
    hasOwnershipNotes: !!unwrappedResult.ownership_notes,
    hasBehindTheScenes: !!unwrappedResult.behind_the_scenes,
    hasGeneratedCopy: !!unwrappedResult.hasGeneratedCopy
  });

  // Transform ownership_flow to OwnershipNode[] without blocking logo fetching
  const ownershipChain: OwnershipNode[] = [];
  
  if (unwrappedResult.ownership_flow) {
    for (let index = 0; index < unwrappedResult.ownership_flow.length; index++) {
      const node = unwrappedResult.ownership_flow[index];
      console.log(`🏢 Processing ownership node ${index}:`, node);
      
      // Use better fallback values
      const companyName = node.name || (index === 0 ? unwrappedResult.brand : 'Parent Company');
      const country = node.country || 'Unknown Country';
      const flag = node.flag || '🏳️';
      
      // Don't fetch logos here - they will be fetched asynchronously in the UI
      ownershipChain.push({
        name: companyName,
        country: country,
        countryFlag: flag,
        avatar: `data:image/svg+xml;base64,${btoa(`
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="44" height="44" rx="22" fill="${index === 0 ? '#FF6B6B' : '#4ECDC4'}"/>
            <text x="22" y="28" text-anchor="middle" fill="white" font-family="Inter" font-size="16" font-weight="600">
              ${companyName.charAt(0).toUpperCase()}
            </text>
          </svg>
        `)}`
        // logoUrl will be fetched asynchronously in the UI
      });
    }
  }

  // Transform agent_execution_trace to TraceData[]
  const traces: TraceData[] = [];
  if (unwrappedResult.agent_execution_trace?.sections) {
    console.log('📊 Processing agent execution trace sections:', unwrappedResult.agent_execution_trace.sections.length);
    
    unwrappedResult.agent_execution_trace.sections.forEach((section, sectionIndex) => {
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
  } else if (unwrappedResult.agent_execution_trace?.stages) {
    // Handle legacy trace format
    console.log('📊 Processing legacy agent execution trace stages:', unwrappedResult.agent_execution_trace.stages.length);
    
    unwrappedResult.agent_execution_trace.stages.forEach((stage, index) => {
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

  // Extract owner and brand country from ownership chain
  const firstOwnershipNode = ownershipChain.length > 0 ? ownershipChain[0] : null;
  const lastOwnershipNode = ownershipChain.length > 0 ? ownershipChain[ownershipChain.length - 1] : null;
  const ownerFromChain = lastOwnershipNode?.name;
  const ownerCountryFromChain = lastOwnershipNode?.country;
  const brandCountryFromChain = firstOwnershipNode?.country;
  
  console.log('🏢 [OWNERSHIP_FALLBACK] Extracting owner and brand from chain:', {
    financial_beneficiary: unwrappedResult.financial_beneficiary,
    ownershipChainLength: ownershipChain.length,
    firstNode: firstOwnershipNode,
    lastNode: lastOwnershipNode,
    ownerFromChain,
    ownerCountryFromChain,
    brandCountryFromChain
  });

  const transformedData: ProductResultProps = {
    brand: unwrappedResult.brand ? unwrappedResult.brand.charAt(0).toUpperCase() + unwrappedResult.brand.slice(1) : 'Unknown Brand',
    brandCountry: brandCountryFromChain,
    owner: unwrappedResult.financial_beneficiary || ownerFromChain || 'Unknown Owner',
    ownerCountry: unwrappedResult.beneficiary_country || ownerCountryFromChain,
    ownerFlag: lastOwnershipNode?.countryFlag,
    confidence: unwrappedResult.confidence_score || 0,
    productImage: `data:image/svg+xml;base64,${btoa(`
      <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="128" height="128" rx="64" fill="#FF6B6B"/>
        <text x="64" y="80" text-anchor="middle" fill="white" font-family="Inter" font-size="48" font-weight="600">
          ${(unwrappedResult.brand || 'P').charAt(0).toUpperCase()}
        </text>
      </svg>
    `)}`,
    ownershipChain,
    structureType: unwrappedResult.ownership_structure_type,
    analysisText: unwrappedResult.reasoning,
    traces,
    // Agent results and execution trace for ResearchSummary
    agentResults: unwrappedResult.agent_results,
    agentExecutionTrace: unwrappedResult.agent_execution_trace,
    resultType: unwrappedResult.result_type,
    sources: unwrappedResult.sources,
    // LLM-generated copy for engaging storytelling
    generatedCopy: unwrappedResult.generated_copy,
    // Narrative fields for story display (now properly unwrapped from generated_copy)
    headline: unwrappedResult.headline,
    tagline: unwrappedResult.tagline,
    story: unwrappedResult.story,
    ownership_notes: unwrappedResult.ownership_notes,
    behind_the_scenes: unwrappedResult.behind_the_scenes,
    narrative_template_used: unwrappedResult.narrative_template_used,
    // Gemini verification fields
    verificationStatus: unwrappedResult.verification_status,
    verificationConfidenceChange: unwrappedResult.verification_confidence_change,
    verificationEvidence: unwrappedResult.verification_evidence,
    verifiedAt: unwrappedResult.verified_at,
    verificationMethod: unwrappedResult.verification_method,
    confidenceAssessment: unwrappedResult.confidence_assessment,
    verificationNotes: unwrappedResult.verification_notes,
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

  // DEBUG: Log verification fields in transformed data
  if (typeof window !== "undefined") {
    console.log('[DEBUG: TRANSFORMED_PROPS] Verification fields:', {
      verificationStatus: transformedData.verificationStatus,
      verifiedAt: transformedData.verifiedAt,
      verificationMethod: transformedData.verificationMethod,
      verificationNotes: transformedData.verificationNotes,
      confidenceAssessment: transformedData.confidenceAssessment,
      verificationEvidence: transformedData.verificationEvidence,
      verificationConfidenceChange: transformedData.verificationConfidenceChange
    });
  }

  return transformedData;
} 