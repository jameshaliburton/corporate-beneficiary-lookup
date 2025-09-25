async function testWebSearch() {
  try {
    console.log('Testing Google API configuration...');
    console.log('GOOGLE_API_KEY exists:', !!process.env.GOOGLE_API_KEY);
    console.log('GOOGLE_CSE_ID exists:', !!process.env.GOOGLE_CSE_ID);
    
    if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID) {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=${encodeURIComponent('Coca-Cola company ownership')}&num=3`
      );
      const data = await response.json();
      
      if (data.items) {
        console.log('✅ Web search working! Found', data.items.length, 'results');
        console.log('Sample result:', data.items[0].title);
        console.log('Sample snippet:', data.items[0].snippet.substring(0, 100) + '...');
        console.log('Source:', data.items[0].displayLink);
      } else {
        console.log('❌ No search results found');
        if (data.error) {
          console.log('Error:', data.error);
        }
      }
    } else {
      console.log('❌ Google API keys not configured');
    }
  } catch (error) {
    console.log('❌ Web search test failed:', error.message);
  }
}

testWebSearch();

