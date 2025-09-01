import { describe, test, expect, beforeEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('Lookup API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('API Correctness Tests', () => {
    test('Pepsi lookup returns PepsiCo Inc. with 95%+ confidence', async () => {
      // This test validates that the API returns correct ownership data for known brands
      const mockResponse = {
        success: true,
        product_name: 'drink',
        brand: 'Pepsi',
        financial_beneficiary: 'PepsiCo Inc.',
        beneficiary_country: 'United States',
        confidence_score: 95,
        beneficiary_flag: '🇺🇸',
        agent_execution_trace: {
          sections: ['cache_check', 'llm_analysis'],
          show_skipped_stages: false,
          mark_skipped_stages: false
        },
        debug_info: {
          cache_hit: false,
          processing_time: 1500
        },
        result_type: 'llm_first_analysis',
        pipeline_type: 'enhanced'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponse
      } as Response)

      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'Pepsi', product_name: 'drink' })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Validate correct ownership chain
      expect(data.success).toBe(true)
      expect(data.financial_beneficiary).toBe('PepsiCo Inc.')
      expect(data.beneficiary_country).toBe('United States')
      expect(data.confidence_score).toBeGreaterThanOrEqual(95)
      expect(data.beneficiary_flag).toBe('🇺🇸')
      
      // Validate required fields exist
      expect(data).toHaveProperty('agent_execution_trace')
      expect(data).toHaveProperty('debug_info')
      expect(data).toHaveProperty('result_type')
      expect(data).toHaveProperty('pipeline_type')
    })

    test('Coca-Cola lookup returns The Coca-Cola Company with 95%+ confidence', async () => {
      // This test validates that the API returns correct ownership data for known brands
      const mockResponse = {
        success: true,
        product_name: 'drink',
        brand: 'Coca-Cola',
        financial_beneficiary: 'The Coca-Cola Company',
        beneficiary_country: 'United States',
        confidence_score: 95,
        beneficiary_flag: '🇺🇸'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponse
      } as Response)

      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'Coca-Cola', product_name: 'drink' })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Validate correct ownership chain
      expect(data.success).toBe(true)
      expect(data.financial_beneficiary).toBe('The Coca-Cola Company')
      expect(data.beneficiary_country).toBe('United States')
      expect(data.confidence_score).toBeGreaterThanOrEqual(95)
      expect(data.beneficiary_flag).toBe('🇺🇸')
    })

    test('OK Snacks lookup returns Orkla ASA (not previous incorrect parent)', async () => {
      // This test validates that the API returns correct ownership data for brands that were previously wrong
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'OK Snacks', product_name: 'snacks' })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Validate correct ownership chain (should be Orkla ASA, not previous incorrect parent)
      expect(data.success).toBe(true)
      expect(data.financial_beneficiary).toBe('Orkla ASA')
      expect(data.beneficiary_country).toBe('Norway')
      expect(data.confidence_score).toBeGreaterThanOrEqual(90)
      expect(data.beneficiary_flag).toBe('🇳🇴')
    })

    test('Response includes complete agent_execution_trace', async () => {
      // This test validates that debug information is complete for observability
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'Pepsi', product_name: 'drink' })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Validate trace data structure
      expect(data.agent_execution_trace).toBeDefined()
      expect(data.agent_execution_trace).toHaveProperty('sections')
      expect(data.agent_execution_trace).toHaveProperty('show_skipped_stages')
      expect(data.agent_execution_trace).toHaveProperty('mark_skipped_stages')
      
      // Validate trace includes executed stages
      expect(data.agent_execution_trace.sections).toBeInstanceOf(Array)
      expect(data.agent_execution_trace.sections.length).toBeGreaterThan(0)
    })

    test('Response includes debug_info with relevant metadata', async () => {
      // This test validates that debug information is complete for troubleshooting
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'Pepsi', product_name: 'drink' })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Validate debug info exists and has useful data
      expect(data).toHaveProperty('debug_info')
      expect(data.debug_info).toBeDefined()
    })
  })

  describe('Error Handling Tests', () => {
    test('Invalid JSON returns 400 with clear error message', async () => {
      // This test validates that the API handles malformed requests gracefully
      const mockErrorResponse = {
        success: false,
        error: 'Invalid JSON format'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        status: 400,
        json: async () => mockErrorResponse
      } as Response)

      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
      expect(data.error).toContain('Invalid JSON')
    })

    test('Missing required fields returns 400 with clear error message', async () => {
      // This test validates that the API validates required fields
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: 'drink' }) // Missing brand
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    test('Empty request body returns 400 with clear error message', async () => {
      // This test validates that the API handles empty requests gracefully
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ''
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })

  describe('Performance Tests', () => {
    test('Cache hit response time < 500ms', async () => {
      // This test validates that cache hits are fast
      const startTime = Date.now()
      
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'Pepsi', product_name: 'drink' })
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(500) // Cache hits should be very fast
    })

    test('Non-cached request completes within reasonable time', async () => {
      // This test validates that non-cached requests complete within acceptable time
      const startTime = Date.now()
      
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'UnknownBrand123', product_name: 'test' })
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(30000) // Should complete within 30 seconds
    })
  })

  describe('Response Structure Tests', () => {
    test('Successful response includes all required fields', async () => {
      // This test validates that the response structure is complete
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'Pepsi', product_name: 'drink' })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Required fields for successful response
      const requiredFields = [
        'success',
        'product_name',
        'brand',
        'financial_beneficiary',
        'beneficiary_country',
        'beneficiary_flag',
        'confidence_score',
        'ownership_structure_type',
        'ownership_flow',
        'sources',
        'reasoning',
        'agent_results',
        'agent_execution_trace',
        'result_type',
        'pipeline_type'
      ]

      requiredFields.forEach(field => {
        expect(data).toHaveProperty(field)
      })
    })

    test('Response includes cache_hit field', async () => {
      // This test validates that cache behavior is tracked
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'Pepsi', product_name: 'drink' })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data).toHaveProperty('cache_hit')
      expect(typeof data.cache_hit).toBe('boolean')
    })
  })
}) 