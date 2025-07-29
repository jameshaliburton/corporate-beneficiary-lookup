import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isValidResultId } from '@/lib/utils/generateResultId'

/**
 * GET /api/results/[result_id]
 * Fetch a specific result by its unique result_id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { result_id: string } }
) {
  try {
    const { result_id } = params
    
    // Validate result_id format
    if (!isValidResultId(result_id)) {
      return NextResponse.json(
        { error: 'Invalid result ID format' },
        { status: 400 }
      )
    }
    
    console.log(`[API] Fetching result by ID: ${result_id}`)
    
    // Query the database for the result
    const { data: result, error } = await supabase
      .from('products')
      .select('*')
      .eq('result_id', result_id)
      .single()
    
    if (error) {
      console.error(`[API] Database error fetching result ${result_id}:`, error)
      return NextResponse.json(
        { error: 'Failed to fetch result from database' },
        { status: 500 }
      )
    }
    
    if (!result) {
      console.log(`[API] Result not found: ${result_id}`)
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }
    
    console.log(`[API] Successfully fetched result: ${result_id}`)
    
    // Transform the database result to match the expected API format
    const transformedResult = {
      success: true,
      brand: result.brand,
      product_name: result.product_name,
      barcode: result.barcode,
      financial_beneficiary: result.financial_beneficiary,
      beneficiary_country: result.beneficiary_country,
      beneficiary_flag: result.beneficiary_flag,
      confidence_score: result.confidence,
      confidence_level: result.confidence_level,
      ownership_structure_type: result.ownership_structure_type,
      ownership_flow: result.ownership_flow,
      sources: result.sources,
      reasoning: result.reasoning,
      verification_status: result.verification_status || 'unverified',
      verification_reasoning: result.verification_reasoning || 'No verification data available',
      trusted_sources: result.trusted_sources || [],
      verified_sources: result.verified_sources || [],
      highly_likely_sources: result.highly_likely_sources || [],
      agent_execution_trace: result.agent_execution_trace,
      result_id: result.result_id,
      created_at: result.created_at,
      updated_at: result.updated_at
    }
    
    return NextResponse.json(transformedResult)
    
  } catch (error) {
    console.error('[API] Unexpected error in results/[result_id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 