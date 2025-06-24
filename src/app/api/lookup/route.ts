import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { lookupProduct } from '@/lib/apis/barcode-lookup.js';
import { getOwnershipKnowledge } from '@/lib/agents/knowledge-agent.js';
import { AgentOwnershipResearch } from '@/lib/agents/ownership-research-agent.js';
import { generateQueryId } from '@/lib/agents/ownership-research-agent.js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const barcode = body.barcode;
    const userProductName = body.product_name;
    const userBrand = body.brand;
    
    if (!barcode || typeof barcode !== 'string') {
      return NextResponse.json({ success: false, error: 'Barcode is required.' }, { status: 400 });
    }

    // Generate query ID for progress tracking
    const queryId = generateQueryId();

    // 1. Check Supabase for cached result (SKIP if user is providing new product/brand info)
    let cached = null;
    if (!(userProductName && userBrand)) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle();
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      cached = data;
    }
    if (cached) {
      return NextResponse.json({
        success: true,
        ...cached,
        result_type: 'cached',
        user_contributed: cached.user_contributed || false,
        agent_execution_trace: {
          query_id: queryId,
          start_time: new Date().toISOString(),
          brand: cached.brand,
          product_name: cached.product_name,
          barcode: cached.barcode,
          stages: [{
            stage: 'cache_check',
            start_time: new Date().toISOString(),
            description: 'Checking for existing cached result',
            result: 'hit',
            duration_ms: 0,
            data: {
              financial_beneficiary: cached.financial_beneficiary,
              confidence_score: cached.confidence_score,
              result_type: cached.result_type
            }
          }],
          final_result: 'cached',
          total_duration_ms: 0
        }
      });
    }

    // 2. Product lookup with user data if provided
    let product;
    let userContributed = false;
    
    if (userProductName && userBrand) {
      // User provided product info - pass to lookupProduct with user data
      console.log('[lookup] Using user-contributed data:', { userProductName, userBrand });
      const userData = {
        product_name: userProductName,
        brand: userBrand,
        user_contributed: true
      };
      product = await lookupProduct(barcode, userData);
      userContributed = true;
    } else {
      // Standard external API lookup
      console.log('[lookup] Looking up product metadata for barcode:', barcode);
      product = await lookupProduct(barcode);
    }
    
    console.log('[lookup] Product lookup result:', product);
    
    if (!product || !product.success) {
      // If this was a user contribution that failed, return specific error
      if (userContributed) {
        return NextResponse.json({
          success: false,
          error: 'Unable to research ownership for this product.',
          result_type: 'user_contributed_no_match'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'No product found for this barcode. Please try manual entry.',
      }, { status: 404 });
    }

    // 3. For user contributed data, always perform ownership research
    if (userContributed && product.success) {
      console.log('[lookup] Starting ownership research for user-contributed data...');
      
      try {
        const researchResult = await AgentOwnershipResearch({
          barcode,
          product_name: product.product_name,
          brand: product.brand,
          hints: {
            country_of_origin: product.region_hint
          },
          enableEvaluation: true
        });
        
        console.log('[ownership] Ownership research result:', researchResult);
        
        // Store the result
        const newProduct = {
          barcode,
          product_name: product.product_name || null,
          brand: product.brand || null,
          financial_beneficiary: researchResult.financial_beneficiary || null,
          beneficiary_country: researchResult.beneficiary_country || null,
          confidence_score: researchResult.confidence_score || 0,
          ownership_structure_type: researchResult.ownership_structure_type || null,
          user_contributed: true,
          inferred: true,
        };

        const { data: upserted, error: upsertError } = await supabase
          .from('products')
          .upsert([newProduct], { onConflict: 'barcode' })
          .select()
          .maybeSingle();
        if (upsertError) {
          return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
        }

        // Return the result
        const responseData = {
          success: true,
          ...upserted,
          result_type: 'agent-inferred',
          user_contributed: true,
          ownership_flow: researchResult.ownership_flow || null,
          beneficiary_flag: researchResult.beneficiary_flag || getCountryFlag(researchResult.beneficiary_country),
          verification_status: getVerificationStatus(researchResult.confidence_score),
          reasoning: researchResult.reasoning || null,
          sources: researchResult.sources || ['User contribution', 'Web research', 'AI analysis'],
          web_research_used: researchResult.web_research_used,
          web_sources_count: researchResult.web_sources_count,
          agent_execution_trace: researchResult.agent_execution_trace
        };

        return NextResponse.json(responseData);
      } catch (researchErr) {
        console.error('[ownership] Ownership research failed:', researchErr);
        // Fall through to standard ownership resolution
      }
    }

    // 4. Standard ownership resolution for non-user-contributed data
    console.log('[ownership] Resolving ownership for:', product.product_name, product.brand);
    let ownership;
    let ownershipSource = 'knowledge_agent';
    
    try {
      ownership = await getOwnershipKnowledge(
        product.product_name,
        product.brand,
        product.source,
        product.region_hint
      );
      console.log('[ownership] Knowledge agent result:', ownership);
      
      // Check if knowledge agent found a confident result
      const hasConfidentResult = ownership.financial_beneficiary && 
                                ownership.financial_beneficiary !== 'Unknown' &&
                                ownership.confidence_score >= 50;
      
      // If knowledge agent failed, try ownership research agent
      if (!hasConfidentResult) {
        console.log('[ownership] Knowledge agent failed, trying ownership research agent...');
        
        try {
          const researchResult = await AgentOwnershipResearch({
            barcode,
            product_name: product.product_name,
            brand: product.brand,
            hints: {
              country_of_origin: product.region_hint
            },
            enableEvaluation: true
          });
          
          console.log('[ownership] Ownership research agent result:', researchResult);
          
          // Use research result if it's more confident
          if (researchResult.confidence_score > ownership.confidence_score) {
            ownership = researchResult;
            ownershipSource = 'agent_research';
          }
        } catch (researchErr) {
          console.error('[ownership] Ownership research agent error:', researchErr);
          // Continue with knowledge agent result
        }
      }
      
    } catch (err) {
      console.error('[ownership] Knowledge agent error:', err);
      
      // Try ownership research agent as fallback
      console.log('[ownership] Knowledge agent failed, trying ownership research agent as fallback...');
      
      try {
        ownership = await AgentOwnershipResearch({
          barcode,
          product_name: product.product_name,
          brand: product.brand,
          hints: {
            country_of_origin: product.region_hint
          },
          enableEvaluation: true
        });
        
        ownershipSource = 'agent_research';
        console.log('[ownership] Ownership research agent fallback result:', ownership);
      } catch (researchErr) {
        console.error('[ownership] Ownership research agent fallback error:', researchErr);
        
        // Return error response
        return NextResponse.json({
          success: false,
          error: 'Unable to research ownership for this product.',
        }, { status: 500 });
      }
    }

    // 5. Combine product and ownership
    const newProduct = {
      barcode,
      product_name: product.product_name || null,
      brand: product.brand || null,
      financial_beneficiary: ownership.financial_beneficiary || null,
      beneficiary_country: ownership.beneficiary_country || null,
      confidence_score: ownership.confidence_score || null,
      ownership_structure_type: ownership.ownership_structure_type || null,
      user_contributed: false,
      inferred: true,
    };

    // 6. Upsert into Supabase
    const { data: upserted, error: upsertError } = await supabase
      .from('products')
      .upsert([newProduct], { onConflict: 'barcode' })
      .select()
      .maybeSingle();
    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    // 7. Prepare response with additional metadata
    const resultType = ownershipSource === 'agent_research' ? 'agent-inferred' : 'ai';
    
    const responseData = {
      success: true,
      ...upserted,
      result_type: resultType,
      user_contributed: false,
      ownership_flow: ownership.ownership_flow || product.ownership_flow || null,
      beneficiary_flag: ownership.beneficiary_flag || getCountryFlag(ownership.beneficiary_country),
      verification_status: getVerificationStatus(ownership.confidence_score),
      reasoning: ownership.reasoning || null,
      sources: ownership.sources || product.sources || ['AI analysis'],
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error('[pipeline] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 });
  }
}

// Helper function to get country flag emoji
function getCountryFlag(country: string | null): string | null {
  if (!country) return null;
  
  const flagMap: { [key: string]: string } = {
    'Sweden': '🇸🇪',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Netherlands': '🇳🇱',
    'Switzerland': '🇨🇭',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Denmark': '🇩🇰',
    'Norway': '🇳🇴',
    'Finland': '🇫🇮',
  };
  
  return flagMap[country] || '🏳️';
}

// Helper function to get verification status
function getVerificationStatus(confidenceScore: number | null): string | null {
  if (!confidenceScore) return null;
  
  if (confidenceScore >= 80) return 'Verified';
  if (confidenceScore >= 60) return 'Likely';
  if (confidenceScore >= 40) return 'Possible';
  return 'Uncertain';
} 