import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { evaluationFramework } from '@/lib/services/evaluation-framework'
import { EnhancedAgentOwnershipResearch } from '@/lib/agents/enhanced-ownership-research-agent'

// Helper to parse ISO date or return null
function parseDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export async function GET(request: NextRequest) {
  try {
    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'cases':
        const cases = await evaluationFramework.getEvaluationCases()
        return NextResponse.json({ success: true, cases })
        
      case 'results':
        const results = await evaluationFramework.getEvaluationResults()
        return NextResponse.json({ success: true, results })
        
      case 'stats':
        const stats = await evaluationFramework.getEvaluationStats()
        return NextResponse.json({ success: true, stats })
        
      case 'steps':
        const trace_id = searchParams.get('trace_id')
        if (!trace_id) {
          return NextResponse.json({ success: false, error: 'trace_id is required' }, { status: 400 })
        }
        const steps = await evaluationFramework.getEvaluationSteps(trace_id)
        return NextResponse.json({ success: true, steps })
        
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Evaluation API] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    const body = await request.json()
    const { action, data } = body
    
    switch (action) {
      case 'run_test':
        const { test_id, barcode, product_name, brand } = data
        
        if (!test_id || !brand) {
          return NextResponse.json({ success: false, error: 'test_id and brand are required' }, { status: 400 })
        }
        
        // Run the enhanced ownership research agent with evaluation enabled
        const result = await EnhancedAgentOwnershipResearch({
          barcode: barcode || `test_${test_id}`,
          product_name: product_name || '',
          brand,
          hints: { test_id },
          enableEvaluation: true
        })
        
        return NextResponse.json({ success: true, result })
        
      case 'add_case':
        const caseData = data
        await evaluationFramework.addEvaluationCase(caseData)
        return NextResponse.json({ success: true, message: 'Evaluation case added' })
        
      case 'add_mapping':
        const mappingData = data
        await evaluationFramework.addOwnershipMapping(mappingData)
        return NextResponse.json({ success: true, message: 'Ownership mapping added' })
        
      case 'compare':
        const { test_id: compare_test_id, actual_result } = data
        const comparison = await evaluationFramework.compareEvaluation(compare_test_id, actual_result)
        return NextResponse.json({ success: true, comparison })
        
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Evaluation API] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 