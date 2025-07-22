const fs = require('fs');
const path = require('path');

// Test vision-first pipeline configuration
console.log('🧪 Testing Vision-First Pipeline Configuration...\n');

// Check environment variables
const envVars = [
  'ENABLE_VISION_FIRST_PIPELINE',
  'ENABLE_LEGACY_BARCODE', 
  'VISION_CONFIDENCE_THRESHOLD',
  'FORCE_FULL_TRACE',
  'ENABLE_ENHANCED_IMAGE_PROCESSING',
  'ENABLE_OCR_EXTRACTION',
  'ENABLE_IMAGE_BARCODE_SCANNING'
];

console.log('📋 Environment Variables:');
envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`  ${varName}: ${value || '❌ Not set'}`);
});

// Test API endpoint
async function testVisionFirstAPI() {
  console.log('\n🔍 Testing Vision-First API Endpoint...');
  
  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: testImageBase64,
        evaluation_mode: true
      })
    });

    const data = await response.json();
    
    console.log('✅ API Response:');
    console.log(`  Success: ${data.success}`);
    console.log(`  Pipeline Type: ${data.pipeline_type || 'Not specified'}`);
    console.log(`  Vision Context: ${data.vision_context ? 'Present' : 'Not present'}`);
    
    if (data.vision_context) {
      console.log(`  Vision Success: ${data.vision_context.isSuccessful}`);
      console.log(`  Vision Confidence: ${data.vision_context.confidence}%`);
      console.log(`  Extracted Brand: ${data.vision_context.brand}`);
      console.log(`  Extracted Product: ${data.vision_context.productName}`);
    }
    
    if (data.agent_execution_trace) {
      console.log(`  Trace ID: ${data.agent_execution_trace.trace_id}`);
      console.log(`  Stages: ${data.agent_execution_trace.stages?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

// Test feature flags
function testFeatureFlags() {
  console.log('\n🎛️ Testing Feature Flags...');
  
  try {
    const featureFlagsPath = path.join(__dirname, 'src/lib/config/feature-flags.ts');
    const featureFlagsContent = fs.readFileSync(featureFlagsPath, 'utf8');
    
    const flags = [
      'ENABLE_VISION_FIRST_PIPELINE',
      'ENABLE_LEGACY_BARCODE',
      'VISION_CONFIDENCE_THRESHOLD',
      'FORCE_FULL_TRACE'
    ];
    
    flags.forEach(flag => {
      const isEnabled = featureFlagsContent.includes(`${flag}: true`);
      console.log(`  ${flag}: ${isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    });
    
  } catch (error) {
    console.error('❌ Feature flags test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  testFeatureFlags();
  await testVisionFirstAPI();
  
  console.log('\n✅ Vision-First Pipeline Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('  1. Upload a real product image to test vision extraction');
  console.log('  2. Check the browser console for detailed logs');
  console.log('  3. Verify vision context appears in the result screen');
}

runTests().catch(console.error); 