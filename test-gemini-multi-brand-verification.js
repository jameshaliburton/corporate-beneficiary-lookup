/**
 * Comprehensive test for enhanced Gemini verification with multiple brands
 * Tests: Puma, Nespresso, The Watkins Co., and an obscure brand
 */

import { GeminiOwnershipAnalysisAgent } from './src/lib/agents/gemini-ownership-analysis-agent.js';

// Mock environment variables
process.env.GEMINI_VERIFICATION_ENHANCED_MATCH = 'true';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
process.env.USE_MOCK_SEARCH = 'true'; // Use mock data for testing

const testBrands = [
  {
    name: 'Puma',
    product: 'Puma Classic Sneakers',
    existingResult: {
      brand: 'Puma',
      product_name: 'Puma Classic Sneakers',
      financial_beneficiary: 'Artémis S.A.',
      beneficiary_country: 'France',
      confidence_score: 85,
      ownership_structure_type: 'public_company',
      sources: ['wikipedia.org', 'investors.puma.com'],
      reasoning: 'Puma SE is controlled by Artémis S.A., the investment vehicle of the Pinault family'
    }
  },
  {
    name: 'Nespresso',
    product: 'Nespresso Original Coffee Capsules',
    existingResult: {
      brand: 'Nespresso',
      product_name: 'Nespresso Original Coffee Capsules',
      financial_beneficiary: 'Nestlé S.A.',
      beneficiary_country: 'Switzerland',
      confidence_score: 90,
      ownership_structure_type: 'subsidiary',
      sources: ['nestle.com', 'nespresso.com'],
      reasoning: 'Nespresso is a wholly owned subsidiary of Nestlé S.A.'
    }
  },
  {
    name: 'The Watkins Co.',
    product: 'Watkins Vanilla Extract',
    existingResult: {
      brand: 'The Watkins Co.',
      product_name: 'Watkins Vanilla Extract',
      financial_beneficiary: 'J.R. Watkins Company',
      beneficiary_country: 'United States',
      confidence_score: 75,
      ownership_structure_type: 'private_company',
      sources: ['watkins.com', 'business-directory.org'],
      reasoning: 'The Watkins Co. is a private company with family ownership'
    }
  },
  {
    name: 'ObscureBrand',
    product: 'ObscureBrand Widget',
    existingResult: {
      brand: 'ObscureBrand',
      product_name: 'ObscureBrand Widget',
      financial_beneficiary: 'Unknown Corporation',
      beneficiary_country: 'Unknown',
      confidence_score: 30,
      ownership_structure_type: 'unknown',
      sources: [],
      reasoning: 'Limited information available about this brand'
    }
  }
];

async function testBrandVerification(brandData) {
  console.log(`\n🧪 Testing Enhanced Gemini Verification: ${brandData.name}`);
  console.log('='.repeat(50 + brandData.name.length));
  
  try {
    const geminiAgent = new GeminiOwnershipAnalysisAgent();
    
    console.log('📋 Test Input:');
    console.log(`   Brand: ${brandData.name}`);
    console.log(`   Product: ${brandData.product}`);
    console.log(`   Claimed Owner: ${brandData.existingResult.financial_beneficiary}`);
    console.log(`   Country: ${brandData.existingResult.beneficiary_country}`);
    console.log(`   Confidence: ${brandData.existingResult.confidence_score}`);
    console.log('');

    const startTime = Date.now();
    const result = await geminiAgent.analyze(
      brandData.name,
      brandData.product,
      brandData.existingResult
    );
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ Verification completed in', duration, 'ms');
    console.log('');

    // Display key results
    console.log('📊 Key Results:');
    console.log('   Verification Status:', result.verification_status);
    console.log('   Confidence Change:', result.verification_confidence_change);
    console.log('   Evidence Count:', {
      supporting: result.verification_evidence?.supporting_evidence?.length || 0,
      contradicting: result.verification_evidence?.contradicting_evidence?.length || 0,
      missing: result.verification_evidence?.missing_evidence?.length || 0
    });

    // Display enhanced explanations summary
    if (result.gemini_analysis?.explanations_by_requirement) {
      console.log('   Enhanced Explanations:');
      const explanations = result.gemini_analysis.explanations_by_requirement;
      Object.entries(explanations).forEach(([requirement, explanation]) => {
        console.log(`     ${requirement}: ${explanation.status} (${explanation.evidence_quality})`);
      });
    }

    return {
      brand: brandData.name,
      success: true,
      verification_status: result.verification_status,
      confidence_change: result.verification_confidence_change,
      has_enhanced_explanations: !!result.gemini_analysis?.explanations_by_requirement,
      evidence_counts: {
        supporting: result.verification_evidence?.supporting_evidence?.length || 0,
        contradicting: result.verification_evidence?.contradicting_evidence?.length || 0,
        missing: result.verification_evidence?.missing_evidence?.length || 0
      },
      duration
    };

  } catch (error) {
    console.error(`❌ Test failed for ${brandData.name}:`, error.message);
    return {
      brand: brandData.name,
      success: false,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Enhanced Gemini Verification Multi-Brand Test');
  console.log('========================================================');
  console.log(`Testing ${testBrands.length} brands with enhanced verification`);
  console.log('Feature Flag Status:', process.env.GEMINI_VERIFICATION_ENHANCED_MATCH === 'true' ? 'ENABLED' : 'DISABLED');
  console.log('');

  const results = [];
  const startTime = Date.now();

  for (const brandData of testBrands) {
    const result = await testBrandVerification(brandData);
    results.push(result);
  }

  const totalTime = Date.now() - startTime;

  // Display summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Brands Tested: ${testBrands.length}`);
  console.log(`Successful Tests: ${results.filter(r => r.success).length}`);
  console.log(`Failed Tests: ${results.filter(r => !r.success).length}`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Time per Brand: ${Math.round(totalTime / testBrands.length)}ms`);
  console.log('');

  // Display per-brand results
  console.log('📋 Per-Brand Results:');
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.brand}: ${result.verification_status} (${result.confidence_change}) - ${result.evidence_counts.supporting} supporting, ${result.evidence_counts.missing} missing`);
    } else {
      console.log(`❌ ${result.brand}: FAILED - ${result.error}`);
    }
  });

  // Display enhanced explanations summary
  const enhancedResults = results.filter(r => r.success && r.has_enhanced_explanations);
  console.log(`\n🎯 Enhanced Explanations Available: ${enhancedResults.length}/${results.filter(r => r.success).length} brands`);

  console.log('\n🎉 Multi-brand test completed!');
  
  return results;
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then((results) => {
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      if (successCount === totalCount) {
        console.log('✅ All tests passed!');
        process.exit(0);
      } else {
        console.log(`❌ ${totalCount - successCount} tests failed`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { runAllTests, testBrandVerification };
