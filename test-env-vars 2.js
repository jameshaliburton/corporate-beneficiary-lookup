#!/usr/bin/env node

// Simple test script to verify environment variables
console.log('🔍 Environment Variable Test');
console.log('============================');
console.log('GEMINI_FLASH_V1_ENABLED:', process.env.GEMINI_FLASH_V1_ENABLED);
console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
console.log('GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('============================');

// Test the logic
const GEMINI_FLASH_V1_ENABLED = process.env.GEMINI_FLASH_V1_ENABLED === 'true';
const GEMINI_MODEL = GEMINI_FLASH_V1_ENABLED ? "gemini-1.5-flash" : "gemini-1.5-flash";
const GEMINI_ENDPOINT = GEMINI_FLASH_V1_ENABLED ? "v1" : "v1beta";

console.log('📊 Configuration Results:');
console.log('GEMINI_FLASH_V1_ENABLED:', GEMINI_FLASH_V1_ENABLED);
console.log('GEMINI_MODEL:', GEMINI_MODEL);
console.log('GEMINI_ENDPOINT:', GEMINI_ENDPOINT);
console.log('============================');
