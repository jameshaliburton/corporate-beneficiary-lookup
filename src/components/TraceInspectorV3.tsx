'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TraceStage {
  stage_id: string
  stage: string
  description: string
  start_time: string
  end_time?: string
  status: 'started' | 'success' | 'error' | 'partial'
  reasoning: Array<{
    timestamp: string
    type: string
    content: string
  }>
  decisions: Array<{
    timestamp: string
    decision: string
    alternatives: string[]
    reasoning: string
  }>
  data: any
  error: any
  duration_ms: number
}

interface TraceData {
  trace_id: string
  start_time: string
  brand: string
  product_name: string
  barcode: string
  stages: TraceStage[]
  decisions: any[]
  reasoning_chain: any[]
  performance_metrics: {
    total_duration_ms: number
    stage_durations: Record<string, number>
    memory_usage: any
    api_calls: number
    token_usage: number
  }
  final_result: any
  error_details: any
  confidence_evolution: any[]
}

interface TraceInspectorV3Props {
  traceData: TraceData | null
  onStepRerun?: (stageName: string, stageData: any) => void
  onStepFeedback?: (stageName: string, feedback: any) => void
}

export default function TraceInspectorV3({ 
  traceData, 
  onStepRerun, 
  onStepFeedback 
}: TraceInspectorV3Props) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{
    stage: string
    isOpen: boolean
  }>({ stage: '', isOpen: false })

  if (!traceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trace Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No trace data available for this result.</p>
        </CardContent>
      </Card>
    )
  }

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const handleStepRerun = (stage: TraceStage) => {
    if (onStepRerun) {
      onStepRerun(stage.stage, stage.data)
    }
  }

  const handleStepFeedback = (stage: TraceStage) => {
    setFeedbackModal({ stage: stage.stage, isOpen: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trace Inspector</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {traceData.stages.length} stages
            </Badge>
            <Badge variant="outline">
              {formatDuration(traceData.performance_metrics.total_duration_ms)}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stages" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stages">Execution Stages</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="reasoning">Reasoning Chain</TabsTrigger>
          </TabsList>

          <TabsContent value="stages" className="space-y-4">
            <div className="space-y-3">
              {traceData.stages.map((stage) => (
                <Card key={stage.stage_id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold capitalize">{stage.stage.replace('_', ' ')}</h4>
                        <Badge className={getStageStatusColor(stage.status)}>
                          {stage.status}
                        </Badge>
                        <Badge variant="outline">
                          {formatDuration(stage.duration_ms)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStepRerun(stage)}
                          disabled={!onStepRerun}
                        >
                          Rerun Step
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStepFeedback(stage)}
                          disabled={!onStepFeedback}
                        >
                          Flag Step
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Stage Data */}
                    {Object.keys(stage.data).length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Stage Data:</h5>
                        <pre className="text-xs bg-muted p-2 rounded">
                          {JSON.stringify(stage.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Reasoning */}
                    {stage.reasoning.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Reasoning:</h5>
                        <div className="space-y-1">
                          {stage.reasoning.map((reason, index) => (
                            <div key={index} className="text-xs bg-muted p-2 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {reason.type}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {formatTimestamp(reason.timestamp)}
                                </span>
                              </div>
                              <p>{reason.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Decisions */}
                    {stage.decisions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Decisions:</h5>
                        <div className="space-y-2">
                          {stage.decisions.map((decision, index) => (
                            <div key={index} className="border-l-2 border-l-green-500 pl-3">
                              <p className="font-medium text-sm">{decision.decision}</p>
                              <p className="text-xs text-muted-foreground mb-1">
                                {decision.reasoning}
                              </p>
                              {decision.alternatives.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Alternatives:</p>
                                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                                    {decision.alternatives.map((alt, altIndex) => (
                                      <li key={altIndex}>{alt}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {stage.error && (
                      <div>
                        <h5 className="font-medium text-sm mb-2 text-red-600">Error:</h5>
                        <pre className="text-xs bg-red-50 p-2 rounded text-red-700">
                          {JSON.stringify(stage.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-sm mb-2">Overall Performance:</h5>
                    <div className="space-y-1 text-sm">
                      <div>Total Duration: {formatDuration(traceData.performance_metrics.total_duration_ms)}</div>
                      <div>API Calls: {traceData.performance_metrics.api_calls}</div>
                      <div>Token Usage: {traceData.performance_metrics.token_usage}</div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm mb-2">Stage Durations:</h5>
                    <div className="space-y-1 text-sm">
                      {Object.entries(traceData.performance_metrics.stage_durations).map(([stage, duration]) => (
                        <div key={stage} className="flex justify-between">
                          <span className="capitalize">{stage.replace('_', ' ')}:</span>
                          <span>{formatDuration(duration)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reasoning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reasoning Chain</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {traceData.reasoning_chain.map((reason, index) => (
                    <div key={index} className="border-l-2 border-l-blue-500 pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {reason.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          {reason.stage?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(reason.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{reason.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feedback Modal */}
        {feedbackModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Flag Step: {feedbackModal.stage}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Issue:</label>
                    <textarea 
                      className="w-full mt-1 p-2 border rounded"
                      rows={3}
                      placeholder="Describe the issue with this step..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Suggested Fix:</label>
                    <textarea 
                      className="w-full mt-1 p-2 border rounded"
                      rows={3}
                      placeholder="Suggest how to improve this step..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setFeedbackModal({ stage: '', isOpen: false })}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        // Handle feedback submission
                        setFeedbackModal({ stage: '', isOpen: false })
                      }}
                    >
                      Submit Feedback
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 