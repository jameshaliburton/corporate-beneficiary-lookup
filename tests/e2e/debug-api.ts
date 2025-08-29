#!/usr/bin/env tsx

/**
 * DEBUG API CLI HELPER
 * 
 * Simple CLI tool for debugging single brand lookups
 * Usage: npx tsx tests/e2e/debug-api.ts "Brand" "Product"
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface DebugOptions {
  brand: string;
  product: string;
  url?: string;
  timeout?: number;
  verbose?: boolean;
}

/**
 * Make a debug API request with comprehensive logging
 */
async function debugApiRequest(options: DebugOptions) {
  const {
    brand,
    product,
    url = 'http://localhost:3000/api/lookup',
    timeout = 30000,
    verbose = false
  } = options;

  console.log('🔍 DEBUG API CLI HELPER');
  console.log('========================');
  console.log(`Brand: ${brand}`);
  console.log(`Product: ${product}`);
  console.log(`URL: ${url}`);
  console.log(`Timeout: ${timeout}ms`);
  console.log(`Verbose: ${verbose}`);
  console.log('');

  // Log environment variables if verbose
  if (verbose) {
    console.log('🔧 ENVIRONMENT VARIABLES:');
    const criticalEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ANTHROPIC_API_KEY',
      'GOOGLE_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    criticalEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        const maskedValue = envVar.includes('KEY') || envVar.includes('SECRET') 
          ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
          : value;
        console.log(`  ${envVar}: ${maskedValue}`);
      } else {
        console.log(`  ${envVar}: ❌ NOT SET`);
      }
    });
    console.log('');
  }

  const requestBody = {
    brand,
    product_name: product,
    barcode: null,
    hints: {},
    evaluation_mode: false
  };

  console.log('📤 REQUEST DETAILS:');
  console.log(`  Method: POST`);
  console.log(`  URL: ${url}`);
  console.log(`  Headers: Content-Type: application/json`);
  console.log(`  Body:`, JSON.stringify(requestBody, null, 2));
  console.log('');

  const startTime = Date.now();

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    console.log('🚀 SENDING REQUEST...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    console.log('📥 RESPONSE RECEIVED:');
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    console.log('');

    // Get response text
    const responseText = await response.text();
    console.log('📄 RESPONSE BODY:');
    console.log('Raw Response:', responseText);
    console.log('');

    // Try to parse as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      console.log('📋 PARSED JSON RESPONSE:');
      console.log(JSON.stringify(parsedResponse, null, 2));
    } catch (parseError) {
      console.log('⚠️  Failed to parse JSON response:', parseError.message);
      parsedResponse = { raw_response: responseText };
    }

    // Analyze response
    console.log('\n🔍 RESPONSE ANALYSIS:');
    if (response.ok) {
      console.log('✅ Request successful');
      if (parsedResponse.success) {
        console.log('✅ API returned success=true');
      } else {
        console.log('⚠️  API returned success=false');
      }
      
      if (parsedResponse.ownership_data || parsedResponse.financial_beneficiary) {
        console.log('✅ Ownership data present');
        const owner = parsedResponse.ownership_data?.financial_beneficiary || parsedResponse.financial_beneficiary || 'Unknown';
        const country = parsedResponse.ownership_data?.beneficiary_country || parsedResponse.beneficiary_country || 'Unknown';
        const confidence = parsedResponse.ownership_data?.confidence_score || parsedResponse.confidence_score || 'Unknown';
        console.log(`  Owner: ${owner}`);
        console.log(`  Country: ${country}`);
        console.log(`  Confidence: ${confidence}%`);
      } else {
        console.log('❌ No ownership data in response');
      }
      
      if (parsedResponse.narrative || parsedResponse.headline) {
        console.log('✅ Narrative data present');
        const headline = parsedResponse.narrative?.headline || parsedResponse.headline || 'None';
        const template = parsedResponse.narrative?.template_used || parsedResponse.narrative_template_used || 'Unknown';
        console.log(`  Headline: ${headline}`);
        console.log(`  Template: ${template}`);
      } else {
        console.log('❌ No narrative data in response');
      }

      // Check for disambiguation
      if (parsedResponse.disambiguation_options && parsedResponse.disambiguation_options.length > 0) {
        console.log('✅ Disambiguation triggered');
        console.log(`  Options: ${parsedResponse.disambiguation_options.length}`);
      } else {
        console.log('❌ No disambiguation triggered');
      }

      // Check agent execution trace
      if (parsedResponse.agent_execution_trace) {
        console.log('✅ Agent execution trace present');
        const agents = extractAgentsFromTrace(parsedResponse.agent_execution_trace);
        console.log(`  Agents triggered: ${agents.join(', ')}`);
      } else {
        console.log('❌ No agent execution trace');
      }
    } else {
      console.log('❌ Request failed');
      if (response.status >= 500) {
        console.log('🚨 SERVER ERROR - This indicates a server-side issue');
        console.log('   Check server logs for detailed error information');
      } else if (response.status >= 400) {
        console.log('🚨 CLIENT ERROR - Check request parameters');
      }
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      duration,
      response: parsedResponse,
      rawResponse: responseText
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('❌ REQUEST FAILED:');
    console.log(`  Error Type: ${error.name}`);
    console.log(`  Error Message: ${error.message}`);
    console.log(`  Duration: ${duration}ms`);
    
    if (error.name === 'AbortError') {
      console.log('🚨 REQUEST TIMEOUT - Server took too long to respond');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('🚨 NETWORK ERROR - Server may be unreachable');
      console.log('   Check if dev server is running: npm run dev');
      console.log(`   Verify server is accessible at: ${url}`);
    }
    
    if (verbose) {
      console.log('  Stack Trace:', error.stack);
    }
    
    return {
      success: false,
      error: error.message,
      errorType: error.name,
      duration
    };
  }
}

/**
 * Extract agents triggered from execution trace
 */
function extractAgentsFromTrace(trace: any): string[] {
  const agents: string[] = [];
  
  if (!trace || !trace.sections) return agents;
  
  trace.sections.forEach((section: any) => {
    if (section.stages) {
      section.stages.forEach((stage: any) => {
        if (stage.id) {
          agents.push(stage.id);
        }
      });
    }
  });
  
  return [...new Set(agents)]; // Remove duplicates
}

// Simple CLI argument parsing
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: npx tsx tests/e2e/debug-api.ts <brand> <product> [url] [timeout] [verbose]');
  console.log('');
  console.log('Examples:');
  console.log('  npx tsx tests/e2e/debug-api.ts "Lipton" "Lipton Ice Tea"');
  console.log('  npx tsx tests/e2e/debug-api.ts "Samsung" "Galaxy Buds"');
  console.log('  npx tsx tests/e2e/debug-api.ts "Moose Milk" "Local Cream Liqueur"');
  console.log('  npx tsx tests/e2e/debug-api.ts "Lipton" "Lipton Ice Tea" http://localhost:3000/api/lookup 30000 true');
  process.exit(1);
}

const brand = args[0];
const product = args[1];
const url = args[2] || 'http://localhost:3000/api/lookup';
const timeout = parseInt(args[3]) || 30000;
const verbose = args[4] === 'true';

// Run the debug request
(async () => {
  try {
    const result = await debugApiRequest({
      brand,
      product,
      url,
      timeout,
      verbose
    });
    
    console.log('\n📊 FINAL RESULT:');
    console.log(`Success: ${result.success}`);
    if (result.status) {
      console.log(`Status: ${result.status} ${result.statusText}`);
    }
    console.log(`Duration: ${result.duration}ms`);
    
    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
})();
