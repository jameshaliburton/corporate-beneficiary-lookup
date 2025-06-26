import { NextRequest, NextResponse } from 'next/server';
import { analyzeProductImage, bufferToBase64 } from '@/lib/apis/image-recognition.js';

export async function POST(request: NextRequest) {
  try {
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

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Image file too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    console.log('📸 Processing image:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Convert file to buffer and then to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = bufferToBase64(buffer);
    
    // Determine image format
    const format = file.type.split('/')[1] || 'jpeg';
    
    // Analyze the image
    const result = await analyzeProductImage(base64, format);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Image analysis failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      source: 'image_recognition',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Image recognition API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 