// Shared trace type definitions
// This file consolidates all trace-related types used across the application

export interface TraceReasoning {
  type: 'info' | 'evidence' | 'error' | 'warning'
  content: string
}

export interface PromptInfo {
  version: string
  agent: string
  input: string
  output: string
  tokens: number
  latency_ms: number
}

// Legacy trace stage interface (for backward compatibility)
export interface TraceStage {
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

// Structured trace stage interface (new canonical format)
export interface StructuredTraceStage {
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

// Structured trace section interface
export interface StructuredTraceSection {
  id: string
  label: string
  stages: StructuredTraceStage[]
}

// Canonical structured trace interface (single source of truth)
export interface StructuredTrace {
  sections: StructuredTraceSection[]
  show_skipped_stages: boolean
  mark_skipped_stages: boolean
}

// Type guard to check if stage is StructuredTraceStage
export const isStructuredTraceStage = (stage: TraceStage | StructuredTraceStage): stage is StructuredTraceStage => {
  return 'id' in stage && 'label' in stage
}

// Type guard to check if stage has variables
export const hasVariables = (stage: TraceStage | StructuredTraceStage): stage is StructuredTraceStage => {
  return isStructuredTraceStage(stage) && (
    'inputVariables' in stage || 
    'outputVariables' in stage || 
    'intermediateVariables' in stage
  )
}

// Utility function for status colors
export const getStatusColor = (status: string) => {
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

// Utility function for formatting duration
export const formatDuration = (durationMs: number | undefined) => {
  if (!durationMs) return 'N/A'
  return `${durationMs}ms`
} 