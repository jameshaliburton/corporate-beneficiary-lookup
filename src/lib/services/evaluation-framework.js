// Evaluation Framework Service

import dotenv from 'dotenv'
import { google } from 'googleapis'

// Load environment variables
dotenv.config({ path: '.env.local' })

/**
 * Evaluation Framework Service
 * Connects agent workflows with structured Google Sheets for human-in-the-loop feedback
 */

class EvaluationFrameworkService {
  constructor() {
    this.auth = null
    this.sheets = null
    this.spreadsheetId = process.env.GOOGLE_SHEETS_EVALUATION_ID
    this.isInitialized = false
    
    // Sheet tab names
    this.tabs = {
      EVALUATION_CASES: 'Evaluation Cases',
      HUMAN_RATINGS: 'Human Ratings', 
      AI_RESULTS: 'AI Results',
      OWNERSHIP_MAPPINGS: 'Ownership Mappings',
      FEEDBACK_SUGGESTIONS: 'Feedback & Suggestions'
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

      console.log('[EvaluationFramework] Initialized successfully')
    } catch (error) {
      console.error('[EvaluationFramework] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Create evaluation spreadsheet with the defined architecture
   */
  async createEvaluationSpreadsheet(title = 'Agent Evaluation Framework') {
    await this.initialize()

    try {
      const createResponse = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: title
          },
          sheets: [
            {
              properties: {
                title: this.tabs.EVALUATION_CASES,
                sheetId: 0
              }
            },
            {
              properties: {
                title: this.tabs.HUMAN_RATINGS,
                sheetId: 1
              }
            },
            {
              properties: {
                title: this.tabs.AI_RESULTS,
                sheetId: 2
              }
            },
            {
              properties: {
                title: this.tabs.OWNERSHIP_MAPPINGS,
                sheetId: 3
              }
            },
            {
              properties: {
                title: this.tabs.FEEDBACK_SUGGESTIONS,
                sheetId: 4
              }
            }
          ]
        }
      })

      const spreadsheetId = createResponse.data.spreadsheetId
      console.log('[EvaluationFramework] Created spreadsheet:', spreadsheetId)

      // Set up headers for all tabs
      await this.setupSheetHeaders(spreadsheetId)

      return spreadsheetId
    } catch (error) {
      console.error('[EvaluationFramework] Failed to create spreadsheet:', error)
      throw error
    }
  }

  /**
   * Set up headers for all evaluation sheets
   */
  async setupSheetHeaders(spreadsheetId) {
    const headers = {
      [this.tabs.EVALUATION_CASES]: [
        'case_id', 'task_type', 'input_context', 'expected_behavior', 
        'notes', 'status', 'created_date', 'updated_date'
      ],
      [this.tabs.HUMAN_RATINGS]: [
        'case_id', 'evaluator', 'score', 'reasoning', 'timestamp',
        'confidence_accuracy', 'reasoning_quality', 'hallucination_detected',
        'improvement_suggestions'
      ],
      [this.tabs.AI_RESULTS]: [
        'case_id', 'agent_version', 'output', 'evaluation_score', 
        'logs', 'timestamp', 'execution_trace', 'confidence_score',
        'sources_used', 'fallback_reason', 'total_duration_ms'
      ],
      [this.tabs.OWNERSHIP_MAPPINGS]: [
        'brand_name', 'parent_company', 'source_url', 'confidence',
        'last_updated', 'verified_by'
      ],
      [this.tabs.FEEDBACK_SUGGESTIONS]: [
        'case_id', 'submitted_by', 'suggestion', 'urgency', 'date',
        'category', 'status', 'assigned_to'
      ]
    }

    for (const [sheetName, headerRow] of Object.entries(headers)) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:${String.fromCharCode(65 + headerRow.length - 1)}1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headerRow]
        }
      })

      // Format headers
      await this.formatHeaders(spreadsheetId, sheetName, headerRow.length)
    }

    console.log('[EvaluationFramework] Headers set up successfully')
  }

  /**
   * Format headers with styling
   */
  async formatHeaders(spreadsheetId, sheetName, columnCount) {
    const sheetId = await this.getSheetIdByName(spreadsheetId, sheetName)
    
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: columnCount
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      }
    })
  }

  /**
   * Get sheet ID by name
   */
  async getSheetIdByName(spreadsheetId, sheetName) {
    const response = await this.sheets.spreadsheets.get({ spreadsheetId })
    const sheet = response.data.sheets.find(s => s.properties.title === sheetName)
    return sheet ? sheet.properties.sheetId : null
  }

  /**
   * Add AI result to the AI Results tab
   */
  async addAIResult(aiResult) {
    await this.initialize()

    if (!this.spreadsheetId) {
      throw new Error('No evaluation spreadsheet ID configured')
    }

    try {
      const {
        case_id,
        agent_version = 'v1.0',
        output,
        evaluation_score,
        logs,
        execution_trace,
        confidence_score,
        sources_used,
        fallback_reason,
        total_duration_ms
      } = aiResult

      const rowData = [
        case_id,
        agent_version,
        JSON.stringify(output),
        evaluation_score || '',
        JSON.stringify(logs),
        new Date().toISOString(),
        JSON.stringify(execution_trace),
        confidence_score || '',
        sources_used?.join(', ') || '',
        fallback_reason || '',
        total_duration_ms || ''
      ]

      // Append row to AI Results sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.tabs.AI_RESULTS}!A:A`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData]
        }
      })

      console.log(`[EvaluationFramework] Added AI result for case: ${case_id}`)
      return true
    } catch (error) {
      console.error('[EvaluationFramework] Failed to add AI result:', error)
      throw error
    }
  }

  /**
   * Get evaluation cases
   */
  async getEvaluationCases(status = null) {
    await this.initialize()

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.tabs.EVALUATION_CASES}!A:H`,
        majorDimension: 'ROWS'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers

      const headers = rows[0]
      const cases = rows.slice(1).map(row => {
        const obj = {}
        headers.forEach((header, index) => {
          obj[header] = row[index] || ''
        })
        return obj
      })

      // Filter by status if provided
      if (status) {
        return cases.filter(c => c.status === status)
      }

      return cases
    } catch (error) {
      console.error('[EvaluationFramework] Failed to get evaluation cases:', error)
      throw error
    }
  }

  /**
   * Get human ratings for a specific case
   */
  async getHumanRatings(caseId) {
    await this.initialize()

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.tabs.HUMAN_RATINGS}!A:I`,
        majorDimension: 'ROWS'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers

      const headers = rows[0]
      const ratings = rows.slice(1)
        .map(row => {
          const obj = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        })
        .filter(rating => rating.case_id === caseId)

      return ratings
    } catch (error) {
      console.error('[EvaluationFramework] Failed to get human ratings:', error)
      throw error
    }
  }

  /**
   * Get AI results for a specific case
   */
  async getAIResults(caseId, agentVersion = null) {
    await this.initialize()

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.tabs.AI_RESULTS}!A:K`,
        majorDimension: 'ROWS'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers

      const headers = rows[0]
      let results = rows.slice(1)
        .map(row => {
          const obj = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        })
        .filter(result => result.case_id === caseId)

      // Filter by agent version if provided
      if (agentVersion) {
        results = results.filter(result => result.agent_version === agentVersion)
      }

      return results
    } catch (error) {
      console.error('[EvaluationFramework] Failed to get AI results:', error)
      throw error
    }
  }

  /**
   * Compare human ratings vs AI results for a case
   */
  async compareEvaluations(caseId) {
    const [humanRatings, aiResults] = await Promise.all([
      this.getHumanRatings(caseId),
      this.getAIResults(caseId)
    ])

    const comparison = {
      case_id: caseId,
      human_ratings: humanRatings,
      ai_results: aiResults,
      mismatches: [],
      average_human_score: 0,
      average_ai_score: 0
    }

    // Calculate averages
    if (humanRatings.length > 0) {
      const scores = humanRatings.map(r => parseFloat(r.score)).filter(s => !isNaN(s))
      comparison.average_human_score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    }

    if (aiResults.length > 0) {
      const scores = aiResults.map(r => parseFloat(r.evaluation_score)).filter(s => !isNaN(s))
      comparison.average_ai_score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    }

    // Find mismatches (score difference > 2 points)
    const scoreDiff = Math.abs(comparison.average_human_score - comparison.average_ai_score)
    if (scoreDiff > 2) {
      comparison.mismatches.push({
        type: 'score_discrepancy',
        human_score: comparison.average_human_score,
        ai_score: comparison.average_ai_score,
        difference: scoreDiff
      })
    }

    return comparison
  }

  /**
   * Generate evaluation URL for a specific case
   */
  generateCaseUrl(caseId) {
    if (!this.spreadsheetId) return null
    
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit#gid=0`
  }

  /**
   * Validate case_id exists in Evaluation Cases
   */
  async validateCaseId(caseId) {
    const cases = await this.getEvaluationCases()
    return cases.some(c => c.case_id === caseId)
  }

  /**
   * Get evaluation statistics
   */
  async getEvaluationStats() {
    const [cases, ratings, results] = await Promise.all([
      this.getEvaluationCases(),
      this.getHumanRatings(),
      this.getAIResults()
    ])

    return {
      total_cases: cases.length,
      active_cases: cases.filter(c => c.status === 'active').length,
      total_human_ratings: ratings.length,
      total_ai_results: results.length,
      average_human_score: this.calculateAverageScore(ratings, 'score'),
      average_ai_score: this.calculateAverageScore(results, 'evaluation_score')
    }
  }

  /**
   * Calculate average score from array of objects
   */
  calculateAverageScore(items, scoreField) {
    const scores = items.map(item => parseFloat(item[scoreField])).filter(s => !isNaN(s))
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  }
}

// Export singleton instance
export const evaluationFramework = new EvaluationFrameworkService()
