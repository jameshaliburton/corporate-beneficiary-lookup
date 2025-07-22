'use client'
// @ts-nocheck

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon'
import ChevronRightIcon from '@heroicons/react/24/outline/ChevronRightIcon'
import EyeIcon from '@heroicons/react/24/outline/EyeIcon'
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon'
import InformationCircleIcon from '@heroicons/react/24/outline/InformationCircleIcon'
import VariableIcon from '@heroicons/react/24/outline/VariableIcon'
import ClockIcon from '@heroicons/react/24/outline/ClockIcon'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

interface StructuredTraceStage {
  id: string
  label: string
  skipped?: boolean
  inputVariables?: { [key: string]: any }
  outputVariables?: { [key: string]: any }
  intermediateVariables?: { [key: string]: any }
  durationMs?: number
  model?: string
  promptTemplate?: string
  completionSample?: string
  notes?: string
}

interface StructuredTraceSection {
  id: string
  label: string
  stages: StructuredTraceStage[]
}

interface StructuredTrace {
  sections: StructuredTraceSection[]
  show_skipped_stages: boolean
  mark_skipped_stages: boolean
}

interface EvalV4StructuredTraceProps {
  trace: StructuredTrace | null
  onOpenPromptModal?: (stage: StructuredTraceStage, result?: any) => void
}

// Section icons
const getSectionIcon = (sectionId: string) => {
  switch (sectionId) {
    case 'vision':
      return '🖼️'
    case 'retrieval':
      return '🔍'
    case 'ownership':
      return '🧠'
    case 'persistence':
      return '📦'
    default:
      return '⚙️'
  }
}

// Status icon for stages
const getStatusIcon = (stage: StructuredTraceStage) => {
  if (stage.skipped) {
    return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
  }
  return <CheckCircleIcon className="h-4 w-4 text-green-500" />
}

// Format variables for display
const formatVariables = (variables: { [key: string]: any } | undefined) => {
  if (!variables || Object.keys(variables).length === 0) {
    return 'No data'
  }
  
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(', ')
}

// Format duration
const formatDuration = (durationMs: number | undefined) => {
  if (!durationMs) return ''
  return `🕒 ${durationMs}ms`
}

