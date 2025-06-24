import fetch from 'node-fetch'

async function testEvaluationMode() {
  console.log('🧪 Testing Evaluation Mode...\n')

  const baseUrl = 'http://localhost:3001/api'

  try {
    // Test 1: Normal lookup (no evaluation logging)
    console.log('1. Testing normal lookup (evaluation_mode: false)...')
    const normalResponse = await fetch(`${baseUrl}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcode: '123456789',
        product_name: 'Test Product',
        brand: 'Test Brand',
        evaluation_mode: false
      })
    })

    if (normalResponse.ok) {
      console.log('✅ Normal lookup completed (no Google Sheets logging)')
    } else {
      console.log('❌ Normal lookup failed:', await normalResponse.text())
    }

    console.log()

    // Test 2: Evaluation mode lookup (with Google Sheets logging)
    console.log('2. Testing evaluation mode lookup (evaluation_mode: true)...')
    const evalResponse = await fetch(`${baseUrl}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcode: '987654321',
        product_name: 'Evaluation Test Product',
        brand: 'Evaluation Test Brand',
        evaluation_mode: true
      })
    })

    if (evalResponse.ok) {
      console.log('✅ Evaluation mode lookup completed (Google Sheets logging enabled)')
      const result = await evalResponse.json()
      console.log('   Query ID:', result.query_id)
    } else {
      console.log('❌ Evaluation mode lookup failed:', await evalResponse.text())
    }

    console.log()

    // Test 3: Check evaluation framework status
    console.log('3. Testing evaluation framework status...')
    const statusResponse = await fetch(`${baseUrl}/evaluation-framework?action=stats`)
    
    if (statusResponse.ok) {
      const stats = await statusResponse.json()
      console.log('✅ Evaluation framework status:')
      console.log('   - Total Cases:', stats.stats?.total_cases || 0)
      console.log('   - AI Results:', stats.stats?.total_ai_results || 0)
      console.log('   - Human Ratings:', stats.stats?.total_human_ratings || 0)
    } else {
      console.log('❌ Evaluation framework status failed:', await statusResponse.text())
    }

    console.log('\n🎉 Evaluation mode tests completed!')
    console.log('\n📋 Key Points:')
    console.log('• Normal lookups (evaluation_mode: false) do NOT log to Google Sheets')
    console.log('• Evaluation lookups (evaluation_mode: true) DO log to Google Sheets')
    console.log('• This prevents expensive and noisy logging for all requests')
    console.log('• Only use evaluation_mode for testing, debugging, or specific cases')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('\n🔧 Make sure your server is running on localhost:3001')
  }
}

// Run the test
testEvaluationMode() 