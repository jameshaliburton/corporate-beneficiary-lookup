import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST_GEMINI] Test endpoint called');
    
    // Test the Gemini verification system with a simple brand
    const testBrand = 'Coca-Cola';
    const testProduct = 'Coca-Cola Classic';
    
    console.log(`[TEST_GEMINI] Testing with brand: ${testBrand}, product: ${testProduct}`);
    
    // Make a test request to our own lookup API
    const lookupResponse = await fetch(`${request.nextUrl.origin}/api/lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand: testBrand,
        product_name: testProduct,
        hints: {}
      })
    });
    
    if (!lookupResponse.ok) {
      throw new Error(`Lookup API returned ${lookupResponse.status}`);
    }
    
    const result = await lookupResponse.json();
    
    console.log('[TEST_GEMINI] Lookup result:', {
      success: result.success,
      result_type: result.result_type,
      has_gemini_analysis: !!result.gemini_evidence_analysis,
      has_agent_trace: !!result.agent_execution_trace,
      verification_status: result.verification_status
    });
    
    return NextResponse.json({
      success: true,
      test_brand: testBrand,
      test_product: testProduct,
      lookup_result: {
        success: result.success,
        result_type: result.result_type,
        has_gemini_analysis: !!result.gemini_evidence_analysis,
        has_agent_trace: !!result.agent_execution_trace,
        verification_status: result.verification_status,
        confidence_score: result.confidence_score
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[TEST_GEMINI] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

