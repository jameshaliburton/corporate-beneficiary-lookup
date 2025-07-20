import { NextRequest, NextResponse } from 'next/server'
import { evaluationFramework } from '@/lib/services/evaluation-framework'
import { EnhancedAgentOwnershipResearch } from '@/lib/agents/enhanced-ownership-research-agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trace_id, custom_prompt, prompt_version, action } = body
    
    if (!trace_id) {
      return NextResponse.json({ success: false, error: 'trace_id is required' }, { status: 400 })
    }

    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    // Get the original result to extract input parameters
    const results = await evaluationFramework.getEvaluationResults()
    const originalResult = results.find((r: any) => r.trace_id === trace_id)
    
    if (!originalResult) {
      return NextResponse.json({ success: false, error: 'Original result not found' }, { status: 404 })
    }

    // Extract input parameters from original result
    const inputParams = {
      barcode: originalResult.barcode || `retry_${trace_id}`,
      product_name: originalResult.product_name || '',
      brand: originalResult.brand || originalResult.actual_owner || 'Unknown',
      hints: { 
        test_id: originalResult.test_id,
        original_trace_id: trace_id,
        retry_reason: action
      },
      enableEvaluation: true
    }

    // Run the enhanced ownership research agent
    const result = await EnhancedAgentOwnershipResearch(inputParams)
    
    // Log the rerun result
    const evaluationData = {
      test_id: originalResult.test_id || `retry_${trace_id}`,
      trace_id: result.trace_id,
      agent_version: 'retry',
      actual_owner: result.owner,
      actual_country: result.country,
      actual_structure_type: result.structure_type,
      confidence_score: result.confidence_score,
      match_result: originalResult.match_result, // Keep original expected result
      latency: result.latency,
      token_cost_estimate: result.token_cost_estimate,
      tool_errors: result.errors?.join(', ') || '',
      explainability_score: result.explainability_score,
      source_used: result.sources?.join(', ') || '',
      prompt_snapshot: custom_prompt || originalResult.prompt_snapshot,
      response_snippet: result.response?.substring(0, 500) || '',
      run_timestamp: new Date().toISOString()
    }

    await evaluationFramework.logEvaluation(evaluationData, result.steps || [])
    
    return NextResponse.json({ 
      success: true, 
      result: evaluationData,
      message: 'Rerun completed successfully'
    })
  } catch (error) {
    console.error('[Evaluation V2 Rerun API] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 