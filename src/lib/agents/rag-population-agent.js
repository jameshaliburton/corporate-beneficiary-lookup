/**
 * RAG Population Agent (ownership-por-v1.1)
 * Populates ownership_knowledge_base table with successful ownership results
 */

import { supabase } from '../supabase.ts'

export class RAGPopulationAgent {
  constructor() {
    this.tableName = 'ownership_knowledge_base';
  }

  /**
   * Populate RAG knowledge base with successful ownership result
   * @param {Object} ownershipResult - The ownership result to store
   * @param {string} brand - Brand name
   * @param {string} product_name - Product name (optional)
   * @param {string} barcode - Barcode (optional)
   * @returns {Promise<Object>} Population result
   */
  async populateKnowledgeBase(ownershipResult, brand, product_name = null, barcode = null) {
    console.log('[RAG_POPULATION] Starting RAG population (ownership-por-v1.1):', {
      brand,
      product_name,
      barcode,
      hasBeneficiary: !!ownershipResult.financial_beneficiary,
      beneficiary: ownershipResult.financial_beneficiary,
      confidence: ownershipResult.confidence_score
    });

    // [RAG_POPULATION] Skip if no financial beneficiary
    if (!ownershipResult.financial_beneficiary) {
      console.log('[RAG_POPULATION] Skipping - no financial beneficiary');
      return { success: false, reason: 'no_beneficiary' };
    }

    // [RAG_POPULATION] Skip if confidence < 30
    if (ownershipResult.confidence_score < 30) {
      console.log('[RAG_POPULATION] Skipping - low confidence:', ownershipResult.confidence_score);
      return { success: false, reason: 'low_confidence' };
    }

    // [RAG_POPULATION] Skip if beneficiary is Unknown
    if (ownershipResult.financial_beneficiary === 'Unknown') {
      console.log('[RAG_POPULATION] Skipping - unknown beneficiary');
      return { success: false, reason: 'unknown_beneficiary' };
    }

    try {
      // [RAG_POPULATION] Check for existing entry to prevent duplicates
      const { data: existingEntry, error: checkError } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('brand', brand.toLowerCase().trim())
        .eq('financial_beneficiary', ownershipResult.financial_beneficiary)
        .limit(1);

      if (checkError) {
        console.error('[RAG_POPULATION] Error checking existing entry:', checkError);
        return { success: false, reason: 'check_error', error: checkError };
      }

      // [RAG_POPULATION] Skip if duplicate exists
      if (existingEntry && existingEntry.length > 0) {
        console.log('[RAG_POPULATION] Skipping - duplicate entry exists:', {
          brand,
          beneficiary: ownershipResult.financial_beneficiary,
          existingId: existingEntry[0].id
        });
        return { success: false, reason: 'duplicate_exists' };
      }

      // [RAG_POPULATION] Prepare knowledge base entry
      const knowledgeEntry = {
        brand: brand.toLowerCase().trim(),
        product_name: product_name?.toLowerCase().trim() || null,
        barcode: barcode || null,
        financial_beneficiary: ownershipResult.financial_beneficiary,
        beneficiary_country: ownershipResult.beneficiary_country || 'Unknown',
        ownership_structure_type: ownershipResult.ownership_structure_type || 'Unknown',
        ownership_flow: ownershipResult.ownership_flow || [],
        confidence_score: ownershipResult.confidence_score || 0,
        reasoning: ownershipResult.reasoning || 'RAG population from successful ownership result',
        sources: ownershipResult.sources || [],
        tags: this.generateTags(ownershipResult, brand),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[RAG_POPULATION] Inserting knowledge base entry:', {
        brand: knowledgeEntry.brand,
        beneficiary: knowledgeEntry.financial_beneficiary,
        confidence: knowledgeEntry.confidence_score,
        sourcesCount: knowledgeEntry.sources.length,
        tagsCount: knowledgeEntry.tags.length
      });

      // [RAG_POPULATION] Insert into knowledge base
      const { data: insertedEntry, error: insertError } = await supabase
        .from(this.tableName)
        .insert(knowledgeEntry)
        .select('id')
        .single();

      if (insertError) {
        console.error('[RAG_POPULATION] Error inserting knowledge base entry:', insertError);
        return { success: false, reason: 'insert_error', error: insertError };
      }

      console.log('[RAG_POPULATION] Successfully populated knowledge base:', {
        id: insertedEntry.id,
        brand: knowledgeEntry.brand,
        beneficiary: knowledgeEntry.financial_beneficiary,
        confidence: knowledgeEntry.confidence_score
      });

      return { 
        success: true, 
        id: insertedEntry.id,
        brand: knowledgeEntry.brand,
        beneficiary: knowledgeEntry.financial_beneficiary,
        confidence: knowledgeEntry.confidence_score
      };

    } catch (error) {
      console.error('[RAG_POPULATION] Unexpected error:', error);
      return { success: false, reason: 'unexpected_error', error: error.message };
    }
  }

  /**
   * Generate tags for the knowledge base entry
   * @param {Object} ownershipResult - The ownership result
   * @param {string} brand - Brand name
   * @returns {Array<string>} Array of tags
   */
  generateTags(ownershipResult, brand) {
    const tags = [];

    // Add confidence-based tags
    if (ownershipResult.confidence_score >= 90) {
      tags.push('high_confidence');
    } else if (ownershipResult.confidence_score >= 70) {
      tags.push('medium_confidence');
    } else {
      tags.push('low_confidence');
    }

    // Add structure type tags
    if (ownershipResult.ownership_structure_type) {
      tags.push(ownershipResult.ownership_structure_type.toLowerCase().replace(/\s+/g, '_'));
    }

    // Add country tags
    if (ownershipResult.beneficiary_country) {
      tags.push(`country_${ownershipResult.beneficiary_country.toLowerCase().replace(/\s+/g, '_')}`);
    }

    // Add source method tags
    if (ownershipResult.result_type) {
      tags.push(`method_${ownershipResult.result_type.toLowerCase().replace(/\s+/g, '_')}`);
    }

    // Add verification tags
    if (ownershipResult.verification_status) {
      tags.push(`verified_${ownershipResult.verification_status.toLowerCase().replace(/\s+/g, '_')}`);
    }

    // Add brand-specific tags
    if (brand) {
      tags.push(`brand_${brand.toLowerCase().replace(/\s+/g, '_')}`);
    }

    return tags;
  }

  /**
   * Batch populate multiple ownership results
   * @param {Array<Object>} results - Array of ownership results with metadata
   * @returns {Promise<Object>} Batch population result
   */
  async batchPopulateKnowledgeBase(results) {
    console.log('[RAG_POPULATION] Starting batch population (ownership-por-v1.1):', {
      resultsCount: results.length
    });

    const results_summary = {
      total: results.length,
      successful: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (const result of results) {
      try {
        const populationResult = await this.populateKnowledgeBase(
          result.ownershipResult,
          result.brand,
          result.product_name,
          result.barcode
        );

        if (populationResult.success) {
          results_summary.successful++;
        } else {
          results_summary.skipped++;
          results_summary.errors.push({
            brand: result.brand,
            reason: populationResult.reason
          });
        }
      } catch (error) {
        results_summary.failed++;
        results_summary.errors.push({
          brand: result.brand,
          reason: 'unexpected_error',
          error: error.message
        });
      }
    }

    console.log('[RAG_POPULATION] Batch population completed:', results_summary);
    return results_summary;
  }
}

// Export singleton instance
export const ragPopulationAgent = new RAGPopulationAgent();
