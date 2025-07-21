/**
 * Test Enhanced Trace Recording to Supabase
 * Verifies that the enhanced agent_execution_trace is being saved with all required fields
 */

import { createClient } from '@supabase/supabase-js'
import { EnhancedAgentOwnershipResearch } from './src/lib/agents/enhanced-ownership-research-agent.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function testEnhancedTraceRecording() {
  console.log('🧪 Testing Enhanced Trace Recording to Supabase')
  
  try {
    // Test 1: Run enhanced agent with trace recording
    console.log('\n1️⃣ Running Enhanced Agent with trace recording...')
    
    const testBrand = 'Coca-Cola'
    const testProduct = 'Coca-Cola Classic 12oz Can'
    const testBarcode = '049000000000'
    
    const result = await EnhancedAgentOwnershipResearch({
      barcode: testBarcode,
      product_name: testProduct,
      brand: testBrand,
      hints: { test: true },
      enableEvaluation: false
    })
    
    console.log('✅ Enhanced agent completed')
    console.log('📊 Result:', {
      financial_beneficiary: result.financial_beneficiary,
      confidence_score: result.confidence_score,
      has_trace: !!result.agent_execution_trace
    })
    
    // Test 2: Verify trace structure in database
    console.log('\n2️⃣ Verifying trace structure in database...')
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', testBarcode)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('❌ Database query error:', error)
      return
    }
    
    if (!products || products.length === 0) {
      console.error('❌ No product found in database')
      return
    }
    
    const product = products[0]
    console.log('✅ Found product in database')
    console.log('📊 Product ID:', product.id)
    console.log('📊 Has agent_execution_trace:', !!product.agent_execution_trace)
    
    // Test 3: Analyze trace structure
    if (product.agent_execution_trace) {
      console.log('\n3️⃣ Analyzing trace structure...')
      
      const trace = product.agent_execution_trace
      console.log('📊 Trace ID:', trace.trace_id)
      console.log('📊 Stages count:', trace.stages?.length || 0)
      
      // Check for enhanced fields in stages
      const stagesWithEnhancedData = trace.stages?.filter(stage => 
        stage.variables || stage.config || stage.compiled_prompt || stage.prompt_template
      ) || []
      
      console.log('📊 Stages with enhanced data:', stagesWithEnhancedData.length)
      
      // Show sample stage with enhanced data
      if (stagesWithEnhancedData.length > 0) {
        const sampleStage = stagesWithEnhancedData[0]
        console.log('📊 Sample enhanced stage:', {
          stage: sampleStage.stage,
          has_variables: !!sampleStage.variables,
          has_config: !!sampleStage.config,
          has_compiled_prompt: !!sampleStage.compiled_prompt,
          has_prompt_template: !!sampleStage.prompt_template
        })
        
        if (sampleStage.variables) {
          console.log('📊 Variables structure:', {
            has_input_variables: !!sampleStage.variables.inputVariables,
            has_output_variables: !!sampleStage.variables.outputVariables,
            has_intermediate_variables: !!sampleStage.variables.intermediateVariables
          })
        }
        
        if (sampleStage.config) {
          console.log('📊 Config structure:', {
            model: sampleStage.config.model,
            temperature: sampleStage.config.temperature,
            maxTokens: sampleStage.config.maxTokens
          })
        }
      }
      
      // Check for specific stages we expect
      const expectedStages = ['llm_first_analysis', 'web_research', 'ownership_analysis']
      const foundStages = trace.stages?.map(s => s.stage) || []
      
      console.log('📊 Expected stages:', expectedStages)
      console.log('📊 Found stages:', foundStages)
      
      const missingStages = expectedStages.filter(stage => !foundStages.includes(stage))
      if (missingStages.length > 0) {
        console.log('⚠️ Missing expected stages:', missingStages)
      } else {
        console.log('✅ All expected stages found')
      }
      
    } else {
      console.error('❌ No agent_execution_trace found in product')
    }
    
    // Test 4: Verify the trace can be used by the frontend
    console.log('\n4️⃣ Testing frontend compatibility...')
    
    // Simulate the frontend data transformation
    const transformedTrace = product.agent_execution_trace?.stages?.map(stage => ({
      stage: stage.stage,
      status: stage.status,
      variables: stage.variables,
      config: stage.config,
      compiledPrompt: stage.compiled_prompt,
      promptTemplate: stage.prompt_template,
      input: stage.data?.input || null,
      output: stage.data?.output || null,
      reasoning: stage.reasoning?.map(r => r.content).join(' ') || null
    })) || []
    
    console.log('📊 Transformed stages count:', transformedTrace.length)
    
    const stagesWithVariables = transformedTrace.filter(s => s.variables)
    const stagesWithConfig = transformedTrace.filter(s => s.config)
    const stagesWithPrompts = transformedTrace.filter(s => s.compiledPrompt || s.promptTemplate)
    
    console.log('📊 Stages with variables:', stagesWithVariables.length)
    console.log('📊 Stages with config:', stagesWithConfig.length)
    console.log('📊 Stages with prompts:', stagesWithPrompts.length)
    
    console.log('\n✅ Enhanced trace recording test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testEnhancedTraceRecording() 