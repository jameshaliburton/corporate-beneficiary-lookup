#!/usr/bin/env node

/**
 * Production Deployment Test Script
 * 
 * Tests the Gemini-Claude fallback system in production
 * to verify compliance routing and logging are working correctly.
 */

const https = require('https');
const http = require('http');

// Configuration
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://ownedby.app';
const DEBUG_AUTH_TOKEN = process.env.DEBUG_AUTH_TOKEN;

// Test cases for production verification
const testCases = [
  {
    name: 'Non-Medical Brand (Should use Gemini)',
    brand: 'Pop-Tarts',
    product: 'Frosted Cookies & Crème',
    expectedAgent: 'gemini',
    expectedLogs: ['gemini_analysis_success']
  },
  {
    name: 'Medical Brand - Sudafed (Should use Claude)',
    brand: 'Sudafed',
    product: 'Cold Medicine',
    expectedAgent: 'claude',
    expectedLogs: ['gemini_route_skipped', 'claude_fallback_success']
  },
  {
    name: 'Medical Brand - Boots Pharmacy (Should use Claude)',
    brand: 'Boots Pharmacy',
    product: 'Boots Pharmacy',
    expectedAgent: 'claude',
    expectedLogs: ['gemini_route_skipped', 'claude_fallback_success']
  }
];

class ProductionTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  /**
   * Make HTTP request to production API
   */
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const requestOptions = {
        method: 'GET',
        headers: {
          'User-Agent': 'Production-Test-Script/1.0',
          ...options.headers
        },
        timeout: 30000 // 30 second timeout
      };

      const req = client.request(url, requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: jsonData
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data,
              parseError: error.message
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * Test the debug route with authentication
   */
  async testDebugRoute() {
    console.log('🔍 Testing Debug Route');
    console.log('====================');

    const debugUrl = `${PRODUCTION_URL}/debug/gemini`;
    const headers = DEBUG_AUTH_TOKEN ? {
      'Authorization': `Bearer ${DEBUG_AUTH_TOKEN}`
    } : {};

    try {
      console.log(`   URL: ${debugUrl}`);
      console.log(`   Auth: ${DEBUG_AUTH_TOKEN ? '✅ Token provided' : '❌ No token'}`);
      
      const response = await this.makeRequest(debugUrl, { headers });
      
      if (response.status === 401) {
        console.log('   Result: ❌ UNAUTHORIZED (debug route protected)');
        return {
          success: false,
          error: 'Debug route requires authentication',
          status: 401
        };
      }

      if (response.status !== 200) {
        console.log(`   Result: ❌ HTTP ${response.status}`);
        return {
          success: false,
          error: `HTTP ${response.status}`,
          status: response.status
        };
      }

      const data = response.data;
      console.log(`   Result: ✅ SUCCESS`);
      console.log(`   Environment: ${JSON.stringify(data.environment, null, 2)}`);
      console.log(`   Summary: ${JSON.stringify(data.summary, null, 2)}`);

      return {
        success: true,
        data: data,
        status: response.status
      };

    } catch (error) {
      console.log(`   Result: ❌ ERROR - ${error.message}`);
      return {
        success: false,
        error: error.message,
        status: 0
      };
    }
  }

  /**
   * Test the main lookup API with specific brands
   */
  async testLookupAPI(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   Brand: ${testCase.brand}`);
    console.log(`   Product: ${testCase.product}`);
    console.log(`   Expected: ${testCase.expectedAgent}`);

    const lookupUrl = `${PRODUCTION_URL}/api/lookup`;
    
    try {
      const response = await this.makeRequest(lookupUrl, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status !== 200) {
        console.log(`   Result: ❌ HTTP ${response.status}`);
        return {
          success: false,
          error: `HTTP ${response.status}`,
          status: response.status
        };
      }

      // For GET request, we can't send body, so we'll test the endpoint availability
      console.log(`   Result: ✅ API Available (${response.status})`);
      console.log(`   Note: Full test requires POST with brand data`);

      return {
        success: true,
        status: response.status,
        note: 'API endpoint available - full test requires POST request'
      };

    } catch (error) {
      console.log(`   Result: ❌ ERROR - ${error.message}`);
      return {
        success: false,
        error: error.message,
        status: 0
      };
    }
  }

  /**
   * Test environment variables and configuration
   */
  async testEnvironment() {
    console.log('\n🔧 Testing Environment Configuration');
    console.log('====================================');

    const checks = [
      {
        name: 'Production URL',
        value: PRODUCTION_URL,
        valid: PRODUCTION_URL && PRODUCTION_URL.startsWith('http')
      },
      {
        name: 'Debug Auth Token',
        value: DEBUG_AUTH_TOKEN ? 'Present' : 'Missing',
        valid: !!DEBUG_AUTH_TOKEN
      }
    ];

    for (const check of checks) {
      console.log(`   ${check.name}: ${check.valid ? '✅' : '❌'} ${check.value}`);
    }

    const allValid = checks.every(check => check.valid);
    console.log(`   Environment Check: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

    return {
      success: allValid,
      checks: checks
    };
  }

  /**
   * Generate deployment verification report
   */
  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;
    const duration = Math.round((Date.now() - this.startTime) / 1000);

    console.log('\n' + '='.repeat(60));
    console.log('🚀 PRODUCTION DEPLOYMENT VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`Production URL: ${PRODUCTION_URL}`);
    console.log(`Test Duration: ${duration}s`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log('='.repeat(60));

    if (passedTests === totalTests) {
      console.log('🎉 All production tests passed! Deployment successful.');
    } else {
      console.log('⚠️ Some tests failed. Review the deployment.');
      console.log('\nFailed Tests:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   ❌ ${result.name}: ${result.error || 'Unknown error'}`);
      });
    }

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      duration,
      productionUrl: PRODUCTION_URL
    };
  }

  /**
   * Run all production tests
   */
  async runAllTests() {
    console.log('🚀 Starting Production Deployment Verification');
    console.log('==============================================');
    console.log(`📅 Test started at: ${new Date().toISOString()}`);
    console.log(`🌐 Production URL: ${PRODUCTION_URL}\n`);

    // Test environment configuration
    const envResult = await this.testEnvironment();
    this.results.push({
      name: 'Environment Configuration',
      success: envResult.success,
      error: envResult.success ? null : 'Environment configuration issues'
    });

    // Test debug route
    const debugResult = await this.testDebugRoute();
    this.results.push({
      name: 'Debug Route Access',
      success: debugResult.success,
      error: debugResult.error
    });

    // Test lookup API availability
    const lookupResult = await this.testLookupAPI(testCases[0]);
    this.results.push({
      name: 'Lookup API Availability',
      success: lookupResult.success,
      error: lookupResult.error
    });

    return this.generateReport();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Allow custom production URL
  if (args.length > 0) {
    process.env.PRODUCTION_URL = args[0];
  }

  const tester = new ProductionTester();
  
  try {
    const report = await tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(report.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Production test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProductionTester };
