#!/usr/bin/env node

/**
 * Test script to debug manual search pipeline
 * Tests the "Samsung" manual search to trace where the pipeline breaks
 */

// Use built-in fetch (Node 18+) or require node-fetch for older versions
const fetch = globalThis.fetch || require('node-fetch');

async function testManualSearch() {
  console.log("🧪 Testing manual search for 'Samsung'...");
  console.log("=".repeat(60));
  
  const testData = {
    brand: "Samsung",
    product_name: "",
    barcode: "",
    user_context: "Testing manual search pipeline"
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log("✅ Response received:");
    console.log("Success:", result.success);
    console.log("Financial Beneficiary:", result.financial_beneficiary);
    console.log("Confidence Score:", result.confidence_score);
    console.log("Result Type:", result.result_type);
    
    if (result.trace) {
      console.log("\n🔍 Trace Information:");
      console.log("Cache Decider:", result.trace.cache_decider);
      console.log("Orchestrator Path:", result.trace.orchestrator_path);
      console.log("LLM Status:", result.trace.llm?.status);
      console.log("Pipeline Result Type:", result.trace.pipeline?.result_type);
    }
    
    // Check if we got placeholder data
    if (result.financial_beneficiary === "Unknown owner" || 
        result.confidence_score === 0 ||
        !result.ownership_flow ||
        result.ownership_flow.length === 0) {
      console.log("\n🚨 ISSUE DETECTED: Placeholder data returned!");
      console.log("This suggests the pipeline is not working correctly.");
    } else {
      console.log("\n✅ SUCCESS: Real data returned!");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testManualSearch().then(() => {
  console.log("\n🏁 Test completed. Check the server logs for detailed diagnostic information.");
  console.log("Look for these log markers:");
  console.log("- [LOOKUP INTAKE] - Request intake details");
  console.log("- [VISION_INTEGRATION] - Vision processing (should be skipped for manual search)");
  console.log("- [LLM_CONTEXT] - Context building for LLM");
  console.log("- [OWNERSHIP_AGENT RESPONSE] - Agent response");
  console.log("- [SAVE_TO_CACHE] - Cache save operations");
});
