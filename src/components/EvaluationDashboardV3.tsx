'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import UnifiedResultsTableV3Simple from './UnifiedResultsTableV3Simple'
import TraceInspectorV3 from './TraceInspectorV3'
import PromptInspectorV3 from './PromptInspectorV3'
import EvaluationStatsV3 from './EvaluationStatsV3'
import FeedbackModal from './FeedbackModal'

interface EvaluationDashboardV3Props {}

export default function EvaluationDashboardV3({}: EvaluationDashboardV3Props) {
  const [selectedDataSource, setSelectedDataSource] = useState('live')
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [flaggedResult, setFlaggedResult] = useState<any>(null)

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/evaluation/v3/metrics')
      const data = await response.json()
      if (data.success) {
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  const handleResultSelect = (result: any) => {
    setSelectedResult(result)
  }

  const handleFlagResult = (result: any) => {
    setFlaggedResult(result)
    setShowFeedbackModal(true)
  }

  const handleFeedbackSubmit = async (feedback: any) => {
    try {
      const response = await fetch('/api/evaluation/v3/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result_id: flaggedResult.id,
          issue: feedback.issue,
          suggested_fix: feedback.suggestedFix,
          severity: feedback.severity
        })
      })
      
      if (response.ok) {
        setShowFeedbackModal(false)
        setFlaggedResult(null)
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center p-8">
          <div className="text-lg">Loading evaluation dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluation Dashboard V3</h1>
          <p className="text-gray-600">Deeply integrated human-in-the-loop testing and prompt iteration tools</p>
        </div>

        {/* Data Source Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live Scans</SelectItem>
                  <SelectItem value="eval">Evaluation Tests</SelectItem>
                  <SelectItem value="retry">Retry Runs</SelectItem>
                </SelectContent>
              </Select>
              
              {metrics && (
                <div className="flex space-x-4">
                  <Badge variant="outline">
                    Total: {metrics.totalScans}
                  </Badge>
                  <Badge variant="outline">
                    Live: {metrics.liveScans}
                  </Badge>
                  <Badge variant="outline">
                    Eval: {metrics.evalScans}
                  </Badge>
                  <Badge variant="outline">
                    Retry: {metrics.retryScans}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard */}
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="trace">Trace Inspector</TabsTrigger>
            <TabsTrigger value="prompts">Prompt Inspector</TabsTrigger>
            <TabsTrigger value="stats">Evaluation Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-6">
            <UnifiedResultsTableV3Simple
              selectedDataSource={selectedDataSource}
              onResultSelect={handleResultSelect}
              onFlagResult={handleFlagResult}
              selectedResult={selectedResult}
            />
          </TabsContent>

          <TabsContent value="trace" className="space-y-6">
            <TraceInspectorV3
              selectedResult={selectedResult}
            />
          </TabsContent>

          <TabsContent value="prompts" className="space-y-6">
            <PromptInspectorV3
              selectedResult={selectedResult}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <EvaluationStatsV3
              selectedDataSource={selectedDataSource}
            />
          </TabsContent>
        </Tabs>
      </div>

      {showFeedbackModal && flaggedResult && (
        <FeedbackModal
          result={flaggedResult}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  )
} 