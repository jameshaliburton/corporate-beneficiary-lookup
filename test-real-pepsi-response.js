// Test to see the actual API response structure for Pepsi
const testRealPepsiResponse = async () => {
  console.log('🧪 Testing real Pepsi API response structure...');
  
  try {
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand: 'Pepsi',
        product_name: 'Pepsi Cola',
        manual: true
      }),
    });

    const result = await response.json();
    
    console.log('📊 Full Pepsi API response:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check specific fields that should be present
    console.log('\n🔍 Key fields analysis:');
    console.log('- ownership_flow:', result.ownership_flow);
    console.log('- financial_beneficiary:', result.financial_beneficiary);
    console.log('- beneficiary_country:', result.beneficiary_country);
    console.log('- confidence_score:', result.confidence_score);
    console.log('- agent_execution_trace:', result.agent_execution_trace ? 'present' : 'missing');
    
    if (result.ownership_flow) {
      console.log('\n📋 Ownership flow details:');
      result.ownership_flow.forEach((item, index) => {
        console.log(`  ${index + 1}.`, item);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testRealPepsiResponse(); 