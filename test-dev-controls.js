#!/usr/bin/env node

/**
 * 🧪 DEVELOPER TEST CONTROLS FOR OWNEDBY
 * 
 * This utility provides programmatic controls to simulate various
 * failure modes and edge cases for comprehensive testing.
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test control configurations
const TEST_CONTROLS = {
  ocr: {
    forceFailure: false,
    confidenceThreshold: 0.7,
    simulateAmbiguity: false
  },
  vision: {
    forceFailure: false,
    timeout: 30000,
    useClaudeVision: true
  },
  agents: {
    forceAgentFailure: false,
    simulateRateLimits: false,
    confidenceThreshold: 0.6
  },
  apis: {
    serperDisabled: false,
    openCorporatesDisabled: false,
    googleSheetsDisabled: false
  },
  cache: {
    disabled: false,
    clearOnStart: false
  }
};

/**
 * Simulate different failure modes
 */
class TestController {
  constructor() {
    this.activeControls = { ...TEST_CONTROLS };
  }

  async simulateOCRFailure(enabled = true) {
    this.activeControls.ocr.forceFailure = enabled;
    console.log(`🔧 OCR failure simulation: ${enabled ? 'ON' : 'OFF'}`);
    return this.updateTestMode();
  }

  async simulateVisionFailure(enabled = true) {
    this.activeControls.vision.forceFailure = enabled;
    console.log(`🔧 Vision failure simulation: ${enabled ? 'ON' : 'OFF'}`);
    return this.updateTestMode();
  }

  async simulateAgentFailure(enabled = true) {
    this.activeControls.agents.forceAgentFailure = enabled;
    console.log(`🔧 Agent failure simulation: ${enabled ? 'ON' : 'OFF'}`);
    return this.updateTestMode();
  }

  async simulateRateLimits(enabled = true) {
    this.activeControls.agents.simulateRateLimits = enabled;
    console.log(`🔧 Rate limit simulation: ${enabled ? 'ON' : 'OFF'}`);
    return this.updateTestMode();
  }

  async disableAPI(apiName, disabled = true) {
    if (!this.activeControls.apis.hasOwnProperty(`${apiName}Disabled`)) {
      throw new Error(`Unknown API: ${apiName}`);
    }
    
    this.activeControls.apis[`${apiName}Disabled`] = disabled;
    console.log(`🔧 ${apiName} API: ${disabled ? 'DISABLED' : 'ENABLED'}`);
    return this.updateTestMode();
  }

  async setConfidenceThreshold(component, threshold) {
    if (this.activeControls[component]) {
      this.activeControls[component].confidenceThreshold = threshold;
      console.log(`🔧 ${component} confidence threshold: ${threshold}`);
      return this.updateTestMode();
    }
    throw new Error(`Unknown component: ${component}`);
  }

  async disableCache(disabled = true) {
    this.activeControls.cache.disabled = disabled;
    console.log(`🔧 Cache: ${disabled ? 'DISABLED' : 'ENABLED'}`);
    return this.updateTestMode();
  }

