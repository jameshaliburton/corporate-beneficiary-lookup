import { getOwnershipKnowledge } from './src/lib/agents/knowledge-agent.js'

async function testKnowledgeAgent() {
  console.log('Testing Knowledge Agent...\n')
  
  // Test 1: Kit Kat Japan (complex subsidiary case)
  console.log('1. Testing Kit Kat Japan:')
  try {
    const result1 = await getOwnershipKnowledge('Kit Kat Mini Uji Matcha Tea', 'Nestlé')
    console.log(JSON.stringify(result1, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 2: Coca-Cola (simple direct ownership)
  console.log('2. Testing Coca-Cola:')
  try {
    const result2 = await getOwnershipKnowledge('Coca-Cola Coke Zero', 'Coca-Cola')
    console.log(JSON.stringify(result2, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 3: Unknown/fictional brand (error handling)
  console.log('3. Testing Unknown Brand:')
  try {
    const result3 = await getOwnershipKnowledge('Fake Product XYZ', 'Unknown Brand')
    console.log(JSON.stringify(result3, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testKnowledgeAgent()