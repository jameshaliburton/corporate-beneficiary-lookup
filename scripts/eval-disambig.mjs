#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { equivalentIdOrName } from '../src/lib/eval/match.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load seed files
const ambiguousSeeds = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/seeds/brands.ambiguous.json'), 'utf8'));
const nonAmbiguousSeeds = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/seeds/brands.nonAmbiguous.json'), 'utf8'));

const API_BASE = 'http://localhost:3000/api/lookup';

// Parse command line arguments
const args = process.argv.slice(2);
let csvPath = 'eval/out/report.csv';
let summaryPath = 'eval/out/summary.json';

for (let i = 0; i < args.length; i += 2) {
  if (args[i] === '--out' && args[i + 1]) {
    csvPath = args[i + 1];
  } else if (args[i] === '--summary' && args[i + 1]) {
    summaryPath = args[i + 1];
  }
}

// Helper to pick random item from array
function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to extract entity ID from response
function extractChosenId(response) {
  // First check if there's a chosen entity ID in trace
  if (response.trace?.chosen_entity_id) {
    return response.trace.chosen_entity_id;
  }
  
  // If no disambiguation options, extract from financial beneficiary
  if (!response.trace?.disambiguation_options || response.trace.disambiguation_options.length <= 1) {
    if (response.financial_beneficiary) {
      return response.financial_beneficiary.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
  }
  
  return null;
}

// Helper to extract entity name from response
function extractChosenName(response) {
  if (response.financial_beneficiary) {
    return response.financial_beneficiary;
  }
  return null;
}

// Helper to compute score gap
function computeScoreGap(scoring) {
  if (!scoring?.candidates || scoring.candidates.length < 2) return 0;
  const top = scoring.candidates[0]?.adjusted || 0;
  const second = scoring.candidates[1]?.adjusted || 0;
  return top - second;
}

// Test a single brand
async function testBrand(brand, type, truth = null, ocrExamples = []) {
  const requestBody = {
    brand: brand.brand
  };
  
  // Add entityId if provided
  if (brand.entityId) {
    requestBody.chosen_entity_id = brand.entityId;
  }
  
  // Add OCR text if available
  if (ocrExamples && ocrExamples.length > 0) {
    requestBody.ocr_text = pickOne(ocrExamples);
  }
  
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract metrics
    const accepted = !data.trace?.disambiguation_options || data.trace.disambiguation_options.length <= 1;
    const chosenId = accepted ? extractChosenId(data) : null;
    const chosenName = accepted ? extractChosenName(data) : null;
    const optsLen = data.trace?.disambiguation_options?.length || 0;
    const langCodes = data.trace?.language?.detected_codes || [];
    const rules = data.trace?.decision_rules?.slice(0, 3) || [];
    const gap = computeScoreGap(data.trace?.scoring);
    
    // Extract new cache/RAG metrics
    const cacheEntityHit = data.trace?.cache?.entity_hit || false;
    const brandCacheHit = data.trace?.cache?.brand_hit || false;
    const candidateCount = data.trace?.candidate_count || 0;
    const sourcesCache = data.trace?.sources?.cache || false;
    const sourcesRag = data.trace?.sources?.rag || false;
    const sourcesDb = data.trace?.sources?.db || false;
    const scoreGap = data.trace?.score_gap || null;
    const ragUsed = data.trace?.rag?.used || false;
    
    // Compute accuracy metrics if truth is available
    let correctAccept = null;
    let wrongAccept = null;
    let shouldDisambiguate = null;
    let normalizedMatch = null;
    let matchMethod = null;
    
    if (truth?.id) {
      // Use tolerant matching
      const eq = equivalentIdOrName(chosenId, chosenName, truth.id, truth.name);
      normalizedMatch = eq.match;
      matchMethod = eq.method;
      
      correctAccept = accepted && eq.match;
      wrongAccept = accepted && !eq.match;
      shouldDisambiguate = !accepted && optsLen >= 2;
    }
    
    return {
      brand: brand.brand,
      type,
      accepted,
      optsLen,
      chosenId,
      truthId: truth?.id || null,
      correctAccept,
      wrongAccept,
      shouldDisambiguate,
      normalizedMatch,
      matchMethod,
      cacheEntityHit,
      brandCacheHit,
      candidateCount,
      sourcesCache,
      sourcesRag,
      sourcesDb,
      ragUsed,
      scoreGap: scoreGap ? scoreGap.toFixed(3) : '',
      langCodes: langCodes.join(','),
      gap: gap.toFixed(3),
      rules: rules.join('; ')
    };
    
  } catch (error) {
    console.error(`Error testing ${brand.brand}:`, error.message);
    return {
      brand: brand.brand,
      type,
      accepted: false,
      optsLen: 0,
      chosenId: null,
      truthId: truth?.id || null,
      correctAccept: null,
      wrongAccept: null,
      shouldDisambiguate: null,
      normalizedMatch: null,
      matchMethod: null,
      cacheEntityHit: false,
      brandCacheHit: false,
      candidateCount: 0,
      sourcesCache: false,
      sourcesRag: false,
      sourcesDb: false,
      ragUsed: false,
      scoreGap: '',
      langCodes: '',
      gap: '0.000',
      rules: '',
      error: error.message
    };
  }
}

