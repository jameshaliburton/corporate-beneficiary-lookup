'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InlineBuildInfo } from '@/components/BuildInfo'

interface Product {
  id: number
  barcode: string
  product_name: string
  brand: string
  financial_beneficiary: string
  beneficiary_country: string
  beneficiary_flag: string
  confidence_score: number
  ownership_structure_type: string
  result_type: string
  static_mapping_used: boolean
  web_research_used: boolean
  user_contributed: boolean
  inferred: boolean
  created_at: string
  updated_at: string
  ownership_flow?: any[]
  sources?: string[]
  reasoning?: string
  web_sources_count?: number
  query_analysis_used?: boolean
  agent_execution_trace?: {
    query_id: string
    start_time: string
    brand: string
    product_name: string
    barcode: string
    stages: Array<{
      stage: string
      start_time: string
      description: string
      result?: string
      duration_ms?: number
      data?: any
      error?: string
    }>
    final_result: string
    total_duration_ms: number
  }
  initial_llm_confidence?: number
  agent_results?: {
    query_builder?: {
      success: boolean
      data?: any
      reasoning: string
      error?: string
    }
    web_research?: {
      success: boolean
      data?: any
      reasoning: string
      error?: string
    }
    ownership_analysis?: {
      success: boolean
      data?: any
      reasoning: string
      error?: string
    }
    static_mapping?: {
      success: boolean
      data?: any
      reasoning: string
      error?: string
    }
    error?: {
      success: boolean
      error: string
      reasoning: string
      data?: any
    }
  }
  fallback_reason?: string
}

interface DashboardStats {
  total: number
  byCountry: Record<string, number>
  byResultType: Record<string, number>
  userContributed: number
  inferred: number
  byConfidence: {
    high: number
    medium: number
    low: number
  }
}

interface EvaluationStats {
  total_cases: number
  active_cases: number
  total_human_ratings: number
  total_ai_results: number
  average_human_score: number
  average_ai_score: number
  error?: string
}

interface EvaluationCase {
  case_id: string
  task_type: string
  input_context: string
  expected_behavior: string
  notes: string
  status: string
  created_date: string
  updated_date: string
}

interface HumanRating {
  case_id: string
  evaluator: string
  score: string
  reasoning: string
  timestamp: string
  confidence_accuracy: string
  reasoning_quality: string
  hallucination_detected: string
  improvement_suggestions: string
}

interface AIResult {
  case_id: string
  agent_version: string
  output: string
  evaluation_score: string
  logs: string
  timestamp: string
  execution_trace: string
  confidence_score: string
  sources_used: string
  fallback_reason: string
  total_duration_ms: string
}

interface FilterState {
  search: string
  country: string
  resultType: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
  minConfidence: number
  maxConfidence: number
}

const RESULT_TYPE_DESCRIPTIONS = {
  'static_mapping': 'Pre-defined brand-to-owner mappings for instant lookups',
  'ai_research': 'AI-powered research using web sources and company databases',
  'user_contribution': 'Manually provided ownership information by users',
  'unknown': 'Unknown or unclassified result type'
}

// Helper function to get stage information
const getStageInfo = (stage: string) => {
  const stageMap: Record<string, { name: string; description: string; icon: string }> = {
    cache_check: {
      name: 'Cache Check',
      description: 'Checking for cached ownership data',
      icon: '🔍'
    },
    static_mapping: {
      name: 'Static Mapping',
      description: 'Looking up in static ownership database',
      icon: '🗂️'
    },
    rag_retrieval: {
      name: 'RAG Knowledge Base',
      description: 'Searching knowledge base for similar ownership patterns',
      icon: '🧠'
    },
    llm_first_analysis: {
      name: 'LLM-First Analysis',
      description: 'Initial LLM analysis of brand ownership',
      icon: '🤖'
    },
    query_builder: {
      name: 'Query Builder',
      description: 'Building optimized search queries',
      icon: '🔧'
    },
    web_research: {
      name: 'Web Research',
      description: 'Searching web for ownership information',
      icon: '🌐'
    },
    ownership_analysis: {
      name: 'Ownership Analysis',
      description: 'Analyzing corporate ownership structures',
      icon: '🏢'
    },
    validation: {
      name: 'Validation',
      description: 'Validating ownership findings',
      icon: '✅'
    },
    database_save: {
      name: 'Database Save',
      description: 'Saving results to database',
      icon: '💾'
    },
    evaluation: {
      name: 'Evaluation',
      description: 'Evaluating result quality and confidence',
      icon: '📊'
    }
  }
  return stageMap[stage] || { name: stage, description: 'Unknown stage', icon: '❓' }
}

