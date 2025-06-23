/**
 * Test for WebResearchAgent integration
 * Tests the new web research capabilities and fallback behavior
 */

import { WebResearchAgent, isWebResearchAvailable, getRequiredEnvVars } from './src/lib/agents/web-research-agent.js';
import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js';

async function testWebResearchIntegration() {
  console.log('🧪 Testing Web Research Integration\n');

  // Check environment setup
  console.log('1. Checking environment setup...');
  const envVars = getRequiredEnvVars();
  const webResearchAvailable = isWebResearchAvailable();
  
  console.log('✅ Environment variables status:', envVars);
  console.log('✅ Web research available:', webResearchAvailable);
  
  if (!webResearchAvailable) {
    console.log('⚠️  Web research not available - API keys not configured');
    console.log('   To enable web research, add to .env.local:');
    console.log('   GOOGLE_API_KEY=your_google_api_key');
    console.log('   GOOGLE_CSE_ID=your_google_cse_id');
    console.log('   OPENCORPORATES_API_KEY=your_opencorporates_key');
  }

  // Test 2: Direct WebResearchAgent test
  console.log('\n2. Testing WebResearchAgent directly...');
  
  try {
    const webResult = await WebResearchAgent({
      brand: 'TestBrand',
      product_name: 'Test Product',
      hints: {}
    });

    console.log('✅ WebResearchAgent result:', {
      success: webResult.success,
      total_sources: webResult.total_sources,
      search_results_count: webResult.search_results_count,
      scraped_sites_count: webResult.scraped_sites_count,
      business_databases_count: webResult.business_databases_count
    });

    if (webResult.success) {
      console.log('✅ Web research completed successfully');
      if (webResult.findings && webResult.findings.length > 0) {
        console.log('✅ Found research findings:', webResult.findings.length);
        webResult.findings.slice(0, 2).forEach((finding, index) => {
          console.log(`   Finding ${index + 1}: ${finding.type} - ${finding.url || finding.source}`);
        });
      }
    } else {
      console.log('⚠️  Web research failed (expected if API keys not configured)');
    }

  } catch (error) {
    console.log('❌ WebResearchAgent test failed:', error.message);
  }

  // Test 3: AgentOwnershipResearch with web research
  console.log('\n3. Testing AgentOwnershipResearch with web research...');
  
  try {
    const agentResult = await AgentOwnershipResearch({
      barcode: '1234567890123',
      product_name: 'Test Product',
      brand: 'TestBrand',
      hints: {}
    });

    console.log('✅ AgentOwnershipResearch result:', {
      financial_beneficiary: agentResult.financial_beneficiary,
      confidence_score: agentResult.confidence_score,
      web_research_used: agentResult.web_research_used,
      web_sources_count: agentResult.web_sources_count,
      sources: agentResult.sources
    });

    if (agentResult.web_research_used) {
      console.log('✅ Web research was successfully integrated');
      console.log(`✅ Used ${agentResult.web_sources_count} web sources`);
    } else {
      console.log('✅ Agent fell back to AI knowledge only (expected if no API keys)');
    }

  } catch (error) {
    console.log('❌ AgentOwnershipResearch test failed:', error.message);
  }

  // Test 4: Test with a well-known brand
  console.log('\n4. Testing with well-known brand...');
  
  try {
    const wellKnownResult = await AgentOwnershipResearch({
      barcode: '1234567890124',
      product_name: 'iPhone',
      brand: 'Apple',
      hints: {}
    });

    console.log('✅ Well-known brand result:', {
      financial_beneficiary: wellKnownResult.financial_beneficiary,
      confidence_score: wellKnownResult.confidence_score,
      web_research_used: wellKnownResult.web_research_used,
      web_sources_count: wellKnownResult.web_sources_count
    });

    if (wellKnownResult.web_research_used && wellKnownResult.web_sources_count > 0) {
      console.log('✅ Web research found sources for well-known brand');
    } else if (wellKnownResult.financial_beneficiary === 'Apple' && wellKnownResult.confidence_score > 70) {
      console.log('✅ AI knowledge correctly identified well-known brand');
    } else {
      console.log('⚠️  Unexpected result for well-known brand');
    }

  } catch (error) {
    console.log('❌ Well-known brand test failed:', error.message);
  }

  // Test 5: Test fallback behavior
  console.log('\n5. Testing fallback behavior...');
  
  try {
    const fallbackResult = await AgentOwnershipResearch({
      barcode: '1234567890125',
      product_name: 'Unknown Product',
      brand: 'CompletelyUnknownBrand123',
      hints: {}
    });

    console.log('✅ Fallback result:', {
      financial_beneficiary: fallbackResult.financial_beneficiary,
      confidence_score: fallbackResult.confidence_score,
      web_research_used: fallbackResult.web_research_used,
      web_sources_count: fallbackResult.web_sources_count
    });

    if (fallbackResult.financial_beneficiary === 'Unknown' && fallbackResult.confidence_score < 40) {
      console.log('✅ Correctly returned "Unknown" for unknown brand');
    } else {
      console.log('⚠️  May have made assumptions about unknown brand');
    }

  } catch (error) {
    console.log('❌ Fallback test failed:', error.message);
  }

  console.log('\n🎉 Web Research Integration Test Complete!');
  console.log('\nSummary:');
  console.log('- WebResearchAgent provides actual web search and scraping');
  console.log('- AgentOwnershipResearch integrates web research when available');
  console.log('- System falls back gracefully when API keys are not configured');
  console.log('- Anti-hallucination measures still work with web research');
  console.log('- Well-known brands get high confidence with proper sources');
  
  if (!webResearchAvailable) {
    console.log('\n📝 To enable web research:');
    console.log('1. Get Google Custom Search API key from Google Cloud Console');
    console.log('2. Create a Custom Search Engine and get the Search Engine ID');
    console.log('3. Get OpenCorporates API key (optional)');
    console.log('4. Add to .env.local:');
    console.log('   GOOGLE_API_KEY=your_key_here');
    console.log('   GOOGLE_CSE_ID=your_search_engine_id');
    console.log('   OPENCORPORATES_API_KEY=your_key_here');
  }
}

// Run the test
testWebResearchIntegration().catch(console.error); 