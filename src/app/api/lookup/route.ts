import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enhancedLookupProduct } from '@/lib/apis/enhanced-barcode-lookup.js';
import { getOwnershipKnowledge } from '@/lib/agents/knowledge-agent.js';
import { EnhancedAgentOwnershipResearch } from '@/lib/agents/enhanced-ownership-research-agent.js';
import { generateQueryId } from '@/lib/agents/ownership-research-agent.js';
import { QualityAssessmentAgent } from '@/lib/agents/quality-assessment-agent.js';
import VisionAgent from '@/lib/agents/vision-agent.js';
import { analyzeProductImage } from '@/lib/apis/image-recognition.js';
import { emitProgress } from '@/lib/utils';

const forceFullTrace = true;

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
    
    console.log('[Debug] POST request received:', {
      hasBarcode: !!barcode,
      hasProductName: !!product_name,
      hasBrand: !!brand,
      hasImageBase64: !!image_base64,
      imageBase64Type: typeof image_base64,
      imageBase64Preview: image_base64?.slice?.(0, 100)
    });

    // Validate that we have at least some input to work with
    if (!barcode && !product_name && !brand && !image_base64) {
      return NextResponse.json({ 
        error: 'At least one of the following is required: barcode, product_name, brand, or image_base64' 
      }, { status: 400 });
    }

    // Generate a unique query ID for progress tracking
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine the type of identifier we're working with
    const identifier = barcode;
    const isRealBarcode = identifier && !identifier.startsWith('img_') && !identifier.startsWith('data:');
    const isImageIdentifier = identifier && identifier.startsWith('img_');
    const isImageData = image_base64 && image_base64.startsWith('data:');

    // Emit initial progress
    await emitProgress(queryId, 'start', 'started', { 
      identifier_type: isRealBarcode ? 'barcode' : isImageIdentifier ? 'image_id' : 'manual',
      identifier,
      brand, 
      product_name, 
      has_image: !!image_base64 
    });

    try {
      let currentProductData = null;
      
      // Step 1: If we have a real barcode, try enhanced barcode lookup first
      if (isRealBarcode) {
        await emitProgress(queryId, 'barcode_lookup', 'started', { barcode: identifier });
        
        // Prepare user data if provided
        const userData = (product_name || brand) ? {
          product_name,
          brand,
          region_hint: hints.country_of_origin
        } : null;
        
        const barcodeData = await enhancedLookupProduct(identifier, userData);
        await emitProgress(queryId, 'barcode_lookup', 'completed', barcodeData);

        currentProductData = { ...barcodeData };

        // Check if enhanced lookup requires manual entry (poor quality data)
        if (barcodeData.requires_manual_entry) {
          console.log('❌ Enhanced lookup requires manual entry due to poor quality data');
          await emitProgress(queryId, 'complete', 'completed', { success: false, reason: 'requires_manual_entry' });
          
          return NextResponse.json({
            success: false,
            requires_manual_entry: true,
            reason: barcodeData.result_type || 'poor_quality_manual_entry',
            product_data: {
              product_name: barcodeData.product_name,
              brand: barcodeData.brand,
              identifier: barcodeData.barcode
            },
            quality_assessment: barcodeData.quality_assessment,
            lookup_trace: barcodeData.lookup_trace,
            message: 'Product information is incomplete or of poor quality. Please provide details manually or use camera capture.',
            query_id: queryId
          });
        }

        // If we already have ownership data from the enhanced lookup, return it
        if (!forceFullTrace && barcodeData.financial_beneficiary) {
          console.log('✅ Ownership data found in enhanced lookup, skipping agent research');
          await emitProgress(queryId, 'ownership_research', 'completed', { reason: 'Already found in lookup' });
          await emitProgress(queryId, 'complete', 'completed', { success: true });

          return NextResponse.json({
            ...barcodeData,
            query_id: queryId
          });
        }
      } else if (isImageIdentifier) {
        // Image identifier from camera capture - use provided manual data
        console.log('🔍 Image identifier from camera capture, using provided data for vision analysis');
        
        if (product_name || brand) {
          console.log('📝 Using image-extracted manual data:', { product_name, brand });
          currentProductData = {
            product_name: product_name || null,
            brand: brand || null,
            identifier: identifier, // Keep the image identifier for tracking
            result_type: 'image_extracted',
            lookup_trace: ['image_extracted'],
            confidence: 70, // Image-extracted data has medium confidence
            sources: ['image_analysis']
          };
          
          await emitProgress(queryId, 'image_extraction', 'completed', currentProductData);
        } else {
          // Only image identifier provided - we'll handle this in the vision analysis section below
          currentProductData = {
            product_name: null,
            brand: null,
            identifier: identifier,
            result_type: 'image_only',
            lookup_trace: ['image_input'],
            confidence: 0,
            sources: ['image_input']
          };
          
          await emitProgress(queryId, 'image_input', 'completed', { message: 'Image provided with identifier, attempting analysis' });
        }
      } else {
        // No barcode provided - start with manual/user provided data
        console.log('🔍 No barcode provided, starting with manual entry or image analysis');
        
        if (product_name || brand) {
          console.log('📝 Using manual entry data:', { product_name, brand });
          currentProductData = {
            product_name: product_name || null,
            brand: brand || null,
            identifier: null,
            result_type: 'manual_entry',
            lookup_trace: ['manual_entry'],
            confidence: 85, // Manual entry assumed to be high quality
            sources: ['user_input']
          };
          
          await emitProgress(queryId, 'manual_entry', 'completed', currentProductData);
        } else {
          // Only image provided - we'll handle this in the vision analysis section below
          currentProductData = {
            product_name: null,
            brand: null,
            identifier: null,
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
      
      console.log('[Debug] forceFullTrace:', forceFullTrace);
      console.log('[Debug] image_base64 present:', !!image_base64);
      console.log('[Debug] image_base64 type:', typeof image_base64);
      console.log('[Debug] image_base64 preview:', image_base64?.slice?.(0, 100));
      console.log('[Debug] currentProductData:', {
        hasProductName: !!currentProductData?.product_name,
        hasBrand: !!currentProductData?.brand,
        productName: currentProductData?.product_name,
        brand: currentProductData?.brand
      });

      if (currentProductData && (currentProductData.product_name || currentProductData.brand)) {
        console.log('🔍 Running Quality Assessment Agent...');
        
        qualityAssessment = await qualityAgent.assessProductDataQuality(currentProductData);
        
        console.log('📊 Quality Assessment Result:', {
          is_meaningful: qualityAssessment.is_meaningful,
          confidence: qualityAssessment.confidence,
          quality_score: qualityAssessment.quality_score,
          reasoning: qualityAssessment.reasoning,
          issues: qualityAssessment.issues
        });
        
        // If forceFullTrace is true, always run vision analysis if image is provided
        console.log('[Debug] Checking forceFullTrace condition:', { forceFullTrace, hasImageBase64: !!image_base64 });
        console.log('[Debug] Quality assessment result:', qualityAssessment);
        if (forceFullTrace && image_base64) {
          needsVisionAnalysis = true;
          console.log('🔍 forceFullTrace enabled - will run vision analysis even with good quality data');
        } else if (!qualityAssessment.is_meaningful && image_base64) {
          needsVisionAnalysis = true;
        } else if (!qualityAssessment.is_meaningful) {
          console.log('❌ Product data insufficient for agentic search and no image available');
          return NextResponse.json({
            success: false,
            requires_manual_entry: true,
            reason: 'insufficient_data_no_image',
            product_data: currentProductData,
            quality_assessment: qualityAssessment,
            result_type: mapToExternalResultType(currentProductData?.result_type || 'manual_entry', 'insufficient_data'),
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
          product_data: currentProductData,
          result_type: mapToExternalResultType(currentProductData?.result_type || 'manual_entry', 'insufficient_data'),
          message: 'No meaningful product information provided. Please enter brand and product name manually.',
          query_id: queryId
        });
      }

      // Step 3: Vision analysis if needed
      console.log('[Debug] Vision analysis check:', { needsVisionAnalysis, hasImageBase64: !!image_base64 });
      if (needsVisionAnalysis && image_base64) {
        console.log('🔍 Attempting vision agent analysis...');
        console.log('[Debug] needsVisionAnalysis:', needsVisionAnalysis);
        console.log('[Debug] image_base64 present:', !!image_base64);
        console.log('[Debug] image_base64 type:', typeof image_base64);
        console.log('[Debug] image_base64 preview:', image_base64?.slice?.(0, 100));
        
        await emitProgress(queryId, 'vision_analysis', 'started', { 
          reason: qualityAssessment ? 'Quality assessment failed, trying vision analysis' : 'No product data, analyzing image'
        });
        
        try {
          console.log('🔍 Using enhanced image analysis with trace recording...');
          const visionResult = await analyzeProductImage(image_base64, 'jpeg');
          
          console.log('[Debug] analyzeProductImage result:', {
            success: visionResult.success,
            hasImageProcessingTrace: !!visionResult.image_processing_trace,
            traceStages: visionResult.image_processing_trace?.stages?.length || 0
          });
          
          await emitProgress(queryId, 'vision_analysis', 'completed', visionResult);
          
          console.log('📊 Enhanced Image Analysis Result:', {
            success: visionResult.success,
            confidence: visionResult.data?.confidence,
            extracted_data: visionResult.data,
            reasoning: visionResult.data?.reasoning
          });
          
          // Check if enhanced image analysis results are sufficient
          if (visionResult.success && visionResult.data?.confidence >= 50) {
            console.log('✅ Vision analysis provided sufficient data, proceeding to ownership research');
            
            // Use enhanced image analysis data to enhance the product data
            let enhancedData = {
              ...currentProductData,
              product_name: visionResult.data?.product_name || currentProductData?.product_name,
              brand: visionResult.data?.brand_name || currentProductData?.brand,
              result_type: 'enhanced_image_analysis',
              lookup_trace: [...(currentProductData?.lookup_trace || []), 'enhanced_image_analysis'],
              // Include the image processing trace
              image_processing_trace: visionResult.image_processing_trace,
              // Add contextual clues if available
              ...(visionResult.contextual_clues && { contextual_clues: visionResult.contextual_clues })
            };
            
            console.log('[Debug] Enhanced data with image processing trace:', {
              hasImageProcessingTrace: !!enhancedData.image_processing_trace,
              traceStages: enhancedData.image_processing_trace?.stages?.length || 0,
              traceStageNames: enhancedData.image_processing_trace?.stages?.map(s => s.stage) || []
            });
            
            // Re-run quality assessment with enhanced data
            const enhancedQualityAssessment = await qualityAgent.assessProductDataQuality(enhancedData);
            
            if (enhancedQualityAssessment.is_meaningful) {
              console.log('✅ Enhanced data passes quality assessment - proceeding to agentic search');
              currentProductData = enhancedData;
              qualityAssessment = enhancedQualityAssessment;
            } else {
              console.log('❌ Even with vision data, quality is insufficient');
              return NextResponse.json({
                success: false,
                requires_manual_entry: true,
                reason: 'insufficient_data_after_vision',
                product_data: currentProductData,
                quality_assessment: enhancedQualityAssessment,
                vision_result: visionResult,
                result_type: mapToExternalResultType(currentProductData?.result_type || 'vision_enhanced', 'insufficient_data'),
                message: 'Product information is still incomplete even after image analysis. Please provide details manually.',
                query_id: queryId
              });
            }
          } else {
            console.log('❌ Vision analysis failed or provided insufficient data');
            // Instead of returning early, continue with existing data but include the image processing trace
            if (visionResult.image_processing_trace) {
              currentProductData = {
                ...currentProductData,
                image_processing_trace: visionResult.image_processing_trace
              };
              console.log('[Debug] Added image processing trace to currentProductData despite vision failure');
            }
          }
        } catch (visionError) {
          console.error('❌ Vision analysis error:', visionError);
          await emitProgress(queryId, 'vision_analysis', 'error', { error: visionError.message });
          
          // Continue with existing data instead of returning early
          console.log('[Debug] Vision analysis error occurred, continuing with existing data');
        }
      }

      // If barcode lookup returns no data at all, trigger manual entry/camera fallback
      if (!currentProductData || (!currentProductData.product_name && !currentProductData.brand)) {
        // If we have image processing trace, continue with ownership research even without product data
        if ((currentProductData as any)?.image_processing_trace) {
          console.log('✅ No product data but have image processing trace - continuing with ownership research');
          // Set default values for ownership research
          currentProductData = {
            product_name: 'Unknown Product',
            brand: 'Unknown Brand',
            result_type: 'image_analysis_failed',
            lookup_trace: ['image_analysis_failed'],
            confidence: 0,
            sources: ['image_analysis'],
            image_processing_trace: (currentProductData as any).image_processing_trace
          };
        } else {
          console.log('❌ No meaningful product data available. Triggering manual entry.');
          return NextResponse.json({
            success: false,
            requires_manual_entry: true,
            reason: 'no_product_data',
            product_data: currentProductData,
            result_type: mapToExternalResultType(currentProductData?.result_type || 'manual_entry', 'insufficient_data'),
            message: 'No meaningful product information found. Please provide details manually or use camera capture.'
          });
        }
      }

      // Step 4: Enhanced Ownership research (only if no ownership data found and we have meaningful product data)
      await emitProgress(queryId, 'ownership_research', 'started', { brand: currentProductData.brand, product_name: currentProductData.product_name });
      
      // Enable evaluation logging if requested
      if (evaluation_mode) {
        process.env.ENABLE_EVALUATION_LOGGING = 'true';
      }
      
              const ownershipResult = await EnhancedAgentOwnershipResearch({
          barcode: identifier,
          product_name: currentProductData.product_name,
          brand: currentProductData.brand,
          hints,
          enableEvaluation: evaluation_mode,
          imageProcessingTrace: (currentProductData as any).image_processing_trace || null
        });
      
      // Reset evaluation logging
      if (evaluation_mode) {
        process.env.ENABLE_EVALUATION_LOGGING = 'false';
      }
      
      await emitProgress(queryId, 'ownership_research', 'completed', ownershipResult);

      // Step 5: Final result
      await emitProgress(queryId, 'complete', 'completed', { success: true });

      // Merge product data and ownership result into a flat structure
      const mergedResult = {
        success: true,
        product_name: currentProductData.product_name,
        brand: currentProductData.brand,
        barcode: identifier,
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
        result_type: mapToExternalResultType(currentProductData.result_type, ownershipResult.result_type),
        user_contributed: !!(product_name || brand),
        agent_execution_trace: ownershipResult.agent_execution_trace,
        lookup_trace: currentProductData.lookup_trace, // Include enhanced lookup trace
        // Pass through contextual clues from image analysis if available
        contextual_clues: (currentProductData as any).contextual_clues || null,
        image_processing_trace: (currentProductData as any).image_processing_trace || null,
        query_id: queryId
      };

      console.log('[Debug] Final merged result:', {
        hasImageProcessingTrace: !!mergedResult.image_processing_trace,
        hasAgentExecutionTrace: !!mergedResult.agent_execution_trace,
        imageProcessingStages: mergedResult.image_processing_trace?.stages?.length || 0,
        agentExecutionStages: mergedResult.agent_execution_trace?.stages?.length || 0
      });

      if (forceFullTrace) {
        return NextResponse.json(mergedResult);
      }

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