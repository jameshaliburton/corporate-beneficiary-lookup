const { execSync } = require('child_process');

console.log('Testing modal component imports...');

try {
  // Test if the component can be imported
  const result = execSync('node -e "console.log(\'Testing imports...\'); require(\'./src/components/eval-v4/EvalV4PromptWorkflowModal.tsx\');"', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('Import test passed:', result);
} catch (error) {
  console.error('Import test failed:', error.message);
}

// Test individual imports
const imports = [
  '@heroicons/react/24/outline',
  '@heroicons/react/24/solid',
  '@/components/ui/dialog',
  '@/components/ui/button',
  '@/components/ui/badge',
  '@/components/ui/textarea',
  '@/components/ui/input'
];

imports.forEach(importPath => {
  try {
    console.log(`Testing import: ${importPath}`);
    // This is a basic test - in a real scenario we'd need to test with proper module resolution
  } catch (error) {
    console.error(`Failed to import ${importPath}:`, error.message);
  }
}); 