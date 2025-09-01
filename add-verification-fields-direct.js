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

async function addVerificationFieldsDirect() {
  try {
    console.log('🔧 Attempting to add verification fields by inserting test data...');
    
    // Try to insert a test record with verification fields
    // This might trigger Supabase to add the columns automatically
    const testRecord = {
      barcode: 'test_verification_fields_' + Date.now(),
      brand: 'test_brand',
      product_name: 'test_product',
      financial_beneficiary: 'Test Company',
      confidence_score: 50,
      // Try to add verification fields
      verification_status: 'test',
      verified_at: new Date().toISOString(),
      verification_method: 'test_method',
      verification_notes: 'test_notes',
      confidence_assessment: { test: true },
      agent_path: ['test_path']
    };
    
    console.log('📝 Inserting test record with verification fields...');
    const { data, error } = await supabase
      .from('products')
      .insert(testRecord)
      .select();
    
    if (error) {
      console.error('❌ Error inserting test record:', error);
      console.log('💡 This confirms the verification fields don\'t exist in the schema.');
      console.log('📝 You need to run the SQL migration manually in Supabase SQL Editor:');
      console.log('');
      console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_status TEXT;');
      console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;');
      console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_method TEXT;');
      console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_notes TEXT;');
      console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS confidence_assessment JSONB;');
      console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS agent_path TEXT[];');
      console.log('');
      return;
    }
    
    console.log('✅ Test record inserted successfully!');
    console.log('🧹 Cleaning up test record...');
    
    // Clean up the test record
    if (data && data.length > 0) {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', data[0].id);
      
      if (deleteError) {
        console.error('⚠️  Warning: Could not delete test record:', deleteError);
      } else {
        console.log('✅ Test record cleaned up successfully');
      }
    }
    
    console.log('🎉 Verification fields should now be available in the products table!');
    
  } catch (error) {
    console.error('❌ Direct field addition failed:', error);
  }
}

addVerificationFieldsDirect();
