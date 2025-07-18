import { google } from 'googleapis'

/**
 * Google Sheets Evaluation Service
 * Handles evaluation data sync with Google Sheets using the multi-sheet setup
 */

class GoogleSheetsEvaluationService {
  constructor() {
    this.auth = null
    this.sheets = null
    this.isInitialized = false
    
    // Multi-sheet configuration - can be overridden by environment variables
    this.sheetIds = {
      evaluation_cases: process.env.GOOGLE_SHEET_EVALUATION_CASES || '1m5P9LxLg_g_tek2m1DQZJf2WnrRlp4N-Y00UksUdCA0',
      evaluation_results: process.env.GOOGLE_SHEET_EVALUATION_RESULTS || '1goFKiB9Khp4R0ASvVqn3TbGX2YW1gFVVToPYK9foBKo',
      evaluation_steps: process.env.GOOGLE_SHEET_EVALUATION_STEPS || '1BSq_d9dZzI1N-NOuT_uJff5eZUO5BN7cEh3bwrbQvmg',
      ownership_mappings: process.env.GOOGLE_SHEET_OWNERSHIP_MAPPINGS || '1Pa844D_sTypLVNxRphJPCCEfOP03sHWIYLmiXCNT9vs'
    }
  }

  /**
   * Initialize Google Sheets API with service account
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      console.log('[GoogleSheets] Starting initialization...')
      
      // Parse service account key from environment variable
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON
      
      if (!serviceAccountKey) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_JSON environment variable not set')
      }

      console.log('[GoogleSheets] Service account key found, length:', serviceAccountKey.length)
      
      const credentials = JSON.parse(serviceAccountKey)
      console.log('[GoogleSheets] Credentials parsed successfully, client_email:', credentials.client_email)
      
      const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
      )

      this.auth = auth
      this.sheets = google.sheets({ version: 'v4', auth: this.auth })
      this.isInitialized = true

      console.log('[GoogleSheets] Initialized successfully with service account')
      console.log('[GoogleSheets] Using sheet IDs:', this.sheetIds)
    } catch (error) {
      console.error('[GoogleSheets] Initialization failed:', error)
      this.isInitialized = false
      throw error
    }
  }

  /**
   * Validate that all sheets are accessible
   */
  async validateSheets() {
    await this.initialize()
    
    const validationResults = {}
    
    for (const [sheetName, sheetId] of Object.entries(this.sheetIds)) {
      try {
        const response = await this.sheets.spreadsheets.get({ 
          spreadsheetId: sheetId,
          ranges: ['A1:Z1'] // Just get headers to validate access
        })
        validationResults[sheetName] = { 
          accessible: true, 
          title: response.data.properties?.title || sheetName 
        }
        console.log(`[GoogleSheets] ✅ ${sheetName} accessible`)
      } catch (error) {
        validationResults[sheetName] = { 
          accessible: false, 
          error: error.message 
        }
        console.error(`[GoogleSheets] ❌ ${sheetName} not accessible:`, error.message)
      }
    }
    
    return validationResults
  }

  /**
   * Add evaluation result to evaluation_results sheet
   */
  async addEvaluationResult(evaluationData) {
    await this.initialize()

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
        run_timestamp = new Date().toISOString()
      } = evaluationData

