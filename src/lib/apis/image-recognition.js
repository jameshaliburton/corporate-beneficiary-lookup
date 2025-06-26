import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze product image to extract brand and product information
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} imageFormat - Image format (e.g., 'jpeg', 'png')
 * @returns {Promise<Object>} Recognition results
 */
export async function analyzeProductImage(imageBase64, imageFormat = 'jpeg') {
  try {
    console.log('🔍 Starting image analysis...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a product recognition expert. Analyze the product image and extract the following information:

1. **Brand Name**: The main brand or company name visible on the product
2. **Product Name**: The specific product name or description
3. **Product Type**: The general category of product (e.g., food, beverage, household, etc.)
4. **Confidence**: Your confidence level (0-100) in the brand and product identification
5. **Reasoning**: Brief explanation of how you identified the brand/product

IMPORTANT INSTRUCTIONS:
- Focus on the brand logo and company name prominently displayed
- Look for text that appears to be a brand name (usually larger, more prominent text)
- If you can't clearly identify a brand, say "Unknown Brand"
- If you can't clearly identify the product, provide a general description
- Be conservative with confidence scores - only give high confidence if you're very certain
- Consider that some products may have multiple brand names or sub-brands

Return your response as a JSON object with these exact fields:
{
  "brand_name": "string",
  "product_name": "string", 
  "product_type": "string",
  "confidence": number,
  "reasoning": "string"
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this product image and extract the brand and product information as specified."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/${imageFormat};base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    console.log('📸 Image analysis response:', content);

    // Try to parse JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Fallback: try to extract information from text
      result = extractInfoFromText(content);
    }

    // Validate and normalize the result
    const normalizedResult = {
      brand_name: result.brand_name || 'Unknown Brand',
      product_name: result.product_name || 'Unknown Product',
      product_type: result.product_type || 'Unknown',
      confidence: Math.min(100, Math.max(0, result.confidence || 0)),
      reasoning: result.reasoning || 'Unable to extract clear information from image'
    };

    console.log('✅ Image analysis completed:', normalizedResult);
    
    return {
      success: true,
      data: normalizedResult,
      source: 'image_recognition',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Image analysis failed:', error);
    return {
      success: false,
      error: error.message,
      source: 'image_recognition',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Extract information from text response when JSON parsing fails
 */
function extractInfoFromText(text) {
  const lines = text.split('\n');
  const result = {
    brand_name: 'Unknown Brand',
    product_name: 'Unknown Product',
    product_type: 'Unknown',
    confidence: 0,
    reasoning: text
  };

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('brand') && lowerLine.includes(':')) {
      const match = line.match(/brand[:\s]+(.+)/i);
      if (match) result.brand_name = match[1].trim();
    }
    
    if (lowerLine.includes('product') && lowerLine.includes(':')) {
      const match = line.match(/product[:\s]+(.+)/i);
      if (match) result.product_name = match[1].trim();
    }
    
    if (lowerLine.includes('confidence') && lowerLine.includes(':')) {
      const match = line.match(/confidence[:\s]+(\d+)/i);
      if (match) result.confidence = parseInt(match[1]);
    }
  }

  return result;
}

/**
 * Convert file buffer to base64
 */
export function bufferToBase64(buffer) {
  return buffer.toString('base64');
} 