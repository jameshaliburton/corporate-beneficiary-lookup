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

async function addVerificationFields() {
  try {
    console.log('🔧 Adding verification fields to products table...');
    
    // First, let's check what columns currently exist
    console.log('📋 Checking current schema...');
    const { data: currentColumns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'products');
    
    if (schemaError) {
      console.error('❌ Error checking schema:', schemaError);
      return;
    }
    
    console.log('📋 Current columns:', currentColumns?.map(c => c.column_name).sort());
    
    // Check which verification fields are missing
    const requiredFields = [
      'verification_status',
      'verified_at', 
      'verification_method',
      'verification_notes',
      'confidence_assessment',
      'agent_path'
    ];
    
    const existingColumns = currentColumns?.map(c => c.column_name) || [];
    const missingFields = requiredFields.filter(field => !existingColumns.includes(field));
    
    console.log('🔍 Missing fields:', missingFields);
    
    if (missingFields.length === 0) {
      console.log('✅ All verification fields already exist!');
      return;
    }
    
    // Add missing fields one by one
    for (const field of missingFields) {
      console.log(`➕ Adding field: ${field}`);
      
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
      
      // Use raw SQL to add the column
      const { error } = await supabase.rpc('exec', {
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS ${field} ${columnType};`
      });
      
      if (error) {
        console.error(`❌ Error adding ${field}:`, error);
      } else {
        console.log(`✅ Successfully added ${field}`);
      }
    }
    
    console.log('🎉 Verification fields migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

addVerificationFields();
