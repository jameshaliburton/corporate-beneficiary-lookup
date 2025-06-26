import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enhancedLookupProduct } from '@/lib/apis/enhanced-barcode-lookup.js';
import { getOwnershipKnowledge } from '@/lib/agents/knowledge-agent.js';
import { EnhancedAgentOwnershipResearch } from '@/lib/agents/enhanced-ownership-research-agent.js';
import { generateQueryId } from '@/lib/agents/ownership-research-agent.js';
import { QualityAssessmentAgent } from '@/lib/agents/quality-assessment-agent.js';
import { emitProgress } from '@/lib/utils';

// Initialize the Quality Assessment Agent
const qualityAgent = new QualityAssessmentAgent();

// Helper function to check if product data is meaningful
function isProductDataMeaningful(productData: any): boolean {
  // Pattern-based detection of generic/incomplete data
  
  // 1. Brand quality check - look for patterns that indicate unknown/missing brands
  const brandPatterns = [
    /^unknown\s*brand/i,
    /^n\/a$/i,
    /^not\s*specified/i,
    /^unspecified/i,
    /^generic\s*brand/i,
    /^private\s*label/i,
    /^store\s*brand/i,
    /^house\s*brand/i,
    /^no\s*brand/i,
    /^unbranded/i
  ];
  
  const hasMeaningfulBrand = productData.brand && 
    productData.brand.trim().length > 2 &&
    !brandPatterns.some(pattern => pattern.test(productData.brand));

  // 2. Product name quality check - look for patterns that indicate generic product descriptions
  const productPatterns = [
    /^product\s+with\s+\d+/i,  // "Product with 1234567890"
    /^item\s+with\s+\d+/i,     // "Item with 1234567890"
    /^product\s+of\s+\d+/i,    // "Product of 1234567890"
    /^item\s+of\s+\d+/i,       // "Item of 1234567890"
    /^product\s+\d+/i,         // "Product 1234567890"
    /^item\s+\d+/i,            // "Item 1234567890"
    /^unknown\s*product/i,
    /^generic\s*product/i,
    /^no\s*name/i,
    /^unspecified/i
  ];
  
  const hasMeaningfulProduct = productData.product_name &&
    productData.product_name.trim().length > 3 &&
    !productPatterns.some(pattern => pattern.test(productData.product_name)) &&
    // Don't include the barcode number in the product name
    !productData.product_name.toLowerCase().includes(productData.barcode || '');

  // 3. Confidence check (if available)
  const hasGoodConfidence = !productData.confidence || productData.confidence >= 60;

  // 4. Data completeness bonus - additional fields indicate better quality
  const hasAdditionalData = productData.category || 
    productData.ingredients || 
    productData.weight || 
    productData.country || 
    productData.manufacturer ||
    productData.packaging ||
    productData.allergens;

  // 5. Source quality check (if available)
  const hasQualitySources = !productData.sources || 
    productData.sources.length > 0;

  // Quality assessment: we need both meaningful brand AND product name
  const hasQualityData = hasMeaningfulBrand && hasMeaningfulProduct && hasGoodConfidence;

  // Log detailed assessment for debugging
  console.log('🔍 Data quality assessment:', {
    brand: productData.brand,
    product_name: productData.product_name,
    hasMeaningfulBrand,
    hasMeaningfulProduct,
    hasGoodConfidence,
    hasAdditionalData,
    hasQualitySources,
    hasQualityData,
    confidence: productData.confidence,
    sources_count: productData.sources?.length || 0,
    barcode: productData.barcode
  });

  return hasQualityData;
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

      // Check if we have meaningful product data before proceeding to agentic search
      if (!userData && barcodeData) {
        console.log('🔍 Running Quality Assessment Agent...');
        
        const qualityAssessment = await qualityAgent.assessProductDataQuality(barcodeData);
        
        console.log('📊 Quality Assessment Result:', {
          is_meaningful: qualityAssessment.is_meaningful,
          confidence: qualityAssessment.confidence,
          quality_score: qualityAssessment.quality_score,
          reasoning: qualityAssessment.reasoning,
          issues: qualityAssessment.issues
        });
        
        if (!qualityAssessment.is_meaningful) {
          console.log('❌ Product data insufficient for agentic search:', qualityAssessment.reasoning);
          
          return NextResponse.json({
            success: false,
            requires_manual_entry: true,
            reason: 'insufficient_product_data',
            barcode_data: barcodeData,
            quality_assessment: qualityAssessment,
            message: 'Product information is incomplete. Please provide brand and product name manually.'
          });
        }
        
        console.log('✅ Product data quality assessment passed - proceeding to agentic search');
      }

      // Step 2: Enhanced Ownership research (only if no ownership data found and we have meaningful product data)
      await emitProgress(queryId, 'ownership_research', 'started', { brand: barcodeData.brand, product_name: barcodeData.product_name });
      
      // Enable evaluation logging if requested
      if (evaluation_mode) {
        process.env.ENABLE_EVALUATION_LOGGING = 'true';
      }
      
      const ownershipResult = await EnhancedAgentOwnershipResearch({
        barcode,
        product_name: barcodeData.product_name,
        brand: barcodeData.brand,
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
        product_name: barcodeData.product_name,
        brand: barcodeData.brand,
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