// Main evaluation
async function runEvaluation() {
  console.log('Starting disambiguation evaluation...');
  
  const results = [];
  
  // Test ambiguous brands (two-pass: first call, then with entityId)
  for (const brand of ambiguousSeeds.brands) {
    console.log(`Testing ambiguous brand: ${brand.brand}`);
    
    // First call - expect disambiguation or accept
    const firstResult = await testBrand(brand, 'ambiguous', brand.truth, brand.ocr_examples);
    results.push(firstResult);
    
    // If disambiguation produced options, test cache hit with first option
    if (firstResult.optsLen >= 2 && process.env.CACHE_ENABLED === 'true') {
      const firstOption = firstResult.chosenId || 'test-entity-id';
      console.log(`Testing cache hit for ${brand.brand} with entityId: ${firstOption}`);
      
      const cacheResult = await testBrand(
        { ...brand, entityId: firstOption }, 
        'ambiguous-cache', 
        brand.truth, 
        brand.ocr_examples
      );
      results.push(cacheResult);
    }
  }
  
  // Test non-ambiguous brands
  for (const brand of nonAmbiguousSeeds.brands) {
    console.log(`Testing non-ambiguous brand: ${brand.brand}`);
    const result = await testBrand(brand, 'non-ambiguous', brand.truth, brand.ocr_examples);
    results.push(result);
  }
  
  // Compute aggregate metrics
  const ambiguousWithTruth = results.filter(r => r.type === 'ambiguous' && r.truthId);
  const nonAmbiguousWithTruth = results.filter(r => r.type === 'non-ambiguous' && r.truthId);
  
  const ambiguousTriggerRate = ambiguousWithTruth.filter(r => r.shouldDisambiguate).length / ambiguousWithTruth.length;
  const wrongAcceptRate = results.filter(r => r.wrongAccept === true).length / results.filter(r => r.wrongAccept !== null).length;
  const correctAcceptRate = results.filter(r => r.correctAccept === true).length / results.filter(r => r.correctAccept !== null).length;
  const abstainRate = results.filter(r => !r.accepted && r.optsLen < 2).length / results.length;
  
  // Calculate new metrics
  const shouldDisambiguateCount = results.filter(r => r.shouldDisambiguate === true).length;
  const wrongAcceptExcludingTies = results.filter(r => r.wrongAccept === true && !r.shouldDisambiguate).length / results.filter(r => r.wrongAccept !== null && !r.shouldDisambiguate).length;
  const idMatchCount = results.filter(r => r.matchMethod === 'id').length;
  const aliasMatchCount = results.filter(r => r.matchMethod === 'alias').length;
  const nameMatchCount = results.filter(r => r.matchMethod === 'name').length;
  
  // Cache and RAG metrics
  const cacheHitRateAfterChoice = results.filter(r => r.cacheEntityHit === true).length / results.filter(r => r.cacheEntityHit !== null).length;
  const brandCacheHitRate = results.filter(r => r.brandCacheHit === true).length / results.length;
  const entityCacheHitRate = results.filter(r => r.cacheEntityHit === true).length / results.length;
  const avgCandidateCount = results.reduce((sum, r) => sum + (r.candidateCount || 0), 0) / results.length;
  const ragUsageRate = results.filter(r => r.sourcesRag === true).length / results.length;
  
  const summary = {
    total_brands: results.length,
    ambiguous_brands: ambiguousSeeds.brands.length,
    non_ambiguous_brands: nonAmbiguousSeeds.brands.length,
    ambiguous_trigger_rate: ambiguousTriggerRate,
    wrong_accept_rate: wrongAcceptRate,
    wrong_accept_excluding_ties: wrongAcceptExcludingTies,
    correct_accept_rate: correctAcceptRate,
    abstain_rate: abstainRate,
    should_disambiguate_count: shouldDisambiguateCount,
    id_match_count: idMatchCount,
    alias_match_count: aliasMatchCount,
    name_match_count: nameMatchCount,
    cache_hit_rate_after_choice: cacheHitRateAfterChoice,
    brand_cache_hit_rate: brandCacheHitRate,
    entity_cache_hit_rate: entityCacheHitRate,
    avg_candidate_count: avgCandidateCount,
    rag_usage_rate: ragUsageRate,
    timestamp: new Date().toISOString()
  };
  
  // Create output directory
  const outDir = path.dirname(csvPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  // Write CSV report
  const csvHeader = 'brand,type,accepted,opts_len,chosen_id,truth_id,correct_accept,wrong_accept,normalized_match,match_method,gap,should_disambiguate,cache_entity_hit,brand_cache_hit,candidate_count,sources_cache,sources_rag,sources_db,rag_used,score_gap,lang_codes,rules\n';
  const csvRows = results.map(r => 
    `${r.brand},${r.type},${r.accepted},${r.optsLen},${r.chosenId || ''},${r.truthId || ''},${r.correctAccept || ''},${r.wrongAccept || ''},${r.normalizedMatch || ''},${r.matchMethod || ''},${r.gap},${r.shouldDisambiguate || ''},${r.cacheEntityHit || ''},${r.brandCacheHit || ''},${r.candidateCount || ''},${r.sourcesCache || ''},${r.sourcesRag || ''},${r.sourcesDb || ''},${r.ragUsed || ''},${r.scoreGap || ''},${r.langCodes},"${r.rules}"`
  ).join('\n');
  
  fs.writeFileSync(csvPath, csvHeader + csvRows);
  
  // Write summary JSON
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n=== EVALUATION RESULTS ===');
  console.log(`Total brands tested: ${results.length}`);
  console.log(`Ambiguous trigger rate: ${(ambiguousTriggerRate * 100).toFixed(1)}%`);
  console.log(`Wrong accept rate: ${(wrongAcceptRate * 100).toFixed(1)}%`);
  console.log(`Wrong accept (excluding ties): ${(wrongAcceptExcludingTies * 100).toFixed(1)}%`);
  console.log(`Correct accept rate: ${(correctAcceptRate * 100).toFixed(1)}%`);
  console.log(`Abstain rate: ${(abstainRate * 100).toFixed(1)}%`);
  console.log(`Match methods - ID: ${idMatchCount}, Alias: ${aliasMatchCount}, Name: ${nameMatchCount}`);
  // Show sample name matches
  const nameMatches = results.filter(r => r.matchMethod === 'name');
  if (nameMatches.length > 0) {
    console.log('\n=== SAMPLE NAME MATCHES ===');
    nameMatches.slice(0, 3).forEach(r => {
      console.log(`${r.brand}: "${r.chosenId}" matches "${r.truthId}"`);
    });
  }
  
  console.log(`\nReports written to:`);
  console.log(`  CSV: ${csvPath}`);
  console.log(`  Summary: ${summaryPath}`);
  
  // Check failure conditions
  const failures = [];
  if (wrongAcceptExcludingTies > 0.10) {
    failures.push(`Wrong accept rate (excluding ties) ${(wrongAcceptExcludingTies * 100).toFixed(1)}% exceeds 10% threshold`);
  }
  if (ambiguousWithTruth.length >= 10 && ambiguousTriggerRate < 0.30) {
    failures.push(`Ambiguous trigger rate ${(ambiguousTriggerRate * 100).toFixed(1)}% below 30% threshold`);
  }
  
  if (failures.length > 0) {
    console.error('\n❌ EVALUATION FAILED:');
    failures.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log('\n✅ EVALUATION PASSED');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEvaluation().catch(console.error);
}
