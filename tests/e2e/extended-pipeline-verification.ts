#!/usr/bin/env tsx

/**
 * EXTENDED PIPELINE VERIFICATION TEST SUITE
 * 
 * Comprehensive end-to-end verification focused on:
 * - Agent triggering (disambiguation, gemini, query_builder, web_research)
 * - Cache write and cache read behavior
 * - Confidence threshold enforcement
 * - Feature flag activation/inhibition
 * - Data write and trace generation integrity
 * 
 * DO NOT MODIFY CODE - DIAGNOSTIC AND DOCUMENTATION ONLY
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
  docsDir: path.join(__dirname, '../../docs/testing')
};

// Extended test matrix as specified
const EXTENDED_TEST_MATRIX = [
  // HIGH-CONFIDENCE NORMAL CASES
  { 
    id: 'lipton-normal-1', 
    brand: 'Lipton', 
    product: 'Lipton Ice Tea', 
    category: 'high_confidence_normal',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'llm_first_analysis', 'database_save'],
    expectedConfidence: 90,
    expectedCacheWrite: true,
    description: 'First run - should cache miss and write'
  },
  { 
    id: 'lipton-normal-2', 
    brand: 'Lipton', 
    product: 'Lipton Ice Tea', 
    category: 'high_confidence_normal',
    expectedAgents: ['cache_check'],
    expectedConfidence: 95,
    expectedCacheWrite: false,
    expectedCacheHit: true,
    description: 'Second run - should cache hit'
  },
  { 
    id: 'ikea-confident', 
    brand: 'IKEA', 
    product: 'Billy Bookcase', 
    category: 'high_confidence_normal',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'llm_first_analysis', 'database_save'],
    expectedConfidence: 90,
    expectedCacheWrite: true,
    description: 'High confidence IKEA lookup'
  },
  { 
    id: 'equate-walmart', 
    brand: 'Equate', 
    product: 'Walmart Vitamins', 
    category: 'high_confidence_normal',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'llm_first_analysis', 'database_save'],
    expectedConfidence: 90,
    expectedCacheWrite: true,
    description: 'Equate brand with Walmart connection'
  },
  { 
    id: 'nestle-tm-disambiguation', 
    brand: 'Nestlé™', 
    product: 'Nescafé', 
    category: 'high_confidence_normal',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'llm_first_analysis', 'disambiguation', 'database_save'],
    expectedConfidence: 95,
    expectedCacheWrite: true,
    description: 'TM symbol disambiguation check'
  },
  
  // AMBIGUOUS BRAND CASES
  { 
    id: 'samsung-multi-division', 
    brand: 'Samsung', 
    product: 'Galaxy Buds', 
    category: 'ambiguous_brand',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'llm_first_analysis', 'disambiguation', 'database_save'],
    expectedConfidence: 90,
    expectedCacheWrite: true,
    description: 'Multi-division Samsung brand'
  },
  { 
    id: 'jordan-toothpaste-non-nike', 
    brand: 'Jordan', 
    product: 'Toothpaste', 
    category: 'ambiguous_brand',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'llm_first_analysis', 'disambiguation', 'gemini_ownership_research', 'database_save'],
    expectedConfidence: 85,
    expectedCacheWrite: true,
    description: 'Jordan brand confusion (non-Nike)'
  },
  { 
    id: 'jordan-shoes-nike-confusion', 
    brand: 'Jordan', 
    product: 'Shoes', 
    category: 'ambiguous_brand',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'llm_first_analysis', 'disambiguation', 'gemini_ownership_research', 'database_save'],
    expectedConfidence: 85,
    expectedCacheWrite: true,
    description: 'Jordan shoes Nike confusion'
  },
  { 
    id: 'nike-lip-gloss-wrong-match', 
    brand: 'Nike', 
    product: 'Lip Gloss', 
    category: 'ambiguous_brand',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'llm_first_analysis', 'web_research', 'database_save'],
    expectedConfidence: 70,
    expectedCacheWrite: true,
    description: 'Nike lip gloss wrong match test'
  },
  
  // EDGE CASES
  { 
    id: 'moose-milk-fallback', 
    brand: 'Moose Milk', 
    product: 'Local Cream Liqueur', 
    category: 'edge_case',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'query_builder', 'llm_first_analysis', 'web_research', 'database_save'],
    expectedConfidence: 80,
    expectedCacheWrite: true,
    description: 'Force fallback to web research'
  },
  { 
    id: 'chaos-product-junk', 
    brand: '🤯🥩🚀', 
    product: 'Chaos Product', 
    category: 'edge_case',
    expectedAgents: [],
    expectedConfidence: 0,
    expectedCacheWrite: false,
    description: 'Junk input test'
  },
  { 
    id: 'no-brand-null', 
    brand: '', 
    product: 'No Brand Product', 
    category: 'edge_case',
    expectedAgents: [],
    expectedConfidence: 0,
    expectedCacheWrite: false,
    description: 'Null brand test'
  },
  { 
    id: 'zzzcorp-nonexistent', 
    brand: 'ZzzCorp', 
    product: 'Nonexistent Brand', 
    category: 'edge_case',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'query_builder', 'llm_first_analysis', 'web_research'],
    expectedConfidence: 30,
    expectedCacheWrite: false,
    description: 'Test low confidence scenario'
  },
  { 
    id: 'lipton-long-product', 
    brand: 'Lipton', 
    product: 'Lipton Ice Tea 330ml', 
    category: 'edge_case',
    expectedAgents: ['cache_check', 'sheets_mapping', 'static_mapping', 'rag_retrieval', 'llm_first_analysis', 'database_save'],
    expectedConfidence: 90,
    expectedCacheWrite: true,
    description: 'Long product name variant'
  }
];

// Test results storage
interface ExtendedTestResult {
  testId: string;
  brand: string;
  product: string;
  category: string;
  description: string;
  success: boolean;
  httpStatus: number;
  responseTime: number;
  confidenceScore?: number;
  financialBeneficiary?: string;
  ownershipData: boolean;
  narrativeData: boolean;
  agentsTriggered: string[];
  expectedAgents: string[];
  missingAgents: string[];
  unexpectedAgents: string[];
  agentCoverage: number;
  cacheBehavior: {
    checked: boolean;
    hit: boolean;
    write: boolean;
    key?: string;
    payload?: any;
  };
  featureFlags: Record<string, string>;
  databaseWrite: {
    success: boolean;
    table?: string;
    traceId?: string;
    timestamp?: string;
  };
  rawResponse?: any;
  traceData?: any;
  errorMessage?: string;
}

interface ExtendedTestSuiteResults {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: ExtendedTestResult[];
  agentCoverage: Record<string, number>;
  cacheStats: {
    hits: number;
    misses: number;
    writes: number;
    errors: number;
  };
  featureFlagImpact: Record<string, any>;
  recommendations: string[];
}

const testResults: ExtendedTestSuiteResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  results: [],
  agentCoverage: {},
  cacheStats: { hits: 0, misses: 0, writes: 0, errors: 0 },
  featureFlagImpact: {},
  recommendations: []
};

/**
 * Make API request with comprehensive logging
 */
