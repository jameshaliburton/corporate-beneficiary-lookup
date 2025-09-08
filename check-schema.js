const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check Coca-Cola entries specifically
    const { data, error } = await supabase
      .from('products')
      .select('brand, verification_status, verification_method, financial_beneficiary')
      .ilike('brand', '%coca%');

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Coca-Cola entries:');
      data.forEach(entry => {
        console.log(`Brand: ${entry.brand}`);
        console.log(`  verification_status: ${entry.verification_status}`);
        console.log(`  verification_method: ${entry.verification_method}`);
        console.log(`  financial_beneficiary: ${entry.financial_beneficiary}`);
        console.log('---');
      });
    } else {
      console.log('No Coca-Cola entries found');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSchema();
