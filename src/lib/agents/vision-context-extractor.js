/**
 * Vision Context Extractor
 * Extracts structured information from product images using OCR and vision analysis
 */

import { analyzeProductImage } from '../apis/image-recognition.js';
import { shouldUseVisionFirstPipeline, getVisionConfidenceThreshold } from '../config/feature-flags';

/**
 * Extracted context from vision analysis
 */
export class VisionContext {
  constructor(data = {}) {
    this.brand = data.brand || null;
    this.productName = data.productName || null;
    this.countryOfOrigin = data.countryOfOrigin || null;
    this.languages = data.languages || [];
    this.confidence = data.confidence || 0;
    this.reasoning = data.reasoning || '';
    this.qualityScore = data.qualityScore || 0;
    this.needsEscalation = data.needsEscalation || false;
    this.extractedText = data.extractedText || '';
    this.visionTrace = data.visionTrace || null;
  }

  /**
   * Check if vision extraction was successful
   */
  isSuccessful() {
    return this.confidence >= getVisionConfidenceThreshold() && 
           (this.brand || this.productName);
  }

  /**
   * Get primary extracted data for ownership research
   */
  getPrimaryData() {
    return {
      brand: this.brand,
      productName: this.productName,
      countryOfOrigin: this.countryOfOrigin,
      confidence: this.confidence,
      qualityScore: this.qualityScore
    };
  }

  /**
   * Get hints for ownership research
   */
  getHints() {
    const hints = {};
    
    if (this.countryOfOrigin) {
      hints.country_of_origin = this.countryOfOrigin;
    }
    
    if (this.languages.length > 0) {
      hints.languages = this.languages;
    }
    
    if (this.extractedText) {
      hints.extracted_text = this.extractedText;
    }
    
    return hints;
  }
}

/**
 * Extract context from image using vision and OCR
 */
export async function extractVisionContext(imageBase64, imageFormat = 'jpeg') {
  console.log('[VisionContextExtractor] Starting vision context extraction');
  
  if (!shouldUseVisionFirstPipeline()) {
    console.log('[VisionContextExtractor] Vision-first pipeline disabled, skipping');
    return new VisionContext({
      reasoning: 'Vision-first pipeline disabled',
      needsEscalation: true
    });
  }

  try {
    // Analyze product image using existing enhanced pipeline
    const analysisResult = await analyzeProductImage(imageBase64, imageFormat);
    
    console.log('[VisionContextExtractor] Analysis result:', {
      success: analysisResult.success,
      confidence: analysisResult.confidence,
      hasTrace: !!analysisResult.image_processing_trace
    });

    if (!analysisResult.success) {
      return new VisionContext({
        reasoning: 'Image analysis failed',
        needsEscalation: true
      });
    }

    // Extract structured data from analysis result
    // The data can be in different locations depending on the analysis result structure
    let extractedData = {};
    let trace = null;
    
    if (analysisResult.data) {
      // Direct data structure
      extractedData = analysisResult.data;
    } else if (analysisResult.contextual_clues && analysisResult.contextual_clues.extracted_data) {
      // Nested contextual clues structure
      extractedData = analysisResult.contextual_clues.extracted_data;
    } else if (analysisResult.extracted_data) {
      // Legacy structure
      extractedData = analysisResult.extracted_data;
    }
    
    trace = analysisResult.image_processing_trace || null;

    console.log('[VisionContextExtractor] Extracted data structure:', {
      hasData: !!analysisResult.data,
      hasContextualClues: !!(analysisResult.contextual_clues && analysisResult.contextual_clues.extracted_data),
      hasExtractedData: !!analysisResult.extracted_data,
      extractedDataKeys: Object.keys(extractedData),
      brandName: extractedData.brand_name,
      productName: extractedData.product_name,
      confidence: extractedData.confidence
    });

    // Create vision context from extracted data
    const visionContext = new VisionContext({
      brand: extractedData.brand_name || null,
      productName: extractedData.product_name || null,
      countryOfOrigin: extractedData.country_of_origin || null,
      languages: extractedData.languages || [],
      confidence: extractedData.confidence || analysisResult.confidence || 0,
      reasoning: extractedData.reasoning || analysisResult.reasoning || '',
      qualityScore: extractedData.quality_score || 0,
      needsEscalation: extractedData.needs_escalation || false,
      extractedText: extractedData.extracted_text || '',
      visionTrace: trace
    });

    console.log('[VisionContextExtractor] Extracted context:', {
      brand: visionContext.brand,
      productName: visionContext.productName,
      confidence: visionContext.confidence,
      isSuccessful: visionContext.isSuccessful()
    });

    return visionContext;

  } catch (error) {
    console.error('[VisionContextExtractor] Error in vision context extraction:', error);
    
    return new VisionContext({
      reasoning: `Error in vision analysis: ${error.message}`,
      needsEscalation: true
    });
  }
}

/**
 * Validate vision context for ownership research
 */
export function validateVisionContext(visionContext) {
  if (!visionContext || !(visionContext instanceof VisionContext)) {
    return {
      isValid: false,
      reason: 'Invalid vision context object'
    };
  }

  if (!visionContext.isSuccessful()) {
    return {
      isValid: false,
      reason: `Vision extraction failed: ${visionContext.reasoning}`
    };
  }

  if (!visionContext.brand && !visionContext.productName) {
    return {
      isValid: false,
      reason: 'No brand or product name extracted'
    };
  }

  return {
    isValid: true,
    reason: 'Vision context is valid for ownership research'
  };
}

/**
 * Merge vision context with manual input data
 */
export function mergeVisionWithManual(visionContext, manualData) {
  const merged = {
    brand: manualData.brand || visionContext.brand,
    productName: manualData.product_name || visionContext.productName,
    countryOfOrigin: manualData.country_of_origin || visionContext.countryOfOrigin,
    confidence: Math.max(visionContext.confidence, manualData.confidence || 0),
    qualityScore: Math.max(visionContext.qualityScore, manualData.quality_score || 0)
  };

  // Combine hints from both sources
  const hints = {
    ...visionContext.getHints(),
    ...manualData.hints
  };

  return {
    ...merged,
    hints,
    visionTrace: visionContext.visionTrace
  };
} 