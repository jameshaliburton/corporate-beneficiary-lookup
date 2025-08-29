#!/usr/bin/env npx tsx

/**
 * Feature Flag Enforcement Test Script
 * Tests that agents are properly controlled by feature flags
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface FeatureFlagTestResult {
  testName: string;
  flagName: string;
  flagValue: string;
  expectedBehavior: string;
  actualBehavior: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function testFeatureFlagEnforcement(): Promise<void> {
  console.log('🔧 FEATURE FLAG ENFORCEMENT TEST');
  console.log('==================================');
  
  const baseUrl = 'http://localhost:3000/api/lookup';
  const testCases = [
    {
      name: 'Gemini Agent Disabled',
      flagName: 'ENABLE_GEMINI_OWNERSHIP_AGENT',
      flagValue: 'false',
      expectedBehavior: 'Gemini agent should be skipped',
      testBrand: 'Jordan',
      testProduct: 'Athletic Shoes'
    },
    {
      name: 'Disambiguation Agent Disabled',
      flagName: 'ENABLE_DISAMBIGUATION_AGENT', 
      flagValue: 'false',
      expectedBehavior: 'Disambiguation should be skipped',
      testBrand: 'Jordan',
      testProduct: 'Toothpaste'
    },
    {
      name: 'Both Agents Disabled',
      flagName: 'BOTH_AGENTS',
      flagValue: 'false',
      expectedBehavior: 'Both agents should be skipped',
      testBrand: 'Nike',
      testProduct: 'Running Shoes'
    }
  ];
  
  const results: FeatureFlagTestResult[] = [];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`  Flag: ${testCase.flagName} = ${testCase.flagValue}`);
    console.log(`  Expected: ${testCase.expectedBehavior}`);
    
    // Set the feature flag
    if (testCase.flagName === 'BOTH_AGENTS') {
      process.env.ENABLE_GEMINI_OWNERSHIP_AGENT = 'false';
      process.env.ENABLE_DISAMBIGUATION_AGENT = 'false';
    } else {
      process.env[testCase.flagName] = testCase.flagValue;
    }
    
    const result = await makeRequest(testCase.testBrand, testCase.testProduct, testCase.name);
    results.push(result);
    
    // Reset flags for next test
    process.env.ENABLE_GEMINI_OWNERSHIP_AGENT = 'true';
    process.env.ENABLE_DISAMBIGUATION_AGENT = 'true';
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate report
  console.log('\n📊 FEATURE FLAG TEST RESULTS');
  console.log('=============================');
  
  let totalTests = 0;
  let successfulTests = 0;
  
  for (const result of results) {
    totalTests++;
    if (result.success) successfulTests++;
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.testName}: ${result.actualBehavior} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  console.log('\n📈 SUMMARY');
  console.log('===========');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Successful: ${successfulTests}/${totalTests} (${Math.round(successfulTests/totalTests*100)}%)`);
  
  if (successfulTests === totalTests) {
    console.log('\n✅ ALL FEATURE FLAGS WORKING CORRECTLY');
  } else {
    console.log('\n🚨 FEATURE FLAG ENFORCEMENT ISSUES DETECTED');
  }
}

async function makeRequest(brand: string, product: string, testName: string): Promise<FeatureFlagTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand,
        product_name: product,
        barcode: null,
        hints: {},
        evaluation_mode: false
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        testName,
        flagName: 'UNKNOWN',
        flagValue: 'UNKNOWN',
        expectedBehavior: 'Request should succeed',
        actualBehavior: `HTTP ${response.status}: ${response.statusText}`,
        success: false,
        duration,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    
    // Analyze the response to determine if agents were properly controlled
    let actualBehavior = '';
    let success = false;
    
    if (testName.includes('Gemini')) {
      const geminiAnalysis = data.agent_results?.gemini_analysis;
      if (geminiAnalysis && geminiAnalysis.reasoning?.includes('disabled by feature flag')) {
        actualBehavior = 'Gemini agent correctly skipped';
        success = true;
      } else if (geminiAnalysis && geminiAnalysis.success === false) {
        actualBehavior = 'Gemini agent skipped (but not due to feature flag)';
        success = false;
      } else {
        actualBehavior = 'Gemini agent unexpectedly executed';
        success = false;
      }
    } else if (testName.includes('Disambiguation')) {
      const disambiguationTriggered = data.disambiguation_triggered;
      if (disambiguationTriggered === false) {
        actualBehavior = 'Disambiguation correctly skipped';
        success = true;
      } else {
        actualBehavior = 'Disambiguation unexpectedly triggered';
        success = false;
      }
    } else if (testName.includes('Both')) {
      const geminiAnalysis = data.agent_results?.gemini_analysis;
      const disambiguationTriggered = data.disambiguation_triggered;
      
      if ((!geminiAnalysis || geminiAnalysis.reasoning?.includes('disabled by feature flag')) && 
          disambiguationTriggered === false) {
        actualBehavior = 'Both agents correctly skipped';
        success = true;
      } else {
        actualBehavior = 'One or both agents unexpectedly executed';
        success = false;
      }
    }
    
    return {
      testName,
      flagName: 'UNKNOWN',
      flagValue: 'UNKNOWN',
      expectedBehavior: 'Agents should be controlled by flags',
      actualBehavior,
      success,
      duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      testName,
      flagName: 'UNKNOWN',
      flagValue: 'UNKNOWN',
      expectedBehavior: 'Request should succeed',
      actualBehavior: 'Request failed',
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test
if (require.main === module) {
  testFeatureFlagEnforcement().catch(console.error);
}

export { testFeatureFlagEnforcement };
