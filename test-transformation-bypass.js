// Test the transformation logic by directly calling the API and checking the response
const testTransformationBypass = async () => {
  try {
    console.log('Testing transformation bypass with improved status logic...');
    
    // Fetch the API data
    const response = await fetch('http://localhost:3000/api/evaluation/v3/results');
    const data = await response.json();
    
    console.log('API data fetched successfully');
    console.log('Results count:', data.results?.length || 0);
    
    // Find a result with barcode data
    const resultWithBarcode = data.results.find(r => r.barcode && r.barcode !== '' && r.barcode !== 'null');
    const testResult = resultWithBarcode || data.results[0];
    
    console.log('\nTesting with result:', {
      brand: testResult.brand,
      product: testResult.product_name,
      barcode: testResult.barcode,
      source_type: testResult.source_type
    });
    
    // Simulate the transformation logic
    const actualStages = testResult.agent_execution_trace?.stages || [];
    
    console.log('Original stages from API:', actualStages.map(s => s.stage));
    
    // Define the complete pipeline
    const completePipeline = [
      'image_processing', 'ocr_extraction', 'barcode_scanning', 'vision_analysis',
      'text_extraction', 'product_detection', 'brand_recognition',
      'cache_check', 'static_mapping', 'sheets_mapping',
      'llm_first_analysis', 'ownership_analysis', 'rag_retrieval',
      'query_builder', 'web_research', 'validation', 'database_save'
    ];
    
    // Stage name mapping
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
    
    // Create stage map
    const actualStageMap = new Map();
    actualStages.forEach((stage) => {
      const internalStageName = stageNameMapping[stage.stage] || stage.stage;
      actualStageMap.set(internalStageName, stage);
    });
    
    console.log('Mapped stage names:', Array.from(actualStageMap.keys()));
    
    // Check input type
    const hasBarcode = testResult.barcode && testResult.barcode !== '' && testResult.barcode !== 'null';
    const hasImageData = testResult.source_type === 'image' || testResult.metadata?.imageAnalysis;
    
    console.log('\nInput type analysis:');
    console.log('- Has barcode:', hasBarcode, `(${testResult.barcode})`);
    console.log('- Has image data:', hasImageData);
    console.log('- Source type:', testResult.source_type);
    
    // Transform the trace with improved logic
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
    
    console.log('\nTransformation results:');
    console.log(`Total stages: ${transformedTrace.length}`);
    console.log(`Found stages: ${transformedTrace.filter(s => s.found).length}`);
    console.log(`Missing data stages: ${transformedTrace.filter(s => s.status === 'missing_data').length}`);
    console.log(`Skipped stages: ${transformedTrace.filter(s => s.status === 'skipped').length}`);
    console.log(`Not run stages: ${transformedTrace.filter(s => s.status === 'not_run').length}`);
    
    // Show the stage breakdown
    console.log('\nStage breakdown:');
    transformedTrace.forEach(stage => {
      let icon = '❌';
      if (stage.found) icon = '✅';
      else if (stage.status === 'missing_data') icon = '🔍';
      else if (stage.status === 'skipped') icon = '⏭️';
      
      console.log(`${icon} ${stage.stage} (${stage.status})`);
      if (stage.reasoning) console.log(`   └─ ${stage.reasoning}`);
    });
    
    return transformedTrace;
    
  } catch (error) {
    console.error('Error testing transformation:', error);
  }
};

testTransformationBypass(); 