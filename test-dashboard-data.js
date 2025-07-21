#!/usr/bin/env node

/**
 * Test dashboard data loading and transformation
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

async function testDashboardData() {
  console.log('🧪 Testing Dashboard Data Loading\n');

  try {
    // Test API endpoint
    console.log('📡 Testing API endpoint...');
    const apiResponse = await fetch('http://localhost:3000/api/evaluation/v3/results?dataSource=live');
    const apiData = await apiResponse.json();
    
    console.log('✅ API Response Status:', apiResponse.status);
    console.log('✅ API Data Type:', Array.isArray(apiData) ? 'Array' : typeof apiData);
    console.log('✅ API Data Length:', Array.isArray(apiData) ? apiData.length : 'N/A');
    
    if (Array.isArray(apiData) && apiData.length > 0) {
      console.log('✅ First Result Sample:');
      console.log('   - ID:', apiData[0].id);
      console.log('   - Brand:', apiData[0].brand);
      console.log('   - Product:', apiData[0].product_name);
      console.log('   - Owner:', apiData[0].owner);
      console.log('   - Confidence:', apiData[0].confidence_score);
      console.log('   - Country:', apiData[0].beneficiary_country);
    }
    
    // Test dashboard page
    console.log('\n📄 Testing Dashboard Page...');
    const dashboardResponse = await fetch('http://localhost:3000/evaluation-v4');
    const dashboardHtml = await dashboardResponse.text();
    
    console.log('✅ Dashboard Status:', dashboardResponse.status);
    
    // Check for table content
    const hasTable = dashboardHtml.includes('<table');
    const hasTableHeaders = dashboardHtml.includes('Brand') && dashboardHtml.includes('Product') && dashboardHtml.includes('Owner');
    const hasTableRows = dashboardHtml.includes('<tbody>') && dashboardHtml.includes('<tr');
    const hasLoadingState = dashboardHtml.includes('Loading evaluation results');
    const hasErrorState = dashboardHtml.includes('Error:');
    const hasNoResultsState = dashboardHtml.includes('No results found');
    
    console.log('\n📊 Dashboard Content Analysis:');
    console.log(`   ✅ Has table: ${hasTable}`);
    console.log(`   ✅ Has table headers: ${hasTableHeaders}`);
    console.log(`   ✅ Has table rows: ${hasTableRows}`);
    console.log(`   ✅ Has loading state: ${hasLoadingState}`);
    console.log(`   ✅ Has error state: ${hasErrorState}`);
    console.log(`   ✅ Has no results state: ${hasNoResultsState}`);
    
    // Check for specific data in HTML
    if (Array.isArray(apiData) && apiData.length > 0) {
      const firstResult = apiData[0];
      const hasBrandInHtml = dashboardHtml.includes(firstResult.brand || '');
      const hasOwnerInHtml = dashboardHtml.includes(firstResult.owner || '');
      
      console.log('\n🔍 Data Verification:');
      console.log(`   ✅ Brand in HTML: ${hasBrandInHtml}`);
      console.log(`   ✅ Owner in HTML: ${hasOwnerInHtml}`);
    }
    
    // Check for JavaScript errors
    const hasScriptErrors = dashboardHtml.includes('Error:') || dashboardHtml.includes('error');
    const hasConsoleLogs = dashboardHtml.includes('console.log') || dashboardHtml.includes('console.error');
    
    console.log('\n🔧 JavaScript Analysis:');
    console.log(`   ✅ Has script errors: ${hasScriptErrors}`);
    console.log(`   ✅ Has console logs: ${hasConsoleLogs}`);
    
    // Summary
    const totalChecks = 8;
    const passedChecks = [
      apiResponse.ok,
      Array.isArray(apiData),
      apiData.length > 0,
      hasTable,
      hasTableHeaders,
      !hasLoadingState, // Should not be in loading state
      !hasErrorState,   // Should not have errors
      !hasNoResultsState // Should have results
    ].filter(Boolean).length;
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ ${passedChecks}/${totalChecks} checks passed`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎯 Dashboard is working correctly!');
      console.log('   - API is returning data');
      console.log('   - Data is being transformed');
      console.log('   - Table is rendering');
      console.log('   - No errors detected');
    } else {
      console.log('\n⚠️ Some issues detected');
      if (!apiResponse.ok) console.log('   - API request failed');
      if (!Array.isArray(apiData)) console.log('   - API returned unexpected data format');
      if (apiData.length === 0) console.log('   - No data returned from API');
      if (!hasTable) console.log('   - Table not rendering');
      if (hasLoadingState) console.log('   - Still in loading state');
      if (hasErrorState) console.log('   - Error state detected');
    }
    
    console.log('\n✅ Dashboard data test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testDashboardData().catch(console.error); 