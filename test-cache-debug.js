import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCacheForBrands() {
  console.log('🔍 Checking cache for Pepsi and Doritos...')
  
  try {
    // Check for Pepsi
    const { data: pepsiData, error: pepsiError } = await supabase
      .from('products')
      .select('*')
      .ilike('brand', '%pepsi%')
      .limit(5)
    
    if (pepsiError) {
      console.error('❌ Error querying Pepsi data:', pepsiError)
    } else {
      console.log('📊 Pepsi cache entries:', pepsiData?.length || 0)
      if (pepsiData && pepsiData.length > 0) {
        console.log('📋 Pepsi data:', JSON.stringify(pepsiData[0], null, 2))
      }
    }
    
    // Check for Doritos
    const { data: doritosData, error: doritosError } = await supabase
      .from('products')
      .select('*')
      .ilike('brand', '%doritos%')
      .limit(5)
    
    if (doritosError) {
      console.error('❌ Error querying Doritos data:', doritosError)
    } else {
      console.log('📊 Doritos cache entries:', doritosData?.length || 0)
      if (doritosData && doritosData.length > 0) {
        console.log('📋 Doritos data:', JSON.stringify(doritosData[0], null, 2))
      }
    }
    
    // Check for any entries with ownership_flow that might be causing issues
    const { data: ownershipFlowData, error: ownershipFlowError } = await supabase
      .from('products')
      .select('brand, ownership_flow')
      .not('ownership_flow', 'is', null)
      .limit(5)
    
    if (ownershipFlowError) {
      console.error('❌ Error querying ownership_flow data:', ownershipFlowError)
    } else {
      console.log('📊 Products with ownership_flow:', ownershipFlowData?.length || 0)
      if (ownershipFlowData && ownershipFlowData.length > 0) {
        console.log('📋 Sample ownership_flow data:', JSON.stringify(ownershipFlowData[0], null, 2))
      }
    }
    
  } catch (error) {
    console.error('❌ Database query failed:', error)
  }
}

checkCacheForBrands() 