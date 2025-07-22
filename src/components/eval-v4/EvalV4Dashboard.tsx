'use client'
// @ts-nocheck

import { useState, useEffect } from 'react'
import EvalV4FilterBar from './EvalV4FilterBar'
import EvalV4ResultRow from './EvalV4ResultRow'
import EvalV4BatchToolbar from './EvalV4BatchToolbar'
import EvalV4TraceModal from './EvalV4TraceModal'
import EvalV4PromptWorkflowModal from './EvalV4PromptWorkflowModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon'
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon'
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon'

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
  brand: string
  product: string
  owner: string
  confidence: number
  source: string
  flagged: boolean
  evalSheetEntry: boolean
  trace: TraceStage[]
  agent_execution_trace?: {
    sections: Array<{
      id: string
      label: string
      stages: Array<{
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
      }>
    }>
    show_skipped_stages: boolean
    mark_skipped_stages: boolean
  }
  timestamp: string
  status: string
  metadata: { [key: string]: any }
}

interface FilterState {
  searchTerm: string
  sourceType: 'all' | 'live' | 'eval' | 'retry'
  confidenceRange: [number, number]
}

export default function EvalV4Dashboard() {
  console.log('🚀 EvalV4Dashboard: Component starting render')
  
  const [results, setResults] = useState<ScanResult[]>([])
  const [filteredResults, setFilteredResults] = useState<ScanResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    sourceType: 'all',
    confidenceRange: [0, 100]
  })
  
  // Selection state
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
  
  // Modal state
  const [traceModalOpen, setTraceModalOpen] = useState(false)
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [selectedTrace, setSelectedTrace] = useState<ScanResult | null>(null)
  const [selectedStage, setSelectedStage] = useState<TraceStage | null>(null)

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)

  // Helper functions to format API data
  const formatReasoning = (reasoning: any[]): string => {
    if (!Array.isArray(reasoning)) return 'No reasoning available'
    
    return reasoning.map(item => {
      if (typeof item === 'string') return item
      if (typeof item === 'object' && item.content) return item.content
      return JSON.stringify(item)
    }).join('; ')
  }

  const getAgentName = (stage: string): string => {
    const agentMap: { [key: string]: string } = {
      'cache_check': 'Cache Check Agent',
      'sheets_mapping': 'Google Sheets Agent',
      'static_mapping': 'Static Mapping Agent',
      'web_research': 'Web Research Agent',
      'ownership_analysis': 'Ownership Research Agent',
      'image_processing': 'Image Processing Agent',
      'ocr_extraction': 'OCR Extraction Agent',
      'barcode_scanning': 'Barcode Scanning Agent',
      'barcode_lookup': 'Barcode Lookup Agent',
      'product_lookup': 'Product Lookup Agent',
      'brand_extraction': 'Brand Extraction Agent',
      'llm_first_analysis': 'LLM First Analysis Agent',
      'ownership_research': 'Ownership Research Agent',
      'brand_disambiguation': 'Brand Disambiguation Agent',
      'confidence_estimation': 'Confidence Estimation Agent',
      'quality_assessment': 'Quality Assessment Agent',
      'knowledge_base_lookup': 'Knowledge Base Lookup Agent',
      'query_builder': 'Query Builder Agent',
      'rag_processing': 'RAG Processing Agent',
      'verification_agent': 'Verification Agent',
      'final_analysis': 'Final Analysis Agent',
      'result_compilation': 'Result Compilation Agent'
    }
    return agentMap[stage] || 'Unknown Agent'
  }

  const formatInput = (stage: any): string => {
    if (stage.data?.brand) return `Brand: ${stage.data.brand}`
    if (stage.data?.barcode) return `Barcode: ${stage.data.barcode}`
    if (stage.data?.image_url) return `Image: ${stage.data.image_url}`
    if (stage.data?.text) return `Text: ${stage.data.text}`
    return `Stage: ${stage.stage}`
  }

  const formatOutput = (stage: any): string => {
    if (stage.data?.financial_beneficiary) return `Owner: ${stage.data.financial_beneficiary}`
    if (stage.data?.confidence_score) return `Confidence: ${stage.data.confidence_score}%`
    if (stage.data?.result) return `Result: ${stage.data.result}`
    if (stage.data?.extracted_text) return `Extracted: ${stage.data.extracted_text}`
    return `Status: ${stage.status}`
  }

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('🚀 EvalV4Dashboard: Starting to fetch data...')
        
        const response = await fetch('/api/evaluation/v3/results?dataSource=live')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        console.log('🚀 EvalV4Dashboard: API Response received')
        console.log('🚀 EvalV4Dashboard: Response type:', typeof data)
        console.log('🚀 EvalV4Dashboard: Response keys:', Object.keys(data))
        console.log('🚀 EvalV4Dashboard: Results count:', (data.results || data || []).length)
        
        const rawResults = data.results || data || []
        console.log('🚀 EvalV4Dashboard: Raw results array length:', rawResults.length)
        
        if (rawResults.length === 0) {
          console.log('🚀 EvalV4Dashboard: No results found in API response')
          setResults([])
          setFilteredResults([])
          return
        }
        
        console.log('🚀 EvalV4Dashboard: First raw result keys:', Object.keys(rawResults[0]))
        console.log('🚀 EvalV4Dashboard: First raw result:', rawResults[0])
        
        // Debug: Check if we have trace data
        console.log('🚀 EvalV4Dashboard: First result has agent_execution_trace:', !!rawResults[0].agent_execution_trace)
        if (rawResults[0].agent_execution_trace) {
          console.log('🚀 EvalV4Dashboard: Trace stages count:', rawResults[0].agent_execution_trace.stages?.length || 0)
          console.log('🚀 EvalV4Dashboard: Trace stages:', rawResults[0].agent_execution_trace.stages?.slice(0, 2))
        }
        
        // Transform API data to match expected format
        const transformedResults = rawResults.map((result: any, index: number) => {
          try {
            console.log(`🚀 EvalV4Dashboard: Processing result ${index}:`, result.id)
            console.log(`🚀 EvalV4Dashboard: Has structured trace:`, !!result.agent_execution_trace?.sections)
            console.log(`🚀 EvalV4Dashboard: Has legacy trace:`, !!result.agent_execution_trace?.stages)
            
            // Check if we have structured trace data
            if (result.agent_execution_trace?.sections) {
              console.log(`🚀 EvalV4Dashboard: Using structured trace with ${result.agent_execution_trace.sections.length} sections`)
              // Use structured trace directly - no transformation needed
              return {
                id: result.id || `result-${index}`,
                brand: result.brand || 'Unknown Brand',
                product: result.product_name || result.product || 'Unknown Product',
                owner: result.financial_beneficiary || result.owner || 'Unknown',
                confidence: result.confidence_score || result.confidence || 0,
                source: result.result_type || result.source || 'ai_research',
                flagged: result.flagged || false,
                evalSheetEntry: result.evalSheetEntry || false,
                trace: [], // Legacy trace not needed for structured format
                agent_execution_trace: result.agent_execution_trace,
                timestamp: result.timestamp || result.created_at || new Date().toISOString(),
                status: result.status || 'completed'
              }
            }
            
            // Fall back to legacy trace transformation
            console.log(`🚀 EvalV4Dashboard: Using legacy trace transformation`)
            const traceStages = result.agent_execution_trace?.stages || []
            console.log(`🚀 EvalV4Dashboard: Legacy trace stages count:`, traceStages.length)
            
            // Define the complete pipeline stages, including early image processing
            const completePipeline = [
              'image_processing', 'ocr_extraction', 'barcode_scanning', 'vision_analysis',
              'text_extraction', 'product_detection', 'brand_recognition',
              'cache_check', 'static_mapping', 'sheets_mapping',
              'llm_first_analysis', 'ownership_analysis', 'rag_retrieval',
              'query_builder', 'web_research', 'validation', 'database_save'
            ]
            
            // Create a map of existing stages
            const existingStages = new Map()
            traceStages.forEach((stage: any) => {
              existingStages.set(stage.stage, stage)
            })
            
            // Transform trace stages to match expected format, including missing early stages
            const transformedTrace = completePipeline.map((stageName: string) => {
              const existingStage = existingStages.get(stageName)
              
              if (existingStage) {
                // Stage exists in the database
                console.log(`🚀 EvalV4Dashboard: Processing existing stage:`, stageName)
                return {
                  stage: existingStage.stage || 'unknown',
                  agentName: getAgentName(existingStage.stage),
                  prompt: {
                    system: existingStage.config?.system_prompt || 'You are an ownership research specialist',
                    user: existingStage.config?.user_prompt || `Determine the owner of brand: ${result.brand}`
                  },
                  input: formatInput(existingStage),
                  output: formatOutput(existingStage),
                  confidence: existingStage.data?.confidence_score || result.confidence_score || 0,
                  reasoning: formatReasoning(existingStage.reasoning || []),
                  duration: existingStage.duration_ms || 0,
                  status: existingStage.status || 'success',
                  timestamp: existingStage.end_time || existingStage.start_time || new Date().toISOString(),
                  metadata: {
                    alternatives: existingStage.decisions?.[0]?.alternatives || [],
                    disambiguation: null,
                    ocrText: null,
                    imageAnalysis: null,
                    entityValidation: null,
                    fallbackTriggers: [],
                    lookupResults: []
                  },
                  tokenUsage: existingStage.token_usage || undefined,
                  error: existingStage.error || undefined,
                  variables: existingStage.variables || undefined,
                  config: existingStage.config || undefined,
                  compiledPrompt: existingStage.compiled_prompt || undefined,
                  promptTemplate: existingStage.prompt_template || undefined
                }
              } else {
                // Stage is missing - create a placeholder
                console.log(`🚀 EvalV4Dashboard: Creating placeholder for missing stage:`, stageName)
                
                // Determine if this stage should have run based on input type
                const hasImage = result.source_type === 'image' || result.metadata?.imageAnalysis || result.image_processing_trace
                const hasBarcode = result.barcode && result.barcode !== '' && result.barcode !== 'null'
                
                let status: 'not_run' | 'skipped' | 'missing_data' = 'not_run'
                let reasoning = 'Stage not executed in this trace.'
                
                if (['image_processing', 'ocr_extraction', 'barcode_scanning', 'vision_analysis'].includes(stageName)) {
                  if (hasImage) {
                    status = 'missing_data'
                    reasoning = 'Stage should have run for image input but data is missing from the trace.'
                  } else {
                    status = 'skipped'
                    reasoning = 'Stage not applicable for this input type (no image data).'
                  }
                } else if (hasBarcode && ['barcode_scanning', 'barcode_lookup'].includes(stageName)) {
                  status = 'missing_data'
                  reasoning = 'Stage should have run for barcode input but data is missing from the trace.'
                }
                
                return {
                  stage: stageName,
                  agentName: getAgentName(stageName),
                  prompt: { system: 'N/A', user: 'N/A' },
                  input: 'N/A',
                  output: 'N/A',
                  confidence: 0,
                  reasoning: reasoning,
                  duration: 0,
                  status: status,
                  timestamp: new Date().toISOString(),
                  metadata: {},
                  variables: undefined,
                  config: undefined,
                  compiledPrompt: undefined,
                  promptTemplate: undefined
                }
              }
            })

          const transformedResult = {
            id: result.id?.toString() || `result_${Date.now()}`,
            brand: result.brand || 'Unknown Brand',
            product: result.product_name || result.product || 'Unknown Product',
            owner: result.owner || result.financial_beneficiary || result.expected_owner || 'Unknown Owner',
            confidence: result.confidence_score || result.confidence || 0,
            source: result.source_type || result.source || 'live',
            flagged: result.flagged || false,
            evalSheetEntry: result.evalSheetEntry || false,
            status: result.status || 'completed',
            metadata: result.metadata || {},
            trace: transformedTrace || [],
            timestamp: result.timestamp || new Date().toISOString()
          }
          
          // DEBUG: Log the transformed result
          console.log('🔍 EvalV4Dashboard: Transformed result:', {
            id: transformedResult.id,
            brand: transformedResult.brand,
            owner: transformedResult.owner,
            confidence: transformedResult.confidence,
            source: transformedResult.source,
            traceLength: transformedResult.trace.length
          })
          
          console.log('🚀 EvalV4Dashboard: Transformed result:', transformedResult.id, 'with', transformedTrace.length, 'stages')
          return transformedResult
        } catch (error) {
          console.error('🚀 EvalV4Dashboard: Error transforming result:', error, 'Result:', result)
          // Return a fallback result if transformation fails
          return {
            id: result.id?.toString() || `result_${Date.now()}`,
            brand: result.brand || 'Unknown Brand',
            product: result.product_name || result.product || 'Unknown Product',
            owner: result.owner || result.financial_beneficiary || result.expected_owner || 'Unknown Owner',
            confidence: result.confidence_score || result.confidence || 0,
            source: result.source_type || result.source || 'live',
            flagged: result.flagged || false,
            evalSheetEntry: result.evalSheetEntry || false,
            status: result.status || 'completed',
            metadata: result.metadata || {},
            trace: [],
            timestamp: result.timestamp || new Date().toISOString()
          }
        }
        })
        
        console.log('🎯 EvalV4Dashboard: API returned', transformedResults.length, 'results')
        console.log('🎯 EvalV4Dashboard: Sample result ID:', transformedResults[0]?.id)
        console.log('🎯 EvalV4Dashboard: Sample result has', transformedResults[0]?.trace?.length || 0, 'stages')
        console.log('🎯 EvalV4Dashboard: Sample stages:', transformedResults[0]?.trace?.slice(0, 2).map(s => ({ stage: s.stage, status: s.status, hasVariables: !!s.variables, hasConfig: !!s.config })))
        
        // DEBUG: Log full payload structure
        console.log('🔍 EvalV4Dashboard: FULL TRANSFORMED RESULTS:', JSON.stringify(transformedResults.slice(0, 1), null, 2))
        console.log('🔍 EvalV4Dashboard: First result trace stages:', transformedResults[0]?.trace?.map(s => ({
          stage: s.stage,
          status: s.status,
          hasVariables: !!s.variables,
          hasConfig: !!s.config,
          hasCompiledPrompt: !!s.compiledPrompt,
          hasPromptTemplate: !!s.promptTemplate
        })))
        
        // DEBUG: Check if results have required fields
        console.log('🔍 EvalV4Dashboard: Checking required fields for first result:')
        if (transformedResults[0]) {
          const result = transformedResults[0]
          console.log('  - id:', result.id)
          console.log('  - brand:', result.brand)
          console.log('  - product:', result.product)
          console.log('  - owner:', result.owner)
          console.log('  - confidence:', result.confidence)
          console.log('  - source:', result.source)
          console.log('  - trace length:', result.trace?.length)
        }
        
        setResults(transformedResults)
        setFilteredResults(transformedResults)
      } catch (error) {
        console.error('🚀 EvalV4Dashboard: Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter results based on current filters
  useEffect(() => {
    console.log('🎨 EvalV4Dashboard: Filtering results...')
    console.log('🎨 EvalV4Dashboard: Total results:', results.length)
    console.log('🎨 EvalV4Dashboard: Current filters:', filters)
    console.log('🎨 EvalV4Dashboard: Sample results:', results.slice(0, 2).map(r => ({
      id: r.id,
      brand: r.brand,
      owner: r.owner,
      confidence: r.confidence,
      source: r.source
    })))

    let filtered = [...results]
    console.log('🎨 EvalV4Dashboard: Initial filtered count:', filtered.length)

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(result => 
        result.brand.toLowerCase().includes(searchLower) ||
        result.product.toLowerCase().includes(searchLower) ||
        result.owner.toLowerCase().includes(searchLower)
      )
      console.log('After search filter:', filtered.length, 'results')
    }

    // Source type filter
    if (filters.sourceType !== 'all') {
      filtered = filtered.filter(result => result.source === filters.sourceType)
      console.log('After source filter:', filtered.length, 'results')
    }

    // Confidence range filter
    const beforeConfidence = filtered.length
    filtered = filtered.filter(result => 
      result.confidence >= filters.confidenceRange[0] && 
      result.confidence <= filters.confidenceRange[1]
    )
    console.log('Before confidence filter:', beforeConfidence, 'results')
    console.log('After confidence filter:', filtered.length, 'results')
    console.log('Confidence range:', filters.confidenceRange)
    console.log('Sample confidences:', filtered.slice(0, 3).map(r => r.confidence))

    console.log('Final filtered results:', filtered.length)
    setFilteredResults(filtered)
  }, [results, filters])

  // Action handlers
  const handleToggleSelect = (resultId: string) => {
    const newSelected = new Set(selectedResults)
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId)
    } else {
      newSelected.add(resultId)
    }
    setSelectedResults(newSelected)
  }

  const handleToggleExpand = (resultId: string) => {
    const newExpanded = new Set(expandedResults)
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId)
    } else {
      newExpanded.add(resultId)
    }
    setExpandedResults(newExpanded)
  }

  const handleRerunAll = async () => {
    setIsProcessing(true)
    console.log('Rerunning all selected results:', Array.from(selectedResults))
    // TODO: Implement actual rerun logic
    setTimeout(() => setIsProcessing(false), 2000)
  }

  const handleFlagAll = async () => {
    setIsProcessing(true)
    console.log('Flagging all selected results:', Array.from(selectedResults))
    // TODO: Implement actual flag logic
    setTimeout(() => setIsProcessing(false), 2000)
  }

  const handleExport = (format: 'json' | 'csv') => {
    const selectedData = results.filter(r => selectedResults.has(r.id))
    if (format === 'json') {
      const dataStr = JSON.stringify(selectedData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'evaluation-results.json'
      link.click()
    } else {
      // CSV export
      const csvContent = [
        ['Brand', 'Product', 'Owner', 'Confidence', 'Source'],
        ...selectedData.map(r => [r.brand, r.product, r.owner, r.confidence, r.source])
      ].map(row => row.join(',')).join('\n')
      
      const dataBlob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'evaluation-results.csv'
      link.click()
    }
  }

  const handleClearSelection = () => {
    setSelectedResults(new Set())
  }

  // Modal handlers
  const handleOpenTraceModal = (result: ScanResult) => {
    setSelectedTrace(result)
    setTraceModalOpen(true)
  }

  const handleOpenPromptModal = (stage: TraceStage, result: ScanResult) => {
    setSelectedStage(stage)
    setSelectedTrace(result)
    setPromptModalOpen(true)
  }

  // Individual action handlers
  const handleRerun = async (result: ScanResult) => {
    console.log('Rerunning result:', result.id)
    // TODO: Implement actual rerun logic
  }

  const handleFlag = async (result: ScanResult) => {
    console.log('Flagging result:', result.id)
    // TODO: Implement actual flag logic
  }

  // Calculate metrics
  const totalResults = filteredResults.length
  const flaggedResults = filteredResults.filter(r => r.flagged).length
  const evalResults = filteredResults.filter(r => r.evalSheetEntry).length
  const avgConfidence = totalResults > 0 
    ? Math.round(filteredResults.reduce((sum, r) => sum + r.confidence, 0) / totalResults)
    : 0

  console.log('🎨 EvalV4Dashboard: Starting render - loading:', loading, 'results count:', results.length, 'filtered count:', filteredResults.length)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Evaluation Dashboard V4
        </h1>
        <p className="text-gray-600">
          Interactive evaluation results with enhanced trace timeline and batch operations
        </p>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Results</p>
              <p className="text-2xl font-bold text-gray-900">{totalResults}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-gray-900">{flaggedResults}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Eval Entries</p>
              <p className="text-2xl font-bold text-gray-900">{evalResults}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="h-6 w-6 text-purple-600 font-bold">{avgConfidence}%</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">{avgConfidence}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <EvalV4FilterBar 
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
      />

      {/* Batch Toolbar */}
      <EvalV4BatchToolbar
        selectedCount={selectedResults.size}
        onRerunAll={handleRerunAll}
        onFlagAll={handleFlagAll}
        onExport={handleExport}
        onClearSelection={handleClearSelection}
        isProcessing={isProcessing}
      />

      {/* Results Table */}
      <div className="bg-white rounded-lg border">
        {/* Table Header */}
        <div className="flex items-center p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center mr-3">
            <input
              type="checkbox"
              checked={selectedResults.size === filteredResults.length && filteredResults.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedResults(new Set(filteredResults.map(r => r.id)))
                } else {
                  setSelectedResults(new Set())
                }
              }}
              className="rounded border-gray-300"
            />
          </div>
          <div className="flex-1 font-medium text-gray-900">Brand</div>
          <div className="flex-1 font-medium text-gray-900">Owner</div>
          <div className="w-20 text-center font-medium text-gray-900">Confidence</div>
          <div className="w-20 text-center font-medium text-gray-900">Source</div>
          <div className="w-32 text-center font-medium text-gray-900">Actions</div>
        </div>

        {/* Results */}
        {(() => {
          console.log('🎨 EvalV4Dashboard: Rendering', filteredResults.length, 'results to EvalV4ResultRow components')
          return filteredResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No results found matching the current filters.
            </div>
          ) : (
            <div>
              {filteredResults.map((result) => {
                console.log('🎨 EvalV4Dashboard: Rendering result', result.id, 'with', result.trace?.length || 0, 'stages')
                return (
                  <EvalV4ResultRow
                    key={result.id}
                    result={result}
                    isExpanded={expandedResults.has(result.id)}
                    isSelected={selectedResults.has(result.id)}
                    onToggleExpand={() => handleToggleExpand(result.id)}
                    onToggleSelect={() => handleToggleSelect(result.id)}
                    onOpenTraceModal={handleOpenTraceModal}
                    onOpenPromptModal={handleOpenPromptModal}
                    onRerun={handleRerun}
                    onFlag={handleFlag}
                  />
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* Modals */}
      {selectedTrace && traceModalOpen && (
        <EvalV4TraceModal
          result={selectedTrace}
          onClose={() => setTraceModalOpen(false)}
          onEditPrompt={handleOpenPromptModal}
        />
      )}

      {selectedStage && selectedTrace && promptModalOpen && (
        <EvalV4PromptWorkflowModal
          stage={selectedStage}
          result={selectedTrace}
          onClose={() => setPromptModalOpen(false)}
        />
      )}
    </div>
  )
} 