import { NextRequest, NextResponse } from 'next/server'
import { evaluationFramework } from '../../../lib/services/evaluation-framework.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const caseId = searchParams.get('case_id')
    const sheetName = searchParams.get('sheet')

    switch (action) {
      case 'stats':
        const stats = await evaluationFramework.getEvaluationStats()
        return NextResponse.json({ success: true, stats })

      case 'cases':
        const status = searchParams.get('status')
        const cases = await evaluationFramework.getEvaluationCases(status)
        return NextResponse.json({ success: true, cases })

      case 'human_ratings':
        if (!caseId) {
          return NextResponse.json({ success: false, error: 'case_id required' }, { status: 400 })
        }
        const ratings = await evaluationFramework.getHumanRatings(caseId)
        return NextResponse.json({ success: true, ratings })

      case 'ai_results':
        if (!caseId) {
          return NextResponse.json({ success: false, error: 'case_id required' }, { status: 400 })
        }
        const agentVersion = searchParams.get('agent_version')
        const results = await evaluationFramework.getAIResults(caseId, agentVersion)
        return NextResponse.json({ success: true, results })

      case 'comparison':
        if (!caseId) {
          return NextResponse.json({ success: false, error: 'case_id required' }, { status: 400 })
        }
        const comparison = await evaluationFramework.compareEvaluations(caseId)
        return NextResponse.json({ success: true, comparison })

      case 'validate_case':
        if (!caseId) {
          return NextResponse.json({ success: false, error: 'case_id required' }, { status: 400 })
        }
        const isValid = await evaluationFramework.validateCaseId(caseId)
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

      case 'add_ai_result':
        if (!data?.case_id) {
          return NextResponse.json({ success: false, error: 'case_id required' }, { status: 400 })
        }
        const result = await evaluationFramework.addAIResult(data)
        return NextResponse.json({ success: true, result })

      case 'generate_url':
        if (!data?.case_id) {
          return NextResponse.json({ success: false, error: 'case_id required' }, { status: 400 })
        }
        const url = evaluationFramework.generateCaseUrl(data.case_id)
        return NextResponse.json({ success: true, url })

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