import dotenv from 'dotenv';
import { evaluationFramework } from './src/lib/services/evaluation-framework.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEvaluationInit() {
  try {
    console.log('🔍 Testing Evaluation Framework Initialization...\n');
    
    console.log('📋 Environment check:');
    console.log('  GOOGLE_SERVICE_ACCOUNT_KEY_JSON:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON ? 'SET' : 'NOT SET');
    console.log('  GOOGLE_SHEET_EVALUATION_CASES:', process.env.GOOGLE_SHEET_EVALUATION_CASES || 'DEFAULT');
    console.log('  GOOGLE_SHEET_EVALUATION_RESULTS:', process.env.GOOGLE_SHEET_EVALUATION_RESULTS || 'DEFAULT');
    
    console.log('\n🚀 Initializing evaluation framework...');
    await evaluationFramework.initialize();
    
    console.log('\n📊 Testing evaluation stats...');
    const stats = await evaluationFramework.getEvaluationStats();
    console.log('Stats:', JSON.stringify(stats, null, 2));
    
    console.log('\n📋 Testing evaluation cases...');
    const cases = await evaluationFramework.getEvaluationCases();
    console.log('Cases:', cases.length);
    
    console.log('\n✅ Evaluation framework test complete!');
    
  } catch (error) {
    console.error('❌ Error testing evaluation framework:', error);
  }
}

testEvaluationInit(); 