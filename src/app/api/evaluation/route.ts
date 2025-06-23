import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Helper to parse ISO date or return null
function parseDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    if (action === 'reset') {
      // Optionally, you could truncate the table here
      // await supabase.from('evaluation_metrics').delete().neq('id', '')
      return NextResponse.json({
        success: false,
        message: 'Reset not supported for persistent metrics. Truncate table manually if needed.'
      })
    }

    // Filtering
    const barcode = searchParams.get('barcode')
    const brand = searchParams.get('brand')
    const start = parseDate(searchParams.get('start'))
    const end = parseDate(searchParams.get('end'))

    let query = supabase.from('evaluation_metrics').select('*')
    if (barcode) query = query.eq('barcode', barcode)
    if (brand) query = query.eq('brand', brand)
    if (start) query = query.gte('timestamp', start)
    if (end) query = query.lte('timestamp', end)

    const { data: rows, error } = await query
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Aggregate metrics
    const metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      successRate: 0,
      avgResponseTime: 0,
      avgSourceQuality: 0,
      ignoredViableSources: 0,
      usedWebResearch: 0,
      hallucinationDetected: 0,
      failurePatterns: {},
      sourceUsagePatterns: {},
      confidenceAccuracy: []
    }
    let totalResponseTime = 0
    let totalSourceQuality = 0
    let sourceQualityCount = 0

    for (const row of rows) {
      metrics.totalQueries++
      const evalData = row.evaluation || {}
      const result = row.result || {}
      if (result.financial_beneficiary !== 'Unknown' && result.confidence_score >= 30) {
        metrics.successfulQueries++
      } else {
        metrics.failedQueries++
      }
      if (evalData.responseTime) {
        totalResponseTime += evalData.responseTime
      }
      if (evalData.sourceQualityScore) {
        totalSourceQuality += evalData.sourceQualityScore
        sourceQualityCount++
      }
      if (evalData.viableSourcesIgnored) {
        metrics.ignoredViableSources += evalData.viableSourcesIgnored
      }
      if (evalData.webResearchUsed) {
        metrics.usedWebResearch++
      }
      if (Array.isArray(evalData.hallucinationIndicators) && evalData.hallucinationIndicators.length > 0) {
        metrics.hallucinationDetected++
      }
      // Failure patterns
      if (Array.isArray(evalData.hallucinationIndicators) && evalData.hallucinationIndicators.length > 0) {
        metrics.failurePatterns['hallucination'] = (metrics.failurePatterns['hallucination'] || 0) + 1
      } else if (result.financial_beneficiary === 'Unknown' || result.confidence_score < 30) {
        metrics.failurePatterns['insufficient_data'] = (metrics.failurePatterns['insufficient_data'] || 0) + 1
      }
      // Source usage patterns
      if (evalData.sourceUsagePattern && typeof evalData.sourceUsagePattern === 'object') {
        const { available = 0, used = 0 } = evalData.sourceUsagePattern
        const key = `${available}_${used}`
        metrics.sourceUsagePatterns[key] = (metrics.sourceUsagePatterns[key] || 0) + 1
      }
      // Confidence accuracy (future use)
      if (evalData.confidenceAccuracy) {
        metrics.confidenceAccuracy.push(evalData.confidenceAccuracy)
      }
    }
    metrics.successRate = metrics.totalQueries > 0 ? Math.round((metrics.successfulQueries / metrics.totalQueries) * 10000) / 100 : 0
    metrics.avgResponseTime = metrics.totalQueries > 0 ? Math.round(totalResponseTime / metrics.totalQueries) : 0
    metrics.avgSourceQuality = sourceQualityCount > 0 ? Math.round((totalSourceQuality / sourceQualityCount) * 100) / 100 : 0

    return NextResponse.json({
      success: true,
      metrics,
      count: rows.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Evaluation API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'reset') {
      // Optionally, you could truncate the table here
      // await supabase.from('evaluation_metrics').delete().neq('id', '')
      return NextResponse.json({
        success: false,
        message: 'Reset not supported for persistent metrics. Truncate table manually if needed.'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('[Evaluation API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 