async function makeExtendedLookupRequest(testCase: any): Promise<ExtendedTestResult> {
  const url = `${TEST_CONFIG.baseUrl}/api/lookup`;
  const requestBody = {
    brand: testCase.brand,
    product_name: testCase.product,
    barcode: null,
    hints: {},
    evaluation_mode: false
  };

  console.log(`\n🔍 Testing: ${testCase.id} - ${testCase.brand || 'NO_BRAND'} | ${testCase.product}`);
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
    console.log(`📄 Body: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      return createErrorResult(testCase, response.status, responseTime, 'Failed to parse JSON response', responseText);
    }

    // Comprehensive analysis
    const result = analyzeExtendedResponse(testCase, response.status, responseTime, parsedResponse);
    console.log(`✅ Analysis: ${result.success ? 'PASS' : 'FAIL'}`);
    return result;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Request failed: ${error.message}`);
    return createErrorResult(testCase, 0, responseTime, error.message, null);
  }
}

/**
 * Create error result
 */
function createErrorResult(testCase: any, httpStatus: number, responseTime: number, errorMessage: string, rawResponse: any): ExtendedTestResult {
  return {
    testId: testCase.id,
    brand: testCase.brand,
    product: testCase.product,
    category: testCase.category,
    description: testCase.description,
    success: false,
    httpStatus,
    responseTime,
    ownershipData: false,
    narrativeData: false,
    agentsTriggered: [],
    expectedAgents: testCase.expectedAgents || [],
    missingAgents: testCase.expectedAgents || [],
    unexpectedAgents: [],
    agentCoverage: 0,
    cacheBehavior: { checked: false, hit: false, write: false },
    featureFlags: {},
    databaseWrite: { success: false },
    rawResponse,
    errorMessage
  };
}

