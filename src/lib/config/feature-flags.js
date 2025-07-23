/**
 * Feature flags for controlling application behavior
 */

/**
 * Whether to use legacy barcode lookup
 * @returns {boolean}
 */
export function shouldUseLegacyBarcode() {
  return process.env.USE_LEGACY_BARCODE === 'true';
}

/**
 * Whether to use vision-first pipeline
 * @returns {boolean}
 */
export function shouldUseVisionFirstPipeline() {
  return process.env.USE_VISION_FIRST_PIPELINE !== 'false';
}

/**
 * Whether to force full trace generation
 * @returns {boolean}
 */
export function shouldForceFullTrace() {
  return process.env.FORCE_FULL_TRACE === 'true' || process.env.NODE_ENV === 'development';
}

/**
 * Get vision confidence threshold
 * @returns {number}
 */
export function getVisionConfidenceThreshold() {
  return parseFloat(process.env.VISION_CONFIDENCE_THRESHOLD) || 0.7;
}

/**
 * Log current feature flags
 */
export function logFeatureFlags() {
  console.log('🔧 Feature Flags:', {
    USE_LEGACY_BARCODE: shouldUseLegacyBarcode(),
    USE_VISION_FIRST_PIPELINE: shouldUseVisionFirstPipeline(),
    FORCE_FULL_TRACE: shouldForceFullTrace(),
    VISION_CONFIDENCE_THRESHOLD: getVisionConfidenceThreshold()
  });
} 