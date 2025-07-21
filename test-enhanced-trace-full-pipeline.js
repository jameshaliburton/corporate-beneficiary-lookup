/**
 * Test Enhanced Trace Recording - Full Pipeline
 * Forces the full pipeline to run by using a brand not in static mappings
 */

import { createClient } from '@supabase/supabase-js'
import { EnhancedAgentOwnershipResearch } from './src/lib/agents/enhanced-ownership-research-agent.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function testFullPipelineTraceRecording() {
  console.log('🧪 Testing Enhanced Trace Recording - Full Pipeline')
  
  try {
    // Test 1: Run enhanced agent with a brand not in static mappings
    console.log('\n1️⃣ Running Enhanced Agent with full pipeline...')
    
    const testBrand = 'TestBrandXYZ123' // This won't be in static mappings
    const testProduct = 'Test Product for Full Pipeline'
    const testBarcode = '123456789012'
    
    const result = await EnhancedAgentOwnershipResearch({
      barcode: testBarcode,
      product_name: testProduct,
      brand: testBrand,
      hints: { test: true, force_full_pipeline: true },
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
      
      // Show all stages
      console.log('📊 All stages:', trace.stages?.map(s => ({
        stage: s.stage,
        status: s.status,
        has_variables: !!s.variables,
        has_config: !!s.config,
        has_compiled_prompt: !!s.compiled_prompt,
        has_prompt_template: !!s.prompt_template
      })))
      
      // Check for enhanced fields in stages
      const stagesWithEnhancedData = trace.stages?.filter(stage => 
        stage.variables || stage.config || stage.compiled_prompt || stage.prompt_template
      ) || []
      
      console.log('📊 Stages with enhanced data:', stagesWithEnhancedData.length)
      
      // Show detailed info for LLM stages
      const llmStages = trace.stages?.filter(s => 
        s.stage === 'llm_first_analysis' || s.stage === 'ownership_analysis'
      ) || []
      
      console.log('📊 LLM stages found:', llmStages.length)
      
      for (const stage of llmStages) {
        console.log(`\n📊 ${stage.stage} stage details:`)
        console.log('  - Status:', stage.status)
        console.log('  - Has variables:', !!stage.variables)
        console.log('  - Has config:', !!stage.config)
        console.log('  - Has compiled prompt:', !!stage.compiled_prompt)
        console.log('  - Has prompt template:', !!stage.prompt_template)
        
        if (stage.variables) {
          console.log('  - Input variables count:', Object.keys(stage.variables.inputVariables || {}).length)
          console.log('  - Output variables count:', Object.keys(stage.variables.outputVariables || {}).length)
          console.log('  - Intermediate variables count:', Object.keys(stage.variables.intermediateVariables || {}).length)
        }
        
        if (stage.config) {
          console.log('  - Model:', stage.config.model)
          console.log('  - Temperature:', stage.config.temperature)
          console.log('  - Max tokens:', stage.config.maxTokens)
        }
        
        if (stage.compiled_prompt) {
          console.log('  - Compiled prompt length:', stage.compiled_prompt.length)
        }
        
        if (stage.prompt_template) {
          console.log('  - Prompt template length:', stage.prompt_template.length)
        }
      }
      
      // Check for web research stage
      const webStage = trace.stages?.find(s => s.stage === 'web_research')
      if (webStage) {
        console.log('\n📊 Web research stage details:')
        console.log('  - Status:', webStage.status)
        console.log('  - Has variables:', !!webStage.variables)
        console.log('  - Has config:', !!webStage.config)
        console.log('  - Has prompts:', !!(webStage.compiled_prompt || webStage.prompt_template))
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
    
    // Check for the specific stages we enhanced
    const enhancedStages = ['llm_first_analysis', 'web_research', 'ownership_analysis']
    const foundEnhancedStages = transformedTrace.filter(s => enhancedStages.includes(s.stage))
    
    console.log('📊 Enhanced stages found:', foundEnhancedStages.length)
    for (const stage of foundEnhancedStages) {
      console.log(`  - ${stage.stage}: variables=${!!stage.variables}, config=${!!stage.config}, prompts=${!!(stage.compiledPrompt || stage.promptTemplate)}`)
    }
    
    console.log('\n✅ Full pipeline trace recording test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testFullPipelineTraceRecording() 