      const values = [
        test_id,
        trace_id || '',
        run_timestamp,
        agent_version || 'unknown',
        actual_owner || '',
        actual_country || '',
        actual_structure_type || '',
        confidence_score || 0,
        match_result || 'unknown',
        latency || 0,
        token_cost_estimate || 0,
        tool_errors || '',
        explainability_score || 0,
        source_used || '',
        prompt_snapshot || '',
        response_snippet || ''
      ]

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.sheetIds.evaluation_results,
        range: 'A:A',
        valueInputOption: 'RAW',
        requestBody: {
          values: [values]
        }
      })

      console.log(`[GoogleSheets] Added evaluation result for test_id: ${test_id}`)
      return true
    } catch (error) {
      console.error('[GoogleSheets] Error adding evaluation result:', error)
      throw error
    }
  }

  /**
   * Add evaluation steps to evaluation_steps sheet
   */
  async addEvaluationSteps(trace_id, steps) {
    await this.initialize()

    if (!Array.isArray(steps)) {
      console.warn('[GoogleSheets] Steps must be an array')
      return false
    }

    try {
      const values = steps.map((step, index) => [
        trace_id,
        index + 1,
        step.name || 'unknown',
        step.agent || step.tool || 'unknown',
        step.input || '',
        step.output ? JSON.stringify(step.output).substring(0, 500) : '',
        step.outcome || 'unknown',
        step.latency || 0,
        step.tool_used || '',
        step.fallback_used || false,
        step.notes || ''
      ])

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.sheetIds.evaluation_steps,
        range: 'A:A',
        valueInputOption: 'RAW',
        requestBody: {
          values: values
        }
      })

      console.log(`[GoogleSheets] Added ${steps.length} evaluation steps for trace_id: ${trace_id}`)
      return true
    } catch (error) {
      console.error('[GoogleSheets] Error adding evaluation steps:', error)
      throw error
    }
  }

  /**
   * Add ownership mapping to ownership_mappings sheet
   */
  async addOwnershipMapping(mappingData) {
    await this.initialize()

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

      const values = [
        brand_name,
        regional_entity || '',
        intermediate_entity || '',
        ultimate_owner_name,
        ultimate_owner_country,
        ultimate_owner_flag || '',
        notes || '',
        source || ''
      ]

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.sheetIds.ownership_mappings,
        range: 'A:A',
        valueInputOption: 'RAW',
        requestBody: {
          values: [values]
        }
      })

      console.log(`[GoogleSheets] Added ownership mapping for brand: ${brand_name}`)
      return true
    } catch (error) {
      console.error('[GoogleSheets] Error adding ownership mapping:', error)
      throw error
    }
  }

  /**
   * Get evaluation cases from evaluation_cases sheet
   */
  async getEvaluationCases(limit = 100) {
    await this.initialize()

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetIds.evaluation_cases,
        range: 'A:L'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers or empty

      const headers = rows[0]
      const dataRows = rows.slice(1, limit + 1)

      return dataRows.map(row => {
        const caseData = {}
        headers.forEach((header, index) => {
          caseData[header] = row[index] || ''
        })
        return caseData
      })
    } catch (error) {
      console.error('[GoogleSheets] Error getting evaluation cases:', error)
      return []
    }
  }

  /**
   * Get ownership mappings from ownership_mappings sheet
   */
  async getOwnershipMappings(limit = 1000) {
    await this.initialize()

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetIds.ownership_mappings,
        range: 'A:H'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers or empty

      const headers = rows[0]
      const dataRows = rows.slice(1, limit + 1)

      return dataRows.map(row => {
        const mappingData = {}
        headers.forEach((header, index) => {
          mappingData[header] = row[index] || ''
        })
        return mappingData
      })
    } catch (error) {
      console.error('[GoogleSheets] Error getting ownership mappings:', error)
      return []
    }
  }

  /**
   * Get evaluation results from evaluation_results sheet
   */
  async getEvaluationResults(limit = 100) {
    await this.initialize()

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetIds.evaluation_results,
        range: 'A:P'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers or empty

      const headers = rows[0]
      const dataRows = rows.slice(1, limit + 1)

      return dataRows.map(row => {
        const resultData = {}
        headers.forEach((header, index) => {
          resultData[header] = row[index] || ''
        })
        return resultData
      })
    } catch (error) {
      console.error('[GoogleSheets] Error getting evaluation results:', error)
      return []
    }
  }

  /**
   * Get evaluation steps for a specific trace_id
   */
  async getEvaluationSteps(trace_id) {
    await this.initialize()

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetIds.evaluation_steps,
        range: 'A:K'
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // Only headers or empty

      const headers = rows[0]
      const dataRows = rows.slice(1)

      // Filter by trace_id
      const filteredRows = dataRows.filter(row => {
        const traceIdIndex = headers.indexOf('trace_id')
        return traceIdIndex >= 0 && row[traceIdIndex] === trace_id
      })

      return filteredRows.map(row => {
        const stepData = {}
        headers.forEach((header, index) => {
          stepData[header] = row[index] || ''
        })
        return stepData
      })
    } catch (error) {
      console.error('[GoogleSheets] Error getting evaluation steps:', error)
      return []
    }
  }

  /**
   * Check if a brand has an ownership mapping
   */
  async checkOwnershipMapping(brand_name) {
    const mappings = await this.getOwnershipMappings()
    return mappings.find(mapping => 
      mapping.brand_name && 
      mapping.brand_name.toLowerCase() === brand_name.toLowerCase()
    )
  }

  /**
   * Generate evaluation URL for a test
   */
  generateEvaluationUrl(test_id) {
    return `https://docs.google.com/spreadsheets/d/${this.sheetIds.evaluation_results}/edit#gid=0&range=A:A&filter=test_id:${test_id}`
  }

  /**
   * Log complete evaluation with results and steps
   */
  async logCompleteEvaluation(evaluationData, steps) {
    try {
      await this.addEvaluationResult(evaluationData)
      if (steps && steps.length > 0) {
        await this.addEvaluationSteps(evaluationData.trace_id, steps)
      }
      return true
    } catch (error) {
      console.error('[GoogleSheets] Error logging complete evaluation:', error)
      throw error
    }
  }
}

// Export the class as a named export and a singleton instance
export { GoogleSheetsEvaluationService }
export const googleSheetsEvaluation = new GoogleSheetsEvaluationService()

// Default export for compatibility
export default GoogleSheetsEvaluationService 