import { getRecentScans } from './src/lib/database/products.js';

async function checkRecentActivity() {
  try {
    console.log('🔍 Checking recent mobile visual scan activity...');
    
    const result = await getRecentScans(10);
    
    if (result.success) {
      console.log(`✅ Found ${result.data.length} recent scans:`);
      
      result.data.forEach((scan, index) => {
        console.log(`\n${index + 1}. Brand: ${scan.brand || 'Unknown'}`);
        console.log(`   Product: ${scan.product_name || 'Unknown'}`);
        console.log(`   Created: ${scan.created_at}`);
        console.log(`   Confidence: ${scan.confidence_score || 'N/A'}`);
        console.log(`   Verification: ${scan.verification_status || 'N/A'}`);
        console.log(`   Result Type: ${scan.result_type || 'N/A'}`);
        
        if (scan.gemini_evidence_analysis) {
          console.log(`   Gemini Analysis: ${scan.gemini_evidence_analysis ? 'Present' : 'Missing'}`);
        }
        
        if (scan.agent_execution_trace) {
          console.log(`   Agent Trace: ${scan.agent_execution_trace ? 'Present' : 'Missing'}`);
        }
      });
      
      // Check for web search snippets in the data
      const withWebSearch = result.data.filter(scan => 
        scan.gemini_evidence_analysis && 
        JSON.stringify(scan.gemini_evidence_analysis).includes('snippet')
      );
      
      console.log(`\n📊 Summary:`);
      console.log(`   Total scans: ${result.data.length}`);
      console.log(`   With web search snippets: ${withWebSearch.length}`);
      console.log(`   With Gemini analysis: ${result.data.filter(s => s.gemini_evidence_analysis).length}`);
      console.log(`   With agent traces: ${result.data.filter(s => s.agent_execution_trace).length}`);
      
    } else {
      console.log('❌ Failed to get recent scans:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Error checking recent activity:', error.message);
  }
}

checkRecentActivity();

