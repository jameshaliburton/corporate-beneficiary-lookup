import { NextRequest, NextResponse } from 'next/server';
import { GeminiOwnershipAnalysisAgent } from '@/lib/agents/gemini-ownership-analysis-agent.js';

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Starting Gemini verification test...');
    
    // Hardcoded test input for Nike
    const input = {
      brand: "Nike",
      product_name: "Nike Air Max",
      base_country_code: "US",
      parent_company_name: "Nike, Inc.",
      ownership_chain: [
        {
          name: "Nike",
          country_code: "US",
          is_ultimate_owner: false,
          type: "brand"
        },
        {
          name: "Nike, Inc.",
          country_code: "US",
          is_ultimate_owner: true,
          type: "company"
        }
      ]
    };

    console.log('[DEBUG] Gemini input:', JSON.stringify(input, null, 2));
    
    // Create mock existing result for the agent
    const existingResult = {
      success: true,
      brand: input.brand,
      product_name: input.product_name,
      financial_beneficiary: input.parent_company_name,
      beneficiary_country: "United States",
      confidence_score: 100,
      ownership_flow: input.ownership_chain.map(node => ({
        name: node.name,
        type: node.type,
        country: node.country_code === "US" ? "United States" : node.country_code,
        flag: node.country_code === "US" ? "🇺🇸" : "🏳️",
        ultimate: node.is_ultimate_owner
      })),
      sources: ['nike.com', 'sec.gov'],
      reasoning: 'Nike is a publicly traded company with clear ownership structure'
    };

    console.log('[DEBUG] Existing result for agent:', JSON.stringify(existingResult, null, 2));
    
    // Instantiate and call Gemini agent
    const agent = new GeminiOwnershipAnalysisAgent();
    console.log('[DEBUG] Calling Gemini agent.analyze()...');
    
    const result = await agent.analyze(
      input.brand,
      input.product_name,
      existingResult
    );
    
    console.log('[DEBUG] Gemini output:', JSON.stringify(result, null, 2));
    
    // Return comprehensive result
    return NextResponse.json({
      success: true,
      test_input: input,
      existing_result: existingResult,
      gemini_result: result,
      verification_status: result.verification_status,
      verification_method: result.verification_method,
      verification_notes: result.verification_notes,
      confidence_assessment: result.confidence_assessment,
      verification_evidence: result.verification_evidence,
      agent_execution_trace: result.agent_execution_trace,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DEBUG] Gemini verification test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, product_name, parent_company_name } = body;
    
    console.log('[DEBUG] POST request received:', { brand, product_name, parent_company_name });
    
    // Use provided data or fallback to Nike
    const testBrand = brand || "Nike";
    const testProduct = product_name || "Nike Air Max";
    const testParent = parent_company_name || "Nike, Inc.";
    
    const input = {
      brand: testBrand,
      product_name: testProduct,
      base_country_code: "US",
      parent_company_name: testParent,
      ownership_chain: [
        {
          name: testBrand,
          country_code: "US",
          is_ultimate_owner: false,
          type: "brand"
        },
        {
          name: testParent,
          country_code: "US",
          is_ultimate_owner: true,
          type: "company"
        }
      ]
    };

    console.log('[DEBUG] Custom Gemini input:', JSON.stringify(input, null, 2));
    
    // Create mock existing result
    const existingResult = {
      success: true,
      brand: input.brand,
      product_name: input.product_name,
      financial_beneficiary: input.parent_company_name,
      beneficiary_country: "United States",
      confidence_score: 100,
      ownership_flow: input.ownership_chain.map(node => ({
        name: node.name,
        type: node.type,
        country: node.country_code === "US" ? "United States" : node.country_code,
        flag: node.country_code === "US" ? "🇺🇸" : "🏳️",
        ultimate: node.is_ultimate_owner
      })),
      sources: [`${testBrand.toLowerCase()}.com`, 'sec.gov'],
      reasoning: `${testBrand} is a publicly traded company with clear ownership structure`
    };
    
    // Call Gemini agent
    const agent = new GeminiOwnershipAnalysisAgent();
    console.log('[DEBUG] Calling Gemini agent.analyze() with custom input...');
    
    const result = await agent.analyze(
      input.brand,
      input.product_name,
      existingResult
    );
    
    console.log('[DEBUG] Custom Gemini output:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({
      success: true,
      test_input: input,
      existing_result: existingResult,
      gemini_result: result,
      verification_status: result.verification_status,
      verification_method: result.verification_method,
      verification_notes: result.verification_notes,
      confidence_assessment: result.confidence_assessment,
      verification_evidence: result.verification_evidence,
      agent_execution_trace: result.agent_execution_trace,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DEBUG] Custom Gemini verification test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
