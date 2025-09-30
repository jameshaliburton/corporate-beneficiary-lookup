/**
 * Test script for admin Gemini verification view
 * Tests the admin route with mock data for different brands
 */

// Mock environment variables
process.env.NEXT_PUBLIC_ADMIN_ENABLED = 'true';
process.env.NODE_ENV = 'development';

// Mock sessionStorage with enhanced verification data
function createMockPipelineResult(brand, explanations) {
  return {
    success: true,
    brand: brand,
    product_name: `${brand} Test Product`,
    financial_beneficiary: 'Test Owner Corp',
    beneficiary_country: 'United States',
    confidence_score: 85,
    agent_results: {
      gemini_analysis: {
        success: true,
        type: "ownership_verification",
        agent: "GeminiOwnershipVerificationAgent",
        enhanced_match_enabled: true,
        verification_requirements_analyzed: Object.keys(explanations),
        explanations_by_requirement: explanations,
        // Debug fields for admin view
        prompt: `You are an expert corporate ownership analyst with deep expertise in corporate structures, ownership verification, and evidence quality assessment. Analyze the following web search results to determine the ownership of ${brand}.

EXISTING RESULT:
{
  "brand": "${brand}",
  "product_name": "${brand} Test Product",
  "financial_beneficiary": "Test Owner Corp",
  "beneficiary_country": "United States",
  "confidence_score": 85
}

WEB SEARCH RESULTS:
Result 1 (wikipedia.org): ${brand} is a well-known brand with clear ownership structure...
Result 2 (investors.${brand.toLowerCase()}.com): Corporate information shows ownership details...
Result 3 (${brand.toLowerCase()}.com): Official company website with ownership information...

VERIFICATION REQUIREMENTS:
You must verify the following specific ownership aspects:
1. **Ultimate Ownership**: Who ultimately owns or controls the brand?
2. **Family Control**: Is there evidence of family ownership or control?
3. **Percentage Ownership**: What percentage of ownership is held by the ultimate owner?
4. **Corporate Structure**: What is the ownership structure (public, private, subsidiary, etc.)?
5. **Geographic Control**: Where is the ultimate controlling entity located?

[Additional prompt content continues...]`,
        raw_output: `\`\`\`json
{
  "verification_status": "confirmed",
  "confidence_assessment": {
    "original_confidence": 85,
    "verified_confidence": 90,
    "confidence_change": "increased"
  },
  "evidence_analysis": {
    "supporting_evidence": [
      "Result 1 (wikipedia.org) confirms ${brand} ownership structure",
      "Result 2 (investors.${brand.toLowerCase()}.com) provides detailed ownership information"
    ],
    "contradicting_evidence": [],
    "neutral_evidence": [],
    "missing_evidence": []
  },
  "explanations_by_requirement": ${JSON.stringify(explanations, null, 2)},
  "summary": "Verification completed successfully with strong evidence",
  "reasoning": "All verification requirements were met with high-quality evidence from reliable sources."
}
\`\`\``
      }
    }
  };
}

