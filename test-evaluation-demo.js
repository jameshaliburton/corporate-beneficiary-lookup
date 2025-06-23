// Demo script for Agent Evaluation System
import { AgentOwnershipResearch, getEvaluationMetrics, resetEvaluationMetrics } from './src/lib/agents/ownership-research-agent.js'

async function demoEvaluationSystem() {
  console.log('🎯 Agent Evaluation System Demo')
  console.log('================================\n')

  // Reset metrics for clean demo
  resetEvaluationMetrics()
  console.log('✅ Reset evaluation metrics\n')

  // Demo test cases
  const demoCases = [
    {
      name: "Well-known brand (Kit Kat)",
      brand: "Kit Kat",
      product_name: "Kit Kat Chocolate Bar",
      expectedOutcome: "Should find Nestlé ownership with high confidence"
    },
    {
      name: "Unknown brand",
      brand: "Unknown Brand XYZ",
      product_name: "Test Product",
      expectedOutcome: "Should return Unknown with low confidence"
    },
    {
      name: "Brand with hints",
      brand: "Local Brand",
      product_name: "Local Product",
      hints: { country_of_origin: "United States" },
      expectedOutcome: "Should use hints but be conservative"
    }
  ]

  console.log('🧪 Running demo test cases...\n')

  for (const testCase of demoCases) {
    console.log(`📦 Testing: ${testCase.name}`)
    console.log(`   Expected: ${testCase.expectedOutcome}`)

    try {
      const startTime = Date.now()
      const result = await AgentOwnershipResearch({
        barcode: `demo_${Date.now()}`,
        product_name: testCase.product_name,
        brand: testCase.brand,
        hints: testCase.hints || {},
        enableEvaluation: true
      })
      const responseTime = Date.now() - startTime

      console.log(`   ✅ Result: ${result.financial_beneficiary} (${result.confidence_score}% confidence)`)
      console.log(`   🌍 Country: ${result.beneficiary_country}`)
      console.log(`   ⏱️  Response Time: ${responseTime}ms`)
      console.log(`   🔍 Web Research: ${result.web_research_used ? 'Used' : 'Not used'}`)

      if (result.evaluation) {
        console.log(`   📊 Evaluation Data:`)
        console.log(`      - Source Quality Score: ${result.evaluation.sourceQualityScore}`)
        console.log(`      - Viable Sources Ignored: ${result.evaluation.viableSourcesIgnored}`)
        console.log(`      - Hallucination Indicators: ${result.evaluation.hallucinationIndicators.length}`)
        
        if (result.evaluation.hallucinationIndicators.length > 0) {
          console.log(`         Indicators: ${result.evaluation.hallucinationIndicators.join(', ')}`)
        }
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }

    console.log('')
  }

  // Display comprehensive metrics
  console.log('📊 EVALUATION METRICS SUMMARY')
  console.log('==============================')
  
  const metrics = getEvaluationMetrics()
  console.log(`Total Queries: ${metrics.totalQueries}`)
  console.log(`Success Rate: ${metrics.successRate}%`)
  console.log(`Average Response Time: ${metrics.avgResponseTime}ms`)
  console.log(`Average Source Quality: ${metrics.avgSourceQuality}`)
  console.log(`Web Research Usage: ${metrics.usedWebResearch}/${metrics.totalQueries}`)
  console.log(`Ignored Viable Sources: ${metrics.ignoredViableSources}`)
  console.log(`Hallucination Detected: ${metrics.hallucinationDetected}`)

  if (Object.keys(metrics.failurePatterns).length > 0) {
    console.log('\n🔍 Failure Patterns:')
    for (const [pattern, count] of Object.entries(metrics.failurePatterns)) {
      console.log(`  ${pattern}: ${count} occurrences`)
    }
  }

  if (Object.keys(metrics.sourceUsagePatterns).length > 0) {
    console.log('\n📚 Source Usage Patterns:')
    for (const [pattern, count] of Object.entries(metrics.sourceUsagePatterns)) {
      const [available, used] = pattern.split('_').map(Number)
      console.log(`  ${used}/${available} sources used: ${count} times`)
    }
  }

  // Generate recommendations
  console.log('\n💡 RECOMMENDATIONS:')
  if (metrics.successRate < 70) {
    console.log('🔴 Low success rate - Consider improving source parsing')
  }
  if (metrics.hallucinationDetected > 0) {
    console.log('🔴 Hallucination detected - Strengthen validation rules')
  }
  if (metrics.ignoredViableSources > 0) {
    console.log('🟡 Sources being ignored - Improve source prioritization')
  }
  if (metrics.avgSourceQuality < 60) {
    console.log('🟡 Low source quality - Implement better credibility scoring')
  }
  if (metrics.successRate >= 80 && metrics.hallucinationDetected === 0) {
    console.log('✅ Agent performing well across all metrics')
  }

  console.log('\n🎯 Demo complete!')
  console.log('\n💡 Next steps:')
  console.log('   1. Run the full evaluation test: node test-agent-evaluation.ts')
  console.log('   2. View the dashboard: npm run dev and visit /evaluation')
  console.log('   3. Monitor metrics via API: GET /api/evaluation')
}

// Run the demo
demoEvaluationSystem().catch(console.error) 