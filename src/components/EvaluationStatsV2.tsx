'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AgentStats {
  agent_name: string
  total_runs: number
  avg_confidence: number
  avg_latency: number
  accuracy_rate: number
  hallucination_rate: number
  avg_token_usage: number
  success_rate: number
}

interface EvaluationStatsV2Props {}

export default function EvaluationStatsV2({}: EvaluationStatsV2Props) {
  const [agentStats, setAgentStats] = useState<AgentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgentStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluation/v2/agent-stats')
      const data = await response.json()
      
      if (data.success) {
        setAgentStats(data.stats)
      } else {
        setError(data.error || 'Failed to fetch agent statistics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgentStats()
  }, [])

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return '✅'
    if (value >= thresholds.warning) return '⚠️'
    return '❌'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading agent statistics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={fetchAgentStats}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Agent</th>
                  <th className="text-left p-2">Total Runs</th>
                  <th className="text-left p-2">Avg Confidence</th>
                  <th className="text-left p-2">Avg Latency</th>
                  <th className="text-left p-2">Accuracy Rate</th>
                  <th className="text-left p-2">Success Rate</th>
                  <th className="text-left p-2">Hallucination Rate</th>
                  <th className="text-left p-2">Avg Token Usage</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {agentStats.map((agent) => {
                  const overallScore = (
                    (agent.accuracy_rate * 0.4) +
                    (agent.success_rate * 0.3) +
                    ((100 - agent.hallucination_rate) * 0.2) +
                    ((agent.avg_confidence / 100) * 10)
                  )
                  
                  return (
                    <tr key={agent.agent_name} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{agent.agent_name}</td>
                      <td className="p-2">{agent.total_runs}</td>
                      <td className={`p-2 font-medium ${getPerformanceColor(agent.avg_confidence, { good: 80, warning: 60 })}`}>
                        {agent.avg_confidence.toFixed(1)}%
                      </td>
                      <td className={`p-2 font-medium ${getPerformanceColor(agent.avg_latency, { good: 5000, warning: 10000 })}`}>
                        {agent.avg_latency.toFixed(0)}ms
                      </td>
                      <td className={`p-2 font-medium ${getPerformanceColor(agent.accuracy_rate, { good: 85, warning: 70 })}`}>
                        {agent.accuracy_rate.toFixed(1)}%
                      </td>
                      <td className={`p-2 font-medium ${getPerformanceColor(agent.success_rate, { good: 90, warning: 75 })}`}>
                        {agent.success_rate.toFixed(1)}%
                      </td>
                      <td className={`p-2 font-medium ${getPerformanceColor(agent.hallucination_rate, { good: 0, warning: 5 })}`}>
                        {agent.hallucination_rate.toFixed(1)}%
                      </td>
                      <td className="p-2">{agent.avg_token_usage.toFixed(0)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          overallScore >= 80 ? 'bg-green-100 text-green-800' :
                          overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {overallScore >= 80 ? 'Excellent' :
                           overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {agentStats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No agent statistics available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary Cards */}
      {agentStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Performing Agent</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const bestAgent = agentStats.reduce((best, current) => {
                  const bestScore = (best.accuracy_rate * 0.4) + (best.success_rate * 0.3) + ((100 - best.hallucination_rate) * 0.2) + ((best.avg_confidence / 100) * 10)
                  const currentScore = (current.accuracy_rate * 0.4) + (current.success_rate * 0.3) + ((100 - current.hallucination_rate) * 0.2) + ((current.avg_confidence / 100) * 10)
                  return currentScore > bestScore ? current : best
                })
                return (
                  <div>
                    <div className="text-2xl font-bold">{bestAgent.agent_name}</div>
                    <p className="text-xs text-muted-foreground">
                      {bestAgent.accuracy_rate.toFixed(1)}% accuracy
                    </p>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fastest Agent</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const fastestAgent = agentStats.reduce((fastest, current) => 
                  current.avg_latency < fastest.avg_latency ? current : fastest
                )
                return (
                  <div>
                    <div className="text-2xl font-bold">{fastestAgent.agent_name}</div>
                    <p className="text-xs text-muted-foreground">
                      {fastestAgent.avg_latency.toFixed(0)}ms avg
                    </p>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Confident</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const mostConfident = agentStats.reduce((most, current) => 
                  current.avg_confidence > most.avg_confidence ? current : most
                )
                return (
                  <div>
                    <div className="text-2xl font-bold">{mostConfident.agent_name}</div>
                    <p className="text-xs text-muted-foreground">
                      {mostConfident.avg_confidence.toFixed(1)}% confidence
                    </p>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Efficient</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const mostEfficient = agentStats.reduce((most, current) => 
                  current.avg_token_usage < most.avg_token_usage ? current : most
                )
                return (
                  <div>
                    <div className="text-2xl font-bold">{mostEfficient.agent_name}</div>
                    <p className="text-xs text-muted-foreground">
                      {mostEfficient.avg_token_usage.toFixed(0)} tokens avg
                    </p>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {agentStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agentStats
                .filter(agent => agent.accuracy_rate < 70 || agent.hallucination_rate > 10)
                .map((agent) => (
                  <div key={agent.agent_name} className="p-3 border rounded bg-yellow-50">
                    <div className="font-medium text-yellow-800">{agent.agent_name} - Needs Attention</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      {agent.accuracy_rate < 70 && `Low accuracy rate (${agent.accuracy_rate.toFixed(1)}%)`}
                      {agent.accuracy_rate < 70 && agent.hallucination_rate > 10 && ' • '}
                      {agent.hallucination_rate > 10 && `High hallucination rate (${agent.hallucination_rate.toFixed(1)}%)`}
                    </div>
                  </div>
                ))}
              
              {agentStats.filter(agent => agent.accuracy_rate < 70 || agent.hallucination_rate > 10).length === 0 && (
                <div className="text-center py-4 text-green-600">
                  All agents are performing well! 🎉
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 