/**
 * Comprehensive response analysis
 */
function analyzeExtendedResponse(
  testCase: any,
  httpStatus: number, 
  responseTime: number, 
  response: any
): ExtendedTestResult {
  const success = httpStatus === 200 && response.success === true;
  
  // Extract agents triggered from execution trace
  const agentsTriggered = extractAgentsFromTrace(response.agent_execution_trace);
  
  // Check ownership data
  const ownershipData = !!(response.ownership_flow && Array.isArray(response.ownership_flow) && response.ownership_flow.length > 0);
  
  // Check narrative data
  const narrativeData = !!(response.headline || response.narrative?.headline);
  
  // Check confidence score
  const confidenceScore = response.confidence_score || response.ownership_data?.confidence_score;
  
  // Get financial beneficiary
  const financialBeneficiary = response.financial_beneficiary || response.ownership_data?.financial_beneficiary;
  
  // Analyze cache behavior
  const cacheBehavior = analyzeCacheBehavior(response);
  
  // Analyze database write
  const databaseWrite = analyzeDatabaseWrite(response);
  
  // Get feature flags
  const featureFlags = getFeatureFlags();
  
  // Calculate agent coverage
  const expectedAgents = testCase.expectedAgents || [];
  const missingAgents = expectedAgents.filter(agent => !agentsTriggered.includes(agent));
  const unexpectedAgents = agentsTriggered.filter(agent => !expectedAgents.includes(agent));
  const agentCoverage = expectedAgents.length > 0 ? (agentsTriggered.filter(agent => expectedAgents.includes(agent)).length / expectedAgents.length) * 100 : 0;

  return {
    testId: testCase.id,
    brand: testCase.brand,
    product: testCase.product,
    category: testCase.category,
    description: testCase.description,
    success,
    httpStatus,
    responseTime,
    confidenceScore,
    financialBeneficiary,
    ownershipData,
    narrativeData,
    agentsTriggered,
    expectedAgents,
    missingAgents,
    unexpectedAgents,
    agentCoverage,
    cacheBehavior,
    featureFlags,
    databaseWrite,
    rawResponse: response,
    traceData: response.agent_execution_trace
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
 * Analyze cache behavior
 */
function analyzeCacheBehavior(response: any): any {
  const cacheBehavior = { checked: false, hit: false, write: false, key: undefined, payload: undefined };
  
  if (response.agent_execution_trace?.sections) {
    for (const section of response.agent_execution_trace.sections) {
      if (section.stages) {
        for (const stage of section.stages) {
          if (stage.id === 'cache_check') {
            cacheBehavior.checked = true;
            cacheBehavior.hit = stage.outputVariables?.hit === true;
            cacheBehavior.key = stage.inputVariables?.cacheKey;
          }
          if (stage.id === 'database_save' && stage.outputVariables?.success === true) {
            cacheBehavior.write = true;
            cacheBehavior.payload = {
              brand: response.brand,
              product: response.product_name,
              beneficiary: response.financial_beneficiary,
              confidence: response.confidence_score
            };
          }
        }
      }
    }
  }
  
  return cacheBehavior;
}

/**
 * Analyze database write
 */
function analyzeDatabaseWrite(response: any): any {
  const databaseWrite = { success: false, table: undefined, traceId: undefined, timestamp: undefined };
  
  if (response.agent_execution_trace?.sections) {
    for (const section of response.agent_execution_trace.sections) {
      if (section.stages) {
        for (const stage of section.stages) {
          if (stage.id === 'database_save') {
            databaseWrite.success = stage.outputVariables?.success === true;
            databaseWrite.table = 'ownership_results';
            databaseWrite.traceId = response.query_id;
            databaseWrite.timestamp = new Date().toISOString();
          }
        }
      }
    }
  }
  
  return databaseWrite;
}

/**
 * Get current feature flags
 */
function getFeatureFlags(): Record<string, string> {
  return {
    WEB_RESEARCH: process.env.WEB_RESEARCH || 'off',
    NARRATIVE_V3: process.env.NARRATIVE_V3 || 'off',
    CACHE_WRITE: process.env.CACHE_WRITE || 'off',
    USE_LEGACY_BARCODE: process.env.USE_LEGACY_BARCODE || 'false',
    USE_VISION_FIRST_PIPELINE: process.env.USE_VISION_FIRST_PIPELINE || 'true'
  };
}

/**
 * Generate individual test case markdown log
 */
function generateTestCaseLog(result: ExtendedTestResult): string {
  const timestamp = new Date().toISOString();
  
  return `# Test Case: ${result.testId}

**Timestamp**: ${timestamp}  
**Category**: ${result.category}  
**Description**: ${result.description}

## ✅ Pipeline Summary

- **Input**: ${result.brand || 'NO_BRAND'} | ${result.product}
- **Confidence Score**: ${result.confidenceScore ? `${result.confidenceScore}%` : 'N/A'}
- **Success Flag**: ${result.success ? '✅ true' : '❌ false'}
- **Financial Beneficiary**: ${result.financialBeneficiary || 'N/A'}
- **Response Time**: ${result.responseTime}ms
- **HTTP Status**: ${result.httpStatus}

## 🔍 Agent Trace Table

| Agent | Expected | Triggered | Status |
|-------|----------|-----------|--------|
${result.expectedAgents.map(agent => {
  const triggered = result.agentsTriggered.includes(agent);
  const status = triggered ? '✅' : '❌ MISSING';
  return `| ${agent} | ✅ | ${triggered ? '✅' : '❌'} | ${status} |`;
}).join('\n')}
${result.unexpectedAgents.map(agent => {
  return `| ${agent} | ❌ | ✅ | ⚠️ UNEXPECTED |`;
}).join('\n')}

**Agent Coverage**: ${result.agentCoverage.toFixed(1)}%

## 📦 Cache Behavior

- **Cache Checked**: ${result.cacheBehavior.checked ? '✅ Yes' : '❌ No'}
- **Cache Key**: ${result.cacheBehavior.key || 'N/A'}
- **Cache Hit**: ${result.cacheBehavior.hit ? '✅ Yes' : '❌ No'}
- **Cache Write**: ${result.cacheBehavior.write ? '✅ Yes' : '❌ No'}
${result.cacheBehavior.payload ? `- **Cache Payload**: ${JSON.stringify(result.cacheBehavior.payload, null, 2)}` : ''}

## 🧠 Feature Flag Snapshot

| Flag | Value |
|------|-------|
${Object.entries(result.featureFlags).map(([flag, value]) => `| ${flag} | ${value} |`).join('\n')}

## 📥 Database Write Verification

- **Data Saved**: ${result.databaseWrite.success ? '✅ Yes' : '❌ No'}
- **Table**: ${result.databaseWrite.table || 'N/A'}
- **Trace ID**: ${result.databaseWrite.traceId || 'N/A'}
- **Timestamp**: ${result.databaseWrite.timestamp || 'N/A'}

## 📊 Raw Response Data

\`\`\`json
${JSON.stringify(result.rawResponse, null, 2)}
\`\`\`

---

*Generated by Extended Pipeline Verification Test Suite*
`;
}

/**
 * Generate comprehensive reports
 */
function generateComprehensiveReports(): void {
  // Ensure directories exist
  if (!fs.existsSync(TEST_CONFIG.reportsDir)) {
    fs.mkdirSync(TEST_CONFIG.reportsDir, { recursive: true });
  }
  if (!fs.existsSync(TEST_CONFIG.docsDir)) {
    fs.mkdirSync(TEST_CONFIG.docsDir, { recursive: true });
  }

  // Generate individual test case logs
  testResults.results.forEach(result => {
    const logContent = generateTestCaseLog(result);
    const logPath = path.join(TEST_CONFIG.reportsDir, `TEST_CASE_${result.testId}.md`);
    fs.writeFileSync(logPath, logContent);
    console.log(`📄 Test case log: ${logPath}`);
  });

  // Generate master test plan
  generateMasterTestPlan();
  
  // Generate cache write inspection
  generateCacheWriteInspection();
  
  // Generate agent coverage report
  generateAgentCoverageReport();
  
  // Generate feature flag matrix
  generateFeatureFlagMatrix();
  
  // Generate test trace summary
  generateTestTraceSummary();
}

/**
 * Generate master test plan
 */
function generateMasterTestPlan(): void {
  const planPath = path.join(TEST_CONFIG.docsDir, 'MASTER_TEST_PLAN.md');
  
  let content = `# MASTER TEST PLAN

**Last Updated**: ${testResults.timestamp}  
**Total Tests**: ${testResults.totalTests}  
**Passed**: ${testResults.passed}  
**Failed**: ${testResults.failed}  
**Success Rate**: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%

## 📋 Test Matrix Results

### ✅ HIGH-CONFIDENCE NORMAL CASES

| Test ID | Brand | Product | Status | Confidence | Cache | DB Write |
|---------|-------|---------|--------|------------|-------|----------|
`;

  const normalCases = testResults.results.filter(r => r.category === 'high_confidence_normal');
  normalCases.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const confidence = result.confidenceScore ? `${result.confidenceScore}%` : 'N/A';
    const cache = result.cacheBehavior.hit ? 'Hit' : result.cacheBehavior.write ? 'Write' : 'Miss';
    const dbWrite = result.databaseWrite.success ? '✅' : '❌';
    content += `| ${result.testId} | ${result.brand} | ${result.product} | ${status} | ${confidence} | ${cache} | ${dbWrite} |\n`;
  });

  content += `\n### 🌀 AMBIGUOUS BRAND CASES

| Test ID | Brand | Product | Status | Confidence | Missing Agents |
|---------|-------|---------|--------|------------|----------------|
`;

  const ambiguousCases = testResults.results.filter(r => r.category === 'ambiguous_brand');
  ambiguousCases.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const confidence = result.confidenceScore ? `${result.confidenceScore}%` : 'N/A';
    const missingAgents = result.missingAgents.length > 0 ? result.missingAgents.join(', ') : 'None';
    content += `| ${result.testId} | ${result.brand} | ${result.product} | ${status} | ${confidence} | ${missingAgents} |\n`;
  });

  content += `\n### 🧪 EDGE CASES

| Test ID | Brand | Product | Status | Confidence | Expected Behavior |
|---------|-------|---------|--------|------------|-------------------|
`;

  const edgeCases = testResults.results.filter(r => r.category === 'edge_case');
  edgeCases.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const confidence = result.confidenceScore ? `${result.confidenceScore}%` : 'N/A';
    content += `| ${result.testId} | ${result.brand} | ${result.product} | ${status} | ${confidence} | ${result.description} |\n`;
  });

  content += `\n## 📊 Summary Statistics

- **Total Tests**: ${testResults.totalTests}
- **Passed**: ${testResults.passed}
- **Failed**: ${testResults.failed}
- **Success Rate**: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%
- **Average Response Time**: ${(testResults.results.reduce((sum, r) => sum + r.responseTime, 0) / testResults.totalTests).toFixed(0)}ms

## 🎯 Key Findings

${testResults.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

---

*Generated by Extended Pipeline Verification Test Suite*
`;

  fs.writeFileSync(planPath, content);
  console.log(`📄 Master test plan: ${planPath}`);
}

