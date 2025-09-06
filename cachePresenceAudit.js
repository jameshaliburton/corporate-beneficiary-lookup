#!/usr/bin/env node

/**
 * Cache + Gemini Verification Audit
 * 
 * Production-safe audit of cache presence and Gemini verification behavior
 * across key brands. Analyzes database presence vs API cache behavior.
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

// Brand list for audit
const brands = [
  "Pop-Tarts",
  "Delta", 
  "Rabén & Sjögren",
  "Kellogg's",
  "Zara",
  "Red Bull",
  "Boots Pharmacy",
  "Super Unknown™️"
];

class CachePresenceAuditor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.actionItems = [];
    
    console.log('🔍 Starting Cache + Gemini Verification Audit');
    console.log('============================================');
    console.log(`📅 Audit started at: ${new Date().toISOString()}`);
    console.log(`🌐 Production API: ${PRODUCTION_API_URL}`);
    console.log(`📊 Auditing ${brands.length} brands\n`);
  }

  /**
   * Check database presence for a brand
   */
  async checkDatabasePresence(brand) {
    try {
      // Check products table
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, brand, product_name, verification_status, verified_at, verification_notes')
        .ilike('brand', `%${brand}%`)
        .limit(5);

      // Check ownership_results table
      const { data: ownershipData, error: ownershipError } = await supabase
        .from('ownership_results')
        .select('id, brand, product_name, verification_status, verified_at, verification_notes')
        .ilike('brand', `%${brand}%`)
        .limit(5);

      const dbMatch = {
        products: productsData && productsData.length > 0 ? productsData : null,
        ownership_results: ownershipData && ownershipData.length > 0 ? ownershipData : null,
        productsError,
        ownershipError
      };

      return dbMatch;
    } catch (error) {
      console.error(`❌ Database check failed for ${brand}:`, error);
      return {
        products: null,
        ownership_results: null,
        productsError: error,
        ownershipError: error
      };
    }
  }

  /**
   * Call the public API for a brand
   */
  async callLookupAPI(brand) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        brand,
        product_name: brand
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
          try {
            const jsonData = JSON.parse(data);
            resolve({
              success: true,
              data: jsonData,
              error: null
            });
          } catch (parseError) {
            resolve({
              success: false,
              data: null,
              error: `Parse error: ${parseError.message}`
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          data: null,
          error: error.message
        });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Analyze verification metadata
   */
  analyzeVerification(apiData, dbData) {
    const verificationPresent = !!(
      apiData?.verification_status || 
      apiData?.verified_at || 
      apiData?.verification_notes ||
      dbData?.verification_status ||
      dbData?.verified_at ||
      dbData?.verification_notes
    );

    const geminiTriggered = apiData?.verification_method === 'gemini_analysis' || 
                           apiData?.verification_method === 'gemini_ownership_analysis';

    return {
      verificationPresent,
      geminiTriggered,
      verificationStatus: apiData?.verification_status || dbData?.verification_status,
      verificationMethod: apiData?.verification_method,
      verifiedAt: apiData?.verified_at || dbData?.verified_at
    };
  }

  /**
   * Generate notes based on mismatches
   */
  generateNotes(brand, dbMatch, apiData, verification) {
    const notes = [];
    
    // Check for database presence but no cache hit
    if ((dbMatch.products || dbMatch.ownership_results) && !apiData?.cache_hit) {
      notes.push("Potential cache write issue");
    }
    
    // Check for cache hit but no verification metadata
    if (apiData?.cache_hit && !verification.verificationPresent) {
      notes.push("Missing verification in cached result");
    }
    
    // Check for no Gemini verification despite cache miss
    if (!apiData?.cache_hit && !verification.geminiTriggered) {
      notes.push("Gemini unexpectedly skipped");
    }
    
    // Check for normalization issues
    if (dbMatch.productsError || dbMatch.ownershipError) {
      notes.push("Database query error - check normalization");
    }
    
    // Check for API errors
    if (!apiData) {
      notes.push("API call failed");
    }
    
    // Check for expected behavior
    if (notes.length === 0) {
      if (apiData?.cache_hit) {
        notes.push("Normal cached behavior");
      } else {
        notes.push("Normal cache miss behavior");
      }
    }

    return notes.join(", ");
  }

  /**
   * Audit a single brand
   */
  async auditBrand(brand) {
    console.log(`\n🔍 Auditing: ${brand}`);
    
    // Check database presence
    const dbMatch = await this.checkDatabasePresence(brand);
    console.log(`   📊 DB Products: ${dbMatch.products ? '✅' : '❌'}`);
    console.log(`   📊 DB Ownership: ${dbMatch.ownership_results ? '✅' : '❌'}`);
    
    // Call API
    const apiResult = await this.callLookupAPI(brand);
    console.log(`   🌐 API Call: ${apiResult.success ? '✅' : '❌'}`);
    
    if (apiResult.success) {
      console.log(`   💾 Cache Hit: ${apiResult.data.cache_hit ? '✅' : '❌'}`);
      console.log(`   🤖 Gemini: ${apiResult.data.verification_method ? '✅' : '❌'}`);
    }
    
    // Analyze verification
    const verification = this.analyzeVerification(
      apiResult.data, 
      dbMatch.products?.[0] || dbMatch.ownership_results?.[0]
    );
    
    // Generate notes
    const notes = this.generateNotes(brand, dbMatch, apiResult.data, verification);
    
    // Determine DB match status
    let dbMatchStatus = "❌";
    if (dbMatch.products && dbMatch.ownership_results) {
      dbMatchStatus = "✅ (both)";
    } else if (dbMatch.products) {
      dbMatchStatus = "✅ (products)";
    } else if (dbMatch.ownership_results) {
      dbMatchStatus = "✅ (ownership_results)";
    }
    
    const result = {
      brand,
      dbMatch: dbMatchStatus,
      cacheHit: apiResult.data?.cache_hit ? "✅" : "❌",
      geminiTriggered: verification.geminiTriggered ? "✅" : "❌",
      verificationPresent: verification.verificationPresent ? "✅" : "❌",
      notes,
      verificationStatus: verification.verificationStatus,
      verificationMethod: verification.verificationMethod,
      verifiedAt: verification.verifiedAt,
      apiError: apiResult.error
    };
    
    this.results.push(result);
    
    // Add action items based on issues
    if (notes.includes("Potential cache write issue")) {
      this.actionItems.push(`Investigate cache write issue for ${brand}`);
    }
    if (notes.includes("Missing verification in cached result")) {
      this.actionItems.push(`Fix missing verification metadata for ${brand}`);
    }
    if (notes.includes("Gemini unexpectedly skipped")) {
      this.actionItems.push(`Debug Gemini skip behavior for ${brand}`);
    }
    if (notes.includes("Database query error")) {
      this.actionItems.push(`Fix database normalization for ${brand}`);
    }
    
    console.log(`   📝 Notes: ${notes}`);
    
    return result;
  }

  /**
   * Run audit for all brands
   */
  async runAudit() {
    for (const brand of brands) {
      await this.auditBrand(brand);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport() {
    const timestamp = new Date().toISOString();
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    let markdown = `# Cache + Gemini Verification Audit\n\n`;
    markdown += `**Audit Date**: ${timestamp}\n`;
    markdown += `**Production API**: ${PRODUCTION_API_URL}\n`;
    markdown += `**Total Brands**: ${brands.length}\n`;
    markdown += `**Audit Duration**: ${duration}s\n\n`;
    
    markdown += `## Audit Results\n\n`;
    markdown += `| Brand | DB Match (Table) | Cache Hit (API) | Gemini Triggered | Verification Present | Notes |\n`;
    markdown += `|-------|------------------|-----------------|------------------|---------------------|-------|\n`;
    
    for (const result of this.results) {
      markdown += `| ${result.brand} | ${result.dbMatch} | ${result.cacheHit} | ${result.geminiTriggered} | ${result.verificationPresent} | ${result.notes} |\n`;
    }
    
    markdown += `\n## Detailed Verification Data\n\n`;
    markdown += `| Brand | Verification Status | Verification Method | Verified At | API Error |\n`;
    markdown += `|-------|-------------------|-------------------|-------------|----------|\n`;
    
    for (const result of this.results) {
      markdown += `| ${result.brand} | ${result.verificationStatus || 'N/A'} | ${result.verificationMethod || 'N/A'} | ${result.verifiedAt || 'N/A'} | ${result.apiError || 'None'} |\n`;
    }
    
    markdown += `\n## Summary Statistics\n\n`;
    const dbMatches = this.results.filter(r => r.dbMatch !== "❌").length;
    const cacheHits = this.results.filter(r => r.cacheHit === "✅").length;
    const geminiTriggered = this.results.filter(r => r.geminiTriggered === "✅").length;
    const verificationPresent = this.results.filter(r => r.verificationPresent === "✅").length;
    
    markdown += `- **Database Matches**: ${dbMatches}/${brands.length} (${Math.round(dbMatches/brands.length*100)}%)\n`;
    markdown += `- **Cache Hits**: ${cacheHits}/${brands.length} (${Math.round(cacheHits/brands.length*100)}%)\n`;
    markdown += `- **Gemini Triggered**: ${geminiTriggered}/${brands.length} (${Math.round(geminiTriggered/brands.length*100)}%)\n`;
    markdown += `- **Verification Present**: ${verificationPresent}/${brands.length} (${Math.round(verificationPresent/brands.length*100)}%)\n\n`;
    
    markdown += `## 📌 Action Items\n\n`;
    if (this.actionItems.length === 0) {
      markdown += `- [ ] No critical issues detected - system appears to be working correctly\n`;
    } else {
      for (const item of this.actionItems) {
        markdown += `- [ ] ${item}\n`;
      }
    }
    
    markdown += `\n## Next Steps\n\n`;
    markdown += `1. **Review Action Items**: Address any critical issues identified above\n`;
    markdown += `2. **Monitor Cache Performance**: Track cache hit rates and verification metadata\n`;
    markdown += `3. **Validate Gemini Integration**: Ensure Gemini triggers correctly on cache misses\n`;
    markdown += `4. **Database Consistency**: Verify data consistency between products and ownership_results tables\n\n`;
    
    markdown += `---\n`;
    markdown += `*Audit completed at ${timestamp}*\n`;
    
    return markdown;
  }

  /**
   * Save report to file
   */
  async saveReport() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const reportPath = path.join(logsDir, 'cache_presence_analysis.md');
    const markdown = this.generateMarkdownReport();
    
    fs.writeFileSync(reportPath, markdown);
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  /**
   * Print summary
   */
  printSummary() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Brands: ${brands.length}`);
    console.log(`Database Matches: ${this.results.filter(r => r.dbMatch !== "❌").length}`);
    console.log(`Cache Hits: ${this.results.filter(r => r.cacheHit === "✅").length}`);
    console.log(`Gemini Triggered: ${this.results.filter(r => r.geminiTriggered === "✅").length}`);
    console.log(`Verification Present: ${this.results.filter(r => r.verificationPresent === "✅").length}`);
    console.log(`Action Items: ${this.actionItems.length}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('='.repeat(60));
    
    if (this.actionItems.length > 0) {
      console.log('\n🚨 Action Items:');
      this.actionItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item}`);
      });
    } else {
      console.log('\n🎉 No critical issues detected!');
    }
  }
}

// Main execution
async function main() {
  const auditor = new CachePresenceAuditor();
  
  try {
    await auditor.runAudit();
    await auditor.saveReport();
    auditor.printSummary();
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CachePresenceAuditor };
