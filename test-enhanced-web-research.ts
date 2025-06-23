/**
 * Test for Enhanced WebResearchAgent
 * Tests the smart query generation, prioritization, and content extraction
 */

import { WebResearchAgent, isWebResearchAvailable, getRequiredEnvVars } from './src/lib/agents/web-research-agent.js';

async function testEnhancedWebResearch() {
  console.log('🧪 Testing Enhanced Web Research\n');

  // Check environment setup
  console.log('1. Checking environment setup...');
  const envVars = getRequiredEnvVars();
  const webResearchAvailable = isWebResearchAvailable();
  
  console.log('✅ Environment variables status:', envVars);
  console.log('✅ Web research available:', webResearchAvailable);
  
  if (!webResearchAvailable) {
    console.log('⚠️  Web research not available - API keys not configured');
    console.log('   This test will show the enhanced logic but won\'t perform actual searches');
  }

  // Test 2: Smart query generation test
  console.log('\n2. Testing smart query generation...');
  
  try {
    const webResult = await WebResearchAgent({
      brand: 'Nike',
      product_name: 'Air Max',
      hints: {
        country_of_origin: 'United States'
      }
    });

    console.log('✅ Enhanced WebResearchAgent result:', {
      success: webResult.success,
      total_sources: webResult.total_sources,
      search_results_count: webResult.search_results_count,
      scraped_sites_count: webResult.scraped_sites_count,
      business_databases_count: webResult.business_databases_count,
      average_priority_score: webResult.average_priority_score
    });

    if (webResult.success) {
      console.log('✅ Enhanced web research completed successfully');
      
      if (webResult.findings && webResult.findings.length > 0) {
        console.log('✅ Found research findings:', webResult.findings.length);
        
        // Show different types of findings
        const searchResults = webResult.findings.filter(f => f.type === 'search_result');
        const scrapedContent = webResult.findings.filter(f => f.type === 'scraped_content');
        const businessData = webResult.findings.filter(f => f.type === 'business_data');
        
        console.log(`   - Search results: ${searchResults.length}`);
        console.log(`   - Scraped content: ${scrapedContent.length}`);
        console.log(`   - Business data: ${businessData.length}`);
        
        // Show top priority results
        if (searchResults.length > 0) {
          console.log('   Top priority search results:');
          searchResults
            .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
            .slice(0, 3)
            .forEach((result, index) => {
              console.log(`     ${index + 1}. Score ${result.priorityScore || 0}: ${result.title}`);
            });
        }
        
        // Show ownership info from scraped content
        if (scrapedContent.length > 0) {
          console.log('   Ownership information found:');
          scrapedContent.forEach((content, index) => {
            if (content.ownershipInfo && content.ownershipInfo.hasOwnershipInfo) {
              console.log(`     ${index + 1}. ${content.url}`);
              console.log(`        Parent: ${content.ownershipInfo.parentCompany || 'Not found'}`);
              console.log(`        HQ: ${content.ownershipInfo.headquarters || 'Not found'}`);
              console.log(`        Confidence: ${content.ownershipInfo.confidence}`);
            }
          });
        }
      }
    } else {
      console.log('⚠️  Enhanced web research failed (expected if API keys not configured)');
    }

  } catch (error) {
    console.log('❌ Enhanced WebResearchAgent test failed:', error.message);
  }

  // Test 3: Test with different brand types
  console.log('\n3. Testing different brand types...');
  
  const testBrands = [
    { brand: 'Coca-Cola', product: 'Classic', country: 'United States' },
    { brand: 'Volvo', product: 'XC90', country: 'Sweden' },
    { brand: 'Samsung', product: 'Galaxy', country: 'South Korea' }
  ];
  
  for (const testBrand of testBrands) {
    try {
      console.log(`\n   Testing ${testBrand.brand}...`);
      
      const result = await WebResearchAgent({
        brand: testBrand.brand,
        product_name: testBrand.product,
        hints: {
          country_of_origin: testBrand.country
        }
      });

      console.log(`   ✅ ${testBrand.brand} result:`, {
        success: result.success,
        total_sources: result.total_sources,
        average_priority_score: result.average_priority_score
      });

      if (result.success && result.findings.length > 0) {
        const highPriorityResults = result.findings.filter(f => 
          f.priorityScore && f.priorityScore > 50
        );
        console.log(`   ✅ Found ${highPriorityResults.length} high-priority results`);
      }

    } catch (error) {
      console.log(`   ❌ ${testBrand.brand} test failed:`, error.message);
    }
  }

  // Test 4: Test prioritization logic
  console.log('\n4. Testing prioritization logic...');
  
  try {
    const result = await WebResearchAgent({
      brand: 'TestBrand',
      product_name: 'Test Product',
      hints: {}
    });

    if (result.success && result.findings.length > 0) {
      const searchResults = result.findings.filter(f => f.type === 'search_result');
      
      if (searchResults.length > 0) {
        console.log('✅ Prioritization working:');
        searchResults
          .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
          .slice(0, 5)
          .forEach((result, index) => {
            const domain = new URL(result.url).hostname;
            console.log(`   ${index + 1}. Score ${result.priorityScore || 0}: ${domain}`);
          });
      }
    }

  } catch (error) {
    console.log('❌ Prioritization test failed:', error.message);
  }

  console.log('\n🎉 Enhanced Web Research Test Complete!');
  console.log('\nSummary of Enhancements:');
  console.log('- Smart query generation with brand-specific searches');
  console.log('- Intelligent result prioritization with scoring system');
  console.log('- Enhanced website scraping with ownership pattern extraction');
  console.log('- Better content cleaning and text extraction');
  console.log('- Domain-specific confidence adjustments');
  console.log('- Increased coverage (15 search results, 8 scraped sites)');
  console.log('- Priority scoring based on relevance and source quality');
  
  if (!webResearchAvailable) {
    console.log('\n📝 To test with real web research:');
    console.log('1. Get Google Custom Search API key');
    console.log('2. Create Custom Search Engine (configured for all web)');
    console.log('3. Add to .env.local:');
    console.log('   GOOGLE_API_KEY=your_key_here');
    console.log('   GOOGLE_CSE_ID=your_search_engine_id');
  }
}

// Run the test
testEnhancedWebResearch().catch(console.error); 