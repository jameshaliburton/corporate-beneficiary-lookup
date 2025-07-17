import { NextRequest, NextResponse } from 'next/server'
import { evaluationFramework } from '../../../lib/services/evaluation-framework.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const caseId = searchParams.get('case_id')

    switch (action) {
      case 'stats':
        const stats = await evaluationFramework.getEvaluationStats()
        return NextResponse.json({ success: true, stats })

      case 'cases':
        const cases = await evaluationFramework.getEvaluationCases()
        return NextResponse.json({ success: true, cases })

      case 'results':
        const results = await evaluationFramework.googleSheets.getEvaluationResults(100)
        return NextResponse.json({ success: true, results })

      case 'steps':
        if (!caseId) {
          return NextResponse.json({ success: false, error: 'trace_id required' }, { status: 400 })
        }
        const steps = await evaluationFramework.googleSheets.getEvaluationSteps(caseId)
        return NextResponse.json({ success: true, steps })

      case 'mappings':
        const mappings = await evaluationFramework.googleSheets.getOwnershipMappings(1000)
        return NextResponse.json({ success: true, mappings })

      case 'validate_case':
        if (!caseId) {
          return NextResponse.json({ success: false, error: 'test_id required' }, { status: 400 })
        }
        const isValid = await evaluationFramework.googleSheets.checkOwnershipMapping(caseId)
        return NextResponse.json({ success: true, valid: !!isValid })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[EvaluationFramework API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'create_spreadsheet':
        // Multi-sheet setup is pre-configured, no need to create spreadsheets
        return NextResponse.json({ 
          success: true, 
          message: 'Multi-sheet setup is pre-configured',
          sheetIds: {
            evaluation_cases: '1m5P9LxLg_g_tek2m1DQZJf2WnrRlp4N-Y00UksUdCA0',
            evaluation_results: '1goFKiB9Khp4R0ASvVqn3TbGX2YW1gFVVToPYK9foBKo',
            evaluation_steps: '1BSq_d9dZzI1N-NOuT_uJff5eZUO5BN7cEh3bwrbQvmg',
            ownership_mappings: '1Pa844D_sTypLVNxRphJPCCEfOP03sHWIYLmiXCNT9vs'
          }
        })

      case 'add_case':
        if (!data?.test_id) {
          return NextResponse.json({ success: false, error: 'test_id required' }, { status: 400 })
        }
        const result = await evaluationFramework.googleSheets.addEvaluationResult(data)
        return NextResponse.json({ success: true, result })

      case 'log_evaluation':
        if (!data?.test_id) {
          return NextResponse.json({ success: false, error: 'test_id required' }, { status: 400 })
        }
        const steps = data.steps || []
        const logged = await evaluationFramework.googleSheets.logCompleteEvaluation(data, steps)
        return NextResponse.json({ success: true, logged })

      case 'add_mapping':
        if (!data?.brand_name) {
          return NextResponse.json({ success: false, error: 'brand_name required' }, { status: 400 })
        }
        const mapping = await evaluationFramework.googleSheets.addOwnershipMapping(data)
        return NextResponse.json({ success: true, mapping })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[EvaluationFramework API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 