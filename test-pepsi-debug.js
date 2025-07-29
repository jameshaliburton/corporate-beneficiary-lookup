// Test script to debug Pepsi/Doritos low confidence issue
const testPepsiSearch = async () => {
  console.log('🧪 Testing Pepsi search to debug low confidence issue...');
  
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
    
    console.log('📊 Pepsi search result:', {
      success: result.success,
      brand: result.brand,
      confidence_score: result.confidence_score,
      confidence_level: result.confidence_level,
      financial_beneficiary: result.financial_beneficiary,
      requires_manual_entry: result.requires_manual_entry,
      result_type: result.result_type,
      has_agent_execution_trace: !!result.agent_execution_trace,
      has_web_research_used: result.web_research_used,
      web_sources_count: result.web_sources_count
    });
    
    // Show full error details if there's an error
    if (!result.success) {
      console.log('❌ Full error response:', JSON.stringify(result, null, 2));
    }
    
    if (result.agent_execution_trace) {
      console.log('🔍 Agent execution trace stages:', 
        result.agent_execution_trace.stages?.map(s => s.stage) || 
        result.agent_execution_trace.sections?.map(s => s.label) || 
        'No stages found'
      );
    }
    
    if (result.confidence_factors) {
      console.log('📈 Confidence factors:', result.confidence_factors);
    }
    
    if (result.confidence_reasoning) {
      console.log('💭 Confidence reasoning:', result.confidence_reasoning);
    }
    
  } catch (error) {
    console.error('❌ Pepsi search test failed:', error);
  }
};

const testDoritosSearch = async () => {
  console.log('🧪 Testing Doritos search to debug low confidence issue...');
  
  try {
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand: 'Doritos',
        product_name: 'Doritos Nacho Cheese',
        manual: true
      }),
    });

    const result = await response.json();
    
    console.log('📊 Doritos search result:', {
      success: result.success,
      brand: result.brand,
      confidence_score: result.confidence_score,
      confidence_level: result.confidence_level,
      financial_beneficiary: result.financial_beneficiary,
      requires_manual_entry: result.requires_manual_entry,
      result_type: result.result_type,
      has_agent_execution_trace: !!result.agent_execution_trace,
      has_web_research_used: result.web_research_used,
      web_sources_count: result.web_sources_count
    });
    
    // Show full error details if there's an error
    if (!result.success) {
      console.log('❌ Full error response:', JSON.stringify(result, null, 2));
    }
    
    if (result.agent_execution_trace) {
      console.log('🔍 Agent execution trace stages:', 
        result.agent_execution_trace.stages?.map(s => s.stage) || 
        result.agent_execution_trace.sections?.map(s => s.label) || 
        'No stages found'
      );
    }
    
    if (result.confidence_factors) {
      console.log('📈 Confidence factors:', result.confidence_factors);
    }
    
    if (result.confidence_reasoning) {
      console.log('💭 Confidence reasoning:', result.confidence_reasoning);
    }
    
  } catch (error) {
    console.error('❌ Doritos search test failed:', error);
  }
};

// Run both tests
console.log('🚀 Starting Pepsi and Doritos debug tests...\n');
testPepsiSearch().then(() => {
  console.log('\n' + '='.repeat(50) + '\n');
  return testDoritosSearch();
}).then(() => {
  console.log('\n✅ Debug tests completed');
}).catch(error => {
  console.error('❌ Debug tests failed:', error);
}); 