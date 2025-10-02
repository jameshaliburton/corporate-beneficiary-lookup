// Shared utility for transforming pipeline data to ProductResult props
// Extracted from test-simple-pipeline page for reuse across camera and manual flows

import { findCompanyLogo } from '@/lib/services/logo-finder';

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
  // New narrative fields from enhanced pipeline
  narrative_fields?: {
    headline?: string;
    tagline?: string;
    story?: string;
    ownership_notes?: string[];
    behind_the_scenes?: string[];
    template_used?: string;
  };
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
  owner: string;
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
  // New narrative fields from enhanced pipeline
  headline?: string;
  tagline?: string;
  story?: string;
  ownership_notes?: string[];
  behind_the_scenes?: string[];
  narrative_template_used?: string;
}

export async function transformPipelineData(pipelineResult: PipelineResult): Promise<ProductResultProps> {
  console.log('🔄 Transforming pipeline data:', {
    brand: pipelineResult.brand,
    financial_beneficiary: pipelineResult.financial_beneficiary,
    confidence_score: pipelineResult.confidence_score,
    ownership_flow: pipelineResult.ownership_flow?.length || 0,
    agent_execution_trace: pipelineResult.agent_execution_trace ? 'present' : 'missing'
  });

  console.log('📖 Narrative fields check:', {
    has_narrative_fields: !!pipelineResult.narrative_fields,
    has_generated_copy: !!pipelineResult.generated_copy,
    narrative_headline: pipelineResult.narrative_fields?.headline,
    narrative_story: pipelineResult.narrative_fields?.story,
    generated_copy_headline: pipelineResult.generated_copy?.headline
  });

  // Transform ownership_flow to OwnershipNode[] without blocking logo fetching
  const ownershipChain: OwnershipNode[] = [];
  
  if (pipelineResult.ownership_flow) {
    for (let index = 0; index < pipelineResult.ownership_flow.length; index++) {
      const node = pipelineResult.ownership_flow[index];
      console.log(`🏢 Processing ownership node ${index}:`, node);
      
      // Use better fallback values
      const companyName = node.name || (index === 0 ? pipelineResult.brand : 'Parent Company');
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

  const transformedData: ProductResultProps = {
    brand: pipelineResult.brand ? pipelineResult.brand.charAt(0).toUpperCase() + pipelineResult.brand.slice(1) : 'Unknown Brand',
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
    // Agent results and execution trace for ResearchSummary
    agentResults: pipelineResult.agent_results,
    agentExecutionTrace: pipelineResult.agent_execution_trace,
    resultType: pipelineResult.result_type,
    sources: pipelineResult.sources,
    // LLM-generated copy for engaging storytelling
    generatedCopy: pipelineResult.generated_copy,
    // New narrative fields from enhanced pipeline (prefer narrative_fields over generated_copy)
    headline: pipelineResult.narrative_fields?.headline || pipelineResult.generated_copy?.headline,
    tagline: pipelineResult.narrative_fields?.tagline || pipelineResult.generated_copy?.subheadline,
    story: pipelineResult.narrative_fields?.story || pipelineResult.generated_copy?.description,
    ownership_notes: pipelineResult.narrative_fields?.ownership_notes || [],
    behind_the_scenes: pipelineResult.narrative_fields?.behind_the_scenes || [],
    narrative_template_used: pipelineResult.narrative_fields?.template_used || 'fallback',
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
} 