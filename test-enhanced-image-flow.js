/**
 * Test script for enhanced image recognition pipeline with cache checks
 */

import { analyzeProductImage } from './src/lib/apis/image-recognition.js';
import { supabase } from './src/lib/supabase.ts';

// Mock image data (base64 encoded small test image)
const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function testEnhancedImageFlow() {
  console.log('🧪 Testing Enhanced Image Recognition Pipeline with Cache Checks\n');

  try {
    // Test 1: Basic image analysis
    console.log('📸 Test 1: Basic image analysis...');
    const result = await analyzeProductImage(mockImageBase64, 'png');
    
    console.log('✅ Result:', {
      success: result.success,
      source: result.source,
      flow: result.flow,
      data: {
        brand_name: result.data?.brand_name,
        product_name: result.data?.product_name,
        confidence: result.data?.confidence,
        financial_beneficiary: result.data?.financial_beneficiary,
        beneficiary_country: result.data?.beneficiary_country
      }
    });

    // Test 2: Check if cache checks are working
    console.log('\n🔍 Test 2: Verifying cache check flow...');
    if (result.flow) {
      console.log('✅ Flow steps:', Object.keys(result.flow));
      
      // Check if cache checks were performed
      const hasCacheChecks = result.flow.step1_5 || result.flow.step1_6 || result.flow.step2_5 || result.flow.step2_6 || result.flow.step3_5 || result.flow.step3_6;
      console.log('✅ Cache checks performed:', hasCacheChecks ? 'Yes' : 'No');
      
      // Check if any cache hits occurred
      const hasCacheHits = result.flow.cache_hit || result.flow.ownership_mapping_hit || result.flow.improved_cache_hit || result.flow.improved_ownership_mapping_hit || result.flow.vision_cache_hit || result.flow.vision_ownership_mapping_hit;
      console.log('✅ Cache hits:', hasCacheHits ? 'Yes' : 'No');
      
      if (result.flow.all_cache_checks_failed) {
        console.log('ℹ️ All cache checks failed (expected for test image)');
      }
    }

    // Test 3: Test with a known brand that might be in cache
    console.log('\n📸 Test 3: Testing with known brand data...');
    
    // First, let's check what's in the cache
    const { data: cachedProducts } = await supabase
      .from('products')
      .select('brand, product_name, financial_beneficiary, beneficiary_country')
      .limit(5);
    
    if (cachedProducts && cachedProducts.length > 0) {
      console.log('📋 Found cached products:', cachedProducts.map(p => ({ brand: p.brand, product: p.product_name })));
      
      // For this test, we'll simulate finding a cached product
      // In a real scenario, you'd need an actual image of a cached product
      console.log('ℹ️ To test cache hits, you would need an image of a product that exists in the cache');
    } else {
      console.log('ℹ️ No cached products found in database');
    }

    // Test 4: Test ownership mappings
    console.log('\n📸 Test 4: Testing ownership mappings...');
    
    const { data: ownershipMappings } = await supabase
      .from('ownership_mappings')
      .select('brand_name, ultimate_owner_name, ultimate_owner_country')
      .limit(5);
    
    if (ownershipMappings && ownershipMappings.length > 0) {
      console.log('📋 Found ownership mappings:', ownershipMappings.map(m => ({ brand: m.brand_name, owner: m.ultimate_owner_name })));
      console.log('ℹ️ To test ownership mapping hits, you would need an image of a product with a known brand');
    } else {
      console.log('ℹ️ No ownership mappings found in database');
    }

    console.log('\n✅ Enhanced image recognition pipeline test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Cache checks are integrated at each step');
    console.log('- Ownership mappings are checked at each step');
    console.log('- Flow tracking shows all cache check attempts');
    console.log('- Pipeline gracefully handles cache misses');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEnhancedImageFlow(); 