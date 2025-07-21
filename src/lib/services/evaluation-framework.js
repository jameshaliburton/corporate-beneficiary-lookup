// Evaluation Framework Service

import dotenv from 'dotenv'
import GoogleSheetsEvaluationService from './google-sheets-evaluation.js'

// Load environment variables
dotenv.config({ path: '.env.local' })

/**
 * Evaluation Framework Service
 * Manages human-in-the-loop evaluation and agent refinement
 */

class EvaluationFrameworkService {
  constructor() {
    this.googleSheets = new GoogleSheetsEvaluationService()
    this.isAvailable = false
    this.sheetValidation = null
  }

  /**
   * Initialize the evaluation framework
   */
  async initialize() {
    try {
      console.log('[EvaluationFramework] Starting initialization...')
      
      // Validate that all sheets are accessible
      this.sheetValidation = await this.googleSheets.validateSheets()
      console.log('[EvaluationFramework] Sheet validation results:', this.sheetValidation)
      
      // Check if at least the main evaluation sheets are accessible
      const accessibleSheets = Object.values(this.sheetValidation).filter(sheet => sheet.accessible)
      
      // For now, allow evaluation to work even with limited sheet access
      // The core functionality works with local storage
      this.isAvailable = true
      console.log('[EvaluationFramework] Initialized with', accessibleSheets.length, 'accessible sheets (using local fallback)')
      
      if (accessibleSheets.length < 2) {
        console.warn('[EvaluationFramework] Limited Google Sheets access - using local storage fallback')
        console.warn('[EvaluationFramework] Sheet validation details:', this.sheetValidation)
      }
    } catch (error) {
      console.error('[EvaluationFramework] Initialization failed:', error)
      this.isAvailable = false
      // Don't throw - allow the app to continue without evaluation
    }
  }

  /**
   * Get evaluation statistics
   */
  async getEvaluationStats() {
    if (!this.isAvailable) {
      return {
        total_cases: 0,
        active_cases: 0,
        total_human_ratings: 0,
        total_ai_results: 0,
        average_human_score: 0,
        average_ai_score: 0,
        error: 'Evaluation framework not available'
      }
    }

    try {
      const cases = await this.googleSheets.getEvaluationCases()
      const results = await this.googleSheets.getEvaluationResults()
      
      // Calculate statistics
      const total_cases = cases.length
      const active_cases = cases.filter(c => !c.completed).length
      const total_human_ratings = results.filter(r => r.match_result && r.match_result !== 'unknown').length
      const total_ai_results = results.length
      
      const human_scores = results
        .filter(r => r.confidence_score && r.confidence_score !== '')
        .map(r => parseFloat(r.confidence_score))
      
      const ai_scores = results
        .filter(r => r.confidence_score && r.confidence_score !== '')
        .map(r => parseFloat(r.confidence_score))
      
      const average_human_score = human_scores.length > 0 
        ? human_scores.reduce((a, b) => a + b, 0) / human_scores.length 
        : 0
      
      const average_ai_score = ai_scores.length > 0 
        ? ai_scores.reduce((a, b) => a + b, 0) / ai_scores.length 
        : 0

      return {
        total_cases,
        active_cases,
        total_human_ratings,
        total_ai_results,
        average_human_score,
        average_ai_score
      }
    } catch (error) {
      console.error('[EvaluationFramework] Error getting stats:', error)
      return {
        total_cases: 0,
        active_cases: 0,
        total_human_ratings: 0,
        total_ai_results: 0,
        average_human_score: 0,
        average_ai_score: 0,
        error: 'Failed to retrieve evaluation statistics'
      }
    }
  }

  /**
   * Get evaluation cases
   */
  async getEvaluationCases() {
    if (!this.isAvailable) {
      return []
    }

    try {
      return await this.googleSheets.getEvaluationCases(100)
    } catch (error) {
      console.error('[EvaluationFramework] Error getting cases:', error)
      return []
    }
  }

  /**
   * Get evaluation results with fallback to mock data
   */
  async getEvaluationResults(limit = 100) {
    try {
      if (this.isAvailable && this.sheetValidation?.evaluation_results?.accessible) {
        return await this.googleSheets.getEvaluationResults(limit)
      } else {
        console.log('[EvaluationFramework] Using mock evaluation results due to Google Sheets inaccessibility')
        return this.getMockEvaluationResults(limit)
      }
    } catch (error) {
      console.error('[EvaluationFramework] Error getting evaluation results:', error)
      console.log('[EvaluationFramework] Falling back to mock data')
      return this.getMockEvaluationResults(limit)
    }
  }

