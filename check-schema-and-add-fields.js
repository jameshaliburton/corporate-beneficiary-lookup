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

async function checkSchemaAndAddFields() {
  try {
    console.log('🔧 Checking products table schema and adding verification fields...');
    
    // First, let's check what columns currently exist by querying the products table
    console.log('📋 Checking current schema by querying products table...');
    const { data: sampleData, error: queryError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (queryError) {
      console.error('❌ Error querying products table:', queryError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('📋 Current columns in products table:', Object.keys(sampleData[0]).sort());
    } else {
      console.log('📋 No data in products table, checking schema differently...');
    }
    
    // Check which verification fields are missing
    const requiredFields = [
      'verification_status',
      'verified_at', 
      'verification_method',
      'verification_notes',
      'confidence_assessment',
      'agent_path'
    ];
    
    const existingColumns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
    const missingFields = requiredFields.filter(field => !existingColumns.includes(field));
    
    console.log('🔍 Missing fields:', missingFields);
    
    if (missingFields.length === 0) {
      console.log('✅ All verification fields already exist!');
      return;
    }
    
    console.log('⚠️  Missing fields detected. You need to add these fields to the products table:');
    console.log('📝 SQL to run in Supabase SQL Editor:');
    console.log('');
    
    missingFields.forEach(field => {
      let columnType;
      switch (field) {
        case 'verification_status':
        case 'verification_method':
        case 'verification_notes':
          columnType = 'TEXT';
          break;
        case 'verified_at':
          columnType = 'TIMESTAMPTZ';
          break;
        case 'confidence_assessment':
          columnType = 'JSONB';
          break;
        case 'agent_path':
          columnType = 'TEXT[]';
          break;
        default:
          columnType = 'TEXT';
      }
      console.log(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ${field} ${columnType};`);
    });
    
    console.log('');
    console.log('💡 Copy and paste these SQL statements into your Supabase SQL Editor to add the missing fields.');
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchemaAndAddFields();
