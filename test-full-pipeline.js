import { lookupProduct } from './src/lib/apis/barcode-lookup.js'
import { getOwnershipKnowledge } from './src/lib/agents/knowledge-agent.js'
import { verifyOwnership } from './src/lib/agents/verification-agent.js'

async function testFullPipeline(barcode) {
  console.log(`\n🔍 FULL PIPELINE TEST: ${barcode}`)
  console.log('='.repeat(50))
  
  // Step 1: Barcode → Product
  console.log('Step 1: Looking up product...')
  const productResult = await lookupProduct(barcode)
  
  if (!productResult.success) {
    console.log('❌ Product not found')
    return
  }
  
  console.log(`✅ Found: ${productResult.product_name} (${productResult.brand})`)
  
  // Step 2: Product → Knowledge Agent
  console.log('\nStep 2: Getting ownership knowledge...')
  const knowledgeResult = await getOwnershipKnowledge(
    productResult.product_name, 
    productResult.brand
  )
  console.log(`✅ Knowledge: ${knowledgeResult.financial_beneficiary} (${knowledgeResult.beneficiary_country}) - ${knowledgeResult.confidence_score}%`)
  
  // Step 3: Verification
  console.log('\nStep 3: Verifying ownership...')
  const verificationResult = await verifyOwnership(
    knowledgeResult,
    productResult.product_name,
    productResult.brand
  )
  console.log(`✅ Verification: ${verificationResult.verification_status} (${verificationResult.confidence_adjustment > 0 ? '+' : ''}${verificationResult.confidence_adjustment})`)
  
  // Step 4: Final Result
  const finalConfidence = knowledgeResult.confidence_score + verificationResult.confidence_adjustment
  console.log(`\n🎯 FINAL RESULT:`)
  console.log(`Product: ${productResult.product_name}`)
  console.log(`Beneficiary: ${knowledgeResult.financial_beneficiary} (${knowledgeResult.beneficiary_country})`)
  console.log(`Confidence: ${finalConfidence}% (${getConfidenceLabel(finalConfidence)})`)
}

function getConfidenceLabel(score) {
  if (score >= 80) return 'Highly Likely'
  if (score >= 60) return 'Likely'
  if (score >= 20) return 'Unconfirmed'
  return 'Unknown'
}

// Test with our known barcodes
async function runTests() {
  await testFullPipeline('798235653183') // Coca-Cola
  await testFullPipeline('4902201746640') // Kit Kat Japan
}

runTests()