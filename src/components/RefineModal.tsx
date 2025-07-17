'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Trace from './ProductResultScreen/Trace'

interface ProductResult {
  success: boolean
  product_name?: string
  brand?: string
  barcode?: string
  financial_beneficiary?: string
  beneficiary_country?: string
  beneficiary_flag?: string
  confidence_score?: number
  ownership_structure_type?: string
  user_contributed?: boolean
  ownership_flow?: any[]
  reasoning?: string
  sources?: string[]
  result_type?: string
  agent_execution_trace?: any
}

interface AgentTrace {
  trace_id: string
  stages: any[]
  reasoning_chain: any[]
  performance_metrics: any
}

interface RefinementData {
  trace_id: string
  corrected_owner: string
  corrected_query: string
  error_type: 'wrong_company' | 'hallucinated_source' | 'outdated_info' | 'incomplete' | 'other'
  suggested_evidence: string
  submit_as_test_case: boolean
  notes: string
}

interface RefineModalProps {
  originalResult: ProductResult
  trace: AgentTrace
  onRefine: (correction: RefinementData) => Promise<void>
  onClose: () => void
  isOpen: boolean
}

export const RefineModal: React.FC<RefineModalProps> = ({
  originalResult,
  trace,
  onRefine,
  onClose,
  isOpen
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'trace' | 'refine'>('trace')
  const [refinementData, setRefinementData] = useState<RefinementData>({
    trace_id: trace.trace_id,
    corrected_owner: originalResult.financial_beneficiary,
    corrected_query: '',
    error_type: 'wrong_company',
    suggested_evidence: '',
    submit_as_test_case: false,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await onRefine(refinementData)
      onClose()
    } catch (error) {
      console.error('Refinement failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const errorTypes = [
    { value: 'wrong_company', label: 'Wrong Company', description: 'Agent identified incorrect ultimate owner' },
    { value: 'hallucinated_source', label: 'Hallucinated Source', description: 'Agent cited non-existent evidence' },
    { value: 'outdated_info', label: 'Outdated Information', description: 'Agent used outdated ownership data' },
    { value: 'incomplete', label: 'Incomplete Analysis', description: 'Agent missed important ownership details' },
    { value: 'other', label: 'Other Issue', description: 'Other type of error or improvement needed' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Refine Agent Result</h2>
            <p className="text-gray-600 mt-1">
              Review the agent's reasoning and provide corrections
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Original Result Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Original Result</span>
                <Badge variant={originalResult.confidence_score >= 80 ? 'default' : 'secondary'}>
                  {originalResult.confidence_score}% confidence
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Brand:</span> {originalResult.brand}
                </div>
                <div>
                  <span className="font-semibold">Product:</span> {originalResult.product_name || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Identified Owner:</span> {originalResult.financial_beneficiary}
                </div>
                <div>
                  <span className="font-semibold">Country:</span> {originalResult.beneficiary_country}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'trace'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('trace')}
            >
              🔍 Agent Trace
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'refine'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('refine')}
            >
              🛠️ Provide Correction
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'trace' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Agent Execution Trace</h3>
                <Trace trace={originalResult.agent_execution_trace} />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Agent Reasoning</h3>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {originalResult.reasoning}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'refine' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Corrected Owner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Corrected Ultimate Owner *
                </label>
                <Input
                  value={refinementData.corrected_owner}
                  onChange={(e) => setRefinementData(prev => ({
                    ...prev,
                    corrected_owner: e.target.value
                  }))}
                  placeholder="Enter the correct ultimate owner company name"
                  required
                />
              </div>

              {/* Improved Query */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Improved Query *
                </label>
                <textarea
                  value={refinementData.corrected_query}
                  onChange={(e) => setRefinementData(prev => ({
                    ...prev,
                    corrected_query: e.target.value
                  }))}
                  placeholder="Describe what the agent should search for or how to improve the query..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              {/* Error Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Error Type *
                </label>
                <select
                  value={refinementData.error_type}
                  onChange={(e) => setRefinementData(prev => ({
                    ...prev,
                    error_type: e.target.value as RefinementData['error_type']
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {errorTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Suggested Evidence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggested Evidence or Sources
                </label>
                <textarea
                  value={refinementData.suggested_evidence}
                  onChange={(e) => setRefinementData(prev => ({
                    ...prev,
                    suggested_evidence: e.target.value
                  }))}
                  placeholder="Provide links, company websites, or other sources that could help the agent..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={refinementData.notes}
                  onChange={(e) => setRefinementData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Any additional context or observations about this correction..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              {/* Submit as Test Case */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="submit-as-test-case"
                  checked={refinementData.submit_as_test_case}
                  onChange={(e) => setRefinementData(prev => ({
                    ...prev,
                    submit_as_test_case: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="submit-as-test-case" className="text-sm text-gray-700">
                  Submit as evaluation test case for future agent training
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !refinementData.corrected_owner || !refinementData.corrected_query}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? '🔄 Rerunning Agent...' : '🚀 Rerun Agent with Correction'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 