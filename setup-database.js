import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function setupDatabase() {
  console.log('Setting up database tables...')
  
  // Create products table
  const { error: productsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        barcode VARCHAR(20) UNIQUE NOT NULL,
        product_name TEXT,
        brand VARCHAR(200),
        financial_beneficiary VARCHAR(200) NOT NULL,
        beneficiary_country VARCHAR(100) NOT NULL,
        confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
        ownership_structure_type VARCHAR(50),
        research_sources TEXT[],
        research_time_spent INTEGER,
        llm_knowledge TEXT,
        verification_evidence TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_verified TIMESTAMP DEFAULT NOW()
      );
    `
  })

  if (productsError) {
    console.error('Error creating products table:', productsError)
  } else {
    console.log('✅ Products table created successfully')
  }

  // Create scan_logs table
  const { error: logsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY,
        barcode VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        user_location_hint VARCHAR(100),
        result_type VARCHAR(20),
        response_time_ms INTEGER
      );
    `
  })

  if (logsError) {
    console.error('Error creating scan_logs table:', logsError)
  } else {
    console.log('✅ Scan logs table created successfully')
  }
}

setupDatabase()