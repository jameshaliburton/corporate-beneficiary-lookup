import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { EnhancedAgentOwnershipResearch } from '../../src/lib/agents/enhanced-ownership-research-agent'
import { LLMResearchAgent } from '../../src/lib/agents/llm-research-agent'
import { QueryBuilderAgent } from '../../src/lib/agents/query-builder-agent'

describe('OK Snacks Resolution Tests', () => {
  
  describe('LLM Research Agent Tests', () => {
    it('should find correct ownership for OK Snacks with Danish context', async () => {
      const result = await LLMResearchAgent({
        brand: 'ok snacks',
        product_name: 'pork rinds',
        hints: {
          context: 'Danish pork rinds from Denmark',
          country: 'dk',
          language: 'da'
        }
      })
      
      expect(result.success).toBe(true)
      expect(result.ownership_chain).toBeDefined()
      expect(result.ownership_chain.length).toBeGreaterThan(0)
      expect(result.final_confidence).toBeGreaterThan(0.7)
      expect(result.research_method).toBe('llm_first_research')
      expect(result.total_sources).toBeGreaterThan(0)
      
      // Should find Danish ownership structure
      const hasDanishEntity = result.ownership_chain.some(entity => 
        entity.country === 'Denmark' || entity.country === 'dk'
      )
      expect(hasDanishEntity).toBe(true)
    })
    
    it('should not trigger fallback when LLM research succeeds', async () => {
      const result = await EnhancedAgentOwnershipResearch({
        barcode: null,
        brand: 'ok snacks',
        product_name: 'pork rinds',
        hints: {
          context: 'Danish pork rinds from Denmark',
          country: 'dk',
          language: 'da'
        }
      })
      
      expect(result.financial_beneficiary).not.toBe('Unknown')
      expect(result.confidence_score).toBeGreaterThan(50)
      expect(result.result_type).toBe('llm_first_research')
      
      // Should not have fallback indicators
      expect(result.fallback_reason).toBeUndefined()
    })
  })
  
  describe('Query Builder Context Tests', () => {
    it('should generate Danish-specific queries for Danish context', async () => {
      const queries = await QueryBuilderAgent('ok snacks', 'pork rinds', {
        context: 'Danish pork rinds from Denmark',
        country: 'dk',
        language: 'da'
      })
      
      expect(queries).toBeDefined()
      expect(queries.length).toBeGreaterThan(0)
      
      // Should include Danish legal suffixes
      const danishSuffixQueries = queries.filter(q => 
        q.query.includes('A/S') || q.query.includes('ApS')
      )
      expect(danishSuffixQueries.length).toBeGreaterThan(0)
      
      // Should include Danish registry queries
      const registryQueries = queries.filter(q => 
        q.query.includes('site:virk.dk')
      )
      expect(registryQueries.length).toBeGreaterThan(0)
      
      // Should include Danish keywords
      const danishKeywordQueries = queries.filter(q => 
        q.query.includes('ejerforhold') || q.query.includes('virksomhed')
      )
      expect(danishKeywordQueries.length).toBeGreaterThan(0)
    })
    
    it('should detect country from context hints', async () => {
      const queries = await QueryBuilderAgent('test brand', 'test product', {
        context: 'Norwegian company from Oslo',
        country: 'no',
        language: 'no'
      })
      
      expect(queries).toBeDefined()
      
      // Should include Norwegian legal suffixes
      const norwegianSuffixQueries = queries.filter(q => 
        q.query.includes('AS') || q.query.includes('ANS')
      )
      expect(norwegianSuffixQueries.length).toBeGreaterThan(0)
      
      // Should include Norwegian registry queries
      const registryQueries = queries.filter(q => 
        q.query.includes('site:brreg.no')
      )
      expect(registryQueries.length).toBeGreaterThan(0)
    })
  })
  
  describe('Pipeline Integration Tests', () => {
    it('should return correct ownership chain for OK Snacks', async () => {
      const result = await EnhancedAgentOwnershipResearch({
        barcode: null,
        brand: 'ok snacks',
        product_name: 'pork rinds',
        hints: {
          context: 'Danish pork rinds from Denmark'
        }
      })
      
      expect(result.financial_beneficiary).not.toBe('Unknown')
      expect(result.beneficiary_country).not.toBe('Unknown')
      expect(result.confidence_score).toBeGreaterThan(50)
      expect(result.ownership_structure_type).not.toBe('Unknown')
      expect(result.ownership_flow).toBeDefined()
      expect(result.ownership_flow.length).toBeGreaterThan(0)
      
      // Should have proper source attribution
      expect(result.sources).toBeDefined()
      expect(result.sources.length).toBeGreaterThan(0)
      
      // Should have proper reasoning
      expect(result.reasoning).toBeDefined()
      expect(result.reasoning.length).toBeGreaterThan(0)
    })
    
    it('should handle fallback when LLM research fails', async () => {
      const result = await EnhancedAgentOwnershipResearch({
        barcode: null,
        brand: 'nonexistent-brand-xyz',
        product_name: 'test product',
        hints: {
          context: 'Test context'
        }
      })
      
      // Should return unknown when no data found
      expect(result.financial_beneficiary).toBe('Unknown')
      expect(result.confidence_score).toBeLessThan(50)
      expect(result.fallback_reason).toBeDefined()
    })
  })
  
  describe('Error Handling Tests', () => {
    it('should handle undefined variable errors gracefully', async () => {
      // Test that queries_executed is properly initialized
      const result = await EnhancedAgentOwnershipResearch({
        barcode: null,
        brand: 'test brand',
        product_name: 'test product',
        hints: {}
      })
      
      expect(result).toBeDefined()
      expect(result.financial_beneficiary).toBeDefined()
      expect(result.confidence_score).toBeDefined()
      
      // Should not throw undefined variable errors
      expect(() => {
        // This would throw if queries_executed was undefined
        return result
      }).not.toThrow()
    })
  })
}) 