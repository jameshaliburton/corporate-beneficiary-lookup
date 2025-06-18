'use client'

import { useState } from 'react'
import { BarcodeScanner } from '../components/BarcodeScanner'

interface LookupResult {
  success: boolean
  product_name?: string
  brand?: string
  barcode?: string
  source?: string
  financial_beneficiary?: string
  beneficiary_country?: string
  beneficiary_flag?: string
  confidence?: number
  verification_status?: string
  sources?: string[]
  reasoning?: string
  debug?: {
    pipeline_steps: Array<{
      step: string
      duration_ms: number
      success: boolean
      source?: string
      details: string
    }>
    confidence_breakdown: {
      original: number
      adjustment: number
      final: number
      reasoning: string
    }
    raw_responses: {
      knowledge?: string
      verification?: string
    }
    total_duration_ms: number
  }
  error?: string
}

export default function HomePage() {
  const [result, setResult] = useState<LookupResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  const handleLookup = async (barcode: string) => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return 'Highly Likely'
    if (score >= 60) return 'Likely'  
    if (score >= 20) return 'Unconfirmed'
    return 'Unknown'
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 20) return 'text-orange-600'
    return 'text-red-600'
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Corporate Beneficiary Lookup
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <BarcodeScanner onBarcode={handleLookup} />
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Researching ownership...</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {result.success ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900">
                    🔍 {result.product_name}
                  </h2>
                  
                  <div className="mb-4">
                    <p className="text-lg">
                      <span className="font-medium">Primary Beneficiary:</span> {result.beneficiary_flag} {result.financial_beneficiary} ({result.beneficiary_country})
                    </p>
                    <p className="text-lg">
                      <span className="font-medium">Confidence:</span> 
                      <span className={`ml-2 font-semibold ${getConfidenceColor(result.confidence || 0)}`}>
                        {getConfidenceLabel(result.confidence || 0)} ({result.confidence}%)
                      </span>
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2 text-gray-700">📋 Research Performed:</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>✅ Product identified via {result.source?.toUpperCase()} database</li>
                      <li>✅ Corporate knowledge verified</li>
                      <li>✅ Sources cross-referenced</li>
                      <li>⏱️ Research completed ({formatDuration(result.debug?.total_duration_ms || 0)})</li>
                    </ul>
                  </div>

                  {result.reasoning && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reasoning:</span> {result.reasoning}
                      </p>
                    </div>
                  )}
                </div>

                {result.debug && (
                  <div className="border-t pt-6">
                    <button
                      onClick={() => setShowDebug(!showDebug)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <span className="text-lg">🔍</span>
                      <span className="font-medium">Agent Analysis</span>
                      <span className="text-sm">({showDebug ? 'Hide' : 'Show'} Details)</span>
                    </button>

                    {showDebug && (
                      <div className="mt-4 space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-3 text-gray-800">Pipeline Steps</h4>
                          <div className="space-y-2">
                            {result.debug.pipeline_steps.map((step, index) => (
                              <div key={index} className="flex items-center justify-between bg-white rounded px-3 py-2">
                                <div className="flex items-center space-x-3">
                                  <span className={`w-2 h-2 rounded-full ${step.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                  <span className="font-mono text-sm">{step.step.replace('_', ' ')}</span>
                                  <span className="text-sm text-gray-600">{step.details}</span>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">{formatDuration(step.duration_ms)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-3 text-gray-800">Confidence Calculation</h4>
                          <div className="bg-white rounded px-3 py-2 font-mono text-sm">
                            <div>Original: {result.debug.confidence_breakdown.original}%</div>
                            <div>Adjustment: {result.debug.confidence_breakdown.adjustment >= 0 ? '+' : ''}{result.debug.confidence_breakdown.adjustment}%</div>
                            <div className="border-t pt-1 mt-1 font-semibold">Final: {result.debug.confidence_breakdown.final}%</div>
                            <div className="text-xs text-gray-600 mt-2">{result.debug.confidence_breakdown.reasoning}</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {result.debug.raw_responses.knowledge && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-800">🧠 Knowledge Agent Response</h4>
                                <button
                                  onClick={() => copyToClipboard(result.debug!.raw_responses.knowledge!)}
                                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                >
                                  Copy
                                </button>
                              </div>
                              <div className="bg-white rounded p-3 font-mono text-xs text-gray-700 whitespace-pre-wrap">
                                {result.debug.raw_responses.knowledge}
                              </div>
                            </div>
                          )}

                          {result.debug.raw_responses.verification && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-800">✅ Verification Agent Response</h4>
                                <button
                                  onClick={() => copyToClipboard(result.debug!.raw_responses.verification!)}
                                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                >
                                  Copy
                                </button>
                              </div>
                              <div className="bg-white rounded p-3 font-mono text-xs text-gray-700 whitespace-pre-wrap">
                                {result.debug.raw_responses.verification}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-red-600">
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}