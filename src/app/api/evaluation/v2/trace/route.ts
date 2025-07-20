import { NextRequest, NextResponse } from 'next/server'
import { evaluationFramework } from '@/lib/services/evaluation-framework'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trace_id = searchParams.get('trace_id')
    
    if (!trace_id) {
      return NextResponse.json({ success: false, error: 'trace_id is required' }, { status: 400 })
    }

    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    // Get trace steps from Google Sheets
    const steps = await evaluationFramework.getEvaluationSteps(trace_id)
    
    // Transform steps to match our interface
    const transformedSteps = steps.map((step: any) => ({
      step_number: step.step_number || 0,
      step_name: step.step_name || 'Unknown Step',
      agent_tool: step.agent_tool || step.agent || 'Unknown',
      input: step.input || '',
      output: step.output || '',
      outcome: step.outcome || 'unknown',
      latency: step.latency || 0,
      tool_used: step.tool_used || '',
      fallback_used: step.fallback_used || false,
      notes: step.notes || ''
    }))

    return NextResponse.json({ success: true, steps: transformedSteps })
  } catch (error) {
    console.error('[Evaluation V2 Trace API] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 