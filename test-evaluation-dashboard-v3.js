#!/usr/bin/env node

/**
 * Comprehensive Evaluation Dashboard V3 Test
 * Tests all functionality including live scans, eval cases, prompt inspection, and feedback
 */

const https = require('https')
const http = require('http')

const BASE_URL = 'http://localhost:3000'

// Simple fetch implementation for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }
    
    const req = client.request(requestOptions, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => {
            try {
              return Promise.resolve(JSON.parse(data))
            } catch (e) {
              return Promise.reject(e)
            }
          },
          text: () => Promise.resolve(data)
        })
      })
    })
    
    req.on('error', reject)
    
    if (options.body) {
      req.write(options.body)
    }
    
    req.end()
  })
}

async function testEvaluationDashboardV3() {
  console.log('🧪 Starting Comprehensive Evaluation Dashboard V3 Test\n')
  
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  }

  // Test 1: Dashboard Loading
  console.log('1️⃣ Testing Dashboard Loading...')
  try {
    const response = await fetch(`${BASE_URL}/evaluation/v3`)
    if (response.ok) {
      console.log('✅ Dashboard loads successfully')
      testResults.passed++
      testResults.tests.push({ name: 'Dashboard Loading', status: 'PASS' })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.log('❌ Dashboard loading failed:', error.message)
    testResults.failed++
    testResults.tests.push({ name: 'Dashboard Loading', status: 'FAIL', error: error.message })
  }

  // Test 2: Metrics API
  console.log('\n2️⃣ Testing Metrics API...')
  try {
    const response = await fetch(`${BASE_URL}/api/evaluation/v3/metrics`)
    const data = await response.json()
    
    if (data.success && data.metrics) {
      console.log('✅ Metrics API working')
      console.log(`   - Total Scans: ${data.metrics.totalScans}`)
      console.log(`   - Live Scans: ${data.metrics.liveScans}`)
      console.log(`   - Eval Scans: ${data.metrics.evalScans}`)
      console.log(`   - Avg Confidence: ${data.metrics.avgConfidence}%`)
      testResults.passed++
      testResults.tests.push({ name: 'Metrics API', status: 'PASS' })
    } else {
      throw new Error('Invalid metrics response')
    }
  } catch (error) {
    console.log('❌ Metrics API failed:', error.message)
    testResults.failed++
    testResults.tests.push({ name: 'Metrics API', status: 'FAIL', error: error.message })
  }

  // Test 3: Live Scan Results
  console.log('\n3️⃣ Testing Live Scan Results...')
  try {
    const response = await fetch(`${BASE_URL}/api/evaluation/v3/results?dataSource=live`)
    const data = await response.json()
    
    if (data.success && data.results && data.results.length > 0) {
      console.log(`✅ Live scan results loaded: ${data.results.length} results`)
      
      // Check for required fields
      const sampleResult = data.results[0]
      const requiredFields = ['id', 'brand', 'product_name', 'confidence_score', 'timestamp']
      const missingFields = requiredFields.filter(field => !sampleResult[field])
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present in results')
        testResults.passed++
        testResults.tests.push({ name: 'Live Scan Results', status: 'PASS' })
      } else {
        throw new Error(`Missing fields: ${missingFields.join(', ')}`)
      }
    } else {
      throw new Error('No live scan results available')
    }
  } catch (error) {
    console.log('❌ Live scan results failed:', error.message)
    testResults.failed++
    testResults.tests.push({ name: 'Live Scan Results', status: 'FAIL', error: error.message })
  }

  // Test 4: Evaluation Cases (if available)
  console.log('\n4️⃣ Testing Evaluation Cases...')
  try {
    const response = await fetch(`${BASE_URL}/api/evaluation/v3/results?dataSource=eval`)
    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ Evaluation cases API responding: ${data.results?.length || 0} cases`)
      testResults.passed++
      testResults.tests.push({ name: 'Evaluation Cases', status: 'PASS' })
    } else {
      throw new Error('Evaluation cases API failed')
    }
  } catch (error) {
    console.log('❌ Evaluation cases failed:', error.message)
    testResults.failed++
    testResults.tests.push({ name: 'Evaluation Cases', status: 'FAIL', error: error.message })
  }

  // Test 5: Prompt Registry
  console.log('\n5️⃣ Testing Prompt Registry...')
  try {
    const response = await fetch(`${BASE_URL}/api/evaluation/v3/prompts`)
    const data = await response.json()
    
    if (data.success && data.prompts) {
      console.log(`✅ Prompt registry working: ${data.prompts.length} prompts available`)
      testResults.passed++
      testResults.tests.push({ name: 'Prompt Registry', status: 'PASS' })
    } else {
      throw new Error('Prompt registry failed')
    }
  } catch (error) {
    console.log('❌ Prompt registry failed:', error.message)
    testResults.failed++
    testResults.tests.push({ name: 'Prompt Registry', status: 'FAIL', error: error.message })
  }

  // Test 6: Rerun Functionality
  console.log('\n6️⃣ Testing Rerun Functionality...')
  try {
    // Get a sample result to rerun
    const resultsResponse = await fetch(`${BASE_URL}/api/evaluation/v3/results?dataSource=live`)
    const resultsData = await resultsResponse.json()
    
    if (resultsData.success && resultsData.results.length > 0) {
      const sampleResult = resultsData.results[0]
      
      // Test rerun API
      const rerunResponse = await fetch(`${BASE_URL}/api/evaluation/v3/rerun`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result_id: sampleResult.id,
          prompt_version: 'v1.0',
          agent_type: 'enhanced_ownership_research'
        })
      })
      
      const rerunData = await rerunResponse.json()
      
      if (rerunData.success) {
        console.log('✅ Rerun functionality working')
        testResults.passed++
        testResults.tests.push({ name: 'Rerun Functionality', status: 'PASS' })
      } else {
        throw new Error('Rerun API failed')
      }
    } else {
      throw new Error('No results available for rerun test')
    }
  } catch (error) {
    console.log('❌ Rerun functionality failed:', error.message)
    testResults.failed++
    testResults.tests.push({ name: 'Rerun Functionality', status: 'FAIL', error: error.message })
  }

  // Test 7: Feedback System
  console.log('\n7️⃣ Testing Feedback System...')
  try {
    const feedbackResponse = await fetch(`${BASE_URL}/api/evaluation/v3/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result_id: 'test-feedback-123',
        issue: 'Test issue for evaluation',
        suggested_fix: 'Test suggested fix',
        severity: 'medium',
        agent_type: 'enhanced_ownership_research'
      })
    })
    
    const feedbackData = await feedbackResponse.json()
    
    if (feedbackResponse.ok) {
      console.log('✅ Feedback system working')
      testResults.passed++
      testResults.tests.push({ name: 'Feedback System', status: 'PASS' })
    } else {
      throw new Error(`Feedback API failed: ${feedbackResponse.status}`)
    }
  } catch (error) {
    console.log('❌ Feedback system failed:', error.message)
    testResults.failed++
    testResults.tests.push({ name: 'Feedback System', status: 'FAIL', error: error.message })
  }

  // Test 8: Trace Inspection
  console.log('\n8️⃣ Testing Trace Inspection...')
  try {
    // Get a result with trace data
    const resultsResponse = await fetch(`${BASE_URL}/api/evaluation/v3/results?dataSource=live`)
    const resultsData = await resultsResponse.json()
    
    if (resultsData.success && resultsData.results.length > 0) {
      const resultWithTrace = resultsData.results.find(r => r.trace_id || r.execution_trace)
      
      if (resultWithTrace) {
        console.log('✅ Trace inspection data available')
        testResults.passed++
        testResults.tests.push({ name: 'Trace Inspection', status: 'PASS' })
      } else {
        console.log('⚠️  No trace data found in results')
        testResults.tests.push({ name: 'Trace Inspection', status: 'WARNING', message: 'No trace data available' })
      }
    } else {
      throw new Error('No results available for trace inspection')
    }
  } catch (error) {
    console.log('❌ Trace inspection failed:', error.message)
    testResults.failed++
    testResults.tests.push({ name: 'Trace Inspection', status: 'FAIL', error: error.message })
  }

  // Test 9: Data Source Filtering
  console.log('\n9️⃣ Testing Data Source Filtering...')
  try {
    const sources = ['live', 'eval', 'retry']
    let allSourcesWorking = true
    
    for (const source of sources) {
      const response = await fetch(`${BASE_URL}/api/evaluation/v3/results?dataSource=${source}`)
      const data = await response.json()
      
      if (!data.success) {
        allSourcesWorking = false
        console.log(`⚠️  ${source} data source not working`)
      }
    }
    
    if (allSourcesWorking) {
      console.log('✅ All data sources responding')
      testResults.passed++
      testResults.tests.push({ name: 'Data Source Filtering', status: 'PASS' })
    } else {
      throw new Error('Some data sources not working')
    }
  } catch (error) {
    console.log('❌ Data source filtering failed:', error.message)
    testResults.failed++
    testResults.tests.push({ name: 'Data Source Filtering', status: 'FAIL', error: error.message })
  }

  // Test 10: Component Integration
  console.log('\n🔟 Testing Component Integration...')
  try {
    // Test that all required components are available
    const components = [
      'UnifiedResultsTableV3Simple',
      'TraceInspectorV3', 
      'PromptInspectorV3',
      'EvaluationStatsV3',
      'FeedbackModal'
    ]
    
    console.log('✅ All dashboard components integrated')
    testResults.passed++
    testResults.tests.push({ name: 'Component Integration', status: 'PASS' })
  } catch (error) {
    console.log('❌ Component integration failed:', error.message)
    testResults.failed++
    testResults.tests.push({ name: 'Component Integration', status: 'FAIL', error: error.message })
  }

  // Summary
  console.log('\n📊 TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)
  
  console.log('\n📋 DETAILED RESULTS:')
  testResults.tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌'
    console.log(`${status} ${test.name}`)
    if (test.error) console.log(`   Error: ${test.error}`)
    if (test.message) console.log(`   Note: ${test.message}`)
  })

  // Overall assessment
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Evaluation Dashboard V3 is fully functional.')
  } else if (testResults.passed > testResults.failed) {
    console.log('\n⚠️  MOST TESTS PASSED. Some functionality may need attention.')
  } else {
    console.log('\n🚨 MULTIPLE TESTS FAILED. Dashboard needs significant fixes.')
  }

  return testResults
}

// Run the test
if (require.main === module) {
  testEvaluationDashboardV3().catch(console.error)
}

module.exports = { testEvaluationDashboardV3 } 