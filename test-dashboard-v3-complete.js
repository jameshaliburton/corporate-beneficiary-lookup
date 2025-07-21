#!/usr/bin/env node

/**
 * Comprehensive Test for Evaluation Dashboard V3 Complete Implementation
 * Tests all enhanced features including trace data, step-level reruns, and feedback
 */

const http = require('http');
const https = require('https');

// Custom fetch implementation for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(jsonData),
            text: () => Promise.resolve(data)
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.reject(e),
            text: () => Promise.resolve(data)
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testDashboardV3Complete() {
  console.log('🧪 Testing Evaluation Dashboard V3 Complete Implementation\n');
  
  const baseUrl = 'http://localhost:3000';
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, passed, details = '') {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}`);
    if (details) console.log(`   ${details}`);
    results.tests.push({ name, passed, details });
    if (passed) results.passed++; else results.failed++;
  }

  // Test 1: Dashboard Loading
  try {
    const response = await fetch(`${baseUrl}/evaluation/v3`);
    logTest('Dashboard Page Loading', response.ok, `Status: ${response.status}`);
  } catch (error) {
    logTest('Dashboard Page Loading', false, `Error: ${error.message}`);
  }

  // Test 2: Enhanced Results API with Trace Data
  try {
    const response = await fetch(`${baseUrl}/api/evaluation/v3/results?dataSource=live`);
    const data = await response.json();
    
    const hasTraceData = data.results && data.results.length > 0 && 
                        data.results[0].agent_execution_trace;
    const hasPromptVersion = data.results && data.results.length > 0 && 
                           data.results[0].prompt_version;
    const hasAgentType = data.results && data.results.length > 0 && 
                        data.results[0].agent_type;
    
    logTest('Enhanced Results API with Trace Data', 
            hasTraceData && hasPromptVersion && hasAgentType,
            `Trace: ${hasTraceData}, Prompt Version: ${hasPromptVersion}, Agent Type: ${hasAgentType}`);
    
    if (hasTraceData) {
      const trace = data.results[0].agent_execution_trace;
      const hasStages = trace.stages && trace.stages.length > 0;
      const hasPerformance = trace.performance_metrics;
      logTest('Trace Data Structure', hasStages && hasPerformance,
              `Stages: ${hasStages}, Performance: ${hasPerformance}`);
    }
  } catch (error) {
    logTest('Enhanced Results API with Trace Data', false, `Error: ${error.message}`);
  }

  // Test 3: Metrics API with Enhanced Data
  try {
    const response = await fetch(`${baseUrl}/api/evaluation/v3/metrics`);
    const data = await response.json();
    
    const hasMetrics = data.metrics && data.metrics.totalScans;
    const hasDataSources = data.dataSources && data.dataSources.length > 0;
    const hasSheetsStatus = data.metrics && 'sheets_accessible' in data.metrics;
    
    logTest('Enhanced Metrics API', hasMetrics && hasDataSources && hasSheetsStatus,
            `Metrics: ${hasMetrics}, Data Sources: ${hasDataSources}, Sheets Status: ${hasSheetsStatus}`);
  } catch (error) {
    logTest('Enhanced Metrics API', false, `Error: ${error.message}`);
  }

  // Test 4: Prompt Registry API
  try {
    const response = await fetch(`${baseUrl}/api/evaluation/v3/prompts`);
    const data = await response.json();
    
    const hasPrompts = data.prompts && data.prompts.length > 0;
    const hasVersions = hasPrompts && data.prompts[0].version;
    const hasContent = hasPrompts && data.prompts[0].content;
    
    logTest('Prompt Registry API', hasPrompts && hasVersions && hasContent,
            `Prompts: ${hasPrompts}, Versions: ${hasVersions}, Content: ${hasContent}`);
  } catch (error) {
    logTest('Prompt Registry API', false, `Error: ${error.message}`);
  }

  // Test 5: Rerun API Functionality
  try {
    const response = await fetch(`${baseUrl}/api/evaluation/v3/rerun`, {
      method: 'POST',
      body: JSON.stringify({
        result_id: 'test-rerun',
        prompt_version: 'v1.0',
        agent_type: 'enhanced_ownership_research'
      })
    });
    const data = await response.json();
    
    logTest('Rerun API', response.ok, `Status: ${response.status}, Success: ${data.success}`);
  } catch (error) {
    logTest('Rerun API', false, `Error: ${error.message}`);
  }

  // Test 6: Feedback API Functionality
  try {
    const response = await fetch(`${baseUrl}/api/evaluation/v3/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        result_id: 'test-feedback',
        issue: 'Test feedback for web_search step',
        agent_type: 'enhanced_ownership_research'
      })
    });
    const data = await response.json();
    
    logTest('Feedback API', response.ok, `Status: ${response.status}, Success: ${data.success}`);
  } catch (error) {
    logTest('Feedback API', false, `Error: ${error.message}`);
  }

  // Test 7: Trace Data Quality
  try {
    const response = await fetch(`${baseUrl}/api/evaluation/v3/results?dataSource=live`);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const trace = data.results[0].agent_execution_trace;
      const hasStageDetails = trace && trace.stages && trace.stages.length > 0;
      const hasReasoning = hasStageDetails && trace.stages[0].reasoning;
      const hasDecisions = hasStageDetails && trace.stages[0].decisions;
      const hasDuration = hasStageDetails && trace.stages[0].duration_ms;
      
      logTest('Trace Data Quality', hasStageDetails && hasReasoning && hasDecisions && hasDuration,
              `Stages: ${hasStageDetails}, Reasoning: ${hasReasoning}, Decisions: ${hasDecisions}, Duration: ${hasDuration}`);
    } else {
      logTest('Trace Data Quality', false, 'No results available');
    }
  } catch (error) {
    logTest('Trace Data Quality', false, `Error: ${error.message}`);
  }

  // Test 8: Component Integration
  try {
    const response = await fetch(`${baseUrl}/evaluation/v3`);
    const html = await response.text();
    
    // Check for React app loading indicators and Next.js structure
    const hasReactApp = html.includes('Loading evaluation dashboard') || html.includes('__next');
    const hasNextJS = html.includes('_next/static') || html.includes('next');
    const hasClientSideScripts = html.includes('app/evaluation/v3/page.js') || html.includes('chunks');
    
    logTest('Component Integration', hasReactApp && hasNextJS && hasClientSideScripts,
            `React App: ${hasReactApp}, Next.js: ${hasNextJS}, Client Scripts: ${hasClientSideScripts}`);
  } catch (error) {
    logTest('Component Integration', false, `Error: ${error.message}`);
  }

  // Test 9: Data Source Filtering
  try {
    const liveResponse = await fetch(`${baseUrl}/api/evaluation/v3/results?dataSource=live`);
    const liveData = await liveResponse.json();
    
    const allResponse = await fetch(`${baseUrl}/api/evaluation/v3/results?dataSource=all`);
    const allData = await allResponse.json();
    
    const hasLiveFilter = liveData.summary && liveData.summary.data_source === 'live';
    const hasAllFilter = allData.summary && allData.summary.data_source === 'all';
    
    logTest('Data Source Filtering', hasLiveFilter && hasAllFilter,
            `Live Filter: ${hasLiveFilter}, All Filter: ${hasAllFilter}`);
  } catch (error) {
    logTest('Data Source Filtering', false, `Error: ${error.message}`);
  }

  // Test 10: Production Readiness
  const productionChecks = [
    { name: 'API Endpoints Responding', passed: results.tests.filter(t => t.name.includes('API') && t.passed).length >= 5 },
    { name: 'Trace Data Available', passed: results.tests.filter(t => t.name.includes('Trace') && t.passed).length >= 2 },
    { name: 'Component Integration', passed: results.tests.filter(t => t.name.includes('Component') && t.passed).length >= 1 },
    { name: 'Data Quality', passed: results.tests.filter(t => t.name.includes('Quality') && t.passed).length >= 1 }
  ];

  productionChecks.forEach(check => {
    logTest(`Production Readiness: ${check.name}`, check.passed);
  });

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('===============');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  const criticalTests = results.tests.filter(t => 
    t.name.includes('API') || t.name.includes('Trace') || t.name.includes('Component')
  );
  const criticalPassed = criticalTests.filter(t => t.passed).length;
  const criticalTotal = criticalTests.length;
  
  console.log(`🔧 Critical Features: ${criticalPassed}/${criticalTotal} (${((criticalPassed/criticalTotal)*100).toFixed(1)}%)`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Dashboard V3 Complete is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the issues above before deployment.');
  }

  return results;
}

// Run the test
testDashboardV3Complete().catch(console.error); 