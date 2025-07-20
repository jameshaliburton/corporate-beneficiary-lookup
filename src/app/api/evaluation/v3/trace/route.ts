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
    
    // Get trace steps from evaluation framework
    const steps = await evaluationFramework.getTraceSteps(traceId).catch(() => [])
    
    // If no steps found, create a mock trace for demonstration
    if (steps.length === 0) {
      const mockSteps = [
        {
          id: 'step_1',
          type: 'enhanced_ownership_research',
          agent_name: 'Enhanced Ownership Research Agent',
          input: {
            brand: 'Sample Brand',
            product_name: 'Sample Product',
            barcode: '1234567890'
          },
          output: {
            financial_beneficiary: 'Sample Corp',
            beneficiary_country: 'United States',
            ownership_structure_type: 'Private',
            confidence_score: 85,
            sources: ['Web research', 'Company database'],
            reasoning: 'Found clear ownership information in company database'
          },
          duration: 2500,
          confidence_score: 85,
          completed: true,
          error: null,
          metadata: {
            tokens_used: 1500,
            model: 'gpt-4',
            temperature: 0.1
          },
          prompt: {
            system_prompt: 'You are a corporate ownership researcher...',
            user_prompt: 'Research ownership for Sample Brand...'
          }
        },
        {
          id: 'step_2',
          type: 'verification',
          agent_name: 'Verification Agent',
          input: {
            ownership_result: {
              financial_beneficiary: 'Sample Corp',
              beneficiary_country: 'United States'
            }
          },
          output: {
            verified: true,
            verification_score: 90,
            additional_sources: ['SEC filings', 'Annual report']
          },
          duration: 1200,
          confidence_score: 90,
          completed: true,
          error: null,
          metadata: {
            tokens_used: 800,
            model: 'gpt-4',
            temperature: 0.1
          }
        }
      ]
      
      return NextResponse.json({ 
        success: true, 
        steps: mockSteps,
        trace_id: traceId,
        note: 'Mock trace data for demonstration'
      })
    }

    return NextResponse.json({ 
      success: true, 
      steps,
      trace_id: traceId
    })
  } catch (error) {
    console.error('[Evaluation V3 Trace API] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 