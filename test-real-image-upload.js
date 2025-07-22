const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Vision-First Pipeline with Real Image Upload\n');

console.log('📋 Instructions for Testing:');
console.log('1. Go to http://localhost:3000 in your browser');
console.log('2. Click "📸 Take a photo of the product"');
console.log('3. Upload an image with clear branding/text');
console.log('4. Check the results for vision context information');
console.log('');

console.log('🔍 What to Look For:');
console.log('✅ Vision Analysis section in results');
console.log('✅ Extracted brand and product names');
console.log('✅ Vision confidence score');
console.log('✅ Success/Limited status badge');
console.log('✅ "🤖 Vision-first analysis" detection method');
console.log('');

console.log('📊 Expected Vision Context Display:');
console.log('- Extracted Brand: [Brand Name]');
console.log('- Extracted Product: [Product Name]');
console.log('- Vision Confidence: [XX]%');
console.log('- Status: Successful (green) or Limited (amber)');
console.log('');

console.log('🔧 Debug Information:');
console.log('- Check browser console for detailed logs');
console.log('- Look for "Vision context extracted" messages');
console.log('- Verify trace data includes image_processing, ocr_extraction stages');
console.log('');

console.log('⚠️ Common Issues:');
console.log('- Low confidence (< 70%) will show "Limited" status');
console.log('- No text in image will result in "Unknown Brand/Product"');
console.log('- Poor image quality may affect OCR accuracy');
console.log('');

console.log('🎯 Test Scenarios:');
console.log('1. Product with clear branding (should work well)');
console.log('2. Product with small text (may have lower confidence)');
console.log('3. Product with no text (will show "Limited" status)');
console.log('4. Manual entry fallback (when vision fails)');
console.log('');

console.log('📝 Next Steps:');
console.log('1. Try uploading a real product image');
console.log('2. Check if vision context appears in results');
console.log('3. Verify the trace modal shows all stages');
console.log('4. Test manual entry if vision extraction fails');
console.log('');

// Check if server is running
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/testping',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('✅ Server is running at http://localhost:3000');
  console.log('🚀 Ready to test vision-first pipeline!');
});

req.on('error', (e) => {
  console.log('❌ Server not running. Start with: npm run dev');
});

req.end(); 