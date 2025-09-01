#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');

console.log('🔑 Update Gemini API Key');
console.log('========================\n');

if (fs.existsSync(envPath)) {
  let content = fs.readFileSync(envPath, 'utf8');
  
  // Check if the key is already updated
  if (content.includes('AIzaSyDGIqKC5N3CG_yG0cUoFuKBjsWrtT4ELFg')) {
    console.log('✅ Gemini API key is already set correctly!');
  } else if (content.includes('<PASTE KEY HERE>')) {
    console.log('📝 Please update your .env.local file:');
    console.log('   Replace: GEMINI_API_KEY=<PASTE KEY HERE>');
    console.log('   With:    GEMINI_API_KEY=AIzaSyDGIqKC5N3CG_yG0cUoFuKBjsWrtT4ELFg');
    console.log('\n💡 You can do this manually in your editor, or run:');
    console.log('   sed -i \'\' "s/<PASTE KEY HERE>/AIzaSyDGIqKC5N3CG_yG0cUoFuKBjsWrtT4ELFg/" .env.local');
  } else {
    console.log('⚠️  GEMINI_API_KEY line not found in .env.local');
    console.log('   Please add: GEMINI_API_KEY=AIzaSyDGIqKC5N3CG_yG0cUoFuKBjsWrtT4ELFg');
  }
} else {
  console.log('❌ .env.local file not found');
  console.log('   Please create it and add: GEMINI_API_KEY=AIzaSyDGIqKC5N3CG_yG0cUoFuKBjsWrtT4ELFg');
}
