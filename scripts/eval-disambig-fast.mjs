#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load seed files
const ambiguousSeeds = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/seeds/brands.ambiguous.json'), 'utf8'));
const nonAmbiguousSeeds = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/seeds/brands.nonAmbiguous.json'), 'utf8'));

const API_BASE = 'http://localhost:3000/api/lookup';

// Test only a subset of brands for faster evaluation
const TEST_BRANDS = [
  // Ambiguous brands (should trigger disambiguation)
  { brand: 'Delta', type: 'ambiguous', truth: { id: 'delta-faucet' } },
  { brand: 'Dove', type: 'ambiguous', truth: { id: 'dove-soap' } },
  { brand: 'Polo', type: 'ambiguous', truth: { id: 'polo-ralph' } },
  
  // Non-ambiguous brands (should not trigger disambiguation)
  { brand: 'Nike', type: 'non-ambiguous', truth: { id: 'nike-inc' } },
  { brand: 'Apple', type: 'non-ambiguous', truth: { id: 'apple-inc' } },
  { brand: 'Samsung', type: 'non-ambiguous', truth: { id: 'samsung-electronics' } }
];

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

// Test a single brand
async function testBrand(brand, type, truth = null) {
  const requestBody = {
    brand: brand.brand
  };
  
  try {
    console.log(`Testing ${type} brand: ${brand.brand}`);
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
    const optsLen = data.trace?.disambiguation_options?.length || 0;
    const langCodes = data.trace?.language?.detected_codes || [];
    const rules = data.trace?.decision_rules?.slice(0, 3) || [];
    const gap = data.trace?.scoring?.candidates?.[0]?.finalScore - data.trace?.scoring?.candidates?.[1]?.finalScore || 0;
    
    // Compute accuracy metrics if truth is available
    let correctAccept = null;
    let wrongAccept = null;
    let shouldDisambiguate = null;
    
    if (truth?.id) {
      correctAccept = accepted && chosenId === truth.id;
      wrongAccept = accepted && chosenId !== truth.id;
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
      langCodes: langCodes.join(','),
      gap: gap.toFixed(3),
      rules: rules.join('; '),
      decisionRules: rules
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
      langCodes: '',
      gap: '0.000',
      rules: '',
      decisionRules: [],
      error: error.message
    };
  }
}

// Main evaluation
async function runEvaluation() {
  console.log('Starting fast disambiguation evaluation...');
  
  const results = [];
  
  // Test selected brands
  for (const brand of TEST_BRANDS) {
    const result = await testBrand(brand, brand.type, brand.truth);
    results.push(result);
  }
  
  // Compute aggregate metrics
  const ambiguousWithTruth = results.filter(r => r.type === 'ambiguous' && r.truthId);
  const nonAmbiguousWithTruth = results.filter(r => r.type === 'non-ambiguous' && r.truthId);
  
  const ambiguousTriggerRate = ambiguousWithTruth.filter(r => r.shouldDisambiguate).length / ambiguousWithTruth.length;
  const wrongAcceptRate = results.filter(r => r.wrongAccept === true).length / results.filter(r => r.wrongAccept !== null).length;
  const correctAcceptRate = results.filter(r => r.correctAccept === true).length / results.filter(r => r.correctAccept !== null).length;
  const abstainRate = results.filter(r => !r.accepted && r.optsLen < 2).length / results.length;
  
  const summary = {
    total_brands: results.length,
    ambiguous_brands: ambiguousWithTruth.length,
    non_ambiguous_brands: nonAmbiguousWithTruth.length,
    ambiguous_trigger_rate: ambiguousTriggerRate,
    wrong_accept_rate: wrongAcceptRate,
    correct_accept_rate: correctAcceptRate,
    abstain_rate: abstainRate,
    timestamp: new Date().toISOString()
  };
  
  // Create output directory
  const outDir = path.join(__dirname, '../eval/out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  // Write CSV report
  const csvHeader = 'brand,type,accepted,opts_len,chosen_id,truth_id,correct_accept,wrong_accept,lang_codes,gap,rules\n';
  const csvRows = results.map(r => 
    `${r.brand},${r.type},${r.accepted},${r.optsLen},${r.chosenId || ''},${r.truthId || ''},${r.correctAccept || ''},${r.wrongAccept || ''},${r.langCodes},${r.gap},"${r.rules}"`
  ).join('\n');
  
  const csvPath = path.join(outDir, 'report-fast.csv');
  fs.writeFileSync(csvPath, csvHeader + csvRows);
  
  // Write summary JSON
  const summaryPath = path.join(outDir, 'summary-fast.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n=== FAST EVALUATION RESULTS ===');
  console.log(`Total brands tested: ${results.length}`);
  console.log(`Ambiguous trigger rate: ${(ambiguousTriggerRate * 100).toFixed(1)}%`);
  console.log(`Wrong accept rate: ${(wrongAcceptRate * 100).toFixed(1)}%`);
  console.log(`Correct accept rate: ${(correctAcceptRate * 100).toFixed(1)}%`);
  console.log(`Abstain rate: ${(abstainRate * 100).toFixed(1)}%`);
  
  // Show example results
  console.log('\n=== EXAMPLE RESULTS ===');
  results.forEach(r => {
    console.log(`${r.brand} (${r.type}): ${r.accepted ? 'ACCEPTED' : 'DISAMBIGUATED'} - ${r.optsLen} options, gap: ${r.gap}`);
    if (r.decisionRules.length > 0) {
      console.log(`  Rules: ${r.decisionRules.join(', ')}`);
    }
  });
  
  console.log(`\nReports written to:`);
  console.log(`  CSV: ${csvPath}`);
  console.log(`  Summary: ${summaryPath}`);
  
  // Check failure conditions
  const failures = [];
  if (wrongAcceptRate > 0.10) {
    failures.push(`Wrong accept rate ${(wrongAcceptRate * 100).toFixed(1)}% exceeds 10% threshold`);
  }
  if (ambiguousWithTruth.length >= 3 && ambiguousTriggerRate < 0.30) {
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
