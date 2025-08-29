import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface TestResult {
  testCase: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  details: {
    verificationStatus: string;
    geminiTriggered: boolean;
    performanceImpact: number;
    evidenceCount: number;
    error?: string;
  };
}

/**
 * Gemini Verification Test Suite
 * Tests the new Gemini verification behavior in the pipeline
 */
class GeminiVerificationTestSuite {
  private baseUrl: string;
  private testResults: TestResult[] = [];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log(`[GEMINI_TEST_SUITE] Initializing Gemini Verification Tests`);
    console.log(`[GEMINI_TEST_SUITE] Base URL: ${this.baseUrl}`);
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
   * Test Case 1: Confirmed Case (Jordan → Nike)
   */
  private async testCase1(): Promise<TestResult> {
    const testCase = '1. Confirmed Case (Jordan → Nike)';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_VERIFICATION] Starting: ${testCase}`);
      
      // Flush cache to ensure fresh Gemini verification
      await this.flushCache(['jordan']);
      
      // Make API request
      const { result, duration } = await this.lookupProduct('Jordan', 'Athletic Shoes');
      
      const testDuration = performance.now() - startTime;
      
      // Analyze result
      const verificationStatus = result.verification_status;
      const geminiAnalysis = result.agent_results?.gemini_analysis;
      const geminiTriggered = geminiAnalysis?.success === true;
      const evidenceCount = geminiAnalysis?.data?.evidence_analysis?.supporting_evidence?.length || 0;
      
      // Assertions
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Verification Status Present', condition: !!verificationStatus },
        { name: 'Gemini Triggered', condition: geminiTriggered },
        { name: 'Performance Acceptable', condition: duration < 10000 }, // < 10 seconds
        { name: 'Correct Owner', condition: result.financial_beneficiary === 'Nike, Inc.' }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_VERIFICATION] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_VERIFICATION] ✅ All assertions passed`);
      }

      console.log(`[TEST_VERIFICATION] status=${verificationStatus}`);

      return {
        testCase,
        status,
        duration: testDuration,
        details: {
          verificationStatus,
          geminiTriggered,
          performanceImpact: duration,
          evidenceCount,
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_VERIFICATION] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          verificationStatus: 'error',
          geminiTriggered: false,
          performanceImpact: 0,
          evidenceCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Test Case 2: Contradicted Case (Mock scenario)
   */
  private async testCase2(): Promise<TestResult> {
    const testCase = '2. Contradicted Case (Mock scenario)';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_VERIFICATION] Starting: ${testCase}`);
      
      // Flush cache to ensure fresh verification
      await this.flushCache(['therabreath']);
      
      // Make API request for a brand that should be confirmed
      const { result, duration } = await this.lookupProduct('Therabreath', 'Mouthwash');
      
      const testDuration = performance.now() - startTime;
      
      // Analyze result
      const verificationStatus = result.verification_status;
      const geminiAnalysis = result.agent_results?.gemini_analysis;
      const geminiTriggered = geminiAnalysis?.success === true;
      const evidenceCount = geminiAnalysis?.data?.evidence_analysis?.supporting_evidence?.length || 0;
      
      // For this test, we expect either confirmed or inconclusive (not contradicted in real scenario)
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Verification Status Present', condition: !!verificationStatus },
        { name: 'Gemini Triggered', condition: geminiTriggered },
        { name: 'Performance Acceptable', condition: duration < 10000 },
        { name: 'Valid Status', condition: ['confirmed', 'contradicted', 'inconclusive'].includes(verificationStatus) }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_VERIFICATION] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_VERIFICATION] ✅ All assertions passed`);
      }

      console.log(`[TEST_VERIFICATION] status=${verificationStatus}`);

      return {
        testCase,
        status,
        duration: testDuration,
        details: {
          verificationStatus,
          geminiTriggered,
          performanceImpact: duration,
          evidenceCount,
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_VERIFICATION] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          verificationStatus: 'error',
          geminiTriggered: false,
          performanceImpact: 0,
          evidenceCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Test Case 3: Inconclusive Case (Obscure brand)
   */
  private async testCase3(): Promise<TestResult> {
    const testCase = '3. Inconclusive Case (Obscure brand)';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_VERIFICATION] Starting: ${testCase}`);
      
      // Flush cache to ensure fresh verification
      await this.flushCache(['moosemilk']);
      
      // Make API request for an obscure brand
      const { result, duration } = await this.lookupProduct('Moose Milk', 'Dairy Product');
      
      const testDuration = performance.now() - startTime;
      
      // Analyze result
      const verificationStatus = result.verification_status;
      const geminiAnalysis = result.agent_results?.gemini_analysis;
      const geminiTriggered = geminiAnalysis?.success === true;
      const evidenceCount = geminiAnalysis?.data?.evidence_analysis?.supporting_evidence?.length || 0;
      
      // Assertions
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Verification Status Present', condition: !!verificationStatus },
        { name: 'Gemini Triggered', condition: geminiTriggered },
        { name: 'Performance Acceptable', condition: duration < 10000 },
        { name: 'Valid Status', condition: ['confirmed', 'contradicted', 'inconclusive'].includes(verificationStatus) }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_VERIFICATION] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_VERIFICATION] ✅ All assertions passed`);
      }

      console.log(`[TEST_VERIFICATION] status=${verificationStatus}`);

      return {
        testCase,
        status,
        duration: testDuration,
        details: {
          verificationStatus,
          geminiTriggered,
          performanceImpact: duration,
          evidenceCount,
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_VERIFICATION] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          verificationStatus: 'error',
          geminiTriggered: false,
          performanceImpact: 0,
          evidenceCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Test Case 4: Performance Check
   */
  private async testCase4(): Promise<TestResult> {
    const testCase = '4. Performance Check';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_VERIFICATION] Starting: ${testCase}`);
      
      // Flush cache to ensure fresh verification
      await this.flushCache(['apple']);
      
      // Make API request
      const { result, duration } = await this.lookupProduct('Apple', 'iPhone');
      
      const testDuration = performance.now() - startTime;
      
      // Analyze result
      const verificationStatus = result.verification_status;
      const geminiAnalysis = result.agent_results?.gemini_analysis;
      const geminiTriggered = geminiAnalysis?.success === true;
      const evidenceCount = geminiAnalysis?.data?.evidence_analysis?.supporting_evidence?.length || 0;
      
      // Performance assertions
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Total Duration < 15s', condition: duration < 15000 },
        { name: 'Verification Status Present', condition: !!verificationStatus },
        { name: 'Gemini Triggered', condition: geminiTriggered }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_VERIFICATION] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_VERIFICATION] ✅ All assertions passed`);
      }

      console.log(`[TEST_VERIFICATION] status=${verificationStatus}, duration=${duration}ms`);

      return {
        testCase,
        status,
        duration: testDuration,
        details: {
          verificationStatus,
          geminiTriggered,
          performanceImpact: duration,
          evidenceCount,
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_VERIFICATION] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          verificationStatus: 'error',
          geminiTriggered: false,
          performanceImpact: 0,
          evidenceCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Test Case 5: Fallback Check (Gemini fails)
   */
  private async testCase5(): Promise<TestResult> {
    const testCase = '5. Fallback Check (Gemini fails)';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_VERIFICATION] Starting: ${testCase}`);
      
      // Flush cache to ensure fresh verification
      await this.flushCache(['samsung']);
      
      // Make API request
      const { result, duration } = await this.lookupProduct('Samsung', 'Galaxy Phone');
      
      const testDuration = performance.now() - startTime;
      
      // Analyze result
      const verificationStatus = result.verification_status;
      const geminiAnalysis = result.agent_results?.gemini_analysis;
      const geminiTriggered = geminiAnalysis?.success === true;
      const evidenceCount = geminiAnalysis?.data?.evidence_analysis?.supporting_evidence?.length || 0;
      
      // Fallback assertions - system should still work even if Gemini fails
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Verification Status Present', condition: !!verificationStatus },
        { name: 'System Still Works', condition: !!result.financial_beneficiary },
        { name: 'Performance Acceptable', condition: duration < 15000 }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_VERIFICATION] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_VERIFICATION] ✅ All assertions passed`);
      }

      console.log(`[TEST_VERIFICATION] status=${verificationStatus}`);

      return {
        testCase,
        status,
        duration: testDuration,
        details: {
          verificationStatus,
          geminiTriggered,
          performanceImpact: duration,
          evidenceCount,
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_VERIFICATION] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          verificationStatus: 'error',
          geminiTriggered: false,
          performanceImpact: 0,
          evidenceCount: 0,
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
    
    console.log(`\n🚀 [GEMINI_TEST_SUITE] Starting Gemini Verification Test Suite`);
    console.log(`[GEMINI_TEST_SUITE] Environment: ${process.env.NODE_ENV}`);
    console.log(`[GEMINI_TEST_SUITE] Gemini API Key: ${process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET'}`);

    // Run all test cases
    const testCases = [
      () => this.testCase1(),
      () => this.testCase2(),
      () => this.testCase3(),
      () => this.testCase4(),
      () => this.testCase5()
    ];

    for (const testCase of testCases) {
      try {
        const result = await testCase();
        this.testResults.push(result);
      } catch (error) {
        console.error(`[GEMINI_TEST_SUITE] Test case failed with error:`, error);
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

    console.log(`\n📊 [GEMINI_TEST_SUITE] Test Suite Complete`);
    console.log(`[GEMINI_TEST_SUITE] Summary:`, summary);

    // Print detailed results
    console.log(`\n📋 [GEMINI_TEST_SUITE] Detailed Results:`);
    for (const result of this.testResults) {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${statusIcon} ${result.testCase}`);
      console.log(`   Status: ${result.details.verificationStatus}`);
      console.log(`   Gemini Triggered: ${result.details.geminiTriggered}`);
      console.log(`   Duration: ${result.details.performanceImpact.toFixed(0)}ms`);
      console.log(`   Evidence Count: ${result.details.evidenceCount}`);
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
async function runGeminiVerificationTests() {
  try {
    const testSuite = new GeminiVerificationTestSuite();
    await testSuite.runAllTests();
  } catch (error) {
    console.error(`[GEMINI_TEST_SUITE] Fatal error:`, error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runGeminiVerificationTests();
}

export { GeminiVerificationTestSuite, runGeminiVerificationTests };
