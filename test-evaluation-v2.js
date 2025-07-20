const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, (err) => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
    console.log('> Evaluation V2 Dashboard: http://localhost:3000/evaluation/v2')
  })
})

console.log('🧪 Testing Evaluation Dashboard V2 Implementation...')

// Test the API endpoints
async function testEndpoints() {
  const baseUrl = 'http://localhost:3000'
  
  const endpoints = [
    '/api/evaluation/v2/metrics',
    '/api/evaluation/v2/results',
    '/api/evaluation/v2/prompts',
    '/api/evaluation/v2/agent-stats'
  ]
  
  console.log('\n📊 Testing API Endpoints:')
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`)
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ ${endpoint} - Success`)
        if (data.metrics) console.log(`   Metrics: ${JSON.stringify(data.metrics, null, 2)}`)
        if (data.results) console.log(`   Results: ${data.results.length} items`)
        if (data.prompts) console.log(`   Prompts: ${data.prompts.length} versions`)
        if (data.stats) console.log(`   Agent Stats: ${data.stats.length} agents`)
      } else {
        console.log(`❌ ${endpoint} - Error: ${data.error}`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Failed: ${error.message}`)
    }
  }
}

// Wait a bit for the server to start, then test
setTimeout(testEndpoints, 2000) 