// Test data for different brands
const testBrands = {
  puma: {
    explanations: {
      ultimate_ownership: {
        status: 'confirmed',
        explanation: 'Puma SE is confirmed to be controlled by Artémis S.A., the investment vehicle of the Pinault family. This is clearly stated in multiple financial reports and corporate filings.',
        evidence_quality: 5,
        supporting_snippets: [
          'Result 1 (investors.puma.com): "PUMA SE is controlled by Artémis S.A., which owns approximately 29% of the company"',
          'Result 2 (wikipedia.org): "Artémis S.A. is the investment company of the French Pinault family"'
        ],
        contradicting_snippets: [],
        missing_information: []
      },
      family_control: {
        status: 'confirmed',
        explanation: 'Clear evidence of family control through the Pinault family\'s investment vehicle Artémis S.A.',
        evidence_quality: 4,
        supporting_snippets: [
          'Result 1 (investors.puma.com): "Artémis S.A. is the investment vehicle of the Pinault family"'
        ],
        contradicting_snippets: [],
        missing_information: []
      },
      percentage_ownership: {
        status: 'confirmed',
        explanation: 'Artémis S.A. owns approximately 29% of PUMA SE, making it the largest shareholder.',
        evidence_quality: 4,
        supporting_snippets: [
          'Result 1 (investors.puma.com): "owns approximately 29% of the company"'
        ],
        contradicting_snippets: [],
        missing_information: []
      },
      corporate_structure: {
        status: 'confirmed',
        explanation: 'PUMA SE is a publicly traded company on the Frankfurt Stock Exchange with a clear corporate structure.',
        evidence_quality: 4,
        supporting_snippets: [
          'Result 1 (wikipedia.org): "PUMA SE is a German multinational corporation"',
          'Result 2 (investors.puma.com): "publicly traded company on the Frankfurt Stock Exchange"'
        ],
        contradicting_snippets: [],
        missing_information: []
      },
      geographic_control: {
        status: 'confirmed',
        explanation: 'The controlling entity Artémis S.A. is based in France, while PUMA SE is headquartered in Germany.',
        evidence_quality: 4,
        supporting_snippets: [
          'Result 1 (investors.puma.com): "Artémis S.A., the investment vehicle of the French Pinault family"',
          'Result 2 (wikipedia.org): "headquartered in Herzogenaurach, Germany"'
        ],
        contradicting_snippets: [],
        missing_information: []
      }
    }
  },
  
  nespresso: {
    explanations: {
      ultimate_ownership: {
        status: 'confirmed',
        explanation: 'Nespresso is confirmed to be wholly owned by Nestlé S.A., a Swiss multinational food and beverage company.',
        evidence_quality: 5,
        supporting_snippets: [
          'Result 1 (nestle.com): "Nespresso is a wholly owned subsidiary of Nestlé S.A."',
          'Result 2 (wikipedia.org): "Nespresso is owned by Nestlé"'
        ],
        contradicting_snippets: [],
        missing_information: []
      },
      family_control: {
        status: 'not_found',
        explanation: 'No evidence found of family control. Nestlé S.A. is a publicly traded company with institutional ownership.',
        evidence_quality: 2,
        supporting_snippets: [],
        contradicting_snippets: [],
        missing_information: ['Information about family ownership or control of Nestlé S.A.']
      },
      percentage_ownership: {
        status: 'confirmed',
        explanation: 'Nespresso is 100% owned by Nestlé S.A. as a wholly owned subsidiary.',
        evidence_quality: 5,
        supporting_snippets: [
          'Result 1 (nestle.com): "wholly owned subsidiary"'
        ],
        contradicting_snippets: [],
        missing_information: []
      },
      corporate_structure: {
        status: 'confirmed',
        explanation: 'Nespresso operates as a subsidiary of Nestlé S.A., which is a publicly traded company.',
        evidence_quality: 4,
        supporting_snippets: [
          'Result 1 (nestle.com): "subsidiary of Nestlé S.A."',
          'Result 2 (wikipedia.org): "Nestlé S.A. is a Swiss multinational food and drink processing conglomerate"'
        ],
        contradicting_snippets: [],
        missing_information: []
      },
      geographic_control: {
        status: 'confirmed',
        explanation: 'The controlling entity Nestlé S.A. is based in Switzerland.',
        evidence_quality: 4,
        supporting_snippets: [
          'Result 1 (wikipedia.org): "Swiss multinational food and drink processing conglomerate"'
        ],
        contradicting_snippets: [],
        missing_information: []
      }
    }
  },
  
  watkins: {
    explanations: {
      ultimate_ownership: {
        status: 'ambiguous',
        explanation: 'Limited information available about the ultimate ownership of The Watkins Co. Some sources suggest it may be privately held.',
        evidence_quality: 2,
        supporting_snippets: [
          'Result 1 (watkins.com): "The Watkins Co. is a private company"'
        ],
        contradicting_snippets: [],
        missing_information: ['Detailed ownership structure', 'Ultimate parent company information']
      },
      family_control: {
        status: 'ambiguous',
        explanation: 'Insufficient evidence to determine if there is family control. The company appears to be private but ownership details are unclear.',
        evidence_quality: 2,
        supporting_snippets: [],
        contradicting_snippets: [],
        missing_information: ['Information about family ownership', 'Company ownership structure']
      },
      percentage_ownership: {
        status: 'not_found',
        explanation: 'No specific information found about percentage ownership or ownership structure.',
        evidence_quality: 1,
        supporting_snippets: [],
        contradicting_snippets: [],
        missing_information: ['Ownership percentages', 'Shareholder information']
      },
      corporate_structure: {
        status: 'confirmed',
        explanation: 'The Watkins Co. appears to be a private company based on available information.',
        evidence_quality: 3,
        supporting_snippets: [
          'Result 1 (watkins.com): "private company"'
        ],
        contradicting_snippets: [],
        missing_information: ['Detailed corporate structure', 'Registration information']
      },
      geographic_control: {
        status: 'confirmed',
        explanation: 'The Watkins Co. appears to be based in the United States.',
        evidence_quality: 3,
        supporting_snippets: [
          'Result 1 (watkins.com): "American company"'
        ],
        contradicting_snippets: [],
        missing_information: ['Specific headquarters location', 'State of incorporation']
      }
    }
  }
};

