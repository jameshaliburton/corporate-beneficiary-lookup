import OpenAI from 'openai';

class VisionAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeImage(imageBase64, productContext = {}) {
    const startTime = Date.now();
    
    try {
      console.log('[VisionAgent] Starting image analysis...');
      
      const prompt = this.buildPrompt(productContext);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      const result = response.choices[0].message.content;
      const parsedResult = this.parseResult(result);
      
      const duration = Date.now() - startTime;
      
      console.log('[VisionAgent] Analysis complete:', {
        success: true,
        confidence: parsedResult.confidence,
        extracted_data: parsedResult.extracted_data,
        duration_ms: duration
      });

      return {
        success: true,
        data: parsedResult.extracted_data,
        confidence: parsedResult.confidence,
        reasoning: parsedResult.reasoning,
        duration_ms: duration,
        raw_response: result
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[VisionAgent] Error during analysis:', error);
      
      return {
        success: false,
        error: error.message,
        confidence: 0,
        reasoning: `Vision analysis failed: ${error.message}`,
        duration_ms: duration
      };
    }
  }

  buildPrompt(productContext) {
    const { barcode, partialData } = productContext;
    
    let contextInfo = '';
    if (barcode) {
      contextInfo += `Barcode: ${barcode}\n`;
    }
    if (partialData && Object.keys(partialData).length > 0) {
      contextInfo += `Partial data found: ${JSON.stringify(partialData)}\n`;
    }

    return `You are analyzing a product image to extract key information for corporate ownership research.

${contextInfo ? `Context information:\n${contextInfo}\n` : ''}

Please analyze this image and extract the following information in JSON format:

{
  "product_name": "Full product name as shown on packaging",
  "brand": "Brand name (if clearly visible)",
  "company": "Manufacturing company or parent company name",
  "country_of_origin": "Country where product is made (if visible)",
  "confidence": 85,
  "reasoning": "Brief explanation of what you can see and your confidence level"
}

Guidelines:
- Focus on text that appears to be brand names, company names, or manufacturer information
- Look for "Made in", "Manufactured by", "Produced by" type labels
- If you can't read text clearly, note that in reasoning
- Confidence should be 0-100 based on clarity and completeness of information
- If no relevant information is visible, return empty strings with low confidence

Return only valid JSON.`;
  }

  parseResult(result) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        extracted_data: {
          product_name: parsed.product_name || '',
          brand: parsed.brand || '',
          company: parsed.company || '',
          country_of_origin: parsed.country_of_origin || ''
        },
        confidence: parsed.confidence || 0,
        reasoning: parsed.reasoning || 'No reasoning provided'
      };

    } catch (error) {
      console.error('[VisionAgent] Failed to parse result:', error);
      
      return {
        extracted_data: {
          product_name: '',
          brand: '',
          company: '',
          country_of_origin: ''
        },
        confidence: 0,
        reasoning: `Failed to parse vision agent response: ${error.message}. Raw response: ${result}`
      };
    }
  }

  // Helper method to determine if vision analysis should be attempted
  shouldAttemptVision(partialData) {
    // If we have some data but it's insufficient, vision might help
    if (partialData && Object.keys(partialData).length > 0) {
      return true;
    }
    
    // If we have no data at all, vision is worth trying
    return true;
  }

  // Helper method to assess if vision results are sufficient
  isVisionResultSufficient(visionResult) {
    if (!visionResult.success || visionResult.confidence < 50) {
      return false;
    }

    const data = visionResult.data;
    
    // Check if we have at least a brand or company name
    const hasBrand = data.brand && data.brand.trim().length > 0;
    const hasCompany = data.company && data.company.trim().length > 0;
    const hasProductName = data.product_name && data.product_name.trim().length > 0;

    return (hasBrand || hasCompany) && hasProductName;
  }
}

export default VisionAgent; 