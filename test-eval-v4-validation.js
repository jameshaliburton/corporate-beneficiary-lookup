#!/usr/bin/env node

/**
 * Evaluation Dashboard V4 - Comprehensive Validation Test
 * Tests real data connections, filtering, modals, and environment setup
 */

import fetch from 'node-fetch'

// Test configuration
const BASE_URL = 'http://localhost:3000'
const API_ENDPOINTS = {
  evalV3Results: '/api/evaluation/v3/results',
  evalV4Page: '/evaluation-v4',
  dashboardStats: '/api/dashboard/stats'
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
}

function logTest(name, passed, details = '') {
  testResults.total++
  if (passed) {
    testResults.passed++
    console.log(`✅ ${name}`)
  } else {
    testResults.failed++
    console.log(`❌ ${name}`)
    if (details) console.log(`   Details: ${details}`)
  }
  testResults.details.push({ name, passed, details })
}

async function testEnvironmentVariables() {
  console.log('\n🔧 Testing Environment Variables...')
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'ANTHROPIC_API_KEY',
    'GOOGLE_SHEETS_EVALUATION_ID'
  ]
  
  for (const varName of requiredVars) {
    const value = process.env[varName]
    const exists = !!value
    const isNotEmpty = exists && value.length > 0
    const isNotDefault = exists && !value.includes('your_') && !value.includes('DEFAULT')
    
    logTest(
      `Environment Variable: ${varName}`,
      exists && isNotEmpty && isNotDefault,
      exists ? `Value: ${value.substring(0, 20)}...` : 'Missing'
    )
  }
}

async function testAPIConnectivity() {
  console.log('\n🌐 Testing API Connectivity...')
  
  try {
    // Test Evaluation V3 API
    const evalResponse = await fetch(`${BASE_URL}${API_ENDPOINTS.evalV3Results}?dataSource=live`)
    const evalData = await evalResponse.json()
    
    logTest(
      'Evaluation V3 API Response',
      evalResponse.ok,
      `Status: ${evalResponse.status}, Results: ${evalData?.results?.length || 0}`
    )
    
    // Test Dashboard Stats API
    const statsResponse = await fetch(`${BASE_URL}${API_ENDPOINTS.dashboardStats}`)
    const statsData = await statsResponse.json()
    
    logTest(
      'Dashboard Stats API Response',
      statsResponse.ok,
      `Status: ${statsResponse.status}, Has Products: ${!!statsData?.products}`
    )
    
  } catch (error) {
    logTest('API Connectivity', false, `Error: ${error.message}`)
  }
}

async function testRealDataConnection() {
  console.log('\n📊 Testing Real Data Connection...')
  
  try {
    const response = await fetch(`${BASE_URL}${API_ENDPOINTS.evalV3Results}?dataSource=live`)
    const data = await response.json()
    
    // Check if we have real data
    const hasResults = data?.results && Array.isArray(data.results)
    const resultCount = hasResults ? data.results.length : 0
    const hasRealData = resultCount > 0
    
    logTest(
      'Real Data Available',
      hasRealData,
      `Found ${resultCount} results`
    )
    
    if (hasResults && data.results.length > 0) {
      const firstResult = data.results[0]
      
      // Check for required fields
      const hasRequiredFields = firstResult.id && firstResult.brand && firstResult.owner
      logTest(
        'Required Fields Present',
        hasRequiredFields,
        `ID: ${!!firstResult.id}, Brand: ${!!firstResult.brand}, Owner: ${!!firstResult.owner}`
      )
      
      // Check for trace data
      const hasTraceData = firstResult.agent_execution_trace || firstResult.trace
      logTest(
        'Trace Data Available',
        hasTraceData,
        `Trace: ${!!firstResult.agent_execution_trace}, Legacy Trace: ${!!firstResult.trace}`
      )
      
      // Check for confidence scores
      const hasConfidence = firstResult.confidence_score !== undefined
      logTest(
        'Confidence Scores Present',
        hasConfidence,
        `Confidence: ${firstResult.confidence_score || 'N/A'}`
      )
    }
    
  } catch (error) {
    logTest('Real Data Connection', false, `Error: ${error.message}`)
  }
}

async function testFilteringLogic() {
  console.log('\n🔍 Testing Filtering Logic...')
  
  try {
    // Test search filtering
    const searchResponse = await fetch(`${BASE_URL}${API_ENDPOINTS.evalV3Results}?dataSource=live&search=test`)
    const searchData = await searchResponse.json()
    
    logTest(
      'Search Filter API',
      searchResponse.ok,
      `Status: ${searchResponse.status}, Results: ${searchData?.results?.length || 0}`
    )
    
    // Test confidence filtering
    const confidenceResponse = await fetch(`${BASE_URL}${API_ENDPOINTS.evalV3Results}?dataSource=live&confidenceMin=80`)
    const confidenceData = await confidenceResponse.json()
    
    logTest(
      'Confidence Filter API',
      confidenceResponse.ok,
      `Status: ${confidenceResponse.status}, Results: ${confidenceData?.results?.length || 0}`
    )
    
  } catch (error) {
    logTest('Filtering Logic', false, `Error: ${error.message}`)
  }
}

async function testComponentStructure() {
  console.log('\n🏗️ Testing Component Structure...')
  
  try {
    // Test if the page loads
    const pageResponse = await fetch(`${BASE_URL}${API_ENDPOINTS.evalV4Page}`)
    
    logTest(
      'EvalV4 Page Loads',
      pageResponse.ok,
      `Status: ${pageResponse.status}`
    )
    
    if (pageResponse.ok) {
      const html = await pageResponse.text()
      
      // Check for key components
      const hasDashboard = html.includes('Evaluation Dashboard V4')
      logTest('Dashboard Title Present', hasDashboard)
      
      const hasFilterBar = html.includes('Filters') || html.includes('filter')
      logTest('Filter Components Present', hasFilterBar)
      
      const hasTable = html.includes('table') || html.includes('grid')
      logTest('Results Table Present', hasTable)
      
    }
    
  } catch (error) {
    logTest('Component Structure', false, `Error: ${error.message}`)
  }
}

