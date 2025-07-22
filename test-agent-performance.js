/**
 * Agent Pipeline Performance Test Script
 * Runs multiple scans to collect timing and usage data
 */

const testCases = [
  // Real products with known ownership
  { barcode: '1234567890123', product_name: 'Coca-Cola Classic', brand: 'Coca-Cola' },
  { barcode: '9876543210987', product_name: 'iPhone 15', brand: 'Apple' },
  { barcode: '5556667778889', product_name: 'MacBook Pro', brand: 'Apple' },
  { barcode: '1112223334445', product_name: 'Nike Air Max', brand: 'Nike' },
  { barcode: '7778889990001', product_name: 'Samsung Galaxy', brand: 'Samsung' },
  
  // Generic/unknown brands
  { barcode: 'generic001', product_name: 'Generic Product', brand: 'Unknown Brand' },
  { barcode: 'unknown002', product_name: 'Mystery Item', brand: 'No Brand' },
  { barcode: 'test003', product_name: 'Test Product', brand: 'Test Brand' },
  
  // European brands
  { barcode: 'euro001', product_name: 'Volvo XC90', brand: 'Volvo' },
  { barcode: 'euro002', product_name: 'IKEA Furniture', brand: 'IKEA' },
  { barcode: 'euro003', product_name: 'Nestle Water', brand: 'Nestle' },
  
  // Asian brands
  { barcode: 'asia001', product_name: 'Toyota Camry', brand: 'Toyota' },
  { barcode: 'asia002', product_name: 'Sony TV', brand: 'Sony' },
  { barcode: 'asia003', product_name: 'Honda Civic', brand: 'Honda' },
  
  // Food/beverage brands
  { barcode: 'food001', product_name: 'Pepsi Cola', brand: 'Pepsi' },
  { barcode: 'food002', product_name: 'Kellogg Corn Flakes', brand: 'Kellogg' },
  { barcode: 'food003', product_name: 'Heinz Ketchup', brand: 'Heinz' },
  
  // Tech brands
  { barcode: 'tech001', product_name: 'Microsoft Surface', brand: 'Microsoft' },
  { barcode: 'tech002', product_name: 'Google Pixel', brand: 'Google' },
  { barcode: 'tech003', product_name: 'Amazon Kindle', brand: 'Amazon' },
  
  // Luxury brands
  { barcode: 'luxury001', product_name: 'Mercedes S-Class', brand: 'Mercedes-Benz' },
  { barcode: 'luxury002', product_name: 'BMW 7 Series', brand: 'BMW' },
  { barcode: 'luxury003', product_name: 'Audi A8', brand: 'Audi' }
];

async function runPerformanceTest() {
  console.log('🧠 Starting Agent Pipeline Performance Test');
  console.log(`📊 Running ${testCases.length} test cases...`);
  console.log('='.repeat(80));
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🔍 Test ${i + 1}/${testCases.length}: ${testCase.brand} - ${testCase.product_name}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode: testCase.barcode,
          product_name: testCase.product_name,
          brand: testCase.brand,
          evaluation_mode: true,
          forceFullTrace: true
        })
      });
      
      const result = await response.json();
      
      results.push({
        testCase: testCase,
        success: result.success,
        duration: Date.now() - startTime,
        result: result
      });
      
      console.log(`✅ Completed in ${Date.now() - startTime}ms`);
      console.log(`   Owner: ${result.financial_beneficiary || 'Unknown'}`);
      console.log(`   Confidence: ${result.confidence_score || 0}%`);
      
    } catch (error) {
      console.error(`❌ Test ${i + 1} failed:`, error.message);
      results.push({
        testCase: testCase,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(80));
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Failed: ${failedTests.length}/${results.length}`);
  console.log(`⏱️  Total Duration: ${Date.now() - startTime}ms`);
  console.log(`📈 Average Duration: ${Math.round((Date.now() - startTime) / results.length)}ms per test`);
  
  // Agent usage analysis
  console.log('\n🔍 AGENT USAGE ANALYSIS');
  console.log('-'.repeat(40));
  
  // This will be available in the server logs
  console.log('📝 Check server console for detailed agent timing and usage logs');
  console.log('📝 Look for [AgentLog], [AgentTimer], and [AgentUsage] entries');
  
  return results;
}

// Run the test
if (require.main === module) {
  runPerformanceTest()
    .then(results => {
      console.log('\n✅ Performance test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Performance test failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTest, testCases }; 