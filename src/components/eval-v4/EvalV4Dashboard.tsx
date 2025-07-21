'use client'

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
  metadata: {
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
    decisions?: string[]
    error?: string
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
  status: string
  metadata: { [key: string]: any }
}

interface FilterState {
  searchTerm: string
  sourceType: 'all' | 'live' | 'eval' | 'retry'
  confidenceRange: [number, number]
}

export default function EvalV4Dashboard() {
  console.log('EvalV4Dashboard component rendered')
  
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
      'ownership_analysis': 'Ownership Research Agent'
    }
    return agentMap[stage] || 'Unknown Agent'
  }

  const formatInput = (stage: any): string => {
    if (stage.data?.brand) return `Brand: ${stage.data.brand}`
    if (stage.data?.barcode) return `Barcode: ${stage.data.barcode}`
    return `Stage: ${stage.stage}`
  }

  const formatOutput = (stage: any): string => {
    if (stage.data?.financial_beneficiary) return `Owner: ${stage.data.financial_beneficiary}`
    if (stage.data?.confidence_score) return `Confidence: ${stage.data.confidence_score}%`
    if (stage.data?.result) return `Result: ${stage.data.result}`
    return `Status: ${stage.status}`
  }

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Starting to fetch data...')
        
        const response = await fetch('/api/evaluation/v3/results?dataSource=live')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        console.log('API Response:', data)
        console.log('Results count:', (data.results || data || []).length)
        
        const rawResults = data.results || data || []
        console.log('Raw results array length:', rawResults.length)
        
        if (rawResults.length === 0) {
          console.log('No results found in API response')
          setResults([])
          setFilteredResults([])
          return
        }
        
        console.log('First raw result:', rawResults[0])
        console.log('Raw results structure:', JSON.stringify(rawResults[0], null, 2))
        
        // Transform API data to match expected format
        const transformedResults = rawResults.map((result: any) => {
          // Transform trace stages to match expected format
          const transformedTrace = (result.agent_execution_trace?.stages || []).map((stage: any) => ({
            stage: stage.stage || 'unknown',
            reasoning: formatReasoning(stage.reasoning || []),
            confidence: stage.data?.confidence_score || result.confidence_score || 0,
            timestamp: stage.end_time || stage.start_time || new Date().toISOString(),
            promptVersion: result.prompt_version || '1.0',
            agentName: getAgentName(stage.stage),
            status: stage.status || 'success',
            duration: stage.duration_ms || 0,
            input: formatInput(stage),
            output: formatOutput(stage),
            prompt: {
              system: 'You are an ownership research specialist',
              user: `Determine the owner of brand: ${result.brand}`,
              version: '1.0'
            },
            metadata: {
              alternatives: stage.decisions?.[0]?.alternatives || [],
              disambiguation: null,
              ocrText: null,
              imageAnalysis: null,
              entityValidation: null,
              fallbackTriggers: [],
              lookupResults: []
            }
          }))

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
            trace: transformedTrace,
            timestamp: result.timestamp || new Date().toISOString()
          }
        })
        
        console.log('Transformed results:', transformedResults.length)
        console.log('First transformed result:', transformedResults[0])
        console.log('Sample confidence scores:', transformedResults.slice(0, 3).map(r => r.confidence))
        
        setResults(transformedResults)
        setFilteredResults(transformedResults)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter results based on current filters
  useEffect(() => {
    console.log('Filtering results...')
    console.log('Total results:', results.length)
    console.log('Current filters:', filters)

    let filtered = [...results]
    console.log('Initial filtered count:', filtered.length)

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
        {filteredResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No results found matching the current filters.
          </div>
        ) : (
          <div>
            {filteredResults.map((result) => (
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
            ))}
          </div>
        )}
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