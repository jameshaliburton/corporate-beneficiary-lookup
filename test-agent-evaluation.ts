// Test script for Agent Behavior Evaluation
import { AgentOwnershipResearch, getEvaluationMetrics, resetEvaluationMetrics } from './src/lib/agents/ownership-research-agent.js'
import { WebResearchAgent } from './src/lib/agents/web-research-agent.js'
import dotenv from 'dotenv'
import fs from 'fs/promises'

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' })
}

// Type definitions
interface ExpectedResult {
  financial_beneficiary: string
  beneficiary_country: string
  ownership_structure_type: string
  min_confidence: number
}

interface TestCase {
  barcode: string
  product_name: string
  brand: string
  expected: ExpectedResult
}

interface ValidationResult {
  testCase: TestCase
  result?: any
  validations?: string[]
  error?: string
}

// Test cases with known correct ownership
const testCases: TestCase[] = [
  {
    barcode: '7310865004703',
    product_name: 'ICA Basic Solrosolja',
    brand: 'ICA',
    expected: {
      financial_beneficiary: 'ICA Gruppen AB',
      beneficiary_country: 'Sweden',
      ownership_structure_type: 'Public',
      min_confidence: 70
    }
  },
  {
    barcode: '7310130007540',
    product_name: 'Apoteket Alvedon',
    brand: 'Apoteket',
    expected: {
      financial_beneficiary: 'Swedish Government',
      beneficiary_country: 'Sweden',
      ownership_structure_type: 'State-owned',
      min_confidence: 70
    }
  },
  {
    barcode: '7310865088307',
    product_name: 'Coop Änglamark Organic Milk',
    brand: 'Coop',
    expected: {
      financial_beneficiary: 'KF (Kooperativa Förbundet)',
      beneficiary_country: 'Sweden',
      ownership_structure_type: 'Cooperative',
      min_confidence: 70
    }
  },
  {
    barcode: '4902201416894',
    product_name: 'Kit Kat',
    brand: 'Kit Kat',
    expected: {
      financial_beneficiary: 'Nestlé S.A.',
      beneficiary_country: 'Switzerland',
      ownership_structure_type: 'Public',
      min_confidence: 80
    }
  },
  {
    barcode: '0000000000000',
    product_name: 'Unknown Product',
    brand: 'Unknown Brand',
    expected: {
      financial_beneficiary: 'Unknown',
      beneficiary_country: 'Unknown',
      ownership_structure_type: 'Unknown',
      min_confidence: 20
    }
  }
]

async function runEvaluation() {
  console.log('🧪 Starting Agent Evaluation\n')
  
  // Reset evaluation metrics
  resetEvaluationMetrics()
  
  const results: ValidationResult[] = []
  let totalTests = 0
  let passedTests = 0
  
  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.brand} - ${testCase.product_name}`)
    
    try {
      const result = await AgentOwnershipResearch({
        barcode: testCase.barcode,
        product_name: testCase.product_name,
        brand: testCase.brand,
        enableEvaluation: true
      })
      
      // Validate results
      const validations = []
      totalTests += 4 // Financial beneficiary, country, structure type, confidence
      
      // Check financial beneficiary
      if (result.financial_beneficiary === testCase.expected.financial_beneficiary) {
        validations.push('✅ Financial beneficiary correct')
        passedTests++
      } else {
        validations.push(`❌ Financial beneficiary incorrect: got "${result.financial_beneficiary}", expected "${testCase.expected.financial_beneficiary}"`)
      }
      
      // Check beneficiary country
      if (result.beneficiary_country === testCase.expected.beneficiary_country) {
        validations.push('✅ Beneficiary country correct')
        passedTests++
      } else {
        validations.push(`❌ Beneficiary country incorrect: got "${result.beneficiary_country}", expected "${testCase.expected.beneficiary_country}"`)
      }
      
      // Check ownership structure type
      if (result.ownership_structure_type === testCase.expected.ownership_structure_type) {
        validations.push('✅ Ownership structure type correct')
        passedTests++
      } else {
        validations.push(`❌ Ownership structure type incorrect: got "${result.ownership_structure_type}", expected "${testCase.expected.ownership_structure_type}"`)
      }
      
      // Check confidence score
      if (result.confidence_score >= testCase.expected.min_confidence) {
        validations.push(`✅ Confidence score sufficient: ${result.confidence_score}`)
        passedTests++
      } else {
        validations.push(`❌ Confidence score too low: got ${result.confidence_score}, expected >= ${testCase.expected.min_confidence}`)
      }
      
      // Log results
      console.log('\nValidation Results:')
      validations.forEach(v => console.log(v))
      
      // Log sources and reasoning
      console.log('\nSources Used:', result.sources)
      console.log('Reasoning:', result.reasoning)
      
      results.push({
        testCase,
        result,
        validations
      })
      
    } catch (error) {
      console.error(`Error testing ${testCase.brand}:`, error)
      results.push({
        testCase,
        error: error.message
      })
    }
  }
  
  // Print summary
  console.log('\n📊 Evaluation Summary')
  console.log('====================')
  console.log(`Total Test Cases: ${testCases.length}`)
  console.log(`Total Tests Run: ${totalTests}`)
  console.log(`Tests Passed: ${passedTests}`)
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
  
  // Get evaluation metrics
  const metrics = await getEvaluationMetrics()
  
  console.log('\n📈 Performance Metrics')
  console.log('====================')
  console.log(`Average Response Time: ${metrics.avgResponseTime}ms`)
  console.log(`Average Source Quality: ${metrics.avgSourceQuality}`)
  console.log(`Ignored Viable Sources: ${metrics.ignoredViableSources}`)
  console.log(`Web Research Usage: ${metrics.usedWebResearch}/${testCases.length}`)
  
  console.log('\n⚠️ Warning Types')
  console.log('====================')
  console.log('Regional Assumptions:', metrics.warningTypes.regionalAssumptions)
  console.log('Circular Ownership:', metrics.warningTypes.circularOwnership)
  console.log('Conflicting Information:', metrics.warningTypes.conflictingInformation)
  console.log('Low Quality Sources:', metrics.warningTypes.lowQualitySources)
  console.log('Insufficient Evidence:', metrics.warningTypes.insufficientEvidence)
  console.log('No Country Evidence:', metrics.warningTypes.noCountryEvidence)
  console.log('No Structure Evidence:', metrics.warningTypes.noStructureEvidence)
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const resultsFile = `evaluation-results-${timestamp}.json`
  
  await fs.writeFile(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalCases: testCases.length,
      totalTests,
      passedTests,
      successRate: (passedTests / totalTests) * 100
    },
    metrics,
    results
  }, null, 2))
  
  console.log(`\n💾 Full results saved to ${resultsFile}`)
}

// Run the evaluation
runEvaluation().catch(console.error) 