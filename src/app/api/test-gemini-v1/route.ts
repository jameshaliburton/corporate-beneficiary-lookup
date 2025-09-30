import { NextRequest, NextResponse } from 'next/server';
import { testGeminiV1Endpoint, generateGeminiTestPayload } from '@/lib/agents/gemini-ownership-analysis-agent.js';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST_GEMINI_V1] Test endpoint called');
    
    // Test the Gemini v1 endpoint
    const testResult = await testGeminiV1Endpoint();
    
    // Generate test payload for inspection
    const testPayload = generateGeminiTestPayload();
    
    console.log('[TEST_GEMINI_V1] Test completed:', {
      success: testResult.success,
      model: testResult.model,
      endpoint: testResult.endpoint,
      featureFlagEnabled: testResult.featureFlagEnabled
    });
    
    return NextResponse.json({
      success: true,
      test_result: testResult,
      test_payload: {
        model: testPayload.model,
        endpoint: testPayload.endpoint,
        featureFlagEnabled: testPayload.featureFlagEnabled,
        promptLength: testPayload.promptLength,
        snippetCount: testPayload.snippetCount,
        brand: testPayload.existingResult.brand,
        productName: testPayload.existingResult.product_name
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[TEST_GEMINI_V1] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
