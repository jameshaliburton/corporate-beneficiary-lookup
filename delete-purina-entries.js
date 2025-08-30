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

async function deletePurinaEntries() {
  try {
    console.log('🗑️ Deleting all Purina entries from database...');
    
    // Delete all Purina entries
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('brand', 'purina');
    
    if (error) {
      console.error('❌ Error deleting Purina entries:', error);
    } else {
      console.log('✅ Successfully deleted all Purina entries');
      console.log('📊 Deleted entries:', data);
    }
    
  } catch (error) {
    console.error('❌ Delete operation failed:', error);
  }
}

deletePurinaEntries();
