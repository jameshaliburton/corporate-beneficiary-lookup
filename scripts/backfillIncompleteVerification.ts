#!/usr/bin/env tsx

/**
 * Backfill Script for Incomplete Verification Metadata (ownership-por-v1.1.1)
 * 
 * This script identifies cache entries in the products table that have partial
 * verification metadata and re-runs Gemini verification to complete them.
 * 
 * Target entries:
 * - verification_status IS NOT NULL AND
 * - (verification_method IS NULL OR verified_owner_entity IS NULL)
 */

import { createClient } from '@supabase/supabase-js';
import { GeminiOwnershipAnalysisAgent } from '../src/lib/agents/gemini-ownership-analysis-agent.js';

// Environment setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Gemini availability check
function isGeminiAvailable(): boolean {
  return !!(process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.length > 0);
}

// Main backfill function
async function backfillIncompleteVerification() {
  console.log('🔄 [BACKFILL] Starting incomplete verification metadata backfill...');
  console.log('🔄 [BACKFILL] Target: entries with partial verification metadata');
  
  if (!isGeminiAvailable()) {
    console.error('❌ [BACKFILL] Gemini API key not available. Cannot run verification.');
    process.exit(1);
  }

  try {
    // Query for entries with incomplete verification metadata
    console.log('🔍 [BACKFILL] Querying for incomplete verification entries...');
    
    const { data: incompleteEntries, error: queryError } = await supabase
      .from('products')
      .select('id, brand, product_name, financial_beneficiary, confidence_score, verification_status, verification_method, verified_owner_entity')
      .not('verification_status', 'is', null)
      .or('verification_method.is.null,verified_owner_entity.is.null');

    if (queryError) {
      console.error('❌ [BACKFILL] Error querying incomplete entries:', queryError);
      return;
    }

    if (!incompleteEntries || incompleteEntries.length === 0) {
      console.log('✅ [BACKFILL] No incomplete verification entries found. All entries are fully verified!');
      return;
    }

    console.log(`📊 [BACKFILL] Found ${incompleteEntries.length} entries with incomplete verification metadata`);

    // Process each incomplete entry
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const entry of incompleteEntries) {
      processedCount++;
      console.log(`\n🔄 [BACKFILL] Processing ${processedCount}/${incompleteEntries.length}: ${entry.brand}`);
      console.log(`   [BACKFILL] Current metadata:`, {
        verification_status: entry.verification_status,
        verification_method: entry.verification_method,
        verified_owner_entity: entry.verified_owner_entity
      });

      try {
        // Skip if no beneficiary or low confidence
        if (!entry.financial_beneficiary || entry.financial_beneficiary === 'Unknown' || entry.confidence_score <= 0) {
          console.log(`   [BACKFILL] Skipping ${entry.brand}: no valid beneficiary or low confidence`);
          continue;
        }

        // Run Gemini verification
        console.log(`   [BACKFILL] Re-verifying brand: ${entry.brand}`);
        const geminiAgent = new GeminiOwnershipAnalysisAgent();
        const geminiAnalysis = await geminiAgent.analyze(
          entry.brand,
          entry.product_name || '',
          {
            financial_beneficiary: entry.financial_beneficiary,
            confidence_score: entry.confidence_score,
            beneficiary_country: entry.beneficiary_country || 'Unknown'
          }
        );

        // Update the entry with complete verification metadata
        const updateData = {
          verification_status: geminiAnalysis.verification_status,
          verification_method: geminiAnalysis.verification_method,
          verified_owner_entity: geminiAnalysis.verified_owner_entity,
          verified_at: new Date().toISOString(),
          verification_notes: geminiAnalysis.verification_notes,
          confidence_assessment: geminiAnalysis.confidence_assessment,
          verification_evidence: geminiAnalysis.verification_evidence
        };

        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', entry.id);

        if (updateError) {
          console.error(`   ❌ [BACKFILL] Error updating ${entry.brand}:`, updateError);
          errorCount++;
        } else {
          console.log(`   ✅ [BACKFILL] Updated verification metadata for ${entry.brand}`);
          console.log(`   [BACKFILL] New metadata:`, {
            verification_status: updateData.verification_status,
            verification_method: updateData.verification_method,
            verified_owner_entity: updateData.verified_owner_entity
          });
          successCount++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ [BACKFILL] Error processing ${entry.brand}:`, error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 [BACKFILL] Backfill completed:');
    console.log(`   Total processed: ${processedCount}`);
    console.log(`   Successfully updated: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Skipped: ${processedCount - successCount - errorCount}`);

  } catch (error) {
    console.error('❌ [BACKFILL] Fatal error during backfill:', error);
  }
}

// Run the backfill
if (require.main === module) {
  backfillIncompleteVerification()
    .then(() => {
      console.log('✅ [BACKFILL] Backfill script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ [BACKFILL] Backfill script failed:', error);
      process.exit(1);
    });
}

export { backfillIncompleteVerification };
