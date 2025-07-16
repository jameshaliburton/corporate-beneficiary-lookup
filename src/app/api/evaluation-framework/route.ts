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
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
        const cases = await evaluationFramework.getEvaluationCases(limit)
        return NextResponse.json({ success: true, cases })

      case 'results':
        const resultsLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
        const results = await evaluationFramework.getEvaluationResults(resultsLimit)
        return NextResponse.json({ success: true, results })

      case 'steps':
        if (!caseId) {
          return NextResponse.json({ success: false, error: 'trace_id required' }, { status: 400 })
        }
        const steps = await evaluationFramework.getEvaluationSteps(caseId)
        return NextResponse.json({ success: true, steps })

      case 'mappings':
        const mappingsLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 1000
        const mappings = await evaluationFramework.getOwnershipMappings(mappingsLimit)
        return NextResponse.json({ success: true, mappings })

      case 'validate_case':
        if (!caseId) {
          return NextResponse.json({ success: false, error: 'test_id required' }, { status: 400 })
        }
        const isValid = await evaluationFramework.validateTestId(caseId)
        return NextResponse.json({ success: true, valid: isValid })

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
        const title = data?.title || 'Agent Evaluation Framework'
        const spreadsheetId = await evaluationFramework.createEvaluationSpreadsheet(title)
        return NextResponse.json({ success: true, spreadsheetId })

      case 'add_case':
        if (!data?.test_id) {
          return NextResponse.json({ success: false, error: 'test_id required' }, { status: 400 })
        }
        const result = await evaluationFramework.addEvaluationCase(data)
        return NextResponse.json({ success: true, result })

      case 'log_evaluation':
        if (!data?.test_id) {
          return NextResponse.json({ success: false, error: 'test_id required' }, { status: 400 })
        }
        const steps = data.steps || []
        const logged = await evaluationFramework.logEvaluation(data, steps)
        return NextResponse.json({ success: true, logged })

      case 'add_mapping':
        if (!data?.brand_name) {
          return NextResponse.json({ success: false, error: 'brand_name required' }, { status: 400 })
        }
        const mapping = await evaluationFramework.addOwnershipMapping(data)
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