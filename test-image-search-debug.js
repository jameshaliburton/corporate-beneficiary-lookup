#!/usr/bin/env node

/**
 * Test script to debug image-based search pipeline
 * Tests image upload to trace vision integration and ownership pipeline
 */

// Use built-in fetch (Node 18+) or require node-fetch for older versions
const fetch = globalThis.fetch || require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageSearch() {
  console.log("🧪 Testing image-based search...");
  console.log("=".repeat(60));
  
  // Look for test images in the public directory
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
    console.log("❌ No test images found in public directory");
    console.log("Available images:", testImages);
    return;
  }
  
  console.log(`📸 Using test image: ${imagePath}`);
  
  try {
    const form = new FormData();
    form.append('brand', ''); // Let vision extract the brand
    form.append('product_name', '');
    form.append('barcode', '');
    form.append('user_context', 'Testing image-based search pipeline');
    form.append('image', fs.createReadStream(imagePath));
    
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      body: form
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
      console.log("This suggests the vision pipeline or ownership research is not working correctly.");
    } else {
      console.log("\n✅ SUCCESS: Real data returned!");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testImageSearch().then(() => {
  console.log("\n🏁 Test completed. Check the server logs for detailed diagnostic information.");
  console.log("Look for these log markers:");
  console.log("- [LOOKUP INTAKE] - Request intake details");
  console.log("- [VISION_INTEGRATION] - Vision processing and brand extraction");
  console.log("- [LLM_CONTEXT] - Context building for LLM");
  console.log("- [OWNERSHIP_AGENT RESPONSE] - Agent response");
  console.log("- [SAVE_TO_CACHE] - Cache save operations");
});
