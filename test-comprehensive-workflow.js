const { execSync } = require('child_process');

// Use dynamic import for node-fetch since it's an ES module
let fetch, FormData, Blob;

async function initializeFetch() {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default;
  FormData = nodeFetch.FormData;
  Blob = nodeFetch.Blob;
}

/**
 * Comprehensive Workflow Test Suite
 * Tests the complete ownership research pipeline we agreed upon
 */

class WorkflowTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async test(description, testFn) {
    this.log(`Testing: ${description}`, 'info');
    try {
      await testFn();
      this.testResults.passed++;
      this.testResults.tests.push({ description, status: 'PASSED' });
      this.log(`PASSED: ${description}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({ description, status: 'FAILED', error: error.message });
      this.log(`FAILED: ${description} - ${error.message}`, 'error');
    }
  }

  async checkServerHealth() {
    const response = await fetch(`${this.baseUrl}/`);
    if (!response.ok) {
      throw new Error(`Server not responding: ${response.status}`);
    }
    return response;
  }

  async testBarcodeWorkflow() {
    // Test with a known barcode
    const testBarcode = '7318690499534'; // ICA Tonfisk
    
    const response = await fetch(`${this.baseUrl}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: testBarcode })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Validate response structure
    if (!result.success) {
      throw new Error(`Lookup failed: ${result.error}`);
    }

    // Check required fields
    const requiredFields = ['product_name', 'brand', 'confidence_score', 'result_type'];
    for (const field of requiredFields) {
      if (result[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate confidence score
    if (typeof result.confidence_score !== 'number' || result.confidence_score < 0 || result.confidence_score > 100) {
      throw new Error(`Invalid confidence score: ${result.confidence_score}`);
    }

    return result;
  }

  async testImageRecognitionAPI() {
    // Create a dummy image file for testing
    const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    const blob = new Blob([testImageData], { type: 'image/png' });
    formData.append('image', blob, 'test.png');

    const response = await fetch(`${this.baseUrl}/api/image-recognition`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Image recognition API failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Should have expected structure even if recognition fails
    if (typeof result.success !== 'boolean') {
      throw new Error('Image recognition response missing success field');
    }

    return result;
  }

  async testProgressTracking() {
    const response = await fetch(`${this.baseUrl}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test', queryId: 'test_query_123' })
    });

    if (!response.ok) {
      throw new Error(`Progress API failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  async testDashboardAPI() {
    const response = await fetch(`${this.baseUrl}/api/dashboard/stats`);
    
    if (!response.ok) {
      throw new Error(`Dashboard stats API failed: ${response.status}`);
    }

    const stats = await response.json();
    
    // Validate stats structure - it returns nested products.total
    if (!stats.products || typeof stats.products.total !== 'number') {
      throw new Error('Dashboard stats missing products.total');
    }

    return stats;
  }

  async testOwnershipResearchFlow() {
    // Test the complete ownership research flow with a barcode
    const testData = {
      barcode: 'test_barcode_123',
      product_name: 'Test Product', 
      brand: 'Test Brand'
    };

    const response = await fetch(`${this.baseUrl}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`Ownership research API failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Check that research was attempted or properly handled
    if (!result.result_type && !result.requires_manual_entry) {
      throw new Error('Missing result_type or manual entry flag');
    }

    // Validate trace logging if present
    if (result.agent_execution_trace) {
      const trace = result.agent_execution_trace;
      if (!trace.stages || !Array.isArray(trace.stages)) {
        throw new Error('Invalid agent execution trace structure');
      }
    }

    return result;
  }

  async testFallbackHandling() {
    // Test with no barcode to trigger fallback (should return 400 as expected)
    const testData = {
      product_name: '',
      brand: ''
    };

    const response = await fetch(`${this.baseUrl}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    // 400 is expected here since barcode is required
    if (response.status !== 400) {
      throw new Error(`Expected 400 for missing barcode, got ${response.status}`);
    }

    const result = await response.json();
    
    // Should return proper error message
    if (!result.error || !result.error.includes('required')) {
      throw new Error('Should return proper error message for missing barcode');
    }

    return result;
  }

  async testConfidenceScoring() {
    // Test that confidence scoring works properly
    const result = await this.testBarcodeWorkflow();
    
    // Confidence should be properly calculated
    if (typeof result.confidence_score !== 'number') {
      throw new Error('Confidence score should be a number');
    }

    if (result.confidence_score < 0 || result.confidence_score > 100) {
      throw new Error('Confidence score should be between 0-100');
    }

    // Check confidence attribution if present
    if (result.confidence_attribution) {
      const attribution = result.confidence_attribution;
      if (!attribution.base_confidence || !attribution.factors) {
        throw new Error('Invalid confidence attribution structure');
      }
    }

    return result;
  }

  async testAgentSystemIntegration() {
    // Test that our agent systems are properly integrated
    const testBarcode = '7318690499534';
    
    const response = await fetch(`${this.baseUrl}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: testBarcode })
    });

    const result = await response.json();
    
    // Should have agent results if research was performed
    if (result.agent_results) {
      const agentResults = result.agent_results;
      
      // Check for expected agent components
      const expectedAgents = ['query_builder', 'web_research', 'ownership_analysis'];
      for (const agent of expectedAgents) {
        if (agentResults[agent] && typeof agentResults[agent].success !== 'boolean') {
          throw new Error(`Invalid ${agent} agent result structure`);
        }
      }
    }

    return result;
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Workflow Tests', 'info');
    this.log(`Testing against: ${this.baseUrl}`, 'info');

    // Basic connectivity
    await this.test('Server Health Check', () => this.checkServerHealth());
    
    // API endpoints
    await this.test('Barcode Lookup Workflow', () => this.testBarcodeWorkflow());
    await this.test('Image Recognition API', () => this.testImageRecognitionAPI());
    await this.test('Progress Tracking API', () => this.testProgressTracking());
    await this.test('Dashboard API', () => this.testDashboardAPI());
    
    // Core workflows
    await this.test('Ownership Research Flow', () => this.testOwnershipResearchFlow());
    await this.test('Fallback Handling', () => this.testFallbackHandling());
    await this.test('Confidence Scoring', () => this.testConfidenceScoring());
    await this.test('Agent System Integration', () => this.testAgentSystemIntegration());

    // Report results
    this.log('📊 Test Results Summary', 'info');
    this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
    this.log(`❌ Failed: ${this.testResults.failed}`, 'error');
    this.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`, 'info');

    if (this.testResults.failed > 0) {
      this.log('📋 Failed Tests:', 'warning');
      this.testResults.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          this.log(`   - ${test.description}: ${test.error}`, 'error');
        });
    }

    return this.testResults;
  }
}

// Main execution
async function main() {
  // Initialize fetch first
  await initializeFetch();
  
  const tester = new WorkflowTester();
  
  try {
    await tester.runAllTests();
    process.exit(tester.testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite failed to run:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { WorkflowTester }; 