#!/usr/bin/env node

/**
 * Test React hydration for Evaluation Dashboard V4
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
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testReactHydration() {
  console.log('🧪 Testing React Hydration\n');

  try {
    const response = await fetch('http://localhost:3000/evaluation-v4');
    const html = await response.text();
    
    console.log('✅ Dashboard page loaded');
    
    // Check for React hydration indicators
    const hasReactScripts = html.includes('__next_f') || html.includes('next');
    const hasClientScripts = html.includes('app/evaluation-v4/page.js');
    const hasLoadingState = html.includes('Loading evaluation results');
    const hasFilterBar = html.includes('Search by brand, product, owner, or country');
    
    console.log('📊 React Hydration Analysis:');
    console.log(`   ✅ React scripts present: ${hasReactScripts}`);
    console.log(`   ✅ Client scripts present: ${hasClientScripts}`);
    console.log(`   ✅ Loading state present: ${hasLoadingState}`);
    console.log(`   ✅ Filter bar present: ${hasFilterBar}`);
    
    // Check for potential JavaScript errors
    const hasErrorScripts = html.includes('error.js');
    const hasErrorBoundary = html.includes('error-boundary');
    
    console.log(`   ⚠️ Error scripts present: ${hasErrorScripts}`);
    console.log(`   ⚠️ Error boundary present: ${hasErrorBoundary}`);
    
    // Check for component structure
    const hasDashboardComponent = html.includes('EvalV4Dashboard');
    const hasFilterComponent = html.includes('EvalV4FilterBar');
    
    console.log(`   ✅ Dashboard component: ${hasDashboardComponent}`);
    console.log(`   ✅ Filter component: ${hasFilterComponent}`);
    
    // Check for data fetching indicators
    const hasFetchScripts = html.includes('fetch') || html.includes('api');
    console.log(`   ✅ Data fetching scripts: ${hasFetchScripts}`);
    
    console.log('\n🔍 Potential Issues:');
    
    if (hasLoadingState && !hasErrorScripts) {
      console.log('   ⚠️ Dashboard stuck in loading state - likely JavaScript error');
      console.log('   💡 Check browser console for JavaScript errors');
    }
    
    if (hasErrorScripts) {
      console.log('   ⚠️ Error scripts detected - component may have crashed');
    }
    
    console.log('\n🎯 Recommendations:');
    console.log('   1. Open browser developer tools');
    console.log('   2. Check Console tab for JavaScript errors');
    console.log('   3. Check Network tab for failed API requests');
    console.log('   4. Verify React DevTools show component tree');
    
    console.log('\n✅ React hydration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testReactHydration().catch(console.error); 