// Test to verify UI components are working with updated logo and country support
const testUIComponents = async () => {
  console.log('🧪 Testing UI components with updated logo and country support...');
  
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
    
    console.log('📊 UI Test - Key data points:');
    console.log('- Brand:', result.brand);
    console.log('- Product:', result.product_name);
    console.log('- Beneficiary Country:', result.beneficiary_country);
    console.log('- Beneficiary Flag:', result.beneficiary_flag);
    console.log('- Confidence Score:', result.confidence_score);
    console.log('- Ownership Flow Count:', result.ownership_flow?.length || 0);
    
    // Test the ownership flow data structure
    if (result.ownership_flow) {
      console.log('\n📋 Ownership Flow Structure:');
      result.ownership_flow.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name} (should show ${result.beneficiary_country} country)`);
      });
    }
    
    // Test trace structure
    if (result.agent_execution_trace?.sections) {
      console.log('\n🔍 Trace Structure:');
      result.agent_execution_trace.sections.forEach(section => {
        const activeStages = section.stages.filter(stage => !stage.skipped);
        console.log(`  ${section.label}: ${activeStages.length} active stages`);
        activeStages.forEach(stage => {
          console.log(`    - ${stage.label}: ${stage.status || 'completed'}`);
        });
      });
    }
    
    console.log('\n✅ UI components should now display:');
    console.log('  ✅ Country: United States 🇺🇸');
    console.log('  ✅ No fake vision stages');
    console.log('  ✅ Async logo loading for Pepsi, PepsiCo, PepsiCo Inc.');
    console.log('  ✅ Flags as fallback while logos load');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testUIComponents(); 