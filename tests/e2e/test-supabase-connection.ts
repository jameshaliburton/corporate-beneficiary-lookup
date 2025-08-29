#!/usr/bin/env npx tsx

/**
 * Supabase Connection Test
 * Tests direct Supabase connection and RLS policies
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testSupabaseConnection(): Promise<void> {
  console.log('🔌 SUPABASE CONNECTION TEST');
  console.log('===========================');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Environment Variables:');
  console.log(`  SUPABASE_URL: ${supabaseUrl ? 'SET' : 'NOT SET'}`);
  console.log(`  SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'NOT SET'}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? 'SET' : 'NOT SET'}`);
  
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.log('❌ Missing required environment variables');
    return;
  }
  
  // Test with anon client
  console.log('\n🔍 Testing with ANON client...');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: anonData, error: anonError } = await anonClient
      .from('products')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log(`❌ Anon client error: ${anonError.message}`);
      console.log(`   Code: ${anonError.code}`);
      console.log(`   Details: ${anonError.details}`);
    } else {
      console.log(`✅ Anon client read successful: ${anonData?.length || 0} records`);
    }
  } catch (error) {
    console.log(`❌ Anon client exception: ${error}`);
  }
  
  // Test with service role client
  console.log('\n🔍 Testing with SERVICE ROLE client...');
  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('products')
      .select('*')
      .limit(1);
    
    if (serviceError) {
      console.log(`❌ Service client error: ${serviceError.message}`);
      console.log(`   Code: ${serviceError.code}`);
      console.log(`   Details: ${serviceError.details}`);
    } else {
      console.log(`✅ Service client read successful: ${serviceData?.length || 0} records`);
    }
  } catch (error) {
    console.log(`❌ Service client exception: ${error}`);
  }
  
  // Test write with service role client
  console.log('\n🔍 Testing WRITE with SERVICE ROLE client...');
  const testData = {
    brand: 'test_brand',
    product_name: 'test_product',
    financial_beneficiary: 'Test Company',
    confidence_score: 95,
    updated_at: new Date().toISOString()
  };
  
  try {
    const { data: writeData, error: writeError } = await serviceClient
      .from('products')
      .upsert([testData])
      .select();
    
    if (writeError) {
      console.log(`❌ Service client write error: ${writeError.message}`);
      console.log(`   Code: ${writeError.code}`);
      console.log(`   Details: ${writeError.details}`);
      console.log(`   Hint: ${writeError.hint}`);
    } else {
      console.log(`✅ Service client write successful: ${writeData?.length || 0} records written`);
      
      // Clean up test data
      await serviceClient
        .from('products')
        .delete()
        .eq('brand', 'test_brand')
        .eq('product_name', 'test_product');
      console.log('🧹 Test data cleaned up');
    }
  } catch (error) {
    console.log(`❌ Service client write exception: ${error}`);
  }
  
  // Test write with anon client (should fail)
  console.log('\n🔍 Testing WRITE with ANON client (should fail)...');
  try {
    const { data: anonWriteData, error: anonWriteError } = await anonClient
      .from('products')
      .upsert([testData])
      .select();
    
    if (anonWriteError) {
      console.log(`✅ Anon client write correctly blocked: ${anonWriteError.message}`);
      console.log(`   Code: ${anonWriteError.code}`);
    } else {
      console.log(`⚠️ Anon client write unexpectedly succeeded: ${anonWriteData?.length || 0} records`);
    }
  } catch (error) {
    console.log(`✅ Anon client write correctly blocked: ${error}`);
  }
}

// Run the test
if (require.main === module) {
  testSupabaseConnection().catch(console.error);
}

export { testSupabaseConnection };
