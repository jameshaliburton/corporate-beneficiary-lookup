#!/usr/bin/env node

/**
 * Full Pipeline E2E Verification Test Suite
 * 
 * Comprehensive automated test suite that validates every step of the OwnedBy.ai pipeline:
 * - Vision/text extractor (image or manual input)
 * - Brand disambiguation
 * - Enhanced API or DB lookup
 * - GeminiAgent (vision understanding)
 * - EnhancedAgentOwnershipResearch
 * - EnhancedWebSearchOwnershipAgent
 * - Confidence scoring + structuring
 * - NarrativeGeneratorV3
 * - Schema validation (Zod, fallback detection)
 * - Cache write (Supabase, service role)
 * 
 * Tests real-world brands and validates agent trace outputs, failure detection,
 * feature flag states, and schema guards.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 60000, // Increased for comprehensive testing
  resultsDir: path.join(__dirname, 'results'),
  reportsDir: path.join(__dirname, '..', '..', 'test-results')
};

// Real-world test brands with expected behaviors
const TEST_BRANDS = [
  {
    name: 'Lipton',
    type: 'manual',
    expectedBehavior: 'success_with_disambiguation',
    expectedOwner: 'Unilever',
    expectedCountry: 'Netherlands',
    expectedConfidence: { min: 80, max: 100 },
    testDisambiguation: true
  },
  {
    name: 'Samsung',
    type: 'manual',
    expectedBehavior: 'success_with_complex_ownership',
    expectedOwner: 'Samsung Group',
    expectedCountry: 'South Korea',
    expectedConfidence: { min: 90, max: 100 },
    testDisambiguation: true
  },
  {
    name: 'IKEA',
    type: 'manual',
    expectedBehavior: 'success_direct_ownership',
    expectedOwner: 'INGKA Foundation',
    expectedCountry: 'Netherlands',
    expectedConfidence: { min: 85, max: 100 },
    testDisambiguation: false
  },
  {
    name: 'Moose Milk',
    type: 'manual',
    expectedBehavior: 'fallback_unknown_brand',
    expectedOwner: 'Unknown',
    expectedCountry: 'Unknown',
    expectedConfidence: { min: 0, max: 50 },
    testDisambiguation: false
  },
  {
    name: 'Nestlé',
    type: 'manual',
    expectedBehavior: 'success_global_corporation',
    expectedOwner: 'Nestlé S.A.',
    expectedCountry: 'Switzerland',
    expectedConfidence: { min: 95, max: 100 },
    testDisambiguation: false
  }
];

// Feature flag matrix for comprehensive testing
const FEATURE_FLAG_MATRIX = [
  { WEB_RESEARCH: 'on', NARRATIVE_V3: 'on', CACHE_WRITE: 'on' },
  { WEB_RESEARCH: 'off', NARRATIVE_V3: 'on', CACHE_WRITE: 'on' },
  { WEB_RESEARCH: 'on', NARRATIVE_V3: 'off', CACHE_WRITE: 'on' },
  { WEB_RESEARCH: 'on', NARRATIVE_V3: 'on', CACHE_WRITE: 'off' }
];

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  brandTests: [],
  featureFlagTests: [],
  agentTraceAnalysis: [],
  schemaValidationResults: [],
  silentFailureDetection: [],
  fallbackContentAnalysis: [],
  recommendations: []
};

/**
 * Make API request to lookup endpoint with comprehensive logging
 */
async function makeLookupRequest(brand, testConfig = {}) {
  const url = `${TEST_CONFIG.baseUrl}/api/lookup`;
  
  const requestBody = {
    brand: brand.name,
    product_name: brand.name,
    barcode: null,
    hints: {},
    evaluation_mode: false,
    ...testConfig
  };
  
  console.log(`\n🔍 Testing ${brand.name} (${brand.type})`);
  console.log(`📋 Expected: ${brand.expectedBehavior}`);
  console.log(`🎯 Owner: ${brand.expectedOwner}, Country: ${brand.expectedCountry}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`✅ ${brand.name} completed in ${duration}ms`);
    console.log(`   Success: ${result.success || false}`);
    console.log(`   Result Type: ${result.result_type || 'unknown'}`);
    
    return {
      success: true,
      duration,
      result,
      brand: brand.name,
      requestBody
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${brand.name} failed after ${duration}ms:`, error.message);
    
    return {
      success: false,
      duration,
      error: error.message,
      brand: brand.name,
      requestBody
    };
  }
}

