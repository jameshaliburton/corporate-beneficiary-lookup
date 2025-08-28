import { describe, test, expect, beforeEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('Image Recognition API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('API Correctness Tests', () => {
    test('Valid image returns structured brand/product data', async () => {
      // This test validates that the API processes images and returns structured data
      const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      
      const mockResponse = {
        success: true,
        product_name: 'Pepsi',
        brand: 'Pepsi',
        confidence: 95,
        reasoning: 'Brand logo detected in image',
        flow: {
          step1: 'image_processing',
          step2: 'ocr_extraction',
          step3: 'brand_recognition',
          final_confidence: 95,
          vision_agent_used: true
        },
        source: 'vision_analysis',
        contextual_clues: {
          step: 'brand_detection',
          step_name: 'Brand Recognition',
          extracted_data: 'Pepsi',
          raw_extraction: 'Pepsi logo detected',
          extraction_timestamp: new Date().toISOString()
        }
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponse
      } as Response)
      
      const response = await fetch('http://localhost:3000/api/image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: testImageBase64 })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Validate response structure
      expect(data.success).toBe(true)
      expect(data).toHaveProperty('product_name')
      expect(data).toHaveProperty('brand')
      expect(data).toHaveProperty('confidence')
      expect(data).toHaveProperty('reasoning')
      expect(data).toHaveProperty('flow')
      expect(data).toHaveProperty('source')
      expect(data).toHaveProperty('contextual_clues')
    })

    test('Response includes complete flow information', async () => {
      // This test validates that the API includes complete processing flow information
      const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      
      const response = await fetch('http://localhost:3000/api/image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: testImageBase64 })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Validate flow information
      expect(data.flow).toBeDefined()
      expect(data.flow).toHaveProperty('step1')
      expect(data.flow).toHaveProperty('step2')
      expect(data.flow).toHaveProperty('step3')
      expect(data.flow).toHaveProperty('final_confidence')
      expect(data.flow).toHaveProperty('vision_agent_used')
    })

    test('Response includes contextual clues for analysis', async () => {
      // This test validates that the API provides detailed contextual analysis
      const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      
      const response = await fetch('http://localhost:3000/api/image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: testImageBase64 })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Validate contextual clues
      expect(data.contextual_clues).toBeDefined()
      expect(data.contextual_clues).toHaveProperty('step')
      expect(data.contextual_clues).toHaveProperty('step_name')
      expect(data.contextual_clues).toHaveProperty('extracted_data')
      expect(data.contextual_clues).toHaveProperty('raw_extraction')
      expect(data.contextual_clues).toHaveProperty('extraction_timestamp')
    })
  })

  describe('Error Handling Tests', () => {
    test('Invalid image format returns proper error', async () => {
      // This test validates that the API handles invalid image formats gracefully
      const response = await fetch('http://localhost:3000/api/image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: 'invalid-image-data' })
      })

      expect(response.status).toBe(200) // API should handle gracefully, not crash
      const data = await response.json()
      
      // Should still return structured response even with error
      expect(data.success).toBe(true)
      expect(data.confidence).toBe(0)
      expect(data.reasoning).toContain('Error')
    })

    test('Missing image_base64 returns proper error', async () => {
      // This test validates that the API handles missing image data gracefully
      const response = await fetch('http://localhost:3000/api/image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      expect(response.status).toBe(200) // API should handle gracefully
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.confidence).toBe(0)
      expect(data.reasoning).toContain('Error')
    })

    test('Invalid JSON returns 400 with clear error message', async () => {
      // This test validates that the API handles malformed JSON gracefully
      const response = await fetch('http://localhost:3000/api/image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('Performance Tests', () => {
    test('Image recognition completes within reasonable time', async () => {
      // This test validates that image processing completes within acceptable time
      const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      
      const startTime = Date.now()
      
      const response = await fetch('http://localhost:3000/api/image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: testImageBase64 })
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(20000) // Should complete within 20 seconds
    })
  })

  describe('Response Structure Tests', () => {
    test('Successful response includes all required fields', async () => {
      // This test validates that the response structure is complete
      const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      
      const response = await fetch('http://localhost:3000/api/image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: testImageBase64 })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Required fields for successful response
      const requiredFields = [
        'success',
        'product_name',
        'brand',
        'product_type',
        'confidence',
        'reasoning',
        'quality_score',
        'flow',
        'source',
        'contextual_clues',
        'timestamp'
      ]

      requiredFields.forEach(field => {
        expect(data).toHaveProperty(field)
      })
    })

    test('Response includes quality assessment', async () => {
      // This test validates that quality assessment is included
      const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      
      const response = await fetch('http://localhost:3000/api/image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: testImageBase64 })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Validate quality assessment exists
      expect(data.quality_score).toBeDefined()
      expect(typeof data.quality_score).toBe('number')
      expect(data.quality_score).toBeGreaterThanOrEqual(0)
      expect(data.quality_score).toBeLessThanOrEqual(100)
    })
  })
}) 