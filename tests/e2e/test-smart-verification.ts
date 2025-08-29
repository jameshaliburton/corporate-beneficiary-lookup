import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface SmartVerificationTestResult {
  testCase: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  details: {
    verificationStatus: string;
    verifiedAt: string | null;
    verificationMethod: string | null;
    geminiTriggered: boolean;
    expectedTrigger: boolean;
    ttlDays: number;
    error?: string;
  };
}

/**
 * Smart Verification Test Suite
 * Tests the new smart verification logic with TTL and conditions
 */
class SmartVerificationTestSuite {
  private baseUrl: string;
  private testResults: SmartVerificationTestResult[] = [];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log(`[SMART_VERIFICATION_TEST] Initializing Smart Verification Tests`);
    console.log(`[SMART_VERIFICATION_TEST] Base URL: ${this.baseUrl}`);
  }

  /**
   * Flush cache before each test to ensure clean state
   */
  private async flushCache(brands?: string[]): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`[CACHE_FLUSH] Flushing cache${brands ? ` for brands: ${brands.join(', ')}` : ' (all)'}`);
      
      const response = await fetch(`${this.baseUrl}/api/dev/flush-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brands ? { brands } : {}),
      });

      if (!response.ok) {
        throw new Error(`Cache flush failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const duration = performance.now() - startTime;
      
      console.log(`[CACHE_FLUSH] ✅ Success in ${duration.toFixed(2)}ms`);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[CACHE_FLUSH] ❌ Failed in ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Make API request to lookup endpoint
   */
  private async lookupProduct(brand: string, product?: string): Promise<any> {
    const startTime = performance.now();
    
    try {
      console.log(`[API_REQUEST] Looking up: ${brand}${product ? ` + ${product}` : ''}`);
      
      const response = await fetch(`${this.baseUrl}/api/lookup`, {
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
        }),
      });

      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[API_REQUEST] ✅ Success in ${duration.toFixed(2)}ms`);
      
      return { result, duration };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[API_REQUEST] ❌ Failed in ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Test Case 1: Fresh Verification (No existing verification)
   */
  private async testCase1(): Promise<SmartVerificationTestResult> {
    const testCase = '1. Fresh Verification (No existing verification)';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_SMART_VERIFICATION] Starting: ${testCase}`);
      
      // Flush cache to ensure no existing verification
      await this.flushCache(['jordan']);
      
      // Make API request
      const { result, duration } = await this.lookupProduct('Jordan', 'Athletic Shoes');
      
      const testDuration = performance.now() - startTime;
      
      // Analyze result
      const verificationStatus = result.verification_status;
      const verifiedAt = result.verified_at;
      const verificationMethod = result.verification_method;
      const geminiAnalysis = result.agent_results?.gemini_analysis;
      const geminiTriggered = geminiAnalysis?.success === true;
      
      // Assertions - should trigger Gemini for fresh verification
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Verification Status Present', condition: !!verificationStatus },
        { name: 'Gemini Should Trigger', condition: geminiTriggered },
        { name: 'Verified At Set', condition: !!verifiedAt },
        { name: 'Verification Method Set', condition: !!verificationMethod },
        { name: 'Performance Acceptable', condition: duration < 15000 }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_SMART_VERIFICATION] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_SMART_VERIFICATION] ✅ All assertions passed`);
      }

      console.log(`[TEST_SMART_VERIFICATION] verification_status=${verificationStatus}, verified_at=${verifiedAt}`);

      return {
        testCase,
        status,
        duration: testDuration,
        details: {
          verificationStatus,
          verifiedAt,
          verificationMethod,
          geminiTriggered,
          expectedTrigger: true,
          ttlDays: 14,
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_SMART_VERIFICATION] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          verificationStatus: 'error',
          verifiedAt: null,
          verificationMethod: null,
          geminiTriggered: false,
          expectedTrigger: true,
          ttlDays: 14,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Test Case 2: Cached Verification (Should skip Gemini)
   */
  private async testCase2(): Promise<SmartVerificationTestResult> {
    const testCase = '2. Cached Verification (Should skip Gemini)';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_SMART_VERIFICATION] Starting: ${testCase}`);
      
      // First request to create verification data
      await this.flushCache(['therabreath']);
      const { result: firstResult } = await this.lookupProduct('Therabreath', 'Mouthwash');
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Second request should use cached verification
      const { result, duration } = await this.lookupProduct('Therabreath', 'Mouthwash');
      
      const testDuration = performance.now() - startTime;
      
      // Analyze result
      const verificationStatus = result.verification_status;
      const verifiedAt = result.verified_at;
      const verificationMethod = result.verification_method;
      const geminiAnalysis = result.agent_results?.gemini_analysis;
      const geminiTriggered = geminiAnalysis?.success === true;
      
      // Assertions - should skip Gemini for cached verification
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Verification Status Present', condition: !!verificationStatus },
        { name: 'Gemini Should Skip', condition: !geminiTriggered },
        { name: 'Verified At Present', condition: !!verifiedAt },
        { name: 'Performance Fast', condition: duration < 5000 } // Should be fast due to cache
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_SMART_VERIFICATION] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_SMART_VERIFICATION] ✅ All assertions passed`);
      }

      console.log(`[TEST_SMART_VERIFICATION] verification_status=${verificationStatus}, gemini_triggered=${geminiTriggered}`);

      return {
        testCase,
        status,
        duration: testDuration,
        details: {
          verificationStatus,
          verifiedAt,
          verificationMethod,
          geminiTriggered,
          expectedTrigger: false,
          ttlDays: 14,
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_SMART_VERIFICATION] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          verificationStatus: 'error',
          verifiedAt: null,
          verificationMethod: null,
          geminiTriggered: false,
          expectedTrigger: false,
          ttlDays: 14,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Test Case 3: Disambiguation Case (Should skip verification)
   */
  private async testCase3(): Promise<SmartVerificationTestResult> {
    const testCase = '3. Disambiguation Case (Should skip verification)';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_SMART_VERIFICATION] Starting: ${testCase}`);
      
      // Flush cache to ensure fresh state
      await this.flushCache(['jordan']);
      
      // Make API request for ambiguous brand (should trigger disambiguation)
      const { result, duration } = await this.lookupProduct('Jordan', null);
      
      const testDuration = performance.now() - startTime;
      
      // Analyze result
      const verificationStatus = result.verification_status;
      const verifiedAt = result.verified_at;
      const verificationMethod = result.verification_method;
      const geminiAnalysis = result.agent_results?.gemini_analysis;
      const geminiTriggered = geminiAnalysis?.success === true;
      const disambiguationTriggered = result.disambiguation_triggered === true;
      
      // Assertions - should skip Gemini for disambiguation cases
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Disambiguation Triggered', condition: disambiguationTriggered },
        { name: 'Gemini Should Skip', condition: !geminiTriggered },
        { name: 'Verification Status Present', condition: !!verificationStatus },
        { name: 'Performance Acceptable', condition: duration < 15000 }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_SMART_VERIFICATION] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_SMART_VERIFICATION] ✅ All assertions passed`);
      }

      console.log(`[TEST_SMART_VERIFICATION] verification_status=${verificationStatus}, disambiguation_triggered=${disambiguationTriggered}`);

      return {
        testCase,
        status,
        duration: testDuration,
        details: {
          verificationStatus,
          verifiedAt,
          verificationMethod,
          geminiTriggered,
          expectedTrigger: false,
          ttlDays: 14,
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_SMART_VERIFICATION] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          verificationStatus: 'error',
          verifiedAt: null,
          verificationMethod: null,
          geminiTriggered: false,
          expectedTrigger: false,
          ttlDays: 14,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Run all test cases
   */
  public async runAllTests(): Promise<void> {
    const suiteStartTime = performance.now();
    
    console.log(`\n🚀 [SMART_VERIFICATION_TEST] Starting Smart Verification Test Suite`);
    console.log(`[SMART_VERIFICATION_TEST] Environment: ${process.env.NODE_ENV}`);
    console.log(`[SMART_VERIFICATION_TEST] Gemini API Key: ${process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET'}`);

    // Run all test cases
    const testCases = [
      () => this.testCase1(),
      () => this.testCase2(),
      () => this.testCase3()
    ];

    for (const testCase of testCases) {
      try {
        const result = await testCase();
        this.testResults.push(result);
      } catch (error) {
        console.error(`[SMART_VERIFICATION_TEST] Test case failed with error:`, error);
        // Continue with other tests
      }
    }

    const suiteDuration = performance.now() - suiteStartTime;
    
    // Calculate summary
    const summary = {
      total: this.testResults.length,
      passed: this.testResults.filter(r => r.status === 'PASS').length,
      failed: this.testResults.filter(r => r.status === 'FAIL').length,
      skipped: this.testResults.filter(r => r.status === 'SKIP').length,
      duration: suiteDuration
    };

    console.log(`\n📊 [SMART_VERIFICATION_TEST] Test Suite Complete`);
    console.log(`[SMART_VERIFICATION_TEST] Summary:`, summary);

    // Print detailed results
    console.log(`\n📋 [SMART_VERIFICATION_TEST] Detailed Results:`);
    for (const result of this.testResults) {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${statusIcon} ${result.testCase}`);
      console.log(`   Verification Status: ${result.details.verificationStatus}`);
      console.log(`   Verified At: ${result.details.verifiedAt || 'null'}`);
      console.log(`   Verification Method: ${result.details.verificationMethod || 'null'}`);
      console.log(`   Gemini Triggered: ${result.details.geminiTriggered} (expected: ${result.details.expectedTrigger})`);
      console.log(`   Duration: ${result.details.ttlDays}ms`);
      if (result.details.error) {
        console.log(`   Error: ${result.details.error}`);
      }
      console.log('');
    }

    // Exit with appropriate code
    const exitCode = summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
  }
}

/**
 * Main execution function
 */
async function runSmartVerificationTests() {
  try {
    const testSuite = new SmartVerificationTestSuite();
    await testSuite.runAllTests();
  } catch (error) {
    console.error(`[SMART_VERIFICATION_TEST] Fatal error:`, error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSmartVerificationTests();
}

export { SmartVerificationTestSuite, runSmartVerificationTests };
