import { ragKnowledgeBase } from './src/lib/agents/rag-knowledge-base.js';
import { EnhancedAgentOwnershipResearch } from './src/lib/agents/enhanced-ownership-research-agent.js';

async function testRAGSystem() {
  console.log('🧠 Testing RAG Knowledge Base System...\n');

  try {
    // Test 1: Store some sample knowledge base entries
    console.log('1. Storing sample knowledge base entries...');
    
    const sampleEntries = [
      {
        brand: 'ica',
        product_name: 'Tonfisk Filebitar I Olja',
        barcode: '7318690499534',
        financial_beneficiary: 'ICA Gruppen AB',
        beneficiary_country: 'Sweden',
        ownership_structure_type: 'Public Company',
        ownership_flow: [
          { name: 'ICA', type: 'Brand', country: 'Sweden', source: 'knowledge' },
          { name: 'ICA Gruppen AB', type: 'Ultimate Owner', country: 'Sweden', source: 'knowledge' }
        ],
        confidence_score: 95,
        reasoning: 'ICA is a well-known Swedish retail chain owned by ICA Gruppen AB, a publicly traded company in Sweden.',
        sources: ['https://www.icagruppen.se', 'https://en.wikipedia.org/wiki/ICA_(retailer)'],
        tags: ['swedish_retail', 'public_company', 'high_confidence']
      },
      {
        brand: 'nike',
        product_name: 'Air Max Running Shoes',
        barcode: '1234567890123',
        financial_beneficiary: 'Nike Inc.',
        beneficiary_country: 'United States',
        ownership_structure_type: 'Public Company',
        ownership_flow: [
          { name: 'Nike', type: 'Brand', country: 'United States', source: 'knowledge' },
          { name: 'Nike Inc.', type: 'Ultimate Owner', country: 'United States', source: 'knowledge' }
        ],
        confidence_score: 98,
        reasoning: 'Nike is a globally recognized brand owned by Nike Inc., a publicly traded company headquartered in the United States.',
        sources: ['https://www.nike.com', 'https://investors.nike.com'],
        tags: ['sports_brand', 'public_company', 'global_brand']
      },
      {
        brand: 'coca-cola',
        product_name: 'Classic Cola',
        barcode: '9876543210987',
        financial_beneficiary: 'The Coca-Cola Company',
        beneficiary_country: 'United States',
        ownership_structure_type: 'Public Company',
        ownership_flow: [
          { name: 'Coca-Cola', type: 'Brand', country: 'United States', source: 'knowledge' },
          { name: 'The Coca-Cola Company', type: 'Ultimate Owner', country: 'United States', source: 'knowledge' }
        ],
        confidence_score: 99,
        reasoning: 'Coca-Cola is one of the most recognizable brands globally, owned by The Coca-Cola Company, a publicly traded company.',
        sources: ['https://www.coca-cola.com', 'https://investors.coca-colacompany.com'],
        tags: ['beverage', 'public_company', 'global_brand']
      }
    ];

    for (const entry of sampleEntries) {
      try {
        const id = await ragKnowledgeBase.storeEntry(entry);
        console.log(`✅ Stored: ${entry.brand} → ${entry.financial_beneficiary} (ID: ${id})`);
      } catch (error) {
        console.log(`⚠️ Failed to store ${entry.brand}: ${error.message}`);
      }
    }

    // Test 2: Search for similar patterns
    console.log('\n2. Testing similarity search...');
    
    const searchTests = [
      { brand: 'ica', description: 'Exact match' },
      { brand: 'ikea', description: 'Similar Swedish brand' },
      { brand: 'adidas', description: 'Similar sports brand' },
      { brand: 'pepsi', description: 'Similar beverage brand' }
    ];

    for (const test of searchTests) {
      console.log(`\nSearching for: ${test.brand} (${test.description})`);
      const results = await ragKnowledgeBase.searchSimilar(test.brand, null, 3);
      
      if (results.length > 0) {
        console.log(`Found ${results.length} similar entries:`);
        results.forEach((entry, index) => {
          console.log(`  ${index + 1}. ${entry.brand} → ${entry.financial_beneficiary} (similarity: ${(entry.similarity_score || 0).toFixed(2)}, confidence: ${entry.confidence_score}%)`);
        });
      } else {
        console.log('  No similar entries found');
      }
    }

    // Test 3: Get ownership patterns by structure type
    console.log('\n3. Testing ownership pattern retrieval...');
    
    const patterns = await ragKnowledgeBase.getOwnershipPatterns('Public Company', 3);
    console.log(`Found ${patterns.length} public company patterns:`);
    patterns.forEach((pattern, index) => {
      console.log(`  ${index + 1}. ${pattern.brand} → ${pattern.financial_beneficiary} (confidence: ${pattern.confidence_score}%)`);
    });

    // Test 4: Get knowledge base statistics
    console.log('\n4. Knowledge base statistics...');
    
    const stats = await ragKnowledgeBase.getStats();
    console.log(`Total entries: ${stats.total_entries}`);
    console.log(`Average confidence: ${stats.avg_confidence.toFixed(1)}%`);
    console.log('Structure types:', stats.structure_types);
    console.log('Top brands:', stats.top_brands.slice(0, 3));

    // Test 5: Test enhanced agent with RAG integration
    console.log('\n5. Testing enhanced agent with RAG integration...');
    
    const agentResult = await EnhancedAgentOwnershipResearch({
      barcode: '7318690499534',
      product_name: 'Tonfisk Filebitar I Olja',
      brand: 'Ica',
      hints: {},
      enableEvaluation: true
    });

    console.log('✅ Enhanced Agent Result:', {
      financial_beneficiary: agentResult.financial_beneficiary,
      confidence_score: agentResult.confidence_score,
      result_type: agentResult.result_type,
      has_rag_match: !!agentResult.rag_match
    });

    if (agentResult.rag_match) {
      console.log('🎯 RAG Match Details:', {
        similarity_score: agentResult.rag_match.similarity_score,
        matched_brand: agentResult.rag_match.matched_brand
      });
    }

    console.log('\n✅ RAG System Test Complete!');

  } catch (error) {
    console.error('❌ RAG System Test Failed:', error);
  }
}

// Run the test
testRAGSystem(); 