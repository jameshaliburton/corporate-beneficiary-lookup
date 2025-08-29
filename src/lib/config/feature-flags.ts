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
  ENABLE_IMAGE_BARCODE_SCANNING: process.env.ENABLE_IMAGE_BARCODE_SCANNING !== 'false',
  
  // Agent-specific feature flags
  ENABLE_GEMINI_OWNERSHIP_AGENT: process.env.ENABLE_GEMINI_OWNERSHIP_AGENT === 'true',
  ENABLE_DISAMBIGUATION_AGENT: process.env.ENABLE_DISAMBIGUATION_AGENT === 'true',
  ENABLE_AGENT_REPORTS: process.env.ENABLE_AGENT_REPORTS === 'true',
  ENABLE_PIPELINE_LOGGING: process.env.ENABLE_PIPELINE_LOGGING === 'true'
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
 * Check if Gemini Ownership Agent should be enabled
 */
export function shouldEnableGeminiOwnershipAgent(): boolean {
  return FEATURE_FLAGS.ENABLE_GEMINI_OWNERSHIP_AGENT;
}

/**
 * Check if Disambiguation Agent should be enabled
 */
export function shouldEnableDisambiguationAgent(): boolean {
  return FEATURE_FLAGS.ENABLE_DISAMBIGUATION_AGENT;
}

/**
 * Check if Agent Reports should be enabled
 */
export function shouldEnableAgentReports(): boolean {
  return FEATURE_FLAGS.ENABLE_AGENT_REPORTS;
}

/**
 * Check if Pipeline Logging should be enabled
 */
export function shouldEnablePipelineLogging(): boolean {
  return FEATURE_FLAGS.ENABLE_PIPELINE_LOGGING;
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
    ENABLE_IMAGE_BARCODE_SCANNING: FEATURE_FLAGS.ENABLE_IMAGE_BARCODE_SCANNING,
    ENABLE_GEMINI_OWNERSHIP_AGENT: FEATURE_FLAGS.ENABLE_GEMINI_OWNERSHIP_AGENT,
    ENABLE_DISAMBIGUATION_AGENT: FEATURE_FLAGS.ENABLE_DISAMBIGUATION_AGENT,
    ENABLE_AGENT_REPORTS: FEATURE_FLAGS.ENABLE_AGENT_REPORTS,
    ENABLE_PIPELINE_LOGGING: FEATURE_FLAGS.ENABLE_PIPELINE_LOGGING
  });
} 