  async updateTestMode() {
    try {
      const response = await fetch(`${BASE_URL}/api/test-controls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.activeControls)
      });

      if (response.status === 404) {
        console.warn('⚠️  Test controls endpoint not available - controls will only apply to direct API calls');
        return false;
      }

      if (!response.ok) {
        throw new Error(`Failed to update test controls: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.warn(`⚠️  Could not update server test controls: ${error.message}`);
      return false;
    }
  }

  async reset() {
    this.activeControls = { ...TEST_CONTROLS };
    console.log('🔄 Reset all test controls to default');
    return this.updateTestMode();
  }

  getStatus() {
    return {
      ...this.activeControls,
      timestamp: new Date().toISOString()
    };
  }

  async runScenario(scenarioName) {
    console.log(`\n🎬 Running test scenario: ${scenarioName}`);
    
    switch (scenarioName) {
      case 'complete_failure':
        await this.simulateOCRFailure(true);
        await this.simulateVisionFailure(true);
        await this.simulateAgentFailure(true);
        break;
        
      case 'api_outage':
        await this.disableAPI('serper', true);
        await this.disableAPI('openCorporates', true);
        break;
        
      case 'low_confidence':
        await this.setConfidenceThreshold('ocr', 0.3);
        await this.setConfidenceThreshold('agents', 0.3);
        break;
        
      case 'cache_miss':
        await this.disableCache(true);
        break;
        
      case 'vision_only':
        await this.simulateOCRFailure(true);
        await this.simulateVisionFailure(false);
        break;
        
      case 'manual_only':
        await this.simulateOCRFailure(true);
        await this.simulateVisionFailure(true);
        break;
        
      default:
        throw new Error(`Unknown scenario: ${scenarioName}`);
    }
    
    console.log(`✅ Scenario '${scenarioName}' configured`);
  }
}

/**
 * Pre-defined test scenarios
 */
const PREDEFINED_SCENARIOS = {
  'complete_failure': 'All automated systems fail → Manual entry required',
  'api_outage': 'External APIs unavailable → Fallback to local data',
  'low_confidence': 'All systems return low confidence → User verification',
  'cache_miss': 'No cached data available → Full research pipeline',
  'vision_only': 'OCR fails → Vision agent success',
  'manual_only': 'All automated extraction fails → Manual entry'
};

/**
 * Interactive CLI interface
 */
async function runInteractiveCLI() {
  const controller = new TestController();
  
  console.log('🧪 OWNEDBY TEST CONTROL DASHBOARD');
  console.log('================================\n');
  
  console.log('Available commands:');
  console.log('  scenario <name>  - Run predefined scenario');
  console.log('  ocr <on|off>     - Toggle OCR failure simulation');
  console.log('  vision <on|off>  - Toggle Vision failure simulation');
  console.log('  agent <on|off>   - Toggle Agent failure simulation');
  console.log('  api <name> <on|off> - Toggle API availability');
  console.log('  cache <on|off>   - Toggle cache availability');
  console.log('  confidence <component> <0.0-1.0> - Set confidence threshold');
  console.log('  status           - Show current control status');
  console.log('  reset            - Reset all controls');
  console.log('  scenarios        - List available scenarios');
  console.log('  exit             - Exit control dashboard\n');
  
  // Basic CLI simulation (in real implementation, use readline)
  console.log('💡 Example usage:');
  console.log('  await controller.runScenario("complete_failure")');
  console.log('  await controller.simulateOCRFailure(true)');
  console.log('  await controller.setConfidenceThreshold("ocr", 0.3)');
  
  return controller;
}

/**
 * Batch test runner for multiple scenarios
 */
async function runBatchTests(scenarios = Object.keys(PREDEFINED_SCENARIOS)) {
  const controller = new TestController();
  const results = [];
  
  console.log(`🚀 Running batch tests for ${scenarios.length} scenarios\n`);
  
  for (const scenario of scenarios) {
    try {
      console.log(`\n📋 Testing scenario: ${scenario}`);
      console.log(`   Description: ${PREDEFINED_SCENARIOS[scenario]}`);
      
      // Reset controls
      await controller.reset();
      
      // Configure scenario
      await controller.runScenario(scenario);
      
      // Run a test lookup
      const testResult = await fetch(`${BASE_URL}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: 'TestBrand',
          product: 'Test Product',
          test_mode: true,
          scenario: scenario
        })
      });
      
      const result = await testResult.json();
      
      results.push({
        scenario,
        status: testResult.ok ? 'SUCCESS' : 'FAILED',
        result_type: result.result_type,
        confidence: result.confidence_score,
        error: result.error
      });
      
      console.log(`   ✅ Completed: ${result.result_type} (confidence: ${result.confidence_score})`);
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.push({
        scenario,
        status: 'ERROR',
        error: error.message
      });
    }
  }
  
  // Reset controls after testing
  await controller.reset();
  
  // Print summary
  console.log('\n📊 BATCH TEST RESULTS');
  console.log('=====================');
  results.forEach(result => {
    const status = result.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${status} ${result.scenario}: ${result.result_type || 'ERROR'}`);
    if (result.error) {
      console.log(`   └─ ${result.error}`);
    }
  });
  
  return results;
}

// Export for use in other test files
export { TestController, PREDEFINED_SCENARIOS, runBatchTests };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'batch') {
    const scenarios = args.slice(1).length > 0 ? args.slice(1) : undefined;
    runBatchTests(scenarios).catch(console.error);
  } else {
    runInteractiveCLI().then(controller => {
      console.log('\n🎮 Test controller ready. Use the exported methods to control test scenarios.');
      console.log('Example: controller.runScenario("complete_failure")');
    }).catch(console.error);
  }
} 