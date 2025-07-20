'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Play, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface TraceInspectorV3Props {
  selectedResult: any
}

export default function TraceInspectorV3({ selectedResult }: TraceInspectorV3Props) {
  const [traceSteps, setTraceSteps] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  const fetchTraceSteps = async () => {
    if (!selectedResult?.trace_id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/evaluation/v3/trace?trace_id=${selectedResult.trace_id}`)
      const data = await response.json()
      
      if (data.success) {
        setTraceSteps(data.steps || [])
      }
    } catch (error) {
      console.error('Failed to fetch trace steps:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedResult) {
      fetchTraceSteps()
    }
  }, [selectedResult])

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const handleRerunStep = async (step: any) => {
    try {
      const response = await fetch('/api/evaluation/v3/rerun-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trace_id: selectedResult.trace_id,
          step_id: step.id,
          step_type: step.type
        })
      })
      
      if (response.ok) {
        // Refresh trace steps
        fetchTraceSteps()
      }
    } catch (error) {
      console.error('Failed to rerun step:', error)
    }
  }

  const getStepStatusIcon = (step: any) => {
    if (step.error) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (step.completed) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const getStepStatusColor = (step: any) => {
    if (step.error) return 'text-red-600'
    if (step.completed) return 'text-green-600'
    return 'text-yellow-600'
  }

  if (!selectedResult) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Select a result to inspect its trace
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading trace steps...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Trace Inspector - {selectedResult.brand} ({selectedResult.product_name})
        </CardTitle>
        <div className="text-sm text-gray-600">
          Trace ID: {selectedResult.trace_id}
        </div>
      </CardHeader>
      <CardContent>
        {traceSteps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No trace steps available for this result.
          </div>
        ) : (
          <div className="space-y-4">
            {traceSteps.map((step, index) => (
              <Collapsible
                key={step.id || index}
                open={expandedSteps.has(step.id || index.toString())}
                onOpenChange={() => toggleStepExpansion(step.id || index.toString())}
              >
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {expandedSteps.has(step.id || index.toString()) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      {getStepStatusIcon(step)}
                      
                      <div>
                        <div className={`font-medium ${getStepStatusColor(step)}`}>
                          {step.agent_name || step.type || `Step ${index + 1}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {step.duration ? `${step.duration}ms` : 'Duration unknown'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {step.confidence_score && (
                        <Badge variant="outline">
                          {step.confidence_score.toFixed(1)}%
                        </Badge>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRerunStep(step)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Rerun
                      </Button>
                    </div>
                  </div>
                  
                  <CollapsibleContent className="mt-4">
                    <div className="space-y-4">
                      {/* Input */}
                      {step.input && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Input</h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {typeof step.input === 'string' 
                              ? step.input 
                              : JSON.stringify(step.input, null, 2)
                            }
                          </pre>
                        </div>
                      )}
                      
                      {/* Output */}
                      {step.output && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Output</h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {typeof step.output === 'string' 
                              ? step.output 
                              : JSON.stringify(step.output, null, 2)
                            }
                          </pre>
                        </div>
                      )}
                      
                      {/* Error */}
                      {step.error && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-red-600">Error</h4>
                          <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto text-red-700">
                            {step.error}
                          </pre>
                        </div>
                      )}
                      
                      {/* Metadata */}
                      {step.metadata && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Metadata</h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(step.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {/* Prompt used */}
                      {step.prompt && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Prompt Used</h4>
                          <div className="bg-blue-50 p-3 rounded text-xs">
                            <div className="font-medium mb-1">System Prompt:</div>
                            <div className="whitespace-pre-wrap">{step.prompt.system_prompt}</div>
                            {step.prompt.user_prompt && (
                              <>
                                <div className="font-medium mb-1 mt-2">User Prompt:</div>
                                <div className="whitespace-pre-wrap">{step.prompt.user_prompt}</div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 