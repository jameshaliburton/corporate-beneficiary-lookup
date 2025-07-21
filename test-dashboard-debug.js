#!/usr/bin/env node

import fetch from 'node-fetch'

async function testDashboardData() {
  try {
    console.log('Testing dashboard data flow...')
    
    // Test API endpoint
    const response = await fetch('http://localhost:3000/api/evaluation/v3/results?dataSource=live')
    const data = await response.json()
    
    console.log('API Response:')
    console.log('- Status:', response.status)
    console.log('- Results count:', data.results?.length || 0)
    
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0]
      console.log('\nFirst result:')
      console.log('- ID:', firstResult.id)
      console.log('- Brand:', firstResult.brand)
      console.log('- Product:', firstResult.product_name)
      console.log('- Owner:', firstResult.owner)
      console.log('- Confidence:', firstResult.confidence_score)
      console.log('- Source:', firstResult.source_type)
      
      // Test data transformation
      const transformedResult = {
        id: firstResult.id?.toString() || `result_${Date.now()}`,
        brand: firstResult.brand || 'Unknown Brand',
        product: firstResult.product_name || firstResult.product || 'Unknown Product',
        owner: firstResult.owner || firstResult.financial_beneficiary || firstResult.expected_owner || 'Unknown Owner',
        confidence: firstResult.confidence_score || firstResult.confidence || 0,
        source: firstResult.source_type || firstResult.source || 'live',
        flagged: firstResult.flagged || false,
        evalSheetEntry: firstResult.evalSheetEntry || false,
        status: firstResult.status || 'completed',
        metadata: firstResult.metadata || {},
        trace: firstResult.agent_execution_trace?.stages || firstResult.trace || [],
        timestamp: firstResult.timestamp || new Date().toISOString()
      }
      
      console.log('\nTransformed result:')
      console.log('- ID:', transformedResult.id)
      console.log('- Brand:', transformedResult.brand)
      console.log('- Product:', transformedResult.product)
      console.log('- Owner:', transformedResult.owner)
      console.log('- Confidence:', transformedResult.confidence)
      console.log('- Source:', transformedResult.source)
      console.log('- Trace stages:', transformedResult.trace.length)
    }
    
    // Test dashboard page
    const dashboardResponse = await fetch('http://localhost:3000/evaluation-v4')
    const dashboardHtml = await dashboardResponse.text()
    
    console.log('\nDashboard page:')
    console.log('- Status:', dashboardResponse.status)
    console.log('- Contains "No results found":', dashboardHtml.includes('No results found'))
    console.log('- Contains "Coca-Cola":', dashboardHtml.includes('Coca-Cola'))
    console.log('- Contains "Ferrero":', dashboardHtml.includes('Ferrero'))
    
  } catch (error) {
    console.error('Error testing dashboard:', error)
  }
}

testDashboardData() 