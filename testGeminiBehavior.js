#!/usr/bin/env node

/**
 * Production-Safe Gemini Verification Behavior Test Suite
 * 
 * This script tests the cache + Gemini verification system in production
 * without modifying any data or behavior. It checks cache state and
 * verifies expected Gemini behavior.
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dsebpgeuqfypgidirebb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PRODUCTION_API_URL = 'https://ownedby.app/api/lookup';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('\nPlease set these environment variables or add them to .env.local');
  process.exit(1);
}

// Initialize Supabase client with service role for cache access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test brands with expected behavior
const brandsToTest = [
  { brand: "Pop-Tarts", product: "Frosted Cookies & Crème" },  // Known working
  { brand: "Delta", product: "Airlines" },                     // Potential no Gemini
  { brand: "Rabén & Sjögren", product: "Rabén & Sjögren" },    // Previously Gemini failed
  { brand: "Kellogg's", product: "Kellogg's" },                // Should skip
  { brand: "Zara", product: "Zara" },                          // Possibly unverified
  { brand: "Red Bull", product: "Red Bull" },                  // Known verified
  { brand: "Boots Pharmacy", product: "Boots Pharmacy" },      // Gemini fallback candidate
  { brand: "Super Unknown™️", product: "Super Unknown™️" },    // Expect Gemini run
];

class GeminiVerificationTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    
    console.log('🧪 Starting Gemini Verification Behavior Test Suite');
    console.log('==================================================');
    console.log(`📅 Test started at: ${new Date().toISOString()}`);
    console.log(`🌐 Production API: ${PRODUCTION_API_URL}`);
    console.log(`📊 Testing ${brandsToTest.length} brands\n`);
  }

  /**
   * Check cache state for a brand/product combination
   */
  async checkCacheState(brand, product) {
    try {
      // Query the products table for matching entries
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('brand', brand)
        .eq('product_name', product)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error(`❌ Cache query error for ${brand}:`, error);
        return { cacheHit: false, hasVerification: false };
      }

      if (!data || data.length === 0) {
        return { cacheHit: false, hasVerification: false };
      }

      const cacheEntry = data[0];
      const hasVerification = !!(cacheEntry.verification_status);
      
      return {
        cacheHit: true,
        hasVerification,
        verificationStatus: cacheEntry.verification_status,
        cacheEntry
      };
    } catch (error) {
      console.error(`❌ Cache check failed for ${brand}:`, error);
      return { cacheHit: false, hasVerification: false };
    }
  }

  /**
   * Perform API lookup using native https module
   */
  async performLookup(brand, product) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        brand,
        product_name: product
      });

      const options = {
        hostname: 'ownedby.app',
        port: 443,
        path: '/api/lookup',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          
          try {
            const jsonData = JSON.parse(data);
            const cacheHit = jsonData.cache_hit === true;
            const geminiTriggered = !cacheHit; // If cache hit, Gemini was skipped
            
            resolve({
              geminiTriggered,
              responseTime
            });
          } catch (parseError) {
            resolve({
              geminiTriggered: false,
              responseTime,
              error: `Parse error: ${parseError.message}`
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          geminiTriggered: false,
          responseTime: Date.now() - startTime,
          error: error.message
        });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Determine expected behavior based on cache state
   */
  getExpectedBehavior(cacheHit, hasVerification) {
    if (!cacheHit) {
      return {
        expected: true, // Should trigger Gemini
        notes: 'No cache entry - Gemini should run'
      };
    }

    if (hasVerification) {
      return {
        expected: true, // Should skip Gemini
        notes: 'Cache hit with verification - Gemini should skip'
      };
    }

    return {
      expected: false, // Ambiguous case
      notes: 'Cache hit without verification - behavior uncertain'
    };
  }

  /**
   * Run test for a single brand
   */
  async testBrand(brand, product) {
    console.log(`\n🔍 Testing: ${brand} - ${product}`);
    
    // Check cache state
    const cacheState = await this.checkCacheState(brand, product);
    console.log(`   📊 Cache: ${cacheState.cacheHit ? '✅ Hit' : '❌ Miss'}`);
    if (cacheState.cacheHit) {
      console.log(`   🔍 Verification: ${cacheState.hasVerification ? '✅ Yes' : '❌ No'}`);
      if (cacheState.verificationStatus) {
        console.log(`   📋 Status: ${cacheState.verificationStatus}`);
      }
    }

    // Perform lookup
    const lookupResult = await this.performLookup(brand, product);
    console.log(`   ⚡ Response time: ${lookupResult.responseTime}ms`);
    
    if (lookupResult.error) {
      console.log(`   ❌ Error: ${lookupResult.error}`);
    } else {
      console.log(`   🤖 Gemini: ${lookupResult.geminiTriggered ? '✅ Triggered' : '⏭️ Skipped'}`);
    }

    // Determine expected behavior
    const expected = this.getExpectedBehavior(cacheState.cacheHit, cacheState.hasVerification);
    
    // Check if actual behavior matches expected
    const behaviorMatches = expected.expected === lookupResult.geminiTriggered;
    
    const result = {
      brand,
      product,
      cacheHit: cacheState.cacheHit,
      hasVerification: cacheState.hasVerification,
      verificationStatus: cacheState.verificationStatus,
      geminiTriggered: lookupResult.geminiTriggered,
      expected: behaviorMatches,
      notes: expected.notes,
      responseTime: lookupResult.responseTime,
      error: lookupResult.error
    };

    // Log result
    const status = behaviorMatches ? '✅' : '❌';
    console.log(`   ${status} Result: ${behaviorMatches ? 'Expected' : 'Unexpected'}`);

    return result;
  }

  /**
   * Run all tests
   */
  async runTests() {
    for (const testCase of brandsToTest) {
      const result = await this.testBrand(testCase.brand, testCase.product);
      this.results.push(result);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Generate markdown results
   */
  generateMarkdownResults() {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.expected).length;
    const failed = this.results.filter(r => !r.expected && !r.error).length;
    const errors = this.results.filter(r => r.error).length;
    const warnings = this.results.filter(r => !r.expected && !r.error && r.cacheHit && !r.hasVerification).length;

    let markdown = `# Gemini Verification Test Results\n\n`;
    markdown += `**Test Date**: ${new Date().toISOString()}\n`;
    markdown += `**Production API**: ${PRODUCTION_API_URL}\n`;
    markdown += `**Total Tests**: ${totalTests}\n`;
    markdown += `**Passed**: ${passed} ✅\n`;
    markdown += `**Failed**: ${failed} ❌\n`;
    markdown += `**Errors**: ${errors} 🚨\n`;
    markdown += `**Warnings**: ${warnings} ⚠️\n\n`;

    markdown += `## Test Results\n\n`;
    markdown += `| Brand | Product | Cache Hit | Has Verification | Verification Status | Gemini Triggered | Expected? | Response Time | Notes |\n`;
    markdown += `|-------|---------|-----------|------------------|-------------------|------------------|-----------|---------------|-------|\n`;

    for (const result of this.results) {
      const status = result.expected ? '✅' : (result.error ? '🚨' : '❌');
      const cacheStatus = result.cacheHit ? '✅' : '❌';
      const verificationStatus = result.hasVerification ? '✅' : '❌';
      const geminiStatus = result.geminiTriggered ? '✅' : '⏭️';
      
      markdown += `| ${result.brand} | ${result.product} | ${cacheStatus} | ${verificationStatus} | ${result.verificationStatus || 'N/A'} | ${geminiStatus} | ${status} | ${result.responseTime}ms | ${result.notes} |\n`;
    }

    markdown += `\n## Summary\n\n`;
    
    if (passed === totalTests) {
      markdown += `🎉 **All tests passed!** The cache + Gemini verification system is working correctly.\n\n`;
    } else if (errors > 0) {
      markdown += `🚨 **Errors detected!** ${errors} tests failed with errors. Check the API and database connectivity.\n\n`;
    } else if (failed > 0) {
      markdown += `❌ **Unexpected behavior detected!** ${failed} tests showed unexpected behavior. Review the cache logic.\n\n`;
    }

    if (warnings > 0) {
      markdown += `⚠️ **Warnings:** ${warnings} tests had ambiguous cache states (cache hit without verification). This may indicate incomplete cache entries.\n\n`;
    }

    markdown += `## Test Configuration\n\n`;
    markdown += `- **API Endpoint**: ${PRODUCTION_API_URL}\n`;
    markdown += `- **Cache Table**: products\n`;
    markdown += `- **Test Brands**: ${brandsToTest.length}\n`;
    markdown += `- **Test Duration**: ${Math.round((Date.now() - this.startTime) / 1000)}s\n\n`;

    return markdown;
  }

  /**
   * Save results to file
   */
  async saveResults() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const resultsPath = path.join(logsDir, 'gemini_verification_results.md');
    const markdown = this.generateMarkdownResults();
    
    fs.writeFileSync(resultsPath, markdown);
    console.log(`\n📄 Results saved to: ${resultsPath}`);
  }

  /**
   * Print CLI summary
   */
  printSummary() {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.expected).length;
    const failed = this.results.filter(r => !r.expected && !r.error).length;
    const errors = this.results.filter(r => r.error).length;
    const warnings = this.results.filter(r => !r.expected && !r.error && r.cacheHit && !r.hasVerification).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🚨 Errors: ${errors}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`⏱️  Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
    console.log('='.repeat(60));

    if (passed === totalTests) {
      console.log('🎉 All tests passed! System is working correctly.');
    } else if (errors > 0) {
      console.log('🚨 Errors detected! Check API and database connectivity.');
    } else if (failed > 0) {
      console.log('❌ Unexpected behavior detected! Review cache logic.');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const freshRun = args.includes('--fresh-run');
  
  if (freshRun) {
    console.log('⚠️  Fresh run mode enabled - this will purge cache entries');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const tester = new GeminiVerificationTester();
  
  try {
    await tester.runTests();
    await tester.saveResults();
    tester.printSummary();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { GeminiVerificationTester };
