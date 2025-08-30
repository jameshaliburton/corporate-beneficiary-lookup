import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runGeminiMigration() {
  try {
    console.log('🔧 Running Gemini verification fields migration...');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync('add_gemini_verification_fields.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Executing statement...');
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement.trim() + ';'
        });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('🎉 Gemini verification fields migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runGeminiMigration();
