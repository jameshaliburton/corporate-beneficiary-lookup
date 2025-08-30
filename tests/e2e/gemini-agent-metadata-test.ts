import dotenv from 'dotenv';
import { GeminiOwnershipAnalysisAgent } from '../../src/lib/agents/gemini-ownership-analysis-agent.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details: any;
}

class GeminiMetadataTestSuite {
  private results: TestResult[] = [];

  async runTests(): Promise<void> {
    console.log('🧪 [GEMINI_METADATA_TEST] Starting Gemini Agent Metadata Tests');
    console.log('🧪 [GEMINI_METADATA_TEST] Base URL:', BASE_URL);

    // Test 1: Direct Gemini Agent Call
    await this.testDirectGeminiCall();

    // Test 2: Pipeline Gemini Call
    await this.testPipelineGeminiCall();

    this.printResults();
  }

  private async testDirectGeminiCall(): Promise<void> {
    console.log('\n[TEST_DIRECT_GEMINI] Starting: Direct Gemini Agent Call');
    
    try {
      const result = await GeminiOwnershipAnalysisAgent({
        brand: 'TestcoGeminiTrace',
        product_name: 'Test Product',
        ownershipData: {
          financial_beneficiary: 'Test Parent Corp',
          confidence_score: 85
        },
        hints: {},
        queryId: 'test-direct-trace-123'
      });

      const verificationFields = {
        verification_status: result.gemini_result?.verification_status,
        verified_at: result.gemini_result?.verified_at,
        verification_method: result.gemini_result?.verification_method,
        verification_notes: result.gemini_result?.verification_notes
      };

      const passed = !!(
        verificationFields.verification_status &&
        verificationFields.verified_at &&
        verificationFields.verification_method &&
        verificationFields.verification_notes
      );

      this.results.push({
        testName: 'Direct Gemini Agent Call',
        passed,
        details: {
          success: result.success,
          gemini_triggered: result.gemini_triggered,
          verification_fields: verificationFields,
          all_fields_present: passed
        }
      });

      console.log(`[TEST_DIRECT_GEMINI] ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`[TEST_DIRECT_GEMINI] Verification fields:`, verificationFields);

    } catch (error) {
      this.results.push({
        testName: 'Direct Gemini Agent Call',
        passed: false,
        error: error.message,
        details: { error: error.toString() }
      });
      console.log(`[TEST_DIRECT_GEMINI] ❌ FAILED - Error:`, error.message);
    }
  }

  private async testPipelineGeminiCall(): Promise<void> {
    console.log('\n[TEST_PIPELINE_GEMINI] Starting: Pipeline Gemini Call');
    
    try {
      // Flush cache first
      await this.flushCache(['testcogeminimtrace']);
      
      // Make API call
      const response = await fetch(`${BASE_URL}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: 'TestcoGeminiTrace',
          product_name: 'Test Product',
          barcode: null,
          hints: {},
          evaluation_mode: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const verificationFields = {
        verification_status: data.verification_status,
        verified_at: data.verified_at,
        verification_method: data.verification_method,
        verification_notes: data.verification_notes
      };

      const agentData = {
        verification_status: data.agent_results?.gemini_analysis?.data?.verification_status,
        verified_at: data.agent_results?.gemini_analysis?.data?.verified_at,
        verification_method: data.agent_results?.gemini_analysis?.data?.verification_method,
        verification_notes: data.agent_results?.gemini_analysis?.data?.verification_notes
      };

      const passed = !!(
        verificationFields.verification_status &&
        verificationFields.verified_at &&
        verificationFields.verification_method &&
        agentData.verification_status &&
        agentData.verified_at &&
        agentData.verification_method
      );

      this.results.push({
        testName: 'Pipeline Gemini Call',
        passed,
        details: {
          top_level_fields: verificationFields,
          agent_data_fields: agentData,
          gemini_triggered: data.agent_results?.gemini_analysis?.success,
          all_fields_present: passed
        }
      });

      console.log(`[TEST_PIPELINE_GEMINI] ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`[TEST_PIPELINE_GEMINI] Top-level fields:`, verificationFields);
      console.log(`[TEST_PIPELINE_GEMINI] Agent data fields:`, agentData);

    } catch (error) {
      this.results.push({
        testName: 'Pipeline Gemini Call',
        passed: false,
        error: error.message,
        details: { error: error.toString() }
      });
      console.log(`[TEST_PIPELINE_GEMINI] ❌ FAILED - Error:`, error.message);
    }
  }

  private async flushCache(brands: string[]): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/api/dev/flush-cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brands })
      });

      if (!response.ok) {
        throw new Error(`Cache flush failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[CACHE_FLUSH] Flushed cache for brands: ${brands.join(', ')}`);
    } catch (error) {
      console.warn(`[CACHE_FLUSH] Warning: Could not flush cache:`, error.message);
    }
  }

  private printResults(): void {
    console.log('\n📊 [GEMINI_METADATA_TEST] Test Suite Complete');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    console.log(`[GEMINI_METADATA_TEST] Summary: { total: ${this.results.length}, passed: ${passed}, failed: ${failed} }`);
    
    console.log('\n📋 [GEMINI_METADATA_TEST] Detailed Results:');
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${result.testName}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    });
  }
}

// Run the test suite
async function runGeminiMetadataTests() {
  const testSuite = new GeminiMetadataTestSuite();
  await testSuite.runTests();
}

export { GeminiMetadataTestSuite, runGeminiMetadataTests };

// Run if called directly
if (require.main === module) {
  runGeminiMetadataTests().catch(console.error);
}
