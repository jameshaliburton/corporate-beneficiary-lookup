// Test manual search with context
const testManualSearch = async () => {
  console.log('🧪 Testing manual search with context...');
  
  try {
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand: 'OK Snacks',
        product_name: 'OK Snacks',
        user_context: 'This is a snack brand I found in a local store, might be a regional brand',
      }),
    });

    const result = await response.json();
    
    console.log('✅ Manual search test result:', {
      success: result.success,
      brand: result.brand,
      confidence: result.confidence_score,
      hasGeneratedCopy: !!result.generated_copy,
      userContext: 'This is a snack brand I found in a local store, might be a regional brand'
    });
    
    if (result.generated_copy) {
      console.log('🎨 Generated copy:', JSON.stringify(result.generated_copy, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Manual search test failed:', error);
  }
};

testManualSearch(); 