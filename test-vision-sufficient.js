// Test the isVisionResultSufficient logic directly
function isVisionResultSufficient(visionResult) {
  if (!visionResult.success || visionResult.confidence < 50) {
    return false;
  }

  const data = visionResult.data;
  
  // Check if we have at least a brand or company name
  const hasBrand = data.brand && data.brand.trim().length > 0;
  const hasCompany = data.company && data.company.trim().length > 0;
  
  // For ownership research, a meaningful brand/company alone is sufficient
  // Product name is helpful but not required
  return hasBrand || hasCompany;
}

// Test case: Malmö Chokladfabrik (brand only, no product name)
const testResult = {
  success: true,
  confidence: 75,
  data: {
    product_name: '',
    brand: 'Malmö Chokladfabrik',
    company: '',
    country_of_origin: ''
  },
  reasoning: "The text 'Malmö Chokladfabrik' is clearly visible on the packaging, indicating the brand. However, there is no visible information about the product name, company, or country of origin."
};

console.log('Testing vision result sufficiency...');
console.log('Test data:', testResult.data);
console.log('Is sufficient?', isVisionResultSufficient(testResult));

// Test case: Nike (brand only)
const testResult2 = {
  success: true,
  confidence: 85,
  data: {
    product_name: '',
    brand: 'Nike',
    company: '',
    country_of_origin: ''
  }
};

console.log('\nTest data 2:', testResult2.data);
console.log('Is sufficient?', isVisionResultSufficient(testResult2));

// Test case: No brand
const testResult3 = {
  success: true,
  confidence: 60,
  data: {
    product_name: 'Some Product',
    brand: '',
    company: '',
    country_of_origin: ''
  }
};

console.log('\nTest data 3:', testResult3.data);
console.log('Is sufficient?', isVisionResultSufficient(testResult3));

// Test case: Low confidence
const testResult4 = {
  success: true,
  confidence: 30,
  data: {
    product_name: '',
    brand: 'Malmö Chokladfabrik',
    company: '',
    country_of_origin: ''
  }
};

console.log('\nTest data 4 (low confidence):', testResult4.data);
console.log('Is sufficient?', isVisionResultSufficient(testResult4)); 