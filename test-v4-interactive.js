#!/usr/bin/env node

/**
 * Test interactive functionality for Evaluation Dashboard V4
 */

const http = require('http');

// Custom fetch implementation for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testV4Dashboard() {
  console.log('🧪 Testing Evaluation Dashboard V4 Interactive Functionality...\n');

  try {
    // Test 1: Check if dashboard loads
    console.log('1️⃣ Testing dashboard loading...');
    const response = await fetch('http://localhost:3000/evaluation-v4');
    
    if (!response.ok) {
      throw new Error(`Dashboard failed to load: ${response.status}`);
    }

    const html = await response.text();
    console.log('✅ Dashboard loads successfully');

    // Test 2: Check for interactive elements
    console.log('\n2️⃣ Testing interactive elements...');
    
    const interactiveElements = [
      'Manage Prompts',
      'Export Results', 
      'Debug Info',
      'Refresh',
      'button',
      'onclick',
      'onClick'
    ];

    let foundElements = 0;
    for (const element of interactiveElements) {
      if (html.includes(element)) {
        foundElements++;
        console.log(`✅ Found interactive element: ${element}`);
      }
    }

    console.log(`📊 Found ${foundElements}/${interactiveElements.length} interactive elements`);

    // Test 3: Check for React hydration
    console.log('\n3️⃣ Testing React hydration...');
    
    const reactIndicators = [
      'data-reactroot',
      '__NEXT_DATA__',
      'window.__NEXT_DATA__',
      'React'
    ];

    let reactFound = 0;
    for (const indicator of reactIndicators) {
      if (html.includes(indicator)) {
        reactFound++;
        console.log(`✅ Found React indicator: ${indicator}`);
      }
    }

    console.log(`📊 Found ${reactFound}/${reactIndicators.length} React indicators`);

    // Test 4: Check for JavaScript errors
    console.log('\n4️⃣ Testing for JavaScript errors...');
    
    const errorPatterns = [
      'error',
      'Error',
      'exception',
      'Exception',
      'failed',
      'Failed'
    ];

    let errorsFound = 0;
    for (const pattern of errorPatterns) {
      if (html.includes(pattern)) {
        errorsFound++;
        console.log(`⚠️  Found potential error pattern: ${pattern}`);
      }
    }

    if (errorsFound === 0) {
      console.log('✅ No obvious JavaScript errors found');
    } else {
      console.log(`⚠️  Found ${errorsFound} potential error patterns`);
    }

    // Test 5: Check for data loading
    console.log('\n5️⃣ Testing data loading...');
    
    const dataIndicators = [
      'results',
      'data',
      'loading',
      'Loading',
      'table',
      'Table'
    ];

    let dataFound = 0;
    for (const indicator of dataIndicators) {
      if (html.includes(indicator)) {
        dataFound++;
        console.log(`✅ Found data indicator: ${indicator}`);
      }
    }

    console.log(`📊 Found ${dataFound}/${dataIndicators.length} data indicators`);

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`- Dashboard loads: ✅`);
    console.log(`- Interactive elements: ${foundElements}/${interactiveElements.length}`);
    console.log(`- React hydration: ${reactFound}/${reactIndicators.length}`);
    console.log(`- JavaScript errors: ${errorsFound} found`);
    console.log(`- Data loading: ${dataFound}/${dataIndicators.length}`);

    if (foundElements >= 3 && reactFound >= 2 && errorsFound === 0) {
      console.log('\n🎉 V4 Dashboard appears to be working correctly!');
    } else {
      console.log('\n⚠️  V4 Dashboard may have issues with interactivity');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testV4Dashboard(); 