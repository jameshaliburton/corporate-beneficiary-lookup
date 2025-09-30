import { NextRequest, NextResponse } from 'next/server';
import { performGeminiOwnershipAnalysis } from '@/lib/agents/gemini-ownership-analysis-agent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand') || 'TestBrand';
    const productName = searchParams.get('product_name') || 'TestProduct';
    
    console.log('[DEBUG_METADATA_TEST] Testing Gemini agent directly with:', { brand, productName });
    
    // Create a mock existing result
    const existingResult = {
      financial_beneficiary: 'Test Owner',
      confidence_score: 85,
      brand: brand,
      product_name: productName
    };
    
    // Call the Gemini agent directly
    const result = await performGeminiOwnershipAnalysis(brand, productName, existingResult);
    
    console.log('[DEBUG_METADATA_TEST] Gemini agent result:', {
      hasDebugMetadata: !!result.gemini_debug_metadata,
      debugMetadata: result.gemini_debug_metadata,
      verificationStatus: result.verification_status,
      verificationMethod: result.verification_method
    });
    
    return NextResponse.json({
      success: true,
      brand,
      productName,
      result: {
        verification_status: result.verification_status,
        verification_method: result.verification_method,
        gemini_debug_metadata: result.gemini_debug_metadata,
        has_debug_metadata: !!result.gemini_debug_metadata
      }
    });
    
  } catch (error) {
    console.error('[DEBUG_METADATA_TEST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
