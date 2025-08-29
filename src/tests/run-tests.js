#!/usr/bin/env node

/**
 * Test runner script with tag filtering support
 * Usage: node run-tests.js [--tag=@narrative] [--tag=@ui] [--tag=@pipeline] [--tag=@fallback]
 */

const { execSync } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const tags = args.filter(arg => arg.startsWith('--tag=')).map(arg => arg.replace('--tag=', ''));

// Build Jest command
let jestCommand = 'npx jest';

// Add tag filtering if specified
if (tags.length > 0) {
  const tagPattern = tags.map(tag => `--testNamePattern="${tag}"`).join(' ');
  jestCommand += ` ${tagPattern}`;
}

// Add other Jest options
jestCommand += ' --config=src/tests/jest.config.js';
jestCommand += ' --verbose';
jestCommand += ' --coverage';

// Add test file patterns
if (tags.length > 0) {
  // Run tests for specific tags
  tags.forEach(tag => {
    const tagDir = tag.replace('@', '');
    jestCommand += ` src/tests/${tagDir}/**/*.test.{ts,tsx}`;
  });
} else {
  // Run all tests
  jestCommand += ' src/tests/**/*.test.{ts,tsx}';
}

console.log('🧪 Running tests with command:', jestCommand);
console.log('📁 Test directory:', path.resolve(__dirname));
console.log('🏷️  Tags:', tags.length > 0 ? tags.join(', ') : 'all');

try {
  execSync(jestCommand, { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..')
  });
  console.log('✅ All tests passed!');
} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
}
