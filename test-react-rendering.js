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
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testReactRendering() {
  console.log('🧪 Testing React Component Rendering\n');

  try {
    // Test dashboard page
    console.log('📄 Testing Dashboard Page...');
    const dashboardResponse = await fetch('http://localhost:3000/evaluation-v4');
    const dashboardHtml = await dashboardResponse.text();
    
    console.log('✅ Dashboard Status:', dashboardResponse.status);
    
    // Check for React hydration issues
    const hasReactRoot = dashboardHtml.includes('__next') || dashboardHtml.includes('react');
    const hasClientScripts = dashboardHtml.includes('client') || dashboardHtml.includes('use client');
    const hasHydrationErrors = dashboardHtml.includes('hydration') || dashboardHtml.includes('Hydration');
    
    console.log('\n⚛️ React Analysis:');
    console.log(`   ✅ Has React root: ${hasReactRoot}`);
    console.log(`   ✅ Has client scripts: ${hasClientScripts}`);
    console.log(`   ✅ Has hydration errors: ${hasHydrationErrors}`);
    
    // Check for JavaScript errors
    const hasScriptErrors = dashboardHtml.includes('Error:') || dashboardHtml.includes('error');
    const hasConsoleErrors = dashboardHtml.includes('console.error') || dashboardHtml.includes('console.log');
    const hasSyntaxErrors = dashboardHtml.includes('SyntaxError') || dashboardHtml.includes('Unexpected token');
    
    console.log('\n🔧 JavaScript Error Analysis:');
    console.log(`   ✅ Has script errors: ${hasScriptErrors}`);
    console.log(`   ✅ Has console errors: ${hasConsoleErrors}`);
    console.log(`   ✅ Has syntax errors: ${hasSyntaxErrors}`);
    
    // Check for component structure
    const hasDashboardTitle = dashboardHtml.includes('Evaluation Dashboard V4');
    const hasActionButtons = dashboardHtml.includes('Manage Prompts') && dashboardHtml.includes('Export Results');
    const hasDebugInfo = dashboardHtml.includes('Debug Info');
    const hasCardStructure = dashboardHtml.includes('Card') || dashboardHtml.includes('card');
    
    console.log('\n📋 Component Structure:');
    console.log(`   ✅ Has dashboard title: ${hasDashboardTitle}`);
    console.log(`   ✅ Has action buttons: ${hasActionButtons}`);
    console.log(`   ✅ Has debug info: ${hasDebugInfo}`);
    console.log(`   ✅ Has card structure: ${hasCardStructure}`);
    
    // Check for loading states
    const hasLoadingState = dashboardHtml.includes('Loading evaluation results');
    const hasErrorState = dashboardHtml.includes('Error:');
    const hasNoResultsState = dashboardHtml.includes('No results found');
    const hasTableStructure = dashboardHtml.includes('<table') || dashboardHtml.includes('table');
    
    console.log('\n📊 State Management:');
    console.log(`   ✅ Has loading state: ${hasLoadingState}`);
    console.log(`   ✅ Has error state: ${hasErrorState}`);
    console.log(`   ✅ Has no results state: ${hasNoResultsState}`);
    console.log(`   ✅ Has table structure: ${hasTableStructure}`);
    
    // Check for interactive elements
    const hasOnClickHandlers = dashboardHtml.includes('onClick') || dashboardHtml.includes('onclick');
    const hasButtonElements = dashboardHtml.includes('<button') || dashboardHtml.includes('Button');
    const hasAlertFunctions = dashboardHtml.includes('alert(');
    
    console.log('\n🎯 Interactive Elements:');
    console.log(`   ✅ Has onClick handlers: ${hasOnClickHandlers}`);
    console.log(`   ✅ Has button elements: ${hasButtonElements}`);
    console.log(`   ✅ Has alert functions: ${hasAlertFunctions}`);
    
    // Extract potential error messages
    const errorPatterns = [
      /Error:\s*([^<]+)/g,
      /error:\s*([^<]+)/gi,
      /SyntaxError:\s*([^<]+)/g,
      /Unexpected token\s*([^<]+)/g
    ];
    
    const foundErrors = [];
    errorPatterns.forEach(pattern => {
      const matches = dashboardHtml.match(pattern);
      if (matches) {
        foundErrors.push(...matches);
      }
    });
    
    if (foundErrors.length > 0) {
      console.log('\n❌ Found Error Messages:');
      foundErrors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    // Summary
    const totalChecks = 15;
    const passedChecks = [
      hasReactRoot,
      hasClientScripts,
      !hasHydrationErrors,
      !hasScriptErrors,
      !hasSyntaxErrors,
      hasDashboardTitle,
      hasActionButtons,
      hasDebugInfo,
      hasCardStructure,
      !hasLoadingState, // Should not be stuck in loading
      !hasErrorState,   // Should not have errors
      hasTableStructure,
      hasOnClickHandlers,
      hasButtonElements,
      hasAlertFunctions
    ].filter(Boolean).length;
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ ${passedChecks}/${totalChecks} checks passed`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎯 React component is rendering correctly!');
      console.log('   - No hydration errors');
      console.log('   - No JavaScript errors');
      console.log('   - Component structure is correct');
      console.log('   - Interactive elements are present');
    } else {
      console.log('\n⚠️ Issues detected:');
      if (hasHydrationErrors) console.log('   - Hydration errors detected');
      if (hasScriptErrors) console.log('   - JavaScript errors detected');
      if (hasSyntaxErrors) console.log('   - Syntax errors detected');
      if (hasLoadingState) console.log('   - Component stuck in loading state');
      if (hasErrorState) console.log('   - Error state detected');
      if (!hasTableStructure) console.log('   - Table structure missing');
    }
    
    console.log('\n✅ React rendering test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testReactRendering().catch(console.error); 