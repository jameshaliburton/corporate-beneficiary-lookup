'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface EvaluationStatsV3Props {
  selectedDataSource: string
}

export default function EvaluationStatsV3({ selectedDataSource }: EvaluationStatsV3Props) {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    agent: 'all',
    promptVersion: 'all',
    testBatch: 'all',
    runType: 'all'
  })

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        dataSource: selectedDataSource,
        ...filters
      })
      
      const response = await fetch(`/api/evaluation/v3/agent-stats?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats || [])
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [selectedDataSource, filters])

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (rate >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading evaluation stats...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.agent} onValueChange={(value) => setFilters(prev => ({ ...prev, agent: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Agent Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="enhanced_ownership_research">Ownership Research</SelectItem>
                <SelectItem value="query_builder">Query Builder</SelectItem>
                <SelectItem value="verification">Verification</SelectItem>
                <SelectItem value="quality_assessment">Quality Assessment</SelectItem>
                <SelectItem value="vision_agent">Vision Agent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.promptVersion} onValueChange={(value) => setFilters(prev => ({ ...prev, promptVersion: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Prompt Version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Versions</SelectItem>
                <SelectItem value="v1.0">v1.0</SelectItem>
                <SelectItem value="v1.1">v1.1</SelectItem>
                <SelectItem value="v1.2">v1.2</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.testBatch} onValueChange={(value) => setFilters(prev => ({ ...prev, testBatch: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Test Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                <SelectItem value="initial">Initial Tests</SelectItem>
                <SelectItem value="retry">Retry Tests</SelectItem>
                <SelectItem value="validation">Validation Tests</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.runType} onValueChange={(value) => setFilters(prev => ({ ...prev, runType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Run Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Runs</SelectItem>
                <SelectItem value="live">Live Scans</SelectItem>
                <SelectItem value="eval">Evaluation Tests</SelectItem>
                <SelectItem value="retry">Retry Runs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No stats available for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Agent</th>
                    <th className="text-left p-2">Total Runs</th>
                    <th className="text-left p-2">Avg Confidence</th>
                    <th className="text-left p-2">Accuracy Rate</th>
                    <th className="text-left p-2">Success Rate</th>
                    <th className="text-left p-2">Hallucination Rate</th>
                    <th className="text-left p-2">Avg Latency</th>
                    <th className="text-left p-2">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((agent) => (
                    <tr key={agent.agent_name} className="border-b">
                      <td className="p-2 font-medium">{agent.agent_name}</td>
                      <td className="p-2">{agent.total_runs}</td>
                      <td className="p-2">
                        <span className={getPerformanceColor(agent.avg_confidence)}>
                          {agent.avg_confidence.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={getPerformanceColor(agent.accuracy_rate)}>
                          {agent.accuracy_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={getPerformanceColor(agent.success_rate)}>
                          {agent.success_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={agent.hallucination_rate > 10 ? 'text-red-600' : 'text-green-600'}>
                          {agent.hallucination_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2">{agent.avg_latency.toFixed(0)}ms</td>
                      <td className="p-2">
                        {getPerformanceBadge(agent.accuracy_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.length}</div>
              <p className="text-xs text-muted-foreground">
                Active agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.reduce((sum, agent) => sum + agent.total_runs, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.reduce((sum, agent) => sum + agent.accuracy_rate, 0) / stats.length).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Across all agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Hallucination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.reduce((sum, agent) => sum + agent.hallucination_rate, 0) / stats.length).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Across all agents
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.filter(agent => agent.accuracy_rate < 70).map(agent => (
                <div key={agent.agent_name} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="text-yellow-600">⚠️</div>
                  <div>
                    <div className="font-medium">{agent.agent_name}</div>
                    <div className="text-sm text-gray-600">
                      Low accuracy rate ({agent.accuracy_rate.toFixed(1)}%) - consider prompt improvements
                    </div>
                  </div>
                </div>
              ))}
              
              {stats.filter(agent => agent.hallucination_rate > 10).map(agent => (
                <div key={agent.agent_name} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                  <div className="text-red-600">🚨</div>
                  <div>
                    <div className="font-medium">{agent.agent_name}</div>
                    <div className="text-sm text-gray-600">
                      High hallucination rate ({agent.hallucination_rate.toFixed(1)}%) - needs verification improvements
                    </div>
                  </div>
                </div>
              ))}
              
              {stats.filter(agent => agent.avg_latency > 5000).map(agent => (
                <div key={agent.agent_name} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <div className="text-orange-600">⏱️</div>
                  <div>
                    <div className="font-medium">{agent.agent_name}</div>
                    <div className="text-sm text-gray-600">
                      High latency ({agent.avg_latency.toFixed(0)}ms) - consider optimization
                    </div>
                  </div>
                </div>
              ))}
              
              {stats.filter(agent => agent.accuracy_rate >= 80 && agent.hallucination_rate < 5).length > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-green-600">✅</div>
                  <div>
                    <div className="font-medium">Good Performance</div>
                    <div className="text-sm text-gray-600">
                      {stats.filter(agent => agent.accuracy_rate >= 80 && agent.hallucination_rate < 5).length} agents performing well
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 