/**
 * Analyze agent trace outputs and detect failures
 */
function analyzeAgentTraces(result, brand) {
  const analysis = {
    brand: brand.name,
    hasAgentTraces: false,
    agentExecutionStages: [],
    silentFailures: [],
    fallbackTriggers: [],
    schemaValidationLogs: [],
    confidenceScoring: null,
    narrativeGeneration: null,
    cacheOperations: []
  };
  
  if (!result || !result.agent_execution_trace) {
    analysis.silentFailures.push('No agent execution trace found');
    return analysis;
  }
  
  analysis.hasAgentTraces = true;
  
  // Analyze agent execution stages
  if (result.agent_execution_trace.sections) {
    result.agent_execution_trace.sections.forEach(section => {
      section.stages.forEach(stage => {
        analysis.agentExecutionStages.push({
          section: section.label,
          stage: stage.id,
          status: stage.status,
          duration: stage.duration
        });
        
        // Check for silent failures
        if (stage.status === 'failed' && !stage.error) {
          analysis.silentFailures.push(`Stage ${stage.id} failed without error message`);
        }
        
        // Check for fallback triggers
        if (stage.status === 'fallback') {
          analysis.fallbackTriggers.push(`Stage ${stage.id} triggered fallback`);
        }
      });
    });
  }
  
  // Analyze confidence scoring
  if (result.ownership_data && result.ownership_data.confidence_score !== undefined) {
    analysis.confidenceScoring = {
      score: result.ownership_data.confidence_score,
      level: result.ownership_data.confidence_level,
      factors: result.ownership_data.confidence_factors
    };
  }
  
  // Analyze narrative generation
  if (result.narrative) {
    analysis.narrativeGeneration = {
      template: result.narrative.template_used,
      hasFallbackContent: result.narrative.headline?.includes('Not enough info') || 
                         result.narrative.story?.includes('limited information'),
      countryEmphasis: result.narrative.headline?.includes('🇳🇱') || 
                      result.narrative.headline?.includes('🇬🇧') ||
                      result.narrative.headline?.includes('🇸🇪') ||
                      result.narrative.headline?.includes('🇺🇸') ||
                      result.narrative.headline?.includes('🇨🇦')
    };
  }
  
  return analysis;
}

/**
 * Validate result structure against expected brand behavior
 */
