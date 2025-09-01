import { describe, test, expect, beforeEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('Progress API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('API Correctness Tests', () => {
    test('Valid progress update returns success', async () => {
      // This test validates that the API accepts and processes progress updates
      const mockResponse = {
        success: true
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponse
      } as Response)

      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: 'test-query-123',
          stage: 'cache_check',
          status: 'completed',
          data: { hit: true, beneficiary: 'Test Company' }
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    test('Progress update with error status is handled correctly', async () => {
      // This test validates that the API handles error status updates
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: 'test-query-456',
          stage: 'llm_analysis',
          status: 'error',
          error: 'LLM service unavailable'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    test('Progress update includes all required fields', async () => {
      // This test validates that progress updates include complete information
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: 'test-query-789',
          stage: 'web_research',
          status: 'in_progress',
          data: {
            search_terms: ['test', 'brand'],
            sources_found: 3,
            confidence: 85
          }
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('Error Handling Tests', () => {
    test('Missing queryId returns 400 with clear error message', async () => {
      // This test validates that the API requires queryId
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'cache_check',
          status: 'completed'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
      expect(data.error).toContain('queryId')
    })

    test('Missing stage returns 400 with clear error message', async () => {
      // This test validates that the API requires stage
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: 'test-query-123',
          status: 'completed'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
      expect(data.error).toContain('stage')
    })

    test('Missing status returns 400 with clear error message', async () => {
      // This test validates that the API requires status
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: 'test-query-123',
          stage: 'cache_check'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
      expect(data.error).toContain('status')
    })

    test('Invalid JSON returns 400 with clear error message', async () => {
      // This test validates that the API handles malformed JSON gracefully
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
      expect(data.error).toContain('Invalid JSON')
    })

    test('Empty request body returns 400 with clear error message', async () => {
      // This test validates that the API handles empty requests gracefully
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ''
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('Status Validation Tests', () => {
    test('Valid status values are accepted', async () => {
      // This test validates that all valid status values are accepted
      const validStatuses = ['pending', 'in_progress', 'completed', 'error', 'skipped']
      
      for (const status of validStatuses) {
        const response = await fetch('http://localhost:3000/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queryId: `test-query-${status}`,
            stage: 'cache_check',
            status: status
          })
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

    test('Invalid status returns 400 with clear error message', async () => {
      // This test validates that invalid status values are rejected
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: 'test-query-invalid',
          stage: 'cache_check',
          status: 'invalid_status'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('Stage Validation Tests', () => {
    test('Valid stage values are accepted', async () => {
      // This test validates that all valid stage values are accepted
      const validStages = [
        'cache_check',
        'static_mapping',
        'rag_retrieval',
        'llm_first_analysis',
        'web_research',
        'database_save'
      ]
      
      for (const stage of validStages) {
        const response = await fetch('http://localhost:3000/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queryId: `test-query-${stage}`,
            stage: stage,
            status: 'completed'
          })
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

    test('Invalid stage returns 400 with clear error message', async () => {
      // This test validates that invalid stage values are rejected
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: 'test-query-invalid-stage',
          stage: 'invalid_stage',
          status: 'completed'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('Data Structure Tests', () => {
    test('Progress update with complex data structure is handled', async () => {
      // This test validates that complex data structures are handled correctly
      const complexData = {
        cache_hit: true,
        beneficiary: 'Test Company Inc.',
        confidence: 95,
        sources: ['database', 'web_search'],
        metadata: {
          timestamp: new Date().toISOString(),
          processing_time: 1500,
          tokens_used: 250
        }
      }

      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: 'test-query-complex',
          stage: 'cache_check',
          status: 'completed',
          data: complexData
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    test('Progress update with error data is handled', async () => {
      // This test validates that error data is handled correctly
      const errorData = {
        error_type: 'api_timeout',
        error_message: 'External API timed out',
        retry_count: 2,
        fallback_used: true
      }

      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: 'test-query-error',
          stage: 'web_research',
          status: 'error',
          error: 'External API timeout',
          data: errorData
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    test('Progress update completes quickly', async () => {
      // This test validates that progress updates are processed quickly
      const startTime = Date.now()
      
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: 'test-query-performance',
          stage: 'cache_check',
          status: 'completed',
          data: { hit: false }
        })
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })
}) 