'use client'

import { Dialog } from '@headlessui/react'
import { useState, useEffect, useMemo } from 'react'
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import CheckIcon from '@heroicons/react/24/outline/CheckIcon'
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon'
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon'
import EyeIcon from '@heroicons/react/24/outline/EyeIcon'
import EyeSlashIcon from '@heroicons/react/24/outline/EyeSlashIcon'
import ClockIcon from '@heroicons/react/24/outline/ClockIcon'
import CurrencyDollarIcon from '@heroicons/react/24/outline/CurrencyDollarIcon'
import InformationCircleIcon from '@heroicons/react/24/outline/InformationCircleIcon'
import PlayIcon from '@heroicons/react/24/outline/PlayIcon'
import PauseIcon from '@heroicons/react/24/outline/PauseIcon'
import CogIcon from '@heroicons/react/24/outline/CogIcon'
import ClipboardDocumentIcon from '@heroicons/react/24/outline/ClipboardDocumentIcon'
import VariableIcon from '@heroicons/react/24/outline/VariableIcon'

interface TraceStage {
  stage: string
  agentName: string
  prompt: {
    system: string
    user: string
  }
  input: string
  output: string
  confidence: number
  reasoning: string
  duration: number
  status: 'success' | 'error' | 'warning' | 'pending' | 'missing_data' | 'skipped' | 'not_run'
  timestamp: string
  metadata: { [key: string]: any }
  promptVersion?: string
  tokenUsage?: {
    input: number
    output: number
    total: number
    cost: number
  }
  error?: {
    message: string
    type: string
    details: any
  }
  // Enhanced fields for variables and prompts
  variables?: {
    inputVariables?: { [key: string]: any }
    outputVariables?: { [key: string]: any }
    intermediateVariables?: { [key: string]: any }
  }
  config?: {
    model?: string
    temperature?: number
    maxTokens?: number
    stopSequences?: string[]
  }
  compiledPrompt?: string
  promptTemplate?: string
}

interface ScanResult {
  id: string
  product: string
  brand: string
  trace: TraceStage[]
  source: string
  confidence: number
  status: string
  timestamp: string
  metadata: { [key: string]: any }
}

interface EvalV4TraceModalProps {
  result: ScanResult
  onClose: () => void
  onEditPrompt?: (stage: TraceStage) => void
}

