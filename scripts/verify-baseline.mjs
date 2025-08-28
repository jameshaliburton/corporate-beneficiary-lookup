#!/usr/bin/env node

/**
 * Baseline Verification Script
 * Checks critical files, runs builds, and tests API endpoints
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const STABLE_SHA = process.env.STABLE_SHA || 'c40bb66';
const CRITICAL_FILES = [
  'src/lib/trace/traceLogger.ts',
  'src/lib/agents/narrativeGenerator.ts',
  'src/lib/agents/storyGenerator.ts',
  'src/lib/utils/breadcrumbBuilder.ts',
  'src/lib/utils/storyContextBuilder.ts',
  'src/components/DebugTracePanel.tsx',
  'src/components/phase5-ui/ui/swiper-styles.css',
  'src/components/ConfidenceBadge.tsx',
  'src/components/OwnershipTrail.tsx',
  'src/components/AdditionalNotes.tsx',
  'src/components/MoreDetails.tsx',
  'src/components/ShareModal.tsx',
  'src/components/TestDataWarning.tsx',
  'src/components/phase5-ui/DisambiguationCarousel.tsx',
  'src/components/OwnershipCard.tsx',
  'src/lib/utils/colorUtils.ts',
  'src/lib/utils/fetchLogoWithTimeout.ts',
  'src/lib/utils/ownershipNotes.ts',
  'src/lib/utils/generateTagline.ts',
  'src/lib/utils/generateCardTagline.ts',
  'src/lib/utils/generateOwnershipRevealCopy.ts',
  'src/lib/utils/generateBehindTheScenes.ts',
  'src/lib/utils/cleanPipelineResult.ts',
  'src/lib/pipeline/enrichEntities.ts'
];

class BaselineVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      stableSha: STABLE_SHA,
      checks: {}
    };
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async checkFileExistence() {
    this.log('🔍 Checking critical file existence...');
    
    const fileChecks = {};
    for (const file of CRITICAL_FILES) {
      const exists = existsSync(file);
      fileChecks[file] = exists;
      this.log(`  ${exists ? '✅' : '❌'} ${file}`);
    }
    
    this.results.checks.fileExistence = fileChecks;
    return fileChecks;
  }

  async checkExports() {
    this.log('🔍 Checking key exports...');
    
    const exportChecks = {};
    const filesToCheck = [
      { path: 'src/lib/trace/traceLogger.ts', exports: ['startTrace', 'stage', 'finalize'] },
      { path: 'src/lib/agents/narrativeGenerator.ts', exports: ['generateNarrative'] },
      { path: 'src/lib/agents/storyGenerator.ts', exports: ['generateGroundedStory'] }
    ];
    
    for (const { path, exports: expectedExports } of filesToCheck) {
      if (existsSync(path)) {
        try {
          const content = readFileSync(path, 'utf8');
          const foundExports = expectedExports.filter(exp => content.includes(`export function ${exp}`));
          exportChecks[path] = foundExports;
          this.log(`  ${foundExports.length > 0 ? '✅' : '❌'} ${path}: ${foundExports.join(', ')}`);
        } catch (error) {
          exportChecks[path] = { error: error.message };
          this.log(`  ❌ ${path}: Error reading file`);
        }
      } else {
        exportChecks[path] = { error: 'File not found' };
        this.log(`  ❌ ${path}: File not found`);
      }
    }
    
    this.results.checks.exports = exportChecks;
    return exportChecks;
  }

  async runTypeCheck() {
    this.log('🔍 Running TypeScript type check...');
    
    try {
      const startTime = Date.now();
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      const duration = Date.now() - startTime;
      
      this.results.checks.typeCheck = { success: true, duration };
      this.log(`  ✅ TypeScript check passed (${duration}ms)`);
      return { success: true, duration };
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || 'Unknown error';
      this.results.checks.typeCheck = { success: false, error: output };
      this.log(`  ❌ TypeScript check failed`);
      return { success: false, error: output };
    }
  }

  async runBuild() {
    this.log('🔍 Running Next.js build...');
    
    try {
      const startTime = Date.now();
      execSync('npm run build', { stdio: 'pipe' });
      const duration = Date.now() - startTime;
      
      this.results.checks.build = { success: true, duration };
      this.log(`  ✅ Build passed (${duration}ms)`);
      return { success: true, duration };
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || 'Unknown error';
      this.results.checks.build = { success: false, error: output };
      this.log(`  ❌ Build failed`);
      return { success: false, error: output };
    }
  }

  async testAPI() {
    this.log('🔍 Testing API endpoints...');
    
    const apiTests = [
      { brand: 'Adidas', expected: ['brand', 'narrative', 'trace'] },
      { brand: 'Nike', expected: ['brand', 'narrative', 'trace'] },
      { brand: 'Red Rose', expected: ['brand', 'narrative', 'trace'] }
    ];
    
    const results = {};
    
    for (const test of apiTests) {
      try {
        const response = execSync(`curl -s -X POST http://localhost:3000/api/lookup -H "Content-Type: application/json" -d '{"brand":"${test.brand}"}'`, { encoding: 'utf8' });
        const data = JSON.parse(response);
        
        const status = 'success';
        const keysPresent = test.expected.filter(key => data.hasOwnProperty(key));
        const hasStory = data.narrative?.story ? true : false;
        const hasTrace = data.trace ? true : false;
        
        results[test.brand] = { status, keysPresent, hasStory, hasTrace };
        this.log(`  ✅ ${test.brand}: ${keysPresent.length}/${test.expected.length} keys, story: ${hasStory}, trace: ${hasTrace}`);
      } catch (error) {
        results[test.brand] = { status: 'error', error: error.message };
        this.log(`  ❌ ${test.brand}: ${error.message}`);
      }
    }
    
    this.results.checks.api = results;
    return results;
  }

  async generateReport() {
    this.log('📝 Generating verification report...');
    
    const report = `# Baseline Verification Report

## Summary
- **Timestamp**: ${this.results.timestamp}
- **Stable SHA**: ${this.results.stableSha}

## File Existence
${Object.entries(this.results.checks.fileExistence || {})
  .map(([file, exists]) => `- ${exists ? '✅' : '❌'} ${file}`)
  .join('\n')}

## Type Check
- **Status**: ${this.results.checks.typeCheck?.success ? '✅ Passed' : '❌ Failed'}
- **Duration**: ${this.results.checks.typeCheck?.duration || 'N/A'}ms

## Build
- **Status**: ${this.results.checks.build?.success ? '✅ Passed' : '❌ Failed'}
- **Duration**: ${this.results.checks.build?.duration || 'N/A'}ms

## API Tests
${Object.entries(this.results.checks.api || {})
  .map(([brand, result]) => `- **${brand}**: ${result.status === 'success' ? '✅' : '❌'} ${result.keysPresent?.join(', ') || 'Error'} (story: ${result.hasStory}, trace: ${result.hasTrace})`)
  .join('\n')}

## Recommendations
${this.generateRecommendations()}
`;

    writeFileSync('verification_report.md', report);
    this.log('📄 Report written to verification_report.md');
    
    return report;
  }

  generateRecommendations() {
    const fileCount = Object.values(this.results.checks.fileExistence || {}).filter(Boolean).length;
    const totalFiles = CRITICAL_FILES.length;
    const missingFiles = totalFiles - fileCount;
    
    if (missingFiles === 0) {
      return '✅ All critical files present. System appears healthy.';
    } else if (missingFiles <= 5) {
      return `⚠️  ${missingFiles} critical files missing. Consider restoring from stable commit.`;
    } else {
      return `❌ ${missingFiles} critical files missing. Significant recovery needed.`;
    }
  }

  async run() {
    this.log('🚀 Starting baseline verification...');
    this.log(`📋 Stable SHA: ${STABLE_SHA}`);
    this.log('');
    
    await this.checkFileExistence();
    await this.checkExports();
    await this.runTypeCheck();
    await this.runBuild();
    
    // Only test API if dev server might be running
    try {
      await this.testAPI();
    } catch (error) {
      this.log('⚠️  API tests skipped (dev server not running)');
    }
    
    await this.generateReport();
    
    this.log('');
    this.log('🎉 Verification complete!');
    this.log('📄 See verification_report.md for detailed results');
  }
}

// Run verification
const verifier = new BaselineVerifier();
verifier.run().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
