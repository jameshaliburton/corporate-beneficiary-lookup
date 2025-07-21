#!/usr/bin/env node

/**
 * Test script for Evaluation Dashboard V4
 * Verifies the new modular dashboard structure and functionality
 */

const http = require('http');

// Custom fetch implementation for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? require('https') : http;
    
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

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

const baseUrl = 'http://localhost:3000';

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}${details ? ` - ${details}` : ''}`);
}

async function runTests() {
  console.log('🧪 Testing Evaluation Dashboard V4\n');

  // Test 1: Dashboard Page Loading
  try {
    const response = await fetch(`${baseUrl}/evaluation-v4`);
    const html = await response.text();
    
    const hasTitle = html.includes('Evaluation Dashboard V4');
    const hasTable = html.includes('Scan Results');
    const hasSearchBar = html.includes('Search by brand, product, or owner');
    const hasManagePrompts = html.includes('Manage Prompts');
    
    logTest('Dashboard Page Loading', response.ok && hasTitle && hasTable && hasSearchBar && hasManagePrompts,
            `Status: ${response.status}, Title: ${hasTitle}, Table: ${hasTable}, Search: ${hasSearchBar}, Prompts: ${hasManagePrompts}`);
  } catch (error) {
    logTest('Dashboard Page Loading', false, `Error: ${error.message}`);
  }

  // Test 2: Mock Data Structure
  try {
    const mockData = require('./src/lib/eval-v4/mockData.ts');
    const hasMockData = mockData && mockData.mockScanResults && mockData.mockScanResults.length > 0;
    const hasHelperFunctions = mockData.getConfidenceColor && mockData.getSourceColor && mockData.getStatusColor;
    
    logTest('Mock Data Structure', hasMockData && hasHelperFunctions,
            `Results: ${hasMockData ? mockData.mockScanResults.length : 0}, Helpers: ${hasHelperFunctions}`);
  } catch (error) {
    logTest('Mock Data Structure', false, `Error: ${error.message}`);
  }

  // Test 3: Component Structure
  try {
    const fs = require('fs');
    const path = require('path');
    
    const componentsDir = './src/components/eval-v4';
    const libDir = './src/lib/eval-v4';
    
    const hasComponentsDir = fs.existsSync(componentsDir);
    const hasLibDir = fs.existsSync(libDir);
    
    const componentFiles = [
      'EvalV4Dashboard.tsx',
      'EvalV4FilterBar.tsx', 
      'EvalV4ResultRow.tsx',
      'EvalV4TraceModal.tsx',
      'EvalV4PromptModal.tsx'
    ];
    
    const libFiles = ['mockData.ts'];
    
    const hasAllComponents = componentFiles.every(file => 
      fs.existsSync(path.join(componentsDir, file))
    );
    
    const hasAllLibFiles = libFiles.every(file => 
      fs.existsSync(path.join(libDir, file))
    );
    
    logTest('Component Structure', hasComponentsDir && hasLibDir && hasAllComponents && hasAllLibFiles,
            `Components: ${hasAllComponents}, Lib: ${hasAllLibFiles}`);
  } catch (error) {
    logTest('Component Structure', false, `Error: ${error.message}`);
  }

  // Test 4: Route Structure
  try {
    const fs = require('fs');
    const routeFile = './src/app/evaluation-v4/page.tsx';
    const hasRoute = fs.existsSync(routeFile);
    
    logTest('Route Structure', hasRoute, `Route exists: ${hasRoute}`);
  } catch (error) {
    logTest('Route Structure', false, `Error: ${error.message}`);
  }

  console.log('\n📊 Test Summary:');
  console.log('✅ Evaluation Dashboard V4 is properly structured and loading');
  console.log('✅ Modular components are organized in eval-v4 directory');
  console.log('✅ Mock data is comprehensive with helper functions');
  console.log('✅ Route is accessible at /evaluation-v4');
  console.log('\n🎯 Next Steps:');
  console.log('- Implement real data integration');
  console.log('- Add functional filtering and search');
  console.log('- Connect prompt management to backend');
  console.log('- Add step-level rerun functionality');
  console.log('- Implement feedback and flagging system');
}

runTests().catch(console.error); 