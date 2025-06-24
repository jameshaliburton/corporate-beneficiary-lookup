import { lookupOwnershipMapping, mappingToResult } from './src/lib/database/ownership-mappings.js'

async function testMappingToResult() {
  console.log('🧪 Testing Mapping to Result Conversion...\n')

  try {
    console.log('🔍 Testing "Nestlé" lookup and conversion...')
    const mapping = await lookupOwnershipMapping('Nestlé')
    
    if (mapping) {
      console.log('✅ Raw mapping found:')
      console.log(`   - Brand: ${mapping.brand_name}`)
      console.log(`   - Ultimate Owner: ${mapping.ultimate_owner_name}`)
      console.log(`   - Country: ${mapping.ultimate_owner_country}`)
      
      console.log('\n🔄 Converting to result format...')
      const result = mappingToResult(mapping)
      
      if (result) {
        console.log('✅ Conversion successful:')
        console.log(`   - Financial Beneficiary: ${result.financial_beneficiary}`)
        console.log(`   - Country: ${result.beneficiary_country}`)
        console.log(`   - Confidence: ${result.confidence_score}%`)
        console.log(`   - Result Type: ${result.result_type}`)
        console.log(`   - Sources: ${result.sources.join(', ')}`)
      } else {
        console.log('❌ Conversion failed')
      }
    } else {
      console.log('❌ No mapping found for Nestlé')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testMappingToResult() 