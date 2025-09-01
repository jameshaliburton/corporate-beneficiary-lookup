#!/usr/bin/env ts-node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TraceData {
  brand?: string;
  result_type?: string;
  agent_execution_trace?: {
    stages?: Array<{
      stage: string;
      data?: any;
      variables?: {
        outputVariables?: any;
      };
    }>;
  };
  agent_results?: {
    [key: string]: {
      success: boolean;
      data?: any;
      reasoning?: string;
    };
  };
  reasoning?: string;
  confidence_score?: number;
  ownership_flow?: any[];
  financial_beneficiary?: string;
  beneficiary_country?: string;
  ownership_structure_type?: string;
}

function analyzeLLMReasoning() {
  console.log("🔍 Analyzing LLM reasoning from latest trace...");
  
  try {
    // Read the latest trace file
    const traceFilePath = join(process.cwd(), 'latest-trace-debug.json');
    
    if (!existsSync(traceFilePath)) {
      console.log("❌ No trace file found. Run a query first to generate trace data.");
      return;
    }
    
    const traceContent = readFileSync(traceFilePath, 'utf-8');
    const traceData: TraceData = JSON.parse(traceContent);
    
    console.log("📊 Trace Analysis Summary:");
    console.log(`   Brand: ${traceData.brand || 'N/A'}`);
    console.log(`   Financial Beneficiary: ${traceData.financial_beneficiary || 'N/A'}`);
    console.log(`   Confidence Score: ${traceData.confidence_score || 'N/A'}%`);
    console.log(`   Result Type: ${traceData.result_type || 'N/A'}`);
    console.log(`   Country: ${traceData.beneficiary_country || 'N/A'}`);
    console.log(`   Structure Type: ${traceData.ownership_structure_type || 'N/A'}`);
    
    console.log("\n" + "=".repeat(80));
    console.log("🧠 LLM REASONING ANALYSIS");
    console.log("=".repeat(80));
    
    // Extract reasoning from the main result
    if (traceData.reasoning) {
      console.log("\n📝 PRIMARY REASONING:");
      console.log("-".repeat(40));
      console.log(traceData.reasoning);
    }
    
    // Look for LLM analysis in agent execution trace
    if (traceData.agent_execution_trace?.stages) {
      console.log("\n🔍 AGENT EXECUTION TRACE ANALYSIS:");
      console.log("-".repeat(40));
      
      const llmStages = traceData.agent_execution_trace.stages.filter(stage => 
        stage.stage.includes('llm') || 
        stage.stage.includes('analysis') ||
        stage.stage.includes('research')
      );
      
      llmStages.forEach((stage, index) => {
        console.log(`\n📋 Stage ${index + 1}: ${stage.stage.toUpperCase()}`);
        console.log("-".repeat(30));
        
        if (stage.data) {
          console.log("📊 Stage Data:");
          console.log(JSON.stringify(stage.data, null, 2));
        }
        
        if (stage.variables?.outputVariables) {
          console.log("📝 Output Variables:");
          const output = stage.variables.outputVariables;
          
          if (output.reasoning) {
            console.log("\n🧠 REASONING:");
            console.log(output.reasoning);
          }
          
          if (output.confidence_score) {
            console.log(`\n🎯 CONFIDENCE: ${output.confidence_score}%`);
          }
          
          if (output.ownership_flow) {
            console.log("\n🔗 OWNERSHIP FLOW:");
            console.log(JSON.stringify(output.ownership_flow, null, 2));
          }
          
          if (output.financial_beneficiary) {
            console.log(`\n💰 FINANCIAL BENEFICIARY: ${output.financial_beneficiary}`);
          }
        }
      });
    }
    
    // Look for agent results
    if (traceData.agent_results) {
      console.log("\n🤖 AGENT RESULTS ANALYSIS:");
      console.log("-".repeat(40));
      
      Object.entries(traceData.agent_results).forEach(([agentName, result]) => {
        if (result.success && result.data) {
          console.log(`\n📋 Agent: ${agentName.toUpperCase()}`);
          console.log("-".repeat(25));
          
          if (result.data.reasoning) {
            console.log("🧠 REASONING:");
            console.log(result.data.reasoning);
          }
          
          if (result.data.confidence_score) {
            console.log(`\n🎯 CONFIDENCE: ${result.data.confidence_score}%`);
          }
          
          if (result.data.ownership_flow) {
            console.log("\n🔗 OWNERSHIP FLOW:");
            console.log(JSON.stringify(result.data.ownership_flow, null, 2));
          }
          
          if (result.reasoning) {
            console.log("\n💭 AGENT REASONING:");
            console.log(result.reasoning);
          }
        }
      });
    }
    
    // Show ownership flow if available
    if (traceData.ownership_flow && traceData.ownership_flow.length > 0) {
      console.log("\n" + "=".repeat(80));
      console.log("🔗 FINAL OWNERSHIP FLOW");
      console.log("=".repeat(80));
      console.log(JSON.stringify(traceData.ownership_flow, null, 2));
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ ANALYSIS COMPLETE");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("❌ Error analyzing LLM reasoning:", error);
  }
}

// Run the analysis
analyzeLLMReasoning(); 