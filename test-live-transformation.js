// Test the live transformation logic to verify barcode detection
const testLiveTransformation = async () => {
  try {
    console.log('Testing live transformation with barcode detection...');
    
    // Fetch the API data
    const response = await fetch('http://localhost:3000/api/evaluation/v3/results');
    const data = await response.json();
    
    // Find a result with barcode data
    const resultWithBarcode = data.results.find(r => r.barcode && r.barcode !== '' && r.barcode !== 'null');
    
    if (!resultWithBarcode) {
      console.log('❌ No results with barcode data found');
      return;
    }
    
    console.log('✅ Found result with barcode:', resultWithBarcode.barcode);
    
    // Simulate the exact transformation logic from the component
    const actualStages = resultWithBarcode.agent_execution_trace?.stages || [];
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
    
    const actualStageMap = new Map();
    actualStages.forEach((stage) => {
      const internalStageName = stageNameMapping[stage.stage] || stage.stage;
      actualStageMap.set(internalStageName, stage);
    });
    
    // Check input type (exact logic from component)
    const hasBarcode = resultWithBarcode.barcode && resultWithBarcode.barcode !== '' && resultWithBarcode.barcode !== 'null';
    const hasImageData = resultWithBarcode.source_type === 'image' || resultWithBarcode.metadata?.imageAnalysis;
    
    console.log('\nInput type analysis:');
    console.log('- Has barcode:', hasBarcode, `(${resultWithBarcode.barcode})`);
    console.log('- Has image data:', hasImageData);
    console.log('- Source type:', resultWithBarcode.source_type);
    
    // Transform with the exact logic from the component
    const transformedTrace = completePipeline.map((stageName) => {
      const actualStage = actualStageMap.get(stageName);
      
      if (actualStage) {
        return { stage: stageName, status: 'success', found: true };
      } else {
        const isImageStage = stageName === 'image_processing' || stageName === 'ocr_extraction' || 
                           stageName === 'barcode_scanning' || stageName === 'vision_analysis' ||
                           stageName === 'text_extraction' || stageName === 'product_detection' ||
                           stageName === 'brand_recognition';
        
        let status = 'not_run';
        let reasoning = 'Stage not executed';
        
        if (isImageStage) {
          if (hasBarcode || hasImageData) {
            status = 'missing_data';
            reasoning = 'Stage should have run for image/barcode input but data not captured in trace';
          } else {
            status = 'skipped';
            reasoning = 'Stage not applicable for this input type (no image/barcode data)';
          }
        } else {
          status = 'not_run';
          reasoning = 'Stage not executed in this trace';
        }
        
        return { 
          stage: stageName, 
          status: status, 
          found: false,
          reasoning: reasoning
        };
      }
    });
    
    // Check if the transformation is working correctly
    const imageStages = transformedTrace.filter(s => 
      s.stage === 'image_processing' || s.stage === 'ocr_extraction' || 
      s.stage === 'barcode_scanning' || s.stage === 'vision_analysis' ||
      s.stage === 'text_extraction' || s.stage === 'product_detection' || 
      s.stage === 'brand_recognition'
    );
    
    console.log('\nImage stage analysis:');
    imageStages.forEach(stage => {
      const expectedStatus = hasBarcode ? 'missing_data' : 'skipped';
      const isCorrect = stage.status === expectedStatus;
      console.log(`${isCorrect ? '✅' : '❌'} ${stage.stage}: ${stage.status} (expected: ${expectedStatus})`);
      console.log(`   └─ ${stage.reasoning}`);
    });
    
    const correctCount = imageStages.filter(s => 
      (hasBarcode && s.status === 'missing_data') || 
      (!hasBarcode && s.status === 'skipped')
    ).length;
    
    console.log(`\nAccuracy: ${correctCount}/${imageStages.length} image stages have correct status`);
    
    if (correctCount === imageStages.length) {
      console.log('✅ Transformation logic is working correctly!');
    } else {
      console.log('❌ Transformation logic has issues');
    }
    
  } catch (error) {
    console.error('Error testing live transformation:', error);
  }
};

testLiveTransformation(); 