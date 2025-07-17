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
      
      if (accessibleSheets.length >= 2) {
        this.isAvailable = true
        console.log('[EvaluationFramework] Initialized successfully with', accessibleSheets.length, 'accessible sheets')
      } else {
        this.isAvailable = false
        console.warn('[EvaluationFramework] Limited functionality - only', accessibleSheets.length, 'sheets accessible')
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
        error: 'Google Sheets not configured or not accessible'
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
   * Get evaluation results
   */
  async getEvaluationResults() {
    if (!this.isAvailable) {
      return []
    }

    try {
      return await this.googleSheets.getEvaluationResults(100)
    } catch (error) {
      console.error('[EvaluationFramework] Error getting results:', error)
      return []
    }
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
   * Check if evaluation framework is available
   */
  isEvaluationAvailable() {
    return this.isAvailable
  }
}

// Export singleton instance
export const evaluationFramework = new EvaluationFrameworkService()
