import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enhancedLookupProduct } from '@/lib/apis/enhanced-barcode-lookup.js';
import { getOwnershipKnowledge } from '@/lib/agents/knowledge-agent.js';
import { EnhancedAgentOwnershipResearch } from '@/lib/agents/enhanced-ownership-research-agent.js';
import { generateQueryId } from '@/lib/agents/ownership-research-agent.js';
import { QualityAssessmentAgent } from '@/lib/agents/quality-assessment-agent.js';
import VisionAgent from '@/lib/agents/vision-agent.js';
import { emitProgress } from '@/lib/utils';

// Initialize the Quality Assessment Agent
const qualityAgent = new QualityAssessmentAgent();

// Initialize the Vision Agent
const visionAgent = new VisionAgent();

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
    const { barcode, product_name, brand, hints = {}, evaluation_mode = false, image_base64 = null } = body;

    // Validate that we have at least some input to work with
    if (!barcode && !product_name && !brand && !image_base64) {
      return NextResponse.json({ 
        error: 'At least one of the following is required: barcode, product_name, brand, or image_base64' 
      }, { status: 400 });
    }

    // Generate a unique query ID for progress tracking
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Emit initial progress
    await emitProgress(queryId, 'start', 'started', { barcode, brand, product_name, has_image: !!image_base64 });

    try {
      let currentBarcodeData = null;
      
      // Check if this is a synthetic barcode from image capture
      const isSyntheticBarcode = barcode && barcode.startsWith('img_');
      
      // Step 1: If we have a real barcode (not synthetic), try enhanced barcode lookup first
      if (barcode && !isSyntheticBarcode) {
        await emitProgress(queryId, 'barcode_lookup', 'started', { barcode });
        
        // Prepare user data if provided
        const userData = (product_name || brand) ? {
          product_name,
          brand,
          region_hint: hints.country_of_origin
        } : null;
        
        const barcodeData = await enhancedLookupProduct(barcode, userData);
        await emitProgress(queryId, 'barcode_lookup', 'completed', barcodeData);

        currentBarcodeData = { ...barcodeData };

        // Check if enhanced lookup requires manual entry (poor quality data)
        if (barcodeData.requires_manual_entry) {
          console.log('❌ Enhanced lookup requires manual entry due to poor quality data');
          await emitProgress(queryId, 'complete', 'completed', { success: false, reason: 'requires_manual_entry' });
          
          return NextResponse.json({
            success: false,
            requires_manual_entry: true,
            reason: barcodeData.result_type || 'poor_quality_manual_entry',
            barcode_data: {
              product_name: barcodeData.product_name,
              brand: barcodeData.brand,
              barcode: barcodeData.barcode
            },
            quality_assessment: barcodeData.quality_assessment,
            lookup_trace: barcodeData.lookup_trace,
            message: 'Product information is incomplete or of poor quality. Please provide details manually or use camera capture.',
            query_id: queryId
          });
        }

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
      } else if (isSyntheticBarcode) {
        // Synthetic barcode from image capture - use provided manual data
        console.log('🔍 Synthetic barcode from image capture, using provided data for vision analysis');
        
        if (product_name || brand) {
          console.log('📝 Using image-extracted manual data:', { product_name, brand });
          currentBarcodeData = {
            product_name: product_name || null,
            brand: brand || null,
            barcode: barcode, // Keep the synthetic barcode for tracking
            result_type: 'image_extracted',
            lookup_trace: ['image_extracted'],
            confidence: 70, // Image-extracted data has medium confidence
            sources: ['image_analysis']
          };
          
          await emitProgress(queryId, 'image_extraction', 'completed', currentBarcodeData);
        } else {
          // Only synthetic barcode provided - we'll handle this in the vision analysis section below
          currentBarcodeData = {
            product_name: null,
            brand: null,
            barcode: barcode,
            result_type: 'image_only',
            lookup_trace: ['image_input'],
            confidence: 0,
            sources: ['image_input']
          };
          
          await emitProgress(queryId, 'image_input', 'completed', { message: 'Image provided with synthetic barcode, attempting analysis' });
        }
      } else {
        // No barcode provided - start with manual/user provided data
        console.log('🔍 No barcode provided, starting with manual entry or image analysis');
        
        if (product_name || brand) {
          console.log('📝 Using manual entry data:', { product_name, brand });
          currentBarcodeData = {
            product_name: product_name || null,
            brand: brand || null,
            barcode: null,
            result_type: 'manual_entry',
            lookup_trace: ['manual_entry'],
            confidence: 85, // Manual entry assumed to be high quality
            sources: ['user_input']
          };
          
          await emitProgress(queryId, 'manual_entry', 'completed', currentBarcodeData);
        } else {
          // Only image provided - we'll handle this in the vision analysis section below
          currentBarcodeData = {
            product_name: null,
            brand: null,
            barcode: null,
            result_type: 'image_only',
            lookup_trace: ['image_input'],
            confidence: 0,
            sources: ['image_input']
          };
          
          await emitProgress(queryId, 'image_input', 'completed', { message: 'Image provided, attempting analysis' });
        }
      }

      // Step 2: Quality assessment and vision analysis if needed
      let needsVisionAnalysis = false;
      let qualityAssessment = null;

      if (currentBarcodeData && (currentBarcodeData.product_name || currentBarcodeData.brand)) {
        console.log('🔍 Running Quality Assessment Agent...');
        
        qualityAssessment = await qualityAgent.assessProductDataQuality(currentBarcodeData);
        
        console.log('📊 Quality Assessment Result:', {
          is_meaningful: qualityAssessment.is_meaningful,
          confidence: qualityAssessment.confidence,
          quality_score: qualityAssessment.quality_score,
          reasoning: qualityAssessment.reasoning,
          issues: qualityAssessment.issues
        });
        
        if (!qualityAssessment.is_meaningful && image_base64) {
          needsVisionAnalysis = true;
        } else if (!qualityAssessment.is_meaningful) {
          console.log('❌ Product data insufficient for agentic search and no image available');
          return NextResponse.json({
            success: false,
            requires_manual_entry: true,
            reason: 'insufficient_data_no_image',
            barcode_data: currentBarcodeData,
            quality_assessment: qualityAssessment,
            result_type: mapToExternalResultType(currentBarcodeData?.result_type || 'manual_entry', 'insufficient_data'),
            message: 'Product information is insufficient for ownership research. Please provide more details manually.',
            query_id: queryId
          });
        }
      } else if (image_base64) {
        // No meaningful product data but we have an image
        needsVisionAnalysis = true;
      } else {
        // No meaningful data and no image
        return NextResponse.json({
          success: false,
          requires_manual_entry: true,
          reason: 'no_meaningful_data',
          barcode_data: currentBarcodeData,
          result_type: mapToExternalResultType(currentBarcodeData?.result_type || 'manual_entry', 'insufficient_data'),
          message: 'No meaningful product information provided. Please enter brand and product name manually.',
          query_id: queryId
        });
      }

      // Step 3: Vision analysis if needed
      if (needsVisionAnalysis && image_base64) {
        console.log('🔍 Attempting vision agent analysis...');
        await emitProgress(queryId, 'vision_analysis', 'started', { 
          reason: qualityAssessment ? 'Quality assessment failed, trying vision analysis' : 'No product data, analyzing image'
        });
        
        try {
          const visionResult = await visionAgent.analyzeImage(image_base64, {
            barcode,
            partialData: currentBarcodeData,
            test_mode: body.test_mode || false,
            simulateVisionFailure: body.simulateVisionFailure || false,
            simulateOCRFailure: body.simulateOCRFailure || false
          }, body.test_mode || false);
          
          await emitProgress(queryId, 'vision_analysis', 'completed', visionResult);
          
          console.log('📊 Vision Analysis Result:', {
            success: visionResult.success,
            confidence: visionResult.confidence,
            extracted_data: visionResult.data,
            reasoning: visionResult.reasoning
          });
          
          // Check if vision results are sufficient
          if (visionResult.success && visionAgent.isVisionResultSufficient(visionResult)) {
            console.log('✅ Vision analysis provided sufficient data, proceeding to ownership research');
            
            // Use vision data to enhance the product data
            let enhancedData = {
              ...currentBarcodeData,
              product_name: visionResult.data.product_name || currentBarcodeData?.product_name,
              brand: visionResult.data.brand || currentBarcodeData?.brand,
              result_type: 'vision_enhanced',
              lookup_trace: [...(currentBarcodeData?.lookup_trace || []), 'vision_analysis'],
              // Add company and country_of_origin if they don't exist in the original data
              ...(visionResult.data.company && { company: visionResult.data.company }),
              ...(visionResult.data.country_of_origin && { country_of_origin: visionResult.data.country_of_origin })
            };
            
            // Re-run quality assessment with enhanced data
            const enhancedQualityAssessment = await qualityAgent.assessProductDataQuality(enhancedData);
            
            if (enhancedQualityAssessment.is_meaningful) {
              console.log('✅ Enhanced data passes quality assessment - proceeding to agentic search');
              currentBarcodeData = enhancedData;
              qualityAssessment = enhancedQualityAssessment;
            } else {
              console.log('❌ Even with vision data, quality is insufficient');
              return NextResponse.json({
                success: false,
                requires_manual_entry: true,
                reason: 'insufficient_data_after_vision',
                barcode_data: currentBarcodeData,
                quality_assessment: enhancedQualityAssessment,
                vision_result: visionResult,
                result_type: mapToExternalResultType(currentBarcodeData?.result_type || 'vision_enhanced', 'insufficient_data'),
                message: 'Product information is still incomplete even after image analysis. Please provide details manually.',
                query_id: queryId
              });
            }
          } else {
            console.log('❌ Vision analysis failed or provided insufficient data');
            return NextResponse.json({
              success: false,
              requires_manual_entry: true,
              reason: 'vision_analysis_failed',
              barcode_data: currentBarcodeData,
              quality_assessment: qualityAssessment,
              vision_result: visionResult,
              result_type: mapToExternalResultType(currentBarcodeData?.result_type || 'vision_enhanced', 'vision_failed'),
              message: 'Image analysis could not extract sufficient product information. Please provide details manually.',
              query_id: queryId
            });
          }
        } catch (visionError) {
          console.error('❌ Vision analysis error:', visionError);
          await emitProgress(queryId, 'vision_analysis', 'error', { error: visionError.message });
          
          return NextResponse.json({
            success: false,
            requires_manual_entry: true,
            reason: 'vision_analysis_error',
            barcode_data: currentBarcodeData,
            quality_assessment: qualityAssessment,
            vision_error: visionError.message,
            result_type: mapToExternalResultType(currentBarcodeData?.result_type || 'vision_enhanced', 'error'),
            message: 'Image analysis failed. Please provide details manually.',
            query_id: queryId
          });
        }
      }

      // If barcode lookup returns no data at all, trigger manual entry/camera fallback
      if (!currentBarcodeData || (!currentBarcodeData.product_name && !currentBarcodeData.brand)) {
        console.log('❌ No meaningful product data available. Triggering manual entry.');
        return NextResponse.json({
          success: false,
          requires_manual_entry: true,
          reason: 'no_product_data',
          barcode_data: currentBarcodeData,
          result_type: mapToExternalResultType(currentBarcodeData?.result_type || 'manual_entry', 'insufficient_data'),
          message: 'No meaningful product information found. Please provide details manually or use camera capture.'
        });
      }

      // Step 4: Enhanced Ownership research (only if no ownership data found and we have meaningful product data)
      await emitProgress(queryId, 'ownership_research', 'started', { brand: currentBarcodeData.brand, product_name: currentBarcodeData.product_name });
      
      // Enable evaluation logging if requested
      if (evaluation_mode) {
        process.env.ENABLE_EVALUATION_LOGGING = 'true';
      }
      
      const ownershipResult = await EnhancedAgentOwnershipResearch({
        barcode,
        product_name: currentBarcodeData.product_name,
        brand: currentBarcodeData.brand,
        hints,
        enableEvaluation: evaluation_mode
      });
      
      // Reset evaluation logging
      if (evaluation_mode) {
        process.env.ENABLE_EVALUATION_LOGGING = 'false';
      }
      
      await emitProgress(queryId, 'ownership_research', 'completed', ownershipResult);

      // Step 5: Final result
      await emitProgress(queryId, 'complete', 'completed', { success: true });

      // Merge barcode data and ownership result into a flat structure
      const mergedResult = {
        success: true,
        product_name: currentBarcodeData.product_name,
        brand: currentBarcodeData.brand,
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
        result_type: mapToExternalResultType(currentBarcodeData.result_type, ownershipResult.result_type),
        user_contributed: !!(product_name || brand),
        agent_execution_trace: ownershipResult.agent_execution_trace,
        lookup_trace: currentBarcodeData.lookup_trace, // Include enhanced lookup trace
        // Pass through contextual clues from image analysis if available
        contextual_clues: (currentBarcodeData as any).contextual_clues || null,
        query_id: queryId
      };

      return NextResponse.json(mergedResult);

    } catch (error) {
      console.error('Error in ownership research:', error);
      await emitProgress(queryId, 'error', 'error', { error: error.message });
      
      return NextResponse.json({
        success: false,
        query_id: queryId,
        result_type: 'error',
        error: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json({
      success: false,
      result_type: 'error',
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

function mapToExternalResultType(internalType: string, ownershipType: string): string {
  // Map internal result types to expected external types for tests
  if (internalType === 'manual_entry') {
    return 'user_input';
  }
  
  if (internalType === 'vision_enhanced' || internalType === 'image_only') {
    return 'ai_research';
  }
  
  if (ownershipType === 'static_mapping') {
    return 'ai_research';
  }
  
  if (ownershipType === 'llm_first_analysis') {
    return 'ai_research';
  }
  
  // Handle error and insufficient data cases
  if (ownershipType === 'insufficient_data' || ownershipType === 'vision_failed') {
    return 'ai_research'; // Even failed AI attempts are still ai_research type
  }
  
  if (ownershipType === 'error') {
    return 'error';
  }
  
  // Default fallback
  return 'ai_research';
} 