const fs = require('fs');
const path = require('path');

// Simple test to verify OCR is working
async function testOCR() {
  try {
    console.log('🧪 Testing OCR functionality...');
    
    // Create a simple test image (base64 encoded small image)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const response = await fetch('http://localhost:3001/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode: 'test_img_123',
        image_base64: `data:image/png;base64,${testImageBase64}`,
        evaluation_mode: false
      }),
    });

    const data = await response.json();
    console.log('📊 OCR Test Result:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ OCR test passed!');
    } else {
      console.log('❌ OCR test failed:', data.error || data.message);
    }
    
  } catch (error) {
    console.error('❌ OCR test error:', error);
  }
}

// Run the test
testOCR(); 