#!/usr/bin/env node

/**
 * Test script to debug brand validation issues
 * Tests with known problematic brand names from vision extraction
 */

// Use built-in fetch (Node 18+) or require node-fetch for older versions
const fetch = globalThis.fetch || require('node-fetch');

async function testBrandValidation() {
  console.log("🔍 BRAND VALIDATION DEBUG TEST");
  console.log("=".repeat(60));
  
  // Test cases from vision extraction
  const testBrands = [
    "Jord notter",
    "Clave Denia, S.A.",
    "ale-hop.org",
    "CLAVE DENIA, S.A.",
    "Clave Denia",
    "Samsung", // Control case
    "", // Empty case
    "   ", // Whitespace case
  ];
  
  for (const brand of testBrands) {
    console.log(`\n🧪 Testing brand: "${brand}"`);
    console.log("-".repeat(40));
    
    try {
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand,
          product_name: "",
          barcode: "",
          user_context: `Testing brand validation for: ${brand}`
        })
      });
      
      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const result = await response.json();
      
      console.log(`✅ Response received:`);
      console.log(`  Success: ${result.success}`);
      console.log(`  Result Type: ${result.result_type}`);
      console.log(`  Financial Beneficiary: ${result.financial_beneficiary || 'undefined'}`);
      console.log(`  Confidence Score: ${result.confidence_score || 'undefined'}`);
      
      if (result.trace) {
        console.log(`  Validation Passed: ${result.trace.validation_passed}`);
        console.log(`  Orchestrator Path: ${result.trace.orchestrator_path}`);
        console.log(`  Agent Used: ${result.trace.agent_used}`);
      }
      
      // Check for validation issues
      if (result.result_type === "input_invalid") {
        console.log(`🚨 VALIDATION FAILED:`);
        console.log(`  Error: ${result.error || 'unknown'}`);
        console.log(`  Message: ${result.message || 'none'}`);
        console.log(`  Raw Brand: ${result.raw_brand || 'none'}`);
      } else if (result.success) {
        console.log(`✅ VALIDATION PASSED - Pipeline completed successfully`);
      } else {
        console.log(`⚠️  VALIDATION PASSED but pipeline failed`);
      }
      
    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
    }
  }
  
  console.log("\n🏁 Brand validation test completed");
  console.log("Check server logs for [VALIDATION] diagnostic information");
}

// Run the test
testBrandValidation();
