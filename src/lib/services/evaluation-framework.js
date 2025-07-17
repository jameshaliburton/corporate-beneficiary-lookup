// Evaluation Framework Service

import dotenv from 'dotenv'
import { googleSheetsEvaluation } from './google-sheets-evaluation.js'

// Load environment variables
dotenv.config({ path: '.env.local' })

/**
 * Evaluation Framework Service
 * Connects agent workflows with structured Google Sheets for human-in-the-loop feedback
 * Updated to use new Google Sheets structure
 */

class EvaluationFrameworkService {
  constructor() {
    this.isInitialized = false
    
    // Sheet tab names (new structure)
    this.tabs = {
      EVALUATION_CASES: 'evaluation_cases',
      EVALUATION_RESULTS: 'evaluation_results',
      EVALUATION_STEPS: 'evaluation_steps',
      OWNERSHIP_MAPPINGS: 'ownership_mappings'
    }
  }

  /**
   * Initialize the evaluation framework
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      await googleSheetsEvaluation.initialize()
      this.isInitialized = true
      console.log('[EvaluationFramework] Initialized successfully')
    } catch (error) {
      console.error('[EvaluationFramework] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Create evaluation spreadsheet with the new structure
   */
  async createEvaluationSpreadsheet(title = 'Agent Evaluation Framework') {
    await this.initialize()

    try {
      const spreadsheetId = await googleSheetsEvaluation.createEvaluationTemplate(title)
      console.log('[EvaluationFramework] Created spreadsheet:', spreadsheetId)
      return spreadsheetId
    } catch (error) {
      console.error('[EvaluationFramework] Failed to create spreadsheet:', error)
      throw error
    }
  }

  /**
   * Add evaluation case to evaluation_cases sheet
   */
  async addEvaluationCase(caseData) {
    await this.initialize()

    try {
      const {
        test_id,
        barcode,
        product_name,
        expected_owner,
        expected_country,
        expected_structure_type,
        expected_confidence,
        human_query,
        evaluation_strategy,
        evidence_expectation,
        source_hints,
        notes
      } = caseData

      const rowData = [
        test_id,
        barcode,
        product_name,
        expected_owner,
        expected_country,
        expected_structure_type,
        expected_confidence,
        human_query,
        evaluation_strategy,
        evidence_expectation,
        source_hints,
        notes
      ]

      // Use the Google Sheets service to add the case
      await googleSheetsEvaluation.sheets.spreadsheets.values.append({
        spreadsheetId: googleSheetsEvaluation.spreadsheetId,
        range: 'evaluation_cases!A:A',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData]
        }
      })

