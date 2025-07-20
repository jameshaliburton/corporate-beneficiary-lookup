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
    
    // Calculate metrics
    const totalScans = liveScans.length + evalScans.length
    const avgConfidence = totalScans > 0 
      ? (liveScans.reduce((sum, scan) => sum + (scan.confidence_score || 0), 0) + 
         evalScans.reduce((sum, scan) => sum + (scan.confidence_score || 0), 0)) / totalScans
      : 0
    
    const avgLatency = totalScans > 0
      ? (liveScans.reduce((sum, scan) => sum + (scan.latency || 0), 0) + 
         evalScans.reduce((sum, scan) => sum + (scan.latency || 0), 0)) / totalScans
      : 0

    // Calculate accuracy rate from evaluation results
    const evalResults = evalScans.filter(scan => scan.match_result)
    const accuracyRate = evalResults.length > 0
      ? (evalResults.filter(scan => scan.match_result === 'correct').length / evalResults.length) * 100
      : 0

    // Calculate hallucination rate
    const hallucinationRate = evalScans.length > 0
      ? (evalScans.filter(scan => scan.hallucination_detected).length / evalScans.length) * 100
      : 0

    const metrics = {
      totalScans,
      liveScans: liveScans.length,
      evalScans: evalScans.length,
      retryScans: evalScans.filter(scan => scan.source_type === 'retry').length,
      avgConfidence,
      avgLatency,
      accuracyRate,
      hallucinationRate,
      sheets_accessible: evalScans.length > 0
    }

    return NextResponse.json({ success: true, metrics })
  } catch (error) {
    console.error('[Evaluation V2 Metrics API] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 