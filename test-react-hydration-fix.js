#!/usr/bin/env node

/**
 * Test React component rendering and identify JavaScript errors
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

async function testReactHydration() {
  console.log('🧪 Testing React Hydration Fix...\n');

  try {
    // Test 1: Check if dashboard loads
    console.log('1️⃣ Testing dashboard loading...');
    const response = await fetch('http://localhost:3000/evaluation-v4');
    
    if (!response.ok) {
      throw new Error(`Dashboard failed to load: ${response.status}`);
    }

    const html = await response.text();
    console.log('✅ Dashboard loads successfully');

    // Test 2: Check for React hydration indicators
    console.log('\n2️⃣ Testing React hydration indicators...');
    
    const reactIndicators = [
      'data-reactroot',
      '__NEXT_DATA__',
      'window.__NEXT_DATA__',
      'React',
      'useState',
      'useEffect'
    ];

    let reactFound = 0;
    for (const indicator of reactIndicators) {
      if (html.includes(indicator)) {
        reactFound++;
        console.log(`✅ Found React indicator: ${indicator}`);
      }
    }

    console.log(`📊 Found ${reactFound}/${reactIndicators.length} React indicators`);

    // Test 3: Check for interactive elements
    console.log('\n3️⃣ Testing interactive elements...');
    
    const interactiveElements = [
      'Manage Prompts',
      'Export Results', 
      'Refresh',
      'View Trace',
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

    // Test 4: Check for JavaScript errors
    console.log('\n4️⃣ Testing for JavaScript errors...');
    
    const errorPatterns = [
      'error',
      'Error',
      'exception',
      'Exception',
      'failed',
      'Failed',
      'Cannot read',
      'undefined',
      'null'
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
      'Table',
      'Scan Results'
    ];

    let dataFound = 0;
    for (const indicator of dataIndicators) {
      if (html.includes(indicator)) {
        dataFound++;
        console.log(`✅ Found data indicator: ${indicator}`);
      }
    }

    console.log(`📊 Found ${dataFound}/${dataIndicators.length} data indicators`);

    // Test 6: Check for hydration mismatch
    console.log('\n6️⃣ Testing for hydration mismatch...');
    
    const hydrationPatterns = [
      'mounted',
      'Mounted',
      'Initializing',
      'initializing'
    ];

    let hydrationFound = 0;
    for (const pattern of hydrationPatterns) {
      if (html.includes(pattern)) {
        hydrationFound++;
        console.log(`✅ Found hydration pattern: ${pattern}`);
      }
    }

    console.log(`📊 Found ${hydrationFound}/${hydrationPatterns.length} hydration patterns`);

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`- Dashboard loads: ✅`);
    console.log(`- React indicators: ${reactFound}/${reactIndicators.length}`);
    console.log(`- Interactive elements: ${foundElements}/${interactiveElements.length}`);
    console.log(`- JavaScript errors: ${errorsFound} found`);
    console.log(`- Data loading: ${dataFound}/${dataIndicators.length}`);
    console.log(`- Hydration patterns: ${hydrationFound}/${hydrationPatterns.length}`);

    if (foundElements >= 3 && reactFound >= 2 && errorsFound === 0) {
      console.log('\n🎉 React hydration appears to be working correctly!');
    } else {
      console.log('\n⚠️  React hydration may have issues');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testReactHydration(); 