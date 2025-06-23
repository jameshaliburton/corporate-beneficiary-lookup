// Test script to simulate the UI flow for low confidence detection
function testLowConfidenceDetection() {
  console.log('Testing low confidence detection logic...\n');

  // Helper function to check if result should show low confidence fallback
  const shouldShowLowConfidenceFallback = (result: any): boolean => {
    if (!result.success) return false;
    if (result.user_contributed) return false; // Don't show for user-contributed data
    
    const hasUnknownBrand = !result.brand || 
                           result.brand.toLowerCase().includes('unknown') || 
                           result.brand === 'N/A';
    const hasUnknownBeneficiary = !result.financial_beneficiary || 
                                 result.financial_beneficiary.toLowerCase().includes('unknown');
    const hasLowConfidence = typeof result.confidence_score === 'number' && result.confidence_score < 50;
    
    return hasUnknownBrand || hasUnknownBeneficiary || hasLowConfidence;
  };

  // Test cases
  const testCases = [
    {
      name: "Unknown Brand",
      result: {
        success: true,
        brand: "Unknown Brand",
        financial_beneficiary: "Some Company",
        confidence_score: 80,
        user_contributed: false
      },
      expected: true
    },
    {
      name: "Unknown Beneficiary",
      result: {
        success: true,
        brand: "Test Brand",
        financial_beneficiary: "Unknown",
        confidence_score: 80,
        user_contributed: false
      },
      expected: true
    },
    {
      name: "Low Confidence Score",
      result: {
        success: true,
        brand: "Test Brand",
        financial_beneficiary: "Some Company",
        confidence_score: 30,
        user_contributed: false
      },
      expected: true
    },
    {
      name: "High Confidence Result",
      result: {
        success: true,
        brand: "Kit Kat",
        financial_beneficiary: "Nestlé",
        confidence_score: 95,
        user_contributed: false
      },
      expected: false
    },
    {
      name: "User Contributed Data",
      result: {
        success: true,
        brand: "Test Brand",
        financial_beneficiary: "Unknown",
        confidence_score: 20,
        user_contributed: true
      },
      expected: false
    },
    {
      name: "Failed Result",
      result: {
        success: false,
        error: "Product not found"
      },
      expected: false
    },
    {
      name: "N/A Brand",
      result: {
        success: true,
        brand: "N/A",
        financial_beneficiary: "Some Company",
        confidence_score: 80,
        user_contributed: false
      },
      expected: true
    },
    {
      name: "Empty Brand",
      result: {
        success: true,
        brand: "",
        financial_beneficiary: "Some Company",
        confidence_score: 80,
        user_contributed: false
      },
      expected: true
    }
  ];

  // Run tests
  testCases.forEach((testCase, index) => {
    const result = shouldShowLowConfidenceFallback(testCase.result);
    const status = result === testCase.expected ? '✅' : '❌';
    
    console.log(`${status} Test ${index + 1}: ${testCase.name}`);
    console.log(`   Brand: "${testCase.result.brand}"`);
    console.log(`   Beneficiary: "${testCase.result.financial_beneficiary}"`);
    console.log(`   Confidence: ${testCase.result.confidence_score}`);
    console.log(`   User Contributed: ${testCase.result.user_contributed}`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    console.log('');
  });

  console.log('🎯 Low confidence detection test complete!');
}

// Run the test
testLowConfidenceDetection(); 