// Helper to get a flag emoji from a country name or code
function getFlag(country: string) {
  // Simple country code to flag conversion (works for most ISO country codes)
  if (!country) return '🏳️';
  const code = country.trim().toUpperCase();
  if (code.length === 2) {
    return String.fromCodePoint(...[...code].map(c => 0x1f1e6 - 65 + c.charCodeAt(0)));
  }
  // fallback for known names
  if (code === 'UNITED STATES') return '🇺🇸';
  if (code === 'SWEDEN') return '🇸🇪';
  if (code === 'UNITED KINGDOM') return '🇬🇧';
  return '🏳️';
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [filteredStats, setFilteredStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)
  const [expandedRawData, setExpandedRawData] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    country: '',
    resultType: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 0,
    limit: 20,
    minConfidence: 0,
    maxConfidence: 100
  })

  // Evaluation framework state
  const [evaluationStats, setEvaluationStats] = useState<EvaluationStats | null>(null)
  const [evaluationCases, setEvaluationCases] = useState<EvaluationCase[]>([])
  const [humanRatings, setHumanRatings] = useState<HumanRating[]>([])
  const [aiResults, setAiResults] = useState<AIResult[]>([])
  const [evaluationLoading, setEvaluationLoading] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [caseComparison, setCaseComparison] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
    loadEvaluationData()
  }, [filters])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        search: filters.search,
        country: filters.country,
        resultType: filters.resultType,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        minConfidence: filters.minConfidence.toString(),
        maxConfidence: filters.maxConfidence.toString()
      })

      const [productsResponse, statsResponse] = await Promise.all([
        fetch(`/api/dashboard/products?${params}`),
        fetch(`/api/dashboard/stats?${params}`)
      ])

      if (productsResponse.ok && statsResponse.ok) {
        const productsData = await productsResponse.json()
        const statsData = await statsResponse.json()
        
        setProducts(productsData.products)
        setTotalProducts(productsData.total)
        setStats(statsData.products)
        setFilteredStats(statsData.filtered)
      } else {
        console.error('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEvaluationData = async () => {
    setEvaluationLoading(true)
    try {
      const [statsResponse, casesResponse] = await Promise.all([
        fetch('/api/evaluation?action=stats'),
        fetch('/api/evaluation?action=cases')
      ])

      if (statsResponse.ok && casesResponse.ok) {
        const statsData = await statsResponse.json()
        const casesData = await casesResponse.json()
        
        setEvaluationStats(statsData.stats)
        setEvaluationCases(casesData.cases)
      } else {
        console.error('Failed to load evaluation data')
      }
    } catch (error) {
      console.error('Error loading evaluation data:', error)
    } finally {
      setEvaluationLoading(false)
    }
  }

  const loadCaseData = async (caseId: string) => {
    try {
      const [ratingsResponse, resultsResponse, comparisonResponse] = await Promise.all([
        fetch(`/api/evaluation?action=human_ratings&case_id=${caseId}`),
        fetch(`/api/evaluation?action=ai_results&case_id=${caseId}`),
        fetch(`/api/evaluation?action=comparison&case_id=${caseId}`)
      ])

      if (ratingsResponse.ok && resultsResponse.ok && comparisonResponse.ok) {
        const ratingsData = await ratingsResponse.json()
        const resultsData = await resultsResponse.json()
        const comparisonData = await comparisonResponse.json()
        
        setHumanRatings(ratingsData.ratings)
        setAiResults(resultsData.results)
        setCaseComparison(comparisonData.comparison)
      }
    } catch (error) {
      console.error('Error loading case data:', error)
    }
  }

  const createEvaluationSpreadsheet = async () => {
    try {
      const response = await fetch('/api/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_spreadsheet',
          data: { title: 'Agent Evaluation Framework' }
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Evaluation spreadsheet created! ID: ${data.spreadsheetId}`)
        // Reload evaluation data
        await loadEvaluationData()
      } else {
        console.error('Failed to create evaluation spreadsheet')
      }
    } catch (error) {
      console.error('Error creating evaluation spreadsheet:', error)
    }
  }

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 0 // Reset to first page when filters change
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const toggleProductExpansion = (productId: number) => {
    setExpandedProduct(expandedProduct === productId ? null : productId)
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'static_mapping': return 'bg-blue-100 text-blue-800'
      case 'ai_research': return 'bg-purple-100 text-purple-800'
      case 'user_contribution': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalPages = Math.ceil(totalProducts / filters.limit)
  const currentStats = filteredStats || stats

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">OwnedBy Dashboard</h1>
          <p className="text-gray-600">Monitor scan history and ownership data</p>
        </div>
        <div className="flex space-x-4">
          <a 
            href="/" 
            className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm rounded-md hover:bg-blue-50 transition-colors"
          >
            ← Back to Scanner
          </a>
          <button 
            onClick={() => loadDashboardData()}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {currentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total Scans</h3>
              <div className="h-4 w-4 text-gray-400">📊</div>
            </div>
            <div className="text-2xl font-bold">{currentStats.total}</div>
            <p className="text-xs text-gray-500">Products researched</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">High Confidence</h3>
              <div className="h-4 w-4 text-gray-400">📈</div>
            </div>
            <div className="text-2xl font-bold">{currentStats.byConfidence.high}</div>
            <p className="text-xs text-gray-500">≥80% confidence</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Static Mappings</h3>
              <div className="h-4 w-4 text-gray-400">⚡</div>
            </div>
            <div className="text-2xl font-bold">{currentStats.byResultType.static_mapping || 0}</div>
            <p className="text-xs text-gray-500">Instant lookups</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">User Contributions</h3>
              <div className="h-4 w-4 text-gray-400">👤</div>
            </div>
            <div className="text-2xl font-bold">{currentStats.userContributed}</div>
            <p className="text-xs text-gray-500">Manual corrections</p>
          </div>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="products">📊 Products</TabsTrigger>
          <TabsTrigger value="evaluation">📋 Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4">Filters & Search</h2>
            <div className="space-y-4">
              {/* Search and Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <div className="absolute left-3 top-3 h-4 w-4 text-gray-400">🔍</div>
                  <input
                    type="text"
                    placeholder="Search brands, products, owners..."
                    value={filters.search}
                    onChange={(e) => updateFilters({ search: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={filters.country}
                  onChange={(e) => updateFilters({ country: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Countries</option>
                  {currentStats && Object.keys(currentStats.byCountry).map(country => (
                    <option key={country} value={country}>
                      {country} ({currentStats.byCountry[country]})
                    </option>
                  ))}
                </select>

                <select
                  value={filters.resultType}
                  onChange={(e) => updateFilters({ resultType: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Result Types</option>
                  {currentStats && Object.keys(currentStats.byResultType).map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')} ({currentStats.byResultType[type]})
                    </option>
                  ))}
                </select>

                <select
                  value={filters.limit}
                  onChange={(e) => updateFilters({ limit: parseInt(e.target.value) })}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              {/* Confidence Range Slider */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Confidence Range: {filters.minConfidence}% - {filters.maxConfidence}%
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minConfidence}
                    onChange={(e) => updateFilters({ minConfidence: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.maxConfidence}
                    onChange={(e) => updateFilters({ maxConfidence: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Sorting */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    updateFilters({ sortBy: field, sortOrder: order as 'asc' | 'desc' })
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="confidence_score-desc">High Confidence First</option>
                  <option value="confidence_score-asc">Low Confidence First</option>
                  <option value="brand-asc">Brand A-Z</option>
                  <option value="brand-desc">Brand Z-A</option>
                  <option value="financial_beneficiary-asc">Owner A-Z</option>
                  <option value="financial_beneficiary-desc">Owner Z-A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Scan Results ({totalProducts} total)</h2>
              <p className="text-gray-600">Recent product scans and their ownership research results</p>
            </div>
            <div className="p-6">
              {loading && products.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                  <span>Loading...</span>
                </div>
              )}
              
              <div className="space-y-4">
                {(Array.isArray(products) ? products : []).map((product) => (
                  <div
                    key={product.id}
                    className={`relative bg-white rounded-lg shadow border p-6 mb-4 transition hover:shadow-lg ${expandedProduct === product.id ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{product.brand || 'Unknown Brand'}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultTypeColor(product.result_type)} cursor-help`} title={RESULT_TYPE_DESCRIPTIONS[product.result_type as keyof typeof RESULT_TYPE_DESCRIPTIONS] || 'Unknown result type'}>
                            {product.result_type?.replace('_', ' ') || 'unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span>{product.product_name}</span>
                          <span className="mx-2">|</span>
                          <span className="flex items-center gap-1">
                            <span className="text-lg">{product.beneficiary_flag || '🏳️'}</span>
                            <span>{product.financial_beneficiary || 'Unknown Owner'}</span>
                          </span>
                          <span className="mx-2">|</span>
                          <span>{product.beneficiary_country || 'Unknown Country'}</span>
                          <span className="mx-2">|</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(product.confidence_score || 0)}`}>{product.confidence_score || 0}%</span>
                        </div>
                        {product.reasoning && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2 max-w-2xl">
                            {product.reasoning}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleProductExpansion(product.id)}
                        className="ml-4 px-4 py-2 rounded bg-blue-100 text-blue-800 font-medium hover:bg-blue-200 transition"
                        aria-expanded={expandedProduct === product.id}
                      >
                        {expandedProduct === product.id ? 'Hide Details' : 'Details'}
                      </button>
                    </div>
                    {expandedProduct === product.id && (
                      <div className="mt-4">
                        <button
                          onClick={() => setExpandedProduct(null)}
                          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-2xl text-gray-600 z-10"
                          aria-label="Close details"
                        >
                          ×
                        </button>
                        <Tabs defaultValue="process" className="w-full mt-2">
                          <TabsList className="mb-4">
                            <TabsTrigger value="process">Process</TabsTrigger>
                            <TabsTrigger value="sources">Sources</TabsTrigger>
                            <TabsTrigger value="ownership">Ownership Chain</TabsTrigger>
                            <TabsTrigger value="raw">Raw Data</TabsTrigger>
                          </TabsList>
                          <TabsContent value="process">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs border rounded-lg">
                                <thead>
                                  <tr className="bg-gray-100 text-gray-700">
                                    <th className="px-3 py-2 text-left">Step</th>
                                    <th className="px-3 py-2 text-left">Status</th>
                                    <th className="px-3 py-2 text-left">Reasoning & Citations</th>
                                    <th className="px-3 py-2 text-left">Start Time</th>
                                    <th className="px-3 py-2 text-left">Duration</th>
                                    <th className="px-3 py-2 text-left">Error</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {product.agent_execution_trace?.stages?.map((stage, idx) => {
                                    const stageInfo = getStageInfo(stage.stage)
                                    return (
                                      <tr key={idx} className="border-b last:border-b-0">
                                        <td className="px-3 py-2 whitespace-nowrap flex items-center gap-2">
                                          <span className="text-lg">{stageInfo.icon}</span>
                                          <span>{stageInfo.name}</span>
                                        </td>
                                        <td className="px-3 py-2">
                                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            stage.result === 'success' ? 'bg-green-100 text-green-800' :
                                            stage.result === 'error' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {stage.result ? stage.result.toUpperCase() : '—'}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-700 max-w-xs break-words">
                                          {stage.stage === 'confidence_calculation' && stage.data && (stage.data.factors || stage.data.breakdown) ? (
                                            <div>
                                              {stage.data.reasoning && (
                                                <div className="mb-1"><span className="font-semibold">Reasoning:</span> {stage.data.reasoning}</div>
                                              )}
                                              {stage.data.factors && (
                                                <div className="mb-1">
                                                  <span className="font-semibold">Factors:</span>
                                                  <ul className="list-disc list-inside ml-4">
                                                    {Object.entries(stage.data.factors).map(([factor, score]) => (
                                                      <li key={String(factor)}>{String(factor)}: {String(score)}%</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                              {Array.isArray(stage.data.breakdown) && stage.data.breakdown.length > 0 && (
                                                <div>
                                                  <span className="font-semibold">Breakdown:</span>
                                                  <ul className="list-disc list-inside ml-4">
                                                    {stage.data.breakdown.map((item: any, i: number) => (
                                                      <li key={i}>{item.factor}: {item.score}% (weight: {item.weight}%, contribution: {item.contribution})</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <>
                                              {stage.data?.reasoning || stage.description || '—'}
                                              {Array.isArray(stage.data?.citations) && stage.data.citations.length > 0 && (
                                                <ul className="mt-1 list-disc list-inside text-blue-700">
                                                  {stage.data.citations.map((citation: string, i: number) => (
                                                    <li key={i} className="text-xs">{citation}</li>
                                                  ))}
                                                </ul>
                                              )}
                                            </>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-500">
                                          {formatDate(stage.start_time)}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-500">
                                          {stage.duration_ms ? `${stage.duration_ms}ms` : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-red-600">
                                          {stage.error || '—'}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </TabsContent>
                          <TabsContent value="sources">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Sources Used ({product.sources?.length || 0})</h4>
                                {product.sources && product.sources.length > 0 ? (
                                  <ul className="space-y-2">
                                    {product.sources.map((source, index) => (
                                      <li key={index} className="flex items-center gap-2">
                                        <span className="text-blue-600">🔗</span>
                                        <a 
                                          href={source} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-sm"
                                        >
                                          {source}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-500 text-sm">No sources recorded</p>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Web Research Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Web Research Used:</span> {product.web_research_used ? 'Yes' : 'No'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Sources Count:</span> {product.web_sources_count || 0}
                                  </div>
                                  <div>
                                    <span className="font-medium">Query Analysis:</span> {product.query_analysis_used ? 'Yes' : 'No'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Static Mapping:</span> {product.static_mapping_used ? 'Yes' : 'No'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="ownership">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Ownership Structure</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Structure Type:</span> {product.ownership_structure_type || 'Unknown'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Result Type:</span> {product.result_type || 'Unknown'}
                                  </div>
                                  <div>
                                    <span className="font-medium">User Contributed:</span> {product.user_contributed ? 'Yes' : 'No'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Inferred:</span> {product.inferred ? 'Yes' : 'No'}
                                  </div>
                                </div>
                              </div>
                              {product.ownership_flow && product.ownership_flow.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Ownership Flow</h4>
                                  <div className="space-y-2">
                                    {product.ownership_flow.map((step, index) => (
                                      <div key={index} className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500">{index + 1}.</span>
                                        <span>{step}</span>
                                        {index < product.ownership_flow.length - 1 && (
                                          <span className="text-gray-400">→</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                          <TabsContent value="raw">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Raw Data</h4>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <pre className="text-xs overflow-x-auto">
                                    {JSON.stringify(product, null, 2)}
                                  </pre>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => navigator.clipboard.writeText(JSON.stringify(product, null, 2))}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                                >
                                  Copy JSON
                                </button>
                                <a
                                  href="#"
                                  className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    // TODO: Link to Google Sheets evaluation
                                    alert('Google Sheets evaluation link will be added here')
                                  }}
                                >
                                  📊 Eval
                                </a>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </div>
                ))}
                {(!products || products.length === 0) && (
                  <div className="text-center text-gray-500 py-8">No products found.</div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 0}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {filters.page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= totalPages - 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-6">
          {/* Evaluation Framework */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Evaluation Framework</h2>
              <button
                onClick={createEvaluationSpreadsheet}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Spreadsheet
              </button>
            </div>
            <p className="text-gray-600 mb-4">Human-in-the-loop feedback and systematic agent improvement</p>
            
            {evaluationLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                <span>Loading evaluation data...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Evaluation Stats */}
                {evaluationStats && evaluationStats.error ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="text-yellow-600 text-xl mr-3">⚠️</div>
                      <div>
                        <h3 className="font-medium text-yellow-900">Google Sheets Not Configured</h3>
                        <p className="text-yellow-700 text-sm">The evaluation system requires Google Sheets API access.</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-yellow-800">
                      <p><strong>To enable evaluation features:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>Set up a Google Cloud Project</li>
                        <li>Enable Google Sheets API</li>
                        <li>Create a service account and download the JSON key</li>
                        <li>Add the key file to your project</li>
                        <li>Set the <code className="bg-yellow-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_KEY_JSON</code> environment variable</li>
                      </ol>
                      <p className="mt-3 text-xs">For now, you can still use the "Refine" buttons on product results to provide feedback.</p>
                      <p className="mt-2 text-xs text-blue-600">💡 <strong>Note:</strong> This message is expected in local development. The evaluation framework will work properly on Vercel where the environment variable is configured.</p>
                    </div>
                  </div>
                ) : evaluationStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900">Cases</h3>
                      <div className="text-2xl font-bold text-blue-600">{evaluationStats.total_cases}</div>
                      <p className="text-sm text-blue-700">{evaluationStats.active_cases} active</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900">Human Ratings</h3>
                      <div className="text-2xl font-bold text-green-600">{evaluationStats.total_human_ratings}</div>
                      <p className="text-sm text-green-700">Avg: {evaluationStats.average_human_score.toFixed(1)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-900">AI Results</h3>
                      <div className="text-2xl font-bold text-purple-600">{evaluationStats.total_ai_results}</div>
                      <p className="text-sm text-purple-700">Avg: {evaluationStats.average_ai_score.toFixed(1)}</p>
                    </div>
                  </div>
                ) : null}

                {/* Case Management */}
                <div>
                  <h3 className="font-medium mb-3">Evaluation Cases</h3>
                  {evaluationStats && evaluationStats.error ? (
                    <p className="text-gray-500">Evaluation cases will appear here once Google Sheets is configured.</p>
                  ) : evaluationCases.length > 0 ? (
                    <div className="space-y-2">
                      {evaluationCases.slice(0, 5).map((case_) => (
                        <div key={case_.case_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{case_.case_id}</div>
                            <div className="text-sm text-gray-600">{case_.task_type}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              case_.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {case_.status}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedCaseId(case_.case_id)
                                loadCaseData(case_.case_id)
                              }}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                      {evaluationCases.length > 5 && (
                        <div className="text-center text-sm text-gray-500">
                          ... and {evaluationCases.length - 5} more cases
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No evaluation cases found. Create a spreadsheet to get started.</p>
                  )}
                </div>

                {/* Case Comparison */}
                {selectedCaseId && caseComparison && (
                  <div>
                    <h3 className="font-medium mb-3">Case Comparison: {selectedCaseId}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Human Ratings ({caseComparison.human_ratings.length})</h4>
                        <div className="text-2xl font-bold text-green-600">
                          {caseComparison.average_human_score.toFixed(1)}
                        </div>
                        <p className="text-sm text-green-700">Average Score</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">AI Results ({caseComparison.ai_results.length})</h4>
                        <div className="text-2xl font-bold text-purple-600">
                          {caseComparison.average_ai_score.toFixed(1)}
                        </div>
                        <p className="text-sm text-purple-700">Average Score</p>
                      </div>
                    </div>
                    {caseComparison.mismatches.length > 0 && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">⚠️ Mismatches Detected</h4>
                        <ul className="space-y-1">
                          {caseComparison.mismatches.map((mismatch: any, index: number) => (
                            <li key={index} className="text-sm text-yellow-800">
                              {mismatch.type}: {mismatch.difference.toFixed(1)} point difference
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Build info for version tracking */}
      <div className="mt-8 text-center">
        <InlineBuildInfo variant="full" className="text-gray-400" />
      </div>
    </div>
  )
} 