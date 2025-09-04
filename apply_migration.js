#!/usr/bin/env node

/**
 * Apply Supabase migration for verification fields
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
    // Check current schema
    console.log('📋 Checking current schema...');
    const { data: currentColumns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'products' });

    if (schemaError) {
      console.log('⚠️  Could not check schema via RPC, proceeding with migration...');
    } else {
      console.log('📊 Current products table columns:', currentColumns?.map(c => c.column_name).join(', '));
    }

    // Apply migration SQL
    const migrationSQL = `
      -- Add verification_status (text)
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'products' 
              AND column_name = 'verification_status'
          ) THEN
              ALTER TABLE products ADD COLUMN verification_status TEXT;
          END IF;
      END $$;

      -- Add verified_at (timestamp)
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'products' 
              AND column_name = 'verified_at'
          ) THEN
              ALTER TABLE products ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
          END IF;
      END $$;

      -- Add verification_method (text)
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'products' 
              AND column_name = 'verification_method'
          ) THEN
              ALTER TABLE products ADD COLUMN verification_method TEXT;
          END IF;
      END $$;

      -- Add verification_notes (text)
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'products' 
              AND column_name = 'verification_notes'
          ) THEN
              ALTER TABLE products ADD COLUMN verification_notes TEXT;
          END IF;
      END $$;

      -- Add confidence_assessment (jsonb)
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'products' 
              AND column_name = 'confidence_assessment'
          ) THEN
              ALTER TABLE products ADD COLUMN confidence_assessment JSONB;
          END IF;
      END $$;

      -- Add verification_evidence (jsonb)
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'products' 
              AND column_name = 'verification_evidence'
          ) THEN
              ALTER TABLE products ADD COLUMN verification_evidence JSONB;
          END IF;
      END $$;

      -- Add verification_confidence_change (text)
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'products' 
              AND column_name = 'verification_confidence_change'
          ) THEN
              ALTER TABLE products ADD COLUMN verification_confidence_change TEXT;
          END IF;
      END $$;
    `;

    console.log('🔧 Applying migration SQL...');
    const { data: migrationResult, error: migrationError } = await supabase
      .rpc('exec_sql', { sql: migrationSQL });

    if (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');

    // Verify the migration
    console.log('🔍 Verifying migration...');
    const { data: verificationColumns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'products')
      .like('column_name', '%verification%');

    if (verifyError) {
      console.log('⚠️  Could not verify migration, but it may have succeeded');
    } else {
      console.log('📊 Verification fields found:', verificationColumns?.map(c => c.column_name).join(', '));
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Test cache functionality');
    console.log('   2. Deploy to Vercel');
    console.log('   3. Monitor production logs');

  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
