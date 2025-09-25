import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with error handling
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    console.log('[MONITOR] Recent activity check requested');
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('[MONITOR] Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Analyze the data
    const analysis = {
      total_scans: data.length,
      with_gemini_analysis: 0,
      with_web_search_results: 0,
      with_agent_traces: 0,
      recent_scans: []
    };
    
    data.forEach((scan, index) => {
      const scanInfo: any = {
        brand: scan.brand || 'Unknown',
        product: scan.product_name || 'Unknown',
        created_at: scan.created_at,
        confidence: scan.confidence_score || 'N/A',
        verification_status: scan.verification_status || 'N/A',
        result_type: scan.result_type || 'N/A',
        has_gemini_analysis: !!scan.gemini_evidence_analysis,
        has_agent_trace: !!scan.agent_execution_trace,
        has_web_search: false
      };
      
      if (scan.gemini_evidence_analysis) {
        analysis.with_gemini_analysis++;
        
        try {
          const geminiData = typeof scan.gemini_evidence_analysis === 'string' 
            ? JSON.parse(scan.gemini_evidence_analysis) 
            : scan.gemini_evidence_analysis;
          
          if (geminiData.web_search_results && geminiData.web_search_results.length > 0) {
            analysis.with_web_search_results++;
            scanInfo.has_web_search = true;
            scanInfo.web_search_count = geminiData.web_search_results.length;
            scanInfo.sample_snippet = geminiData.web_search_results[0].content?.substring(0, 100) + '...';
          }
        } catch (parseError) {
          console.warn('[MONITOR] Failed to parse Gemini analysis:', parseError);
        }
      }
      
      if (scan.agent_execution_trace) {
        analysis.with_agent_traces++;
      }
      
      analysis.recent_scans.push(scanInfo);
    });
    
    console.log('[MONITOR] Analysis complete:', analysis);
    
    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[MONITOR] Error:', error);
    
    // Handle specific error cases
    if (error instanceof Error && error.message.includes('Missing Supabase environment variables')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database configuration error - missing environment variables',
        details: 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
