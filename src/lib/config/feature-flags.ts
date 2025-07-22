/**
 * Feature Flags Configuration
 * Controls pipeline behavior and feature toggles
 */

export const FEATURE_FLAGS = {
  // Legacy barcode lookup (can be disabled)
  ENABLE_LEGACY_BARCODE: process.env.ENABLE_LEGACY_BARCODE !== 'false',
  
  // New vision-first pipeline
  ENABLE_VISION_FIRST_PIPELINE: process.env.ENABLE_VISION_FIRST_PIPELINE !== 'false',
  
  // Vision confidence threshold for quality control
  VISION_CONFIDENCE_THRESHOLD: parseInt(process.env.VISION_CONFIDENCE_THRESHOLD || '70'),
  
  // Force full trace for evaluation (always true in development)
  FORCE_FULL_TRACE: process.env.FORCE_FULL_TRACE !== 'false',
  
  // Enable enhanced image processing
  ENABLE_ENHANCED_IMAGE_PROCESSING: process.env.ENABLE_ENHANCED_IMAGE_PROCESSING !== 'false',
  
  // Enable OCR extraction
  ENABLE_OCR_EXTRACTION: process.env.ENABLE_OCR_EXTRACTION !== 'false',
  
  // Enable barcode scanning from images
  ENABLE_IMAGE_BARCODE_SCANNING: process.env.ENABLE_IMAGE_BARCODE_SCANNING !== 'false'
};

/**
 * Check if legacy barcode lookup should be used
 */
export function shouldUseLegacyBarcode(): boolean {
  return FEATURE_FLAGS.ENABLE_LEGACY_BARCODE;
}

/**
 * Check if vision-first pipeline should be used
 */
export function shouldUseVisionFirstPipeline(): boolean {
  return FEATURE_FLAGS.ENABLE_VISION_FIRST_PIPELINE;
}

/**
 * Get vision confidence threshold
 */
export function getVisionConfidenceThreshold(): number {
  return FEATURE_FLAGS.VISION_CONFIDENCE_THRESHOLD;
}

/**
 * Check if force full trace is enabled
 */
export function shouldForceFullTrace(): boolean {
  return FEATURE_FLAGS.FORCE_FULL_TRACE;
}

/**
 * Log current feature flag state
 */
export function logFeatureFlags(): void {
  console.log('[FeatureFlags] Current configuration:', {
    ENABLE_LEGACY_BARCODE: FEATURE_FLAGS.ENABLE_LEGACY_BARCODE,
    ENABLE_VISION_FIRST_PIPELINE: FEATURE_FLAGS.ENABLE_VISION_FIRST_PIPELINE,
    VISION_CONFIDENCE_THRESHOLD: FEATURE_FLAGS.VISION_CONFIDENCE_THRESHOLD,
    FORCE_FULL_TRACE: FEATURE_FLAGS.FORCE_FULL_TRACE,
    ENABLE_ENHANCED_IMAGE_PROCESSING: FEATURE_FLAGS.ENABLE_ENHANCED_IMAGE_PROCESSING,
    ENABLE_OCR_EXTRACTION: FEATURE_FLAGS.ENABLE_OCR_EXTRACTION,
    ENABLE_IMAGE_BARCODE_SCANNING: FEATURE_FLAGS.ENABLE_IMAGE_BARCODE_SCANNING
  });
} 