export default function EvalV4StructuredTrace({ 
  trace, 
  onOpenPromptModal 
}: EvalV4StructuredTraceProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [showSkippedStages, setShowSkippedStages] = useState(trace?.show_skipped_stages || false)

  // Handle missing or empty trace
  if (!trace || !trace.sections || trace.sections.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            ⚠️ No trace available for this scan
          </span>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          This may be due to an incomplete scan or missing trace data.
        </p>
      </div>
    )
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const toggleStage = (stageId: string) => {
    const newExpanded = new Set(expandedStages)
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId)
    } else {
      newExpanded.add(stageId)
    }
    setExpandedStages(newExpanded)
  }

  // Filter stages based on visibility settings
  const getVisibleStages = (stages: StructuredTraceStage[]) => {
    if (showSkippedStages) {
      return stages
    }
    return stages.filter(stage => !stage.skipped)
  }

  return (
    <div className="space-y-4">
      {/* Trace Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={showSkippedStages}
              onCheckedChange={(checked) => setShowSkippedStages(checked === true)}
            />
            <span className="text-sm font-medium">Show skipped stages</span>
          </div>
          {trace.mark_skipped_stages && (
            <div className="flex items-center space-x-1 text-xs text-yellow-600">
              <ExclamationTriangleIcon className="h-3 w-3" />
              <span>Skipped stages marked with ⚠️</span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          {trace.sections.reduce((total, section) => 
            total + getVisibleStages(section.stages).length, 0
          )} total stages
        </div>
      </div>

      {/* Sections */}
      {trace.sections.map((section) => {
        const visibleStages = getVisibleStages(section.stages)
        const executedStages = visibleStages.filter(stage => !stage.skipped)
        const isExpanded = expandedSections.has(section.id)
        
        return (
          <div key={section.id} className="border border-gray-200 rounded-lg">
            {/* Section Header */}
            <div 
              className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getSectionIcon(section.id)}</span>
                <h3 className="font-medium text-gray-900">
                  {section.label}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {executedStages.length} executed
                  {visibleStages.length !== executedStages.length && (
                    <span className="ml-1">
                      / {visibleStages.length} total
                    </span>
                  )}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </div>
            </div>

            {/* Section Stages */}
            {isExpanded && (
              <div className="p-3 space-y-2">
                {visibleStages.map((stage) => {
                  const isStageExpanded = expandedStages.has(stage.id)
                  
                  return (
                    <div 
                      key={stage.id} 
                      className={`border rounded-lg p-3 ${
                        stage.skipped 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* Stage Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(stage)}
                          <h4 className="font-medium text-gray-900">
                            {stage.label}
                          </h4>
                          {stage.skipped && (
                            <Badge variant="outline" className="text-xs text-yellow-600">
                              Skipped
                            </Badge>
                          )}
                          {stage.durationMs && (
                            <span className="text-xs text-gray-500">
                              {formatDuration(stage.durationMs)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                                                     {onOpenPromptModal && stage.promptTemplate && (
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => onOpenPromptModal(stage, null)}
                               className="text-xs"
                             >
                               <EyeIcon className="h-3 w-3 mr-1" />
                               View Prompt
                             </Button>
                           )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStage(stage.id)}
                            className="text-xs"
                          >
                            {isStageExpanded ? (
                              <ChevronDownIcon className="h-3 w-3" />
                            ) : (
                              <ChevronRightIcon className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Stage Details */}
                      {isStageExpanded && (
                        <div className="mt-3 space-y-3">
                          {/* Variables */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {stage.inputVariables && Object.keys(stage.inputVariables).length > 0 && (
                              <div>
                                <div className="flex items-center space-x-1 mb-1">
                                  <VariableIcon className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-medium text-gray-700">Input Variables</span>
                                </div>
                                <div className="text-xs bg-blue-50 p-2 rounded">
                                  {formatVariables(stage.inputVariables)}
                                </div>
                              </div>
                            )}
                            
                            {stage.outputVariables && Object.keys(stage.outputVariables).length > 0 && (
                              <div>
                                <div className="flex items-center space-x-1 mb-1">
                                  <VariableIcon className="h-3 w-3 text-green-600" />
                                  <span className="text-xs font-medium text-gray-700">Output Variables</span>
                                </div>
                                <div className="text-xs bg-green-50 p-2 rounded">
                                  {formatVariables(stage.outputVariables)}
                                </div>
                              </div>
                            )}
                            
                            {stage.intermediateVariables && Object.keys(stage.intermediateVariables).length > 0 && (
                              <div>
                                <div className="flex items-center space-x-1 mb-1">
                                  <VariableIcon className="h-3 w-3 text-purple-600" />
                                  <span className="text-xs font-medium text-gray-700">Intermediate Variables</span>
                                </div>
                                <div className="text-xs bg-purple-50 p-2 rounded">
                                  {formatVariables(stage.intermediateVariables)}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Additional Metadata */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {stage.model && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Model:</span>
                                <span className="text-xs text-gray-600 ml-1">{stage.model}</span>
                              </div>
                            )}
                            
                            {stage.notes && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Notes:</span>
                                <span className="text-xs text-gray-600 ml-1">{stage.notes}</span>
                              </div>
                            )}
                          </div>

                          {/* Completion Sample */}
                          {stage.completionSample && (
                            <div>
                              <div className="flex items-center space-x-1 mb-1">
                                <InformationCircleIcon className="h-3 w-3 text-gray-600" />
                                <span className="text-xs font-medium text-gray-700">Completion Sample</span>
                              </div>
                              <div className="text-xs bg-gray-50 p-2 rounded font-mono">
                                {stage.completionSample.length > 300 
                                  ? `${stage.completionSample.substring(0, 300)}...`
                                  : stage.completionSample
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
} 