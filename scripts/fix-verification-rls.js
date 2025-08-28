#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '../migrations/fix_verification_rls.sql');

console.log('🔧 Fix for ownership_verifications RLS Policy');
console.log('=============================================\n');

if (fs.existsSync(sqlPath)) {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log(sql);
  console.log('\n📋 Instructions:');
  console.log('1. Copy the SQL above');
  console.log('2. Go to your Supabase Dashboard');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Paste and run the SQL');
  console.log('5. This will fix the RLS policy issue');
} else {
  console.error('❌ SQL file not found:', sqlPath);
}
