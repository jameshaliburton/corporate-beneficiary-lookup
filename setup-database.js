import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupKnowledgeBase() {
  try {
    console.log('🔧 Setting up knowledge_base table...');
    
    // Create the knowledge_base table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS knowledge_base (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          company_name VARCHAR(255) NOT NULL,
          brand_name VARCHAR(255),
          alternative_names TEXT[],
          
          parent_company VARCHAR(255),
          ultimate_owner VARCHAR(255),
          ownership_structure_type VARCHAR(100),
          
          country VARCHAR(100),
          region VARCHAR(100),
          headquarters VARCHAR(255),
          
          industry VARCHAR(100),
          business_type VARCHAR(100),
          founded_year INTEGER,
          
          source_url TEXT,
          source_type VARCHAR(50),
          confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
          
          notes TEXT,
          tags TEXT[]
        );
      `
    });

    if (createError) {
      console.error('Error creating table:', createError);
      return;
    }

    console.log('✅ knowledge_base table created successfully');

    // Insert sample data
    const { error: insertError } = await supabase
      .from('knowledge_base')
      .upsert([
        {
          company_name: 'Malmö Chokladfabrik AB',
          brand_name: 'Malmö Chokladfabrik',
          ultimate_owner: 'Malmö Chokladfabrik AB',
          country: 'Sweden',
          industry: 'Food & Beverage',
          confidence_score: 90,
          source_type: 'manual'
        },
        {
          company_name: 'Atlantic Grupa d.d.',
          brand_name: 'Argeta',
          ultimate_owner: 'Atlantic Grupa d.d.',
          country: 'Croatia',
          industry: 'Food & Beverage',
          confidence_score: 95,
          source_type: 'manual'
        }
      ], { onConflict: 'company_name' });

    if (insertError) {
      console.error('Error inserting sample data:', insertError);
    } else {
      console.log('✅ Sample data inserted successfully');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupKnowledgeBase();