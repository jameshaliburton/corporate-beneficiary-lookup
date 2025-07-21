'use client'

import { Dialog } from '@headlessui/react'
import { useState, useEffect } from 'react'
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import CheckIcon from '@heroicons/react/24/outline/CheckIcon'
import CloudIcon from '@heroicons/react/24/outline/CloudIcon'
import CodeBracketIcon from '@heroicons/react/24/outline/CodeBracketIcon'
import DocumentIcon from '@heroicons/react/24/outline/DocumentIcon'
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon'
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon'
import EyeIcon from '@heroicons/react/24/outline/EyeIcon'
import PlayIcon from '@heroicons/react/24/outline/PlayIcon'
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon'
import PencilIcon from '@heroicons/react/24/outline/PencilIcon'
import EyeDropperIcon from '@heroicons/react/24/outline/EyeDropperIcon'
import CogIcon from '@heroicons/react/24/outline/CogIcon'
import RocketLaunchIcon from '@heroicons/react/24/outline/RocketLaunchIcon'
import ClockIcon from '@heroicons/react/24/outline/ClockIcon'
import InformationCircleIcon from '@heroicons/react/24/outline/InformationCircleIcon'
import VariableIcon from '@heroicons/react/24/outline/VariableIcon'
import ClipboardDocumentIcon from '@heroicons/react/24/outline/ClipboardDocumentIcon'
import BeakerIcon from '@heroicons/react/24/outline/BeakerIcon'
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon'

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

interface EvalV4PromptWorkflowModalProps {
  stage: TraceStage
  result: ScanResult
  onClose: () => void
}

interface ExtractedVariable {
  name: string
  value: any
  source: string
  type: 'string' | 'number' | 'boolean' | 'object'
  confidence: number
  stage?: string
}

