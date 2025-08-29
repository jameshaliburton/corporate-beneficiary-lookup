#!/usr/bin/env tsx

/**
 * DISAMBIGUATION AGENT TRIGGER TEST
 * 
 * This test specifically focuses on understanding why the disambiguation agent
 * is not triggering for ambiguous cases like Jordan, Samsung, and Nestlé™
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 60000,
  reportsDir: path.join(__dirname, 'reports')
};

// Specific disambiguation test cases
const DISAMBIGUATION_TEST_CASES = [
  {
    id: 'jordan-brand-only-disambiguation',
    brand: 'Jordan',
    product: null,
    expectedDisambiguation: true,
    description: 'Jordan brand should trigger disambiguation (Colgate vs Nike)'
  },
  {
    id: 'samsung-brand-only-disambiguation',
    brand: 'Samsung',
    product: null,
    expectedDisambiguation: true,
    description: 'Samsung should trigger disambiguation for multi-division brands'
  },
  {
    id: 'nestle-tm-disambiguation',
    brand: 'Nestlé™',
    product: null,
    expectedDisambiguation: true,
    description: 'Nestlé™ with TM symbol should trigger disambiguation'
  },
  {
    id: 'lipton-control',
    brand: 'Lipton',
    product: null,
    expectedDisambiguation: false,
    description: 'Lipton should NOT trigger disambiguation (clear ownership)'
  },
  {
    id: 'apple-control',
    brand: 'Apple',
    product: null,
    expectedDisambiguation: false,
    description: 'Apple should NOT trigger disambiguation (clear ownership)'
  }
];

interface DisambiguationTestResult {
  testId: string;
  brand: string;
  product: string;
  expectedDisambiguation: boolean;
  description: string;
  success: boolean;
  httpStatus: number;
  responseTime: number;
  confidenceScore?: number;
  disambiguationTriggered: boolean;
  disambiguationOptions?: any[];
  agentsTriggered: string[];
  rawResponse?: any;
  errorMessage?: string;
}

/**
 * Make API request and analyze disambiguation behavior
 */
async function testDisambiguationTrigger(testCase: any): Promise<DisambiguationTestResult> {
  const url = `${TEST_CONFIG.baseUrl}/api/lookup`;
  const requestBody = {
    brand: testCase.brand,
    product_name: testCase.product || undefined,
    barcode: null,
    hints: {},
    evaluation_mode: false
  };

  console.log(`\n🔍 Testing Disambiguation: ${testCase.id}`);
  console.log(`📝 Description: ${testCase.description}`);
  console.log(`📤 Request: ${JSON.stringify(requestBody, null, 2)}`);

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    console.log(`📥 Response: ${response.status} ${response.statusText} (${responseTime}ms)`);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      return createErrorResult(testCase, response.status, responseTime, 'Failed to parse JSON response', responseText);
    }

    // Analyze disambiguation behavior
    const result = analyzeDisambiguationResponse(testCase, response.status, responseTime, parsedResponse);
    console.log(`✅ Analysis: ${result.success ? 'PASS' : 'FAIL'}`);
    console.log(`🔍 Disambiguation Triggered: ${result.disambiguationTriggered ? 'YES' : 'NO'}`);
    console.log(`📊 Expected: ${testCase.expectedDisambiguation ? 'YES' : 'NO'}`);
    
    return result;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Request failed: ${error.message}`);
    return createErrorResult(testCase, response.status, responseTime, error.message, null);
  }
}

/**
 * Create error result
 */
function createErrorResult(testCase: any, httpStatus: number, responseTime: number, errorMessage: string, rawResponse: any): DisambiguationTestResult {
  return {
    testId: testCase.id,
    brand: testCase.brand,
    product: testCase.product,
    expectedDisambiguation: testCase.expectedDisambiguation,
    description: testCase.description,
    success: false,
    httpStatus,
    responseTime,
    disambiguationTriggered: false,
    agentsTriggered: [],
    rawResponse,
    errorMessage
  };
}

/**
 * Analyze response for disambiguation behavior
 */
function analyzeDisambiguationResponse(
  testCase: any,
  httpStatus: number, 
  responseTime: number, 
  response: any
): DisambiguationTestResult {
  const success = httpStatus === 200 && response.success === true;
  
  // Extract agents triggered from execution trace
  const agentsTriggered = extractAgentsFromTrace(response.agent_execution_trace);
  
  // Check for disambiguation options
  const disambiguationOptions = response.disambiguation_options || [];
  const disambiguationTriggered = disambiguationOptions.length > 0;
  
  // Check confidence score
  const confidenceScore = response.confidence_score || response.ownership_data?.confidence_score;
  
  return {
    testId: testCase.id,
    brand: testCase.brand,
    product: testCase.product,
    expectedDisambiguation: testCase.expectedDisambiguation,
    description: testCase.description,
    success,
    httpStatus,
    responseTime,
    confidenceScore,
    disambiguationTriggered,
    disambiguationOptions,
    agentsTriggered,
    rawResponse: response
  };
}

/**
 * Extract agents triggered from execution trace
 */
function extractAgentsFromTrace(trace: any): string[] {
  const agents: string[] = [];
  
  if (!trace || !trace.sections) return agents;
  
  trace.sections.forEach((section: any) => {
    if (section.stages) {
      section.stages.forEach((stage: any) => {
        if (stage.id) {
          agents.push(stage.id);
        }
      });
    }
  });
  
  return [...new Set(agents)]; // Remove duplicates
}

/**
 * Generate disambiguation test report
 */
function generateDisambiguationReport(results: DisambiguationTestResult[]): void {
  const reportPath = path.join(TEST_CONFIG.reportsDir, 'DISAMBIGUATION_TRIGGER_ANALYSIS.md');
  
  let content = `# DISAMBIGUATION AGENT TRIGGER ANALYSIS

