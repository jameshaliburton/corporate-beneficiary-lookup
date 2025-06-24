// Adapted Evaluation Framework Service
// Works with existing eval_results sheet structure

import dotenv from 'dotenv'
import { google } from 'googleapis'

// Load environment variables
dotenv.config({ path: '.env.local' })

/**
 * Adapted Evaluation Framework Service
 * Works with existing eval_results sheet structure
 */

class AdaptedEvaluationFrameworkService {
  constructor() {
    this.auth = null
    this.sheets = null
    this.spreadsheetId = process.env.GOOGLE_SHEETS_EVALUATION_ID
    this.isInitialized = false
    
    // Map our framework concepts to existing columns
    this.columnMapping = {
      test_id: 'A',
      trace_id: 'B', 
      run_timestamp: 'C',
      agent_version: 'D',
      actual_owner: 'E',
      actual_country: 'F',
      actual_structure_type: 'G',
      confidence_score: 'H',
      match_result: 'I',
      latency: 'J',
      token_cost_estimate: 'K',
      tool_errors: 'L',
      explainability_score: 'M',
      source_used: 'N',
      prompt_snapshot: 'O',
      response_snippet: 'P'
    }
  }

  /**
   * Initialize Google Sheets API
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      })

      this.auth = await auth.getClient()
      this.sheets = google.sheets({ version: 'v4', auth: this.auth })
      this.isInitialized = true

      console.log('[AdaptedEvaluationFramework] Initialized successfully')
    } catch (error) {
      console.error('[AdaptedEvaluationFramework] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Add evaluation result to existing sheet
   */
  async addEvaluationResult(evaluationData) {
    await this.initialize()

    try {
      const {
        test_id,
        trace_id,
        agent_version = 'v1.0',
        actual_owner,
        actual_country,
        actual_structure_type = 'Unknown',
        confidence_score,
        match_result,
        latency,
        token_cost_estimate,
        tool_errors = '',
        explainability_score,
        source_used,
        prompt_snapshot,
        response_snippet
      } = evaluationData

      const rowData = [
        test_id,
        trace_id,
        new Date().toISOString(),
        agent_version,
        actual_owner,
        actual_country,
        actual_structure_type,
        confidence_score,
        match_result,
        latency,
        token_cost_estimate,
        tool_errors,
        explainability_score,
        source_used,
        prompt_snapshot,
        response_snippet
      ]

      // Append to the sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'eval_results!A:P',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData]
        }
      })

      console.log(`[AdaptedEvaluationFramework] Added evaluation result for test ${test_id}`)
      return true
    } catch (error) {
      console.error('[AdaptedEvaluationFramework] Failed to add evaluation result:', error)
      throw error
    }
  }

  /**
   * Get all evaluation results
   */
  async getEvaluationResults() {
    await this.initialize()

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'eval_results!A:P'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers or empty

      const headers = rows[0]
      const results = rows.slice(1).map(row => {
        const result = {}
        headers.forEach((header, index) => {
          result[header] = row[index] || ''
        })
        return result
      })

      return results
    } catch (error) {
      console.error('[AdaptedEvaluationFramework] Failed to get evaluation results:', error)
      throw error
    }
  }

  /**
   * Get evaluation statistics
   */
  async getEvaluationStats() {
    const results = await this.getEvaluationResults()
    
    if (results.length === 0) {
      return {
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        average_confidence: 0,
        average_latency: 0,
        total_token_cost: 0
      }
    }

    const passed = results.filter(r => r.match_result === 'pass').length
    const failed = results.filter(r => r.match_result === 'fail').length
    
    const confidences = results
      .map(r => parseFloat(r.confidence_score))
      .filter(c => !isNaN(c))
    
    const latencies = results
      .map(r => parseFloat(r.latency))
      .filter(l => !isNaN(l))
    
    const tokenCosts = results
      .map(r => parseFloat(r.token_cost_estimate))
      .filter(t => !isNaN(t))

    return {
      total_tests: results.length,
      passed_tests: passed,
      failed_tests: failed,
      pass_rate: (passed / results.length * 100).toFixed(1),
      average_confidence: confidences.length > 0 ? 
        (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(1) : 0,
      average_latency: latencies.length > 0 ? 
        (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1) : 0,
      total_token_cost: tokenCosts.reduce((a, b) => a + b, 0)
    }
  }

  /**
   * Get results by test ID
   */
  async getResultsByTestId(testId) {
    const results = await this.getEvaluationResults()
    return results.filter(r => r.test_id === testId)
  }

  /**
   * Get recent results (last N)
   */
  async getRecentResults(limit = 10) {
    const results = await this.getEvaluationResults()
    return results.slice(-limit)
  }
}

// Export singleton instance
export const adaptedEvaluationFramework = new AdaptedEvaluationFrameworkService() 