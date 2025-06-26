import { lookupProduct } from './src/lib/apis/enhanced-barcode-lookup.js';

async function testEnhancedPipeline() {
  console.log('🧪 Testing Enhanced Barcode Lookup Pipeline...\n');
  
  // Test with the beans barcode that was causing issues
  const testBarcode = '7710170009118'; // Beans barcode
  
  try {
    console.log(`📦 Testing barcode: ${testBarcode}`);
    console.log('⏳ Starting enhanced lookup...\n');
    
    const result = await lookupProduct(testBarcode);
    
    console.log('✅ Enhanced lookup completed!');
    console.log('\n📊 Results:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if we got meaningful data
    if (result.success) {
      console.log('\n🎯 Analysis:');
      console.log(`- Product found: ${result.data?.product_name || result.product_name || 'Unknown'}`);
      console.log(`- Brand: ${result.data?.brand || result.brand || 'Unknown'}`);
      console.log(`- Company: ${result.data?.company || result.company || 'Unknown'}`);
      console.log(`- Sources used: ${result.data?.sources?.length || result.sources?.length || 0}`);
      
      if (result.data?.sources || result.sources) {
        console.log('\n🔍 Sources:');
        (result.data?.sources || result.sources || []).forEach((source, index) => {
          console.log(`  ${index + 1}. ${source.name || source.source}: ${source.success ? '✅' : '❌'} - ${source.data?.product_name || source.product_name || 'No data'}`);
        });
      }
    } else {
      console.log('\n❌ Lookup failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testEnhancedPipeline(); 