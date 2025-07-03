#!/usr/bin/env node

// Test brand extraction with text input
async function testBrandExtractionWithText() {
  console.log('🔍 Testing Brand Extraction with Text Input\n');
  
  try {
    // Test with text that should extract a brand
    const testData = {
      product_name: 'Chunky Monkey Ice Cream 473ml',
      brand: 'Ben & Jerry\'s',
      test_mode: true,
      debug: true
    };

    console.log('📝 Testing with brand: "Ben & Jerry\'s" and product: "Chunky Monkey Ice Cream 473ml"');
    
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Text-Based Lookup Result:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Result Type:', result.result_type);
    console.log('Financial Beneficiary:', result.financial_beneficiary);
    
    if (result.agent_execution_trace) {
      console.log('\n🔄 Agent Execution Trace:');
      console.log('Stages:', result.agent_execution_trace.stages?.map(s => s.name || s.stage).join(' → '));
      console.log('Decisions:', result.agent_execution_trace.decisions);
    }
    
    if (result.contextual_clues) {
      console.log('\n🔍 Contextual Clues:');
      console.log('Step:', result.contextual_clues.step);
      console.log('Step Name:', result.contextual_clues.step_name);
      if (result.contextual_clues.extracted_data) {
        console.log('Brand Name:', result.contextual_clues.extracted_data.brand_name);
        console.log('Product Name:', result.contextual_clues.extracted_data.product_name);
        console.log('Confidence:', result.contextual_clues.extracted_data.confidence);
        console.log('Reasoning:', result.contextual_clues.extracted_data.reasoning);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error testing text-based lookup:', error);
    return null;
  }
}

// Test with a different brand
async function testDifferentBrand() {
  console.log('\n🔍 Testing Different Brand\n');
  
  try {
    const testData = {
      product_name: 'Chocolate Bar 41g',
      brand: 'Kit Kat',
      test_mode: true,
      debug: true
    };

    console.log('📝 Testing with brand: "Kit Kat" and product: "Chocolate Bar 41g"');
    
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Kit Kat Lookup Result:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Result Type:', result.result_type);
    console.log('Financial Beneficiary:', result.financial_beneficiary);
    
    if (result.contextual_clues?.extracted_data) {
      console.log('Brand Name:', result.contextual_clues.extracted_data.brand_name);
      console.log('Product Name:', result.contextual_clues.extracted_data.product_name);
      console.log('Confidence:', result.contextual_clues.extracted_data.confidence);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error testing Kit Kat lookup:', error);
    return null;
  }
}

// Test with a generic product
async function testGenericProduct() {
  console.log('\n🔍 Testing Generic Product\n');
  
  try {
    const testData = {
      product_name: 'Store Brand Milk 2L',
      brand: 'Generic',
      test_mode: true,
      debug: true
    };

    console.log('📝 Testing with brand: "Generic" and product: "Store Brand Milk 2L"');
    
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Generic Product Lookup Result:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Result Type:', result.result_type);
    console.log('Financial Beneficiary:', result.financial_beneficiary);
    
    if (result.contextual_clues?.extracted_data) {
      console.log('Brand Name:', result.contextual_clues.extracted_data.brand_name);
      console.log('Product Name:', result.contextual_clues.extracted_data.product_name);
      console.log('Confidence:', result.contextual_clues.extracted_data.confidence);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error testing generic product lookup:', error);
    return null;
  }
}

// Run the tests
async function runTests() {
  console.log('🧪 Testing Brand Extraction with Text Input\n');
  console.log('===========================================\n');
  
  const benJerryResult = await testBrandExtractionWithText();
  const kitKatResult = await testDifferentBrand();
  const genericResult = await testGenericProduct();
  
  console.log('\n===========================================');
  console.log('📋 Brand Extraction Test Summary');
  console.log('===========================================');
  
  if (benJerryResult) {
    console.log('✅ Ben & Jerry\'s Test:');
    console.log('   - Success:', benJerryResult.success);
    console.log('   - Brand Extracted:', benJerryResult.contextual_clues?.extracted_data?.brand_name || 'None');
    console.log('   - Product Extracted:', benJerryResult.contextual_clues?.extracted_data?.product_name || 'None');
    console.log('   - Confidence:', benJerryResult.contextual_clues?.extracted_data?.confidence || 'None');
  }
  
  if (kitKatResult) {
    console.log('✅ Kit Kat Test:');
    console.log('   - Success:', kitKatResult.success);
    console.log('   - Brand Extracted:', kitKatResult.contextual_clues?.extracted_data?.brand_name || 'None');
    console.log('   - Product Extracted:', kitKatResult.contextual_clues?.extracted_data?.product_name || 'None');
    console.log('   - Confidence:', kitKatResult.contextual_clues?.extracted_data?.confidence || 'None');
  }
  
  if (genericResult) {
    console.log('✅ Generic Product Test:');
    console.log('   - Success:', genericResult.success);
    console.log('   - Brand Extracted:', genericResult.contextual_clues?.extracted_data?.brand_name || 'None');
    console.log('   - Product Extracted:', genericResult.contextual_clues?.extracted_data?.product_name || 'None');
    console.log('   - Confidence:', genericResult.contextual_clues?.extracted_data?.confidence || 'None');
  }
}

runTests().catch(console.error); 