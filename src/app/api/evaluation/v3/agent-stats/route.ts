import { NextRequest, NextResponse } from 'next/server'
import { evaluationFramework } from '@/lib/services/evaluation-framework'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataSource = searchParams.get('dataSource') || 'all'
    const agent = searchParams.get('agent') || 'all'
    const promptVersion = searchParams.get('promptVersion') || 'all'
    const testBatch = searchParams.get('testBatch') || 'all'
    const runType = searchParams.get('runType') || 'all'
    
    // Initialize evaluation framework
    await evaluationFramework.initialize()
    
    // Get evaluation results (with fallback)
    const results = await evaluationFramework.getEvaluationResults().catch(() => [])
    
    if (results.length === 0) {
      // Return default stats when no data is available
      const defaultStats = [
        {
          agent_name: 'enhanced_ownership_research',
          total_runs: 0,
          avg_confidence: 0,
          avg_latency: 0,
          accuracy_rate: 0,
          success_rate: 0,
          hallucination_rate: 0,
          avg_token_usage: 0
        }
      ]
      
      return NextResponse.json({ 
        success: true, 
        stats: defaultStats,
        note: 'No evaluation data available - using default stats',
        filters: { dataSource, agent, promptVersion, testBatch, runType }
      })
    }
    
    // Apply filters to results
    let filteredResults = results
    
    if (agent !== 'all') {
      filteredResults = filteredResults.filter((r: any) => r.agent_version === agent)
    }
    
    if (promptVersion !== 'all') {
      filteredResults = filteredResults.filter((r: any) => r.prompt_version === promptVersion)
    }
    
    if (testBatch !== 'all') {
      filteredResults = filteredResults.filter((r: any) => r.test_batch === testBatch)
    }
    
    if (runType !== 'all') {
      filteredResults = filteredResults.filter((r: any) => r.source_type === runType)
    }
    
    // Group results by agent
    const agentGroups: { [key: string]: any[] } = {}
    
    filteredResults.forEach((result: any) => {
      const agentName = result.agent_version || 'enhanced_ownership_research'
      if (!agentGroups[agentName]) {
        agentGroups[agentName] = []
      }
      agentGroups[agentName].push(result)
    })
    
    // Calculate statistics for each agent
    const stats = Object.entries(agentGroups).map(([agentName, agentResults]) => {
      const totalRuns = agentResults.length
      const avgConfidence = agentResults.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / totalRuns
      const avgLatency = agentResults.reduce((sum, r) => sum + (r.latency || 0), 0) / totalRuns
      const avgTokenUsage = agentResults.reduce((sum, r) => sum + (r.token_cost_estimate || 0), 0) / totalRuns
      
      // Calculate accuracy rate (correct vs incorrect)
      const evalResults = agentResults.filter((r: any) => r.match_result)
      const accuracyRate = evalResults.length > 0
        ? (evalResults.filter((r: any) => r.match_result === 'correct').length / evalResults.length) * 100
        : 0
      
      // Calculate success rate (successful vs failed)
      const successRate = totalRuns > 0
        ? (agentResults.filter((r: any) => !r.tool_errors || r.tool_errors === '').length / totalRuns) * 100
        : 0
      
      // Calculate hallucination rate
      const hallucinationRate = totalRuns > 0
        ? (agentResults.filter((r: any) => r.hallucination_detected).length / totalRuns) * 100
        : 0
      
      return {
        agent_name: agentName,
        total_runs: totalRuns,
        avg_confidence: avgConfidence,
        avg_latency: avgLatency,
        accuracy_rate: accuracyRate,
        success_rate: successRate,
        hallucination_rate: hallucinationRate,
        avg_token_usage: avgTokenUsage
      }
    })
    
    // Sort by total runs (descending)
    stats.sort((a, b) => b.total_runs - a.total_runs)
    
    return NextResponse.json({ 
      success: true, 
      stats,
      summary: {
        total_agents: stats.length,
        total_runs: stats.reduce((sum, agent) => sum + agent.total_runs, 0),
        data_available: results.length > 0
      },
      filters: { dataSource, agent, promptVersion, testBatch, runType }
    })
  } catch (error) {
    console.error('[Evaluation V3 Agent Stats API] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 