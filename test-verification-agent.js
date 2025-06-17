import { getOwnershipKnowledge } from './src/lib/agents/knowledge-agent.js'
import { verifyOwnership } from './src/lib/agents/verification-agent.js'

async function testVerificationAgent() {
  console.log('Testing Verification Agent...\n')
  
  // Test 1: Kit Kat Japan (should verify Nestlé ownership)
  console.log('1. Testing Kit Kat Japan Verification:')
  try {
    // First get Knowledge Agent result
    const knowledgeResult = await getOwnershipKnowledge('Kit Kat Mini Uji Matcha Tea', 'Nestlé')
    console.log('Knowledge Agent says:', JSON.stringify(knowledgeResult, null, 2))
    
    // Then verify it
    const verificationResult = await verifyOwnership(knowledgeResult, 'Kit Kat Mini Uji Matcha Tea', 'Nestlé')
    console.log('Verification result:', JSON.stringify(verificationResult, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(60) + '\n')
  
  // Test 2: Coca-Cola (should easily verify)
  console.log('2. Testing Coca-Cola Verification:')
  try {
    const knowledgeResult = await getOwnershipKnowledge('Coca-Cola Coke Zero', 'Coca-Cola')
    console.log('Knowledge Agent says:', JSON.stringify(knowledgeResult, null, 2))
    
    const verificationResult = await verifyOwnership(knowledgeResult, 'Coca-Cola Coke Zero', 'Coca-Cola')
    console.log('Verification result:', JSON.stringify(verificationResult, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(60) + '\n')
  
  // Test 3: Fictional brand (should catch Knowledge Agent hallucination)
  console.log('3. Testing Fictional Brand (Hallucination Detection):')
  try {
    const knowledgeResult = await getOwnershipKnowledge('Fake Product XYZ', 'Unknown Brand')
    console.log('Knowledge Agent says:', JSON.stringify(knowledgeResult, null, 2))
    
    const verificationResult = await verifyOwnership(knowledgeResult, 'Fake Product XYZ', 'Unknown Brand')
    console.log('Verification result:', JSON.stringify(verificationResult, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testVerificationAgent()