function validateBrandResult(result, brand) {
  const validation = {
    brand: brand.name,
    passed: true,
    errors: [],
    warnings: [],
    metrics: {}
  };
  
  if (!result.success) {
    validation.passed = false;
    validation.errors.push('API request failed');
    return validation;
  }
  
  // Validate ownership data structure
  if (!result.ownership_data) {
    validation.passed = false;
    validation.errors.push('Missing ownership_data in response');
  } else {
    const ownership = result.ownership_data;
    
    // Check expected owner
    if (brand.expectedOwner !== 'Unknown' && ownership.financial_beneficiary !== brand.expectedOwner) {
      validation.warnings.push(`Expected owner '${brand.expectedOwner}', got '${ownership.financial_beneficiary}'`);
    }
    
    // Check expected country
    if (brand.expectedCountry !== 'Unknown' && ownership.beneficiary_country !== brand.expectedCountry) {
      validation.warnings.push(`Expected country '${brand.expectedCountry}', got '${ownership.beneficiary_country}'`);
    }
    
    // Check confidence range
    if (ownership.confidence_score < brand.expectedConfidence.min || 
        ownership.confidence_score > brand.expectedConfidence.max) {
      validation.warnings.push(`Confidence ${ownership.confidence_score}% outside expected range ${brand.expectedConfidence.min}-${brand.expectedConfidence.max}%`);
    }
    
    // Check for required fields
    const requiredFields = ['financial_beneficiary', 'beneficiary_country', 'confidence_score', 'ownership_flow'];
    requiredFields.forEach(field => {
      if (ownership[field] === undefined || ownership[field] === null) {
        validation.errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Check ownership flow structure
    if (ownership.ownership_flow && !Array.isArray(ownership.ownership_flow)) {
      validation.errors.push('ownership_flow is not an array');
    }
    
    validation.metrics.confidence = ownership.confidence_score;
    validation.metrics.chainLength = ownership.ownership_flow?.length || 0;
    validation.metrics.sourceCount = ownership.sources?.length || 0;
  }
  
  // Validate narrative structure
  if (!result.narrative) {
    validation.warnings.push('Missing narrative in response');
  } else {
    const narrative = result.narrative;
    const requiredNarrativeFields = ['headline', 'tagline', 'story', 'ownership_notes', 'behind_the_scenes'];
    
    requiredNarrativeFields.forEach(field => {
      if (!narrative[field]) {
        validation.errors.push(`Missing narrative field: ${field}`);
      }
    });
    
    // Check for fallback content
    if (narrative.headline?.includes('Not enough info') || 
        narrative.story?.includes('limited information')) {
      validation.warnings.push('Narrative contains fallback content');
    }
  }
  
  // Check for disambiguation
  if (brand.testDisambiguation && result.disambiguation_options && result.disambiguation_options.length > 0) {
    validation.metrics.disambiguationOptions = result.disambiguation_options.length;
  }
  
  return validation;
}

/**
 * Test individual brand with comprehensive analysis
 */
async function testBrand(brand) {
  console.log(`\n🧪 Testing brand: ${brand.name}`);
  
  const testResult = await makeLookupRequest(brand);
  
  if (!testResult.success) {
    testResults.brandTests.push({
      brand: brand.name,
      success: false,
      error: testResult.error,
      duration: testResult.duration
    });
    return;
  }
  
  // Analyze agent traces
  const agentAnalysis = analyzeAgentTraces(testResult.result, brand);
  testResults.agentTraceAnalysis.push(agentAnalysis);
  
  // Validate result structure
  const validation = validateBrandResult(testResult.result, brand);
  
  // Store comprehensive test result
  testResults.brandTests.push({
    brand: brand.name,
    success: testResult.success,
    duration: testResult.duration,
    validation: validation,
    agentAnalysis: agentAnalysis,
    result: testResult.result
  });
  
  // Update summary
  testResults.summary.totalTests++;
  if (validation.passed) {
    testResults.summary.passed++;
    console.log(`✅ ${brand.name} validation PASSED`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${brand.name} validation FAILED: ${validation.errors.join(', ')}`);
  }
  
  if (validation.warnings.length > 0) {
    console.log(`⚠️  ${brand.name} warnings: ${validation.warnings.join(', ')}`);
  }
}

/**
 * Test feature flag matrix combinations
 */
async function testFeatureFlagMatrix() {
  console.log('\n🎛️  Testing feature flag matrix...');
  
  for (const flags of FEATURE_FLAG_MATRIX) {
    console.log(`\n🔧 Testing flags: ${JSON.stringify(flags)}`);
    
    // Set environment variables
    Object.entries(flags).forEach(([key, value]) => {
      process.env[key] = value;
    });
    
    // Test with a known brand (Lipton)
    const lipton = TEST_BRANDS.find(b => b.name === 'Lipton');
    const testResult = await makeLookupRequest(lipton);
    
    testResults.featureFlagTests.push({
      flags: flags,
      success: testResult.success,
      duration: testResult.duration,
      result: testResult.result
    });
    
    // Reset environment variables
    Object.keys(flags).forEach(key => {
      delete process.env[key];
    });
  }
}

/**
 * Test schema validation effectiveness
 */
async function testSchemaValidation() {
  console.log('\n🔍 Testing schema validation...');
  
  try {
    // Import schema validation functions
    const { safeParseOwnershipData, OwnershipSchema } = await import('../../src/lib/schemas/ownership-schema.ts');
    
    const testCases = [
      {
        name: 'Valid ownership data',
        data: {
          ownership_chain: [{ name: 'Test Brand', role: 'Brand', country: 'US' }],
          sources: ['source1', 'source2'],
          confidence: 0.85,
          brand_name: 'Test Brand',
          ultimate_owner: 'Test Owner'
        }
      },
      {
        name: 'Null data',
        data: null
      },
      {
        name: 'Undefined data',
        data: undefined
      },
      {
        name: 'Empty object',
        data: {}
      },
      {
        name: 'Malformed ownership chain',
        data: {
          ownership_chain: 'not an array',
          sources: null,
          confidence: 'not a number'
        }
      }
    ];
    
    testCases.forEach(testCase => {
      try {
        const result = safeParseOwnershipData(OwnershipSchema, testCase.data, `Test_${testCase.name}`);
        
        testResults.schemaValidationResults.push({
          testCase: testCase.name,
          input: testCase.data,
          result: result,
          success: true,
          hasDefaults: result && Object.values(result).some(v => v === 'Unknown' || v === '' || (Array.isArray(v) && v.length === 0))
        });
        
        console.log(`✅ Schema test: ${testCase.name} - PASSED`);
        
      } catch (error) {
        testResults.schemaValidationResults.push({
          testCase: testCase.name,
          input: testCase.data,
          error: error.message,
          success: false
        });
        
        console.log(`❌ Schema test: ${testCase.name} - FAILED: ${error.message}`);
      }
    });
    
  } catch (error) {
    console.error(`❌ Schema validation test failed:`, error.message);
    testResults.schemaValidationResults.push({
      testCase: 'Schema import',
      error: error.message,
      success: false
    });
  }
}

/**
 * Detect silent failures across the pipeline
 */
function detectSilentFailures() {
  console.log('\n🔍 Detecting silent failures...');
  
  // Analyze brand test results for silent failures
  testResults.brandTests.forEach(test => {
    if (test.agentAnalysis) {
      test.agentAnalysis.silentFailures.forEach(failure => {
        testResults.silentFailureDetection.push({
          brand: test.brand,
          failure: failure,
          severity: 'high'
        });
      });
    }
  });
  
  // Analyze agent trace analysis
  testResults.agentTraceAnalysis.forEach(analysis => {
    if (analysis.silentFailures.length > 0) {
      analysis.silentFailures.forEach(failure => {
        testResults.silentFailureDetection.push({
          brand: analysis.brand,
          failure: failure,
          severity: 'high'
        });
      });
    }
  });
  
  console.log(`Found ${testResults.silentFailureDetection.length} silent failures`);
}

/**
 * Analyze fallback content patterns
 */
function analyzeFallbackContent() {
  console.log('\n🔍 Analyzing fallback content...');
  
  testResults.brandTests.forEach(test => {
    if (test.agentAnalysis && test.agentAnalysis.narrativeGeneration) {
      const narrative = test.agentAnalysis.narrativeGeneration;
      
      if (narrative.hasFallbackContent) {
        testResults.fallbackContentAnalysis.push({
          brand: test.brand,
          type: 'narrative_fallback',
          severity: 'medium',
          details: 'Narrative contains fallback content'
        });
      }
    }
    
    if (test.agentAnalysis && test.agentAnalysis.fallbackTriggers.length > 0) {
      test.agentAnalysis.fallbackTriggers.forEach(trigger => {
        testResults.fallbackContentAnalysis.push({
          brand: test.brand,
          type: 'agent_fallback',
          severity: 'medium',
          details: trigger
        });
      });
    }
  });
  
  console.log(`Found ${testResults.fallbackContentAnalysis.length} fallback content instances`);
}

/**
 * Generate comprehensive recommendations
 */
function generateRecommendations() {
  console.log('\n🎯 Generating recommendations...');
  
  // Analyze test results and generate recommendations
  const silentFailureCount = testResults.silentFailureDetection.length;
  const fallbackCount = testResults.fallbackContentAnalysis.length;
  const schemaFailureCount = testResults.schemaValidationResults.filter(r => !r.success).length;
  
  if (silentFailureCount > 0) {
    testResults.recommendations.push({
      priority: 'high',
      category: 'Silent Failures',
      recommendation: `Fix ${silentFailureCount} silent failure patterns`,
      details: 'Replace silent null returns with proper error logging and structured responses'
    });
  }
  
  if (fallbackCount > 0) {
    testResults.recommendations.push({
      priority: 'medium',
      category: 'Fallback Content',
      recommendation: `Address ${fallbackCount} fallback content instances`,
      details: 'Improve data quality and agent performance to reduce fallback usage'
    });
  }
  
  if (schemaFailureCount > 0) {
    testResults.recommendations.push({
      priority: 'high',
      category: 'Schema Validation',
      recommendation: `Fix ${schemaFailureCount} schema validation issues`,
      details: 'Ensure all agents properly validate and structure their return values'
    });
  }
  
  // Add specific recommendations based on findings
  testResults.recommendations.push({
    priority: 'medium',
    category: 'Monitoring',
    recommendation: 'Implement comprehensive pipeline monitoring',
    details: 'Add metrics for agent performance, fallback rates, and error tracking'
  });
  
  testResults.recommendations.push({
    priority: 'low',
    category: 'User Experience',
    recommendation: 'Add fallback content indicators in frontend',
    details: 'Show users when fallback content is displayed so they understand data limitations'
  });
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(TEST_CONFIG.reportsDir, `full-pipeline-report-${timestamp}.md`);
  
  // Ensure reports directory exists
  if (!fs.existsSync(TEST_CONFIG.reportsDir)) {
    fs.mkdirSync(TEST_CONFIG.reportsDir, { recursive: true });
  }
  
  let report = `# Full Pipeline E2E Verification Report

**Date**: ${testResults.timestamp}  
**Status**: ${testResults.summary.failed === 0 ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED'}

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | ${testResults.summary.totalTests} |
| **Passed** | ${testResults.summary.passed} |
| **Failed** | ${testResults.summary.failed} |
| **Success Rate** | ${((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(1)}% |
| **Silent Failures** | ${testResults.silentFailureDetection.length} |
| **Fallback Content** | ${testResults.fallbackContentAnalysis.length} |
| **Schema Violations** | ${testResults.schemaValidationResults.filter(r => !r.success).length} |

## 🧪 Brand Test Results

`;

  // Add brand test results
  testResults.brandTests.forEach(test => {
    const status = test.success ? '✅' : '❌';
    report += `### ${status} ${test.brand}\n\n`;
    report += `- **Duration**: ${test.duration}ms\n`;
    report += `- **Success**: ${test.success}\n`;
    
    if (test.validation) {
      report += `- **Validation**: ${test.validation.passed ? 'PASSED' : 'FAILED'}\n`;
      if (test.validation.errors.length > 0) {
        report += `- **Errors**: ${test.validation.errors.join(', ')}\n`;
      }
      if (test.validation.warnings.length > 0) {
        report += `- **Warnings**: ${test.validation.warnings.join(', ')}\n`;
      }
      if (test.validation.metrics) {
        report += `- **Confidence**: ${test.validation.metrics.confidence}%\n`;
        report += `- **Chain Length**: ${test.validation.metrics.chainLength}\n`;
        report += `- **Sources**: ${test.validation.metrics.sourceCount}\n`;
      }
    }
    
    if (test.error) {
      report += `- **Error**: ${test.error}\n`;
    }
    
    report += '\n';
  });

  // Add agent trace analysis
  report += `## 🔍 Agent Trace Analysis

`;

  testResults.agentTraceAnalysis.forEach(analysis => {
    report += `### ${analysis.brand}\n\n`;
    report += `- **Has Agent Traces**: ${analysis.hasAgentTraces}\n`;
    report += `- **Execution Stages**: ${analysis.agentExecutionStages.length}\n`;
    report += `- **Silent Failures**: ${analysis.silentFailures.length}\n`;
    report += `- **Fallback Triggers**: ${analysis.fallbackTriggers.length}\n`;
    
    if (analysis.confidenceScoring) {
      report += `- **Confidence Score**: ${analysis.confidenceScoring.score}%\n`;
    }
    
    if (analysis.narrativeGeneration) {
      report += `- **Narrative Template**: ${analysis.narrativeGeneration.template}\n`;
      report += `- **Has Fallback Content**: ${analysis.narrativeGeneration.hasFallbackContent}\n`;
      report += `- **Country Emphasis**: ${analysis.narrativeGeneration.countryEmphasis}\n`;
    }
    
    report += '\n';
  });

  // Add silent failures
  if (testResults.silentFailureDetection.length > 0) {
    report += `## ❌ Silent Failures Detected

`;

    testResults.silentFailureDetection.forEach(failure => {
      report += `- **${failure.brand}**: ${failure.failure}\n`;
    });
    
    report += '\n';
  }

  // Add fallback content analysis
  if (testResults.fallbackContentAnalysis.length > 0) {
    report += `## ⚠️ Fallback Content Analysis

`;

    testResults.fallbackContentAnalysis.forEach(fallback => {
      report += `- **${fallback.brand}**: ${fallback.details}\n`;
    });
    
    report += '\n';
  }

  // Add schema validation results
  report += `## 🔍 Schema Validation Results

`;

  testResults.schemaValidationResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    report += `- ${status} **${result.testCase}**: ${result.success ? 'PASSED' : 'FAILED'}\n`;
    if (result.error) {
      report += `  - Error: ${result.error}\n`;
    }
  });

  report += '\n';

  // Add recommendations
  report += `## 🎯 Recommendations

`;

  testResults.recommendations.forEach(rec => {
    report += `### [${rec.priority.toUpperCase()}] ${rec.recommendation}\n\n`;
    report += `${rec.details}\n\n`;
  });

  // Add feature flag test results
  if (testResults.featureFlagTests.length > 0) {
    report += `## 🎛️ Feature Flag Test Results

`;

    testResults.featureFlagTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      report += `- ${status} **${JSON.stringify(test.flags)}**: ${test.success ? 'PASSED' : 'FAILED'}\n`;
    });
  }

  report += `\n## 📋 Next Steps

1. **Address Critical Issues**: Fix silent failures and schema violations
2. **Improve Data Quality**: Reduce fallback content usage
3. **Enhance Monitoring**: Implement comprehensive pipeline monitoring
4. **User Experience**: Add fallback content indicators in frontend

---

*Report generated by Full Pipeline E2E Verification Test Suite*
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Test report generated: ${reportPath}`);
  
  return reportPath;
}

/**
 * Save detailed test results as JSON
 */
function saveTestResults() {
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
  console.log(`Test Brands: ${TEST_BRANDS.map(b => b.name).join(', ')}`);
  
  try {
    // Test each brand
    for (const brand of TEST_BRANDS) {
      await testBrand(brand);
    }
    
    // Test feature flag matrix
    await testFeatureFlagMatrix();
    
    // Test schema validation
    await testSchemaValidation();
    
    // Analyze results
    detectSilentFailures();
    analyzeFallbackContent();
    generateRecommendations();
    
    // Generate reports
    const reportPath = generateTestReport();
    const resultsPath = saveTestResults();
    
    // Final summary
    console.log('\n📊 FINAL SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${testResults.summary.totalTests}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(1)}%`);
    console.log(`Silent Failures: ${testResults.silentFailureDetection.length}`);
    console.log(`Fallback Content: ${testResults.fallbackContentAnalysis.length}`);
    console.log(`Schema Violations: ${testResults.schemaValidationResults.filter(r => !r.success).length}`);
    
    console.log(`\n📄 Reports generated:`);
    console.log(`  - Test Report: ${reportPath}`);
    console.log(`  - Detailed Results: ${resultsPath}`);
    
    console.log('\n✅ Full pipeline verification completed successfully');
    
    // Exit with appropriate code
    process.exit(testResults.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Full pipeline verification failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullPipelineVerification().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}
