import { NextRequest, NextResponse } from 'next/server'
import { evaluationFramework } from '@/lib/services/evaluation-framework'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trace_id, step_id, step_type } = body
    
    if (!trace_id || !step_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'trace_id and step_id are required' 
      }, { status: 400 })
    }

    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    // In a real implementation, this would rerun the specific step
    console.log('Step rerun requested:', {
      trace_id,
      step_id,
      step_type
    })
    
    // For now, return a mock response indicating the step rerun was initiated
    const stepRerunId = `step_rerun_${Date.now()}`
    
    return NextResponse.json({ 
      success: true, 
      step_rerun_id: stepRerunId,
      message: 'Step rerun initiated successfully',
      status: 'queued',
      estimated_completion: new Date(Date.now() + 15000).toISOString() // 15 seconds from now
    })
  } catch (error) {
    console.error('[Evaluation V3 Rerun Step API] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 