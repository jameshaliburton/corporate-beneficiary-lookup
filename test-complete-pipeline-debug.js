#!/usr/bin/env node

/**
 * Comprehensive pipeline test that traces:
 * 1. API request/response
 * 2. Database writes and cache persistence
 * 3. LLM narrative creation and story generation
 * 4. Disambiguation flows
 * 5. Result normalization and frontend field mapping
 */

// Use built-in fetch (Node 18+) or require node-fetch for older versions
const fetch = globalThis.fetch || require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testCompletePipeline() {
  console.log("🔬 COMPREHENSIVE PIPELINE ANALYSIS");
  console.log("=".repeat(80));
  
  // Test 1: Manual search with known brand
  console.log("\n📋 TEST 1: Manual Search - Samsung");
  console.log("-".repeat(50));
  
  const manualResult = await testManualSearch();
  await analyzeResult(manualResult, "Manual Search");
  
  // Test 2: Image search with ambiguous result
  console.log("\n📋 TEST 2: Image Search - Ambiguous Brand");
  console.log("-".repeat(50));
  
  const imageResult = await testImageSearch();
  await analyzeResult(imageResult, "Image Search");
  
  // Test 3: Disambiguation flow
  console.log("\n📋 TEST 3: Disambiguation Flow");
  console.log("-".repeat(50));
  
  const disambigResult = await testDisambiguationFlow();
  await analyzeResult(disambigResult, "Disambiguation");
  
  // Test 4: Database persistence check
  console.log("\n📋 TEST 4: Database Persistence Check");
  console.log("-".repeat(50));
  
  await testDatabasePersistence();
  
  console.log("\n🏁 COMPREHENSIVE ANALYSIS COMPLETE");
  console.log("=".repeat(80));
}

async function testManualSearch() {
  const testData = {
    brand: "Samsung",
    product_name: "",
    barcode: "",
    user_context: "Comprehensive pipeline test"
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("❌ Manual search failed:", error.message);
    return null;
  }
}

async function testImageSearch() {
  const testImages = [
    'public/IMG_9739.png',
    'public/IMG_9740.png', 
    'public/IMG_9741.png',
    'public/IMG_9742.png'
  ];
  
  let imagePath = null;
  for (const img of testImages) {
    if (fs.existsSync(img)) {
      imagePath = img;
      break;
    }
  }
  
  if (!imagePath) {
    console.log("❌ No test images found");
    return null;
  }
  
  try {
    const form = new FormData();
    form.append('brand', '');
    form.append('product_name', '');
    form.append('barcode', '');
    form.append('user_context', 'Comprehensive pipeline test');
    form.append('image', fs.createReadStream(imagePath));
    
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      body: form
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("❌ Image search failed:", error.message);
    return null;
  }
}

async function testDisambiguationFlow() {
  // Test with a brand that should trigger disambiguation
  const testData = {
    brand: "Valve", // Known ambiguous brand
    product_name: "",
    barcode: "",
    user_context: "Testing disambiguation flow"
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("❌ Disambiguation test failed:", error.message);
    return null;
  }
}

async function testDatabasePersistence() {
  // Test the same brand again to see if it hits cache
  console.log("🔄 Testing cache persistence - searching Samsung again...");
  
  const testData = {
    brand: "Samsung",
    product_name: "",
    barcode: "",
    user_context: "Cache persistence test"
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log("📊 Cache Persistence Analysis:");
    console.log(`  Cache Hit: ${result.trace?.cache_hit || 'unknown'}`);
    console.log(`  Cache Decider: ${result.trace?.cache_decider || 'unknown'}`);
    console.log(`  Orchestrator Path: ${result.trace?.orchestrator_path || 'unknown'}`);
    console.log(`  DB Cache Type: ${result.trace?.db_cache?.cache_hit_type || 'unknown'}`);
    console.log(`  TTL Remaining: ${result.trace?.db_cache?.ttl_remaining_sec || 'unknown'} seconds`);
    
    return result;
  } catch (error) {
    console.error("❌ Cache persistence test failed:", error.message);
    return null;
  }
}