      console.log(`[EvaluationFramework] Added evaluation case: ${test_id}`)
      return true
    } catch (error) {
      console.error('[EvaluationFramework] Failed to add evaluation case:', error)
      throw error
    }
  }

  /**
   * Log complete evaluation data (result + steps)
   */
  async logEvaluation(evaluationData, steps = []) {
    await this.initialize()

    try {
      // Add correction data if present
      const enhancedData = {
        ...evaluationData,
        correction_data: evaluationData.correction_data || null
      }
      
      await googleSheetsEvaluation.logCompleteEvaluation(enhancedData, steps)
      console.log(`[EvaluationFramework] Evaluation logged for test_id: ${evaluationData.test_id}`)
      return true
    } catch (error) {
      console.error('[EvaluationFramework] Failed to log evaluation:', error)
      throw error
    }
  }

  /**
   * Get evaluation cases from evaluation_cases sheet
   */
  async getEvaluationCases(limit = 100) {
    await this.initialize()

    try {
      const cases = await googleSheetsEvaluation.getEvaluationCases(limit)
      console.log(`[EvaluationFramework] Retrieved ${cases.length} evaluation cases`)
      return cases
    } catch (error) {
      console.error('[EvaluationFramework] Failed to get evaluation cases:', error)
      throw error
    }
  }

  /**
   * Get evaluation results from evaluation_results sheet
   */
  async getEvaluationResults(limit = 100) {
    await this.initialize()

    try {
      const results = await googleSheetsEvaluation.getEvaluationResults(limit)
      console.log(`[EvaluationFramework] Retrieved ${results.length} evaluation results`)
      return results
    } catch (error) {
      console.error('[EvaluationFramework] Failed to get evaluation results:', error)
      throw error
    }
  }

  /**
   * Get evaluation steps for a specific trace_id
   */
  async getEvaluationSteps(trace_id) {
    await this.initialize()

    try {
      const steps = await googleSheetsEvaluation.getEvaluationSteps(trace_id)
      console.log(`[EvaluationFramework] Retrieved ${steps.length} steps for trace_id: ${trace_id}`)
      return steps
    } catch (error) {
      console.error('[EvaluationFramework] Failed to get evaluation steps:', error)
      throw error
    }
  }

  /**
   * Get ownership mappings from ownership_mappings sheet
   */
  async getOwnershipMappings(limit = 1000) {
    await this.initialize()

    try {
      const mappings = await googleSheetsEvaluation.getOwnershipMappings(limit)
      console.log(`[EvaluationFramework] Retrieved ${mappings.length} ownership mappings`)
      return mappings
    } catch (error) {
      console.error('[EvaluationFramework] Failed to get ownership mappings:', error)
      throw error
    }
  }

  /**
   * Check if a brand exists in ownership_mappings
   */
  async checkOwnershipMapping(brand_name) {
    await this.initialize()

    try {
      const mapping = await googleSheetsEvaluation.checkOwnershipMapping(brand_name)
      return mapping
    } catch (error) {
      console.error('[EvaluationFramework] Failed to check ownership mapping:', error)
      return null
    }
  }

  /**
   * Add ownership mapping to ownership_mappings sheet
   */
  async addOwnershipMapping(mappingData) {
    await this.initialize()

    try {
      await googleSheetsEvaluation.addOwnershipMapping(mappingData)
      console.log(`[EvaluationFramework] Added ownership mapping for brand: ${mappingData.brand_name}`)
      return true
    } catch (error) {
      console.error('[EvaluationFramework] Failed to add ownership mapping:', error)
      throw error
    }
  }

  /**
   * Compare evaluation result with expected case
   */
  async compareEvaluation(test_id, actual_result) {
    await this.initialize()

    try {
      // Get the evaluation case
      const cases = await this.getEvaluationCases()
      const testCase = cases.find(c => c.test_id === test_id)
      
      if (!testCase) {
        throw new Error(`Test case not found: ${test_id}`)
      }

      // Compare actual vs expected
      const comparison = {
        test_id,
        actual_owner: actual_result.financial_beneficiary,
        expected_owner: testCase.expected_owner,
        actual_country: actual_result.beneficiary_country,
        expected_country: testCase.expected_country,
        actual_structure_type: actual_result.ownership_structure_type,
        expected_structure_type: testCase.expected_structure_type,
        confidence_score: actual_result.confidence_score,
        expected_confidence: testCase.expected_confidence,
        match_result: this.calculateMatchResult(testCase, actual_result),
        explainability_score: this.calculateExplainabilityScore(actual_result),
        source_used: actual_result.sources?.join(', ') || '',
        prompt_snapshot: actual_result.agent_results ? JSON.stringify(actual_result.agent_results) : '',
        response_snippet: actual_result.reasoning || ''
      }

      return comparison
    } catch (error) {
      console.error('[EvaluationFramework] Failed to compare evaluation:', error)
      throw error
    }
  }

  /**
   * Calculate match result between expected and actual
   */
  calculateMatchResult(testCase, actual_result) {
    const ownerMatch = this.fuzzyMatch(testCase.expected_owner, actual_result.financial_beneficiary)
    const countryMatch = this.fuzzyMatch(testCase.expected_country, actual_result.beneficiary_country)
    const structureMatch = this.fuzzyMatch(testCase.expected_structure_type, actual_result.ownership_structure_type)
    
    const confidenceThreshold = parseInt(testCase.expected_confidence) || 70
    const confidenceMatch = actual_result.confidence_score >= confidenceThreshold

    if (ownerMatch && countryMatch && structureMatch && confidenceMatch) {
      return 'PASS'
    } else if (ownerMatch && countryMatch) {
      return 'PARTIAL'
    } else {
      return 'FAIL'
    }
  }

  /**
   * Calculate explainability score based on reasoning quality
   */
  calculateExplainabilityScore(actual_result) {
    let score = 0
    
    // Base score for having reasoning
    if (actual_result.reasoning && actual_result.reasoning.length > 50) {
      score += 30
    }
    
    // Score for having sources
    if (actual_result.sources && actual_result.sources.length > 0) {
      score += 20
    }
    
    // Score for having ownership flow
    if (actual_result.ownership_flow && actual_result.ownership_flow.length > 0) {
      score += 25
    }
    
    // Score for having agent execution trace
    if (actual_result.agent_execution_trace) {
      score += 25
    }
    
    return Math.min(score, 100)
  }

  /**
   * Fuzzy string matching for comparison
   */
  fuzzyMatch(expected, actual) {
    if (!expected || !actual) return false
    
    const expectedClean = expected.toLowerCase().trim()
    const actualClean = actual.toLowerCase().trim()
    
    // Exact match
    if (expectedClean === actualClean) return true
    
    // Contains match
    if (expectedClean.includes(actualClean) || actualClean.includes(expectedClean)) return true
    
    // Common variations
    const variations = {
      'unknown': ['unknown', 'not found', 'n/a', ''],
      'ferrero group': ['ferrero', 'ferrero group', 'ferrero spa'],
      'nestle': ['nestle', 'nestle sa', 'nestle group'],
      'unilever': ['unilever', 'unilever plc', 'unilever group']
    }
    
    for (const [key, values] of Object.entries(variations)) {
      if (values.includes(expectedClean) && values.includes(actualClean)) {
        return true
      }
    }
    
    return false
  }

  /**
   * Generate evaluation URL for a specific test_id
   */
  generateEvaluationUrl(test_id) {
    return googleSheetsEvaluation.generateEvaluationUrl(test_id)
  }

  /**
   * Get evaluation statistics
   */
  async getEvaluationStats() {
    await this.initialize()

    try {
      const results = await this.getEvaluationResults(1000)
      
      const stats = {
        total_evaluations: results.length,
        pass_count: results.filter(r => r.match_result === 'PASS').length,
        partial_count: results.filter(r => r.match_result === 'PARTIAL').length,
        fail_count: results.filter(r => r.match_result === 'FAIL').length,
        average_confidence: results.reduce((sum, r) => sum + (parseFloat(r.confidence_score) || 0), 0) / results.length,
        average_latency: results.reduce((sum, r) => sum + (parseFloat(r.latency) || 0), 0) / results.length
      }
      
      stats.success_rate = (stats.pass_count / stats.total_evaluations) * 100
      
      return stats
    } catch (error) {
      console.error('[EvaluationFramework] Failed to get evaluation stats:', error)
      throw error
    }
  }

  /**
   * Validate test_id exists in evaluation_cases
   */
  async validateTestId(test_id) {
    await this.initialize()

    try {
      const cases = await this.getEvaluationCases()
      return cases.some(c => c.test_id === test_id)
    } catch (error) {
      console.error('[EvaluationFramework] Failed to validate test_id:', error)
      return false
    }
  }
}

// Export singleton instance
export const evaluationFramework = new EvaluationFrameworkService()
