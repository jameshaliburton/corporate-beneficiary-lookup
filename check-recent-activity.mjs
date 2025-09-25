import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentActivity() {
  try {
    console.log('🔍 Checking recent mobile visual scan activity...');
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Failed to get recent scans:', error);
      return;
    }
    
    console.log(`✅ Found ${data.length} recent scans:`);
    
    data.forEach((scan, index) => {
      console.log(`\n${index + 1}. Brand: ${scan.brand || 'Unknown'}`);
      console.log(`   Product: ${scan.product_name || 'Unknown'}`);
      console.log(`   Created: ${scan.created_at}`);
      console.log(`   Confidence: ${scan.confidence_score || 'N/A'}`);
      console.log(`   Verification: ${scan.verification_status || 'N/A'}`);
      console.log(`   Result Type: ${scan.result_type || 'N/A'}`);
      
      if (scan.gemini_evidence_analysis) {
        const analysis = typeof scan.gemini_evidence_analysis === 'string' 
          ? JSON.parse(scan.gemini_evidence_analysis) 
          : scan.gemini_evidence_analysis;
        
        console.log(`   Gemini Analysis: Present`);
        if (analysis.web_search_results && analysis.web_search_results.length > 0) {
          console.log(`   Web Search Results: ${analysis.web_search_results.length} found`);
          console.log(`   Sample snippet: ${analysis.web_search_results[0].content?.substring(0, 100)}...`);
        } else {
          console.log(`   Web Search Results: None found`);
        }
      } else {
        console.log(`   Gemini Analysis: Missing`);
      }
      
      if (scan.agent_execution_trace) {
        console.log(`   Agent Trace: Present`);
      } else {
        console.log(`   Agent Trace: Missing`);
      }
    });
    
    // Check for web search snippets in the data
    const withWebSearch = data.filter(scan => {
      if (!scan.gemini_evidence_analysis) return false;
      const analysis = typeof scan.gemini_evidence_analysis === 'string' 
        ? JSON.parse(scan.gemini_evidence_analysis) 
        : scan.gemini_evidence_analysis;
      return analysis.web_search_results && analysis.web_search_results.length > 0;
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total scans: ${data.length}`);
    console.log(`   With web search snippets: ${withWebSearch.length}`);
    console.log(`   With Gemini analysis: ${data.filter(s => s.gemini_evidence_analysis).length}`);
    console.log(`   With agent traces: ${data.filter(s => s.agent_execution_trace).length}`);
    
  } catch (error) {
    console.log('❌ Error checking recent activity:', error.message);
  }
}

checkRecentActivity();

