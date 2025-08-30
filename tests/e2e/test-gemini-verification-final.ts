import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

interface TestCase {
  id: string;
  brand: string;
  product_name?: string;
  expectedTrigger: boolean;
  expectedStatus?: string;
  notes: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'lipton-ambiguous',
    brand: 'Lipton',
    product_name: 'Tea',
    expectedTrigger: true,
    expectedStatus: 'inconclusive',
    notes: 'Tests disambiguation + Gemini combo'
  },
  {
    id: 'testco-gemini-trace',
    brand: 'TestcoGeminiTrace',
    product_name: 'Test Product',
    expectedTrigger: true,
    expectedStatus: 'insufficient_evidence',
    notes: 'Pure Gemini test path with low confidence'
  },
  {
    id: 'sony-high-confidence',
    brand: 'Sony',
    product_name: 'PlayStation',
    expectedTrigger: false,
    notes: 'High confidence, should skip Gemini'
  },
  {
    id: 'nortec-unknown',
    brand: 'Nortec Labs',
    product_name: 'Unknown Product',
    expectedTrigger: true,
    expectedStatus: 'inconclusive',
    notes: 'Tests unknown resolution'
  },
  {
    id: 'hidden-foods-contradict',
    brand: 'HiddenFoods Ltd.',
    product_name: 'Mystery Snacks',
    expectedTrigger: true,
    expectedStatus: 'inconclusive',
    notes: 'Test contradict trigger'
  }
];

interface TestResult {
  testId: string;
  brand: string;
  passed: boolean;
  error?: string;
  details: {
    geminiTriggered: boolean;
    verificationStatus?: string;
    verifiedAt?: string;
    verificationMethod?: string;
    verificationNotes?: string;
    confidenceScore?: number;
    financialBeneficiary?: string;
    expectedTrigger: boolean;
    expectedStatus?: string;
  };
}

class GeminiVerificationFinalTestSuite {
  private results: TestResult[] = [];

  async runTests(): Promise<void> {
    console.log('🧪 [GEMINI_VERIFICATION_FINAL] Starting Final Gemini Verification Tests');
    console.log('🧪 [GEMINI_VERIFICATION_FINAL] Base URL:', BASE_URL);

    for (const testCase of TEST_CASES) {
      await this.runTestCase(testCase);
    }

    this.printResults();
  }

  private async runTestCase(testCase: TestCase): Promise<void> {
    console.log(`\n[TEST_${testCase.id.toUpperCase()}] Starting: ${testCase.brand} - ${testCase.notes}`);
    
    try {
      // Flush cache first
      await this.flushCache([testCase.brand.toLowerCase()]);
      
      // Make API call
      const response = await fetch(`${BASE_URL}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: testCase.brand,
          product_name: testCase.product_name,
          barcode: null,
          hints: {},
          evaluation_mode: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if Gemini was triggered
      const geminiTriggered = !!(
        data.agent_results?.gemini_analysis?.success &&
        data.agent_results?.gemini_analysis?.data
      );

      // Check verification fields
      const verificationStatus = data.verification_status;
      const verifiedAt = data.verified_at;
      const verificationMethod = data.verification_method;
      const verificationNotes = data.verification_notes;

      // Determine if test passed
      let passed = true;
      const errors: string[] = [];

      // Check trigger expectation
      if (testCase.expectedTrigger !== geminiTriggered) {
        passed = false;
        errors.push(`Expected Gemini trigger: ${testCase.expectedTrigger}, got: ${geminiTriggered}`);
      }

      // Check status expectation if provided
      if (testCase.expectedStatus && verificationStatus !== testCase.expectedStatus) {
        passed = false;
        errors.push(`Expected status: ${testCase.expectedStatus}, got: ${verificationStatus}`);
      }

      // If Gemini was triggered, check that metadata is present
      if (geminiTriggered) {
        if (!verifiedAt) {
          passed = false;
          errors.push('Missing verified_at field');
        }
        if (!verificationMethod) {
          passed = false;
          errors.push('Missing verification_method field');
        }
        if (!verificationNotes) {
          passed = false;
          errors.push('Missing verification_notes field');
        }
      }

      this.results.push({
        testId: testCase.id,
        brand: testCase.brand,
        passed,
        error: errors.length > 0 ? errors.join('; ') : undefined,
        details: {
          geminiTriggered,
          verificationStatus,
          verifiedAt,
          verificationMethod,
          verificationNotes,
          confidenceScore: data.confidence_score,
          financialBeneficiary: data.financial_beneficiary,
          expectedTrigger: testCase.expectedTrigger,
          expectedStatus: testCase.expectedStatus
        }
      });

      console.log(`[TEST_${testCase.id.toUpperCase()}] ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      if (!passed) {
        console.log(`[TEST_${testCase.id.toUpperCase()}] Errors:`, errors);
      }
      console.log(`[TEST_${testCase.id.toUpperCase()}] Details:`, {
        geminiTriggered,
        verificationStatus,
        confidenceScore: data.confidence_score,
        financialBeneficiary: data.financial_beneficiary
      });

    } catch (error) {
      this.results.push({
        testId: testCase.id,
        brand: testCase.brand,
        passed: false,
        error: error.message,
        details: {
          geminiTriggered: false,
          expectedTrigger: testCase.expectedTrigger,
          expectedStatus: testCase.expectedStatus
        }
      });
      console.log(`[TEST_${testCase.id.toUpperCase()}] ❌ FAILED - Error:`, error.message);
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

      console.log(`[CACHE_FLUSH] Flushed cache for brands: ${brands.join(', ')}`);
    } catch (error) {
      console.warn(`[CACHE_FLUSH] Warning: Could not flush cache:`, error.message);
    }
  }

  private printResults(): void {
    console.log('\n📊 [GEMINI_VERIFICATION_FINAL] Test Suite Complete');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    console.log(`[GEMINI_VERIFICATION_FINAL] Summary: { total: ${this.results.length}, passed: ${passed}, failed: ${failed} }`);
    
    console.log('\n📋 [GEMINI_VERIFICATION_FINAL] Detailed Results:');
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${result.brand} (${result.testId})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log(`   Gemini Triggered: ${result.details.geminiTriggered} (expected: ${result.details.expectedTrigger})`);
      if (result.details.verificationStatus) {
        console.log(`   Verification Status: ${result.details.verificationStatus}`);
      }
      if (result.details.confidenceScore !== undefined) {
        console.log(`   Confidence Score: ${result.details.confidenceScore}`);
      }
    });

    // Summary by trigger behavior
    const triggeredTests = this.results.filter(r => r.details.geminiTriggered);
    const skippedTests = this.results.filter(r => !r.details.geminiTriggered);
    
    console.log('\n📈 [GEMINI_VERIFICATION_FINAL] Trigger Analysis:');
    console.log(`   Gemini Triggered: ${triggeredTests.length} tests`);
    console.log(`   Gemini Skipped: ${skippedTests.length} tests`);
    
    if (triggeredTests.length > 0) {
      console.log('   Triggered Tests:', triggeredTests.map(t => t.brand).join(', '));
    }
    if (skippedTests.length > 0) {
      console.log('   Skipped Tests:', skippedTests.map(t => t.brand).join(', '));
    }
  }
}

// Run the test suite
async function runGeminiVerificationFinalTests() {
  const testSuite = new GeminiVerificationFinalTestSuite();
  await testSuite.runTests();
}

export { GeminiVerificationFinalTestSuite, runGeminiVerificationFinalTests };

// Run if called directly
if (require.main === module) {
  runGeminiVerificationFinalTests().catch(console.error);
}
