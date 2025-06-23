'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EvaluationMetrics {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  successRate: number
  avgResponseTime: number
  avgSourceQuality: number
  ignoredViableSources: number
  usedWebResearch: number
  hallucinationDetected: number
  failurePatterns: Record<string, number>
  sourceUsagePatterns: Record<string, number>
  confidenceAccuracy: any[]
}

export default function EvaluationDashboard() {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluation')
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.metrics)
      } else {
        setError(data.error || 'Failed to fetch metrics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const resetMetrics = async () => {
    try {
      const response = await fetch('/api/evaluation?action=reset')
      const data = await response.json()
      
      if (data.success) {
        await fetchMetrics()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset metrics')
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading evaluation metrics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={fetchMetrics}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-8">
        <div className="text-gray-600">No metrics available</div>
      </div>
    )
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return '✅'
    if (value >= thresholds.warning) return '⚠️'
    return '❌'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agent Evaluation Dashboard</h1>
        <div className="space-x-2">
          <button 
            onClick={fetchMetrics}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
          <button 
            onClick={resetMetrics}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset Metrics
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <span className={getStatusIcon(metrics.successRate, { good: 80, warning: 60 })}>
              {getStatusIcon(metrics.successRate, { good: 80, warning: 60 })}
            </span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.successRate, { good: 80, warning: 60 })}`}>
              {metrics.successRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.successfulQueries} / {metrics.totalQueries} queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <span className={getStatusIcon(metrics.avgResponseTime, { good: 5000, warning: 10000 })}>
              {getStatusIcon(metrics.avgResponseTime, { good: 5000, warning: 10000 })}
            </span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.avgResponseTime, { good: 5000, warning: 10000 })}`}>
              {metrics.avgResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Source Quality</CardTitle>
            <span className={getStatusIcon(metrics.avgSourceQuality, { good: 70, warning: 50 })}>
              {getStatusIcon(metrics.avgSourceQuality, { good: 70, warning: 50 })}
            </span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.avgSourceQuality, { good: 70, warning: 50 })}`}>
              {metrics.avgSourceQuality}
            </div>
            <p className="text-xs text-muted-foreground">
              Average credibility score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hallucination Rate</CardTitle>
            <span className={getStatusIcon(metrics.hallucinationDetected, { good: 0, warning: 1 })}>
              {getStatusIcon(metrics.hallucinationDetected, { good: 0, warning: 1 })}
            </span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.hallucinationDetected, { good: 0, warning: 1 })}`}>
              {metrics.hallucinationDetected}
            </div>
            <p className="text-xs text-muted-foreground">
              Detected instances
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Web Research Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Web Research Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Web Research Used:</span>
                <span className="font-medium">{metrics.usedWebResearch}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Queries:</span>
                <span className="font-medium">{metrics.totalQueries}</span>
              </div>
              <div className="flex justify-between">
                <span>Usage Rate:</span>
                <span className="font-medium">
                  {metrics.totalQueries > 0 ? Math.round((metrics.usedWebResearch / metrics.totalQueries) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ignored Viable Sources:</span>
                <span className="font-medium text-red-600">{metrics.ignoredViableSources}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Failure Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Failure Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(metrics.failurePatterns).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(metrics.failurePatterns).map(([pattern, count]) => (
                  <div key={pattern} className="flex justify-between">
                    <span className="capitalize">{pattern.replace('_', ' ')}:</span>
                    <span className="font-medium text-red-600">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No failure patterns detected</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Source Usage Patterns */}
      {Object.keys(metrics.sourceUsagePatterns).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Source Usage Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.sourceUsagePatterns).map(([pattern, count]) => {
                const [available, used] = pattern.split('_').map(Number)
                const usageRate = available > 0 ? (used / available) * 100 : 0
                
                return (
                  <div key={pattern} className="flex justify-between items-center">
                    <span>{used}/{available} sources used:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{count} times</span>
                      <span className="text-sm text-muted-foreground">
                        ({Math.round(usageRate)}% usage rate)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.successRate < 70 && (
              <div className="flex items-center space-x-2">
                <span className="text-red-600">🔴</span>
                <span>Low success rate - Consider improving source parsing or expanding knowledge base</span>
              </div>
            )}
            
            {metrics.hallucinationDetected > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-red-600">🔴</span>
                <span>Hallucination detected - Strengthen validation rules and source requirements</span>
              </div>
            )}
            
            {metrics.ignoredViableSources > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">🟡</span>
                <span>Sources being ignored - Improve source prioritization and usage logic</span>
              </div>
            )}
            
            {metrics.avgSourceQuality < 60 && (
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">🟡</span>
                <span>Low source quality - Implement better source credibility scoring</span>
              </div>
            )}
            
            {metrics.avgResponseTime > 10000 && (
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">🟡</span>
                <span>Slow response times - Optimize web research and caching</span>
              </div>
            )}
            
            {metrics.totalQueries > 0 && (metrics.usedWebResearch / metrics.totalQueries) < 0.8 && (
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">🟡</span>
                <span>Low web research usage - Check API configuration and availability</span>
              </div>
            )}
            
            {metrics.successRate >= 80 && metrics.hallucinationDetected === 0 && metrics.ignoredViableSources === 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span>Agent performing well across all metrics</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 