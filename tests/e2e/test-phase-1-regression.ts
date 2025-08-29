import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface TestResult {
  testCase: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  details: {
    agentsTriggered: string[];
    cacheState: 'MISS' | 'HIT' | 'N/A';
    featureFlags: Record<string, boolean>;
    result: any;
    error?: string;
  };
}

interface TestSuite {
  name: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
}

/**
 * Phase 1 Regression Test Suite
 * Tests all critical pipeline functionality with proper cache management
 */
class Phase1RegressionTestSuite {
  private baseUrl: string;
  private testResults: TestResult[] = [];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log(`[TEST_SUITE] Initializing Phase 1 Regression Tests`);
    console.log(`[TEST_SUITE] Base URL: ${this.baseUrl}`);
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
      console.log(`[CACHE_FLUSH] Summary:`, JSON.stringify(result, null, 2));
      
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
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[API_REQUEST] ❌ Failed in ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Test Case A: Brand with Known Single Owner (LLM + Gemini Confirmed)
   */
  private async testCaseA(): Promise<TestResult> {
    const testCase = 'A. Brand with Known Single Owner (Therabreath)';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_CASE_A] Starting: ${testCase}`);
      
      // Flush cache to ensure clean test
      await this.flushCache(['therabreath']);
      
      // Make API request
      const result = await this.lookupProduct('Therabreath', 'Mouthwash');
      
      const duration = performance.now() - startTime;
      
      // Analyze result
      const agentsTriggered = Object.keys(result.agent_results || {});
      const hasGeminiAnalysis = result.agent_results?.gemini_analysis?.success === true;
      const hasLLMAnalysis = result.agent_results?.llm_first_analysis?.success === true;
      const cacheState = result.cache_hit ? 'HIT' : 'MISS';
      
      // Assertions
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Correct Owner', condition: result.financial_beneficiary === 'Church & Dwight Co., Inc.' },
        { name: 'LLM Analysis', condition: hasLLMAnalysis },
        { name: 'High Confidence', condition: result.confidence_score >= 90 },
        { name: 'Narrative Generated', condition: !!result.headline && !!result.story }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_CASE_A] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_CASE_A] ✅ All assertions passed`);
      }

      return {
        testCase,
        status,
        duration,
        details: {
          agentsTriggered,
          cacheState,
          featureFlags: {
            ENABLE_GEMINI_OWNERSHIP_AGENT: process.env.ENABLE_GEMINI_OWNERSHIP_AGENT === 'true',
            ENABLE_DISAMBIGUATION_AGENT: process.env.ENABLE_DISAMBIGUATION_AGENT === 'true'
          },
          result: {
            success: result.success,
            beneficiary: result.financial_beneficiary,
            confidence: result.confidence_score,
            hasGeminiAnalysis,
            hasLLMAnalysis
          },
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_CASE_A] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          agentsTriggered: [],
          cacheState: 'N/A',
          featureFlags: {},
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Test Case B: Ambiguous Brand (Triggers Disambiguation)
   */
  private async testCaseB(): Promise<TestResult> {
    const testCase = 'B. Ambiguous Brand (Jordan - No Product)';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_CASE_B] Starting: ${testCase}`);
      
      // Flush cache to ensure clean test
      await this.flushCache(['jordan']);
      
      // Make API request (no product to trigger disambiguation)
      const result = await this.lookupProduct('Jordan');
      
      const duration = performance.now() - startTime;
      
      // Analyze result
      const agentsTriggered = Object.keys(result.agent_results || {});
      const disambiguationTriggered = result.agent_results?.web_research?.data?.disambiguation_triggered === true;
      const disambiguationOptions = result.agent_results?.web_research?.data?.disambiguation_options || [];
      const cacheState = result.cache_hit ? 'HIT' : 'MISS';
      
      // Assertions
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Disambiguation Triggered', condition: disambiguationTriggered },
        { name: 'Multiple Options', condition: disambiguationOptions.length >= 2 },
        { name: 'Nike Option Present', condition: disambiguationOptions.some((opt: any) => opt.company === 'Nike, Inc.') },
        { name: 'Colgate Option Present', condition: disambiguationOptions.some((opt: any) => opt.company === 'Colgate-Palmolive Company') }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_CASE_B] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_CASE_B] ✅ All assertions passed`);
      }

      return {
        testCase,
        status,
        duration,
        details: {
          agentsTriggered,
          cacheState,
          featureFlags: {
            ENABLE_GEMINI_OWNERSHIP_AGENT: process.env.ENABLE_GEMINI_OWNERSHIP_AGENT === 'true',
            ENABLE_DISAMBIGUATION_AGENT: process.env.ENABLE_DISAMBIGUATION_AGENT === 'true'
          },
          result: {
            success: result.success,
            disambiguationTriggered,
            optionsCount: disambiguationOptions.length,
            options: disambiguationOptions.map((opt: any) => ({ name: opt.name, company: opt.company }))
          },
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_CASE_B] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          agentsTriggered: [],
          cacheState: 'N/A',
          featureFlags: {},
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Test Case C: Brand with Misspelled Input
   */
  private async testCaseC(): Promise<TestResult> {
    const testCase = 'C. Brand with Misspelled Input (Nescafe → Nescafé)';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_CASE_C] Starting: ${testCase}`);
      
      // Flush cache to ensure clean test
      await this.flushCache(['nescafe', 'nescafé']);
      
      // Make API request with misspelled brand
      const result = await this.lookupProduct('Nescafe', 'Coffee');
      
      const duration = performance.now() - startTime;
      
      // Analyze result
      const agentsTriggered = Object.keys(result.agent_results || {});
      const cacheState = result.cache_hit ? 'HIT' : 'MISS';
      
      // Assertions
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Correct Owner', condition: result.financial_beneficiary === 'Nestlé S.A.' },
        { name: 'High Confidence', condition: result.confidence_score >= 80 },
        { name: 'Narrative Generated', condition: !!result.headline && !!result.story }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_CASE_C] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_CASE_C] ✅ All assertions passed`);
      }

      return {
        testCase,
        status,
        duration,
        details: {
          agentsTriggered,
          cacheState,
          featureFlags: {
            ENABLE_GEMINI_OWNERSHIP_AGENT: process.env.ENABLE_GEMINI_OWNERSHIP_AGENT === 'true',
            ENABLE_DISAMBIGUATION_AGENT: process.env.ENABLE_DISAMBIGUATION_AGENT === 'true'
          },
          result: {
            success: result.success,
            beneficiary: result.financial_beneficiary,
            confidence: result.confidence_score,
            brand: result.brand
          },
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_CASE_C] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          agentsTriggered: [],
          cacheState: 'N/A',
          featureFlags: {},
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Test Case D: Cache Hit vs Miss
   */
  private async testCaseD(): Promise<TestResult> {
    const testCase = 'D. Cache Hit vs Miss Performance';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_CASE_D] Starting: ${testCase}`);
      
      // Flush cache to ensure clean test (flush all to be safe)
      await this.flushCache();
      
      // First request (should be cache miss)
      console.log(`[TEST_CASE_D] First request (expected cache miss)...`);
      const firstRequestStart = performance.now();
      const firstResult = await this.lookupProduct('Apple', 'iPhone');
      const firstRequestDuration = performance.now() - firstRequestStart;
      
      // Second request (should be cache hit)
      console.log(`[TEST_CASE_D] Second request (expected cache hit)...`);
      const secondRequestStart = performance.now();
      const secondResult = await this.lookupProduct('Apple', 'iPhone');
      const secondRequestDuration = performance.now() - secondRequestStart;
      
      const duration = performance.now() - startTime;
      
      // Analyze results
      const firstCacheState = firstResult.cache_hit ? 'HIT' : 'MISS';
      const secondCacheState = secondResult.cache_hit ? 'HIT' : 'MISS';
      
      // Assertions
      const assertions = [
        { name: 'First Request Success', condition: firstResult.success === true },
        { name: 'Second Request Success', condition: secondResult.success === true },
        { name: 'First Request Cache Miss', condition: firstCacheState === 'MISS' },
        { name: 'Second Request Cache Hit', condition: secondCacheState === 'HIT' },
        { name: 'Cache Hit Faster', condition: secondRequestDuration < firstRequestDuration },
        { name: 'Consistent Results', condition: firstResult.financial_beneficiary === secondResult.financial_beneficiary }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_CASE_D] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_CASE_D] ✅ All assertions passed`);
      }

      return {
        testCase,
        status,
        duration,
        details: {
          agentsTriggered: Object.keys(firstResult.agent_results || {}),
          cacheState: `${firstCacheState} → ${secondCacheState}`,
          featureFlags: {
            ENABLE_GEMINI_OWNERSHIP_AGENT: process.env.ENABLE_GEMINI_OWNERSHIP_AGENT === 'true',
            ENABLE_DISAMBIGUATION_AGENT: process.env.ENABLE_DISAMBIGUATION_AGENT === 'true'
          },
          result: {
            firstRequest: {
              duration: firstRequestDuration,
              cacheState: firstCacheState,
              beneficiary: firstResult.financial_beneficiary
            },
            secondRequest: {
              duration: secondRequestDuration,
              cacheState: secondCacheState,
              beneficiary: secondResult.financial_beneficiary
            },
            performanceImprovement: ((firstRequestDuration - secondRequestDuration) / firstRequestDuration * 100).toFixed(1) + '%'
          },
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_CASE_D] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          agentsTriggered: [],
          cacheState: 'N/A',
          featureFlags: {},
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Test Case E: Feature Flag Checks
   */
  private async testCaseE(): Promise<TestResult> {
    const testCase = 'E. Feature Flag Enforcement';
    const startTime = performance.now();
    
    try {
      console.log(`\n[TEST_CASE_E] Starting: ${testCase}`);
      
      // Flush cache to ensure clean test
      await this.flushCache(['jordan']);
      
      // Test with current feature flag settings
      const result = await this.lookupProduct('Jordan', 'Athletic Shoes');
      
      const duration = performance.now() - startTime;
      
      // Analyze result
      const agentsTriggered = Object.keys(result.agent_results || {});
      const hasGeminiAnalysis = !!result.agent_results?.gemini_analysis;
      const hasDisambiguation = result.agent_results?.web_research?.data?.disambiguation_triggered === true;
      const cacheState = result.cache_hit ? 'HIT' : 'MISS';
      
      const geminiEnabled = process.env.ENABLE_GEMINI_OWNERSHIP_AGENT === 'true';
      const disambiguationEnabled = process.env.ENABLE_DISAMBIGUATION_AGENT === 'true';
      
      // Assertions based on current feature flag settings
      const assertions = [
        { name: 'API Success', condition: result.success === true },
        { name: 'Gemini Flag Compliance', condition: geminiEnabled ? hasGeminiAnalysis : !hasGeminiAnalysis },
        { name: 'Disambiguation Flag Compliance', condition: disambiguationEnabled ? hasDisambiguation : !hasDisambiguation }
      ];

      const failedAssertions = assertions.filter(a => !a.condition);
      const status = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
      
      if (status === 'FAIL') {
        console.log(`[TEST_CASE_E] ❌ Failed assertions:`, failedAssertions.map(a => a.name));
      } else {
        console.log(`[TEST_CASE_E] ✅ All assertions passed`);
      }

      return {
        testCase,
        status,
        duration,
        details: {
          agentsTriggered,
          cacheState,
          featureFlags: {
            ENABLE_GEMINI_OWNERSHIP_AGENT: geminiEnabled,
            ENABLE_DISAMBIGUATION_AGENT: disambiguationEnabled
          },
          result: {
            success: result.success,
            geminiEnabled,
            geminiTriggered: hasGeminiAnalysis,
            disambiguationEnabled,
            disambiguationTriggered: hasDisambiguation,
            flagCompliance: {
              gemini: geminiEnabled ? hasGeminiAnalysis : !hasGeminiAnalysis,
              disambiguation: disambiguationEnabled ? hasDisambiguation : !hasDisambiguation
            }
          },
          error: failedAssertions.length > 0 ? `Failed: ${failedAssertions.map(a => a.name).join(', ')}` : undefined
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[TEST_CASE_E] ❌ Error:`, error);
      
      return {
        testCase,
        status: 'FAIL',
        duration,
        details: {
          agentsTriggered: [],
          cacheState: 'N/A',
          featureFlags: {},
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Run all test cases
   */
  public async runAllTests(): Promise<TestSuite> {
    const suiteStartTime = performance.now();
    
    console.log(`\n🚀 [TEST_SUITE] Starting Phase 1 Regression Test Suite`);
    console.log(`[TEST_SUITE] Environment: ${process.env.NODE_ENV}`);
    console.log(`[TEST_SUITE] Feature Flags:`, {
      ENABLE_GEMINI_OWNERSHIP_AGENT: process.env.ENABLE_GEMINI_OWNERSHIP_AGENT === 'true',
      ENABLE_DISAMBIGUATION_AGENT: process.env.ENABLE_DISAMBIGUATION_AGENT === 'true'
    });

    // Run all test cases
    const testCases = [
      () => this.testCaseA(),
      () => this.testCaseB(),
      () => this.testCaseC(),
      () => this.testCaseD(),
      () => this.testCaseE()
    ];

    for (const testCase of testCases) {
      try {
        const result = await testCase();
        this.testResults.push(result);
      } catch (error) {
        console.error(`[TEST_SUITE] Test case failed with error:`, error);
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

    console.log(`\n📊 [TEST_SUITE] Test Suite Complete`);
    console.log(`[TEST_SUITE] Summary:`, summary);

    return {
      name: 'Phase 1 Regression Test Suite',
      results: this.testResults,
      summary
    };
  }

  /**
   * Generate markdown report
   */
  public generateMarkdownReport(suite: TestSuite): string {
    const timestamp = new Date().toISOString();
    
    let markdown = `# Phase 1 Regression Test Report\n\n`;
    markdown += `**Generated:** ${timestamp}\n`;
    markdown += `**Environment:** ${process.env.NODE_ENV}\n\n`;
    
    // Summary
    markdown += `## 📊 Test Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Tests | ${suite.summary.total} |\n`;
    markdown += `| ✅ Passed | ${suite.summary.passed} |\n`;
    markdown += `| ❌ Failed | ${suite.summary.failed} |\n`;
    markdown += `| ⏭️ Skipped | ${suite.summary.skipped} |\n`;
    markdown += `| ⏱️ Duration | ${suite.summary.duration.toFixed(2)}ms |\n\n`;
    
    // Feature Flags
    markdown += `## 🔧 Feature Flags\n\n`;
    markdown += `| Flag | Value |\n`;
    markdown += `|------|-------|\n`;
    markdown += `| ENABLE_GEMINI_OWNERSHIP_AGENT | ${process.env.ENABLE_GEMINI_OWNERSHIP_AGENT === 'true' ? '✅ true' : '❌ false'} |\n`;
    markdown += `| ENABLE_DISAMBIGUATION_AGENT | ${process.env.ENABLE_DISAMBIGUATION_AGENT === 'true' ? '✅ true' : '❌ false'} |\n\n`;
    
    // Test Results
    markdown += `## 🧪 Test Results\n\n`;
    
    for (const result of suite.results) {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      markdown += `### ${statusIcon} ${result.testCase}\n\n`;
      markdown += `**Status:** ${result.status}\n`;
      markdown += `**Duration:** ${result.duration.toFixed(2)}ms\n`;
      markdown += `**Cache State:** ${result.details.cacheState}\n`;
      markdown += `**Agents Triggered:** ${result.details.agentsTriggered.join(', ') || 'None'}\n\n`;
      
      if (result.details.error) {
        markdown += `**Error:** ${result.details.error}\n\n`;
      }
      
      markdown += `**Result Details:**\n`;
      markdown += `\`\`\`json\n${JSON.stringify(result.details.result, null, 2)}\n\`\`\`\n\n`;
    }
    
    return markdown;
  }
}

/**
 * Main execution function
 */
async function runPhase1RegressionTests() {
  try {
    const testSuite = new Phase1RegressionTestSuite();
    const results = await testSuite.runAllTests();
    
    // Generate and save markdown report
    const markdownReport = testSuite.generateMarkdownReport(results);
    
    // Save report to file
    const fs = await import('fs');
    const path = await import('path');
    
    const reportsDir = path.join(process.cwd(), 'tests', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = path.join(reportsDir, 'phase-1-validation.md');
    fs.writeFileSync(reportPath, markdownReport);
    
    console.log(`\n📄 [TEST_SUITE] Report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    const exitCode = results.summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
    
  } catch (error) {
    console.error(`[TEST_SUITE] Fatal error:`, error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPhase1RegressionTests();
}

export { Phase1RegressionTestSuite, runPhase1RegressionTests };
