'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UnifiedResultsTableV3Props {
  selectedDataSource: string
  onResultSelect: (result: any) => void
  onFlagResult: (result: any) => void
  selectedResult: any
}

export default function UnifiedResultsTableV3New({
  selectedDataSource,
  onResultSelect,
  onFlagResult,
  selectedResult
}: UnifiedResultsTableV3Props) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredResults, setFilteredResults] = useState<any[]>([])
  const [filters, setFilters] = useState({
    search: '',
    sourceType: 'all',
    confidence: 'all',
    resultType: 'all',
    brand: ''
  })

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
        setFilteredResults(data.results || [])
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

  useEffect(() => {
    let filtered = results

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(result => 
        result.brand?.toLowerCase().includes(searchLower) ||
        result.product_name?.toLowerCase().includes(searchLower) ||
        result.owner?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.sourceType !== 'all') {
      filtered = filtered.filter(result => result.source_type === filters.sourceType)
    }

    if (filters.confidence !== 'all') {
      filtered = filtered.filter(result => {
        const confidence = result.confidence_score || 0
        switch (filters.confidence) {
          case 'high': return confidence >= 80
          case 'medium': return confidence >= 50 && confidence < 80
          case 'low': return confidence < 50
          default: return true
        }
      })
    }

    if (filters.resultType !== 'all') {
      filtered = filtered.filter(result => {
        if (filters.resultType === 'correct') return result.match_result === 'correct'
        if (filters.resultType === 'incorrect') return result.match_result === 'incorrect'
        if (filters.resultType === 'unknown') return result.match_result === 'unknown'
        return true
      })
    }

    if (filters.brand) {
      const brandLower = filters.brand.toLowerCase()
      filtered = filtered.filter(result => 
        result.brand?.toLowerCase().includes(brandLower)
      )
    }

    setFilteredResults(filtered)
  }, [results, filters])

  const handleRerun = async (result: any) => {
    try {
      const response = await fetch('/api/evaluation/v3/rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result_id: result.id,
          trace_id: result.trace_id,
          use_original_input: true
        })
      })
      
      if (response.ok) {
        fetchResults()
      }
    } catch (error) {
      console.error('Failed to rerun:', error)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800'
    if (confidence >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'live': return 'bg-blue-100 text-blue-800'
      case 'eval': return 'bg-purple-100 text-purple-800'
      case 'retry': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading results...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unified Results ({filteredResults.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          
          <Select value={filters.sourceType} onValueChange={(value) => setFilters(prev => ({ ...prev, sourceType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Source Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="live">Live Scans</SelectItem>
              <SelectItem value="eval">Evaluation Tests</SelectItem>
              <SelectItem value="retry">Retry Runs</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.confidence} onValueChange={(value) => setFilters(prev => ({ ...prev, confidence: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Confidence</SelectItem>
              <SelectItem value="high">High (80%+)</SelectItem>
              <SelectItem value="medium">Medium (50-79%)</SelectItem>
              <SelectItem value="low">Low (<50%)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.resultType} onValueChange={(value) => setFilters(prev => ({ ...prev, resultType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Result Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="correct">Correct</SelectItem>
              <SelectItem value="incorrect">Incorrect</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by brand..."
            value={filters.brand}
            onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
          />
        </div>

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
                  onClick={() => onResultSelect(result)}
                >
                  <td className="p-2 font-medium">{result.brand || 'Unknown'}</td>
                  <td className="p-2">{result.product_name || 'N/A'}</td>
                  <td className="p-2">{result.owner || 'Unknown'}</td>
                  <td className="p-2">
                    <Badge className={getConfidenceColor(result.confidence_score || 0)}>
                      {result.confidence_score?.toFixed(1) || 0}%
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge className={getSourceTypeColor(result.source_type)}>
                      {result.source_type}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {result.match_result && (
                      <Badge variant={result.match_result === 'correct' ? 'default' : 'destructive'}>
                        {result.match_result}
                      </Badge>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRerun(result)
                        }}
                      >
                        Rerun
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onFlagResult(result)
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
      </CardContent>
    </Card>
  )
} 