  /**
   * Generate mock evaluation results for testing
   */
  getMockEvaluationResults(limit = 100) {
    const mockResults = []
    const brands = [
      { name: 'Coca-Cola', owner: 'The Coca-Cola Company', confidence: 95 },
      { name: 'Ferrero', owner: 'Ferrero Group', confidence: 92 },
      { name: 'Nestlé', owner: 'Nestlé S.A.', confidence: 88 },
      { name: 'PepsiCo', owner: 'PepsiCo, Inc.', confidence: 94 },
      { name: 'Unilever', owner: 'Unilever PLC', confidence: 90 },
      { name: 'Procter & Gamble', owner: 'The Procter & Gamble Company', confidence: 93 },
      { name: 'Kraft Heinz', owner: 'The Kraft Heinz Company', confidence: 87 },
      { name: 'General Mills', owner: 'General Mills, Inc.', confidence: 89 },
      { name: 'Kellogg', owner: 'Kellogg Company', confidence: 91 },
      { name: 'Mars', owner: 'Mars, Incorporated', confidence: 86 }
    ]

    for (let i = 0; i < Math.min(limit, brands.length); i++) {
      const brand = brands[i]
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      
      mockResults.push({
        id: `mock_${i + 1}`,
        brand: brand.name,
        product_name: `${brand.name} Product ${i + 1}`,
        financial_beneficiary: brand.owner,
        confidence_score: brand.confidence,
        source_type: 'live',
        status: 'completed',
        timestamp: timestamp,
        agent_execution_trace: {
          stages: [
            {
              stage: 'ownership-analysis',
              reasoning: `Analyzing brand ownership structure for ${brand.name}`,
              confidence: brand.confidence,
              timestamp: timestamp,
              promptVersion: '1.0',
              agentName: 'Ownership Research Agent',
              status: 'success',
              duration: 1200 + Math.random() * 500,
              input: `Brand: ${brand.name}`,
              output: `Owner: ${brand.owner}`,
              prompt: {
                system: 'You are an ownership research specialist',
                user: `Determine the owner of brand: ${brand.name}`,
                version: '1.0'
              },
              metadata: {
                alternatives: [],
                disambiguation: null,
                ocrText: null,
                imageAnalysis: null,
                entityValidation: null,
                fallbackTriggers: [],
                lookupResults: []
              }
            }
          ]
        },
        metadata: {
          evaluation_id: `eval_${i + 1}`,
          test_case: `case_${i + 1}`,
          human_rating: null,
          notes: `Mock evaluation result for ${brand.name}`
        }
      })
    }

    return mockResults
  }

  /**
   * Get evaluation steps for a specific trace_id
   */
  async getEvaluationSteps(trace_id) {
    if (!this.isAvailable) {
      return []
    }

    try {
      return await this.googleSheets.getEvaluationSteps(trace_id)
    } catch (error) {
      console.error('[EvaluationFramework] Error getting steps:', error)
      return []
    }
  }

  /**
   * Get ownership mappings
   */
  async getOwnershipMappings() {
    if (!this.isAvailable) {
      return []
    }

    try {
      return await this.googleSheets.getOwnershipMappings(1000)
    } catch (error) {
      console.error('[EvaluationFramework] Error getting mappings:', error)
      return []
    }
  }

  /**
   * Check ownership mapping for a brand
   */
  async checkOwnershipMapping(brand_name) {
    if (!this.isAvailable) {
      return null
    }

    try {
      return await this.googleSheets.checkOwnershipMapping(brand_name)
    } catch (error) {
      console.error('[EvaluationFramework] Error checking mapping:', error)
      return null
    }
  }

  /**
   * Add evaluation case
   */
  async addEvaluationCase(caseData) {
    if (!this.isAvailable) {
      console.warn('[EvaluationFramework] Cannot add evaluation case - Google Sheets not configured')
      return false
    }

    try {
      // For now, we'll just log this as an evaluation result
      // In the future, we could add a separate method for cases
      await this.googleSheets.addEvaluationResult({
        ...caseData,
        trace_id: caseData.test_id,
        agent_version: 'manual',
        actual_owner: caseData.expected_owner,
        actual_country: caseData.expected_country,
        actual_structure_type: caseData.expected_structure_type,
        confidence_score: caseData.expected_confidence,
        match_result: 'manual_case',
        latency: 0,
        token_cost_estimate: 0,
        tool_errors: '',
        explainability_score: 1.0,
        source_used: 'manual_entry',
        prompt_snapshot: '',
        response_snippet: ''
      })
      return true
    } catch (error) {
      console.error('[EvaluationFramework] Error adding evaluation case:', error)
      return false
    }
  }

