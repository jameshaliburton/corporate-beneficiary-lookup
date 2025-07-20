import { NextRequest, NextResponse } from 'next/server'
import { evaluationFramework } from '@/lib/services/evaluation-framework'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      result_id, 
      trace_id, 
      prompt_id, 
      prompt_version, 
      use_original_input = true 
    } = body
    
    if (!result_id && !trace_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either result_id or trace_id is required' 
      }, { status: 400 })
    }

    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    // In a real implementation, this would trigger a rerun with the specified parameters
    console.log('Rerun requested:', {
      result_id,
      trace_id,
      prompt_id,
      prompt_version,
      use_original_input
    })
    
    // For now, return a mock response indicating the rerun was initiated
    const rerunId = `rerun_${Date.now()}`
    
    return NextResponse.json({ 
      success: true, 
      rerun_id: rerunId,
      message: 'Rerun initiated successfully',
      status: 'queued',
      estimated_completion: new Date(Date.now() + 30000).toISOString() // 30 seconds from now
    })
  } catch (error) {
    console.error('[Evaluation V3 Rerun API] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 