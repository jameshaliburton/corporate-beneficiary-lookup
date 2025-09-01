import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT_SET');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT_SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProductData {
  id: string;
  barcode: string;
  product_name: string | null;
  brand: string;
  financial_beneficiary: string | null;
  beneficiary_country: string | null;
  beneficiary_flag: string | null;
  ownership_structure_type: string | null;
  confidence_score: number | null;
  ownership_flow: any;
  sources: any;
  reasoning: string | null;
  web_research_used: boolean | null;
  web_sources_count: number | null;
  query_analysis_used: boolean | null;
  static_mapping_used: boolean | null;
  result_type: string | null;
  user_contributed: boolean | null;
  inferred: boolean | null;
  agent_execution_trace: any;
  initial_llm_confidence: number | null;
  agent_results: any;
  fallback_reason: string | null;
  verification_status: string | null;
  verification_confidence_change: string | null;
  verification_evidence: any;
  verified_at: string | null;
  verification_method: string | null;
  confidence_assessment: any;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
}

async function inspectProductData(brand: string): Promise<void> {
  console.log(`🔍 [INSPECT_PRODUCT] Inspecting product data for brand: "${brand}"`);
  
  try {
    // Query products table by brand
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .ilike('brand', `%${brand}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ [INSPECT_PRODUCT] Database error:', error);
      return;
    }

    if (!products || products.length === 0) {
      console.log(`⚠️  [INSPECT_PRODUCT] No products found for brand: "${brand}"`);
      return;
    }

    console.log(`✅ [INSPECT_PRODUCT] Found ${products.length} product(s) for brand: "${brand}"`);
    
    products.forEach((product: ProductData, index: number) => {
      console.log(`\n📦 [INSPECT_PRODUCT] Product ${index + 1}:`);
      console.log('   Basic Info:');
      console.log(`     Brand: ${product.brand}`);
      console.log(`     Product: ${product.product_name || 'N/A'}`);
      console.log(`     Barcode: ${product.barcode}`);
      console.log(`     Created: ${product.created_at}`);
      console.log(`     Updated: ${product.updated_at}`);
      
      console.log('   Ownership Info:');
      console.log(`     Financial Beneficiary: ${product.financial_beneficiary || 'N/A'}`);
      console.log(`     Country: ${product.beneficiary_country || 'N/A'}`);
      console.log(`     Flag: ${product.beneficiary_flag || 'N/A'}`);
      console.log(`     Confidence Score: ${product.confidence_score || 'N/A'}`);
      console.log(`     Result Type: ${product.result_type || 'N/A'}`);
      
      console.log('   Verification Info:');
      console.log(`     Verification Status: ${product.verification_status || 'N/A'}`);
      console.log(`     Verified At: ${product.verified_at || 'N/A'}`);
      console.log(`     Verification Method: ${product.verification_method || 'N/A'}`);
      console.log(`     Verification Notes: ${product.verification_notes || 'N/A'}`);
      
      if (product.confidence_assessment) {
        console.log('   Confidence Assessment:');
        try {
          const assessment = typeof product.confidence_assessment === 'string' 
            ? JSON.parse(product.confidence_assessment) 
            : product.confidence_assessment;
          console.log(`     Original Confidence: ${assessment.original_confidence || 'N/A'}`);
          console.log(`     Verified Confidence: ${assessment.verified_confidence || 'N/A'}`);
          console.log(`     Confidence Change: ${assessment.confidence_change || 'N/A'}`);
        } catch (e) {
          console.log(`     Raw Assessment: ${product.confidence_assessment}`);
        }
      }
      
      console.log('   Agent Results:');
      if (product.agent_results) {
        try {
          const agentResults = typeof product.agent_results === 'string' 
            ? JSON.parse(product.agent_results) 
            : product.agent_results;
          
          if (agentResults.gemini_analysis) {
            console.log(`     Gemini Analysis: ${agentResults.gemini_analysis.success ? 'SUCCESS' : 'FAILED'}`);
            if (agentResults.gemini_analysis.data) {
              const geminiData = agentResults.gemini_analysis.data;
              console.log(`       Verification Status: ${geminiData.verification_status || 'N/A'}`);
              console.log(`       Verified At: ${geminiData.verified_at || 'N/A'}`);
              console.log(`       Verification Method: ${geminiData.verification_method || 'N/A'}`);
            }
          }
          
          if (agentResults.disambiguation_analysis) {
            console.log(`     Disambiguation: ${agentResults.disambiguation_analysis.triggered ? 'TRIGGERED' : 'NOT_TRIGGERED'}`);
          }
        } catch (e) {
          console.log(`     Raw Agent Results: ${product.agent_results}`);
        }
      } else {
        console.log('     No agent results available');
      }
    });

  } catch (error) {
    console.error('❌ [INSPECT_PRODUCT] Unexpected error:', error);
  }
}

// Main execution
async function main() {
  const brand = process.argv[2];
  
  if (!brand) {
    console.error('❌ Usage: npx tsx scripts/inspectProductData.ts <brand>');
    console.error('   Example: npx tsx scripts/inspectProductData.ts Jordan');
    process.exit(1);
  }

  await inspectProductData(brand);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { inspectProductData };
