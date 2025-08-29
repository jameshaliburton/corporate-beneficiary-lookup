#!/usr/bin/env tsx

/**
 * FULL PIPELINE E2E VERIFICATION TEST RUNNER
 * 
 * Comprehensive test suite that verifies the entire multi-agent pipeline
 * across real-world and edge-case inputs without modifying production logic.
 * 
 * Features:
 * - Structured fixture-based testing
 * - Agent coverage validation
 * - Cache behavior tracking
 * - Supabase write verification
 * - Narrative and disambiguation testing
 * - Schema validation
 * - Performance monitoring
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
  reportsDir: path.join(__dirname, 'reports'),
  resultsDir: path.join(__dirname, 'results')
};

// Expected agent coverage mapping
const AGENT_COVERAGE_MAP = {
  'RAG / cache lookup': ['Lipton', 'ikea'],
  'DisambiguationAgent': ['Samsung', 'Jordan', 'Nestlé™'],
  'EnhancedAgentOwnershipResearch': ['Lipton', 'Dr. Oetker', 'Danone'],
  'GeminiOwnershipResearchAgent': ['Moose Milk', 'Equate'],
  'WebSearchOwnershipAgent': ['🤯🥩🚀', '百事可乐', ''],
  'ConfidenceScoringAgent': ['All applicable cases'],
  'NarrativeGenerator': ['All valid completions'],
  'Supabase cache write': ['All uncached cases']
};

// Test results storage
interface TestResult {
  brand: string;
  product: string;
  success: boolean;
  httpStatus: number;
  responseTime: number;
  ownershipChain: boolean;
  narrative: boolean;
  confidenceScore?: number;
  disambiguationTriggered: boolean;
  agentsTriggered: string[];
  cacheBehavior: 'Hit' | 'Miss' | 'Write' | 'Error';
  supabaseWrite: 'Success' | 'Failure' | 'Skipped' | 'Error';
  schemaValidation: 'Pass' | 'Fail' | 'Error';
  errorMessage?: string;
  rawResponse?: any;
}

interface TestSuiteResults {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  agentCoverage: Record<string, boolean>;
  cacheStats: {
    hits: number;
    misses: number;
    writes: number;
    errors: number;
  };
  supabaseStats: {
    successes: number;
    failures: number;
    skipped: number;
    errors: number;
  };
  results: TestResult[];
  recommendations: string[];
}

const testResults: TestSuiteResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  agentCoverage: {},
  cacheStats: { hits: 0, misses: 0, writes: 0, errors: 0 },
  supabaseStats: { successes: 0, failures: 0, skipped: 0, errors: 0 },
  results: [],
  recommendations: []
};

/**
 * Load test cases from fixture file
 */
function loadTestCases(): Array<{brand: string, product: string}> {
  const testCasesPath = path.join(__dirname, 'test-cases.json');
  try {
    const testCasesData = fs.readFileSync(testCasesPath, 'utf8');
    return JSON.parse(testCasesData);
  } catch (error) {
    console.error('❌ Failed to load test cases:', error);
    process.exit(1);
  }
}

/**
 * Make API request with comprehensive logging
 */
async function makeLookupRequest(brand: string, product: string): Promise<TestResult> {
  const url = `${TEST_CONFIG.baseUrl}/api/lookup`;
  const requestBody = {
    brand,
    product_name: product,
    barcode: null,
    hints: {},
    evaluation_mode: false
  };

  console.log(`\n🔍 Testing: ${brand || 'NO_BRAND'} | ${product}`);
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
    console.log(`📄 Body: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      return {
        brand,
        product,
        success: false,
        httpStatus: response.status,
        responseTime,
        ownershipChain: false,
        narrative: false,
        disambiguationTriggered: false,
        agentsTriggered: [],
        cacheBehavior: 'Error',
        supabaseWrite: 'Error',
        schemaValidation: 'Error',
        errorMessage: 'Failed to parse JSON response',
        rawResponse: responseText
      };
    }

    // Analyze response
    const result = analyzeResponse(brand, product, response.status, responseTime, parsedResponse);
    console.log(`✅ Analysis: ${result.success ? 'PASS' : 'FAIL'}`);
    return result;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Request failed: ${error.message}`);
    
    return {
      brand,
      product,
      success: false,
      httpStatus: 0,
      responseTime,
      ownershipChain: false,
      narrative: false,
      disambiguationTriggered: false,
      agentsTriggered: [],
      cacheBehavior: 'Error',
      supabaseWrite: 'Error',
      schemaValidation: 'Error',
      errorMessage: error.message,
      rawResponse: null
    };
  }
}

