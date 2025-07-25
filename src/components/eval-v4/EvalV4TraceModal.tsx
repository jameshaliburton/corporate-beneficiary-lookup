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
import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon'
import ChevronRightIcon from '@heroicons/react/24/outline/ChevronRightIcon'

// Import shared trace types
import { 
  TraceStage, 
  StructuredTraceStage, 
  StructuredTraceSection, 
  StructuredTrace,
  isStructuredTraceStage,
  hasVariables,
  getStatusColor,
  formatDuration
} from '@/types/trace'

interface ScanResult {
  id: string
  product: string
  brand: string
  trace: TraceStage[]
  agent_execution_trace?: StructuredTrace
  source: string
  confidence: number
  status: string
  timestamp: string
  metadata: { [key: string]: any }
}

interface EvalV4TraceModalProps {
  result: ScanResult
  onClose: () => void
  onEditPrompt?: (stage: TraceStage | StructuredTraceStage) => void
}

export default function EvalV4TraceModal({ result, onClose, onEditPrompt }: EvalV4TraceModalProps) {
  console.log('🔍 EvalV4TraceModal: Received result:', result.id)
  console.log('🔍 EvalV4TraceModal: Has structured trace:', !!result.agent_execution_trace?.sections)
  console.log('🔍 EvalV4TraceModal: Has legacy trace:', !!result.trace?.length)
  
  const [selectedStage, setSelectedStage] = useState<TraceStage | StructuredTraceStage | null>(null)
  const [filterSettings, setFilterSettings] = useState({
    showErrors: true,
    showWarnings: true,
    showSuccess: true,
    showPending: true,
    showTechnicalSteps: false,
    showPerformanceAlerts: true,
    showSkippedStages: false,
    minConfidence: 0,
    maxDuration: Infinity,
  })
  const [viewMode, setViewMode] = useState<'timeline' | 'detailed'>('timeline')
  const [autoPlay, setAutoPlay] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Determine if we're using structured or legacy trace
  const isStructuredTrace = !!result.agent_execution_trace?.sections
  const structuredTrace = result.agent_execution_trace
  const legacyTrace = result.trace || []

  // Get section icon for structured traces
  const getSectionIcon = (sectionId: string) => {
    const icons: { [key: string]: string } = {
      vision: '🖼️',
      retrieval: '🔍',
      ownership: '🧠',
      persistence: '📦'
    }
    return icons[sectionId] || '📋'
  }

  // Get status icon for stages
  const getStatusIcon = (stage: TraceStage | StructuredTraceStage) => {
    if ('skipped' in stage && stage.skipped) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
    }
    if ('status' in stage) {
      switch (stage.status) {
        case 'success':
          return <CheckIcon className="h-4 w-4 text-green-500" />
        case 'error':
          return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
        case 'warning':
          return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
        case 'pending':
          return <ClockIcon className="h-4 w-4 text-blue-500" />
        default:
          return <InformationCircleIcon className="h-4 w-4 text-gray-500" />
      }
    }
    return <CheckIcon className="h-4 w-4 text-green-500" />
  }

  // Filter stages based on settings
  const getVisibleStages = (stages: StructuredTraceStage[]) => {
    if (filterSettings.showSkippedStages) {
      return stages
    }
    return stages.filter(stage => !stage.skipped)
  }

  // Get visible sections for structured trace
  const visibleSections = useMemo(() => {
    if (!structuredTrace) return []
    
    return structuredTrace.sections.map(section => {
      const visibleStages = getVisibleStages(section.stages)
      const executedStages = visibleStages.filter(stage => !stage.skipped)
      
      return {
        ...section,
        visibleStages,
        executedStages,
        shouldShow: visibleStages.length > 0
      }
    }).filter(section => section.shouldShow)
  }, [structuredTrace, filterSettings.showSkippedStages])

  // Get total visible stages count
  const totalVisibleStages = useMemo(() => {
    if (isStructuredTrace) {
      return visibleSections.reduce((total, section) => total + section.visibleStages.length, 0)
    } else {
      return legacyTrace.length
    }
  }, [isStructuredTrace, visibleSections, legacyTrace])

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Copy to clipboard utility
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Format variables
  const formatVariables = (variables: { [key: string]: any } | undefined) => {
    if (!variables || Object.keys(variables).length === 0) return 'No variables'
    return JSON.stringify(variables, null, 2)
  }

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Trace Details: {result.brand} - {result.product}
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">
                {isStructuredTrace ? `${totalVisibleStages} stages across ${visibleSections.length} sections` : `${legacyTrace.length} stages`}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filterSettings.showSkippedStages}
                    onChange={(e) => setFilterSettings(prev => ({ ...prev, showSkippedStages: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Show skipped stages</span>
                </label>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'timeline' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'detailed' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    Detailed
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                {isStructuredTrace ? (
                  <span>
                    {visibleSections.length} sections, {totalVisibleStages} stages
                  </span>
                ) : (
                  <span>{legacyTrace.length} stages</span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {isStructuredTrace ? (
              <StructuredTraceView
                sections={visibleSections}
                selectedStage={selectedStage as StructuredTraceStage}
                onStageSelect={setSelectedStage}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
                onEditPrompt={onEditPrompt}
                copyToClipboard={copyToClipboard}
                viewMode={viewMode}
              />
            ) : (
              <LegacyTraceView
                stages={legacyTrace}
                selectedStage={selectedStage as TraceStage}
                onStageSelect={setSelectedStage}
                onEditPrompt={onEditPrompt}
                copyToClipboard={copyToClipboard}
                viewMode={viewMode}
              />
            )}
          </div>

          {/* Stage Details */}
          {selectedStage && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <StageDetails
                stage={selectedStage}
                onEditPrompt={onEditPrompt}
                copyToClipboard={copyToClipboard}
              />
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}



// Structured trace view component
function StructuredTraceView({
  sections,
  selectedStage,
  onStageSelect,
  expandedSections,
  onToggleSection,
  onEditPrompt,
  copyToClipboard,
  viewMode
}: {
  sections: Array<StructuredTraceSection & { visibleStages: StructuredTraceStage[], executedStages: StructuredTraceStage[], shouldShow: boolean }>
  selectedStage: StructuredTraceStage | null
  onStageSelect: (stage: StructuredTraceStage) => void
  expandedSections: Set<string>
  onToggleSection: (sectionId: string) => void
  onEditPrompt?: (stage: StructuredTraceStage) => void
  copyToClipboard: (text: string) => void
  viewMode: 'timeline' | 'detailed'
}) {
  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'vision': return '👁️'
      case 'retrieval': return '🔍'
      case 'ownership': return '🏢'
      case 'persistence': return '💾'
      default: return '📋'
    }
  }

  const getStatusIcon = (stage: StructuredTraceStage) => {
    if (stage.skipped) return '⏭️'
    return '✅'
  }

  const formatDuration = (durationMs: number | undefined) => {
    if (!durationMs) return 'N/A'
    return `${durationMs}ms`
  }

  return (
    <div className="p-4 space-y-4">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id)
        const executedCount = section.executedStages.length
        const totalCount = section.visibleStages.length
        
        return (
          <div key={section.id} className="border border-gray-200 rounded-lg">
            {/* Section Header */}
            <div 
              className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => onToggleSection(section.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getSectionIcon(section.id)}</span>
                <h3 className="font-medium text-gray-900">
                  {section.label}
                </h3>
                <span className="text-sm text-gray-500">
                  {executedCount} executed / {totalCount} total
                </span>
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
                {section.visibleStages.map((stage) => {
                  const isSelected = selectedStage?.id === stage.id
                  
                  return (
                    <div 
                      key={stage.id} 
                      className={`border rounded-lg p-3 cursor-pointer ${
                        stage.skipped 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-white border-gray-200'
                      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => onStageSelect(stage)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(stage)}
                          <h4 className="font-medium text-gray-900">
                            {stage.label}
                          </h4>
                          {stage.skipped && (
                            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                              Skipped
                            </span>
                          )}
                          {stage.durationMs && (
                            <span className="text-xs text-gray-500">
                              {formatDuration(stage.durationMs)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {(() => {
                            console.log('🔍 EvalV4TraceModal: Stage:', stage.id, 'onEditPrompt:', !!onEditPrompt, 'promptTemplate:', !!stage.promptTemplate)
                            return onEditPrompt && stage.promptTemplate && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('🔍 EvalV4TraceModal: Clicking View Prompt for stage:', stage.id)
                                  onEditPrompt(stage)
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                <EyeIcon className="h-3 w-3 mr-1" />
                                View Prompt
                              </button>
                            )
                          })()}
                        </div>
                      </div>
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

// Legacy trace view component (existing implementation)
function LegacyTraceView({
  stages,
  selectedStage,
  onStageSelect,
  onEditPrompt,
  copyToClipboard,
  viewMode
}: {
  stages: TraceStage[]
  selectedStage: TraceStage | null
  onStageSelect: (stage: TraceStage) => void
  onEditPrompt?: (stage: TraceStage) => void
  copyToClipboard: (text: string) => void
  viewMode: 'timeline' | 'detailed'
}) {
  if (viewMode === 'timeline') {
    return (
      <TimelineView
        stages={stages}
        selectedStage={selectedStage}
        onStageSelect={onStageSelect}
        currentStepIndex={0}
        onEditPrompt={onEditPrompt}
        copyToClipboard={copyToClipboard}
      />
    )
  } else {
    return (
      <DetailedView
        stages={stages}
        selectedStage={selectedStage}
        onStageSelect={onStageSelect}
        onEditPrompt={onEditPrompt}
        copyToClipboard={copyToClipboard}
      />
    )
  }
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
  stage: TraceStage | StructuredTraceStage
  onEditPrompt?: (stage: TraceStage | StructuredTraceStage) => void
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

  const hasVariables = 'variables' in stage && (
    stage.variables?.inputVariables || 
    stage.variables?.outputVariables || 
    stage.variables?.intermediateVariables
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{'stage' in stage ? stage.stage : stage.id}</h3>
        {onEditPrompt && 'status' in stage && stage.status !== 'skipped' && stage.status !== 'not_run' && (
          <button
            onClick={() => onEditPrompt(stage)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit Prompt
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Status */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Status</h4>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('status' in stage ? stage.status : 'completed')}`}>
              {'status' in stage ? stage.status : 'completed'}
            </span>
            {'agentName' in stage && (
              <span className="text-sm text-gray-500">Agent: {stage.agentName}</span>
            )}
          </div>
        </div>

        {/* Duration */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Duration</h4>
          <p className="text-sm text-gray-600">
            {'duration' in stage ? formatDuration(stage.duration) : formatDuration(stage.durationMs)}
          </p>
        </div>

        {/* Confidence */}
        {'confidence' in stage && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Confidence</h4>
            <p className="text-sm text-gray-600">{stage.confidence}%</p>
          </div>
        )}

        {/* Reasoning */}
        {'reasoning' in stage && stage.reasoning && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Reasoning</h4>
            <p className="text-sm text-gray-600">{stage.reasoning}</p>
          </div>
        )}

        {/* Status */}
        {'status' in stage && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Status</h4>
            <p className="text-sm text-gray-600">{stage.status}</p>
          </div>
        )}

        {/* Input/Output */}
        {'input' in stage && stage.input && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Input</h4>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <pre className="whitespace-pre-wrap">{stage.input}</pre>
            </div>
          </div>
        )}

        {'output' in stage && stage.output && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Output</h4>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <pre className="whitespace-pre-wrap">{stage.output}</pre>
            </div>
          </div>
        )}

        {/* Prompt */}
        {'compiledPrompt' in stage && stage.compiledPrompt && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Compiled Prompt</h4>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <pre className="whitespace-pre-wrap">{stage.compiledPrompt}</pre>
            </div>
            <button
              onClick={() => copyToClipboard(stage.compiledPrompt)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Copy to Clipboard
            </button>
          </div>
        )}

        {/* Prompt Template */}
        {'compiledPrompt' in stage && stage.promptTemplate && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Prompt Template</h4>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <pre className="whitespace-pre-wrap">{stage.promptTemplate}</pre>
            </div>
            <button
              onClick={() => copyToClipboard(stage.promptTemplate)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Copy to Clipboard
            </button>
          </div>
        )}

        {/* Variables */}
        {('inputVariables' in stage || 'outputVariables' in stage || 'intermediateVariables' in stage) && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Variables</h4>
            <div className="space-y-2">
              {'inputVariables' in stage && stage.inputVariables && (
                <div>
                  <h5 className="text-sm font-medium text-gray-600">Input Variables</h5>
                  <pre className="bg-gray-100 p-2 rounded text-xs font-mono">
                    {JSON.stringify(stage.inputVariables, null, 2)}
                  </pre>
                </div>
              )}
              {'outputVariables' in stage && stage.outputVariables && (
                <div>
                  <h5 className="text-sm font-medium text-gray-600">Output Variables</h5>
                  <pre className="bg-gray-100 p-2 rounded text-xs font-mono">
                    {JSON.stringify(stage.outputVariables, null, 2)}
                  </pre>
                </div>
              )}
              {'intermediateVariables' in stage && stage.intermediateVariables && (
                <div>
                  <h5 className="text-sm font-medium text-gray-600">Intermediate Variables</h5>
                  <pre className="bg-gray-100 p-2 rounded text-xs font-mono">
                    {JSON.stringify(stage.intermediateVariables, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 