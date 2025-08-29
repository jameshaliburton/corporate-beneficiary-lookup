#!/usr/bin/env node

/**
 * E2E Test Runner
 * 
 * Runs comprehensive end-to-end tests using fixtures and golden assertions
 * to ensure consistency between manual runs and automated tests.
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
  timeout: 30000,
  fixturesDir: path.join(__dirname, 'fixtures'),
  resultsDir: path.join(__dirname, 'results'),
  goldenDir: path.join(__dirname, 'golden')
};

// Feature flags for matrix testing
const FEATURE_FLAGS = {
  WEB_RESEARCH: process.env.WEB_RESEARCH || 'on',
  NARRATIVE_V3: process.env.NARRATIVE_V3 || 'on', 
  CACHE_WRITE: process.env.CACHE_WRITE || 'on'
};

/**
 * Load fixture data
 */
function loadFixture(fixtureName) {
  const fixturePath = path.join(TEST_CONFIG.fixturesDir, `${fixtureName}.json`);
  
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture not found: ${fixturePath}`);
  }
  
  const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  console.log(`[E2E] Loaded fixture: ${fixtureName}`);
  return fixtureData;
}

/**
 * Make API request to lookup endpoint
 */
async function makeLookupRequest(fixtureData) {
  const url = `${TEST_CONFIG.baseUrl}/api/lookup`;
  
  const requestBody = {
    brand: fixtureData.brand,
    product_name: fixtureData.product_name,
    barcode: fixtureData.barcode,
    hints: fixtureData.hints,
    evaluation_mode: false
  };
  
  console.log(`[E2E] Making request to ${url}:`, requestBody);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log(`[E2E] Received response:`, {
    success: result.success,
    result_type: result.result_type,
    has_ownership_data: !!result.ownership_data,
    has_narrative: !!result.narrative
  });
  
  return result;
}

/**
 * Validate response structure
 */
function validateResponseStructure(response, fixtureData) {
  const errors = [];
  
  // Check basic response structure
  if (typeof response.success !== 'boolean') {
    errors.push('Response missing success field');
  }
  
  if (!response.result_type) {
    errors.push('Response missing result_type field');
  }
  
  // Check ownership data structure
  if (response.ownership_data) {
    const ownership = response.ownership_data;
    
    if (fixtureData.expected_owner && ownership.financial_beneficiary !== fixtureData.expected_owner) {
      errors.push(`Expected owner '${fixtureData.expected_owner}', got '${ownership.financial_beneficiary}'`);
    }
    
    if (fixtureData.expected_owner_country && ownership.beneficiary_country !== fixtureData.expected_owner_country) {
      errors.push(`Expected owner country '${fixtureData.expected_owner_country}', got '${ownership.beneficiary_country}'`);
    }
    
    if (ownership.confidence_score < fixtureData.expected_confidence_min) {
      errors.push(`Confidence too low: ${ownership.confidence_score} < ${fixtureData.expected_confidence_min}`);
    }
    
    if (ownership.confidence_score > fixtureData.expected_confidence_max) {
      errors.push(`Confidence too high: ${ownership.confidence_score} > ${fixtureData.expected_confidence_max}`);
    }
    
    if (ownership.ownership_flow) {
      const chainLength = ownership.ownership_flow.length;
      if (chainLength < fixtureData.expected_ownership_chain_length_min) {
        errors.push(`Ownership chain too short: ${chainLength} < ${fixtureData.expected_ownership_chain_length_min}`);
      }
      if (chainLength > fixtureData.expected_ownership_chain_length_max) {
        errors.push(`Ownership chain too long: ${chainLength} > ${fixtureData.expected_ownership_chain_length_max}`);
      }
    }
    
    if (ownership.sources) {
      const sourceCount = ownership.sources.length;
      if (sourceCount < fixtureData.expected_sources_min) {
        errors.push(`Too few sources: ${sourceCount} < ${fixtureData.expected_sources_min}`);
      }
    }
  }
  
  // Check narrative structure
  if (response.narrative) {
    const narrative = response.narrative;
    
    for (const field of fixtureData.expected_narrative_fields) {
      if (!narrative[field]) {
        errors.push(`Missing narrative field: ${field}`);
      }
    }
    
    if (fixtureData.expected_country_emphasis) {
      const hasCountryEmphasis = narrative.headline?.includes('🇳🇱') || 
                                narrative.headline?.includes('🇬🇧') ||
                                narrative.headline?.includes('🇸🇪') ||
                                narrative.headline?.includes('🇺🇸') ||
                                narrative.headline?.includes('🇨🇦');
      
      if (!hasCountryEmphasis) {
        errors.push('Expected country emphasis in narrative headline');
      }
    }
    
    if (fixtureData.expected_template_used && narrative.template_used !== fixtureData.expected_template_used) {
      errors.push(`Expected template '${fixtureData.expected_template_used}', got '${narrative.template_used}'`);
    }
  }
  
  return errors;
}

/**
 * Save test results
 */
function saveTestResults(fixtureName, response, errors) {
  const resultsDir = TEST_CONFIG.resultsDir;
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const resultData = {
    timestamp: new Date().toISOString(),
    fixture: fixtureName,
    feature_flags: FEATURE_FLAGS,
    success: errors.length === 0,
    errors: errors,
    response: response
  };
  
  const resultPath = path.join(resultsDir, `${fixtureName}-${Date.now()}.json`);
  fs.writeFileSync(resultPath, JSON.stringify(resultData, null, 2));
  
  console.log(`[E2E] Test results saved to: ${resultPath}`);
  return resultPath;
}

/**
 * Run single fixture test
 */
async function runFixtureTest(fixtureName) {
  console.log(`\n🧪 Running E2E test for fixture: ${fixtureName}`);
  console.log(`📋 Feature flags:`, FEATURE_FLAGS);
  
  try {
    // Load fixture data
    const fixtureData = loadFixture(fixtureName);
    
    // Make API request
    const response = await makeLookupRequest(fixtureData);
    
    // Validate response structure
    const errors = validateResponseStructure(response, fixtureData);
    
    // Save results
    const resultPath = saveTestResults(fixtureName, response, errors);
    
    // Report results
    if (errors.length === 0) {
      console.log(`✅ ${fixtureName} test PASSED`);
      return { success: true, fixture: fixtureName, errors: [], resultPath };
    } else {
      console.log(`❌ ${fixtureName} test FAILED`);
      console.log(`   Errors: ${errors.join(', ')}`);
      return { success: false, fixture: fixtureName, errors, resultPath };
    }
    
  } catch (error) {
    console.error(`❌ ${fixtureName} test ERROR:`, error.message);
    return { success: false, fixture: fixtureName, errors: [error.message], resultPath: null };
  }
}

/**
 * Run all fixture tests
 */
async function runAllTests() {
  console.log('🧪 E2E Test Runner Starting');
  console.log('============================');
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Feature Flags:`, FEATURE_FLAGS);
  
  // Get all fixture files
  const fixtureFiles = fs.readdirSync(TEST_CONFIG.fixturesDir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
  
  console.log(`\n📋 Found ${fixtureFiles.length} fixtures: ${fixtureFiles.join(', ')}`);
  
  const results = [];
  
  // Run each fixture test
  for (const fixtureName of fixtureFiles) {
    const result = await runFixtureTest(fixtureName);
    results.push(result);
  }
  
  // Generate summary report
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log('\n📊 E2E Test Summary');
  console.log('===================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.fixture}: ${result.errors.join(', ')}`);
    });
  }
  
  // Save summary report
  const summaryPath = path.join(TEST_CONFIG.resultsDir, `e2e-summary-${Date.now()}.json`);
  const summaryData = {
    timestamp: new Date().toISOString(),
    feature_flags: FEATURE_FLAGS,
    summary: { totalTests, passedTests, failedTests },
    results: results
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
  console.log(`\n💾 Summary report saved to: ${summaryPath}`);
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('❌ E2E testing failed:', error);
    process.exit(1);
  });
}
