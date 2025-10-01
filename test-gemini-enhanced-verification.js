/**
 * Unit test for enhanced Gemini verification with Puma brand
 * Tests the GEMINI_VERIFICATION_ENHANCED_MATCH feature flag functionality
 */

import { GeminiOwnershipAnalysisAgent } from './src/lib/agents/gemini-ownership-analysis-agent.js';

// Mock environment variables
process.env.GEMINI_VERIFICATION_ENHANCED_MATCH = 'true';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
process.env.USE_MOCK_SEARCH = 'true'; // Use mock data for testing

async function testPumaVerification() {
  console.log('🧪 Testing Enhanced Gemini Verification with Puma Brand');
  console.log('====================================================');
  
  try {
    // Test data for Puma
    const existingResult = {
      brand: 'Puma',
      product_name: 'Puma Classic Sneakers',
      financial_beneficiary: 'Artémis S.A.',
      beneficiary_country: 'France',
      confidence_score: 85,
      ownership_structure_type: 'public_company',
      sources: ['wikipedia.org', 'investors.puma.com'],
      reasoning: 'Puma SE is controlled by Artémis S.A., the investment vehicle of the Pinault family'
    };

    console.log('📋 Test Input:');
    console.log(JSON.stringify(existingResult, null, 2));
    console.log('');

    // Initialize Gemini agent
    const geminiAgent = new GeminiOwnershipAnalysisAgent();
    
    console.log('🔍 Running Gemini verification...');
    const startTime = Date.now();
    
    const result = await geminiAgent.analyze(
      existingResult.brand,
      existingResult.product_name,
      existingResult
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ Verification completed in', duration, 'ms');
    console.log('');

    // Display results
    console.log('📊 Verification Results:');
    console.log('========================');
    console.log('Verification Status:', result.verification_status);
    console.log('Verification Method:', result.verification_method);
    console.log('Confidence Change:', result.verification_confidence_change);
    console.log('Verification Notes:', result.verification_notes);
    console.log('');

    // Display evidence analysis
    if (result.verification_evidence) {
      console.log('🔍 Evidence Analysis:');
      console.log('====================');
      console.log('Supporting Evidence Count:', result.verification_evidence.supporting_evidence?.length || 0);
      console.log('Contradicting Evidence Count:', result.verification_evidence.contradicting_evidence?.length || 0);
      console.log('Neutral Evidence Count:', result.verification_evidence.neutral_evidence?.length || 0);
      console.log('Missing Evidence Count:', result.verification_evidence.missing_evidence?.length || 0);
      console.log('');

      if (result.verification_evidence.supporting_evidence?.length > 0) {
        console.log('✅ Supporting Evidence:');
        result.verification_evidence.supporting_evidence.forEach((evidence, index) => {
          console.log(`  ${index + 1}. ${evidence}`);
        });
        console.log('');
      }

      if (result.verification_evidence.missing_evidence?.length > 0) {
        console.log('❌ Missing Evidence:');
        result.verification_evidence.missing_evidence.forEach((evidence, index) => {
          console.log(`  ${index + 1}. ${evidence}`);
        });
        console.log('');
      }
    }

    // Display enhanced explanations if available
    if (result.gemini_analysis?.explanations_by_requirement) {
      console.log('🎯 Enhanced Explanations by Requirement:');
      console.log('========================================');
      
      const explanations = result.gemini_analysis.explanations_by_requirement;
      
      Object.entries(explanations).forEach(([requirement, explanation]) => {
        console.log(`\n📋 ${requirement.replace(/_/g, ' ').toUpperCase()}:`);
        console.log(`   Status: ${explanation.status}`);
        console.log(`   Evidence Quality: ${explanation.evidence_quality}`);
        console.log(`   Explanation: ${explanation.explanation}`);
        
        if (explanation.supporting_snippets?.length > 0) {
          console.log(`   Supporting Snippets: ${explanation.supporting_snippets.length}`);
        }
        
        if (explanation.contradicting_snippets?.length > 0) {
          console.log(`   Contradicting Snippets: ${explanation.contradicting_snippets.length}`);
        }
        
        if (explanation.missing_information?.length > 0) {
          console.log(`   Missing Information: ${explanation.missing_information.length}`);
        }
      });
      console.log('');
    }

    // Display confidence assessment
    if (result.confidence_assessment) {
      console.log('📈 Confidence Assessment:');
      console.log('=========================');
      console.log('Original Confidence:', result.confidence_assessment.original_confidence);
      console.log('Verified Confidence:', result.confidence_assessment.verified_confidence);
      console.log('Confidence Change:', result.confidence_assessment.confidence_change);
      console.log('');
    }

    // Test summary
    console.log('📝 Test Summary:');
    console.log('================');
    console.log('✅ Enhanced verification feature flag enabled:', process.env.GEMINI_VERIFICATION_ENHANCED_MATCH === 'true');
    console.log('✅ Verification completed successfully:', !!result.verification_status);
    console.log('✅ Evidence analysis present:', !!result.verification_evidence);
    console.log('✅ Enhanced explanations present:', !!result.gemini_analysis?.explanations_by_requirement);
    console.log('✅ Debug logging enabled:', result.gemini_debug_metadata ? 'Yes' : 'No');
    
    if (result.gemini_analysis?.explanations_by_requirement) {
      const requirements = Object.keys(result.gemini_analysis.explanations_by_requirement);
      console.log('✅ Requirements analyzed:', requirements.length, '(', requirements.join(', '), ')');
    }
    
    console.log('');
    console.log('🎉 Test completed successfully!');
    
    return result;

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testPumaVerification()
    .then(() => {
      console.log('✅ All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testPumaVerification };

