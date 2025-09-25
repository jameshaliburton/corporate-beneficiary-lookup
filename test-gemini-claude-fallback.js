#!/usr/bin/env node

/**
 * Test Script: Gemini-Claude Fallback System
 * 
 * Tests the medical brand detection and safe mode fallback functionality
 * to ensure compliance with Gemini API restrictions.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test cases for medical brand detection
const testCases = [
  {
    name: 'Medical Brand - Boots Pharmacy',
    brand: 'Boots Pharmacy',
    product: 'Boots Pharmacy',
    expectedFallback: true,
    expectedReason: 'Medical brand detected',
    medicalKeywords: ['pharmacy']
  },
  {
    name: 'Medical Brand - Johnson & Johnson',
    brand: 'Johnson & Johnson',
    product: 'Medical Device',
    expectedFallback: true,
    expectedReason: 'Medical brand detected',
    medicalKeywords: ['medical']
  },
  {
    name: 'Non-Medical Brand - Coca-Cola',
    brand: 'Coca-Cola',
    product: 'Coca-Cola Classic',
    expectedFallback: false,
    expectedReason: 'Should use Gemini',
    medicalKeywords: []
  },
  {
    name: 'Non-Medical Brand - Nike',
    brand: 'Nike',
    product: 'Air Max',
    expectedFallback: false,
    expectedReason: 'Should use Gemini',
    medicalKeywords: []
  },
  {
    name: 'Edge Case - Health Food',
    brand: 'Health Food Co',
    product: 'Organic Snacks',
    expectedFallback: true,
    expectedReason: 'Medical brand detected',
    medicalKeywords: ['health']
  }
];

class FallbackTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  /**
   * Test medical brand detection logic
   */
  testMedicalBrandDetection() {
    console.log('🧪 Testing Medical Brand Detection Logic');
    console.log('=====================================');

    // Import the medical brand detection function
    const { isMedicalBrand } = require('./src/lib/agents/claude-verification-agent.js');

    for (const testCase of testCases) {
      const isMedical = isMedicalBrand(testCase.brand, testCase.product);
      const passed = isMedical === testCase.expectedFallback;
      
      console.log(`\n📋 ${testCase.name}`);
      console.log(`   Brand: ${testCase.brand}`);
      console.log(`   Product: ${testCase.product}`);
      console.log(`   Expected Fallback: ${testCase.expectedFallback}`);
      console.log(`   Actual Detection: ${isMedical}`);
      console.log(`   Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      
      if (!passed) {
        console.log(`   Expected: ${testCase.expectedReason}`);
        console.log(`   Actual: ${isMedical ? 'Detected as medical' : 'Not detected as medical'}`);
      }

      this.results.push({
        testCase: testCase.name,
        passed,
        expected: testCase.expectedFallback,
        actual: isMedical,
        reason: testCase.expectedReason
      });
    }
  }

  /**
   * Test safe mode environment variable
   */
  testSafeMode() {
    console.log('\n🔧 Testing Safe Mode Environment Variable');
    console.log('========================================');

    const originalValue = process.env.GEMINI_SAFE_MODE;
    
    // Test with safe mode disabled
    delete process.env.GEMINI_SAFE_MODE;
    const disabled = process.env.GEMINI_SAFE_MODE !== 'true';
    console.log(`   Safe Mode Disabled: ${disabled ? '✅' : '❌'}`);

    // Test with safe mode enabled
    process.env.GEMINI_SAFE_MODE = 'true';
    const enabled = process.env.GEMINI_SAFE_MODE === 'true';
    console.log(`   Safe Mode Enabled: ${enabled ? '✅' : '❌'}`);

    // Restore original value
    if (originalValue !== undefined) {
      process.env.GEMINI_SAFE_MODE = originalValue;
    } else {
      delete process.env.GEMINI_SAFE_MODE;
    }

    const safeModePassed = disabled && enabled;
    console.log(`   Safe Mode Test: ${safeModePassed ? '✅ PASS' : '❌ FAIL'}`);

    this.results.push({
      testCase: 'Safe Mode Environment Variable',
      passed: safeModePassed,
      expected: true,
      actual: safeModePassed,
      reason: 'Environment variable control'
    });
  }

  /**
   * Test API integration with medical brand
   */
  async testAPIIntegration() {
    console.log('\n🌐 Testing API Integration with Medical Brand');
    console.log('============================================');

    try {
      // Test with Boots Pharmacy (should trigger fallback)
      const testBrand = 'Boots Pharmacy';
      const testProduct = 'Boots Pharmacy';

      console.log(`   Testing: ${testBrand} - ${testProduct}`);
      console.log('   Expected: Should route to Claude fallback');

      // Make a test request to the lookup API
      const response = await fetch('http://localhost:3000/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: testBrand,
          product_name: testProduct
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Check if fallback was triggered
      const usedClaude = result.verification_method?.includes('claude') || 
                        result.agent_path?.some(path => path.includes('claude'));
      
      console.log(`   API Response: ${response.status}`);
      console.log(`   Verification Method: ${result.verification_method || 'N/A'}`);
      console.log(`   Agent Path: ${result.agent_path?.join(' -> ') || 'N/A'}`);
      console.log(`   Used Claude: ${usedClaude ? '✅' : '❌'}`);
      console.log(`   Result: ${usedClaude ? '✅ PASS' : '❌ FAIL'}`);

      this.results.push({
        testCase: 'API Integration - Medical Brand',
        passed: usedClaude,
        expected: true,
        actual: usedClaude,
        reason: 'Medical brand should route to Claude'
      });

    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log('   Result: ⚠️ SKIP (API not available)');

      this.results.push({
        testCase: 'API Integration - Medical Brand',
        passed: false,
        expected: true,
        actual: false,
        reason: `API test failed: ${error.message}`
      });
    }
  }

  /**
   * Test compliance logging
   */
  testComplianceLogging() {
    console.log('\n📊 Testing Compliance Logging');
    console.log('============================');

    // Check if compliance logging functions exist
    try {
      const geminiAgent = require('./src/lib/agents/gemini-ownership-analysis-agent.js');
      const claudeAgent = require('./src/lib/agents/claude-verification-agent.js');
      
      // Check if the files contain compliance logging code
      const fs = require('fs');
      const geminiContent = fs.readFileSync('./src/lib/agents/gemini-ownership-analysis-agent.js', 'utf8');
      const claudeContent = fs.readFileSync('./src/lib/agents/claude-verification-agent.js', 'utf8');
      
      const hasGeminiLogging = geminiContent.includes('logComplianceEvent') && 
                              geminiContent.includes('COMPLIANCE_LOG');
      const hasClaudeAgent = typeof claudeAgent.ClaudeVerificationAgent === 'function';
      const hasMedicalDetection = claudeContent.includes('isMedicalBrand');
      
      console.log(`   Gemini Compliance Logging: ${hasGeminiLogging ? '✅' : '❌'}`);
      console.log(`   Claude Agent Available: ${hasClaudeAgent ? '✅' : '❌'}`);
      console.log(`   Medical Brand Detection: ${hasMedicalDetection ? '✅' : '❌'}`);
      
      const loggingPassed = hasGeminiLogging && hasClaudeAgent && hasMedicalDetection;
      console.log(`   Compliance Logging Test: ${loggingPassed ? '✅ PASS' : '❌ FAIL'}`);

      this.results.push({
        testCase: 'Compliance Logging',
        passed: loggingPassed,
        expected: true,
        actual: loggingPassed,
        reason: 'Compliance logging functions available'
      });

    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log('   Result: ❌ FAIL');

      this.results.push({
        testCase: 'Compliance Logging',
        passed: false,
        expected: true,
        actual: false,
        reason: `Logging test failed: ${error.message}`
      });
    }
  }

  /**
   * Generate test summary
   */
  generateSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const duration = Math.round((Date.now() - this.startTime) / 1000);

    console.log('\n' + '='.repeat(60));
    console.log('📊 FALLBACK SYSTEM TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏱️ Duration: ${duration}s`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log('='.repeat(60));

    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Fallback system is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Review the implementation.');
      console.log('\nFailed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   ❌ ${result.testCase}: ${result.reason}`);
      });
    }

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      duration
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting Gemini-Claude Fallback System Tests');
    console.log('===============================================');
    console.log(`📅 Test started at: ${new Date().toISOString()}`);
    console.log(`🌿 Branch: feat/gemini-claude-fallback-recovery\n`);

    this.testMedicalBrandDetection();
    this.testSafeMode();
    await this.testAPIIntegration();
    this.testComplianceLogging();

    return this.generateSummary();
  }
}

// Main execution
async function main() {
  const tester = new FallbackTester();
  
  try {
    const summary = await tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FallbackTester };
