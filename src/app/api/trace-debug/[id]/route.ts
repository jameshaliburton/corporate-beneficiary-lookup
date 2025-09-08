/**
 * Trace Debug API Endpoint (ownership-por-v1.1)
 * Provides trace data for the debug view
 * Accessible only in dev or via secret URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const traceId = params.id;
    
    // [SECURITY] Only allow in development or with secret key
    const isDev = process.env.NODE_ENV === 'development';
    const secretKey = request.headers.get('x-trace-debug-key');
    const validSecretKey = process.env.TRACE_DEBUG_SECRET_KEY;
    
    if (!isDev && (!secretKey || secretKey !== validSecretKey)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.log('[TRACE_DEBUG] Fetching trace data for ID:', traceId);

    // Try to find trace data in products table first
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('result_id', traceId)
      .single();

    if (productError && productError.code !== 'PGRST116') {
      console.error('[TRACE_DEBUG] Error fetching product data:', productError);
      return NextResponse.json(
        { error: 'Failed to fetch trace data' },
        { status: 500 }
      );
    }

    if (productData) {
      console.log('[TRACE_DEBUG] Found trace data in products table');
      
      const traceData = {
        id: traceId,
        timestamp: productData.created_at || productData.updated_at,
        confidence: productData.confidence_score || 0,
        brand: productData.brand,
        product_name: productData.product_name,
        financial_beneficiary: productData.financial_beneficiary,
        pipeline_type: productData.result_type || 'unknown',
        cache_hit: false, // This would need to be determined from logs
        verification_status: productData.verification_status,
        verified_at: productData.verified_at,
        verification_method: productData.verification_method,
        verification_notes: productData.verification_notes,
        agent_execution_trace: productData.agent_execution_trace,
        gemini_output: productData.agent_results?.gemini_analysis || null,
        ownership_flow: productData.ownership_flow,
        sources: productData.sources,
        reasoning: productData.reasoning
      };

      return NextResponse.json(traceData);
    }

    // If not found in products, try to find in a dedicated traces table (if it exists)
    // This would be implemented if we had a dedicated trace storage system
    console.log('[TRACE_DEBUG] Trace not found in products table');

    return NextResponse.json(
      { error: 'Trace not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('[TRACE_DEBUG] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock trace data for development/testing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const traceId = params.id;
    const body = await request.json();
    
    // [SECURITY] Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.log('[TRACE_DEBUG] Creating mock trace data for ID:', traceId);

    // Create mock trace data for testing
    const mockTraceData = {
      id: traceId,
      timestamp: new Date().toISOString(),
      confidence: 85,
      brand: body.brand || 'Test Brand',
      product_name: body.product_name || 'Test Product',
      financial_beneficiary: body.financial_beneficiary || 'Test Company Inc.',
      pipeline_type: body.pipeline_type || 'fresh_lookup',
      cache_hit: body.cache_hit || false,
      verification_status: body.verification_status || 'verified',
      verified_at: new Date().toISOString(),
      verification_method: 'gemini_web_search',
      verification_notes: 'Mock verification for testing purposes',
      agent_execution_trace: {
        stages: [
          {
            stage: 'cache_check',
            start_time: new Date(Date.now() - 5000).toISOString(),
            end_time: new Date(Date.now() - 4000).toISOString(),
            duration_ms: 1000,
            result: 'miss',
            details: 'Cache miss - proceeding to ownership research'
          },
          {
            stage: 'ownership_research',
            start_time: new Date(Date.now() - 4000).toISOString(),
            end_time: new Date(Date.now() - 2000).toISOString(),
            duration_ms: 2000,
            result: 'success',
            details: 'Successfully identified ownership structure'
          },
          {
            stage: 'gemini_verification',
            start_time: new Date(Date.now() - 2000).toISOString(),
            end_time: new Date(Date.now() - 1000).toISOString(),
            duration_ms: 1000,
            result: 'success',
            details: 'Gemini verification completed successfully'
          }
        ],
        total_duration_ms: 4000,
        success: true
      },
      gemini_output: {
        verification_status: 'verified',
        confidence_assessment: {
          confidence_change: 'unchanged',
          reasoning: 'Gemini verification confirmed the ownership structure'
        },
        evidence_analysis: {
          sources_analyzed: 3,
          conflicting_evidence: false,
          verification_confidence: 0.9
        }
      },
      ownership_flow: [
        { name: 'Test Brand', type: 'Brand', country: 'United States' },
        { name: 'Test Company Inc.', type: 'Ultimate Owner', country: 'United States' }
      ],
      sources: [
        'https://example.com/corporate-structure',
        'https://example.com/ownership-info',
        'https://example.com/company-details'
      ],
      reasoning: 'Mock reasoning for testing purposes - this is a test trace entry.'
    };

    return NextResponse.json(mockTraceData);

  } catch (error) {
    console.error('[TRACE_DEBUG] Error creating mock trace:', error);
    return NextResponse.json(
      { error: 'Failed to create mock trace' },
      { status: 500 }
    );
  }
}
