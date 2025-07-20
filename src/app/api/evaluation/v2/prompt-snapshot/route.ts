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
    
    // Get evaluation results to find the prompt snapshot
    const results = await evaluationFramework.getEvaluationResults()
    const result = results.find((r: any) => r.trace_id === trace_id)
    
    if (!result || !result.prompt_snapshot) {
      return NextResponse.json({ success: false, error: 'No prompt snapshot found for this trace' }, { status: 404 })
    }

    // Parse the prompt snapshot
    let prompt
    try {
      prompt = {
        id: `snapshot_${trace_id}`,
        name: 'Ownership Research Agent',
        version: 'snapshot',
        content: result.prompt_snapshot,
        created_at: result.run_timestamp || new Date().toISOString(),
        is_current: false
      }
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Failed to parse prompt snapshot' }, { status: 500 })
    }

    return NextResponse.json({ success: true, prompt })
  } catch (error) {
    console.error('[Evaluation V2 Prompt Snapshot API] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 