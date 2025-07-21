async function testTraceTransformation() {
  try {
    console.log('Testing trace transformation...');
    
    const response = await fetch('http://localhost:3000/api/evaluation/v3/results');
    const data = await response.json();
    
    console.log('API Response structure:');
    console.log('- Results count:', data.results?.length || 0);
    console.log('- First result keys:', Object.keys(data.results?.[0] || {}));
    
    if (data.results?.[0]?.agent_execution_trace) {
      console.log('- Agent execution trace stages:', data.results[0].agent_execution_trace.stages?.length || 0);
      console.log('- Stage names:', data.results[0].agent_execution_trace.stages?.map(s => s.stage) || []);
    }
    
    // Test the frontend transformation by fetching the page
    const pageResponse = await fetch('http://localhost:3000/evaluation-v4');
    const pageHtml = await pageResponse.text();
    
    console.log('\nFrontend page loaded successfully');
    console.log('- Page length:', pageHtml.length);
    
    // Look for stage-related content
    const stageIndicators = [
      'Image Processor',
      'OCR Specialist', 
      'Barcode Scanner',
      'Vision Analyst',
      'Text Extractor',
      'Product Detector',
      'Brand Recognizer',
      'Cache Manager',
      'Static Mapper',
      'Sheets Mapper',
      'LLM Analyzer',
      'Ownership Analyst',
      'RAG Retriever',
      'Query Builder',
      'Web Researcher',
      'Validator',
      'Database Saver'
    ];
    
    console.log('\nLooking for stage indicators in page:');
    stageIndicators.forEach(stage => {
      const found = pageHtml.includes(stage);
      console.log(`- ${stage}: ${found ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('Error testing transformation:', error);
  }
}

testTraceTransformation(); 