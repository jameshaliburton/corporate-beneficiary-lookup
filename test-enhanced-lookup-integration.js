/**
 * Test Enhanced Lookup Integration
 * Verifies that the lookup API uses the enhanced image analysis with trace recording
 */

async function testEnhancedLookupIntegration() {
  console.log('🧪 Testing Enhanced Lookup Integration')
  
  try {
    // Create a simple test image (base64 encoded small image)
    const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
    
    console.log('📸 Testing lookup API with enhanced image analysis...')
    
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: testImageBase64,
        evaluation_mode: false
      }),
    })
    
    const result = await response.json()
    
    console.log('✅ Lookup API response received')
    console.log('📊 Success:', result.success)
    console.log('📊 Result type:', result.result_type)
    
    // Check if the result includes image processing trace
    if (result.image_processing_trace) {
      console.log('✅ Image processing trace found in result!')
      console.log('📊 Trace stages:', result.image_processing_trace.stages?.length || 0)
      
      const stages = result.image_processing_trace.stages || []
      console.log('📊 Stage names:', stages.map(s => s.stage))
      
      // Check for early stages
      const earlyStages = ['image_processing', 'ocr_extraction', 'barcode_scanning']
      const foundEarlyStages = earlyStages.filter(stage => 
        stages.some(s => s.stage === stage)
      )
      
      console.log('✅ Found early stages:', foundEarlyStages)
      
      // Check for enhanced fields
      const stagesWithVariables = stages.filter(s => s.variables)
      const stagesWithConfig = stages.filter(s => s.config)
      const stagesWithPrompts = stages.filter(s => s.compiled_prompt || s.prompt_template)
      
      console.log('📊 Stages with variables:', stagesWithVariables.length)
      console.log('📊 Stages with config:', stagesWithConfig.length)
      console.log('📊 Stages with prompts:', stagesWithPrompts.length)
      
    } else {
      console.log('❌ No image processing trace found in result')
    }
    
    // Check if the result includes agent execution trace
    if (result.agent_execution_trace) {
      console.log('✅ Agent execution trace found in result!')
      console.log('📊 Total stages:', result.agent_execution_trace.stages?.length || 0)
      
      const stages = result.agent_execution_trace.stages || []
      console.log('📊 All stage names:', stages.map(s => s.stage))
      
      // Check for both image processing and ownership research stages
      const imageStages = ['image_processing', 'ocr_extraction', 'barcode_scanning']
      const ownershipStages = ['cache_check', 'static_mapping', 'llm_first_analysis', 'ownership_analysis']
      
      const foundImageStages = imageStages.filter(stage => 
        stages.some(s => s.stage === stage)
      )
      const foundOwnershipStages = ownershipStages.filter(stage => 
        stages.some(s => s.stage === stage)
      )
      
      console.log('✅ Found image processing stages:', foundImageStages)
      console.log('✅ Found ownership research stages:', foundOwnershipStages)
      
    } else {
      console.log('❌ No agent execution trace found in result')
    }
    
  } catch (error) {
    console.error('❌ Error testing enhanced lookup integration:', error)
  }
}

// Run the test
testEnhancedLookupIntegration() 