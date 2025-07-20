import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { evaluationFramework } from '@/lib/services/evaluation-framework'

export async function GET(request: NextRequest) {
  try {
    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    // Get data from multiple sources
    const [supabaseData, sheetsData] = await Promise.all([
      // Get live scans from Supabase
      supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      
      // Get evaluation data from Google Sheets (with fallback)
      evaluationFramework.getEvaluationResults().catch(() => [])
    ])

    const liveScans = supabaseData.data || []
    const evalScans = sheetsData || []
    
    // Transform and combine results
    const results = [
      // Transform live scans
      ...liveScans.map((scan: any) => ({
        id: scan.id,
        brand: scan.brand || 'Unknown',
        product_name: scan.product_name,
        owner: scan.owner || 'Unknown',
        confidence_score: scan.confidence_score || 0,
        country: scan.country || 'Unknown',
        source_type: 'live' as const,
        timestamp: scan.created_at,
        trace_id: scan.trace_id,
        latency: scan.latency,
        token_cost_estimate: scan.token_cost_estimate,
        match_result: null // Live scans don't have expected results
      })),
      
      // Transform evaluation scans
      ...evalScans.map((scan: any) => ({
        id: `eval_${scan.test_id || scan.trace_id || Date.now()}`,
        brand: scan.brand || scan.actual_owner || 'Unknown',
        product_name: scan.product_name,
        owner: scan.actual_owner || 'Unknown',
        confidence_score: scan.confidence_score || 0,
        country: scan.actual_country || 'Unknown',
        source_type: scan.source_type || 'eval' as const,
        timestamp: scan.run_timestamp || new Date().toISOString(),
        trace_id: scan.trace_id,
        test_id: scan.test_id,
        match_result: scan.match_result,
        latency: scan.latency,
        token_cost_estimate: scan.token_cost_estimate
      }))
    ]

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ 
      success: true, 
      results,
      summary: {
        total: results.length,
        live: liveScans.length,
        eval: evalScans.length,
        sheets_accessible: evalScans.length > 0
      }
    })
  } catch (error) {
    console.error('[Evaluation V2 Results API] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 