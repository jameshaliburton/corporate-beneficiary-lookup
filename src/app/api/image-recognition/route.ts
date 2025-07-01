import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle both FormData (real usage) and JSON (testing)
    let imageData = null;
    
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
      
      imageData = {
        name: file.name,
        type: file.type,
        size: file.size
      };
    } else {
      // Handle JSON for testing
      const jsonData = await request.json();
      imageData = {
        name: jsonData.image_name || 'test_image.jpg',
        type: jsonData.image_type || 'image/jpeg',
        size: jsonData.image_size || 1024
      };
    }

    console.log('📸 Processing image (simplified mock):', imageData);

    // For testing purposes, return mock successful image recognition
    // In production, this would call the real image analysis
    const mockResult = {
      success: true,
      product_name: 'Test Product',
      brand: 'TestBrand',
      product_type: 'Food',
      confidence: 75,
      reasoning: 'Mock image analysis for testing',
      quality_score: 80,
      flow: {
        step1: 'ocr_lightweight_extractor',
        step1_5: 'cache_check_failed',
        final_confidence: 75,
        cache_hit: false
      },
      source: 'mock_image_recognition',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(mockResult);

  } catch (error) {
    console.error('❌ Image recognition API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 