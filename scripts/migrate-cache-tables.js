// Script to run the cache tables migration using Supabase client
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  try {
    // Import the Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      console.log('Required environment variables:');
      console.log('- NEXT_PUBLIC_SUPABASE_URL');
      console.log('- SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../migrations/create_cache_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Running cache tables migration...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Fallback: try to execute the SQL directly
      console.log('🔄 Trying direct SQL execution...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.warn(`⚠️ Statement failed: ${stmtError.message}`);
          }
        }
      }
    } else {
      console.log('✅ Migration completed successfully');
    }
    
    // Verify tables exist
    console.log('🔍 Verifying tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['candidate_cache', 'entity_report_cache']);
    
    if (tablesError) {
      console.error('❌ Could not verify tables:', tablesError);
    } else {
      const tableNames = tables.map(t => t.table_name);
      console.log('📋 Found tables:', tableNames);
      
      if (tableNames.includes('candidate_cache') && tableNames.includes('entity_report_cache')) {
        console.log('✅ All cache tables created successfully!');
      } else {
        console.log('⚠️ Some tables may be missing');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    console.log('\n📝 Manual migration required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL from migrations/create_cache_tables.sql');
    console.log('4. Execute the migration');
  }
}

runMigration();