/**
 * Generate cache write inspection
 */
function generateCacheWriteInspection(): void {
  const inspectionPath = path.join(TEST_CONFIG.docsDir, 'CACHE_WRITE_INSPECTION.md');
  
  let content = `# CACHE WRITE INSPECTION

**Date**: ${testResults.timestamp}  
**Analysis**: Cache behavior across extended test matrix

## 📊 Cache Behavior Summary

| Test ID | Brand | Product | Cache Checked | Cache Hit | Cache Write | Cache Key |
|---------|-------|---------|---------------|-----------|-------------|-----------|
`;

  testResults.results.forEach(result => {
    const checked = result.cacheBehavior.checked ? '✅' : '❌';
    const hit = result.cacheBehavior.hit ? '✅' : '❌';
    const write = result.cacheBehavior.write ? '✅' : '❌';
    const key = result.cacheBehavior.key || 'N/A';
    content += `| ${result.testId} | ${result.brand} | ${result.product} | ${checked} | ${hit} | ${write} | ${key} |\n`;
  });

  content += `\n## 📈 Cache Statistics

- **Cache Checks**: ${testResults.results.filter(r => r.cacheBehavior.checked).length}/${testResults.totalTests}
- **Cache Hits**: ${testResults.cacheStats.hits}/${testResults.totalTests}
- **Cache Writes**: ${testResults.cacheStats.writes}/${testResults.totalTests}
- **Cache Misses**: ${testResults.cacheStats.misses}/${testResults.totalTests}

## 🔍 Cache Analysis

### Cache Hit Analysis
${testResults.results.filter(r => r.cacheBehavior.hit).length > 0 ? 
  testResults.results.filter(r => r.cacheBehavior.hit).map(r => `- **${r.testId}**: ${r.brand} | ${r.product}`).join('\n') :
  'No cache hits detected'
}

### Cache Write Analysis
${testResults.results.filter(r => r.cacheBehavior.write).map(r => 
  `- **${r.testId}**: ${r.brand} | ${r.product} (Confidence: ${r.confidenceScore}%)`
).join('\n')}

---

*Generated by Extended Pipeline Verification Test Suite*
`;

  fs.writeFileSync(inspectionPath, content);
  console.log(`📄 Cache write inspection: ${inspectionPath}`);
}

