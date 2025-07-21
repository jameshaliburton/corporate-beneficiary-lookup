#!/usr/bin/env node

/**
 * Test data transformation for Evaluation Dashboard V4
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

async function testDataTransformation() {
  console.log('🧪 Testing Data Transformation\n');

  try {
    // Fetch raw API data
    const response = await fetch('http://localhost:3000/api/evaluation/v3/results?dataSource=live');
    
    if (!response.ok) {
      console.log('❌ API request failed:', response.status);
      return;
    }

    const rawData = await response.json();
    console.log('✅ Raw API data received');
    console.log(`📊 Found ${rawData.results?.length || rawData.length} results`);

    // Test transformation logic
    const transformedResults = (rawData.results || rawData).map((result) => {
      // Extract trace information from agent_execution_trace
      const trace = result.agent_execution_trace?.stages?.map((stage) => ({
        stage: stage.stage || stage.name || 'Unknown Stage',
        status: stage.status || 'pending',
        duration_ms: stage.duration_ms || stage.duration || 0,
        reasoning: stage.reasoning || [{
          type: 'info',
          content: stage.description || 'No reasoning available'
        }],
        prompt: stage.prompt || undefined
      })) || []

      return {
        id: result.id?.toString() || `scan_${Date.now()}`,
        brand: result.brand || 'Unknown',
        product_name: result.product_name || result.product || 'Unknown Product',
        owner: result.owner || result.financial_beneficiary || 'Unknown',
        confidence: result.confidence_score || result.confidence || 0,
        country: result.beneficiary_country || result.country || 'Unknown',
        source: result.source_type || result.source || 'live',
        timestamp: result.timestamp || new Date().toISOString(),
        trace: trace
      }
    });

    console.log('✅ Data transformation completed');
    console.log(`📊 Transformed ${transformedResults.length} results`);

    // Show first result details
    if (transformedResults.length > 0) {
      const firstResult = transformedResults[0];
      console.log('\n📋 First Result Sample:');
      console.log(`   Brand: ${firstResult.brand}`);
      console.log(`   Product: ${firstResult.product_name}`);
      console.log(`   Owner: ${firstResult.owner}`);
      console.log(`   Confidence: ${firstResult.confidence}%`);
      console.log(`   Country: ${firstResult.country}`);
      console.log(`   Source: ${firstResult.source}`);
      console.log(`   Trace Stages: ${firstResult.trace.length}`);
      
      if (firstResult.trace.length > 0) {
        console.log('\n🔍 Trace Stages:');
        firstResult.trace.forEach((stage, index) => {
          console.log(`   ${index + 1}. ${stage.stage} (${stage.status}) - ${stage.duration_ms}ms`);
        });
      }
    }

    // Calculate metadata
    const metadata = {
      totalResults: transformedResults.length,
      averageConfidence: transformedResults.length > 0 
        ? Math.round(transformedResults.reduce((sum, r) => sum + r.confidence, 0) / transformedResults.length)
        : 0,
      lastUpdated: new Date().toISOString(),
      sourceBreakdown: {
        live: transformedResults.filter(r => r.source === 'live').length,
        eval: transformedResults.filter(r => r.source === 'eval').length,
        retry: transformedResults.filter(r => r.source === 'retry').length
      }
    };

    console.log('\n📊 Metadata:');
    console.log(`   Total Results: ${metadata.totalResults}`);
    console.log(`   Average Confidence: ${metadata.averageConfidence}%`);
    console.log(`   Source Breakdown: Live=${metadata.sourceBreakdown.live}, Eval=${metadata.sourceBreakdown.eval}, Retry=${metadata.sourceBreakdown.retry}`);

    console.log('\n✅ Data transformation test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testDataTransformation().catch(console.error); 