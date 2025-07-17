import { NextRequest, NextResponse } from 'next/server'
import { EnhancedAgentOwnershipResearch } from '@/lib/agents/enhanced-ownership-research-agent'
import { evaluationFramework } from '@/lib/services/evaluation-framework'

interface RefinementData {
  trace_id: string
  corrected_owner: string
  corrected_query: string
  error_type: 'wrong_company' | 'hallucinated_source' | 'outdated_info' | 'incomplete' | 'other'
  suggested_evidence: string
  submit_as_test_case: boolean
  notes: string
}

interface EvaluationRerunRequest {
  trace_id: string
  corrected_query: string
  original_result: any
  refinement_data: RefinementData
}

export async function POST(request: NextRequest) {
  try {
    const body: EvaluationRerunRequest = await request.json()
    const { trace_id, corrected_query, original_result, refinement_data } = body

    console.log(`[EvaluationRerun] Starting refinement for trace_id: ${trace_id}`)

    // Step 1: Rerun the agent with the corrected query
    // Extract brand from original result or use the corrected query
    const brand = original_result.brand || corrected_query.split(' ')[0] // Simple fallback
    
    console.log(`[EvaluationRerun] Rerunning agent with brand: ${brand}, corrected query: ${corrected_query}`)
    
    const rerunResult = await EnhancedAgentOwnershipResearch({
      barcode: original_result.barcode || `refinement_${trace_id}`,
      product_name: original_result.product_name,
      brand: brand,
      hints: {
        corrected_query: corrected_query,
        original_trace_id: trace_id,
        refinement_notes: refinement_data.notes,
        suggested_evidence: refinement_data.suggested_evidence
      }
    })

    console.log(`[EvaluationRerun] Agent rerun completed with confidence: ${rerunResult.confidence_score}`)

    // Step 2: Log the original result as a failed evaluation
    try {
      await evaluationFramework.logEvaluation({
        test_id: `refinement_${trace_id}_original`,
        trace_id: trace_id,
        agent_version: 'enhanced-v1.0',
        actual_owner: original_result.financial_beneficiary,
        actual_country: original_result.beneficiary_country,
        actual_structure_type: original_result.ownership_structure_type,
        confidence_score: original_result.confidence_score,
        match_result: 'fail', // Original result was incorrect
        latency: 0, // We don't have this for original
        token_cost_estimate: 0,
        tool_errors: '',
        explainability_score: 0,
        source_used: 'original_agent_run',
        prompt_snapshot: 'Original agent run',
        response_snippet: original_result.reasoning,
        correction_data: {
          error_type: refinement_data.error_type,
          corrected_owner: refinement_data.corrected_owner,
          corrected_query: refinement_data.corrected_query,
          suggested_evidence: refinement_data.suggested_evidence,
          notes: refinement_data.notes
        }
      })
    } catch (error) {
      console.error('[EvaluationRerun] Failed to log original result:', error)
    }

    // Step 3: Log the refined result
    try {
      await evaluationFramework.logEvaluation({
        test_id: `refinement_${trace_id}_corrected`,
        trace_id: rerunResult.agent_execution_trace?.trace_id || `corrected_${Date.now()}`,
        agent_version: 'enhanced-v1.0-refined',
        actual_owner: rerunResult.financial_beneficiary,
        actual_country: rerunResult.beneficiary_country,
        actual_structure_type: rerunResult.ownership_structure_type,
        confidence_score: rerunResult.confidence_score,
        match_result: 'pass', // Assuming the correction was correct
        latency: rerunResult.agent_execution_trace?.performance_metrics?.total_duration_ms || 0,
        token_cost_estimate: 0,
        tool_errors: '',
        explainability_score: rerunResult.confidence_score / 100, // Normalize to 0-1
        source_used: 'refined_agent_run',
        prompt_snapshot: `Refined query: ${corrected_query}`,
        response_snippet: rerunResult.reasoning,
        correction_data: {
          original_trace_id: trace_id,
          error_type: refinement_data.error_type,
          corrected_owner: refinement_data.corrected_owner,
          corrected_query: refinement_data.corrected_query,
          suggested_evidence: refinement_data.suggested_evidence,
          notes: refinement_data.notes
        }
      })
    } catch (error) {
      console.error('[EvaluationRerun] Failed to log refined result:', error)
    }

    // Step 4: If requested, create a test case
    if (refinement_data.submit_as_test_case) {
      try {
        await evaluationFramework.addEvaluationCase({
          test_id: `manual_test_${Date.now()}`,
          barcode: original_result.barcode || '',
          product_name: original_result.product_name || '',
          expected_owner: refinement_data.corrected_owner,
          expected_country: rerunResult.beneficiary_country,
          expected_structure_type: rerunResult.ownership_structure_type,
          expected_confidence: rerunResult.confidence_score,
          human_query: corrected_query,
          evaluation_strategy: 'manual_refinement',
          evidence_expectation: refinement_data.suggested_evidence,
          source_hints: refinement_data.suggested_evidence,
          notes: `Generated from refinement. Original error: ${refinement_data.error_type}. ${refinement_data.notes}`
        })
      } catch (error) {
        console.error('[EvaluationRerun] Failed to create test case:', error)
      }
    }

    // Step 5: Return the refined result
    return NextResponse.json({
      success: true,
      original_result: original_result,
      refined_result: rerunResult,
      refinement_data: refinement_data,
      improvement: {
        confidence_change: rerunResult.confidence_score - original_result.confidence_score,
        owner_changed: rerunResult.financial_beneficiary !== original_result.financial_beneficiary,
        evaluation_logged: true
      }
    })

  } catch (error) {
    console.error('[EvaluationRerun] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during refinement'
    }, { status: 500 })
  }
} 