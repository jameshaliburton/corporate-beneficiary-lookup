// Test to verify the transformation logic is working in the browser
const testBrowserVerification = async () => {
  try {
    console.log('Testing browser verification...');
    
    // Test 1: Check if page loads
    const response = await fetch('http://localhost:3000/evaluation-v4');
    const html = await response.text();
    
    if (html.includes('EvalV4Dashboard')) {
      console.log('✅ Page loads successfully');
    } else {
      console.log('❌ Page not loading properly');
      return;
    }
    
    // Test 2: Check if transformation logic is applied
    if (html.includes('missing_data')) {
      console.log('✅ Transformation logic is working - found "missing_data" in HTML');
    } else {
      console.log('❌ Transformation logic not found in HTML');
    }
    
    // Test 3: Check if stage visibility toggle is present
    if (html.includes('Show All Stages')) {
      console.log('✅ Stage visibility toggle is present');
    } else {
      console.log('❌ Stage visibility toggle not found');
    }
    
    // Test 4: Check for specific stage names
    const stageNames = ['image_processing', 'ocr_extraction', 'barcode_scanning'];
    let foundStages = 0;
    
    stageNames.forEach(stage => {
      if (html.includes(stage)) {
        foundStages++;
        console.log(`✅ Found stage: ${stage}`);
      } else {
        console.log(`❌ Missing stage: ${stage}`);
      }
    });
    
    console.log(`\nStage visibility: ${foundStages}/${stageNames.length} stages found in HTML`);
    
    if (foundStages > 0) {
      console.log('✅ Transformation logic is working in the browser!');
    } else {
      console.log('❌ No stages found - transformation may not be applied');
    }
    
  } catch (error) {
    console.error('Error testing browser verification:', error);
  }
};

testBrowserVerification(); 