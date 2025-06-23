/**
 * Test for anti-hallucination measures in AgentOwnershipResearch
 * Verifies that the agent requires credible sources and doesn't make assumptions
 */

import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js';

async function testAntiHallucination() {
  console.log('🧪 Testing Anti-Hallucination Measures\n');

  // Test 1: Unknown brand that should return "Unknown"
  console.log('1. Testing unknown brand (should return "Unknown")...');
  
  try {
    const result1 = await AgentOwnershipResearch({
      barcode: '1234567890123',
      product_name: 'Mystery Product',
      brand: 'CompletelyUnknownBrand123',
      hints: {}
    });

    console.log('✅ Unknown brand result:', {
      financial_beneficiary: result1.financial_beneficiary,
      confidence_score: result1.confidence_score,
      sources: result1.sources,
      reasoning: result1.reasoning?.substring(0, 150) + '...'
    });

    if (result1.financial_beneficiary === 'Unknown' && result1.confidence_score < 40) {
      console.log('✅ Correctly returned "Unknown" for unknown brand');
    } else {
      console.log('❌ Incorrectly made assumptions about unknown brand');
    }

  } catch (error) {
    console.log('❌ Unknown brand test failed:', error);
  }

  // Test 2: Generic brand name that could trigger assumptions
  console.log('\n2. Testing generic brand name (should be conservative)...');
  
  try {
    const result2 = await AgentOwnershipResearch({
      barcode: '1234567890124',
      product_name: 'Generic Soap',
      brand: 'CleanBrand',
      hints: {}
    });

    console.log('✅ Generic brand result:', {
      financial_beneficiary: result2.financial_beneficiary,
      confidence_score: result2.confidence_score,
      sources: result2.sources,
      reasoning: result2.reasoning?.substring(0, 150) + '...'
    });

    // Should either be "Unknown" or have very low confidence if making assumptions
    if (result2.financial_beneficiary === 'Unknown' || result2.confidence_score < 40) {
      console.log('✅ Correctly conservative about generic brand');
    } else {
      console.log('⚠️  May be making assumptions about generic brand');
    }

  } catch (error) {
    console.log('❌ Generic brand test failed:', error);
  }

  // Test 3: Brand that sounds like a known company but isn't
  console.log('\n3. Testing brand that sounds like known company...');
  
  try {
    const result3 = await AgentOwnershipResearch({
      barcode: '1234567890125',
      product_name: 'Test Chocolate',
      brand: 'NestleBrand', // Sounds like Nestlé but isn't
      hints: {}
    });

    console.log('✅ Similar-sounding brand result:', {
      financial_beneficiary: result3.financial_beneficiary,
      confidence_score: result3.confidence_score,
      sources: result3.sources,
      reasoning: result3.reasoning?.substring(0, 150) + '...'
    });

    // Should not assume it's Nestlé without evidence
    if (result3.financial_beneficiary === 'Unknown' || result3.confidence_score < 50) {
      console.log('✅ Correctly avoided assumption based on name similarity');
    } else if (result3.financial_beneficiary === 'Nestlé' && result3.confidence_score > 70) {
      console.log('⚠️  May have assumed ownership based on name similarity');
    } else {
      console.log('✅ Appropriate confidence level for uncertain case');
    }

  } catch (error) {
    console.log('❌ Similar-sounding brand test failed:', error);
  }

  // Test 4: Well-known brand that should have high confidence
  console.log('\n4. Testing well-known brand (should have high confidence)...');
  
  try {
    const result4 = await AgentOwnershipResearch({
      barcode: '1234567890126',
      product_name: 'iPhone',
      brand: 'Apple',
      hints: {}
    });

    console.log('✅ Well-known brand result:', {
      financial_beneficiary: result4.financial_beneficiary,
      confidence_score: result4.confidence_score,
      sources: result4.sources,
      reasoning: result4.reasoning?.substring(0, 150) + '...'
    });

    if (result4.financial_beneficiary === 'Apple' && result4.confidence_score > 70) {
      console.log('✅ Correctly identified well-known brand with high confidence');
    } else if (result4.financial_beneficiary === 'Apple' && result4.confidence_score > 50) {
      console.log('✅ Correctly identified well-known brand with moderate confidence');
    } else {
      console.log('⚠️  Unexpected result for well-known brand');
    }

  } catch (error) {
    console.log('❌ Well-known brand test failed:', error);
  }

  // Test 5: Check for suspicious reasoning patterns
  console.log('\n5. Testing for suspicious reasoning patterns...');
  
  try {
    const result5 = await AgentOwnershipResearch({
      barcode: '1234567890127',
      product_name: 'Test Product',
      brand: 'RandomBrandXYZ',
      hints: {}
    });

    console.log('✅ Random brand result:', {
      financial_beneficiary: result5.financial_beneficiary,
      confidence_score: result5.confidence_score,
      reasoning: result5.reasoning?.substring(0, 200) + '...'
    });

    // Check for suspicious patterns in reasoning
    const suspiciousPatterns = [
      /based on.*pattern/i,
      /likely.*owned/i,
      /probably.*subsidiary/i,
      /appears.*to be/i,
      /common.*industry/i,
      /typically.*owned/i
    ];

    const hasSuspiciousPatterns = suspiciousPatterns.some(pattern => 
      pattern.test(result5.reasoning || '')
    );

    if (hasSuspiciousPatterns && result5.confidence_score > 50) {
      console.log('⚠️  Found suspicious reasoning patterns with high confidence');
    } else if (hasSuspiciousPatterns && result5.confidence_score <= 40) {
      console.log('✅ Suspicious patterns detected and confidence appropriately reduced');
    } else if (!hasSuspiciousPatterns) {
      console.log('✅ No suspicious reasoning patterns found');
    } else {
      console.log('✅ Appropriate confidence level for uncertain case');
    }

  } catch (error) {
    console.log('❌ Suspicious patterns test failed:', error);
  }

  console.log('\n🎉 Anti-hallucination test finished!');
  console.log('\nSummary:');
  console.log('- Agent should return "Unknown" for unknown brands');
  console.log('- Agent should be conservative about generic brand names');
  console.log('- Agent should not assume ownership based on name similarity');
  console.log('- Agent should have high confidence for well-known brands');
  console.log('- Agent should detect and flag suspicious reasoning patterns');
}

// Run the test
testAntiHallucination().catch(console.error); 