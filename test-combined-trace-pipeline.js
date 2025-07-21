/**
 * Test Combined Trace Pipeline
 * Verifies that image processing trace is combined with ownership research trace
 */

import { EnhancedAgentOwnershipResearch } from './src/lib/agents/enhanced-ownership-research-agent.js'

async function testCombinedTracePipeline() {
  console.log('🧪 Testing Combined Trace Pipeline')
  
  try {
    // Create a mock image processing trace
    const mockImageProcessingTrace = {
      stages: [
        {
          stage: 'image_processing',
          status: 'success',
          variables: {
            inputVariables: { image_base64: 'data:image/jpeg;base64,...', image_format: 'jpeg' },
            outputVariables: {},
            intermediateVariables: { image_loaded: true, format_valid: true }
          },
          config: {
            model: 'gpt-4o',
            temperature: 0.0,
            maxTokens: 1000,
            stopSequences: null
          },
          compiled_prompt: 'Process the provided image for OCR and brand extraction analysis.',
          prompt_template: 'Analyze the provided image and extract text content and brand information.'
        },
        {
          stage: 'ocr_extraction',
          status: 'success',
          variables: {
            inputVariables: { image_base64: 'data:image/jpeg;base64,...', image_format: 'jpeg' },
            outputVariables: { extracted_text: 'Coca-Cola Classic', brand_name: 'Coca-Cola', product_name: 'Classic' },
            intermediateVariables: { language_indicators: ['English'], country_indicators: ['USA'] }
          },
          config: {
            model: 'gpt-4o',
            temperature: 0.0,
            maxTokens: 500,
            stopSequences: ['\n']
          },
          compiled_prompt: 'Extract all text content from this product image. Focus on brand names, product names, and any other readable text.',
          prompt_template: 'Analyze the provided image and extract the following information:\n1. Brand name\n2. Product name\n3. Any other text content visible in the image\n\nImage: {{image_base64}}'
        },
        {
          stage: 'barcode_scanning',
          status: 'success',
          variables: {
            inputVariables: { image_base64: 'data:image/jpeg;base64,...', extracted_text: 'Coca-Cola Classic' },
            outputVariables: { barcode_detected: false, barcode_value: null },
            intermediateVariables: { barcode_patterns_checked: true }
          },
          config: {
            model: 'gpt-4o',
            temperature: 0.0,
            maxTokens: 200,
            stopSequences: ['\n']
          },
          compiled_prompt: 'Check the image for any visible barcode patterns or codes.',
          prompt_template: 'Analyze the image and identify any barcode patterns or product codes that may be visible.'
        }
      ]
    }
    
    console.log('📸 Testing ownership research with image processing trace...')
    
    const result = await EnhancedAgentOwnershipResearch({
      barcode: 'test_barcode_123',
      product_name: 'TestBrandXYZ Product',
      brand: 'TestBrandXYZ',
      hints: {},
      enableEvaluation: false,
      imageProcessingTrace: mockImageProcessingTrace
    })
    
    console.log('✅ Ownership research completed')
    console.log('📊 Result success:', result.success)
    console.log('📊 Financial beneficiary:', result.financial_beneficiary)
    
    // Check if combined trace is included
    if (result.agent_execution_trace) {
      console.log('✅ Combined trace found!')
      console.log('📊 Total stages:', result.agent_execution_trace.stages?.length || 0)
      
      const stages = result.agent_execution_trace.stages || []
      console.log('📊 Stage names:', stages.map(s => s.stage))
      
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
      
      // Check for enhanced fields in all stages
      const stagesWithVariables = stages.filter(s => s.variables)
      const stagesWithConfig = stages.filter(s => s.config)
      const stagesWithPrompts = stages.filter(s => s.compiled_prompt || s.prompt_template)
      
      console.log('📊 Stages with variables:', stagesWithVariables.length)
      console.log('📊 Stages with config:', stagesWithConfig.length)
      console.log('📊 Stages with prompts:', stagesWithPrompts.length)
      
      // Show sample stage data
      if (stages.length > 0) {
        const imageStage = stages.find(s => s.stage === 'image_processing')
        const ownershipStage = stages.find(s => s.stage === 'cache_check')
        
        if (imageStage) {
          console.log('📊 Sample image stage data:', {
            stage: imageStage.stage,
            hasVariables: !!imageStage.variables,
            hasConfig: !!imageStage.config,
            hasCompiledPrompt: !!imageStage.compiled_prompt,
            hasPromptTemplate: !!imageStage.prompt_template
          })
        }
        
        if (ownershipStage) {
          console.log('📊 Sample ownership stage data:', {
            stage: ownershipStage.stage,
            hasVariables: !!ownershipStage.variables,
            hasConfig: !!ownershipStage.config,
            hasCompiledPrompt: !!ownershipStage.compiled_prompt,
            hasPromptTemplate: !!ownershipStage.prompt_template
          })
        }
      }
      
    } else {
      console.log('❌ No combined trace found')
    }
    
  } catch (error) {
    console.error('❌ Error testing combined trace pipeline:', error)
  }
}

// Run the test
testCombinedTracePipeline() 