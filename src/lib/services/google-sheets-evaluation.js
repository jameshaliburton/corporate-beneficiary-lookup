import { google } from 'googleapis'

/**
 * Google Sheets Evaluation Service
 * Handles evaluation data sync with Google Sheets
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
      // For now, we'll use API key authentication
      // In production, you'd want to use service account or OAuth2
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      })

      this.auth = await auth.getClient()
      this.sheets = google.sheets({ version: 'v4', auth: this.auth })
      this.isInitialized = true

      console.log('[GoogleSheets] Initialized successfully')
    } catch (error) {
      console.error('[GoogleSheets] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Create evaluation spreadsheet template
   */
  async createEvaluationTemplate(title = 'Agent Evaluation Data') {
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
                title: 'Query Builder Evaluations',
                sheetId: 0
              }
            },
            {
              properties: {
                title: 'Web Research Evaluations',
                sheetId: 1
              }
            },
            {
              properties: {
                title: 'Ownership Analysis Evaluations',
                sheetId: 2
              }
            },
            {
              properties: {
                title: 'Overall Evaluations',
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
   * Set up headers for evaluation sheets
   */
  async setupSheetHeaders(spreadsheetId) {
    const headers = {
      'Query Builder Evaluations': [
        'Timestamp', 'Product ID', 'Barcode', 'Brand', 'Query ID',
        'Company Type Accuracy (1-10)', 'Query Relevance (1-10)', 
        'Query Count Appropriate', 'Country Guess Accuracy',
        'Flags Identified', 'Reasoning Quality', 'Notes'
      ],
      'Web Research Evaluations': [
        'Timestamp', 'Product ID', 'Barcode', 'Brand', 'Query ID',
        'Source Quality Score', 'Coverage Completeness (1-10)',
        'Sources Found', 'Sources Used', 'Missed Opportunities',
        'Search Query Quality', 'Performance Notes'
      ],
      'Ownership Analysis Evaluations': [
        'Timestamp', 'Product ID', 'Barcode', 'Brand', 'Query ID',
        'Confidence Accuracy (1-10)', 'Reasoning Quality (1-10)',
        'Hallucination Detected', 'Source Citations',
        'Ownership Chain Accuracy', 'Improvement Suggestions'
      ],
      'Overall Evaluations': [
        'Timestamp', 'Product ID', 'Barcode', 'Brand', 'Query ID',
        'Overall Success', 'Total Duration (ms)', 'Final Confidence',
        'Result Type', 'Fallback Reason', 'Evaluation Notes'
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
                  sheetId: this.getSheetIdByName(spreadsheetId, sheetName),
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
    return sheet ? sheet.properties.sheetId : null
  }

  /**
   * Add evaluation data to appropriate sheet
   */
  async addEvaluation(evaluationData) {
    await this.initialize()

    if (!this.spreadsheetId) {
      throw new Error('No evaluation spreadsheet ID configured')
    }

    try {
      const { product, stage, evaluation } = evaluationData
      const timestamp = new Date().toISOString()
      
      let sheetName, rowData

      switch (stage) {
        case 'query_builder':
          sheetName = 'Query Builder Evaluations'
          rowData = [
            timestamp,
            product.id,
            product.barcode,
            product.brand,
            product.agent_execution_trace?.query_id || '',
            evaluation.companyTypeAccuracy || '',
            evaluation.queryRelevance || '',
            evaluation.queryCountAppropriate || '',
            evaluation.countryGuessAccuracy || '',
            evaluation.flagsIdentified?.join(', ') || '',
            evaluation.reasoningQuality || '',
            evaluation.notes || ''
          ]
          break

        case 'web_research':
          sheetName = 'Web Research Evaluations'
          rowData = [
            timestamp,
            product.id,
            product.barcode,
            product.brand,
            product.agent_execution_trace?.query_id || '',
            evaluation.sourceQualityScore || '',
            evaluation.coverageCompleteness || '',
            evaluation.sourcesFound || '',
            evaluation.sourcesUsed || '',
            evaluation.missedOpportunities?.join(', ') || '',
            evaluation.searchQueryQuality || '',
            evaluation.performanceNotes || ''
          ]
          break

        case 'ownership_analysis':
          sheetName = 'Ownership Analysis Evaluations'
          rowData = [
            timestamp,
            product.id,
            product.barcode,
            product.brand,
            product.agent_execution_trace?.query_id || '',
            evaluation.confidenceAccuracy || '',
            evaluation.reasoningQuality || '',
            evaluation.hallucinationDetected ? 'Yes' : 'No',
            evaluation.sourceCitations?.join(', ') || '',
            evaluation.ownershipChainAccuracy || '',
            evaluation.improvementSuggestions || ''
          ]
          break

        default:
          sheetName = 'Overall Evaluations'
          rowData = [
            timestamp,
            product.id,
            product.barcode,
            product.brand,
            product.agent_execution_trace?.query_id || '',
            product.financial_beneficiary !== 'Unknown' ? 'Success' : 'Failed',
            product.agent_execution_trace?.total_duration_ms || '',
            product.confidence_score || '',
            product.result_type || '',
            product.fallback_reason || '',
            evaluation.overallNotes || ''
          ]
      }

      // Append row to sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData]
        }
      })

      console.log(`[GoogleSheets] Added evaluation to ${sheetName}`)
      return true
    } catch (error) {
      console.error('[GoogleSheets] Failed to add evaluation:', error)
      throw error
    }
  }

  /**
   * Get evaluation data from sheets
   */
  async getEvaluations(sheetName = 'Overall Evaluations', limit = 100) {
    await this.initialize()

    if (!this.spreadsheetId) {
      throw new Error('No evaluation spreadsheet ID configured')
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:L`,
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
      console.error('[GoogleSheets] Failed to get evaluations:', error)
      throw error
    }
  }

  /**
   * Generate evaluation URL for a specific product/stage
   */
  generateEvaluationUrl(productId, stage, queryId) {
    if (!this.spreadsheetId) return null

    const sheetNames = {
      query_builder: 'Query Builder Evaluations',
      web_research: 'Web Research Evaluations',
      ownership_analysis: 'Ownership Analysis Evaluations',
      overall: 'Overall Evaluations'
    }

    const sheetName = sheetNames[stage] || 'Overall Evaluations'
    const encodedSheetName = encodeURIComponent(sheetName)
    
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit#gid=0&range=${encodedSheetName}!A:Z`
  }
}

// Export singleton instance
export const googleSheetsEvaluation = new GoogleSheetsEvaluationService() 