async function testMockDataUsage() {
  console.log('\n🎭 Testing Mock Data Usage...')
  
  // Check if evaluationService is using mock data
  try {
    const fs = await import('fs')
    const evaluationServicePath = './src/lib/eval-v4/evaluationService.ts'
    
    if (fs.existsSync(evaluationServicePath)) {
      const content = fs.readFileSync(evaluationServicePath, 'utf8')
      
      const usesMockData = content.includes('mockScanResults') || content.includes('mockData')
      logTest(
        'Uses Mock Data Fallback',
        usesMockData,
        'Found mock data references in evaluationService'
      )
      
      const hasRealDataIntegration = content.includes('fetch') && content.includes('/api/evaluation/v3')
      logTest(
        'Has Real Data Integration',
        hasRealDataIntegration,
        'Found API fetch calls in evaluationService'
      )
      
    } else {
      logTest('Evaluation Service File', false, 'File not found')
    }
    
  } catch (error) {
    logTest('Mock Data Analysis', false, `Error: ${error.message}`)
  }
}

async function testModalFunctionality() {
  console.log('\n🪟 Testing Modal Functionality...')
  
  try {
    // Check if modal components exist
    const fs = await import('fs')
    
    const modalFiles = [
      './src/components/eval-v4/EvalV4TraceModal.tsx',
      './src/components/eval-v4/EvalV4PromptModal.tsx'
    ]
    
    for (const file of modalFiles) {
      const exists = fs.existsSync(file)
      const fileName = file.split('/').pop()
      logTest(
        `Modal Component: ${fileName}`,
        exists,
        exists ? 'File found' : 'File not found'
      )
      
      if (exists) {
        const content = fs.readFileSync(file, 'utf8')
        const hasStateManagement = content.includes('useState') || content.includes('state')
        logTest(
          `Modal State Management: ${fileName}`,
          hasStateManagement,
          'Found state management code'
        )
      }
    }
    
  } catch (error) {
    logTest('Modal Functionality', false, `Error: ${error.message}`)
  }
}

async function testGoogleSheetsIntegration() {
  console.log('\n📋 Testing Google Sheets Integration...')
  
  try {
    const fs = await import('fs')
    const sheetsServicePath = './src/lib/services/google-sheets-evaluation.js'
    
    if (fs.existsSync(sheetsServicePath)) {
      const content = fs.readFileSync(sheetsServicePath, 'utf8')
      
      const hasAuthSetup = content.includes('googleapis') || content.includes('google.auth')
      logTest(
        'Google Sheets Auth Setup',
        hasAuthSetup,
        'Found Google APIs integration'
      )
      
      const hasSheetIds = content.includes('GOOGLE_SHEET_') || content.includes('sheetIds')
      logTest(
        'Sheet IDs Configured',
        hasSheetIds,
        'Found sheet ID configuration'
      )
      
    } else {
      logTest('Google Sheets Service', false, 'Service file not found')
    }
    
    // Check environment variables
    const hasSheetsId = !!process.env.GOOGLE_SHEETS_EVALUATION_ID
    logTest(
      'Google Sheets ID Set',
      hasSheetsId,
      hasSheetsId ? `ID: ${process.env.GOOGLE_SHEETS_EVALUATION_ID.substring(0, 20)}...` : 'Missing'
    )
    
  } catch (error) {
    logTest('Google Sheets Integration', false, `Error: ${error.message}`)
  }
}

async function runAllTests() {
  console.log('🚀 Starting Evaluation Dashboard V4 Validation Tests...\n')
  
  await testEnvironmentVariables()
  await testAPIConnectivity()
  await testRealDataConnection()
  await testFilteringLogic()
  await testComponentStructure()
  await testMockDataUsage()
  await testModalFunctionality()
  await testGoogleSheetsIntegration()
  
  // Summary
  console.log('\n📊 Test Summary:')
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`Passed: ${testResults.passed}`)
  console.log(`Failed: ${testResults.failed}`)
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`)
  
  // Detailed results
  console.log('\n📋 Detailed Results:')
  testResults.details.forEach(test => {
    const status = test.passed ? '✅' : '❌'
    console.log(`${status} ${test.name}`)
    if (!test.passed && test.details) {
      console.log(`   ${test.details}`)
    }
  })
  
  // Recommendations
  console.log('\n💡 Recommendations:')
  
  const failedTests = testResults.details.filter(t => !t.passed)
  
  if (failedTests.length === 0) {
    console.log('🎉 All tests passed! The Evaluation Dashboard V4 is fully functional.')
  } else {
    console.log('🔧 Areas needing attention:')
    
    if (failedTests.some(t => t.name.includes('Environment Variable'))) {
      console.log('- Set up missing environment variables')
    }
    
    if (failedTests.some(t => t.name.includes('Real Data'))) {
      console.log('- Connect to real Supabase data instead of using mock data')
    }
    
    if (failedTests.some(t => t.name.includes('Google Sheets'))) {
      console.log('- Configure Google Sheets API authentication')
    }
    
    if (failedTests.some(t => t.name.includes('Modal'))) {
      console.log('- Implement modal functionality and state management')
    }
    
    if (failedTests.some(t => t.name.includes('Filter'))) {
      console.log('- Connect filtering logic to backend APIs')
    }
  }
}

// Run tests
runAllTests().catch(console.error) 