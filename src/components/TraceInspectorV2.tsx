'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TraceStep {
  step_number: number
  step_name: string
  agent_tool: string
  input: string
  output: string
  outcome: string
  latency: number
  tool_used: string
  fallback_used: boolean
  notes: string
}

interface TraceInspectorV2Props {
  selectedResult: any
}

export default function TraceInspectorV2({ selectedResult }: TraceInspectorV2Props) {
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const fetchTraceSteps = async (traceId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/evaluation/v2/trace?trace_id=${traceId}`)
      const data = await response.json()
      
      if (data.success) {
        setTraceSteps(data.steps)
      } else {
        setError(data.error || 'Failed to fetch trace steps')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedResult?.trace_id) {
      fetchTraceSteps(selectedResult.trace_id)
    } else {
      setTraceSteps([])
    }
  }, [selectedResult])

  const toggleStepExpansion = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber)
    } else {
      newExpanded.add(stepNumber)
    }
    setExpandedSteps(newExpanded)
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'success': return 'text-green-600'
      case 'failure': return 'text-red-600'
      case 'fallback': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getToolColor = (tool: string) => {
    switch (tool.toLowerCase()) {
      case 'barcode_lookup': return 'bg-blue-100 text-blue-800'
      case 'web_research': return 'bg-green-100 text-green-800'
      case 'image_recognition': return 'bg-purple-100 text-purple-800'
      case 'ownership_research': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!selectedResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trace Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Select a result from the table to view its trace details.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trace Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">Loading trace steps...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trace Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button onClick={() => selectedResult?.trace_id && fetchTraceSteps(selectedResult.trace_id)}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trace Inspector - {selectedResult.brand}</CardTitle>
        <div className="text-sm text-gray-500">
          Trace ID: {selectedResult.trace_id} | 
          Confidence: {selectedResult.confidence_score?.toFixed(1)}% | 
          Latency: {selectedResult.latency || 0}ms
        </div>
      </CardHeader>
      <CardContent>
        {traceSteps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No trace steps found for this result.
          </div>
        ) : (
          <div className="space-y-4">
            {traceSteps.map((step) => (
              <div key={step.step_number} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      Step {step.step_number}
                    </span>
                    <span className="font-medium">{step.step_name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${getToolColor(step.agent_tool)}`}>
                      {step.agent_tool}
                    </span>
                    <span className={`font-medium ${getOutcomeColor(step.outcome)}`}>
                      {step.outcome}
                    </span>
                    {step.fallback_used && (
                      <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                        Fallback
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {step.latency}ms
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleStepExpansion(step.step_number)}
                    >
                      {expandedSteps.has(step.step_number) ? 'Hide' : 'Show'} Details
                    </Button>
                  </div>
                </div>
                
                {expandedSteps.has(step.step_number) && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Input:</div>
                      <div className="bg-gray-50 p-2 rounded text-sm font-mono">
                        {step.input || 'No input'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Output:</div>
                      <div className="bg-gray-50 p-2 rounded text-sm font-mono max-h-32 overflow-y-auto">
                        {step.output || 'No output'}
                      </div>
                    </div>
                    
                    {step.tool_used && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Tool Used:</div>
                        <div className="text-sm">{step.tool_used}</div>
                      </div>
                    )}
                    
                    {step.notes && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Notes:</div>
                        <div className="text-sm text-gray-600">{step.notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {traceSteps.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Trace Summary:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Steps:</span> {traceSteps.length}
              </div>
              <div>
                <span className="font-medium">Total Latency:</span> {traceSteps.reduce((sum, step) => sum + step.latency, 0)}ms
              </div>
              <div>
                <span className="font-medium">Fallbacks Used:</span> {traceSteps.filter(step => step.fallback_used).length}
              </div>
              <div>
                <span className="font-medium">Success Rate:</span> {
                  ((traceSteps.filter(step => step.outcome.toLowerCase() === 'success').length / traceSteps.length) * 100).toFixed(1)
                }%
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 