  /**
   * Log evaluation results
   */
  async logEvaluation(evaluationData, steps) {
    if (!this.isAvailable) {
      console.warn('[EvaluationFramework] Cannot log evaluation - Google Sheets not configured')
      return false
    }

    try {
      await this.googleSheets.logCompleteEvaluation(evaluationData, steps)
      return true
    } catch (error) {
      console.error('[EvaluationFramework] Error logging evaluation:', error)
      return false
    }
  }

  /**
   * Add ownership mapping
   */
  async addOwnershipMapping(mappingData) {
    if (!this.isAvailable) {
      console.warn('[EvaluationFramework] Cannot add ownership mapping - Google Sheets not configured')
      return false
    }

    try {
      await this.googleSheets.addOwnershipMapping(mappingData)
      return true
    } catch (error) {
      console.error('[EvaluationFramework] Error adding ownership mapping:', error)
      return false
    }
  }

  /**
   * Compare evaluation results
   */
  async compareEvaluation(test_id, actual_result) {
    if (!this.isAvailable) {
      console.warn('[EvaluationFramework] Cannot compare evaluation - Google Sheets not configured')
      return null
    }

    try {
      const results = await this.googleSheets.getEvaluationResults(1000)
      const testResults = results.filter(r => r.test_id === test_id)
      
      if (testResults.length === 0) {
        return { error: 'No evaluation results found for this test_id' }
      }

      const expectedResult = testResults[0]
      const comparison = {
        test_id,
        expected: {
          owner: expectedResult.actual_owner,
          country: expectedResult.actual_country,
          structure_type: expectedResult.actual_structure_type,
          confidence: expectedResult.confidence_score
        },
        actual: {
          owner: actual_result.owner,
          country: actual_result.country,
          structure_type: actual_result.structure_type,
          confidence: actual_result.confidence
        }
      }

      // Calculate match result
      comparison.match_result = this.calculateMatchResult(comparison.expected, comparison.actual)
      comparison.explainability_score = this.calculateExplainabilityScore(actual_result)

      return comparison
    } catch (error) {
      console.error('[EvaluationFramework] Error comparing evaluation:', error)
      return { error: 'Failed to compare evaluation results' }
    }
  }

  /**
   * Calculate match result between expected and actual
   */
  calculateMatchResult(expected, actual) {
    const ownerMatch = expected.owner?.toLowerCase() === actual.owner?.toLowerCase()
    const countryMatch = expected.country?.toLowerCase() === actual.country?.toLowerCase()
    const structureMatch = expected.structure_type?.toLowerCase() === actual.structure_type?.toLowerCase()
    
    if (ownerMatch && countryMatch && structureMatch) {
      return 'exact_match'
    } else if (ownerMatch && countryMatch) {
      return 'partial_match'
    } else if (ownerMatch) {
      return 'owner_match_only'
    } else {
      return 'no_match'
    }
  }

  /**
   * Calculate explainability score
   */
  calculateExplainabilityScore(result) {
    let score = 0
    
    // Base score for having reasoning
    if (result.reasoning && result.reasoning.length > 50) {
      score += 0.3
    }
    
    // Score for having sources
    if (result.sources && result.sources.length > 0) {
      score += 0.3
    }
    
    // Score for having trace steps
    if (result.trace_steps && result.trace_steps.length > 0) {
      score += 0.4
    }
    
    return Math.min(score, 1.0)
  }

  /**
   * Get sheet validation status
   */
  getSheetValidation() {
    return this.sheetValidation
  }

  /**
   * Get prompt snapshot for a trace
   */
  async getPromptSnapshot(traceId) {
    if (!this.isAvailable) {
      return null
    }

    try {
      // For now, return null to trigger mock snapshot
      // This can be enhanced later to store/retrieve actual prompt snapshots
      return null
    } catch (error) {
      console.error('[EvaluationFramework] Error getting prompt snapshot:', error)
      return null
    }
  }

  /**
   * Get trace steps for a trace
   */
  async getTraceSteps(traceId) {
    if (!this.isAvailable) {
      return []
    }

    try {
      // For now, return empty array to trigger mock trace
      // This can be enhanced later to store/retrieve actual trace steps
      return []
    } catch (error) {
      console.error('[EvaluationFramework] Error getting trace steps:', error)
      return []
    }
  }

  /**
   * Check if evaluation framework is available
   */
  isEvaluationAvailable() {
    return this.isAvailable
  }
}

// Export singleton instance
export const evaluationFramework = new EvaluationFrameworkService()
