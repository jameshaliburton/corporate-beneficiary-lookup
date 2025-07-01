import { NextRequest, NextResponse } from 'next/server';
import { analyzeProductImage } from '../../../lib/apis/image-recognition.js';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle both FormData (real usage) and JSON (testing)
    let imageBase64 = null;
    let imageFormat = 'jpeg';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No image file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'File must be an image' },
          { status: 400 }
        );
      }
      
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString('base64');
      
      // Determine image format
      imageFormat = file.type.split('/')[1] || 'jpeg';
      
      console.log('📸 Processing real image file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        format: imageFormat
      });
    } else {
      // Handle JSON for testing
      const jsonData = await request.json();
      imageBase64 = jsonData.image_base64;
      imageFormat = jsonData.image_format || 'jpeg';
      
      if (!imageBase64) {
        return NextResponse.json(
          { error: 'image_base64 is required for JSON requests' },
          { status: 400 }
        );
      }
      
      console.log('📸 Processing base64 image for testing');
    }

    // Use the actual image analysis function
    const analysisResult = await analyzeProductImage(imageBase64, imageFormat);
    
    if (analysisResult.success) {
      // Transform the result to match the expected format
      const result = {
        success: true,
        product_name: analysisResult.data.product_name,
        brand: analysisResult.data.brand_name,
        product_type: analysisResult.data.product_type,
        confidence: analysisResult.data.confidence,
        reasoning: analysisResult.data.reasoning,
        quality_score: analysisResult.data.confidence, // Use confidence as quality score
        flow: analysisResult.flow,
        source: analysisResult.source,
        contextual_clues: analysisResult.contextual_clues,
        timestamp: analysisResult.timestamp
      };

      console.log('✅ Image analysis successful:', {
        brand: result.brand,
        product_name: result.product_name,
        confidence: result.confidence
      });

      return NextResponse.json(result);
    } else {
      console.error('❌ Image analysis failed:', analysisResult.error);
      return NextResponse.json({
        success: false,
        error: analysisResult.error || 'Image analysis failed',
        product_name: 'Unknown Product',
        brand: 'Unknown Brand',
        confidence: 0,
        reasoning: 'Image analysis failed'
      });
    }

  } catch (error) {
    console.error('❌ Enhanced image recognition API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        product_name: 'Unknown Product', 
        brand: 'Unknown Brand',
        confidence: 0,
        reasoning: 'Internal server error occurred'
      },
      { status: 500 }
    );
  }
} 