// Test script for fallback user contribution flow
async function testFallbackFlow() {
  const testBarcode = '9999999999999'; // Very unlikely to exist

  console.log('Testing fallback user contribution flow...');
  console.log('Barcode:', testBarcode);

  // Step 1: Try to lookup a non-existent barcode
  console.log('\n📦 Step 1: Attempting to lookup non-existent barcode...');
  try {
    const response1 = await fetch('http://localhost:3001/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode: testBarcode
      }),
    });

    const result1 = await response1.json();
    console.log('Initial lookup result:', JSON.stringify(result1, null, 2));

    if (!result1.success) {
      console.log('✅ Initial lookup failed as expected, should trigger fallback form');
      
      // Step 2: Simulate user contribution
      console.log('\n📝 Step 2: Simulating user contribution...');
      const userData = {
        product_name: 'Fallback Test Product',
        brand: 'Fallback Test Brand'
      };
      
      const response2 = await fetch('http://localhost:3001/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode: testBarcode,
          product_name: userData.product_name,
          brand: userData.brand
        }),
      });

      const result2 = await response2.json();
      console.log('User contribution result:', JSON.stringify(result2, null, 2));

      if (result2.success) {
        console.log('✅ User contribution successful!');
        console.log('Result type:', result2.result_type);
        console.log('User contributed:', result2.user_contributed);
        console.log('Financial beneficiary:', result2.financial_beneficiary);
        console.log('Beneficiary country:', result2.beneficiary_country);
        console.log('Confidence score:', result2.confidence_score);
        console.log('Verification status:', result2.verification_status);
        console.log('Beneficiary flag:', result2.beneficiary_flag);
        console.log('Sources:', result2.sources);
      } else {
        console.log('❌ User contribution failed:', result2.error);
        console.log('Result type:', result2.result_type);
      }
    } else {
      console.log('❌ Unexpected: Initial lookup succeeded when it should have failed');
      console.log('This barcode actually exists in the database!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFallbackFlow(); 