/**
 * Generate agent coverage report
 */
function generateAgentCoverageReport(): void {
  const reportPath = path.join(TEST_CONFIG.docsDir, 'AGENT_COVERAGE_REPORT.md');
  
  // Collect all unique agents
  const allAgents = new Set<string>();
  testResults.results.forEach(result => {
    result.agentsTriggered.forEach(agent => allAgents.add(agent));
    result.expectedAgents.forEach(agent => allAgents.add(agent));
  });

  let content = `# AGENT COVERAGE REPORT

**Date**: ${testResults.timestamp}  
**Analysis**: Agent triggering vs expected behavior

## 🤖 Agent Coverage Matrix

| Agent | Expected | Triggered | Coverage | Missing Tests |
|-------|----------|-----------|----------|---------------|
`;

  Array.from(allAgents).sort().forEach(agent => {
    const expected = testResults.results.filter(r => r.expectedAgents.includes(agent)).length;
    const triggered = testResults.results.filter(r => r.agentsTriggered.includes(agent)).length;
    const coverage = expected > 0 ? ((triggered / expected) * 100).toFixed(1) : 'N/A';
    const missingTests = testResults.results
      .filter(r => r.expectedAgents.includes(agent) && !r.agentsTriggered.includes(agent))
      .map(r => r.testId)
      .join(', ') || 'None';
    
    content += `| ${agent} | ${expected} | ${triggered} | ${coverage}% | ${missingTests} |\n`;
  });

  content += `\n## 📊 Coverage Statistics

- **Total Unique Agents**: ${allAgents.size}
- **Agents with 100% Coverage**: ${Array.from(allAgents).filter(agent => {
    const expected = testResults.results.filter(r => r.expectedAgents.includes(agent)).length;
    const triggered = testResults.results.filter(r => r.agentsTriggered.includes(agent)).length;
    return expected > 0 && triggered === expected;
  }).length}

## 🚨 Critical Missing Agents

${Array.from(allAgents).filter(agent => {
  const expected = testResults.results.filter(r => r.expectedAgents.includes(agent)).length;
  const triggered = testResults.results.filter(r => r.agentsTriggered.includes(agent)).length;
  return expected > 0 && triggered === 0;
}).map(agent => `- **${agent}**: 0% coverage (${testResults.results.filter(r => r.expectedAgents.includes(agent)).length} expected triggers)`).join('\n')}

---

*Generated by Extended Pipeline Verification Test Suite*
`;

  fs.writeFileSync(reportPath, content);
  console.log(`📄 Agent coverage report: ${reportPath}`);
}

