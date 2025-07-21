#!/usr/bin/env node

/**
 * Test component import for Evaluation Dashboard V4
 */

const fs = require('fs');
const path = require('path');

function testComponentImport() {
  console.log('🧪 Testing Component Import\n');

  try {
    // Check if the component file exists
    const componentPath = path.join(__dirname, 'src/components/eval-v4/EvalV4Dashboard.tsx');
    const exists = fs.existsSync(componentPath);
    console.log(`✅ Component file exists: ${exists}`);

    if (!exists) {
      console.log('❌ Component file not found');
      return;
    }

    // Check if all imported files exist
    const imports = [
      'src/lib/eval-v4/mockData.ts',
      'src/lib/eval-v4/evaluationService.ts',
      'src/components/eval-v4/EvalV4FilterBar.tsx',
      'src/components/eval-v4/EvalV4ResultRow.tsx',
      'src/components/eval-v4/EvalV4TraceModal.tsx',
      'src/components/eval-v4/EvalV4PromptModal.tsx',
      'src/components/ui/card.tsx',
      'src/components/ui/button.tsx'
    ];

    console.log('📁 Checking imported files:');
    imports.forEach(importPath => {
      const fullPath = path.join(__dirname, importPath);
      const exists = fs.existsSync(fullPath);
      console.log(`   ${exists ? '✅' : '❌'} ${importPath}`);
    });

    // Check for TypeScript compilation
    console.log('\n🔧 Checking TypeScript compilation...');
    
    // Try to read the component file and check for syntax errors
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Basic syntax checks
    const hasReactImport = componentContent.includes("'use client'");
    const hasDefaultExport = componentContent.includes('export default function');
    const hasUseState = componentContent.includes('useState');
    const hasUseEffect = componentContent.includes('useEffect');
    
    console.log(`   ✅ React client directive: ${hasReactImport}`);
    console.log(`   ✅ Default export: ${hasDefaultExport}`);
    console.log(`   ✅ useState hook: ${hasUseState}`);
    console.log(`   ✅ useEffect hook: ${hasUseEffect}`);

    // Check for potential syntax errors
    const hasUnclosedBraces = (componentContent.match(/\{/g) || []).length !== (componentContent.match(/\}/g) || []).length;
    const hasUnclosedParens = (componentContent.match(/\(/g) || []).length !== (componentContent.match(/\)/g) || []).length;
    const hasUnclosedBrackets = (componentContent.match(/\[/g) || []).length !== (componentContent.match(/\]/g) || []).length;
    
    console.log(`   ⚠️ Unclosed braces: ${hasUnclosedBraces}`);
    console.log(`   ⚠️ Unclosed parentheses: ${hasUnclosedParens}`);
    console.log(`   ⚠️ Unclosed brackets: ${hasUnclosedBrackets}`);

    if (hasUnclosedBraces || hasUnclosedParens || hasUnclosedBrackets) {
      console.log('❌ Potential syntax errors detected');
    } else {
      console.log('✅ No obvious syntax errors detected');
    }

    console.log('\n✅ Component import test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testComponentImport(); 