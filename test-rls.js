#!/usr/bin/env node

// Test RLS with service role client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testRLS() {
  console.log('Testing RLS with service role client...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Service role key present:', !!serviceRoleKey);
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing environment variables');
    return;
  }
  
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Test a simple insert
    const { data, error } = await client
      .from('products')
      .insert({
        barcode: `test_${Date.now()}`,
        brand: 'TestBrand',
        product_name: 'TestProduct',
        financial_beneficiary: 'TestOwner',
        confidence_score: 50
      })
      .select();
    
    if (error) {
      console.error('RLS Error:', error);
    } else {
      console.log('Success! Data inserted:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testRLS().catch(console.error);

