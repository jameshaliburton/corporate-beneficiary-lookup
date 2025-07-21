// Evaluation service for real data integration
import { mockScanResults, ScanResult } from './mockData'

export interface EvaluationFilters {
  source?: 'live' | 'eval' | 'retry'
  confidenceMin?: number
  confidenceMax?: number
  searchTerm?: string
}

export interface EvaluationMetadata {
  totalResults: number
  averageConfidence: number
  lastUpdated: string
  sourceBreakdown: {
    live: number
    eval: number
    retry: number
  }
}

export interface EvaluationResponse {
  results: ScanResult[]
  metadata: EvaluationMetadata
  error?: string
}

class EvaluationService {
  private baseUrl = '/api/evaluation/v3'

  async getEvaluationResults(filters: EvaluationFilters = {}): Promise<EvaluationResponse> {
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (filters.source) params.append('dataSource', filters.source)
      if (filters.confidenceMin) params.append('confidenceMin', filters.confidenceMin.toString())
      if (filters.confidenceMax) params.append('confidenceMax', filters.confidenceMax.toString())
      if (filters.searchTerm) params.append('search', filters.searchTerm)

      const response = await fetch(`${this.baseUrl}/results?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform API response to match our ScanResult interface
      const transformedResults: ScanResult[] = (data.results || data).map((result: any) => {
        // Extract trace information from agent_execution_trace
        const trace = result.agent_execution_trace?.stages?.map((stage: any) => ({
          stage: stage.stage || stage.name || 'Unknown Stage',
          status: stage.status || 'pending',
          duration_ms: stage.duration_ms || stage.duration || 0,
          reasoning: stage.reasoning || [{
            type: 'info',
            content: stage.description || 'No reasoning available'
          }],
          prompt: stage.prompt || undefined
        })) || []

        return {
          id: result.id?.toString() || `scan_${Date.now()}`,
          brand: result.brand || 'Unknown',
          product_name: result.product_name || result.product || 'Unknown Product',
          owner: result.owner || result.financial_beneficiary || 'Unknown',
          confidence: result.confidence_score || result.confidence || 0,
          country: result.beneficiary_country || result.country || 'Unknown',
          source: result.source_type || result.source || 'live',
          timestamp: result.timestamp || new Date().toISOString(),
          trace: trace
        }
      }) || []

      // Calculate metadata
      const metadata: EvaluationMetadata = {
        totalResults: transformedResults.length,
        averageConfidence: transformedResults.length > 0 
          ? Math.round(transformedResults.reduce((sum, r) => sum + r.confidence, 0) / transformedResults.length)
          : 0,
        lastUpdated: new Date().toISOString(),
        sourceBreakdown: {
          live: transformedResults.filter(r => r.source === 'live').length,
          eval: transformedResults.filter(r => r.source === 'eval').length,
          retry: transformedResults.filter(r => r.source === 'retry').length
        }
      }

      return {
        results: transformedResults,
        metadata
      }

    } catch (error) {
      console.warn('Failed to fetch real evaluation data, falling back to mock data:', error)
      
      // Apply filters to mock data as fallback
      let filteredResults = [...mockScanResults]
      
      if (filters.source) {
        filteredResults = filteredResults.filter(r => r.source === filters.source)
      }
      
      if (filters.confidenceMin !== undefined) {
        filteredResults = filteredResults.filter(r => r.confidence >= filters.confidenceMin!)
      }
      
      if (filters.confidenceMax !== undefined) {
        filteredResults = filteredResults.filter(r => r.confidence <= filters.confidenceMax!)
      }
      
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        filteredResults = filteredResults.filter(r => 
          r.brand.toLowerCase().includes(searchLower) ||
          r.product_name.toLowerCase().includes(searchLower) ||
          r.owner.toLowerCase().includes(searchLower) ||
          r.country.toLowerCase().includes(searchLower)
        )
      }

      const metadata: EvaluationMetadata = {
        totalResults: filteredResults.length,
        averageConfidence: filteredResults.length > 0 
          ? Math.round(filteredResults.reduce((sum, r) => sum + r.confidence, 0) / filteredResults.length)
          : 0,
        lastUpdated: new Date().toISOString(),
        sourceBreakdown: {
          live: filteredResults.filter(r => r.source === 'live').length,
          eval: filteredResults.filter(r => r.source === 'eval').length,
          retry: filteredResults.filter(r => r.source === 'retry').length
        }
      }

      return {
        results: filteredResults,
        metadata,
        error: 'Using mock data due to API failure'
      }
    }
  }

  async submitFeedback(resultId: string, feedback: {
    issueType: string
    description: string
    promptFix?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resultId,
          ...feedback
        })
      })

      if (!response.ok) {
        throw new Error(`Feedback submission failed: ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async rerunEvaluation(resultId: string, stepId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/rerun`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resultId,
          stepId
        })
      })

      if (!response.ok) {
        throw new Error(`Rerun failed: ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to rerun evaluation:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

export const evaluationService = new EvaluationService() 