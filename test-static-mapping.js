import { lookupOwnershipMapping } from './src/lib/database/ownership-mappings.js'

async function testStaticMapping() {
  console.log('🧪 Testing Static Mapping Lookup...\n')

  try {
    console.log('🔍 Testing "Nestlé" lookup...')
    const startTime = Date.now()
    
    const result = await lookupOwnershipMapping('Nestlé')
    
    const duration = Date.now() - startTime
    console.log(`✅ Lookup completed in ${duration}ms`)
    
    if (result) {
      console.log('✅ Found static mapping:')
      console.log(`   - Owner: ${result.financial_beneficiary}`)
      console.log(`   - Country: ${result.beneficiary_country}`)
      console.log(`   - Confidence: ${result.confidence_score}`)
    } else {
      console.log('❌ No static mapping found for Nestlé')
    }

    console.log('\n🔍 Testing "ICA" lookup...')
    const startTime2 = Date.now()
    
    const result2 = await lookupOwnershipMapping('ICA')
    
    const duration2 = Date.now() - startTime2
    console.log(`✅ Lookup completed in ${duration2}ms`)
    
    if (result2) {
      console.log('✅ Found static mapping:')
      console.log(`   - Owner: ${result2.financial_beneficiary}`)
      console.log(`   - Country: ${result2.beneficiary_country}`)
      console.log(`   - Confidence: ${result2.confidence_score}`)
    } else {
      console.log('❌ No static mapping found for ICA')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testStaticMapping() 