/**
 * Analyze API response and extract test metrics
 */
function analyzeResponse(
  brand: string, 
  product: string, 
  httpStatus: number, 
  responseTime: number, 
  response: any
): TestResult {
  const success = httpStatus === 200 && response.success === true;
  
  // Check ownership chain
  const ownershipChain = !!(response.ownership_flow && Array.isArray(response.ownership_flow) && response.ownership_flow.length > 0);
  
  // Check narrative
  const narrative = !!(response.headline || response.narrative?.headline);
  
  // Check confidence score
  const confidenceScore = response.confidence_score || response.ownership_data?.confidence_score;
  
  // Check disambiguation
  const disambiguationTriggered = !!(response.disambiguation_options && response.disambiguation_options.length > 0);
  
  // Extract agents triggered from execution trace
  const agentsTriggered = extractAgentsFromTrace(response.agent_execution_trace);
  
  // Determine cache behavior
  const cacheBehavior = determineCacheBehavior(response);
  
  // Determine Supabase write status
  const supabaseWrite = determineSupabaseWriteStatus(response);
  
  // Schema validation
  const schemaValidation = validateSchema(response);

  return {
    brand,
    product,
    success,
    httpStatus,
    responseTime,
    ownershipChain,
    narrative,
    confidenceScore,
    disambiguationTriggered,
    agentsTriggered,
    cacheBehavior,
    supabaseWrite,
    schemaValidation,
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
 * Determine cache behavior from response
 */
function determineCacheBehavior(response: any): 'Hit' | 'Miss' | 'Write' | 'Error' {
  // Look for cache-related information in the response
  if (response.agent_execution_trace?.sections) {
    for (const section of response.agent_execution_trace.sections) {
      if (section.stages) {
        for (const stage of section.stages) {
          if (stage.id === 'cache_check') {
            if (stage.outputVariables?.hit === true) {
              return 'Hit';
            } else if (stage.outputVariables?.hit === false) {
              return 'Miss';
            }
          }
        }
      }
    }
  }
  
  // Fallback: assume miss if no cache info found
  return 'Miss';
}

/**
 * Determine Supabase write status
 */
function determineSupabaseWriteStatus(response: any): 'Success' | 'Failure' | 'Skipped' | 'Error' {
  // Look for database save information
  if (response.agent_execution_trace?.sections) {
    for (const section of response.agent_execution_trace.sections) {
      if (section.stages) {
        for (const stage of section.stages) {
          if (stage.id === 'database_save') {
            if (stage.outputVariables?.success === true) {
              return 'Success';
            } else if (stage.outputVariables?.success === false) {
              return 'Failure';
            }
          }
        }
      }
    }
  }
  
  return 'Skipped';
}

/**
 * Validate response schema
 */
function validateSchema(response: any): 'Pass' | 'Fail' | 'Error' {
  try {
    // Basic schema validation
    const requiredFields = ['success'];
    const hasRequiredFields = requiredFields.every(field => response.hasOwnProperty(field));
    
    if (!hasRequiredFields) return 'Fail';
    
    // Check for null/undefined values in critical fields
    if (response.success === true) {
      if (response.ownership_flow === null || response.ownership_flow === undefined) {
        return 'Fail';
      }
    }
    
    return 'Pass';
  } catch (error) {
    return 'Error';
  }
}

/**
 * Update agent coverage tracking
 */
function updateAgentCoverage(agentsTriggered: string[]) {
  agentsTriggered.forEach(agent => {
    testResults.agentCoverage[agent] = true;
  });
}

/**
 * Update cache statistics
 */
function updateCacheStats(cacheBehavior: string) {
  switch (cacheBehavior) {
    case 'Hit':
      testResults.cacheStats.hits++;
      break;
    case 'Miss':
      testResults.cacheStats.misses++;
      break;
    case 'Write':
      testResults.cacheStats.writes++;
      break;
    case 'Error':
      testResults.cacheStats.errors++;
      break;
  }
}

/**
 * Update Supabase statistics
 */
function updateSupabaseStats(supabaseWrite: string) {
  switch (supabaseWrite) {
    case 'Success':
      testResults.supabaseStats.successes++;
      break;
    case 'Failure':
      testResults.supabaseStats.failures++;
      break;
    case 'Skipped':
      testResults.supabaseStats.skipped++;
      break;
    case 'Error':
      testResults.supabaseStats.errors++;
      break;
  }
}

/**
 * Generate comprehensive markdown report
 */
function generateMarkdownReport(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(TEST_CONFIG.reportsDir, `FULL_PIPELINE_VERIFICATION_REPORT.md`);
  
  // Ensure reports directory exists
  if (!fs.existsSync(TEST_CONFIG.reportsDir)) {
    fs.mkdirSync(TEST_CONFIG.reportsDir, { recursive: true });
  }

  let report = `# FULL PIPELINE E2E VERIFICATION REPORT

**Date**: ${testResults.timestamp}  
**Status**: ${testResults.failed === 0 ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED'}

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | ${testResults.totalTests} |
| **Passed** | ${testResults.passed} |
| **Failed** | ${testResults.failed} |
| **Success Rate** | ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}% |
| **Average Response Time** | ${(testResults.results.reduce((sum, r) => sum + r.responseTime, 0) / testResults.totalTests).toFixed(0)}ms |

## 🧪 Test Results

| Brand | Product | Status | HTTP | Time(ms) | Ownership | Narrative | Confidence | Disambiguation | Cache | Supabase | Schema |
|-------|---------|--------|------|----------|-----------|-----------|------------|----------------|-------|----------|--------|
`;

  // Add test results table
  testResults.results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const ownership = result.ownershipChain ? '✅' : '❌';
    const narrative = result.narrative ? '✅' : '❌';
    const confidence = result.confidenceScore ? `${result.confidenceScore}%` : 'N/A';
    const disambiguation = result.disambiguationTriggered ? 'Yes' : 'No';
    
    report += `| ${result.brand || 'NO_BRAND'} | ${result.product} | ${status} | ${result.httpStatus} | ${result.responseTime} | ${ownership} | ${narrative} | ${confidence} | ${disambiguation} | ${result.cacheBehavior} | ${result.supabaseWrite} | ${result.schemaValidation} |\n`;
  });

  // Add agent coverage analysis
  report += `\n## 🤖 Agent Coverage Analysis

| Agent | Triggered | Expected Brands |
|-------|-----------|-----------------|
`;

  Object.entries(AGENT_COVERAGE_MAP).forEach(([agent, expectedBrands]) => {
    const triggered = testResults.agentCoverage[agent] ? '✅' : '❌';
    const brands = Array.isArray(expectedBrands) ? expectedBrands.join(', ') : expectedBrands;
    report += `| ${agent} | ${triggered} | ${brands} |\n`;
  });

  // Add cache statistics
  report += `\n## 💾 Cache Statistics

| Behavior | Count | Percentage |
|----------|-------|------------|
| Hits | ${testResults.cacheStats.hits} | ${((testResults.cacheStats.hits / testResults.totalTests) * 100).toFixed(1)}% |
| Misses | ${testResults.cacheStats.misses} | ${((testResults.cacheStats.misses / testResults.totalTests) * 100).toFixed(1)}% |
| Writes | ${testResults.cacheStats.writes} | ${((testResults.cacheStats.writes / testResults.totalTests) * 100).toFixed(1)}% |
| Errors | ${testResults.cacheStats.errors} | ${((testResults.cacheStats.errors / testResults.totalTests) * 100).toFixed(1)}% |

## 🗄️ Supabase Statistics

| Status | Count | Percentage |
|--------|-------|------------|
| Success | ${testResults.supabaseStats.successes} | ${((testResults.supabaseStats.successes / testResults.totalTests) * 100).toFixed(1)}% |
| Failure | ${testResults.supabaseStats.failures} | ${((testResults.supabaseStats.failures / testResults.totalTests) * 100).toFixed(1)}% |
| Skipped | ${testResults.supabaseStats.skipped} | ${((testResults.supabaseStats.skipped / testResults.totalTests) * 100).toFixed(1)}% |
| Error | ${testResults.supabaseStats.errors} | ${((testResults.supabaseStats.errors / testResults.totalTests) * 100).toFixed(1)}% |

## 🔍 Detailed Test Results

`;

  // Add detailed results for each test
  testResults.results.forEach((result, index) => {
    report += `### Test ${index + 1}: ${result.brand || 'NO_BRAND'} | ${result.product}

- **Status**: ${result.success ? '✅ PASS' : '❌ FAIL'}
- **HTTP Status**: ${result.httpStatus}
- **Response Time**: ${result.responseTime}ms
- **Ownership Chain**: ${result.ownershipChain ? '✅ Present' : '❌ Missing'}
- **Narrative**: ${result.narrative ? '✅ Generated' : '❌ Missing'}
- **Confidence Score**: ${result.confidenceScore ? `${result.confidenceScore}%` : 'N/A'}
- **Disambiguation**: ${result.disambiguationTriggered ? '✅ Triggered' : '❌ Not triggered'}
- **Agents Triggered**: ${result.agentsTriggered.join(', ') || 'None'}
- **Cache Behavior**: ${result.cacheBehavior}
- **Supabase Write**: ${result.supabaseWrite}
- **Schema Validation**: ${result.schemaValidation}
${result.errorMessage ? `- **Error**: ${result.errorMessage}` : ''}

`;
  });

  // Add recommendations
  if (testResults.recommendations.length > 0) {
    report += `## 🎯 Recommendations

`;
    testResults.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    report += '\n';
  }

  report += `## 📋 Next Steps

1. **Review Failed Tests**: Investigate any tests that failed validation
2. **Agent Coverage**: Ensure all expected agents are being triggered
3. **Performance**: Optimize response times for slow requests
4. **Cache Strategy**: Review cache hit/miss ratios
5. **Database Writes**: Address any Supabase write failures

---

*Report generated by FULL PIPELINE E2E VERIFICATION TEST RUNNER*
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report generated: ${reportPath}`);
  
  return reportPath;
}

/**
 * Save detailed results as JSON
 */
function saveDetailedResults(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsPath = path.join(TEST_CONFIG.resultsDir, `full-pipeline-results-${timestamp}.json`);
  
  // Ensure results directory exists
  if (!fs.existsSync(TEST_CONFIG.resultsDir)) {
    fs.mkdirSync(TEST_CONFIG.resultsDir, { recursive: true });
  }
  
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`💾 Detailed results saved: ${resultsPath}`);
  
  return resultsPath;
}

/**
 * Main test execution
 */
async function runFullPipelineVerification() {
  console.log('🧪 FULL PIPELINE E2E VERIFICATION TEST SUITE');
  console.log('=============================================');
  console.log(`Timestamp: ${testResults.timestamp}`);
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  
  // Load test cases
  const testCases = loadTestCases();
  testResults.totalTests = testCases.length;
  
  console.log(`\n📋 Loaded ${testCases.length} test cases`);
  
  // Run tests
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n[${i + 1}/${testCases.length}] Running test...`);
    
    const result = await makeLookupRequest(testCase.brand, testCase.product);
    
    // Update statistics
    if (result.success) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    updateAgentCoverage(result.agentsTriggered);
    updateCacheStats(result.cacheBehavior);
    updateSupabaseStats(result.supabaseWrite);
    
    testResults.results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate reports
  const reportPath = generateMarkdownReport();
  const resultsPath = saveDetailedResults();
  
  // Final summary
  console.log('\n📊 FINAL SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%`);
  console.log(`Agent Coverage: ${Object.keys(testResults.agentCoverage).length} agents triggered`);
  console.log(`Cache Hits: ${testResults.cacheStats.hits}/${testResults.totalTests}`);
  console.log(`Supabase Successes: ${testResults.supabaseStats.successes}/${testResults.totalTests}`);
  
  console.log(`\n📄 Reports generated:`);
  console.log(`  - Markdown Report: ${reportPath}`);
  console.log(`  - Detailed Results: ${resultsPath}`);
  
  console.log('\n✅ Full pipeline verification completed');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullPipelineVerification().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}
