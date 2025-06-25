import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { lookupProduct } from '@/lib/apis/barcode-lookup.js';
import { getOwnershipKnowledge } from '@/lib/agents/knowledge-agent.js';
import { AgentOwnershipResearch } from '@/lib/agents/ownership-research-agent.js';
import { generateQueryId } from '@/lib/agents/ownership-research-agent.js';
import { emitProgress } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode, product_name, brand, hints = {}, evaluation_mode = false } = body;

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
    }

    // Generate a unique query ID for progress tracking
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Emit initial progress
    await emitProgress(queryId, 'start', 'started', { barcode, brand });

    try {
      // Step 1: Barcode lookup
      await emitProgress(queryId, 'barcode_lookup', 'started', { barcode });
      const barcodeData = await lookupProduct(barcode);
      await emitProgress(queryId, 'barcode_lookup', 'completed', barcodeData);

      // Step 2: Ownership research
      await emitProgress(queryId, 'ownership_research', 'started', { brand, product_name });
      
      // Enable evaluation logging if requested
      if (evaluation_mode) {
        process.env.ENABLE_EVALUATION_LOGGING = 'true';
      }
      
      const ownershipResult = await AgentOwnershipResearch({
        barcode,
        product_name: product_name || barcodeData.product_name,
        brand: brand || barcodeData.brand,
        hints,
        enableEvaluation: evaluation_mode
      });
      
      // Reset evaluation logging
      if (evaluation_mode) {
        process.env.ENABLE_EVALUATION_LOGGING = 'false';
      }
      
      await emitProgress(queryId, 'ownership_research', 'completed', ownershipResult);

      // Step 3: Final result
      await emitProgress(queryId, 'complete', 'completed', { success: true });

      // Merge barcode data and ownership result into a flat structure
      const mergedResult = {
        success: true,
        product_name: product_name || barcodeData.product_name,
        brand: brand || barcodeData.brand,
        barcode: barcode,
        financial_beneficiary: ownershipResult.financial_beneficiary,
        beneficiary_country: ownershipResult.beneficiary_country,
        beneficiary_flag: ownershipResult.beneficiary_flag,
        confidence_score: ownershipResult.confidence_score,
        ownership_structure_type: ownershipResult.ownership_structure_type,
        ownership_flow: ownershipResult.ownership_flow,
        sources: ownershipResult.sources,
        reasoning: ownershipResult.reasoning,
        result_type: ownershipResult.result_type,
        user_contributed: !!(product_name || brand),
        agent_execution_trace: ownershipResult.agent_execution_trace,
        query_id: queryId
      };

      return NextResponse.json(mergedResult);

    } catch (error) {
      console.error('Error in ownership research:', error);
      await emitProgress(queryId, 'error', 'error', { error: error.message });
      
      return NextResponse.json({
        success: false,
        query_id: queryId,
        error: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json({
      success: false,
      error: 'Invalid request format'
    }, { status: 400 });
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