/**
 * Generate feature flag matrix
 */
function generateFeatureFlagMatrix(): void {
  const matrixPath = path.join(TEST_CONFIG.docsDir, 'FEATURE_FLAG_MATRIX.md');
  
  const featureFlags = getFeatureFlags();
  
  let content = `# FEATURE FLAG MATRIX

**Date**: ${testResults.timestamp}  
**Analysis**: Feature flag impact on test behavior

## 🚩 Active Feature Flags

| Flag | Value | Impact |
|------|-------|--------|
`;

  Object.entries(featureFlags).forEach(([flag, value]) => {
    let impact = 'Unknown';
    if (flag === 'WEB_RESEARCH' && value === 'on') impact = 'Enables web research fallback';
    if (flag === 'NARRATIVE_V3' && value === 'on') impact = 'Enables V3 narrative generation';
    if (flag === 'CACHE_WRITE' && value === 'on') impact = 'Enables cache write operations';
    if (flag === 'USE_LEGACY_BARCODE' && value === 'true') impact = 'Enables legacy barcode pipeline';
    if (flag === 'USE_VISION_FIRST_PIPELINE' && value === 'true') impact = 'Enables vision-first pipeline';
    
    content += `| ${flag} | ${value} | ${impact} |\n`;
  });

  content += `\n## 📊 Feature Flag Impact Analysis

### Web Research Impact
- **Flag Value**: ${featureFlags.WEB_RESEARCH}
- **Tests Using Web Research**: ${testResults.results.filter(r => r.agentsTriggered.includes('web_research')).length}
- **Expected Web Research**: ${testResults.results.filter(r => r.expectedAgents.includes('web_research')).length}

### Cache Write Impact
- **Flag Value**: ${featureFlags.CACHE_WRITE}
- **Cache Writes Occurred**: ${testResults.results.filter(r => r.cacheBehavior.write).length}
- **Expected Cache Writes**: ${testResults.results.filter(r => r.expectedCacheWrite).length}

### Narrative V3 Impact
- **Flag Value**: ${featureFlags.NARRATIVE_V3}
- **Narratives Generated**: ${testResults.results.filter(r => r.narrativeData).length}
- **Success Rate**: ${((testResults.results.filter(r => r.narrativeData).length / testResults.totalTests) * 100).toFixed(1)}%

---

*Generated by Extended Pipeline Verification Test Suite*
`;

  fs.writeFileSync(matrixPath, content);
  console.log(`📄 Feature flag matrix: ${matrixPath}`);
}

