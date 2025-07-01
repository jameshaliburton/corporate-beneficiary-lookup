#!/usr/bin/env node

/**
 * 🧪 SIMPLIFIED WORKFLOW TEST FOR OWNEDBY
 * 
 * This test validates the basic functionality that is currently working
 * and provides a foundation for the comprehensive test suite.
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test scenarios that should work with current implementation
const BASIC_TESTS = [
  {
    id: 'B001',
    name: 'Server Health Check',
    test: async () => {
      const response = await fetch(`${BASE_URL}/`);
      return {
        status: response.status,
        working: response.status === 200 || response.status === 404 // 404 is ok for root
      };
    }
  },
  {
    id: 'B002', 
    name: 'Dashboard API Test',
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/dashboard/stats`);
      const data = await response.json().catch(() => null);
      return {
        status: response.status,
        hasData: !!data,
        working: response.status === 200
      };
    }
  },
  {
    id: 'B003',
    name: 'Basic Lookup API Test',
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: 'Nike',
          product: 'Test Product',
          test_mode: true
        })
      });
      const data = await response.json().catch(() => null);
      return {
        status: response.status,
        hasData: !!data,
        working: response.status === 200
      };
    }
  },
  {
    id: 'B004',
    name: 'Barcode Lookup Test', 
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: '7318690077503',
          test_mode: true
        })
      });
      const data = await response.json().catch(() => null);
      return {
        status: response.status,
        hasData: !!data,
        resultType: data?.result_type,
        working: response.status === 200
      };
    }
  },
  {
    id: 'B005',
    name: 'Progress API Test',
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get' })
      });
      return {
        status: response.status,
        working: response.status === 200
      };
    }
  }
];

async function runBasicTests() {
  console.log('🧪 BASIC OWNEDBY WORKFLOW TESTS');
  console.log('===============================\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  for (const testCase of BASIC_TESTS) {
    console.log(`Running: ${testCase.name}`);
    
    try {
      const startTime = Date.now();
      const result = await testCase.test();
      const duration = Date.now() - startTime;
      
      if (result.working) {
        console.log(`✅ PASSED [${testCase.id}] ${testCase.name} (${duration}ms)`);
        passed++;
      } else {
        console.log(`❌ FAILED [${testCase.id}] ${testCase.name} (${duration}ms)`);
        console.log(`   Status: ${result.status}`);
        failed++;
      }
      
      results.push({
        id: testCase.id,
        name: testCase.name,
        passed: result.working,
        duration,
        status: result.status,
        details: result
      });
      
    } catch (error) {
      console.log(`❌ ERROR [${testCase.id}] ${testCase.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
      
      results.push({
        id: testCase.id,
        name: testCase.name,
        passed: false,
        error: error.message
      });
    }
  }
  
  console.log('\n📊 BASIC TEST RESULTS');
  console.log('=====================');
  console.log(`Total Tests: ${BASIC_TESTS.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / BASIC_TESTS.length) * 100).toFixed(1)}%`);
  
  // Check what's working and what needs attention
  console.log('\n🔍 DIAGNOSTIC INFORMATION');
  console.log('=========================');
  
  const workingApis = results.filter(r => r.passed).map(r => r.name);
  const failedApis = results.filter(r => !r.passed).map(r => r.name);
  
  if (workingApis.length > 0) {
    console.log(`✅ Working: ${workingApis.join(', ')}`);
  }
  
  if (failedApis.length > 0) {
    console.log(`❌ Failed: ${failedApis.join(', ')}`);
  }
  
  // Provide recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (failed === 0) {
    console.log('🎉 All basic tests passed! Ready for comprehensive testing.');
  } else if (passed > 0) {
    console.log('⚠️  Some APIs are working. Check server logs for failed endpoints.');
    console.log('   Try restarting the development server: npm run dev');
  } else {
    console.log('🚨 No APIs responding. Check if development server is running.');
    console.log('   Run: npm run dev');
  }
  
  return results;
}

// Additional diagnostic tests
async function runDiagnostics() {
  console.log('\n🔧 RUNNING DIAGNOSTICS');
  console.log('======================');
  
  // Test different ports
  const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006];
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/`, { timeout: 1000 });
      if (response.status < 500) {
        console.log(`✅ Server responding on port ${port} (status: ${response.status})`);
        if (port !== 3000) {
          console.log(`   💡 Try updating BASE_URL to http://localhost:${port}`);
        }
        break;
      }
    } catch (error) {
      // Port not responding
    }
  }
  
  // Test if it's a cache/build issue
  console.log('\n🔧 Build Status Check');
  try {
    const response = await fetch(`${BASE_URL}/_next/static/chunks/main.js`, { timeout: 2000 });
    if (response.status === 200) {
      console.log('✅ Next.js build assets accessible');
    } else {
      console.log('❌ Next.js build assets not found - try clearing .next and rebuilding');
    }
  } catch (error) {
    console.log('❌ Build assets check failed');
  }
}

async function main() {
  const results = await runBasicTests();
  await runDiagnostics();
  
  // Exit with error code if tests failed
  const failedCount = results.filter(r => !r.passed).length;
  process.exit(failedCount > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runBasicTests, runDiagnostics }; 