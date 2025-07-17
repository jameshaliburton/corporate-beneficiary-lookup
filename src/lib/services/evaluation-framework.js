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
  }

  /**
   * Initialize the evaluation framework
   */
  async initialize() {
    try {
      await this.googleSheets.initialize()
      this.isAvailable = true
      console.log('[EvaluationFramework] Initialized successfully')
    } catch (error) {
      console.error('[EvaluationFramework] Initialization failed:', error)
      this.isAvailable = false
      // Don't throw - allow the app to continue without evaluation features
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
        error: 'Google Sheets not configured'
      }
    }

    try {
      const cases = await this.googleSheets.getEvaluationCases(1000)
      const results = await this.googleSheets.getEvaluationResults(1000)
      
      const total_cases = cases.length
      const active_cases = cases.filter(c => c.status === 'active').length
      const total_human_ratings = results.filter(r => r.evaluator && r.evaluator !== 'ai').length
      const total_ai_results = results.length
      
      const human_scores = results
        .filter(r => r.evaluator && r.evaluator !== 'ai')
        .map(r => parseFloat(r.evaluation_score) || 0)
      
      const ai_scores = results
        .map(r => parseFloat(r.evaluation_score) || 0)
      
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
        error: error.message
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
   * Get case comparison data
   */
  async getCaseComparison(caseId) {
    if (!this.isAvailable) {
      return null
    }

    try {
      const results = await this.googleSheets.getEvaluationResults(1000)
      const caseResults = results.filter(r => r.test_id === caseId)
      
      const human_ratings = caseResults.filter(r => r.evaluator && r.evaluator !== 'ai')
      const ai_results = caseResults.filter(r => !r.evaluator || r.evaluator === 'ai')
      
      const human_scores = human_ratings.map(r => parseFloat(r.evaluation_score) || 0)
      const ai_scores = ai_results.map(r => parseFloat(r.evaluation_score) || 0)
      
      const average_human_score = human_scores.length > 0 
        ? human_scores.reduce((a, b) => a + b, 0) / human_scores.length 
        : 0
      
      const average_ai_score = ai_scores.length > 0 
        ? ai_scores.reduce((a, b) => a + b, 0) / ai_scores.length 
        : 0

      // Calculate mismatches
      const mismatches = []
      if (Math.abs(average_human_score - average_ai_score) > 1) {
        mismatches.push({
          type: 'Score Difference',
          difference: Math.abs(average_human_score - average_ai_score)
        })
      }

      return {
        human_ratings,
        ai_results,
        average_human_score,
        average_ai_score,
        mismatches
      }
    } catch (error) {
      console.error('[EvaluationFramework] Error getting case comparison:', error)
      return null
    }
  }

  /**
   * Create evaluation spreadsheet
   */
  async createEvaluationSpreadsheet(title) {
    if (!this.isAvailable) {
      throw new Error('Google Sheets not configured. Please set up Google API access.')
    }

    try {
      const spreadsheetId = await this.googleSheets.createEvaluationTemplate(title)
      return spreadsheetId
    } catch (error) {
      console.error('[EvaluationFramework] Error creating spreadsheet:', error)
      throw error
    }
  }

  /**
   * Log evaluation result
   */
  async logEvaluation(evaluationData) {
    if (!this.isAvailable) {
      console.warn('[EvaluationFramework] Cannot log evaluation - Google Sheets not configured')
      return false
    }

    try {
      await this.googleSheets.addEvaluationResult(evaluationData)
      console.log(`[EvaluationFramework] Evaluation logged for test_id: ${evaluationData.test_id}`)
      return true
    } catch (error) {
      console.error('[EvaluationFramework] Error logging evaluation:', error)
      return false
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
        source_used: 'manual_test_case',
        prompt_snapshot: caseData.human_query || '',
        response_snippet: caseData.notes || ''
      })
      console.log(`[EvaluationFramework] Evaluation case added for test_id: ${caseData.test_id}`)
      return true
    } catch (error) {
      console.error('[EvaluationFramework] Error adding evaluation case:', error)
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
      console.log(`[EvaluationFramework] Ownership mapping added for brand: ${mappingData.brand_name}`)
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
          owner: actual_result.financial_beneficiary,
          country: actual_result.beneficiary_country,
          structure_type: actual_result.ownership_structure_type,
          confidence: actual_result.confidence_score
        },
        matches: {
          owner: expectedResult.actual_owner === actual_result.financial_beneficiary,
          country: expectedResult.actual_country === actual_result.beneficiary_country,
          structure_type: expectedResult.actual_structure_type === actual_result.ownership_structure_type,
          confidence: Math.abs(expectedResult.confidence_score - actual_result.confidence_score) <= 10
        }
      }

      return comparison
    } catch (error) {
      console.error('[EvaluationFramework] Error comparing evaluation:', error)
      return { error: error.message }
    }
  }

  /**
   * Calculate match result between expected and actual evaluation
   */
  calculateMatchResult(expected, actual) {
    const ownerMatch = expected.expected_owner === actual.financial_beneficiary
    const countryMatch = expected.expected_country === actual.beneficiary_country
    const structureMatch = expected.expected_structure_type === actual.ownership_structure_type
    const confidenceMatch = Math.abs(expected.expected_confidence - actual.confidence_score) <= 10

    const totalMatches = [ownerMatch, countryMatch, structureMatch, confidenceMatch].filter(Boolean).length
    const matchPercentage = (totalMatches / 4) * 100

    return {
      owner_match: ownerMatch,
      country_match: countryMatch,
      structure_match: structureMatch,
      confidence_match: confidenceMatch,
      total_matches: totalMatches,
      match_percentage: matchPercentage,
      overall_result: matchPercentage >= 75 ? 'PASS' : 'FAIL'
    }
  }

  /**
   * Calculate explainability score based on reasoning and sources
   */
  calculateExplainabilityScore(evaluationData) {
    let score = 0
    const maxScore = 100

    // Reasoning quality (40 points)
    if (evaluationData.reasoning && evaluationData.reasoning.length > 100) {
      score += 20
      if (evaluationData.reasoning.includes('because') || evaluationData.reasoning.includes('due to')) {
        score += 10
      }
      if (evaluationData.reasoning.includes('evidence') || evaluationData.reasoning.includes('source')) {
        score += 10
      }
    }

    // Source diversity (30 points)
    if (evaluationData.sources && Array.isArray(evaluationData.sources)) {
      score += Math.min(evaluationData.sources.length * 10, 30)
    }

    // Agent execution trace quality (30 points)
    if (evaluationData.agent_execution_trace && evaluationData.agent_execution_trace.stages) {
      const stages = evaluationData.agent_execution_trace.stages
      score += Math.min(stages.length * 5, 15)
      
      const successfulStages = stages.filter(stage => stage.result === 'success').length
      score += Math.min(successfulStages * 5, 15)
    }

    return Math.min(score, maxScore) / maxScore // Normalize to 0-1
  }
}

// Export singleton instance
export const evaluationFramework = new EvaluationFrameworkService()
