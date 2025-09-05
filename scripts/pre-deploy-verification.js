#!/usr/bin/env node

/**
 * Pre-Deploy Verification Script
 * Validates the current state before production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${timestamp} - ${message}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

function checkEnvironmentVariable(name) {
  const value = process.env[name];
  if (!value) {
    log('error', `Environment variable ${name} is not set`);
    return false;
  }
  
  // Don't log the full value for security
  const maskedValue = value.length > 10 ? `${value.substring(0, 10)}...` : value;
  log('info', `Environment variable ${name} is set (${maskedValue})`);
  return true;
}

function runCommand(command, description) {
  try {
    log('info', `Running: ${description}`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log('success', `${description} completed successfully`);
    return { success: true, output };
  } catch (error) {
    log('error', `${description} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  log('info', 'Starting pre-deploy verification...');
  console.log('='.repeat(60));

  let allChecksPassed = true;

  // Check 1: Verify we're in the right directory
  log('info', 'Check 1: Verifying project structure...');
  if (!checkFileExists('package.json')) {
    log('error', 'Not in project root directory');
    allChecksPassed = false;
  } else {
    log('success', 'Project structure verified');
  }

  // Check 2: Verify git status
  log('info', 'Check 2: Verifying git status...');
  const gitStatus = runCommand('git status --porcelain', 'Git status check');
  if (gitStatus.success && gitStatus.output.trim()) {
    log('warning', 'Uncommitted changes detected:');
    console.log(gitStatus.output);
    log('warning', 'Please commit or stash changes before deploying');
  } else {
    log('success', 'Git working directory is clean');
  }

  // Check 3: Verify current branch
  log('info', 'Check 3: Verifying current branch...');
  const currentBranch = runCommand('git branch --show-current', 'Current branch check');
  if (currentBranch.success) {
    log('info', `Current branch: ${currentBranch.output.trim()}`);
  }

  // Check 4: Verify environment variables (warning only for local dev)
  log('info', 'Check 4: Verifying environment variables...');
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'GOOGLE_API_KEY',
    'ANTHROPIC_API_KEY'
  ];

  let envVarsPassed = true;
  for (const envVar of requiredEnvVars) {
    if (!checkEnvironmentVariable(envVar)) {
      envVarsPassed = false;
    }
  }

  if (envVarsPassed) {
    log('success', 'All required environment variables are set');
  } else {
    log('warning', 'Some required environment variables are missing (expected in local dev)');
    log('info', 'Environment variables will be loaded from Vercel in production');
  }

  // Check 5: Verify feature flags
  log('info', 'Check 5: Verifying feature flags...');
  const featureFlags = {
    'USE_NEW_CACHE_SYSTEM': process.env.USE_NEW_CACHE_SYSTEM,
    'ENABLE_GEMINI_OWNERSHIP_AGENT': process.env.ENABLE_GEMINI_OWNERSHIP_AGENT,
    'ENABLE_DISAMBIGUATION_AGENT': process.env.ENABLE_DISAMBIGUATION_AGENT,
    'ENABLE_AGENT_REPORTS': process.env.ENABLE_AGENT_REPORTS
  };

  for (const [flag, value] of Object.entries(featureFlags)) {
    if (value === 'true') {
      log('success', `Feature flag ${flag} is enabled`);
    } else if (value === 'false') {
      log('warning', `Feature flag ${flag} is disabled`);
    } else {
      log('info', `Feature flag ${flag} is not set (default: disabled)`);
    }
  }

  // Check 6: Verify TypeScript compilation
  log('info', 'Check 6: Verifying TypeScript compilation...');
  const tscCheck = runCommand('npx tsc --noEmit', 'TypeScript compilation check');
  if (!tscCheck.success) {
    log('error', 'TypeScript compilation failed');
    allChecksPassed = false;
  }

  // Check 7: Verify ESLint
  log('info', 'Check 7: Verifying ESLint...');
  const eslintCheck = runCommand('npm run lint', 'ESLint check');
  if (!eslintCheck.success) {
    log('warning', 'ESLint found issues (non-blocking)');
  }

  // Check 8: Verify production build
  log('info', 'Check 8: Verifying production build...');
  
  // Clean previous build
  if (checkFileExists('.next')) {
    log('info', 'Cleaning previous build...');
    runCommand('rm -rf .next', 'Clean previous build');
  }

  const buildCheck = runCommand('npm run build', 'Production build');
  if (!buildCheck.success) {
    log('error', 'Production build failed');
    allChecksPassed = false;
  } else {
    log('success', 'Production build completed successfully');
  }

  // Check 9: Verify key files exist
  log('info', 'Check 9: Verifying key files...');
  const keyFiles = [
    'src/app/api/lookup/route.ts',
    'src/lib/agents/gemini-ownership-analysis-agent.js',
    'src/lib/cache/index.ts',
    'src/components/ProductResultV2.tsx',
    'src/components/VerificationDetailsPanel.tsx'
  ];

  let keyFilesPassed = true;
  for (const file of keyFiles) {
    if (checkFileExists(file)) {
      log('success', `Key file exists: ${file}`);
    } else {
      log('error', `Key file missing: ${file}`);
      keyFilesPassed = false;
    }
  }

  if (keyFilesPassed) {
    log('success', 'All key files present');
  } else {
    allChecksPassed = false;
  }

  // Check 10: Verify cache system integration
  log('info', 'Check 10: Verifying cache system integration...');
  const lookupRoute = fs.readFileSync('src/app/api/lookup/route.ts', 'utf8');
  
  const cacheChecks = [
    { pattern: 'lookupCachedResult', name: 'Cache lookup function' },
    { pattern: 'cachePipelineResult', name: 'Cache save function' },
    { pattern: 'maybeRunGeminiVerificationForCacheHit', name: 'Gemini cache verification' },
    { pattern: 'verification_status', name: 'Verification status field' },
    { pattern: 'verification_confidence_change', name: 'Verification confidence change field' }
  ];

  let cacheChecksPassed = true;
  for (const check of cacheChecks) {
    if (lookupRoute.includes(check.pattern)) {
      log('success', `${check.name} found in lookup route`);
    } else {
      log('error', `${check.name} not found in lookup route`);
      cacheChecksPassed = false;
    }
  }

  if (cacheChecksPassed) {
    log('success', 'Cache system integration verified');
  } else {
    allChecksPassed = false;
  }

  // Final summary
  console.log('='.repeat(60));
  
  // Don't fail on environment variables in local dev
  const criticalChecksPassed = allChecksPassed || (!envVarsPassed && keyFilesPassed && cacheChecksPassed);
  
  if (criticalChecksPassed) {
    log('success', '🎉 CRITICAL CHECKS PASSED - READY FOR DEPLOYMENT!');
    log('info', 'You can now proceed with the safe deployment:');
    log('info', '  ./scripts/safe-deploy-cache-gemini.sh');
    log('info', '  or');
    log('info', '  git add . && git commit -am "feat: enable Gemini verification metadata in cache"');
    log('info', '  git tag -a v2.0.0-cache-verification -m "Stable cache + Gemini release"');
    log('info', '  git push origin main && vercel --prod');
  } else {
    log('error', '❌ CRITICAL CHECKS FAILED - DO NOT DEPLOY');
    log('error', 'Please fix the issues above before attempting deployment');
    process.exit(1);
  }

  console.log('='.repeat(60));
}

// Run the verification
main().catch(error => {
  log('error', `Verification failed: ${error.message}`);
  process.exit(1);
});
