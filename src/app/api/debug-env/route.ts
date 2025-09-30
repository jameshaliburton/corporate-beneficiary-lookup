import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple authentication gate for debug route
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.DEBUG_AUTH_TOKEN;

    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - debug route requires authentication'
      }, { status: 401 });
    }

    console.log('[DEBUG_ENV] Environment variable check');

    const envCheck = {
      GEMINI_FLASH_V1_ENABLED: process.env.GEMINI_FLASH_V1_ENABLED,
      GEMINI_FLASH_V1_ENABLED_BOOLEAN: process.env.GEMINI_FLASH_V1_ENABLED === 'true',
      GEMINI_API_KEY_PRESENT: !!process.env.GEMINI_API_KEY,
      GEMINI_API_KEY_LENGTH: process.env.GEMINI_API_KEY?.length || 0,
      GOOGLE_API_KEY_PRESENT: !!process.env.GOOGLE_API_KEY,
      GOOGLE_API_KEY_LENGTH: process.env.GOOGLE_API_KEY?.length || 0,
      NODE_ENV: process.env.NODE_ENV,
      // Show first few characters of API key for verification (safely)
      GEMINI_API_KEY_PREFIX: process.env.GEMINI_API_KEY?.substring(0, 10) + '...' || 'NOT_SET',
      GOOGLE_API_KEY_PREFIX: process.env.GOOGLE_API_KEY?.substring(0, 10) + '...' || 'NOT_SET'
    };

    console.log('[DEBUG_ENV] Environment check result:', envCheck);

    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DEBUG_ENV] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