function testAdminView() {
  console.log('🧪 Testing Admin Gemini Verification View');
  console.log('========================================');
  
  // Test each brand
  Object.entries(testBrands).forEach(([brandKey, brandData]) => {
    console.log(`\n📋 Testing ${brandKey.toUpperCase()}:`);
    
    const mockResult = createMockPipelineResult(brandKey, brandData.explanations);
    
    // Store in sessionStorage (simulating the real flow)
    sessionStorage.setItem('pipelineResult', JSON.stringify(mockResult));
    
    console.log('✅ Mock data created and stored in sessionStorage');
    console.log(`   Brand: ${mockResult.brand}`);
    console.log(`   Requirements: ${Object.keys(brandData.explanations).length}`);
    console.log(`   Enhanced Match: ${mockResult.agent_results.gemini_analysis.enhanced_match_enabled}`);
    console.log(`   Has Prompt: ${!!mockResult.agent_results.gemini_analysis.prompt}`);
    console.log(`   Has Raw Output: ${!!mockResult.agent_results.gemini_analysis.raw_output}`);
    
    // Simulate the admin view URL
    const adminUrl = `/admin/gemini-verification/${encodeURIComponent(brandKey)}`;
    console.log(`   Admin URL: ${adminUrl}`);
    
    // Count statuses
    const statusCounts = Object.values(brandData.explanations).reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   Status Summary:', statusCounts);
    
    // Calculate average evidence quality
    const avgQuality = Object.values(brandData.explanations)
      .reduce((sum, req) => sum + req.evidence_quality, 0) / Object.values(brandData.explanations).length;
    
    console.log(`   Avg Evidence Quality: ${avgQuality.toFixed(1)}/5`);
  });
  
  console.log('\n🎯 Admin View Features:');
  console.log('======================');
  console.log('✅ Admin access gated by NEXT_PUBLIC_ADMIN_ENABLED');
  console.log('✅ Reads from sessionStorage (same as result page)');
  console.log('✅ Displays explanations_by_requirement in table format');
  console.log('✅ Color-coded status chips');
  console.log('✅ Evidence quality scoring (1-5)');
  console.log('✅ Expandable explanations');
  console.log('✅ Snippet source domains');
  console.log('✅ Summary statistics');
  console.log('✅ Debug link in result page (development only)');
  console.log('✅ 📤 Gemini Prompt section (collapsible)');
  console.log('✅ 📥 Gemini Raw Output section (collapsible)');
  console.log('✅ Copy to clipboard buttons for prompt and output');
  console.log('✅ Graceful handling when debug data is missing');
  
  console.log('\n🔗 Test URLs:');
  console.log('=============');
  Object.keys(testBrands).forEach(brand => {
    console.log(`   http://localhost:3000/admin/gemini-verification/${brand}`);
  });
  
  console.log('\n✅ Admin view test completed!');
  console.log('\n📝 To test manually:');
  console.log('1. Set NEXT_PUBLIC_ADMIN_ENABLED=true in your environment');
  console.log('2. Run the enhanced Gemini verification test to populate sessionStorage');
  console.log('3. Navigate to a result page and click "Debug Gemini Verification"');
  console.log('4. Or directly visit the admin URLs above');
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  testAdminView();
} else {
  // Node environment
  console.log('⚠️  This test should be run in a browser environment to test sessionStorage');
  console.log('   Run: node -e "eval(require(\'fs\').readFileSync(\'test-admin-gemini-verification.js\', \'utf8\'))"');
}

export { testAdminView, createMockPipelineResult, testBrands };
