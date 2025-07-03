// Test data for ProductResultScreenV2
const testResult = {
  success: true,
  product_name: 'Dark Chocolate Heart',
  brand: 'Malmö Chokladfabrik',
  barcode: 'img_1751532465283', // Image-based, not barcode
  financial_beneficiary: 'Malmö Chokladfabrik AB',
  beneficiary_country: 'Sweden',
  beneficiary_flag: '🇸🇪',
  confidence_score: 90,
  ownership_structure_type: 'Private Company',
  user_contributed: false,
  ownership_flow: [
    {
      name: 'Malmö Chokladfabrik',
      type: 'Brand',
      country: 'Sweden',
      flag: '🇸🇪',
      ultimate: false
    },
    {
      name: 'Malmö Chokladfabrik AB',
      type: 'Ultimate Owner',
      country: 'Sweden',
      flag: '🇸🇪',
      ultimate: true
    }
  ],
  reasoning: 'Malmö Chokladfabrik appears to be an independent Swedish chocolate manufacturer based in Malmö, Sweden. The company operates as Malmö Chokladfabrik AB, which is its legal business entity name. Based on available information, it appears to be a privately-held company rather than part of a larger corporate group.',
  sources: [
    'LLM analysis of Malmö Chokladfabrik',
    'Swedish business registries',
    'Company website analysis'
  ],
  result_type: 'llm_first_analysis',
  agent_execution_trace: {
    trace_id: 'query_1751532472322_2oqhabdo1',
    stages: [
      {
        name: 'Vision Analysis',
        duration_ms: 3428,
        status: 'completed',
        data: { brand: 'Malmö Chokladfabrik' }
      },
      {
        name: 'Quality Assessment',
        duration_ms: 1200,
        status: 'completed',
        data: { is_meaningful: true, confidence: 80 }
      },
      {
        name: 'Ownership Research',
        duration_ms: 6166,
        status: 'completed',
        data: { beneficiary: 'Malmö Chokladfabrik AB' }
      }
    ],
    performance_metrics: {
      total_duration_ms: 10794,
      api_calls: 3
    }
  },
  lookup_trace: ['vision_analysis', 'quality_assessment', 'ownership_research']
};

// Test barcode result
const testBarcodeResult = {
  ...testResult,
  barcode: '7318690123456', // Real barcode
  product_name: 'Tonfisk Filebitar I Olja',
  brand: 'Ica',
  financial_beneficiary: 'ICA Sverige AB',
  confidence_score: 75
};

console.log('✅ ProductResultScreenV2 Test Data Ready');
console.log('📷 Image-based result:', testResult.brand, '→', testResult.financial_beneficiary);
console.log('📱 Barcode-based result:', testBarcodeResult.brand, '→', testBarcodeResult.financial_beneficiary);
console.log('🔍 Detection method logic:');
console.log('  - Image barcode (img_*):', testResult.barcode.startsWith('img_') ? 'Photo analysis' : 'Barcode scan');
console.log('  - Real barcode:', testBarcodeResult.barcode.startsWith('img_') ? 'Photo analysis' : 'Barcode scan'); 