export default function EvalV4PromptWorkflowModal({ stage, result, onClose }: EvalV4PromptWorkflowModalProps) {
  console.log('🔧 EvalV4PromptWorkflowModal: Received stage:', stage.stage, 'with variables:', !!stage.variables)
  console.log('🔧 EvalV4PromptWorkflowModal: Stage variables:', stage.variables)
  console.log('🔧 EvalV4PromptWorkflowModal: Stage config:', stage.config)
  console.log('🔧 EvalV4PromptWorkflowModal: Stage compiledPrompt:', !!stage.compiledPrompt)
  console.log('🔧 EvalV4PromptWorkflowModal: Stage promptTemplate:', !!stage.promptTemplate)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [editedPrompts, setEditedPrompts] = useState<{ system: string; user: string }>({ 
    system: stage.prompt.system, 
    user: stage.prompt.user 
  })
  const [extractedVariables, setExtractedVariables] = useState<ExtractedVariable[]>([])
  const [selectedVariables, setSelectedVariables] = useState<Set<string>>(new Set())
  const [previewMode, setPreviewMode] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Workflow steps
  const workflowSteps = [
    {
      id: 'analyze',
      title: 'Analyze Current Stage',
      description: 'Review the current stage execution and identify areas for improvement',
      icon: EyeIcon,
    },
    {
      id: 'extract',
      title: 'Extract Variables',
      description: 'Extract variables from previous stage outputs for use in prompts',
      icon: VariableIcon,
    },
    {
      id: 'edit',
      title: 'Edit Prompts',
      description: 'Modify system and user prompts with extracted variables',
      icon: PencilIcon,
    },
    {
      id: 'test',
      title: 'Test Changes',
      description: 'Simulate the modified prompts to verify improvements',
      icon: BeakerIcon,
    },
    {
      id: 'deploy',
      title: 'Deploy Changes',
      description: 'Save changes and optionally rerun the evaluation',
      icon: RocketLaunchIcon,
    },
  ]

  // Extract variables from previous stage outputs and current stage
  useEffect(() => {
    const variables: ExtractedVariable[] = []
    
    // Extract from current stage variables if available
    if (stage.variables) {
      if (stage.variables.inputVariables) {
        Object.entries(stage.variables.inputVariables).forEach(([key, value]) => {
          variables.push({
            name: key,
            value: value,
            source: `${stage.stage} input variables`,
            type: typeof value as any,
            confidence: 0.95,
            stage: stage.stage
          })
        })
      }
      
      if (stage.variables.outputVariables) {
        Object.entries(stage.variables.outputVariables).forEach(([key, value]) => {
          variables.push({
            name: key,
            value: value,
            source: `${stage.stage} output variables`,
            type: typeof value as any,
            confidence: 0.95,
            stage: stage.stage
          })
        })
      }
      
      if (stage.variables.intermediateVariables) {
        Object.entries(stage.variables.intermediateVariables).forEach(([key, value]) => {
          variables.push({
            name: key,
            value: value,
            source: `${stage.stage} intermediate variables`,
            type: typeof value as any,
            confidence: 0.9,
            stage: stage.stage
          })
        })
      }
    }
    
    // Look at previous stages in the trace
    const currentStageIndex = result.trace.findIndex(s => s.stage === stage.stage)
    if (currentStageIndex > 0) {
      const previousStage = result.trace[currentStageIndex - 1]
      
      // Extract from previous stage variables
      if (previousStage.variables) {
        if (previousStage.variables.outputVariables) {
          Object.entries(previousStage.variables.outputVariables).forEach(([key, value]) => {
            variables.push({
              name: key,
              value: value,
              source: `${previousStage.stage} output variables`,
              type: typeof value as any,
              confidence: 0.9,
              stage: previousStage.stage
            })
          })
        }
      }
      
      // Try to extract JSON from output
      try {
        const jsonMatch = previousStage.output.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0])
          Object.entries(jsonData).forEach(([key, value]) => {
            variables.push({
              name: key,
              value: value,
              source: `${previousStage.stage} output (JSON)`,
              type: typeof value as any,
              confidence: 0.8,
              stage: previousStage.stage
            })
          })
        }
      } catch (e) {
        // If JSON parsing fails, extract simple patterns
        const simplePatterns = [
          /"([^"]+)":\s*"([^"]+)"/g,
          /'([^']+)':\s*'([^']+)'/g,
          /(\w+):\s*([^\s,}]+)/g,
        ]
        
        simplePatterns.forEach(pattern => {
          let match
          while ((match = pattern.exec(previousStage.output)) !== null) {
            variables.push({
              name: match[1],
              value: match[2],
              source: `${previousStage.stage} output (pattern)`,
              type: 'string',
              confidence: 0.7,
              stage: previousStage.stage
            })
          }
        })
      }
    }
    
    // Extract from result metadata
    if (result.metadata) {
      Object.entries(result.metadata).forEach(([key, value]) => {
        variables.push({
          name: key,
          value: value,
          source: 'result metadata',
          type: typeof value as any,
          confidence: 0.85,
          stage: 'result'
        })
      })
    }
    
    setExtractedVariables(variables)
  }, [stage, result])

  const handleVariableSelect = (variableName: string) => {
    const newSelected = new Set(selectedVariables)
    if (newSelected.has(variableName)) {
      newSelected.delete(variableName)
    } else {
      newSelected.add(variableName)
    }
    setSelectedVariables(newSelected)
  }

  const insertVariable = (variableName: string) => {
    const variable = extractedVariables.find(v => v.name === variableName)
    if (variable) {
      const placeholder = `{{${variableName}}}`
      // This would be handled by the text editor component
      console.log('Insert variable:', placeholder)
    }
  }

  const copyVariable = (variableName: string) => {
    const variable = extractedVariables.find(v => v.name === variableName)
    if (variable) {
      navigator.clipboard.writeText(JSON.stringify(variable.value))
    }
  }

  const copyAllVariables = () => {
    const allVariables = extractedVariables.reduce((acc, variable) => {
      acc[variable.name] = variable.value
      return acc
    }, {} as { [key: string]: any })
    navigator.clipboard.writeText(JSON.stringify(allVariables, null, 2))
  }

  const getStepIcon = (icon: any) => {
    const IconComponent = icon
    return <IconComponent className="w-4 h-4" />
  }

  const renderStepContent = () => {
    switch (workflowSteps[currentStep].id) {
      case 'analyze':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Stage Analysis</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Stage:</span> {stage.stage}
                </div>
                <div>
                  <span className="font-medium">Agent:</span> {stage.agentName}
                </div>
                <div>
                  <span className="font-medium">Confidence:</span> {(stage.confidence * 100).toFixed(1)}%
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {stage.duration}ms
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    stage.status === 'success' ? 'bg-green-100 text-green-800' :
                    stage.status === 'error' ? 'bg-red-100 text-red-800' :
                    stage.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {stage.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">System Prompt</h4>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                  {stage.prompt.system}
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">User Prompt</h4>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                  {stage.prompt.user}
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Input</h4>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                {stage.input}
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Output</h4>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                {stage.output}
              </div>
            </div>

            {/* Variables Section */}
            {stage.variables && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center">
                  <VariableIcon className="w-4 h-4 mr-2" />
                  Available Variables
                </h4>
                <div className="space-y-3">
                  {stage.variables.inputVariables && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Input Variables</h5>
                      <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                        {JSON.stringify(stage.variables.inputVariables, null, 2)}
                      </div>
                    </div>
                  )}
                  {stage.variables.outputVariables && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Output Variables</h5>
                      <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                        {JSON.stringify(stage.variables.outputVariables, null, 2)}
                      </div>
                    </div>
                  )}
                  {stage.variables.intermediateVariables && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Intermediate Variables</h5>
                      <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                        {JSON.stringify(stage.variables.intermediateVariables, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      case 'extract':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Variable Extraction</h3>
              <p className="text-yellow-800">
                Found {extractedVariables.length} variables from previous stage outputs and current stage. 
                Select variables to use in prompt modifications.
              </p>
              {extractedVariables.length > 0 && (
                <button
                  onClick={copyAllVariables}
                  className="mt-2 flex items-center space-x-1 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  <span>Copy all variables</span>
                </button>
              )}
            </div>
            
            {extractedVariables.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {extractedVariables.map((variable) => (
                  <div
                    key={`${variable.stage}-${variable.name}`}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedVariables.has(variable.name)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleVariableSelect(variable.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{variable.name}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            insertVariable(variable.name)
                          }}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="Insert variable"
                        >
                          <VariableIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyVariable(variable.name)
                          }}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="Copy value"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      Type: {variable.type} • Source: {variable.source}
                      {variable.stage && ` • Stage: ${variable.stage}`}
                    </div>
                    <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {typeof variable.value === 'object' 
                        ? JSON.stringify(variable.value, null, 2)
                        : String(variable.value)
                      }
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <VariableIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No variables found in previous stage outputs.</p>
                <p className="text-sm">Variables will be extracted from JSON responses or simple patterns.</p>
              </div>
            )}
          </div>
        )

      case 'edit':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Prompt Editing</h3>
              <p className="text-green-800">
                Modify the system and user prompts. Use {'{{variable}}'} syntax to insert extracted variables.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">System Prompt</h4>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    {previewMode ? <EyeIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    <span>{previewMode ? 'Edit' : 'Preview'}</span>
                  </button>
                </div>
                {previewMode ? (
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono min-h-[200px]">
                    {editedPrompts.system}
                  </div>
                ) : (
                  <textarea
                    value={editedPrompts.system}
                    onChange={(e) => setEditedPrompts(prev => ({
                      ...prev,
                      system: e.target.value
                    }))}
                    className="w-full h-48 p-3 border rounded-lg font-mono text-sm"
                    placeholder="Enter system prompt..."
                  />
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">User Prompt</h4>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    {previewMode ? <EyeIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    <span>{previewMode ? 'Edit' : 'Preview'}</span>
                  </button>
                </div>
                {previewMode ? (
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono min-h-[200px]">
                    {editedPrompts.user}
                  </div>
                ) : (
                  <textarea
                    value={editedPrompts.user}
                    onChange={(e) => setEditedPrompts(prev => ({
                      ...prev,
                      user: e.target.value
                    }))}
                    className="w-full h-48 p-3 border rounded-lg font-mono text-sm"
                    placeholder="Enter user prompt..."
                  />
                )}
              </div>
            </div>
            
            {selectedVariables.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Variables</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedVariables).map((variableName) => (
                    <span
                      key={variableName}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono"
                    >
                      {variableName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Variables Section */}
            {extractedVariables.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center">
                  <VariableIcon className="w-4 h-4 mr-2" />
                  Available Variables for This Stage
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extractedVariables.slice(0, 6).map((variable) => (
                    <div key={`${variable.stage}-${variable.name}`} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{variable.name}</span>
                        <button
                          onClick={() => copyVariable(variable.name)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="Copy value"
                        >
                          <ClipboardDocumentIcon className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">{variable.source}</div>
                      <div className="text-xs font-mono bg-white p-1 rounded">
                        {typeof variable.value === 'object' 
                          ? JSON.stringify(variable.value)
                          : String(variable.value)
                        }
                      </div>
                    </div>
                  ))}
                </div>
                {extractedVariables.length > 6 && (
                  <div className="mt-2 text-sm text-gray-500">
                    +{extractedVariables.length - 6} more variables available
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'test':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Prompt Testing</h3>
              <p className="text-purple-800">
                Simulate the modified prompts to verify improvements before deployment.
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setIsTesting(true)
                  // Simulate testing
                  setTimeout(() => {
                    setTestResults({
                      success: true,
                      confidence: 0.85,
                      duration: 1200,
                      output: 'Simulated output based on modified prompts...',
                      improvements: [
                        'Better variable handling',
                        'Improved clarity',
                        'Reduced token usage'
                      ]
                    })
                    setIsTesting(false)
                  }, 2000)
                }}
                disabled={isTesting}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                <BeakerIcon className="w-4 h-4" />
                <span>{isTesting ? 'Testing...' : 'Run Test'}</span>
              </button>
            </div>
            
            {testResults && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Test Results</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.success ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-gray-600">Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(testResults.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {testResults.duration}ms
                    </div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium mb-1">Output:</h5>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                      {testResults.output}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-1">Improvements:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {testResults.improvements.map((improvement, index) => (
                        <li key={index} className="text-green-700">{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'deploy':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Deploy Changes</h3>
              <p className="text-green-800">
                Save your prompt modifications and optionally rerun the evaluation with the new prompts.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <DocumentIcon className="w-5 h-5 mr-2" />
                  Save Changes
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Save the modified prompts to the evaluation framework for future use.
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save Prompts
                </button>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <RocketLaunchIcon className="w-5 h-5 mr-2" />
                  Save & Rerun
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Save the prompts and immediately rerun this evaluation with the new prompts.
                </p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Save & Rerun
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Summary of Changes</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>System prompt modified:</span>
                  <span className="font-mono">{editedPrompts.system ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span>User prompt modified:</span>
                  <span className="font-mono">{editedPrompts.user ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Variables used:</span>
                  <span className="font-mono">{selectedVariables.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Variables available:</span>
                  <span className="font-mono">{extractedVariables.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Test results:</span>
                  <span className="font-mono">{testResults ? 'Passed' : 'Not tested'}</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Unknown step</div>
    }
  }

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Prompt Workflow Editor
              </Dialog.Title>
              <p className="text-sm text-gray-500">
                {stage.stage} • {stage.agentName} • Step {currentStep + 1} of {workflowSteps.length}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Workflow Steps */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {workflowSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center space-x-2 ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < currentStep ? 'bg-green-100 text-green-600' :
                      index === currentStep ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {index < currentStep ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        getStepIcon(step.icon)
                      )}
                    </div>
                    <div className="hidden md:block">
                      <div className="text-sm font-medium">{step.title}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className={`w-8 h-1 mx-2 ${
                      index < currentStep ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Previous</span>
            </button>
            
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {workflowSteps.length}
            </div>
            
            <button
              onClick={() => setCurrentStep(Math.min(workflowSteps.length - 1, currentStep + 1))}
              disabled={currentStep === workflowSteps.length - 1}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <span>Next</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 