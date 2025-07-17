import { google } from 'googleapis'

/**
 * Google Sheets Evaluation Service
 * Handles evaluation data sync with Google Sheets using the new structure
 */

class GoogleSheetsEvaluationService {
  constructor() {
    this.auth = null
    this.sheets = null
    this.spreadsheetId = process.env.GOOGLE_SHEETS_EVALUATION_ID
    this.isInitialized = false
  }

  /**
   * Initialize Google Sheets API
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      // Use API key authentication instead of service account
      const auth = new google.auth.GoogleAuth({
        key: process.env.GOOGLE_API_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      })

      this.auth = await auth.getClient()
      this.sheets = google.sheets({ version: 'v4', auth: this.auth })
      this.isInitialized = true

      console.log('[GoogleSheets] Initialized successfully with API key')
    } catch (error) {
      console.error('[GoogleSheets] Initialization failed:', error)
      // Fallback to API key only (limited functionality)
      this.auth = process.env.GOOGLE_API_KEY
      this.sheets = google.sheets({ version: 'v4', auth: this.auth })
      this.isInitialized = true
      console.log('[GoogleSheets] Using API key fallback (limited functionality)')
    }
  }

  /**
   * Create evaluation spreadsheet template with new structure
   */
  async createEvaluationTemplate(title = 'Agent Evaluation Framework') {
    await this.initialize()

    try {
      // Create new spreadsheet
      const createResponse = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: title
          },
          sheets: [
            {
              properties: {
                title: 'evaluation_cases',
                sheetId: 0
              }
            },
            {
              properties: {
                title: 'evaluation_results',
                sheetId: 1
              }
            },
            {
              properties: {
                title: 'evaluation_steps',
                sheetId: 2
              }
            },
            {
              properties: {
                title: 'ownership_mappings',
                sheetId: 3
              }
            }
          ]
        }
      })

      const spreadsheetId = createResponse.data.spreadsheetId
      console.log('[GoogleSheets] Created evaluation template:', spreadsheetId)

      // Set up headers for each sheet
      await this.setupSheetHeaders(spreadsheetId)

      return spreadsheetId
    } catch (error) {
      console.error('[GoogleSheets] Failed to create template:', error)
      throw error
    }
  }

  /**
   * Set up headers for evaluation sheets with new structure
   */
  async setupSheetHeaders(spreadsheetId) {
    const headers = {
      'evaluation_cases': [
        'test_id', 'barcode', 'product_name', 'expected_owner', 'expected_country', 
        'expected_structure_type', 'expected_confidence', 'human_query', 
        'evaluation_strategy', 'evidence_expectation', 'source_hints', 'notes'
      ],
      'evaluation_results': [
        'test_id', 'trace_id', 'run_timestamp', 'agent_version', 'actual_owner', 
        'actual_country', 'actual_structure_type', 'confidence_score', 'match_result', 
        'latency', 'token_cost_estimate', 'tool_errors', 'explainability_score', 
        'source_used', 'prompt_snapshot', 'response_snippet'
      ],
      'evaluation_steps': [
        'trace_id', 'step_order', 'step_name', 'agent_or_tool', 'input', 
        'output_snippet', 'outcome', 'latency_seconds', 'tool_used', 
        'fallback_used', 'notes'
      ],
      'ownership_mappings': [
        'brand_name', 'regional_entity', 'intermediate_entity', 'ultimate_owner_name', 
        'ultimate_owner_country', 'ultimate_owner_flag', 'notes', 'source'
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
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: await this.getSheetIdByName(spreadsheetId, sheetName),
                  startRowIndex: 0,
                  endRowIndex: 1
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

    console.log('[GoogleSheets] Headers set up successfully')
  }

  /**
   * Get sheet ID by name
   */
  async getSheetIdByName(spreadsheetId, sheetName) {
    const response = await this.sheets.spreadsheets.get({ spreadsheetId })
    const sheet = response.data.sheets.find(s => s.properties.title === sheetName)
    return sheet ? Number(sheet.properties.sheetId) : null
  }

  /**
   * Add evaluation result to evaluation_results sheet
   */
  async addEvaluationResult(evaluationData) {
    await this.initialize()

    if (!this.spreadsheetId) {
      throw new Error('No evaluation spreadsheet ID configured')
    }

    try {
      const {
        test_id,
        trace_id,
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
        response_snippet,
        correction_data
      } = evaluationData

      const run_timestamp = new Date().toISOString()

      // Handle correction data if present
      const correction_info = correction_data ? JSON.stringify(correction_data) : ''

      const rowData = [
        test_id,
        trace_id,
        run_timestamp,
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
        response_snippet,
        correction_info
      ]

      // Append row to evaluation_results sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'evaluation_results!A:A',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData]
        }
      })

      console.log(`[GoogleSheets] Added evaluation result for test_id: ${test_id}`)
      return true
    } catch (error) {
      console.error('[GoogleSheets] Failed to add evaluation result:', error)
      throw error
    }
  }

  /**
   * Add evaluation steps to evaluation_steps sheet
   */
  async addEvaluationSteps(trace_id, steps) {
    await this.initialize()

    if (!this.spreadsheetId) {
      throw new Error('No evaluation spreadsheet ID configured')
    }

    try {
      const rows = steps.map((step, index) => [
        trace_id,
        index + 1, // step_order
        step.step_name || step.name || `Step ${index + 1}`,
        step.agent_or_tool || step.agent || 'Unknown',
        step.input || '',
        step.output_snippet || step.output || '',
        step.outcome || step.status || 'completed',
        step.latency_seconds || (step.duration ? step.duration / 1000 : ''),
        step.tool_used || '',
        step.fallback_used || 'No',
        step.notes || ''
      ])

      // Append rows to evaluation_steps sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'evaluation_steps!A:A',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: rows
        }
      })

      console.log(`[GoogleSheets] Added ${rows.length} evaluation steps for trace_id: ${trace_id}`)
      return true
    } catch (error) {
      console.error('[GoogleSheets] Failed to add evaluation steps:', error)
      throw error
    }
  }

  /**
   * Add ownership mapping to ownership_mappings sheet
   */
  async addOwnershipMapping(mappingData) {
    await this.initialize()

    if (!this.spreadsheetId) {
      throw new Error('No evaluation spreadsheet ID configured')
    }

    try {
      const {
        brand_name,
        regional_entity,
        intermediate_entity,
        ultimate_owner_name,
        ultimate_owner_country,
        ultimate_owner_flag,
        notes,
        source
      } = mappingData

      const rowData = [
        brand_name,
        regional_entity,
        intermediate_entity,
        ultimate_owner_name,
        ultimate_owner_country,
        ultimate_owner_flag,
        notes,
        source
      ]

      // Append row to ownership_mappings sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'ownership_mappings!A:A',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData]
        }
      })

      console.log(`[GoogleSheets] Added ownership mapping for brand: ${brand_name}`)
      return true
    } catch (error) {
      console.error('[GoogleSheets] Failed to add ownership mapping:', error)
      throw error
    }
  }

  /**
   * Get evaluation cases from evaluation_cases sheet
   */
  async getEvaluationCases(limit = 100) {
    await this.initialize()

    if (!this.spreadsheetId) {
      throw new Error('No evaluation spreadsheet ID configured')
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'evaluation_cases!A:L',
        majorDimension: 'ROWS'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers

      const headers = rows[0]
      const data = rows.slice(1, limit + 1).map(row => {
        const obj = {}
        headers.forEach((header, index) => {
          obj[header] = row[index] || ''
        })
        return obj
      })

      return data
    } catch (error) {
      console.error('[GoogleSheets] Failed to get evaluation cases:', error)
      throw error
    }
  }

  /**
   * Get ownership mappings from ownership_mappings sheet
   */
  async getOwnershipMappings(limit = 1000) {
    await this.initialize()

    if (!this.spreadsheetId) {
      throw new Error('No evaluation spreadsheet ID configured')
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'ownership_mappings!A:H',
        majorDimension: 'ROWS'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers

      const headers = rows[0]
      const data = rows.slice(1, limit + 1).map(row => {
        const obj = {}
        headers.forEach((header, index) => {
          obj[header] = row[index] || ''
        })
        return obj
      })

      return data
    } catch (error) {
      console.error('[GoogleSheets] Failed to get ownership mappings:', error)
      throw error
    }
  }

  /**
   * Get evaluation results from evaluation_results sheet
   */
  async getEvaluationResults(limit = 100) {
    await this.initialize()

    if (!this.spreadsheetId) {
      throw new Error('No evaluation spreadsheet ID configured')
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'evaluation_results!A:P',
        majorDimension: 'ROWS'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers

      const headers = rows[0]
      const data = rows.slice(1, limit + 1).map(row => {
        const obj = {}
        headers.forEach((header, index) => {
          obj[header] = row[index] || ''
        })
        return obj
      })

      return data
    } catch (error) {
      console.error('[GoogleSheets] Failed to get evaluation results:', error)
      throw error
    }
  }

  /**
   * Get evaluation steps for a specific trace_id
   */
  async getEvaluationSteps(trace_id) {
    await this.initialize()

    if (!this.spreadsheetId) {
      throw new Error('No evaluation spreadsheet ID configured')
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'evaluation_steps!A:K',
        majorDimension: 'ROWS'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers

      const headers = rows[0]
      const data = rows.slice(1).map(row => {
        const obj = {}
        headers.forEach((header, index) => {
          obj[header] = row[index] || ''
        })
        return obj
      })

      // Filter by trace_id
      return data.filter(row => row.trace_id === trace_id)
    } catch (error) {
      console.error('[GoogleSheets] Failed to get evaluation steps:', error)
      throw error
    }
  }

  /**
   * Check if a brand exists in ownership_mappings
   */
  async checkOwnershipMapping(brand_name) {
    const mappings = await this.getOwnershipMappings()
    return mappings.find(mapping => 
      mapping.brand_name && 
      mapping.brand_name.toLowerCase() === brand_name.toLowerCase()
    )
  }

  /**
   * Generate evaluation URL for a specific test_id
   */
  generateEvaluationUrl(test_id) {
    if (!this.spreadsheetId) return null
    
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit#gid=0`
  }

  /**
   * Log complete evaluation data (result + steps)
   */
  async logCompleteEvaluation(evaluationData, steps) {
    try {
      // Add evaluation result
      await this.addEvaluationResult(evaluationData)
      
      // Add evaluation steps if provided
      if (steps && steps.length > 0) {
        await this.addEvaluationSteps(evaluationData.trace_id, steps)
      }
      
      console.log(`[GoogleSheets] Complete evaluation logged for test_id: ${evaluationData.test_id}`)
      return true
    } catch (error) {
      console.error('[GoogleSheets] Failed to log complete evaluation:', error)
      throw error
    }
  }
}

// Export singleton instance
export const googleSheetsEvaluation = new GoogleSheetsEvaluationService() 