async function analyzeResult(result, testType) {
  if (!result) {
    console.log(`❌ ${testType}: No result received`);
    return;
  }
  
  console.log(`✅ ${testType}: Response received`);
  console.log(`  Success: ${result.success}`);
  console.log(`  Financial Beneficiary: ${result.financial_beneficiary || 'undefined'}`);
  console.log(`  Confidence Score: ${result.confidence_score || 'undefined'}`);
  console.log(`  Result Type: ${result.result_type || 'undefined'}`);
  
  // Analyze narrative generation
  console.log(`📝 Narrative Generation:`);
  console.log(`  Story: ${result.story ? 'Present' : 'Missing'} (${result.story?.length || 0} chars)`);
  console.log(`  Headline: ${result.headline ? 'Present' : 'Missing'} (${result.headline?.length || 0} chars)`);
  console.log(`  Tagline: ${result.tagline ? 'Present' : 'Missing'} (${result.tagline?.length || 0} chars)`);
  console.log(`  Behind the Scenes: ${result.behind_the_scenes ? 'Present' : 'Missing'} (${result.behind_the_scenes?.length || 0} items)`);
  console.log(`  Ownership Notes: ${result.ownership_notes ? 'Present' : 'Missing'} (${result.ownership_notes?.length || 0} items)`);
  
  // Analyze disambiguation
  if (result.ambiguous_results && result.ambiguous_results.length > 0) {
    console.log(`🎯 Disambiguation:`);
    console.log(`  Ambiguous Results: ${result.ambiguous_results.length} options`);
    console.log(`  First Option: ${result.ambiguous_results[0]?.brand || 'unknown'}`);
    console.log(`  Action: ${result.action || 'none'}`);
  } else {
    console.log(`🎯 Disambiguation: No ambiguous results`);
  }
  
  // Analyze database operations
  console.log(`💾 Database Operations:`);
  console.log(`  Cache Hit: ${result.trace?.cache_hit || 'unknown'}`);
  console.log(`  Cache Decider: ${result.trace?.cache_decider || 'unknown'}`);
  console.log(`  Cache Reads: ${result.trace?.cache_reads || 0}`);
  console.log(`  Cache Writes: ${result.trace?.cache_writes || 0}`);
  console.log(`  DB Cache Type: ${result.trace?.db_cache?.cache_hit_type || 'none'}`);
  console.log(`  DB Read Time: ${result.trace?.db_cache?.db_read_ms || 0}ms`);
  console.log(`  DB Write Time: ${result.trace?.db_cache?.db_write_ms || 0}ms`);
  
  // Analyze LLM operations
  console.log(`🤖 LLM Operations:`);
  console.log(`  LLM Status: ${result.trace?.llm?.status || 'unknown'}`);
  console.log(`  Agent Used: ${result.trace?.agent_used || 'unknown'}`);
  console.log(`  Model Used: ${result.trace?.model_used || 'unknown'}`);
  console.log(`  Execution Time: ${result.trace?.execution_time_ms || 0}ms`);
  
  // Analyze result normalization
  console.log(`🔧 Result Normalization:`);
  console.log(`  Validation Passed: ${result.trace?.validation_passed || 'unknown'}`);
  console.log(`  Frontend Fields Added: ${result.trace?.frontend_fields_added || 'unknown'}`);
  console.log(`  Orchestrator Path: ${result.trace?.orchestrator_path || 'unknown'}`);
  
  // Check for issues
  const issues = [];
  if (result.financial_beneficiary === "Unknown owner" || result.financial_beneficiary === "AMBIGUOUS_OWNERSHIP") {
    issues.push("Placeholder/ambiguous ownership data");
  }
  if (result.confidence_score === 0 || result.confidence_score === undefined) {
    issues.push("Zero/undefined confidence score");
  }
  if (!result.ownership_flow || result.ownership_flow.length === 0) {
    issues.push("Empty ownership flow");
  }
  if (!result.story && !result.headline) {
    issues.push("Missing narrative content");
  }
  if (result.trace?.validation_passed === false) {
    issues.push("Validation failed");
  }
  
  if (issues.length > 0) {
    console.log(`🚨 ISSUES DETECTED:`);
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log(`✅ No issues detected`);
  }
}

// Run the comprehensive test
testCompletePipeline().then(() => {
  console.log("\n📋 Check server logs for detailed diagnostic information:");
  console.log("  - [LOOKUP INTAKE] - Request intake details");
  console.log("  - [VISION_INTEGRATION] - Vision processing");
  console.log("  - [LLM_CONTEXT] - Context building for LLM");
  console.log("  - [OWNERSHIP_AGENT RESPONSE] - Agent response");
  console.log("  - [SAVE_TO_CACHE] - Cache save operations");
  console.log("  - [PIPELINE TRACE] - Complete pipeline flow");
});