/**
 * Generate test trace summary
 */
function generateTestTraceSummary(): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summaryPath = path.join(TEST_CONFIG.docsDir, `TEST_TRACE_SUMMARY_${timestamp}.md`);
  
  let content = `# TEST TRACE SUMMARY

**Date**: ${testResults.timestamp}  
**Analysis**: Agent execution summary per test case

## 📊 Test Execution Summary

| Test ID | Category | Status | Response Time | Confidence | Agents | Coverage |
|---------|----------|--------|---------------|------------|--------|----------|
`;

  testResults.results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const confidence = result.confidenceScore ? `${result.confidenceScore}%` : 'N/A';
    const agents = result.agentsTriggered.length;
    const coverage = `${result.agentCoverage.toFixed(1)}%`;
    content += `| ${result.testId} | ${result.category} | ${status} | ${result.responseTime}ms | ${confidence} | ${agents} | ${coverage} |\n`;
  });

  content += `\n## 🔍 Detailed Agent Execution

`;

  testResults.results.forEach(result => {
    content += `### ${result.testId}: ${result.brand} | ${result.product}

- **Status**: ${result.success ? '✅ PASS' : '❌ FAIL'}
- **Response Time**: ${result.responseTime}ms
- **Confidence**: ${result.confidenceScore ? `${result.confidenceScore}%` : 'N/A'}
- **Agents Triggered**: ${result.agentsTriggered.join(', ') || 'None'}
- **Expected Agents**: ${result.expectedAgents.join(', ') || 'None'}
- **Missing Agents**: ${result.missingAgents.join(', ') || 'None'}
- **Unexpected Agents**: ${result.unexpectedAgents.join(', ') || 'None'}
- **Agent Coverage**: ${result.agentCoverage.toFixed(1)}%
- **Cache Hit**: ${result.cacheBehavior.hit ? '✅' : '❌'}
- **Cache Write**: ${result.cacheBehavior.write ? '✅' : '❌'}
- **Database Write**: ${result.databaseWrite.success ? '✅' : '❌'}

`;
  });

  content += `## 📈 Performance Metrics

- **Average Response Time**: ${(testResults.results.reduce((sum, r) => sum + r.responseTime, 0) / testResults.totalTests).toFixed(0)}ms
- **Fastest Response**: ${Math.min(...testResults.results.map(r => r.responseTime))}ms
- **Slowest Response**: ${Math.max(...testResults.results.map(r => r.responseTime))}ms
- **Success Rate**: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%

---

*Generated by Extended Pipeline Verification Test Suite*
`;

  fs.writeFileSync(summaryPath, content);
  console.log(`📄 Test trace summary: ${summaryPath}`);
}

