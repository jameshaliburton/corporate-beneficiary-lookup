import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enhancedLookupProduct } from '@/lib/apis/enhanced-barcode-lookup.js';
import { getOwnershipKnowledge } from '@/lib/agents/knowledge-agent.js';
import { EnhancedAgentOwnershipResearch } from '@/lib/agents/enhanced-ownership-research-agent.js';
import { generateQueryId } from '@/lib/agents/ownership-research-agent.js';
import { emitProgress } from '@/lib/utils';

// Helper function to check if product data is meaningful
function isProductDataMeaningful(productData: any): boolean {
  // Check if we have a meaningful brand name
  const hasMeaningfulBrand = productData.brand && 
    !productData.brand.toLowerCase().includes('unknown') &&
    !productData.brand.toLowerCase().includes('generic') &&
    !productData.brand.toLowerCase().includes('brand') &&
    productData.brand.trim().length > 0;
  
  // Check if we have a meaningful product name
  const hasMeaningfulProduct = productData.product_name &&
    !productData.product_name.toLowerCase().includes('product with') &&
    !productData.product_name.toLowerCase().includes('unknown') &&
    !productData.product_name.toLowerCase().includes('generic') &&
    productData.product_name.trim().length > 0;
  
  return hasMeaningfulBrand || hasMeaningfulProduct;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode, product_name, brand, hints = {}, evaluation_mode = false } = body;

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
    }

    // Generate a unique query ID for progress tracking
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Emit initial progress
    await emitProgress(queryId, 'start', 'started', { barcode, brand });

    try {
      // Step 1: Enhanced barcode lookup with comprehensive fallback pipeline
      await emitProgress(queryId, 'barcode_lookup', 'started', { barcode });
      
      // Prepare user data if provided
      const userData = (product_name || brand) ? {
        product_name,
        brand,
        region_hint: hints.country_of_origin
      } : null;
      
      const barcodeData = await enhancedLookupProduct(barcode, userData);
      await emitProgress(queryId, 'barcode_lookup', 'completed', barcodeData);

      // If we already have ownership data from the enhanced lookup, return it
      if (barcodeData.financial_beneficiary) {
        console.log('✅ Ownership data found in enhanced lookup, skipping agent research');
        await emitProgress(queryId, 'ownership_research', 'completed', { reason: 'Already found in lookup' });
        await emitProgress(queryId, 'complete', 'completed', { success: true });

        return NextResponse.json({
          ...barcodeData,
          query_id: queryId
        });
      }

      // Check if we have meaningful product data
      const finalProductName = product_name || barcodeData.product_name;
      const finalBrand = brand || barcodeData.brand;
      
      const productInfo = {
        product_name: finalProductName,
        brand: finalBrand,
        barcode: barcode
      };
      
      if (!isProductDataMeaningful(productInfo)) {
        console.log('⚠️ Insufficient product data, requesting manual entry');
        await emitProgress(queryId, 'manual_entry_required', 'started', { 
          reason: 'Insufficient product information',
          barcode_data: barcodeData 
        });
        await emitProgress(queryId, 'complete', 'completed', { success: false, requires_manual_entry: true });
        
        return NextResponse.json({
          success: false,
          requires_manual_entry: true,
          reason: 'Insufficient product information from barcode lookup',
          barcode_data: barcodeData,
          query_id: queryId,
          message: 'Please provide product name and brand manually'
        });
      }

      // Step 2: Enhanced Ownership research (only if no ownership data found and we have meaningful product data)
      await emitProgress(queryId, 'ownership_research', 'started', { brand: finalBrand, product_name: finalProductName });
      
      // Enable evaluation logging if requested
      if (evaluation_mode) {
        process.env.ENABLE_EVALUATION_LOGGING = 'true';
      }
      
      const ownershipResult = await EnhancedAgentOwnershipResearch({
        barcode,
        product_name: finalProductName,
        brand: finalBrand,
        hints,
        enableEvaluation: evaluation_mode
      });
      
      // Reset evaluation logging
      if (evaluation_mode) {
        process.env.ENABLE_EVALUATION_LOGGING = 'false';
      }
      
      await emitProgress(queryId, 'ownership_research', 'completed', ownershipResult);

      // Step 3: Final result
      await emitProgress(queryId, 'complete', 'completed', { success: true });

      // Merge barcode data and ownership result into a flat structure
      const mergedResult = {
        success: true,
        product_name: finalProductName,
        brand: finalBrand,
        barcode: barcode,
        financial_beneficiary: ownershipResult.financial_beneficiary,
        beneficiary_country: ownershipResult.beneficiary_country,
        beneficiary_flag: ownershipResult.beneficiary_flag,
        confidence_score: ownershipResult.confidence_score,
        confidence_level: ownershipResult.confidence_level,
        confidence_factors: ownershipResult.confidence_factors,
        confidence_breakdown: ownershipResult.confidence_breakdown,
        confidence_reasoning: ownershipResult.confidence_reasoning,
        ownership_structure_type: ownershipResult.ownership_structure_type,
        ownership_flow: ownershipResult.ownership_flow,
        sources: ownershipResult.sources,
        reasoning: ownershipResult.reasoning,
        result_type: ownershipResult.result_type,
        user_contributed: !!(product_name || brand),
        agent_execution_trace: ownershipResult.agent_execution_trace,
        lookup_trace: barcodeData.lookup_trace, // Include enhanced lookup trace
        query_id: queryId
      };

      return NextResponse.json(mergedResult);

    } catch (error) {
      console.error('Error in ownership research:', error);
      await emitProgress(queryId, 'error', 'error', { error: error.message });
      
      return NextResponse.json({
        success: false,
        query_id: queryId,
        error: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json({
      success: false,
      error: 'Invalid request format'
    }, { status: 400 });
  }
}

// Helper function to get country flag emoji
function getCountryFlag(country: string | null): string | null {
  if (!country) return null;
  
  const flagMap: { [key: string]: string } = {
    'Sweden': '🇸🇪',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Netherlands': '🇳🇱',
    'Switzerland': '🇨🇭',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Denmark': '🇩🇰',
    'Norway': '🇳🇴',
    'Finland': '🇫🇮',
  };
  
  return flagMap[country] || '🏳️';
}

// Helper function to get verification status
function getVerificationStatus(confidenceScore: number | null): string | null {
  if (!confidenceScore) return null;
  
  if (confidenceScore >= 80) return 'Verified';
  if (confidenceScore >= 60) return 'Likely';
  if (confidenceScore >= 40) return 'Possible';
  return 'Uncertain';
} 