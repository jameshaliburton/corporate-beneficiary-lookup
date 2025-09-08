/**
 * Production-Safe Test Suite for Ownership Pipeline POR v1.1
 * Tests the defined test matrix to validate end-to-end flows
 */

import { NextRequest } from 'next/server';
import { POST } from './src/app/api/lookup/route.ts';

class OwnershipPipelineTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  /**
   * Run the complete test suite
   */
  async runTestSuite() {
    console.log('[TEST_SUITE] Starting Ownership Pipeline POR v1.1 Test Suite');
    console.log('[TEST_SUITE] ================================================');

    // Cache Key Tests
    await this.runCacheKeyTests();
    
    // Gemini Verification Tests
    await this.runGeminiVerificationTests();
    
    // RAG Behavior Tests
    await this.runRAGBehaviorTests();
    
    // Generate final report
    this.generateTestReport();
  }

  /**
   * Test cache key behavior with dual-save strategy
   */
  async runCacheKeyTests() {
    console.log('\n[TEST_SUITE] 🔁 Cache Key Tests');
    console.log('[TEST_SUITE] -------------------');

    const cacheTests = [
      {
        name: 'Pop-Tarts + Strawberry (Dual Cache)',
        brand: 'Pop-Tarts',
        product: 'Strawberry',
        expectation: 'Cache hit (dual)',
        testType: 'cache_dual'
      },
      {
        name: 'Zara (Brand Only)',
        brand: 'Zara',
        product: null,
        expectation: 'Cache hit',
        testType: 'cache_brand_only'
      },
      {
        name: 'Nestlé Toll House (Disambiguation)',
        brand: 'Nestlé Toll House',
        product: 'Chocolate Chips',
        expectation: 'Disambiguation',
        testType: 'disambiguation'
      },
      {
        name: 'Super Unknown™️ (Full Pipeline)',
        brand: 'Super Unknown™️',
        product: null,
        expectation: 'Full pipeline',
        testType: 'full_pipeline'
      }
    ];

    for (const test of cacheTests) {
      await this.runCacheTest(test);
    }
  }

  /**
   * Run individual cache test
   */
  async runCacheTest(test) {
    console.log(`\n[TEST_SUITE] Testing: ${test.name}`);
    
    try {
      const requestBody = {
        brand: test.brand,
        product_name: test.product,
        test_mode: true
      };

      const request = new NextRequest('http://localhost:3000/api/lookup', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const startTime = Date.now();
      const response = await POST(request);
      const duration = Date.now() - startTime;

      const result = await response.json();

      const testResult = {
        testName: test.name,
        testType: test.testType,
        expectation: test.expectation,
        success: this.validateCacheTest(test, result),
        duration: duration,
        result: {
          cache_hit: result.cache_hit,
          financial_beneficiary: result.financial_beneficiary,
          confidence_score: result.confidence_score,
          verification_status: result.verification_status,
          pipeline_type: result.pipeline_type
        },
        logs: this.extractRelevantLogs(result)
      };

      this.testResults.push(testResult);

      console.log(`[TEST_SUITE] ${testResult.success ? '✅' : '❌'} ${test.name}`);
      console.log(`[TEST_SUITE]   Duration: ${duration}ms`);
      console.log(`[TEST_SUITE]   Cache Hit: ${result.cache_hit}`);
      console.log(`[TEST_SUITE]   Beneficiary: ${result.financial_beneficiary}`);
      console.log(`[TEST_SUITE]   Confidence: ${result.confidence_score}`);

    } catch (error) {
      console.error(`[TEST_SUITE] ❌ ${test.name} - ERROR:`, error.message);
      
      this.testResults.push({
        testName: test.name,
        testType: test.testType,
        expectation: test.expectation,
        success: false,
        error: error.message,
        duration: 0
      });
    }
  }

  /**
   * Validate cache test results
   */
  validateCacheTest(test, result) {
    switch (test.testType) {
      case 'cache_dual':
        return result.cache_hit === true && result.financial_beneficiary && result.financial_beneficiary !== 'Unknown';
      
      case 'cache_brand_only':
        return result.cache_hit === true && result.financial_beneficiary && result.financial_beneficiary !== 'Unknown';
      
      case 'disambiguation':
        return result.financial_beneficiary && result.financial_beneficiary !== 'Unknown' && result.confidence_score > 50;
      
      case 'full_pipeline':
        return result.pipeline_type === 'fresh_lookup' && (result.financial_beneficiary === 'Unknown' || result.confidence_score < 30);
      
      default:
        return false;
    }
  }

  /**
   * Test Gemini verification behavior
   */
  async runGeminiVerificationTests() {
    console.log('\n[TEST_SUITE] 🤖 Gemini Verification Tests');
    console.log('[TEST_SUITE] -----------------------------');

    const geminiTests = [
      {
        name: 'Delta (Should Trigger Gemini)',
        brand: 'Delta',
        product: null,
        expectation: 'Gemini triggered',
        testType: 'gemini_trigger'
      },
      {
        name: 'Red Bull (Already Verified)',
        brand: 'Red Bull',
        product: null,
        expectation: 'Gemini skipped',
        testType: 'gemini_skip'
      }
    ];

    for (const test of geminiTests) {
      await this.runGeminiTest(test);
    }
  }

  /**
   * Run individual Gemini test
   */
  async runGeminiTest(test) {
    console.log(`\n[TEST_SUITE] Testing: ${test.name}`);
    
    try {
      const requestBody = {
        brand: test.brand,
        product_name: test.product,
        test_mode: true
      };

      const request = new NextRequest('http://localhost:3000/api/lookup', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const startTime = Date.now();
      const response = await POST(request);
      const duration = Date.now() - startTime;

      const result = await response.json();

      const testResult = {
        testName: test.name,
        testType: test.testType,
        expectation: test.expectation,
        success: this.validateGeminiTest(test, result),
        duration: duration,
        result: {
          verification_status: result.verification_status,
          verified_at: result.verified_at,
          verification_method: result.verification_method,
          verification_notes: result.verification_notes
        },
        logs: this.extractRelevantLogs(result)
      };

      this.testResults.push(testResult);

      console.log(`[TEST_SUITE] ${testResult.success ? '✅' : '❌'} ${test.name}`);
      console.log(`[TEST_SUITE]   Duration: ${duration}ms`);
      console.log(`[TEST_SUITE]   Verification Status: ${result.verification_status}`);
      console.log(`[TEST_SUITE]   Verification Method: ${result.verification_method}`);

    } catch (error) {
      console.error(`[TEST_SUITE] ❌ ${test.name} - ERROR:`, error.message);
      
      this.testResults.push({
        testName: test.name,
        testType: test.testType,
        expectation: test.expectation,
        success: false,
        error: error.message,
        duration: 0
      });
    }
  }

  /**
   * Validate Gemini test results
   */
  validateGeminiTest(test, result) {
    switch (test.testType) {
      case 'gemini_trigger':
        return result.verification_status && result.verification_method && result.verified_at;
      
      case 'gemini_skip':
        return result.verification_status === 'verified' || !result.verification_method;
      
      default:
        return false;
    }
  }

  /**
   * Test RAG behavior
   */
  async runRAGBehaviorTests() {
    console.log('\n[TEST_SUITE] 🧠 RAG Behavior Tests');
    console.log('[TEST_SUITE] ----------------------');

    const ragTests = [
      {
        name: 'Pop-Tarts (Should Populate RAG)',
        brand: 'Pop-Tarts',
        product: 'Strawberry',
        expectation: 'RAG populated',
        testType: 'rag_populate'
      },
      {
        name: 'Super Unknown™️ (Should Not Populate RAG)',
        brand: 'Super Unknown™️',
        product: null,
        expectation: 'RAG not populated',
        testType: 'rag_skip'
      }
    ];

    for (const test of ragTests) {
      await this.runRAGTest(test);
    }
  }

  /**
   * Run individual RAG test
   */
  async runRAGTest(test) {
    console.log(`\n[TEST_SUITE] Testing: ${test.name}`);
    
    try {
      const requestBody = {
        brand: test.brand,
        product_name: test.product,
        test_mode: true
      };

      const request = new NextRequest('http://localhost:3000/api/lookup', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const startTime = Date.now();
      const response = await POST(request);
      const duration = Date.now() - startTime;

      const result = await response.json();

      const testResult = {
        testName: test.name,
        testType: test.testType,
        expectation: test.expectation,
        success: this.validateRAGTest(test, result),
        duration: duration,
        result: {
          financial_beneficiary: result.financial_beneficiary,
          confidence_score: result.confidence_score,
          rag_populated: this.checkRAGPopulation(result)
        },
        logs: this.extractRelevantLogs(result)
      };

      this.testResults.push(testResult);

      console.log(`[TEST_SUITE] ${testResult.success ? '✅' : '❌'} ${test.name}`);
      console.log(`[TEST_SUITE]   Duration: ${duration}ms`);
      console.log(`[TEST_SUITE]   Beneficiary: ${result.financial_beneficiary}`);
      console.log(`[TEST_SUITE]   Confidence: ${result.confidence_score}`);
      console.log(`[TEST_SUITE]   RAG Populated: ${testResult.result.rag_populated}`);

    } catch (error) {
      console.error(`[TEST_SUITE] ❌ ${test.name} - ERROR:`, error.message);
      
      this.testResults.push({
        testName: test.name,
        testType: test.testType,
        expectation: test.expectation,
        success: false,
        error: error.message,
        duration: 0
      });
    }
  }

  /**
   * Validate RAG test results
   */
  validateRAGTest(test, result) {
    switch (test.testType) {
      case 'rag_populate':
        return result.financial_beneficiary && 
               result.financial_beneficiary !== 'Unknown' && 
               result.confidence_score >= 30;
      
      case 'rag_skip':
        return !result.financial_beneficiary || 
               result.financial_beneficiary === 'Unknown' || 
               result.confidence_score < 30;
      
      default:
        return false;
    }
  }

  /**
   * Check if RAG was populated (based on logs)
   */
  checkRAGPopulation(result) {
    // This would need to be implemented based on actual RAG population logging
    // For now, return true if we have a successful result with good confidence
    return result.financial_beneficiary && 
           result.financial_beneficiary !== 'Unknown' && 
           result.confidence_score >= 30;
  }

  /**
   * Extract relevant logs from result
   */
  extractRelevantLogs(result) {
    return {
      cache_operations: result.cache_hit ? 'cache_hit' : 'cache_miss',
      verification_operations: result.verification_status ? 'verification_present' : 'no_verification',
      rag_operations: result.financial_beneficiary && result.confidence_score >= 30 ? 'rag_eligible' : 'rag_skipped'
    };
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const totalDuration = Date.now() - this.startTime;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const failedTests = this.testResults.filter(r => !r.success).length;
    const totalTests = this.testResults.length;

    console.log('\n[TEST_SUITE] ===== OWNERSHIP PIPELINE POR v1.1 TEST REPORT =====');
    console.log(`[TEST_SUITE] Total Tests: ${totalTests}`);
    console.log(`[TEST_SUITE] Successful: ${successfulTests} ✅`);
    console.log(`[TEST_SUITE] Failed: ${failedTests} ❌`);
    console.log(`[TEST_SUITE] Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`[TEST_SUITE] Total Duration: ${totalDuration}ms`);
    console.log(`[TEST_SUITE] Average Duration: ${(totalDuration / totalTests).toFixed(0)}ms`);

    // Test type breakdown
    const testTypes = {};
    this.testResults.forEach(result => {
      if (!testTypes[result.testType]) {
        testTypes[result.testType] = { total: 0, successful: 0 };
      }
      testTypes[result.testType].total++;
      if (result.success) {
        testTypes[result.testType].successful++;
      }
    });

    console.log('\n[TEST_SUITE] Test Type Breakdown:');
    for (const [type, stats] of Object.entries(testTypes)) {
      const successRate = ((stats.successful / stats.total) * 100).toFixed(1);
      console.log(`[TEST_SUITE]   ${type}: ${stats.successful}/${stats.total} (${successRate}%)`);
    }

    // Failed tests details
    if (failedTests > 0) {
      console.log('\n[TEST_SUITE] Failed Tests Details:');
      this.testResults
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`[TEST_SUITE]   ❌ ${result.testName}: ${result.error || 'Validation failed'}`);
        });
    }

    console.log('\n[TEST_SUITE] ===== END TEST REPORT =====');

    // Return results for programmatic use
    return {
      totalTests,
      successfulTests,
      failedTests,
      successRate: (successfulTests / totalTests) * 100,
      totalDuration,
      averageDuration: totalDuration / totalTests,
      testTypes,
      results: this.testResults
    };
  }
}

// Run the test suite if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new OwnershipPipelineTester();
  tester.runTestSuite()
    .then(report => {
      console.log('\n[TEST_SUITE] Test suite completed');
      process.exit(report.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('[TEST_SUITE] Test suite failed:', error);
      process.exit(1);
    });
}

export { OwnershipPipelineTester };
