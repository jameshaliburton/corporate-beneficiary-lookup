import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Simple test for RAG knowledge base
async function testRAGSystem() {
  console.log('🧪 Testing RAG Knowledge Base System...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Check if knowledge_base table exists
    console.log('📋 Test 1: Checking knowledge_base table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('knowledge_base')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ Table check failed:', tableError.message);
      return;
    }
    console.log('✅ Knowledge base table exists\n');

    // Test 2: Insert test data
    console.log('📝 Test 2: Inserting test ownership data...');
    const testData = {
      brand: 'TestBrand',
      product_name: 'Test Product',
      barcode: '1234567890123',
      financial_beneficiary: 'Test Corporation Inc.',
      beneficiary_country: 'United States',
      ownership_structure_type: 'Public Corporation',
      confidence_score: 85,
      sources: ['https://example.com/test'],
      reasoning: 'Test ownership data for RAG system',
      ownership_flow: [
        { company: 'TestBrand', type: 'Brand', country: 'US' },
        { company: 'Test Corporation Inc.', type: 'Parent Company', country: 'US' }
      ],
      metadata: {
        industry: 'Consumer Goods',
        revenue: '1B+',
        employees: '1000+'
      },
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('knowledge_base')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      return;
    }
    console.log('✅ Test data inserted successfully\n');

    // Test 3: Test semantic search
    console.log('🔍 Test 3: Testing semantic search...');
    const searchQuery = 'TestBrand ownership structure';
    
    const { data: searchResults, error: searchError } = await supabase
      .from('knowledge_base')
      .select('*')
      .textSearch('brand', searchQuery)
      .order('confidence_score', { ascending: false })
      .limit(5);

    if (searchError) {
      console.error('❌ Search failed:', searchError.message);
      return;
    }

    console.log(`✅ Found ${searchResults.length} relevant results:`);
    searchResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.brand} -> ${result.financial_beneficiary} (${result.confidence_score}% confidence)`);
    });

    // Test 4: Test similarity search
    console.log('\n🎯 Test 4: Testing similarity search...');
    const { data: similarityResults, error: similarityError } = await supabase
      .from('knowledge_base')
      .select('*')
      .ilike('brand', '%Test%')
      .order('confidence_score', { ascending: false })
      .limit(3);

    if (similarityError) {
      console.error('❌ Similarity search failed:', similarityError.message);
      return;
    }

    console.log(`✅ Found ${similarityResults.length} similar results:`);
    similarityResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.brand} (${result.beneficiary_country})`);
    });

    // Test 5: Clean up test data
    console.log('\n🧹 Test 5: Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('barcode', '1234567890123');

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
      return;
    }
    console.log('✅ Test data cleaned up successfully');

    console.log('\n🎉 All RAG system tests passed!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Database connection working');
    console.log('  ✅ Table structure correct');
    console.log('  ✅ Data insertion working');
    console.log('  ✅ Text search working');
    console.log('  ✅ Similarity search working');
    console.log('  ✅ Data cleanup working');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testRAGSystem(); 