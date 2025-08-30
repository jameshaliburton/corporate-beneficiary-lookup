require('dotenv').config({ path: '.env.local' });
const { EnhancedAgentOwnershipResearch } = require('./src/lib/agents/enhanced-ownership-research-agent.js');

async function testEnhancedAgent() {
  console.log('🧪 [DEBUG_ENHANCED] Testing Enhanced Agent directly');
  
  try {
    const result = await EnhancedAgentOwnershipResearch({
      barcode: null,
      product_name: 'Athletic Shoes',
      brand: 'Jordan',
      hints: {},
      enableEvaluation: false,
      imageProcessingTrace: null,
      followUpContext: null
    });

    console.log('🧪 [DEBUG_ENHANCED] Enhanced agent result:');
    console.log('  verification_status:', result.verification_status);
    console.log('  verified_at:', result.verified_at);
    console.log('  verification_method:', result.verification_method);
    console.log('  verification_notes:', result.verification_notes);
    
    console.log('🧪 [DEBUG_ENHANCED] Agent results:');
    if (result.agent_results?.gemini_analysis) {
      console.log('  Gemini success:', result.agent_results.gemini_analysis.success);
      console.log('  Gemini data keys:', Object.keys(result.agent_results.gemini_analysis.data || {}));
      console.log('  Gemini data.verification_status:', result.agent_results.gemini_analysis.data?.verification_status);
      console.log('  Gemini data.verified_at:', result.agent_results.gemini_analysis.data?.verified_at);
      console.log('  Gemini data.verification_method:', result.agent_results.gemini_analysis.data?.verification_method);
      console.log('  Gemini data.verification_notes:', result.agent_results.gemini_analysis.data?.verification_notes);
    } else {
      console.log('  No Gemini analysis in agent results');
    }

  } catch (error) {
    console.error('❌ [DEBUG_ENHANCED] Error:', error);
  }
}

testEnhancedAgent().catch(console.error);
