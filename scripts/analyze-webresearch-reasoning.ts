#!/usr/bin/env ts-node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface WebResearchData {
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
  sources?: string[];
  web_research_used?: boolean;
  web_sources_count?: number;
}

function analyzeWebResearchReasoning() {
  console.log("🔍 Analyzing WebResearchAgent reasoning from latest trace...");
  
  try {
    // Read the latest trace file
    const traceFilePath = join(process.cwd(), 'latest-webresearch-trace.json');
    
    if (!existsSync(traceFilePath)) {
      console.log("❌ No web research trace file found. Run a query first to generate trace data.");
      return;
    }
    
    const traceContent = readFileSync(traceFilePath, 'utf-8');
    const traceData: WebResearchData = JSON.parse(traceContent);
    
    console.log("📊 Web Research Analysis Summary:");
    console.log(`   Brand: ${traceData.brand || 'N/A'}`);
    console.log(`   Financial Beneficiary: ${traceData.financial_beneficiary || 'N/A'}`);
    console.log(`   Confidence Score: ${traceData.confidence_score || 'N/A'}%`);
    console.log(`   Result Type: ${traceData.result_type || 'N/A'}`);
    console.log(`   Country: ${traceData.beneficiary_country || 'N/A'}`);
    console.log(`   Web Research Used: ${traceData.web_research_used || 'N/A'}`);
    console.log(`   Web Sources Count: ${traceData.web_sources_count || 'N/A'}`);
    
    console.log("\n" + "=".repeat(80));
    console.log("🌐 WEB RESEARCH AGENT ANALYSIS");
    console.log("=".repeat(80));
    
    // Extract reasoning from the main result
    if (traceData.reasoning) {
      console.log("\n📝 PRIMARY REASONING:");
      console.log("-".repeat(40));
      console.log(traceData.reasoning);
    }
    
    // Look for web research in agent execution trace
    if (traceData.agent_execution_trace?.stages) {
      console.log("\n🔍 AGENT EXECUTION TRACE ANALYSIS:");
      console.log("-".repeat(40));
      
      const webResearchStages = traceData.agent_execution_trace.stages.filter(stage => 
        stage.stage.toLowerCase().includes('web') || 
        stage.stage.toLowerCase().includes('research') ||
        stage.stage.toLowerCase().includes('search')
      );
      
      webResearchStages.forEach((stage, index) => {
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
          
          if (output.sources) {
            console.log("\n🔗 SOURCES:");
            output.sources.forEach((source: string, i: number) => {
              console.log(`  ${i + 1}. ${source}`);
            });
          }
        }
      });
    }
    
    // Look for web research agent results
    if (traceData.agent_results) {
      console.log("\n🤖 WEB RESEARCH AGENT RESULTS:");
      console.log("-".repeat(40));
      
      Object.entries(traceData.agent_results).forEach(([agentName, result]) => {
        if (agentName.toLowerCase().includes('web') || agentName.toLowerCase().includes('research')) {
          console.log(`\n📋 Agent: ${agentName.toUpperCase()}`);
          console.log("-".repeat(25));
          
          if (result.success) {
            console.log("✅ Status: Success");
          } else {
            console.log("❌ Status: Failed");
          }
          
          if (result.data) {
            console.log("\n📊 Agent Data:");
            console.log(JSON.stringify(result.data, null, 2));
          }
          
          if (result.reasoning) {
            console.log("\n💭 AGENT REASONING:");
            console.log(result.reasoning);
          }
        }
      });
    }
    
    // Show sources if available
    if (traceData.sources && traceData.sources.length > 0) {
      console.log("\n" + "=".repeat(80));
      console.log("🔗 WEB SOURCES USED");
      console.log("=".repeat(80));
      traceData.sources.forEach((source, index) => {
        console.log(`${index + 1}. ${source}`);
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
    console.log("✅ WEB RESEARCH ANALYSIS COMPLETE");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("❌ Error analyzing web research reasoning:", error);
  }
}

// Run the analysis
analyzeWebResearchReasoning(); 