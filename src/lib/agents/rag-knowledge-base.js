/**
 * RAG (Retrieval-Augmented Generation) Knowledge Base for Corporate Ownership
 * Stores and retrieves ownership data from previous research for enhanced LLM reasoning
 */

import { supabase } from '../supabase.ts';

// RAG Knowledge Base Class
export class RAGKnowledgeBase {
  constructor() {
    this.tableName = 'knowledge_base';
  }

  /**
   * Store a new ownership research result in the knowledge base
   */
  async storeEntry(entry) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          brand: entry.brand.toLowerCase(),
          product_name: entry.product_name,
          barcode: entry.barcode,
          financial_beneficiary: entry.financial_beneficiary,
          beneficiary_country: entry.beneficiary_country,
          ownership_structure_type: entry.ownership_structure_type,
          ownership_flow: entry.ownership_flow,
          confidence_score: entry.confidence_score,
          reasoning: entry.reasoning,
          sources: entry.sources,
          tags: entry.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error storing knowledge base entry:', error);
      throw error;
    }
  }

  /**
   * Search for relevant ownership patterns using semantic similarity
   */
  async searchSimilar(brand, product_name, limit = 5) {
    try {
      // First, try exact brand match
      let { data: exactMatches, error: exactError } = await supabase
        .from(this.tableName)
        .select('*')
        .ilike('brand', `%${brand.toLowerCase()}%`)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (exactError) throw exactError;

      // If we have exact matches, return them
      if (exactMatches && exactMatches.length > 0) {
        return exactMatches.map(entry => ({
          ...entry,
          similarity_score: 1.0 // Exact match
        }));
      }

      // Otherwise, search for similar patterns based on ownership structure
      const { data: similarPatterns, error: patternError } = await supabase
        .from(this.tableName)
        .select('*')
        .not('confidence_score', 'lt', 70) // Only high-confidence results
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (patternError) throw patternError;

      // Calculate similarity scores based on ownership structure type and country
      const scoredResults = similarPatterns?.map(entry => ({
        ...entry,
        similarity_score: this.calculateSimilarityScore(brand, entry)
      })) || [];

      // Sort by similarity score and return top results
      return scoredResults
        .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
        .slice(0, limit);

    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  }

  /**
   * Calculate similarity score between current brand and knowledge base entry
   */
  calculateSimilarityScore(brand, entry) {
    let score = 0;
    
    // Brand similarity (simple string similarity)
    const brandSimilarity = this.stringSimilarity(brand.toLowerCase(), entry.brand.toLowerCase());
    score += brandSimilarity * 0.4;

    // Ownership structure type similarity
    if (entry.ownership_structure_type !== 'Unknown') {
      score += 0.3;
    }

    // Country similarity (if we have country hints)
    if (entry.beneficiary_country !== 'Unknown') {
      score += 0.2;
    }

    // Confidence score boost
    score += (entry.confidence_score / 100) * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Simple string similarity calculation
   */
  stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get ownership patterns for a specific ownership structure type
   */
  async getOwnershipPatterns(structureType, limit = 3) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('ownership_structure_type', structureType)
        .gte('confidence_score', 80)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting ownership patterns:', error);
      return [];
    }
  }

  /**
   * Update an existing knowledge base entry
   */
  async updateEntry(id, updates) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating knowledge base entry:', error);
      throw error;
    }
  }

  /**
   * Get statistics about the knowledge base
   */
  async getStats() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*');

      if (error) throw error;

      const entries = data || [];
      const total_entries = entries.length;
      const avg_confidence = entries.length > 0 
        ? entries.reduce((sum, entry) => sum + entry.confidence_score, 0) / entries.length 
        : 0;

      // Count structure types
      const structure_types = {};
      entries.forEach(entry => {
        const type = entry.ownership_structure_type || 'Unknown';
        structure_types[type] = (structure_types[type] || 0) + 1;
      });

      // Count top brands
      const brand_counts = {};
      entries.forEach(entry => {
        const brand = entry.brand;
        brand_counts[brand] = (brand_counts[brand] || 0) + 1;
      });

      const top_brands = Object.entries(brand_counts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        total_entries,
        avg_confidence,
        structure_types,
        top_brands
      };
    } catch (error) {
      console.error('Error getting knowledge base stats:', error);
      return {
        total_entries: 0,
        avg_confidence: 0,
        structure_types: {},
        top_brands: []
      };
    }
  }
}

// Export singleton instance
export const ragKnowledgeBase = new RAGKnowledgeBase(); 