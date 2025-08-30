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

class VerificationPropagationTestSuite {
  private results: TestResult[] = [];

  async runTests(): Promise<void> {
    console.log('🧪 [VERIFICATION_PROPAGATION] Starting Verification Propagation Tests');
    console.log('🧪 [VERIFICATION_PROPAGATION] Base URL:', BASE_URL);

    // Test 1: Direct Gemini Agent Call
    await this.testDirectGeminiAgentCall();

    // Test 2: Pipeline Gemini Trigger (Smart Verification)
    await this.testPipelineGeminiTrigger();

    // Test 3: Pipeline Skipped Scenario (Disambiguation active)
    await this.testPipelineSkippedScenario();

    this.printResults();
  }

  private async testDirectGeminiAgentCall(): Promise<void> {
    console.log('\n[TEST_DIRECT_GEMINI] Starting: Direct Gemini Agent Call');
    
    try {
      const result = await GeminiOwnershipAnalysisAgent({
        brand: 'TestcoGemini',
        product_name: 'Test Product',
        ownershipData: {
          financial_beneficiary: 'Test Parent Corp',
          confidence_score: 85
        },
        hints: {},
        queryId: 'test-direct-123'
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
        verificationFields.verification_method
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

  private async testPipelineGeminiTrigger(): Promise<void> {
    console.log('\n[TEST_PIPELINE_GEMINI] Starting: Pipeline Gemini Trigger');
    
    try {
      // Flush cache first
      await this.flushCache(['testcogeminifinal']);
      
      // Make API call with fresh brand to force full pipeline
      const response = await fetch(`${BASE_URL}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: 'TestcoGeminiFinal',
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
        testName: 'Pipeline Gemini Trigger',
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
        testName: 'Pipeline Gemini Trigger',
        passed: false,
        error: error.message,
        details: { error: error.toString() }
      });
      console.log(`[TEST_PIPELINE_GEMINI] ❌ FAILED - Error:`, error.message);
    }
  }

  private async testPipelineSkippedScenario(): Promise<void> {
    console.log('\n[TEST_PIPELINE_SKIPPED] Starting: Pipeline Skipped Scenario');
    
    try {
      // Flush cache first
      await this.flushCache(['jordan']);
      
      // Make API call for ambiguous brand (should trigger disambiguation, skip Gemini)
      const response = await fetch(`${BASE_URL}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: 'Jordan', // Ambiguous brand
          product_name: null, // No product context
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
        verification_method: data.verification_method
      };

      const disambiguationTriggered = data.disambiguation_triggered === true;
      const geminiTriggered = data.agent_results?.gemini_analysis?.success === true;

      // Should have disambiguation triggered and Gemini skipped
      const passed = disambiguationTriggered && !geminiTriggered;

      this.results.push({
        testName: 'Pipeline Skipped Scenario',
        passed,
        details: {
          verification_fields: verificationFields,
          disambiguation_triggered: disambiguationTriggered,
          gemini_triggered: geminiTriggered,
          expected_behavior: 'Disambiguation triggered, Gemini skipped'
        }
      });

      console.log(`[TEST_PIPELINE_SKIPPED] ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`[TEST_PIPELINE_SKIPPED] Disambiguation triggered:`, disambiguationTriggered);
      console.log(`[TEST_PIPELINE_SKIPPED] Gemini triggered:`, geminiTriggered);

    } catch (error) {
      this.results.push({
        testName: 'Pipeline Skipped Scenario',
        passed: false,
        error: error.message,
        details: { error: error.toString() }
      });
      console.log(`[TEST_PIPELINE_SKIPPED] ❌ FAILED - Error:`, error.message);
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
    console.log('\n📊 [VERIFICATION_PROPAGATION] Test Suite Complete');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    console.log(`[VERIFICATION_PROPAGATION] Summary: { total: ${this.results.length}, passed: ${passed}, failed: ${failed} }`);
    
    console.log('\n📋 [VERIFICATION_PROPAGATION] Detailed Results:');
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
async function runVerificationPropagationTests() {
  const testSuite = new VerificationPropagationTestSuite();
  await testSuite.runTests();
}

export { VerificationPropagationTestSuite, runVerificationPropagationTests };

// Run if called directly
if (require.main === module) {
  runVerificationPropagationTests().catch(console.error);
}
