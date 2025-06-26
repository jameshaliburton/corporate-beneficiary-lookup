import { QualityAssessmentAgent } from './src/lib/agents/quality-assessment-agent.js';

async function testQualityAssessment() {
  console.log('🧪 Testing Quality Assessment Agent...\n');
  
  const qualityAgent = new QualityAssessmentAgent();
  
  // Test cases with different quality levels
  const testCases = [
    {
      name: 'High Quality Data',
      data: {
        brand: 'Nestlé',
        product_name: 'KitKat Chocolate Bar',
        barcode: '1234567890123',
        category: 'Snacks',
        country: 'Switzerland',
        manufacturer: 'Nestlé S.A.',
        ingredients: 'Sugar, cocoa butter, milk, chocolate liquor',
        weight: '41.5g'
      }
    },
    {
      name: 'Low Quality Data - Unknown Brand',
      data: {
        brand: 'Unknown Brand',
        product_name: 'Product with 7710170009118 (Switzerland region)',
        barcode: '7710170009118',
        category: 'Food',
        country: 'Switzerland',
        manufacturer: '',
        ingredients: '',
        weight: ''
      }
    },
    {
      name: 'Medium Quality Data - Generic Product',
      data: {
        brand: 'ICA',
        product_name: 'Beans',
        barcode: '7318690499534',
        category: 'Food',
        country: 'Sweden',
        manufacturer: 'ICA Gruppen',
        ingredients: 'Beans, water, salt',
        weight: '400g'
      }
    },
    {
      name: 'Missing Critical Data',
      data: {
        brand: '',
        product_name: 'Generic Food Product',
        barcode: '9876543210987',
        category: 'Food',
        country: '',
        manufacturer: '',
        ingredients: '',
        weight: ''
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📦 Testing: ${testCase.name}`);
    console.log(`   Brand: "${testCase.data.brand}"`);
    console.log(`   Product: "${testCase.data.product_name}"`);
    
    try {
      const result = await qualityAgent.assessProductDataQuality(testCase.data);
      
      console.log(`   ✅ Assessment: ${result.is_meaningful ? 'MEANINGFUL' : 'NOT MEANINGFUL'}`);
      console.log(`   📊 Confidence: ${result.confidence}%`);
      console.log(`   🎯 Quality Score: ${result.quality_score}%`);
      console.log(`   💭 Reasoning: ${result.reasoning}`);
      if (result.issues && result.issues.length > 0) {
        console.log(`   ⚠️  Issues: ${result.issues.join(', ')}`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('🎯 Quality Assessment Agent test completed!');
}

// Run the test
testQualityAssessment().catch(console.error); 