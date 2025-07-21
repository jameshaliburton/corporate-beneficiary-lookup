import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { evaluationFramework } from '@/lib/services/evaluation-framework'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataSource = searchParams.get('dataSource') || 'all'
    
    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    // Get data from multiple sources
    const [supabaseData, sheetsData] = await Promise.all([
      // Get live scans from Supabase with ALL fields including trace data
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
    
    // Transform and combine results based on data source filter
    let results = []
    
    if (dataSource === 'all' || dataSource === 'live') {
      results.push(...liveScans.map((scan: any) => ({
        // Core identification
        id: scan.id,
        barcode: scan.barcode,
        brand: scan.brand || 'Unknown',
        product_name: scan.product_name,
        
        // Ownership results
        owner: scan.financial_beneficiary || scan.owner || 'Unknown',
        beneficiary_country: scan.beneficiary_country || 'Unknown',
        beneficiary_flag: scan.beneficiary_flag || '🏳️',
        ownership_structure_type: scan.ownership_structure_type || 'Unknown',
        
        // Confidence and scoring
        confidence_score: scan.confidence_score || 0,
        initial_llm_confidence: scan.initial_llm_confidence || scan.confidence_score || 0,
        
        // Source and type information
        source_type: 'live' as const,
        result_type: scan.result_type || 'unknown',
        timestamp: scan.created_at,
        
        // Trace and execution data
        trace_id: scan.trace_id || `trace_${scan.id}`,
        agent_execution_trace: scan.agent_execution_trace || null,
        agent_results: scan.agent_results || null,
        
        // Research metadata
        web_research_used: scan.web_research_used || false,
        web_sources_count: scan.web_sources_count || 0,
        query_analysis_used: scan.query_analysis_used || false,
        static_mapping_used: scan.static_mapping_used || false,
        
        // Ownership flow and sources
        ownership_flow: scan.ownership_flow || [],
        sources: scan.sources || [],
        reasoning: scan.reasoning || '',
        
        // User and inference flags
        user_contributed: scan.user_contributed || false,
        inferred: scan.inferred || false,
        
        // Performance metrics
        latency: scan.latency || null,
        token_cost_estimate: scan.token_cost_estimate || null,
        
        // Fallback information
        fallback_reason: scan.fallback_reason || null,
        
        // Evaluation data (null for live scans)
        test_id: null,
        match_result: null,
        expected_owner: null,
        expected_country: null,
        evaluation_score: null,
        
        // Prompt version tracking
        prompt_version: scan.prompt_version || 'v1.0',
        agent_type: scan.agent_type || 'enhanced_ownership_research'
      })))
    }
    
    if (dataSource === 'all' || dataSource === 'eval') {
      results.push(...evalScans.filter(scan => scan.source_type !== 'retry').map((scan: any) => ({
        // Core identification
        id: `eval_${scan.test_id || scan.trace_id || Date.now()}`,
        barcode: scan.barcode || null,
        brand: scan.brand || scan.actual_owner || 'Unknown',
        product_name: scan.product_name,
        
        // Ownership results
        owner: scan.actual_owner || 'Unknown',
        beneficiary_country: scan.actual_country || 'Unknown',
        beneficiary_flag: scan.actual_flag || '🏳️',
        ownership_structure_type: scan.ownership_structure_type || 'Unknown',
        
        // Confidence and scoring
        confidence_score: scan.confidence_score || 0,
        initial_llm_confidence: scan.initial_llm_confidence || scan.confidence_score || 0,
        
        // Source and type information
        source_type: scan.source_type || 'eval' as const,
        result_type: scan.result_type || 'evaluation',
        timestamp: scan.run_timestamp || new Date().toISOString(),
        
        // Trace and execution data
        trace_id: scan.trace_id || `eval_trace_${scan.test_id}`,
        agent_execution_trace: scan.agent_execution_trace || null,
        agent_results: scan.agent_results || null,
        
        // Research metadata
        web_research_used: scan.web_research_used || false,
        web_sources_count: scan.web_sources_count || 0,
        query_analysis_used: scan.query_analysis_used || false,
        static_mapping_used: scan.static_mapping_used || false,
        
        // Ownership flow and sources
        ownership_flow: scan.ownership_flow || [],
        sources: scan.sources || [],
        reasoning: scan.reasoning || '',
        
        // User and inference flags
        user_contributed: scan.user_contributed || false,
        inferred: scan.inferred || false,
        
        // Performance metrics
        latency: scan.latency || null,
        token_cost_estimate: scan.token_cost_estimate || null,
        
        // Fallback information
        fallback_reason: scan.fallback_reason || null,
        
        // Evaluation data
        test_id: scan.test_id,
        match_result: scan.match_result,
        expected_owner: scan.expected_owner,
        expected_country: scan.expected_country,
        evaluation_score: scan.evaluation_score,
        
        // Prompt version tracking
        prompt_version: scan.prompt_version || 'v1.0',
        agent_type: scan.agent_type || 'enhanced_ownership_research'
      })))
    }
    
    if (dataSource === 'all' || dataSource === 'retry') {
      results.push(...evalScans.filter(scan => scan.source_type === 'retry').map((scan: any) => ({
        // Core identification
        id: `retry_${scan.test_id || scan.trace_id || Date.now()}`,
        barcode: scan.barcode || null,
        brand: scan.brand || scan.actual_owner || 'Unknown',
        product_name: scan.product_name,
        
        // Ownership results
        owner: scan.actual_owner || 'Unknown',
        beneficiary_country: scan.actual_country || 'Unknown',
        beneficiary_flag: scan.actual_flag || '🏳️',
        ownership_structure_type: scan.ownership_structure_type || 'Unknown',
        
        // Confidence and scoring
        confidence_score: scan.confidence_score || 0,
        initial_llm_confidence: scan.initial_llm_confidence || scan.confidence_score || 0,
        
        // Source and type information
        source_type: 'retry' as const,
        result_type: scan.result_type || 'retry',
        timestamp: scan.run_timestamp || new Date().toISOString(),
        
        // Trace and execution data
        trace_id: scan.trace_id || `retry_trace_${scan.test_id}`,
        agent_execution_trace: scan.agent_execution_trace || null,
        agent_results: scan.agent_results || null,
        
        // Research metadata
        web_research_used: scan.web_research_used || false,
        web_sources_count: scan.web_sources_count || 0,
        query_analysis_used: scan.query_analysis_used || false,
        static_mapping_used: scan.static_mapping_used || false,
        
        // Ownership flow and sources
        ownership_flow: scan.ownership_flow || [],
        sources: scan.sources || [],
        reasoning: scan.reasoning || '',
        
        // User and inference flags
        user_contributed: scan.user_contributed || false,
        inferred: scan.inferred || false,
        
        // Performance metrics
        latency: scan.latency || null,
        token_cost_estimate: scan.token_cost_estimate || null,
        
        // Fallback information
        fallback_reason: scan.fallback_reason || null,
        
        // Evaluation data
        test_id: scan.test_id,
        match_result: scan.match_result,
        expected_owner: scan.expected_owner,
        expected_country: scan.expected_country,
        evaluation_score: scan.evaluation_score,
        
        // Prompt version tracking
        prompt_version: scan.prompt_version || 'v1.0',
        agent_type: scan.agent_type || 'enhanced_ownership_research'
      })))
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ 
      success: true, 
      results,
      summary: {
        total: results.length,
        live: liveScans.length,
        eval: evalScans.length,
        sheets_accessible: evalScans.length > 0,
        data_source: dataSource,
        trace_data_available: results.filter(r => r.agent_execution_trace).length,
        prompt_versions: [...new Set(results.map(r => r.prompt_version))],
        agent_types: [...new Set(results.map(r => r.agent_type))]
      }
    })
  } catch (error) {
    console.error('[Evaluation V3 Results API] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 