import { NextRequest, NextResponse } from 'next/server'
import { evaluationFramework } from '@/lib/services/evaluation-framework'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      result_id, 
      issue, 
      suggested_fix, 
      prompt_override, 
      agent_type 
    } = body
    
    if (!result_id || !issue) {
      return NextResponse.json({ 
        success: false, 
        error: 'result_id and issue are required' 
      }, { status: 400 })
    }

    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    // In a real implementation, this would save the feedback to Google Sheets
    console.log('Feedback submitted:', {
      result_id,
      issue,
      suggested_fix,
      prompt_override: prompt_override ? 'provided' : 'not provided',
      agent_type
    })
    
    // For now, return a mock response indicating the feedback was saved
    const feedbackId = `feedback_${Date.now()}`
    
    return NextResponse.json({ 
      success: true, 
      feedback_id: feedbackId,
      message: 'Feedback submitted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Evaluation V3 Feedback API] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 