/**
 * Main test execution
 */
async function runExtendedPipelineVerification() {
  console.log('🧪 EXTENDED PIPELINE VERIFICATION TEST SUITE');
  console.log('============================================');
  console.log(`Timestamp: ${testResults.timestamp}`);
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  
  console.log(`\n📋 Loaded ${EXTENDED_TEST_MATRIX.length} test cases`);
  
  // Run tests
  for (let i = 0; i < EXTENDED_TEST_MATRIX.length; i++) {
    const testCase = EXTENDED_TEST_MATRIX[i];
    console.log(`\n[${i + 1}/${EXTENDED_TEST_MATRIX.length}] Running test: ${testCase.id}`);
    
    const result = await makeExtendedLookupRequest(testCase);
    
    // Update statistics
    if (result.success) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    testResults.totalTests++;
    testResults.results.push(result);
    
    // Update agent coverage
    result.agentsTriggered.forEach(agent => {
      testResults.agentCoverage[agent] = (testResults.agentCoverage[agent] || 0) + 1;
    });
    
    // Update cache stats
    if (result.cacheBehavior.hit) testResults.cacheStats.hits++;
    else if (result.cacheBehavior.write) testResults.cacheStats.writes++;
    else testResults.cacheStats.misses++;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate comprehensive reports
  generateComprehensiveReports();
  
  // Final summary
  console.log('\n📊 FINAL SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%`);
  console.log(`Agent Coverage: ${Object.keys(testResults.agentCoverage).length} unique agents triggered`);
  console.log(`Cache Hits: ${testResults.cacheStats.hits}/${testResults.totalTests}`);
  console.log(`Cache Writes: ${testResults.cacheStats.writes}/${testResults.totalTests}`);
  
  console.log('\n✅ Extended pipeline verification completed');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExtendedPipelineVerification().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}
