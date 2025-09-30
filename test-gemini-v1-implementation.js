#!/usr/bin/env node

/**
 * Test script for Gemini v1 endpoint implementation
 * Tests the feature flag, model configuration, and endpoint selection
 */

const https = require('https');

const PRODUCTION_URL = 'https://ownedby.app';
const LOCAL_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  production: {
    url: PRODUCTION_URL,
    authToken: process.env.DEBUG_AUTH_TOKEN || 'test-token'
  },
  local: {
    url: LOCAL_URL,
    authToken: process.env.DEBUG_AUTH_TOKEN || 'test-token'
  }
};

class GeminiV1Tester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runTests() {
    console.log('🚀 Starting Gemini v1 Implementation Tests\n');
    
    // Test both local and production if available
    const environments = ['local', 'production'];
    
    for (const env of environments) {
      console.log(`\n📡 Testing ${env.toUpperCase()} environment...`);
      await this.testEnvironment(env);
    }
    
    this.printSummary();
  }

  async testEnvironment(environment) {
    const config = TEST_CONFIG[environment];
    
    try {
      // Test 1: Debug Gemini route (includes v1 test)
      console.log(`  🔍 Testing /debug/gemini route...`);
      const debugResult = await this.testDebugRoute(config);
      
      // Test 2: Direct v1 endpoint test
      console.log(`  🧪 Testing /api/test-gemini-v1 route...`);
      const v1Result = await this.testV1Endpoint(config);
      
      // Test 3: Regular lookup with v1 (if available)
      console.log(`  🔬 Testing regular lookup with v1...`);
      const lookupResult = await this.testLookupWithV1(config);
      
      this.results.push({
        environment,
        debugRoute: debugResult,
        v1Endpoint: v1Result,
        lookupWithV1: lookupResult,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`  ❌ Error testing ${environment}:`, error.message);
      this.results.push({
        environment,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async testDebugRoute(config) {
    return new Promise((resolve) => {
      const options = {
        hostname: this.getHostname(config.url),
        port: this.getPort(config.url),
        path: '/debug/gemini',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.authToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`    ✅ Debug route response:`, {
              success: result.success,
              v1EndpointTest: result.v1EndpointTest?.success,
              geminiFlashV1Enabled: result.environment?.geminiFlashV1Enabled,
              totalTests: result.summary?.totalTests,
              passedTests: result.summary?.passedTests
            });
            resolve({
              success: result.success,
              v1EndpointWorking: result.v1EndpointTest?.success,
              featureFlagEnabled: result.environment?.geminiFlashV1Enabled,
              fallbackSystemWorking: result.summary?.geminiFallbackSystem?.working
            });
          } catch (parseError) {
            console.log(`    ❌ Parse error:`, parseError.message);
            resolve({ success: false, error: parseError.message });
          }
        });
      });

      req.on('error', (error) => {
        console.log(`    ❌ Request error:`, error.message);
        resolve({ success: false, error: error.message });
      });

      req.setTimeout(30000, () => {
        console.log(`    ⏰ Request timeout`);
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });

      req.end();
    });
  }

  async testV1Endpoint(config) {
    return new Promise((resolve) => {
      const options = {
        hostname: this.getHostname(config.url),
        port: this.getPort(config.url),
        path: '/api/test-gemini-v1',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`    ✅ V1 endpoint response:`, {
              success: result.success,
              model: result.test_result?.model,
              endpoint: result.test_result?.endpoint,
              featureFlagEnabled: result.test_result?.featureFlagEnabled
            });
            resolve({
              success: result.success,
              model: result.test_result?.model,
              endpoint: result.test_result?.endpoint,
              featureFlagEnabled: result.test_result?.featureFlagEnabled,
              validTestPassed: result.test_result?.validTestPassed
            });
          } catch (parseError) {
            console.log(`    ❌ Parse error:`, parseError.message);
            resolve({ success: false, error: parseError.message });
          }
        });
      });

      req.on('error', (error) => {
        console.log(`    ❌ Request error:`, error.message);
        resolve({ success: false, error: error.message });
      });

      req.setTimeout(30000, () => {
        console.log(`    ⏰ Request timeout`);
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });

      req.end();
    });
  }

  async testLookupWithV1(config) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        brand: 'Coca-Cola',
        product_name: 'Coca-Cola Classic'
      });

      const options = {
        hostname: this.getHostname(config.url),
        port: this.getPort(config.url),
        path: '/api/lookup',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`    ✅ Lookup response:`, {
              success: result.success,
              verificationMethod: result.verification_method,
              llmSource: result.llm_source,
              hasGeminiAnalysis: !!result.gemini_evidence_analysis
            });
            resolve({
              success: result.success,
              verificationMethod: result.verification_method,
              llmSource: result.llm_source,
              hasGeminiAnalysis: !!result.gemini_evidence_analysis
            });
          } catch (parseError) {
            console.log(`    ❌ Parse error:`, parseError.message);
            resolve({ success: false, error: parseError.message });
          }
        });
      });

      req.on('error', (error) => {
        console.log(`    ❌ Request error:`, error.message);
        resolve({ success: false, error: error.message });
      });

      req.setTimeout(30000, () => {
        console.log(`    ⏰ Request timeout`);
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });

      req.write(postData);
      req.end();
    });
  }

  getHostname(url) {
    return new URL(url).hostname;
  }

  getPort(url) {
    const port = new URL(url).port;
    return port ? parseInt(port) : (url.startsWith('https') ? 443 : 80);
  }

  printSummary() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total Duration: ${duration}ms`);
    console.log(`Environments Tested: ${this.results.length}`);
    
    this.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.environment.toUpperCase()}:`);
      
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      } else {
        console.log(`   Debug Route: ${result.debugRoute?.success ? '✅' : '❌'}`);
        console.log(`   V1 Endpoint: ${result.v1Endpoint?.success ? '✅' : '❌'}`);
        console.log(`   Lookup with V1: ${result.lookupWithV1?.success ? '✅' : '❌'}`);
        
        if (result.debugRoute?.featureFlagEnabled) {
          console.log(`   🚩 Feature Flag: ENABLED`);
        } else {
          console.log(`   🚩 Feature Flag: DISABLED`);
        }
        
        if (result.v1Endpoint?.model) {
          console.log(`   🤖 Model: ${result.v1Endpoint.model}`);
        }
        
        if (result.v1Endpoint?.endpoint) {
          console.log(`   🔗 Endpoint: ${result.v1Endpoint.endpoint}`);
        }
      }
    });
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. Set GEMINI_FLASH_V1_ENABLED=true in environment variables');
    console.log('2. Verify Gemini API key is present and valid');
    console.log('3. Test with /debug/gemini route to verify full system');
    console.log('4. Monitor logs for [GEMINI_CONFIG] and [GEMINI_DEBUG] messages');
  }
}

// Run the tests
if (require.main === module) {
  const tester = new GeminiV1Tester();
  tester.runTests().catch(console.error);
}

module.exports = GeminiV1Tester;
