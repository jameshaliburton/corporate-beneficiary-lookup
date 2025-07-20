'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ScanResult {
  id: string
  brand: string
  product_name?: string
  owner: string
  confidence_score: number
  country: string
  source_type: 'live' | 'eval' | 'retry' | 'manual'
  timestamp: string
  trace_id?: string
  test_id?: string
  match_result?: string
  latency?: number
  token_cost_estimate?: number
}

interface ScanResultTableV2Props {
  onResultSelect: (result: ScanResult | null) => void
  selectedResult: ScanResult | null
}

export default function ScanResultTableV2({ onResultSelect, selectedResult }: ScanResultTableV2Props) {
  const [results, setResults] = useState<ScanResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    sourceType: 'all',
    confidenceMin: 0,
    confidenceMax: 100,
    brand: '',
    resultType: 'all'
  })

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluation/v2/results')
      const data = await response.json()
      
      if (data.success) {
        setResults(data.results)
      } else {
        setError(data.error || 'Failed to fetch results')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const filteredResults = results.filter(result => {
    const matchesSearch = !filters.search || 
      result.brand.toLowerCase().includes(filters.search.toLowerCase()) ||
      result.product_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      result.owner.toLowerCase().includes(filters.search.toLowerCase())
    
    const matchesSourceType = filters.sourceType === 'all' || result.source_type === filters.sourceType
    const matchesConfidence = result.confidence_score >= filters.confidenceMin && result.confidence_score <= filters.confidenceMax
    const matchesBrand = !filters.brand || result.brand.toLowerCase().includes(filters.brand.toLowerCase())
    const matchesResultType = filters.resultType === 'all' || result.match_result === filters.resultType

    return matchesSearch && matchesSourceType && matchesConfidence && matchesBrand && matchesResultType
  })

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'live': return 'bg-green-100 text-green-800'
      case 'eval': return 'bg-blue-100 text-blue-800'
      case 'retry': return 'bg-yellow-100 text-yellow-800'
      case 'manual': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading scan results...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={fetchResults}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unified Scan Results</CardTitle>
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search brands, products, owners..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="max-w-xs"
          />
          <select
            value={filters.sourceType}
            onChange={(e) => setFilters({ ...filters, sourceType: e.target.value })}
            className="px-3 py-2 border rounded"
          >
            <option value="all">All Sources</option>
            <option value="live">Live</option>
            <option value="eval">Evaluation</option>
            <option value="retry">Retry</option>
            <option value="manual">Manual</option>
          </select>
          <select
            value={filters.resultType}
            onChange={(e) => setFilters({ ...filters, resultType: e.target.value })}
            className="px-3 py-2 border rounded"
          >
            <option value="all">All Results</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
            <option value="unknown">Unknown</option>
          </select>
          <Input
            placeholder="Brand filter"
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
            className="max-w-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Brand</th>
                <th className="text-left p-2">Product</th>
                <th className="text-left p-2">Owner</th>
                <th className="text-left p-2">Confidence</th>
                <th className="text-left p-2">Country</th>
                <th className="text-left p-2">Source</th>
                <th className="text-left p-2">Result</th>
                <th className="text-left p-2">Timestamp</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result) => (
                <tr 
                  key={result.id} 
                  className={`border-b hover:bg-gray-50 cursor-pointer ${
                    selectedResult?.id === result.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onResultSelect(selectedResult?.id === result.id ? null : result)}
                >
                  <td className="p-2 font-medium">{result.brand}</td>
                  <td className="p-2 text-sm">{result.product_name || '-'}</td>
                  <td className="p-2">{result.owner}</td>
                  <td className={`p-2 font-medium ${getConfidenceColor(result.confidence_score)}`}>
                    {result.confidence_score.toFixed(1)}%
                  </td>
                  <td className="p-2">{result.country}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${getSourceTypeColor(result.source_type)}`}>
                      {result.source_type}
                    </span>
                  </td>
                  <td className="p-2">
                    {result.match_result && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.match_result === 'correct' ? 'bg-green-100 text-green-800' :
                        result.match_result === 'incorrect' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.match_result}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Implement retry functionality
                        }}
                      >
                        Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Implement flag functionality
                        }}
                      >
                        Flag
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No results found matching the current filters.
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredResults.length} of {results.length} total results
        </div>
      </CardContent>
    </Card>
  )
} 