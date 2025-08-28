/**
 * Image Compression for Vision Analysis
 * Compresses large images before sending to Claude vision API to prevent silent failures
 */

import sharp from 'sharp';

export interface CompressionResult {
  buffer: Buffer;
  mimeType: string;
  originalSize: number;
  finalSize: number;
  compressionRatio: number;
  dimensions: {
    original: { width: number; height: number };
    final: { width: number; height: number };
  };
}

export interface CompressionOptions {
  maxSizeKB?: number;        // Target max size in KB (default: 800KB)
  maxWidth?: number;         // Max width in pixels (default: 1024)
  maxHeight?: number;        // Max height in pixels (default: 1024)
  quality?: number;          // JPEG quality 1-100 (default: 85)
  format?: 'jpeg' | 'webp'; // Output format (default: 'jpeg')
}

/**
 * Compress image for vision analysis
 * Ensures images are under size limits and in compatible format for Claude vision
 */
export async function compressImageForVision(
  inputBuffer: Buffer,
  inputMimeType: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeKB = 800,
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 85,
    format = 'jpeg'
  } = options;

  const originalSize = inputBuffer.length;
  const originalSizeKB = Math.round(originalSize / 1024);
  
  console.log(`[VISION_COMPRESSION] Starting compression:`, {
    originalSizeKB,
    inputMimeType,
    targetMaxSizeKB: maxSizeKB,
    targetMaxDimensions: `${maxWidth}x${maxHeight}`,
    targetFormat: format
  });

  // If image is already small enough, return as-is
  if (originalSizeKB <= maxSizeKB) {
    console.log(`[VISION_COMPRESSION] Image already under size limit, no compression needed`);
    return {
      buffer: inputBuffer,
      mimeType: inputMimeType,
      originalSize,
      finalSize: originalSize,
      compressionRatio: 1.0,
      dimensions: {
        original: { width: 0, height: 0 }, // Will be filled by sharp
        final: { width: 0, height: 0 }
      }
    };
  }

  try {
    // Get original image metadata
    const metadata = await sharp(inputBuffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    console.log(`[VISION_COMPRESSION] Original image metadata:`, {
      width: originalWidth,
      height: originalHeight,
      format: metadata.format,
      sizeKB: originalSizeKB
    });

    // Calculate new dimensions while maintaining aspect ratio
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const aspectRatio = originalWidth / originalHeight;
      
      if (originalWidth > originalHeight) {
        newWidth = Math.min(maxWidth, originalWidth);
        newHeight = Math.round(newWidth / aspectRatio);
      } else {
        newHeight = Math.min(maxHeight, originalHeight);
        newWidth = Math.round(newHeight * aspectRatio);
      }
    }

    console.log(`[VISION_COMPRESSION] Calculated new dimensions:`, {
      original: `${originalWidth}x${originalHeight}`,
      final: `${newWidth}x${newHeight}`,
      aspectRatioMaintained: true
    });

    // Compress the image
    let sharpInstance = sharp(inputBuffer)
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });

    // Apply format-specific compression
    if (format === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({
        quality,
        progressive: true,
        mozjpeg: true
      });
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({
        quality,
        effort: 6
      });
    }

    const compressedBuffer = await sharpInstance.toBuffer();
    const finalSize = compressedBuffer.length;
    const finalSizeKB = Math.round(finalSize / 1024);
    const compressionRatio = originalSize / finalSize;

    console.log(`[VISION_COMPRESSION] Compression completed:`, {
      originalSizeKB,
      finalSizeKB,
      compressionRatio: compressionRatio.toFixed(2),
      sizeReduction: `${Math.round((1 - finalSize / originalSize) * 100)}%`,
      success: true
    });

    return {
      buffer: compressedBuffer,
      mimeType: `image/${format}`,
      originalSize,
      finalSize,
      compressionRatio,
      dimensions: {
        original: { width: originalWidth, height: originalHeight },
        final: { width: newWidth, height: newHeight }
      }
    };

  } catch (error) {
    console.error(`[VISION_COMPRESSION] Compression failed:`, {
      error: error instanceof Error ? error.message : error,
      originalSizeKB,
      inputMimeType
    });

    // Return original buffer if compression fails
    console.warn(`[VISION_COMPRESSION] Falling back to original image`);
    return {
      buffer: inputBuffer,
      mimeType: inputMimeType,
      originalSize,
      finalSize: originalSize,
      compressionRatio: 1.0,
      dimensions: {
        original: { width: 0, height: 0 },
        final: { width: 0, height: 0 }
      }
    };
  }
}

/**
 * Check if image needs compression
 */
export function needsCompression(buffer: Buffer, maxSizeKB: number = 800): boolean {
  const sizeKB = Math.round(buffer.length / 1024);
  return sizeKB > maxSizeKB;
}

/**
 * Get image compression recommendations
 */
export function getCompressionRecommendations(buffer: Buffer): {
  needsCompression: boolean;
  currentSizeKB: number;
  recommendedMaxSizeKB: number;
  estimatedCompressionRatio: number;
} {
  const currentSizeKB = Math.round(buffer.length / 1024);
  const recommendedMaxSizeKB = 800;
  const needsComp = currentSizeKB > recommendedMaxSizeKB;
  
  // Estimate compression ratio based on size
  let estimatedRatio = 1.0;
  if (currentSizeKB > 2000) estimatedRatio = 0.3; // 70% reduction
  else if (currentSizeKB > 1000) estimatedRatio = 0.5; // 50% reduction
  else if (currentSizeKB > 800) estimatedRatio = 0.7; // 30% reduction

  return {
    needsCompression: needsComp,
    currentSizeKB,
    recommendedMaxSizeKB,
    estimatedCompressionRatio: estimatedRatio
  };
}