**Date**: ${new Date().toISOString()}  
**Purpose**: Understand why disambiguation agent is not triggering for ambiguous cases

## 📊 Test Results Summary

| Test ID | Brand | Product | Expected | Triggered | Status | Confidence | Agents |
|---------|-------|---------|----------|-----------|--------|------------|--------|
`;

  results.forEach(result => {
    const status = result.disambiguationTriggered === result.expectedDisambiguation ? '✅' : '❌';
    const confidence = result.confidenceScore ? `${result.confidenceScore}%` : 'N/A';
    const agents = result.agentsTriggered.join(', ') || 'None';
    
    content += `| ${result.testId} | ${result.brand} | ${result.product} | ${result.expectedDisambiguation ? 'YES' : 'NO'} | ${result.disambiguationTriggered ? 'YES' : 'NO'} | ${status} | ${confidence} | ${agents} |\n`;
  });

  content += `\n## 🔍 Detailed Analysis

`;

  results.forEach(result => {
    content += `### ${result.testId}: ${result.brand} | ${result.product}

- **Expected Disambiguation**: ${result.expectedDisambiguation ? 'YES' : 'NO'}
- **Actual Disambiguation**: ${result.disambiguationTriggered ? 'YES' : 'NO'}
- **Status**: ${result.disambiguationTriggered === result.expectedDisambiguation ? '✅ CORRECT' : '❌ INCORRECT'}
- **Confidence Score**: ${result.confidenceScore ? `${result.confidenceScore}%` : 'N/A'}
- **Agents Triggered**: ${result.agentsTriggered.join(', ') || 'None'}
- **Disambiguation Options**: ${result.disambiguationOptions?.length || 0}
- **Response Time**: ${result.responseTime}ms

**Description**: ${result.description}

**Raw Response Excerpt**:
\`\`\`json
{
  "success": ${result.success},
  "confidence_score": ${result.confidenceScore || 'null'},
  "disambiguation_options": ${JSON.stringify(result.disambiguationOptions, null, 2)},
  "agent_execution_trace": {
    "sections": ${result.rawResponse?.agent_execution_trace?.sections?.length || 0}
  }
}
\`\`\`

`;
  });

  content += `## 🚨 Key Findings

### Missing Disambiguation Cases
${results.filter(r => r.expectedDisambiguation && !r.disambiguationTriggered).map(r => 
  `- **${r.testId}**: ${r.brand} | ${r.product} - Expected disambiguation but none triggered`
).join('\n') || 'None'}

### Unexpected Disambiguation Cases
${results.filter(r => !r.expectedDisambiguation && r.disambiguationTriggered).map(r => 
  `- **${r.testId}**: ${r.brand} | ${r.product} - Unexpected disambiguation triggered`
).join('\n') || 'None'}

### Agent Coverage Analysis
${Array.from(new Set(results.flatMap(r => r.agentsTriggered))).map(agent => {
  const count = results.filter(r => r.agentsTriggered.includes(agent)).length;
  return `- **${agent}**: ${count}/${results.length} tests (${((count/results.length)*100).toFixed(1)}%)`;
}).join('\n')}

## 🎯 Recommendations

1. **Investigate Disambiguation Logic**: The disambiguation agent is not triggering for expected cases
2. **Check Confidence Thresholds**: High confidence scores may be bypassing disambiguation
3. **Review Agent Integration**: Ensure disambiguation agent is properly integrated into the pipeline
4. **Add Trigger Logging**: Add comprehensive logging to understand trigger conditions

---

*Generated by Disambiguation Trigger Test Suite*
`;

  fs.writeFileSync(reportPath, content);
  console.log(`📄 Disambiguation report: ${reportPath}`);
}

/**
 * Main test execution
 */
async function runDisambiguationTriggerTest() {
  console.log('🔍 DISAMBIGUATION AGENT TRIGGER TEST');
  console.log('====================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  
  console.log(`\n📋 Loaded ${DISAMBIGUATION_TEST_CASES.length} disambiguation test cases`);
  
  const results: DisambiguationTestResult[] = [];
  
  // Run tests
  for (let i = 0; i < DISAMBIGUATION_TEST_CASES.length; i++) {
    const testCase = DISAMBIGUATION_TEST_CASES[i];
    console.log(`\n[${i + 1}/${DISAMBIGUATION_TEST_CASES.length}] Running test: ${testCase.id}`);
    
    const result = await testDisambiguationTrigger(testCase);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate report
  generateDisambiguationReport(results);
  
  // Final summary
  console.log('\n📊 FINAL SUMMARY');
  console.log('================');
  
  const totalTests = results.length;
  const correctDisambiguation = results.filter(r => r.disambiguationTriggered === r.expectedDisambiguation).length;
  const missingDisambiguation = results.filter(r => r.expectedDisambiguation && !r.disambiguationTriggered).length;
  const unexpectedDisambiguation = results.filter(r => !r.expectedDisambiguation && r.disambiguationTriggered).length;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Correct Disambiguation: ${correctDisambiguation}/${totalTests} (${((correctDisambiguation/totalTests)*100).toFixed(1)}%)`);
  console.log(`Missing Disambiguation: ${missingDisambiguation}`);
  console.log(`Unexpected Disambiguation: ${unexpectedDisambiguation}`);
  
  console.log('\n✅ Disambiguation trigger test completed');
  
  // Exit with appropriate code
  process.exit(missingDisambiguation > 0 ? 1 : 0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDisambiguationTriggerTest().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}
