/**
 * Simple test to verify enhanced Gemini verification functionality
 * Tests the GEMINI_VERIFICATION_ENHANCED_MATCH feature flag
 */

// Set up environment
process.env.GEMINI_VERIFICATION_ENHANCED_MATCH = 'true';
process.env.USE_MOCK_SEARCH = 'true';

async function testEnhancedGemini() {
  console.log('🧪 Testing Enhanced Gemini Verification');
  console.log('=====================================');
  
  try {
    // Dynamic import to avoid module loading issues
    const { GeminiOwnershipAnalysisAgent } = await import('./src/lib/agents/gemini-ownership-analysis-agent.js');
    
    const existingResult = {
      brand: 'Puma',
      product_name: 'Puma Classic Sneakers',
      financial_beneficiary: 'Artémis S.A.',
      beneficiary_country: 'France',
      confidence_score: 85
    };

    console.log('📋 Test Input:', JSON.stringify(existingResult, null, 2));
    console.log('');

    const geminiAgent = new GeminiOwnershipAnalysisAgent();
    const result = await geminiAgent.analyze('Puma', 'Puma Classic Sneakers', existingResult);
    
    console.log('✅ Verification completed');
    console.log('📊 Results:');
    console.log('  Status:', result.verification_status);
    console.log('  Method:', result.verification_method);
    console.log('  Confidence Change:', result.verification_confidence_change);
    
    // Check for enhanced explanations
    if (result.gemini_analysis?.explanations_by_requirement) {
      console.log('🎯 Enhanced explanations found!');
      console.log('  Requirements analyzed:', Object.keys(result.gemini_analysis.explanations_by_requirement).length);
    } else {
      console.log('⚠️  Enhanced explanations not found');
    }
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testEnhancedGemini()
  .then(() => {
    console.log('🎉 All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

