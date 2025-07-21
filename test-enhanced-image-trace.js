/**
 * Test Enhanced Image Analysis with Trace Recording
 * Verifies that the enhanced image analysis includes early stages in the trace
 */

import { analyzeProductImage } from './src/lib/apis/image-recognition.js'

async function testEnhancedImageTrace() {
  console.log('🧪 Testing Enhanced Image Analysis with Trace Recording')
  
  try {
    // Create a simple test image (base64 encoded small image)
    const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
    
    console.log('📸 Testing image analysis with trace recording...')
    
    const result = await analyzeProductImage(testImageBase64, 'jpeg')
    
    console.log('✅ Image analysis completed')
    console.log('📊 Result success:', result.success)
    console.log('📊 Result source:', result.source)
    
    // Check if image processing trace is included
    if (result.image_processing_trace) {
      console.log('✅ Image processing trace found!')
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
      
      // Show sample stage data
      if (stages.length > 0) {
        const sampleStage = stages[0]
        console.log('📊 Sample stage data:', {
          stage: sampleStage.stage,
          hasVariables: !!sampleStage.variables,
          hasConfig: !!sampleStage.config,
          hasCompiledPrompt: !!sampleStage.compiled_prompt,
          hasPromptTemplate: !!sampleStage.prompt_template
        })
      }
      
    } else {
      console.log('❌ No image processing trace found')
    }
    
    // Check if the result has the expected structure
    console.log('📊 Result keys:', Object.keys(result))
    
  } catch (error) {
    console.error('❌ Error testing enhanced image trace:', error)
  }
}

// Run the test
testEnhancedImageTrace() 