export default function EvalV4TraceModal({ result, onClose, onEditPrompt }: EvalV4TraceModalProps) {
  console.log('🔍 EvalV4TraceModal: Received result:', result.id, 'with', result.trace?.length || 0, 'stages')
  console.log('🔍 EvalV4TraceModal: Sample stages:', result.trace?.slice(0, 2).map(s => ({ stage: s.stage, status: s.status, hasVariables: !!s.variables, hasConfig: !!s.config, hasCompiledPrompt: !!s.compiledPrompt })))
  console.log('🔍 EvalV4TraceModal: FULL RESULT STRUCTURE:', JSON.stringify(result, null, 2))
  
  const [selectedStage, setSelectedStage] = useState<TraceStage | null>(null)
  const [filterSettings, setFilterSettings] = useState({
    showErrors: true,
    showWarnings: true,
    showSuccess: true,
    showPending: true,
    showTechnicalSteps: false,
    showPerformanceAlerts: true,
    minConfidence: 0,
    maxDuration: Infinity,
  })
  const [viewMode, setViewMode] = useState<'timeline' | 'detailed'>('timeline')
  const [autoPlay, setAutoPlay] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showAllStages, setShowAllStages] = useState(true)

  // Filter stages based on settings and showAllStages
  const filteredStages = useMemo(() => {
    let stages = result.trace

    // Filter by showAllStages setting
    if (!showAllStages) {
      stages = stages.filter(stage => 
        stage.status === 'success' || 
        stage.status === 'error' || 
        stage.status === 'warning' || 
        stage.status === 'missing_data'
      )
    }

    // Apply other filters
    return stages.filter(stage => {
      if (!filterSettings.showErrors && stage.status === 'error') return false
      if (!filterSettings.showWarnings && stage.status === 'warning') return false
      if (!filterSettings.showSuccess && stage.status === 'success') return false
      if (!filterSettings.showPending && stage.status === 'pending') return false
      if (stage.confidence < filterSettings.minConfidence) return false
      if (stage.duration > filterSettings.maxDuration) return false
      return true
    })
  }, [result.trace, showAllStages, filterSettings])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= filteredStages.length - 1) {
          setAutoPlay(false)
          return prev
        }
        return prev + 1
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [autoPlay, filteredStages.length])

  // Calculate aggregated metrics
  const metrics = {
    totalStages: result.trace.length,
    visibleStages: filteredStages.length,
    hiddenStages: result.trace.length - filteredStages.length,
    totalDuration: result.trace.reduce((sum, stage) => sum + stage.duration, 0),
    totalTokens: result.trace.reduce((sum, stage) => sum + (stage.tokenUsage?.total || 0), 0),
    totalCost: result.trace.reduce((sum, stage) => sum + (stage.tokenUsage?.cost || 0), 0),
    errors: result.trace.filter(stage => stage.status === 'error').length,
    warnings: result.trace.filter(stage => stage.status === 'warning').length,
    missingData: result.trace.filter(stage => stage.status === 'missing_data').length,
    avgConfidence: result.trace.reduce((sum, stage) => sum + stage.confidence, 0) / result.trace.length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'missing_data': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'skipped': return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'not_run': return 'bg-gray-50 text-gray-500 border-gray-100'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckIcon className="w-4 h-4" />
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'pending': return <ClockIcon className="w-4 h-4" />
      case 'missing_data': return <EyeSlashIcon className="w-4 h-4" />
      case 'skipped': return <ClockIcon className="w-4 h-4" />
      case 'not_run': return <CogIcon className="w-4 h-4" />
      default: return <InformationCircleIcon className="w-4 h-4" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-7xl h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Trace Visualization: {result.brand} - {result.product}
                </Dialog.Title>
                <p className="text-sm text-gray-500">
                  {filteredStages.length} of {result.trace.length} stages • {metrics.totalDuration}ms • ${metrics.totalCost.toFixed(4)}
                  {!showAllStages && metrics.hiddenStages > 0 && (
                    <span className="ml-2 text-orange-600">({metrics.hiddenStages} stages hidden)</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAllStages(!showAllStages)}
                className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {showAllStages ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                <span>{showAllStages ? 'Hide' : 'Show'} all stages</span>
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'timeline' ? 'detailed' : 'timeline')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {viewMode === 'timeline' ? 'Detailed' : 'Timeline'}
              </button>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {autoPlay ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Metrics Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-8 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{metrics.visibleStages}</div>
                <div className="text-gray-500">Visible</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{metrics.totalDuration}ms</div>
                <div className="text-gray-500">Duration</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{metrics.totalTokens}</div>
                <div className="text-gray-500">Tokens</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">${metrics.totalCost.toFixed(4)}</div>
                <div className="text-gray-500">Cost</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600">{metrics.errors}</div>
                <div className="text-gray-500">Errors</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{metrics.warnings}</div>
                <div className="text-gray-500">Warnings</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-orange-600">{metrics.missingData}</div>
                <div className="text-gray-500">Missing Data</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{metrics.avgConfidence.toFixed(1)}%</div>
                <div className="text-gray-500">Avg Confidence</div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="px-6 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center space-x-4 text-sm">
              <span className="font-medium text-gray-700">Filters:</span>
              
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={filterSettings.showErrors}
                  onChange={(e) => setFilterSettings(prev => ({ ...prev, showErrors: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-red-600">Errors</span>
              </label>
              
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={filterSettings.showWarnings}
                  onChange={(e) => setFilterSettings(prev => ({ ...prev, showWarnings: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-yellow-600">Warnings</span>
              </label>
              
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={filterSettings.showSuccess}
                  onChange={(e) => setFilterSettings(prev => ({ ...prev, showSuccess: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-green-600">Success</span>
              </label>
              
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={filterSettings.showTechnicalSteps}
                  onChange={(e) => setFilterSettings(prev => ({ ...prev, showTechnicalSteps: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-gray-600">Technical</span>
              </label>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'timeline' ? (
              <TimelineView
                stages={filteredStages}
                selectedStage={selectedStage}
                onStageSelect={setSelectedStage}
                currentStepIndex={currentStepIndex}
                onEditPrompt={onEditPrompt}
                copyToClipboard={copyToClipboard}
              />
            ) : (
              <DetailedView
                stages={filteredStages}
                selectedStage={selectedStage}
                onStageSelect={setSelectedStage}
                onEditPrompt={onEditPrompt}
                copyToClipboard={copyToClipboard}
              />
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

// Timeline View Component
function TimelineView({ 
  stages, 
  selectedStage, 
  onStageSelect, 
  currentStepIndex,
  onEditPrompt,
  copyToClipboard
}: {
  stages: TraceStage[]
  selectedStage: TraceStage | null
  onStageSelect: (stage: TraceStage) => void
  currentStepIndex: number
  onEditPrompt?: (stage: TraceStage) => void
  copyToClipboard: (text: string) => void
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Timeline Bar */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <div className="flex items-center space-x-2">
            {stages.map((stage, index) => (
              <TimelineStep
                key={index}
                stage={stage}
                isSelected={selectedStage === stage}
                isCurrent={index === currentStepIndex}
                onClick={() => onStageSelect(stage)}
                onEditPrompt={onEditPrompt}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stage Details */}
      {selectedStage && (
        <div className="flex-1 overflow-auto p-6">
          <StageDetails 
            stage={selectedStage} 
            onEditPrompt={onEditPrompt}
            copyToClipboard={copyToClipboard}
          />
        </div>
      )}
    </div>
  )
}

// Timeline Step Component
function TimelineStep({ 
  stage, 
  isSelected, 
  isCurrent, 
  onClick, 
  onEditPrompt 
}: {
  stage: TraceStage
  isSelected: boolean
  isCurrent: boolean
  onClick: () => void
  onEditPrompt?: (stage: TraceStage) => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      case 'pending': return 'bg-gray-400'
      case 'missing_data': return 'bg-orange-500'
      case 'skipped': return 'bg-gray-300'
      case 'not_run': return 'bg-gray-200'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={onClick}
        className={`relative p-3 rounded-lg border-2 transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        } ${isCurrent ? 'ring-2 ring-blue-300' : ''}`}
      >
        <div className={`w-4 h-4 rounded-full ${getStatusColor(stage.status)}`} />
        {stage.error && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </button>
      
      <div className="text-xs text-center max-w-20">
        <div className="font-medium truncate">{stage.stage}</div>
        <div className="text-gray-500">{stage.duration}ms</div>
      </div>
      
      {isSelected && onEditPrompt && stage.status !== 'skipped' && stage.status !== 'not_run' && (
        <button
          onClick={() => onEditPrompt(stage)}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Edit
        </button>
      )}
    </div>
  )
}

// Detailed View Component
function DetailedView({ 
  stages, 
  selectedStage, 
  onStageSelect, 
  onEditPrompt,
  copyToClipboard
}: {
  stages: TraceStage[]
  selectedStage: TraceStage | null
  onStageSelect: (stage: TraceStage) => void
  onEditPrompt?: (stage: TraceStage) => void
  copyToClipboard: (text: string) => void
}) {
  return (
    <div className="h-full grid grid-cols-2 gap-6 p-6">
      {/* Stage List */}
      <div className="overflow-auto">
        <h3 className="text-lg font-semibold mb-4">Execution Stages</h3>
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <DetailedStageCard
              key={index}
              stage={stage}
              isSelected={selectedStage === stage}
              onClick={() => onStageSelect(stage)}
              onEditPrompt={onEditPrompt}
            />
          ))}
        </div>
      </div>

      {/* Stage Details */}
      {selectedStage && (
        <div className="overflow-auto">
          <StageDetails 
            stage={selectedStage} 
            onEditPrompt={onEditPrompt}
            copyToClipboard={copyToClipboard}
          />
        </div>
      )}
    </div>
  )
}

// Detailed Stage Card Component
function DetailedStageCard({ 
  stage, 
  isSelected, 
  onClick, 
  onEditPrompt 
}: {
  stage: TraceStage
  isSelected: boolean
  onClick: () => void
  onEditPrompt?: (stage: TraceStage) => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'missing_data': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'skipped': return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'not_run': return 'bg-gray-50 text-gray-500 border-gray-100'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{stage.stage}</h4>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(stage.status)}`}>
            {stage.status}
          </span>
          {onEditPrompt && stage.status !== 'skipped' && stage.status !== 'not_run' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEditPrompt(stage)
              }}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-2">{stage.agentName}</div>
      
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
        <div>
          <ClockIcon className="w-3 h-3 inline mr-1" />
          {stage.duration}ms
        </div>
        <div>
          <CurrencyDollarIcon className="w-3 h-3 inline mr-1" />
          ${stage.tokenUsage?.cost?.toFixed(4) || '0.0000'}
        </div>
        <div>
          <CogIcon className="w-3 h-3 inline mr-1" />
          {stage.tokenUsage?.total || 0} tokens
        </div>
      </div>
      
      {stage.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {stage.error.message}
        </div>
      )}

      {stage.status === 'missing_data' && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
          ⚠️ Stage should have run for this input, but data is missing from the trace.
        </div>
      )}
    </div>
  )
}

// Stage Details Component
function StageDetails({ 
  stage, 
  onEditPrompt,
  copyToClipboard
}: {
  stage: TraceStage
  onEditPrompt?: (stage: TraceStage) => void
  copyToClipboard: (text: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'prompt' | 'input' | 'output' | 'metrics' | 'variables'>('overview')

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'prompt', label: 'Prompt' },
    { id: 'input', label: 'Input' },
    { id: 'output', label: 'Output' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'variables', label: 'Variables' },
  ]

  const hasVariables = stage.variables && (
    stage.variables.inputVariables || 
    stage.variables.outputVariables || 
    stage.variables.intermediateVariables
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{stage.stage}</h3>
        {onEditPrompt && stage.status !== 'skipped' && stage.status !== 'not_run' && (
          <button
            onClick={() => onEditPrompt(stage)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit Prompt
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'variables' && hasVariables && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                  {Object.keys(stage.variables || {}).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Agent</div>
                <div className="text-lg">{stage.agentName}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Status</div>
                <div className="text-lg">{stage.status}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Duration</div>
                <div className="text-lg">{stage.duration}ms</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Confidence</div>
                <div className="text-lg">{stage.confidence}%</div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Reasoning</div>
              <div className="text-sm text-gray-600">{stage.reasoning}</div>
            </div>

            {stage.status === 'missing_data' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm font-medium text-orange-800 mb-2">Missing Data</div>
                <div className="text-sm text-orange-700">
                  This stage should have run for this input type, but the execution data is missing from the trace.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prompt' && (
          <div className="space-y-4">
            {stage.promptTemplate && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Prompt Template</h4>
                <div className="relative">
                  <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-40">
                    {stage.promptTemplate}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(stage.promptTemplate || '')}
                    className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                    title="Copy to clipboard"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {stage.compiledPrompt && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Compiled Prompt</h4>
                <div className="relative">
                  <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-40">
                    {stage.compiledPrompt}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(stage.compiledPrompt || '')}
                    className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                    title="Copy to clipboard"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2">System Prompt</h4>
              <div className="relative">
                <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-40">
                  {stage.prompt.system}
                </pre>
                <button
                  onClick={() => copyToClipboard(stage.prompt.system)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                  title="Copy to clipboard"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">User Prompt</h4>
              <div className="relative">
                <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-40">
                  {stage.prompt.user}
                </pre>
                <button
                  onClick={() => copyToClipboard(stage.prompt.user)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                  title="Copy to clipboard"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {stage.config && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  {stage.config.model && (
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-700">Model</div>
                      <div className="text-sm">{stage.config.model}</div>
                    </div>
                  )}
                  {stage.config.temperature !== undefined && (
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-700">Temperature</div>
                      <div className="text-sm">{stage.config.temperature}</div>
                    </div>
                  )}
                  {stage.config.maxTokens && (
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-700">Max Tokens</div>
                      <div className="text-sm">{stage.config.maxTokens}</div>
                    </div>
                  )}
                  {stage.config.stopSequences && stage.config.stopSequences.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-700">Stop Sequences</div>
                      <div className="text-sm">{stage.config.stopSequences.join(', ')}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'input' && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Input</h4>
            <div className="relative">
              <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-96">
                {stage.input}
              </pre>
              <button
                onClick={() => copyToClipboard(stage.input)}
                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                title="Copy to clipboard"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Output</h4>
            <div className="relative">
              <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-96">
                {stage.output}
              </pre>
              <button
                onClick={() => copyToClipboard(stage.output)}
                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                title="Copy to clipboard"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Input Tokens</div>
                <div className="text-lg">{stage.tokenUsage?.input || 0}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Output Tokens</div>
                <div className="text-lg">{stage.tokenUsage?.output || 0}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Total Tokens</div>
                <div className="text-lg">{stage.tokenUsage?.total || 0}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Cost</div>
                <div className="text-lg">${stage.tokenUsage?.cost?.toFixed(4) || '0.0000'}</div>
              </div>
            </div>
            
            {stage.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Error Details</h4>
                <div className="text-sm text-red-700">
                  <div><strong>Type:</strong> {stage.error.type}</div>
                  <div><strong>Message:</strong> {stage.error.message}</div>
                  {stage.error.details && (
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(stage.error.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="space-y-4">
            {hasVariables ? (
              <>
                {stage.variables?.inputVariables && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <VariableIcon className="w-4 h-4 mr-2" />
                      Input Variables
                    </h4>
                    <div className="relative">
                      <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-40">
                        {JSON.stringify(stage.variables.inputVariables, null, 2)}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(stage.variables?.inputVariables, null, 2))}
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                        title="Copy to clipboard"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {stage.variables?.outputVariables && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <VariableIcon className="w-4 h-4 mr-2" />
                      Output Variables
                    </h4>
                    <div className="relative">
                      <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-40">
                        {JSON.stringify(stage.variables.outputVariables, null, 2)}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(stage.variables?.outputVariables, null, 2))}
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                        title="Copy to clipboard"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {stage.variables?.intermediateVariables && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <VariableIcon className="w-4 h-4 mr-2" />
                      Intermediate Variables
                    </h4>
                    <div className="relative">
                      <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-40">
                        {JSON.stringify(stage.variables.intermediateVariables, null, 2)}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(stage.variables?.intermediateVariables, null, 2))}
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                        title="Copy to clipboard"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <VariableIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No variables available for this stage.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 