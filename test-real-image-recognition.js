#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test real image recognition
async function testRealImageRecognition() {
  console.log('🔍 Testing Real Image Recognition Flow\n');
  
  try {
    // Test with a simple text-based image (simulating a product label)
    const testImageData = {
      // This would be a real base64 image in production
      image_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      test_mode: true,
      debug: true
    };

    console.log('📸 Testing image recognition with mock image...');
    
    const response = await fetch('http://localhost:3000/api/image-recognition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testImageData)
    });

    const result = await response.json();
    
    console.log('📊 Image Recognition Result:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Data:', JSON.stringify(result.data, null, 2));
    
    if (result.contextual_clues) {
      console.log('\n🔍 Contextual Clues:');
      console.log(JSON.stringify(result.contextual_clues, null, 2));
    }
    
    if (result.flow) {
      console.log('\n🔄 Flow Steps:');
      console.log(JSON.stringify(result.flow, null, 2));
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error testing image recognition:', error);
    return null;
  }
}

// Test the lookup endpoint with image
async function testLookupWithImage() {
  console.log('\n🔍 Testing Lookup Endpoint with Image\n');
  
  try {
    const testData = {
      image_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      test_mode: true,
      debug: true
    };

    console.log('🔍 Testing lookup with image...');
    
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Lookup Result:');
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
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error testing lookup:', error);
    return null;
  }
}

// Run the tests
async function runTests() {
  console.log('🧪 Testing Real Image Recognition and Brand Extraction\n');
  console.log('=====================================================\n');
  
  const imageResult = await testRealImageRecognition();
  const lookupResult = await testLookupWithImage();
  
  console.log('\n=====================================================');
  console.log('📋 Test Summary');
  console.log('=====================================================');
  
  if (imageResult) {
    console.log('✅ Image Recognition Test Completed');
    console.log('   - Success:', imageResult.success);
    console.log('   - Brand Extracted:', imageResult.data?.brand_name || 'None');
    console.log('   - Product Extracted:', imageResult.data?.product_name || 'None');
  } else {
    console.log('❌ Image Recognition Test Failed');
  }
  
  if (lookupResult) {
    console.log('✅ Lookup Test Completed');
    console.log('   - Success:', lookupResult.success);
    console.log('   - Result Type:', lookupResult.result_type);
    console.log('   - Beneficiary Found:', lookupResult.financial_beneficiary || 'None');
  } else {
    console.log('❌ Lookup Test Failed');
  }
}

runTests().catch(console.error); 