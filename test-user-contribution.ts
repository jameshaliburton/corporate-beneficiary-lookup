import { config } from 'dotenv';
config({ path: '.env.local' });

interface TestCase {
  barcode: string;
  product_name: string;
  brand: string;
  description: string;
}

async function testUserContribution() {
  const testBarcode = '9998887776665'; // Fresh barcode
  const testProduct = {
    product_name: 'Test Product',
    brand: 'Test Brand'
  };

  console.log('Testing user contribution flow...');
  console.log('Barcode:', testBarcode);
  console.log('Product:', testProduct);

  try {
    const response = await fetch('http://localhost:3001/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode: testBarcode,
        product_name: testProduct.product_name,
        brand: testProduct.brand
      }),
    });

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ User contribution successful!');
      console.log('Result type:', result.result_type);
      console.log('User contributed:', result.user_contributed);
      console.log('Financial beneficiary:', result.financial_beneficiary);
      console.log('Beneficiary country:', result.beneficiary_country);
      console.log('Confidence score:', result.confidence_score);
      console.log('Verification status:', result.verification_status);
      console.log('Beneficiary flag:', result.beneficiary_flag);
      console.log('Sources:', result.sources);
    } else {
      console.log('❌ User contribution failed:', result.error);
      console.log('Result type:', result.result_type);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUserContribution(); 