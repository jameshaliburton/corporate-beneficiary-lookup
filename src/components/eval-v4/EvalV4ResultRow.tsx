'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon'
import ChevronRightIcon from '@heroicons/react/24/outline/ChevronRightIcon'
import EyeIcon from '@heroicons/react/24/outline/EyeIcon'
import FlagIcon from '@heroicons/react/24/outline/FlagIcon'
import PlayIcon from '@heroicons/react/24/outline/PlayIcon'
import PencilIcon from '@heroicons/react/24/outline/PencilIcon'
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon'
import InformationCircleIcon from '@heroicons/react/24/outline/InformationCircleIcon'
import VariableIcon from '@heroicons/react/24/outline/VariableIcon'
import ClockIcon from '@heroicons/react/24/outline/ClockIcon'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

interface TraceStage {
  stage: string
  reasoning: string
  confidence: number
  timestamp: string
  promptVersion: string
  agentName: string
  status: 'success' | 'error' | 'pending' | 'warning'
  duration: number
  input: string
  output: string
  prompt: {
    system: string
    user: string
    version: string
  }
  metadata?: {
    alternatives?: string[]
    disambiguation?: string
    ocrText?: string
    imageAnalysis?: {
      detectedText: string[]
      confidence: number
      quality: 'high' | 'medium' | 'low'
    }
    entityValidation?: {
      candidates: Array<{
        name: string
        confidence: number
        source: string
      }>
      selected: string
      reason: string
    }
    fallbackTriggers?: string[]
    lookupResults?: Array<{
      source: string
      result: string
      confidence: number
    }>
  }
}

interface ScanResult {
  id: string
  brand: string
  product: string
  owner: string
  confidence: number
  source: string
  flagged: boolean
  evalSheetEntry: boolean
  trace: TraceStage[]
  timestamp: string
}

interface EvalV4ResultRowProps {
  result: ScanResult
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
  onOpenTraceModal: (result: ScanResult) => void
  onOpenPromptModal: (stage: TraceStage, result: ScanResult) => void
  onRerun: (result: ScanResult) => void
  onFlag: (result: ScanResult) => void
}

// Context Clarity Components
const VariableAvailabilityIndicator = ({ stage, result }: { stage: TraceStage, result: ScanResult }) => {
  const stageIndex = result.trace.findIndex(s => s.stage === stage.stage)
  const availableVariables = result.trace.slice(0, stageIndex).map(s => ({
    key: s.stage,
    value: s.output,
    source: s.agentName,
    available: true
  }))

  if (availableVariables.length === 0) return null

  return (
    <div className="flex items-center space-x-1 text-xs text-blue-600">
      <VariableIcon className="h-3 w-3" />
      <span>{availableVariables.length} vars</span>
    </div>
  )
}

const ValidationWarningIndicator = ({ stage }: { stage: TraceStage }) => {
  const hasWarnings = stage.status === 'warning' || 
                     (stage.metadata?.disambiguation && stage.metadata.disambiguation.includes('Multiple'))
  
  if (!hasWarnings) return null

  return (
    <div className="flex items-center space-x-1 text-xs text-yellow-600">
      <ExclamationTriangleIcon className="h-3 w-3" />
      <span>Warnings</span>
    </div>
  )
}

const ContextClarityBanner = ({ stage, result }: { stage: TraceStage, result: ScanResult }) => {
  const stageIndex = result.trace.findIndex(s => s.stage === stage.stage)
  const isCurrentStage = stageIndex === result.trace.length - 1
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              v{stage.promptVersion}
            </Badge>
            <span className="text-sm font-medium text-blue-900">
              {stage.agentName}
            </span>
          </div>
          
          <div className="text-xs text-blue-700">
            Stage {stageIndex + 1} of {result.trace.length}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <VariableAvailabilityIndicator stage={stage} result={result} />
          <ValidationWarningIndicator stage={stage} />
        </div>
      </div>
      
      <div className="mt-2 text-xs text-blue-700">
        <strong>Context:</strong> {result.brand} - {result.product}
      </div>
    </div>
  )
}

export default function EvalV4ResultRow({
  result,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onOpenTraceModal,
  onOpenPromptModal,
  onRerun,
  onFlag
}: EvalV4ResultRowProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRerun = async () => {
    setIsProcessing(true)
    try {
      await onRerun(result)
    } finally {
      setIsProcessing(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-800'
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="border-b border-gray-200">
      {/* Main Row */}
      <div className="flex items-center p-4 hover:bg-gray-50">
        {/* Checkbox */}
        <div className="flex items-center mr-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpand}
          className="mr-3 p-1"
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </Button>

        {/* Brand */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 truncate">
              {result.brand}
            </span>
            {result.flagged && (
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            )}
            {result.evalSheetEntry && (
              <Badge variant="outline" className="text-xs">
                Eval
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {result.product}
          </div>
        </div>

        {/* Owner */}
        <div className="flex-1 min-w-0 px-4">
          <div className="text-sm font-medium text-gray-900 truncate">
            {result.owner}
          </div>
        </div>

        {/* Confidence */}
        <div className="w-20 text-center">
          <Badge className={getConfidenceColor(result.confidence)}>
            {result.confidence}%
          </Badge>
        </div>

        {/* Source */}
        <div className="w-20 text-center">
          <Badge variant="outline" className="text-xs">
            {result.source}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenTraceModal(result)}
            title="View Trace"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRerun}
            disabled={isProcessing}
            title="Rerun"
          >
            {isProcessing ? (
              <ClockIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PlayIcon className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFlag(result)}
            title="Flag"
          >
            <FlagIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Trace View with Context Clarity */}
      {isExpanded && (
        <div className="bg-gray-50 p-4">
          <div className="space-y-4">
            {result.trace.map((stage, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                {/* Context Clarity Banner */}
                <ContextClarityBanner stage={stage} result={result} />
                
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(stage.status)}
                    <h4 className="font-medium text-gray-900 capitalize">
                      {stage.stage.replace('-', ' ')}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {stage.confidence}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenPromptModal(stage, result)}
                      className="text-xs"
                    >
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Edit Prompt
                    </Button>
                    
                    <div className="text-xs text-gray-500">
                      {new Date(stage.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Stage Content */}
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Reasoning:</strong> {stage.reasoning}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Input:</strong>
                      <div className="text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {stage.input}
                      </div>
                    </div>
                    
                    <div>
                      <strong>Output:</strong>
                      <div className="text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {stage.output}
                      </div>
                    </div>
                  </div>

                  {/* Variable Availability Timeline */}
                  <div className="mt-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <VariableIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Variable Availability</span>
                    </div>
                    <div className="flex space-x-2">
                      {result.trace.slice(0, index).map((prevStage, prevIndex) => (
                        <div key={prevIndex} className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-600">{prevStage.stage}</span>
                        </div>
                      ))}
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-medium text-blue-600">{stage.stage}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 