// Test script for AgentOwnershipResearch
async function testOwnershipResearchAgent() {
  console.log('Testing AgentOwnershipResearch functionality...\n');

  // Test cases for different scenarios
  const testCases = [
    {
      name: "Well-known brand (Kit Kat)",
      barcode: "5555555555555",
      product_name: "Kit Kat Chocolate Bar",
      brand: "Kit Kat",
      expected: {
        shouldFind: true,
        expectedBeneficiary: "Nestlé",
        expectedCountry: "Switzerland"
      }
    },
    {
      name: "Unknown brand",
      barcode: "6666666666666",
      product_name: "Test Product",
      brand: "Unknown Brand",
      expected: {
        shouldFind: false,
        expectedBeneficiary: "Unknown",
        expectedCountry: "Unknown"
      }
    },
    {
      name: "Swedish brand (H&M)",
      barcode: "7777777777777",
      product_name: "H&M T-Shirt",
      brand: "H&M",
      expected: {
        shouldFind: true,
        expectedBeneficiary: "H&M",
        expectedCountry: "Sweden"
      }
    },
    {
      name: "Food brand with hints",
      barcode: "8888888888888",
      product_name: "Coca-Cola Classic",
      brand: "Coca-Cola",
      hints: {
        country_of_origin: "United States"
      },
      expected: {
        shouldFind: true,
        expectedBeneficiary: "Coca-Cola",
        expectedCountry: "United States"
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📦 Testing: ${testCase.name}`);
    console.log(`   Barcode: ${testCase.barcode}`);
    console.log(`   Product: ${testCase.product_name}`);
    console.log(`   Brand: ${testCase.brand}`);
    if (testCase.hints) {
      console.log(`   Hints: ${JSON.stringify(testCase.hints)}`);
    }

    try {
      const response = await fetch('http://localhost:3001/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode: testCase.barcode,
          product_name: testCase.product_name,
          brand: testCase.brand,
          ...(testCase.hints && { hints: testCase.hints })
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`   ✅ Success: ${result.success}`);
        console.log(`   📝 Result Type: ${result.result_type}`);
        console.log(`   👤 User Contributed: ${result.user_contributed}`);
        console.log(`   💰 Financial Beneficiary: ${result.financial_beneficiary}`);
        console.log(`   🌍 Country: ${result.beneficiary_country}`);
        console.log(`   🏳️ Flag: ${result.beneficiary_flag}`);
        console.log(`   📊 Confidence: ${result.confidence_score}%`);
        console.log(`   🔄 Ownership Structure: ${result.ownership_structure_type}`);
        
        if (result.ownership_flow && result.ownership_flow.length > 0) {
          console.log(`   📈 Ownership Flow: ${result.ownership_flow.join(' → ')}`);
        }
        
        if (result.sources && result.sources.length > 0) {
          console.log(`   📚 Sources: ${result.sources.join(', ')}`);
        }
        
        // Check if result matches expectations
        const matchesExpected = testCase.expected.shouldFind 
          ? result.financial_beneficiary !== 'Unknown' && result.confidence_score >= 30
          : result.financial_beneficiary === 'Unknown' || result.confidence_score < 50;
        
        console.log(`   🎯 Matches Expected: ${matchesExpected ? '✅' : '❌'}`);
        
        if (result.reasoning) {
          console.log(`   💭 Reasoning: ${result.reasoning.substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        console.log(`   📝 Result Type: ${result.result_type}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    
    console.log('');
  }

  console.log('🎯 AgentOwnershipResearch test complete!');
  console.log('\n💡 Note: Make sure your Next.js dev server is running on localhost:3001');
}

// Run the test
testOwnershipResearchAgent(); 