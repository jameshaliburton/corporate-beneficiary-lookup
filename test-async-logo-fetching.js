const { findCompanyLogoWithTimeout } = require('./src/lib/services/logo-finder.ts');

async function testAsyncLogoFetching() {
  console.log('🧪 Testing async logo fetching with timeout...');
  
  const testCompanies = [
    'Apple',
    'Microsoft', 
    'Unilever',
    'Nestlé',
    'The New York Times'
  ];
  
  for (const company of testCompanies) {
    console.log(`\n🔍 Testing: ${company}`);
    
    try {
      const startTime = Date.now();
      const logoUrl = await findCompanyLogoWithTimeout(company, 1000);
      const duration = Date.now() - startTime;
      
      if (logoUrl) {
        console.log(`✅ Found logo for ${company}: ${logoUrl} (${duration}ms)`);
      } else {
        console.log(`⏰ Timeout or no logo for ${company} (${duration}ms)`);
      }
    } catch (error) {
      console.log(`❌ Error fetching logo for ${company}:`, error.message);
    }
  }
  
  console.log('\n✅ Async logo fetching test completed!');
}

testAsyncLogoFetching().catch(console.error); 