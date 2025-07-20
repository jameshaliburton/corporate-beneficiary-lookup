'use client'

import { useState, useEffect } from 'react'

interface UnifiedResultsTableV3Props {
  selectedDataSource: string
  onResultSelect: (result: any) => void
  onFlagResult: (result: any) => void
  selectedResult: any
}

export default function UnifiedResultsTableV3Simple({
  selectedDataSource,
  onResultSelect,
  onFlagResult,
  selectedResult
}: UnifiedResultsTableV3Props) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchResults = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        dataSource: selectedDataSource
      })
      
      const response = await fetch(`/api/evaluation/v3/results?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [selectedDataSource])

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading results...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Unified Results ({results.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Brand</th>
              <th className="text-left p-2">Product</th>
              <th className="text-left p-2">Owner</th>
              <th className="text-left p-2">Confidence</th>
              <th className="text-left p-2">Source</th>
              <th className="text-left p-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr 
                key={result.id} 
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => onResultSelect(result)}
              >
                <td className="p-2 font-medium">{result.brand || 'Unknown'}</td>
                <td className="p-2">{result.product_name || 'N/A'}</td>
                <td className="p-2">{result.owner || 'Unknown'}</td>
                <td className="p-2">{result.confidence_score?.toFixed(1) || 0}%</td>
                <td className="p-2">{result.source_type}</td>
                <td className="p-2">{result.match_result || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No results found.
        </div>
      )}
    </div>
  )
} 