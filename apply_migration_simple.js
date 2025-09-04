#!/usr/bin/env node

/**
 * Apply Supabase migration for verification fields - Simple approach
 * This script applies the missing verification fields to the products table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  console.log('🚀 Starting Supabase migration for verification fields...');
  
  // Check if we have the required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL:', !!process.env.SUPABASE_URL);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Test connection first
    console.log('🔌 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Connection test failed:', testError);
      process.exit(1);
    }

    console.log('✅ Connection successful!');

    // Check current schema by trying to select verification fields
    console.log('📋 Checking current schema...');
    const { data: schemaTest, error: schemaError } = await supabase
      .from('products')
      .select('verification_status, verified_at, verification_method, verification_notes, confidence_assessment, verification_evidence, verification_confidence_change')
      .limit(1);

    if (schemaError && schemaError.code === 'PGRST204') {
      console.log('📊 Schema check: Verification fields are missing (expected)');
    } else if (schemaError) {
      console.log('⚠️  Schema check error:', schemaError.message);
    } else {
      console.log('📊 Schema check: Verification fields already exist');
      console.log('✅ Migration may already be applied');
      return;
    }

    console.log('⚠️  Note: This script can only verify the schema, not modify it.');
    console.log('📝 To apply the migration, please run this SQL in your Supabase SQL Editor:');
    console.log('');
    console.log('-- Add verification fields to products table');
    console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_status TEXT;');
    console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;');
    console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_method TEXT;');
    console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_notes TEXT;');
    console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS confidence_assessment JSONB;');
    console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_evidence JSONB;');
    console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_confidence_change TEXT;');
    console.log('');
    console.log('-- Verify the migration');
    console.log("SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name LIKE '%verification%';");
    console.log('');
    console.log('🎯 After applying the migration, run the cache tests to verify functionality.');

  } catch (error) {
    console.error('❌ Migration check failed with error:', error);
    process.exit(1);
  }
}

// Run the migration check
applyMigration();
