// Simple test of the transformation logic
const testTransformation = () => {
  console.log('Testing transformation logic...');
  
  // Mock API response
  const mockApiResponse = {
    results: [{
      brand: 'Test Brand',
      agent_type: 'enhanced_ownership_research',
      prompt_version: '1.0',
      agent_execution_trace: {
        stages: [{
          stage: 'ownership-analysis',
          reasoning: ['Test reasoning'],
          confidence: 0.95,
          timestamp: '2024-01-01T00:00:00Z',
          status: 'success',
          duration: 1000,
          input: 'Test input',
          output: 'Test output',
          metadata: {}
        }]
      }
    }]
  };
  
  // Mock transformation logic
  const completePipeline = [
    'image_processing', 'ocr_extraction', 'barcode_scanning', 'vision_analysis',
    'text_extraction', 'product_detection', 'brand_recognition',
    'cache_check', 'static_mapping', 'sheets_mapping',
    'llm_first_analysis', 'ownership_analysis', 'rag_retrieval',
    'query_builder', 'web_research', 'validation', 'database_save'
  ];
  
  const stageNameMapping = {
    'ownership-analysis': 'ownership_analysis',
    'cache-check': 'cache_check',
    'static-mapping': 'static_mapping',
    'sheets-mapping': 'sheets_mapping',
    'web-research': 'web_research',
    'llm-first-analysis': 'llm_first_analysis',
    'rag-retrieval': 'rag_retrieval',
    'query-builder': 'query_builder',
    'database-save': 'database_save'
  };
  
  const actualStages = mockApiResponse.results[0].agent_execution_trace.stages;
  const actualStageMap = new Map();
  
  actualStages.forEach((stage) => {
    const internalStageName = stageNameMapping[stage.stage] || stage.stage;
    actualStageMap.set(internalStageName, stage);
  });
  
  console.log('Actual stages from API:', actualStages.map(s => s.stage));
  console.log('Mapped stage names:', Array.from(actualStageMap.keys()));
  
  // Test the transformation
  const transformedTrace = completePipeline.map((stageName) => {
    const actualStage = actualStageMap.get(stageName);
    
    if (actualStage) {
      console.log(`✅ Stage ${stageName} found in API data`);
      return { stage: stageName, status: 'success', found: true };
    } else {
      console.log(`❌ Stage ${stageName} not found - will be created as placeholder`);
      return { stage: stageName, status: 'not_run', found: false };
    }
  });
  
  console.log('\nTransformation results:');
  console.log(`Total stages: ${transformedTrace.length}`);
  console.log(`Found stages: ${transformedTrace.filter(s => s.found).length}`);
  console.log(`Missing stages: ${transformedTrace.filter(s => !s.found).length}`);
  
  return transformedTrace;
};

testTransformation(); 