// Test script for low confidence fallback flow
async function testLowConfidenceFallback() {
  console.log('Testing low confidence fallback flow...');

  // Test case 1: Result with unknown brand
  console.log('\n📦 Test 1: Result with unknown brand');
  try {
    const response1 = await fetch('http://localhost:3001/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode: '1111111111111',
        product_name: 'Test Product',
        brand: 'Unknown Brand'
      }),
    });

    const result1 = await response1.json();
    console.log('Result with unknown brand:', JSON.stringify(result1, null, 2));
    
    if (result1.success) {
      console.log('✅ Should trigger low confidence fallback (unknown brand)');
      console.log('Brand:', result1.brand);
      console.log('Financial beneficiary:', result1.financial_beneficiary);
      console.log('Confidence score:', result1.confidence_score);
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test case 2: Result with unknown beneficiary
  console.log('\n📦 Test 2: Result with unknown beneficiary');
  try {
    const response2 = await fetch('http://localhost:3001/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode: '2222222222222',
        product_name: 'Test Product',
        brand: 'Test Brand'
      }),
    });

    const result2 = await response2.json();
    console.log('Result with unknown beneficiary:', JSON.stringify(result2, null, 2));
    
    if (result2.success) {
      console.log('✅ Should trigger low confidence fallback (unknown beneficiary)');
      console.log('Brand:', result2.brand);
      console.log('Financial beneficiary:', result2.financial_beneficiary);
      console.log('Confidence score:', result2.confidence_score);
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test case 3: Result with low confidence score
  console.log('\n📦 Test 3: Result with low confidence score');
  try {
    const response3 = await fetch('http://localhost:3001/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode: '3333333333333',
        product_name: 'Test Product',
        brand: 'Test Brand'
      }),
    });

    const result3 = await response3.json();
    console.log('Result with low confidence:', JSON.stringify(result3, null, 2));
    
    if (result3.success) {
      console.log('✅ Should trigger low confidence fallback (low confidence)');
      console.log('Brand:', result3.brand);
      console.log('Financial beneficiary:', result3.financial_beneficiary);
      console.log('Confidence score:', result3.confidence_score);
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  // Test case 4: High confidence result (should NOT trigger fallback)
  console.log('\n📦 Test 4: High confidence result (should NOT trigger fallback)');
  try {
    const response4 = await fetch('http://localhost:3001/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode: '4444444444444',
        product_name: 'Kit Kat Chocolate Bar',
        brand: 'Kit Kat'
      }),
    });

    const result4 = await response4.json();
    console.log('High confidence result:', JSON.stringify(result4, null, 2));
    
    if (result4.success) {
      console.log('✅ Should NOT trigger low confidence fallback (high confidence)');
      console.log('Brand:', result4.brand);
      console.log('Financial beneficiary:', result4.financial_beneficiary);
      console.log('Confidence score:', result4.confidence_score);
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }
}

// Run the test
testLowConfidenceFallback(); 