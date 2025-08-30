import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPurinaInDB() {
  try {
    console.log('🔍 Checking Purina entries in database...');
    
    // Check for brand + product entries
    const { data: brandProductData, error: brandProductError } = await supabase
      .from('products')
      .select('*')
      .eq('brand', 'purina')
      .eq('product_name', 'dog food');
    
    if (brandProductError) {
      console.error('❌ Error querying brand+product:', brandProductError);
    } else {
      console.log('📋 Brand + Product entries:', brandProductData?.length || 0);
      if (brandProductData && brandProductData.length > 0) {
        brandProductData.forEach((entry, index) => {
          console.log(`📋 Entry ${index + 1}:`, {
            id: entry.id,
            brand: entry.brand,
            product_name: entry.product_name,
            financial_beneficiary: entry.financial_beneficiary,
            verification_status: entry.verification_status,
            verified_at: entry.verified_at,
            verification_method: entry.verification_method,
            verification_notes: entry.verification_notes,
            confidence_assessment: entry.confidence_assessment,
            agent_path: entry.agent_path,
            created_at: entry.created_at,
            updated_at: entry.updated_at
          });
        });
      }
    }
    
    // Check for brand-only entries
    const { data: brandData, error: brandError } = await supabase
      .from('products')
      .select('*')
      .eq('brand', 'purina')
      .is('product_name', null);
    
    if (brandError) {
      console.error('❌ Error querying brand-only:', brandError);
    } else {
      console.log('📋 Brand-only entries:', brandData?.length || 0);
      if (brandData && brandData.length > 0) {
        brandData.forEach((entry, index) => {
          console.log(`📋 Brand-only Entry ${index + 1}:`, {
            id: entry.id,
            brand: entry.brand,
            product_name: entry.product_name,
            financial_beneficiary: entry.financial_beneficiary,
            verification_status: entry.verification_status,
            verified_at: entry.verified_at,
            verification_method: entry.verification_method,
            verification_notes: entry.verification_notes,
            confidence_assessment: entry.confidence_assessment,
            agent_path: entry.agent_path,
            created_at: entry.created_at,
            updated_at: entry.updated_at
          });
        });
      }
    }
    
    // Check all Purina entries
    const { data: allPurinaData, error: allPurinaError } = await supabase
      .from('products')
      .select('*')
      .eq('brand', 'purina');
    
    if (allPurinaError) {
      console.error('❌ Error querying all Purina:', allPurinaError);
    } else {
      console.log('📋 All Purina entries:', allPurinaData?.length || 0);
      if (allPurinaData && allPurinaData.length > 0) {
        allPurinaData.forEach((entry, index) => {
          console.log(`📋 All Purina Entry ${index + 1}:`, {
            id: entry.id,
            brand: entry.brand,
            product_name: entry.product_name,
            financial_beneficiary: entry.financial_beneficiary,
            verification_status: entry.verification_status,
            verified_at: entry.verified_at,
            verification_method: entry.verification_method,
            verification_notes: entry.verification_notes,
            confidence_assessment: entry.confidence_assessment,
            agent_path: entry.agent_path,
            created_at: entry.created_at,
            updated_at: entry.updated_at
          });
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkPurinaInDB();
