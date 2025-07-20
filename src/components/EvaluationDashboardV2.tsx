'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ScanResultTableV2 from './ScanResultTableV2'
import TraceInspectorV2 from './TraceInspectorV2'
import PromptInspectorV2 from './PromptInspectorV2'
import EvaluationStatsV2 from './EvaluationStatsV2'

interface EvaluationMetrics {
  totalScans: number
  liveScans: number
  evalScans: number
  retryScans: number
  avgConfidence: number
  avgLatency: number
  accuracyRate: number
  hallucinationRate: number
  sheets_accessible?: boolean
}

export default function EvaluationDashboardV2() {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<any>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluation/v2/metrics')
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

  useEffect(() => {
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading evaluation dashboard...</div>
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Evaluation Dashboard V2</h1>
        <div className="space-x-2">
          <button 
            onClick={fetchMetrics}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Data Availability Status */}
      {metrics && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Data Sources</h3>
                <p className="text-sm text-gray-600">
                  {metrics.sheets_accessible ? 
                    '✅ Google Sheets accessible - Full evaluation data available' :
                    '⚠️ Google Sheets not accessible - Using live scan data only'
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Live Scans</div>
                <div className="text-2xl font-bold text-green-600">{metrics.liveScans}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalScans}</div>
              <p className="text-xs text-muted-foreground">
                Live: {metrics.liveScans} | Eval: {metrics.evalScans} | Retry: {metrics.retryScans}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgConfidence.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Across all scans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgLatency.toFixed(0)}ms</div>
              <p className="text-xs text-muted-foreground">
                Response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.accuracyRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.evalScans > 0 ? 'From evaluation data' : 'No eval data available'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Results Log</TabsTrigger>
          <TabsTrigger value="traces">Trace Inspector</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Inspector</TabsTrigger>
          <TabsTrigger value="stats">Evaluation Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <ScanResultTableV2 
            onResultSelect={setSelectedResult}
            selectedResult={selectedResult}
          />
        </TabsContent>

        <TabsContent value="traces" className="space-y-4">
          <TraceInspectorV2 
            selectedResult={selectedResult}
          />
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <PromptInspectorV2 
            selectedResult={selectedResult}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <EvaluationStatsV2 />
        </TabsContent>
      </Tabs>
    </div>
  )
} 