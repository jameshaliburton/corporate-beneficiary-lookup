import { NextRequest, NextResponse } from 'next/server'
import { evaluationFramework } from '@/lib/services/evaluation-framework'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const traceId = searchParams.get('trace_id')
    
    if (!traceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'trace_id parameter is required' 
      }, { status: 400 })
    }

    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    // Get prompt snapshot from evaluation framework
    const snapshot = await evaluationFramework.getPromptSnapshot(traceId).catch(() => null)
    
    // If no snapshot found, create a mock snapshot for demonstration
    if (!snapshot) {
      const mockSnapshot = {
        system_prompt: `You are a corporate ownership researcher tasked with identifying the ultimate financial beneficiary of the brand "Sample Brand". Your goal is to establish clear, evidence-based ownership relationships while maintaining high accuracy and avoiding assumptions.

RESEARCH STRATEGY:
1. Primary Sources (Highest Priority):
   - SEC filings, annual reports, official regulatory documents
   - Company's own investor relations or corporate structure pages
   - Stock exchange listings and official business registries

2. Secondary Sources (Medium Priority):
   - Financial news from reputable sources (Bloomberg, Reuters, FT, WSJ)
   - Business databases (OpenCorporates, D&B, ZoomInfo)
   - Press releases about acquisitions, mergers, or ownership changes

3. Supporting Sources (Low Priority):
   - Industry analysis reports
   - Company history pages
   - News articles about company operations

ANALYSIS FRAMEWORK:
1. Ownership Structure:
   - Direct ownership: Who directly owns the brand?
   - Ultimate ownership: Follow the chain up to the ultimate beneficiary
   - Structure type: Public, Private, Subsidiary, Cooperative, or State-owned

2. Evidence Quality:
   - Direct statements of ownership (strongest)
   - Official documentation (very strong)
   - Recent financial news (strong)
   - Indirect references (weak)
   - Regional/market presence (not evidence of ownership)

3. Confidence Assessment:
   - Multiple high-quality sources (90-100%)
   - Single high-quality source (70-89%)
   - Multiple secondary sources (50-69%)
   - Single secondary source (30-49%)
   - Weak/unclear evidence (<30%)

CRITICAL GUIDELINES:
1. Evidence-Based: Every ownership claim must be supported by specific evidence
2. Source Quality: Prioritize official and financial sources over general web content
3. Chain of Ownership: Map the complete ownership chain when possible
4. Uncertainty: Default to "Unknown" when evidence is insufficient
5. Regional Context: Use location only for finding relevant sources, never for assumptions
6. Time Sensitivity: Prefer recent sources, especially for ownership changes
7. Conflicting Data: Address and explain any contradictory information
8. Source Utilization: Use ALL available sources, especially high-quality ones
9. Specific Evidence: Quote or reference specific content from sources when making claims

OUTPUT REQUIREMENTS:
You must respond with a VALID JSON object containing ONLY the following fields:

{
  "financial_beneficiary": "Ultimate owner or Unknown",
  "beneficiary_country": "Country of owner or Unknown",
  "ownership_structure_type": "Public/Private/Subsidiary/Cooperative/State-owned/Unknown",
  "confidence_score": 0-100,
  "sources": ["array", "of", "specific", "sources"],
  "reasoning": "Clear explanation with evidence and source references"
}`,
        user_prompt: `Please research the ownership of Sample Brand (Sample Product).

Brand: Sample Brand
Product: Sample Product
Barcode: 1234567890

Please provide a comprehensive analysis of the ownership structure, including the ultimate financial beneficiary, country of origin, and ownership structure type. Use the research strategy outlined above and provide specific evidence for your conclusions.`,
        agent_type: 'enhanced_ownership_research',
        version: 'v1.0',
        timestamp: new Date().toISOString()
      }
      
      return NextResponse.json({ 
        success: true, 
        snapshot: mockSnapshot,
        note: 'Mock prompt snapshot for demonstration'
      })
    }

    return NextResponse.json({ 
      success: true, 
      snapshot
    })
  } catch (error) {
    console.error('[Evaluation V3 Prompt Snapshot API] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 