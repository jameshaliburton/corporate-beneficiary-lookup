const { generateOwnershipCopy } = require('./src/lib/services/copy-generator.ts');

async function testCopyGenerator() {
  try {
    console.log('🧪 Testing copy generator...');
    
    const testData = {
      brand: 'Abba',
      ultimateOwner: 'Orkla ASA',
      ultimateCountry: 'Norway',
      ownershipChain: [
        { name: 'Abba', country: 'Sweden', flag: '🇸🇪' },
        { name: 'Orkla Foods Sverige', country: 'Sweden', flag: '🇸🇪' },
        { name: 'Orkla ASA', country: 'Norway', flag: '🇳🇴' }
      ],
      confidence: 95,
      ownershipStructureType: 'Public Company Subsidiary',
      sources: ['LLM analysis of Abba'],
      reasoning: 'Abba is a well-known Swedish seafood brand...'
    };
    
    const result = await generateOwnershipCopy(testData);
    console.log('✅ Copy generator result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Copy generator error:', error);
  }
}

testCopyGenerator(); 