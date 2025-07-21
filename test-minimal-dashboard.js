#!/usr/bin/env node

/**
 * Test minimal dashboard for Evaluation Dashboard V4
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

async function testMinimalDashboard() {
  console.log('🧪 Testing Minimal Dashboard\n');

  try {
    const response = await fetch('http://localhost:3000/evaluation-v4');
    const html = await response.text();
    
    console.log('✅ Dashboard page loaded');
    
    // Check for React hydration indicators
    const hasReactScripts = html.includes('__next_f') || html.includes('next');
    const hasClientScripts = html.includes('app/evaluation-v4/page.js');
    const hasLoadingState = html.includes('Loading evaluation results');
    const hasErrorScripts = html.includes('error.js');
    const hasErrorBoundary = html.includes('error-boundary');
    
    console.log('📊 Dashboard Analysis:');
    console.log(`   ✅ React scripts present: ${hasReactScripts}`);
    console.log(`   ✅ Client scripts present: ${hasClientScripts}`);
    console.log(`   ✅ Loading state present: ${hasLoadingState}`);
    console.log(`   ⚠️ Error scripts present: ${hasErrorScripts}`);
    console.log(`   ⚠️ Error boundary present: ${hasErrorBoundary}`);
    
    // Check for component structure
    const hasDashboardTitle = html.includes('Evaluation Dashboard V4');
    const hasScanResultsTitle = html.includes('Scan Results');
    const hasManagePromptsButton = html.includes('Manage Prompts');
    
    console.log(`   ✅ Dashboard title: ${hasDashboardTitle}`);
    console.log(`   ✅ Scan results title: ${hasScanResultsTitle}`);
    console.log(`   ✅ Manage prompts button: ${hasManagePromptsButton}`);
    
    // Check for potential JavaScript errors
    if (hasErrorScripts) {
      console.log('\n🔍 Error Analysis:');
      console.log('   ⚠️ Error scripts detected - component may have crashed');
      console.log('   💡 This suggests a JavaScript error preventing hydration');
    }
    
    if (hasLoadingState && !hasErrorScripts) {
      console.log('\n🔍 Loading State Analysis:');
      console.log('   ⚠️ Dashboard stuck in loading state');
      console.log('   💡 This suggests the component is not hydrating properly');
      console.log('   💡 Check browser console for JavaScript errors');
    }
    
    // Check for console.log statements in the HTML
    const hasConsoleLogs = html.includes('console.log') || html.includes('🔄') || html.includes('✅');
    console.log(`   📝 Console logs in HTML: ${hasConsoleLogs}`);
    
    console.log('\n🎯 Recommendations:');
    console.log('   1. Open browser developer tools');
    console.log('   2. Check Console tab for JavaScript errors');
    console.log('   3. Check Network tab for failed API requests');
    console.log('   4. Try refreshing the page');
    console.log('   5. Check if Next.js is running in development mode');
    
    console.log('\n✅ Minimal dashboard test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testMinimalDashboard().catch(console.error); 