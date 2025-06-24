'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

  useEffect(() => {
    loadDashboardData()
  }, [filters])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Build query parameters for products
      const productParams = new URLSearchParams({
        limit: filters.limit.toString(),
        offset: (filters.page * filters.limit).toString(),
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      })

      if (filters.search) productParams.append('search', filters.search)
      if (filters.country) productParams.append('country', filters.country)
      if (filters.resultType) productParams.append('result_type', filters.resultType)

      // Build query parameters for stats
      const statsParams = new URLSearchParams()
      if (filters.search) statsParams.append('search', filters.search)
      if (filters.country) statsParams.append('country', filters.country)
      if (filters.resultType) statsParams.append('result_type', filters.resultType)
      if (filters.minConfidence > 0) statsParams.append('min_confidence', filters.minConfidence.toString())
      if (filters.maxConfidence < 100) statsParams.append('max_confidence', filters.maxConfidence.toString())

      const [productsRes, statsRes] = await Promise.all([
        fetch(`/api/dashboard/products?${productParams}`),
        fetch(`/api/dashboard/stats?${statsParams}`)
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
        // Estimate total from current page size and data length
        if (productsData.length === filters.limit) {
          setTotalProducts(filters.page * filters.limit + productsData.length + 1)
        } else {
          setTotalProducts(filters.page * filters.limit + productsData.length)
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.products)
        setFilteredStats(statsData.filtered || statsData.products)
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold">Ownership Research Dashboard</h1>
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
            {products.map((product) => (
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
                                      {stage.data?.reasoning || stage.description || '—'}
                                      {Array.isArray(stage.data?.citations) && stage.data.citations.length > 0 && (
                                        <ul className="mt-1 list-disc list-inside text-blue-700">
                                          {stage.data.citations.map((cite, i) => (
                                            <li key={i}>
                                              {typeof cite === 'object' && cite !== null && 'url' in cite ? (
                                                <a href={cite.url} target="_blank" rel="noopener noreferrer" className="underline">{cite.title || cite.url}</a>
                                              ) : (typeof cite === 'object' && cite !== null && 'title' in cite ? cite.title : String(cite))}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      {stage.start_time ? new Date(stage.start_time).toLocaleTimeString() : '—'}
                                    </td>
                                    <td className="px-3 py-2">
                                      {stage.duration_ms ? `${stage.duration_ms}ms` : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-red-600">
                                      {stage.error ? <span className="font-mono">{stage.error}</span> : '—'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                      <TabsContent value="sources">
                        <div className="mt-2">
                          {product.sources && product.sources.length > 0 ? (
                            <ul className="list-disc list-inside text-sm text-blue-700">
                              {product.sources.map((src, i) => {
                                if (src == null) return null;
                                if (typeof src !== 'object') return <li key={i}>{String(src)}</li>;
                                const safeSrc = src as Record<string, any>;
                                if ('url' in safeSrc && typeof safeSrc.url === 'string') {
                                  return (
                                    <li key={i}>
                                      <a href={safeSrc.url} target="_blank" rel="noopener noreferrer" className="underline">{safeSrc.title || safeSrc.url}</a>
                                    </li>
                                  );
                                } else if ('title' in safeSrc && typeof safeSrc.title === 'string') {
                                  return <li key={i}>{safeSrc.title}</li>;
                                } else {
                                  return <li key={i}>{JSON.stringify(safeSrc)}</li>;
                                }
                              })}
                            </ul>
                          ) : <span className="text-gray-500">No sources available.</span>}
                        </div>
                      </TabsContent>
                      <TabsContent value="ownership">
                        <div className="mt-2">
                          {product.ownership_flow && product.ownership_flow.length > 0 ? (
                            <div className="flex flex-row items-center overflow-x-auto space-x-4">
                              {product.ownership_flow.map((company, idx) => (
                                <div key={company.name + idx} className="min-w-[180px] p-3 rounded-lg shadow border flex flex-col items-center justify-center bg-gray-50 border-gray-200">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-lg">{company.country ? getFlag(company.country) : '🏳️'}</span>
                                    <span className="font-semibold text-gray-800">{company.name}</span>
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">{company.country || 'Unknown Country'}</div>
                                  <div className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-800">{company.type || 'unknown'}</div>
                                  {company.source && (
                                    <a href={company.source} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1">Source</a>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : <span className="text-gray-500">No ownership chain available.</span>}
                        </div>
                      </TabsContent>
                      <TabsContent value="raw">
                        <div className="bg-gray-50 rounded-lg p-4 mt-2">
                          <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(product, null, 2)}</pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            ))}
            
            {products.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No products found matching your filters.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-500">
                Showing {filters.page * filters.limit + 1} to {Math.min((filters.page + 1) * filters.limit, totalProducts)} of {totalProducts} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 0}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {filters.page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages - 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ProductDetails = ({ product, onClose }: { product: Product; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedRawData, setExpandedRawData] = useState<Set<string>>(new Set())
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }
  
  const getStageIcon = (stage: string) => {
    const icons: Record<string, string> = {
      cache_check: '🔍',
      static_mapping: '🗂️',
      query_builder: '🔧',
      web_research: '🌐',
      ownership_analysis: '🏢',
      validation: '✅',
      database_save: '💾',
      evaluation: '📊'
    }
    return icons[stage] || '❓'
  }
  
  const getStageColor = (result?: string) => {
    switch (result) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleRawData = (stageIndex: number) => {
    const key = `${product.id}-${stageIndex}`
    setExpandedRawData(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const isRawDataExpanded = (stageIndex: number) => {
    return expandedRawData.has(`${product.id}-${stageIndex}`)
  }

  const formatJSON = (data: any) => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Product Details</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-2xl text-gray-600 z-10"
            aria-label="Close details"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="execution">Execution Trace</TabsTrigger>
              <TabsTrigger value="agents">Agent Results</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Product Info</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div><span className="font-medium">Barcode:</span> {product.barcode}</div>
                    <div><span className="font-medium">Product:</span> {product.product_name}</div>
                    <div><span className="font-medium">Brand:</span> {product.brand}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Ownership</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div><span className="font-medium">Beneficiary:</span> {product.financial_beneficiary}</div>
                    <div><span className="font-medium">Country:</span> {product.beneficiary_country} {product.beneficiary_flag}</div>
                    <div><span className="font-medium">Structure:</span> {product.ownership_structure_type}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700">Confidence & Sources</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Confidence:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          product.confidence_score >= 70 ? 'bg-green-500' :
                          product.confidence_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${product.confidence_score}%` }}
                      />
                    </div>
                    <span className="text-sm">{product.confidence_score}%</span>
                  </div>
                  
                  {product.initial_llm_confidence && product.initial_llm_confidence !== product.confidence_score && (
                    <div className="text-sm text-gray-600">
                      Initial LLM confidence: {product.initial_llm_confidence}%
                    </div>
                  )}
                  
                  <div className="text-sm">
                    <span className="font-medium">Sources:</span> {product.sources?.length || 0} found
                    {product.web_research_used && (
                      <span className="ml-2 text-green-600">✓ Web research used</span>
                    )}
                    {product.static_mapping_used && (
                      <span className="ml-2 text-blue-600">✓ Static mapping used</span>
                    )}
                    {product.query_analysis_used && (
                      <span className="ml-2 text-purple-600">✓ Query analysis used</span>
                    )}
                  </div>
                </div>
              </div>
              
              {product.fallback_reason && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-800">Fallback Reason</h4>
                  <p className="text-sm text-yellow-700 mt-1">{product.fallback_reason}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-gray-700">Reasoning</h3>
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{product.reasoning}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="execution" className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Agent Research Pipeline</h4>
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full text-xs border rounded-lg">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="px-3 py-2 text-left">Step</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Reasoning</th>
                        <th className="px-3 py-2 text-left">Start Time</th>
                        <th className="px-3 py-2 text-left">Duration</th>
                        <th className="px-3 py-2 text-left">Error</th>
                        <th className="px-3 py-2 text-left">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.agent_execution_trace?.stages?.map((stage, idx) => {
                        const stageInfo = getStageInfo(stage.stage)
                        const hasData = stage.data || stage.error
                        const isExpanded = isRawDataExpanded(idx)
                        
                        return (
                          <React.Fragment key={idx}>
                            <tr className="border-b last:border-b-0">
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
                              <td className="px-3 py-2 text-xs text-gray-700">
                                {stage.data?.reasoning || stage.description || '—'}
                              </td>
                              <td className="px-3 py-2">
                                {stage.start_time ? new Date(stage.start_time).toLocaleTimeString() : '—'}
                              </td>
                              <td className="px-3 py-2">
                                {stage.duration_ms ? `${stage.duration_ms}ms` : '—'}
                              </td>
                              <td className="px-3 py-2 text-red-600">
                                {stage.error ? <span className="font-mono">{stage.error}</span> : '—'}
                              </td>
                              <td className="px-3 py-2">
                                {hasData && (
                                  <button
                                    onClick={() => toggleRawData(idx)}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      isExpanded 
                                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    title={isExpanded ? 'Hide raw data' : 'Show raw data'}
                                  >
                                    <span className="text-xs">{isExpanded ? '−' : '+'}</span>
                                    <span className="font-mono">{isExpanded ? 'Hide' : 'Raw'}</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                            {/* Inline Raw Data Viewer */}
                            {isExpanded && hasData && (
                              <tr className="border-b bg-blue-50">
                                <td colSpan={7} className="px-4 py-3">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium text-blue-900 text-sm">
                                        Raw Data for {stageInfo.name}
                                      </h5>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            const dataToCopy = stage.data || { error: stage.error }
                                            navigator.clipboard.writeText(formatJSON(dataToCopy))
                                          }}
                                          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                                        >
                                          📋 Copy
                                        </button>
                                        {/* Future: Google Sheets Evaluation Link */}
                                        <button
                                          className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors opacity-50 cursor-not-allowed"
                                          title="Google Sheets evaluation (coming soon)"
                                        >
                                          📊 Eval
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-white border border-blue-200 rounded-lg overflow-hidden">
                                      <div className="bg-blue-100 px-3 py-2 border-b border-blue-200">
                                        <div className="flex items-center gap-2 text-xs text-blue-800">
                                          <span className="font-mono">JSON</span>
                                          <span className="text-blue-600">•</span>
                                          <span>{stage.data ? 'Data' : 'Error'}</span>
                                          {stage.data && (
                                            <>
                                              <span className="text-blue-600">•</span>
                                              <span>{Object.keys(stage.data).length} fields</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div className="p-3 max-h-64 overflow-auto">
                                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
                                          {formatJSON(stage.data || { error: stage.error })}
                                        </pre>
                                      </div>
                                    </div>
                                    
                                    {/* Smart Data Insights */}
                                    {stage.data && (
                                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                                        <h6 className="font-medium text-gray-800 text-xs mb-2">Quick Insights:</h6>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          {stage.data.total_sources && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-gray-600">Sources:</span>
                                              <span className="font-medium">{stage.data.total_sources}</span>
                                            </div>
                                          )}
                                          {stage.data.duration_ms && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-gray-600">Duration:</span>
                                              <span className="font-medium">{stage.data.duration_ms}ms</span>
                                            </div>
                                          )}
                                          {stage.data.success !== undefined && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-gray-600">Success:</span>
                                              <span className={`font-medium ${stage.data.success ? 'text-green-600' : 'text-red-600'}`}>
                                                {stage.data.success ? 'Yes' : 'No'}
                                              </span>
                                            </div>
                                          )}
                                          {stage.data.query_count && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-gray-600">Queries:</span>
                                              <span className="font-medium">{stage.data.query_count}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Execution Summary */}
                {product.agent_execution_trace && (
                  <div className="mt-6 p-4 bg-white rounded border border-gray-200">
                    <h4 className="font-semibold text-gray-800 text-sm mb-3">Execution Summary:</h4>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Completed Stages:</span>
                        <div className="font-semibold text-green-600">
                          {product.agent_execution_trace.stages?.filter(s => s.result === 'success').length || 0}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Failed Stages:</span>
                        <div className="font-semibold text-red-600">
                          {product.agent_execution_trace.stages?.filter(s => s.result === 'error').length || 0}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Stages:</span>
                        <div className="font-semibold text-gray-800">
                          {product.agent_execution_trace.stages?.length || 0}
                        </div>
                      </div>
                    </div>
                    {/* Total Execution Time */}
                    {product.agent_execution_trace.total_duration_ms && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-gray-600 text-xs">Total Execution Time:</span>
                        <div className="font-semibold text-blue-600 text-sm">
                          {formatDuration(product.agent_execution_trace.total_duration_ms)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="agents" className="space-y-4">
              {product.agent_results ? (
                <div className="space-y-4">
                  {Object.entries(product.agent_results).map(([agentName, result]) => (
                    <div key={agentName} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold capitalize">
                          {agentName.replace('_', ' ')} Agent
                        </h3>
                        <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-sm">Reasoning:</span>
                          <p className="text-sm text-gray-600 mt-1">{result.reasoning}</p>
                        </div>
                        
                        {('data' in result && result.data) && (
                          <div>
                            <span className="font-medium text-sm">Data:</span>
                            <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(result.data, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                        
                        {('error' in result && result.error) && (
                          <div>
                            <span className="font-medium text-sm text-red-600">Error:</span>
                            <p className="text-sm text-red-600 mt-1">{result.error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No agent results available for this product
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="raw" className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Raw Product Data</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(product, null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 