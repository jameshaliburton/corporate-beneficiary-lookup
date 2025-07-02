import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Quality Assessment Agent - Evaluates product data quality using lightweight AI
 * Uses GPT-3.5-turbo for fast, cheap assessment of whether product data is meaningful
 */
export class QualityAssessmentAgent {
  constructor() {
    this.model = 'gpt-3.5-turbo'; // Lightweight, fast, cheap model
    this.maxTokens = 150; // Short response for classification
  }

  /**
   * Assess the quality of product data from barcode lookup
   * @param {Object} productData - Product data from barcode lookup
   * @returns {Promise<Object>} Quality assessment result
   */
  async assessProductDataQuality(productData) {
    try {
      console.log('🔍 Quality Assessment Agent: Analyzing product data...');
      
      const prompt = this.buildAssessmentPrompt(productData);
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.1, // Low temperature for consistent classification
      });

      const result = response.choices[0].message.content;
      const assessment = this.parseAssessmentResult(result);
      
      console.log('✅ Quality Assessment complete:', assessment);
      
      return {
        success: true,
        assessment,
        reasoning: assessment.reasoning,
        is_meaningful: assessment.is_meaningful,
        confidence: assessment.confidence,
        quality_score: assessment.quality_score,
        issues: assessment.issues
      };

    } catch (error) {
      console.error('❌ Quality Assessment Agent error:', error);
      return {
        success: false,
        error: error.message,
        fallback_assessment: this.fallbackAssessment(productData)
      };
    }
  }

  /**
   * Get the system prompt for the agent
   */
  getSystemPrompt() {
    return `You are a Product Data Quality Assessment Agent. Your job is to determine if product data is meaningful enough to proceed with corporate ownership research.

CRITERIA FOR MEANINGFUL DATA (for ownership research):
1. BRAND: Must be a recognizable brand/company name (not "Unknown", "N/A", "Generic", etc.)
2. PRODUCT NAME: Helpful but NOT required if brand is meaningful
3. OWNERSHIP RESEARCH READINESS: Brand should be a real company that can be researched

IMPORTANT: For ownership research, a meaningful brand alone is sufficient. We can research "Nike" even without knowing the specific product.

EXAMPLES:
✅ MEANINGFUL (sufficient for ownership research):
- Brand="Apple", Product="iPhone 15" 
- Brand="Coca-Cola", Product="Coke"
- Brand="Nike" (no product name needed)
- Brand="Samsung" (no product name needed)
- Brand="Pepsi" (no product name needed)

❌ NOT MEANINGFUL:
- Brand="Unknown Brand", Product="Unknown Product" 
- Brand="Unknown Brand", Product="Product with 1234567890"
- Brand="Generic", Product="Soda"
- Brand="Store Brand", Product="Item 12345"
- Brand contains "Unknown", "N/A", "Generic", "Undefined"
- No brand provided

QUALITY SCORING:
- 80-100: Strong brand + specific product (perfect for ownership research)
- 60-79: Strong brand alone or weak brand + product (good for ownership research)  
- 40-59: Weak brand or very generic brand (marginal)
- 0-39: Missing/generic brand (not suitable)

Respond with valid JSON only. Be reasonable - if brand is identifiable, mark as meaningful even without product name.`;
  }

  /**
   * Build the assessment prompt with product data
   */
  buildAssessmentPrompt(productData) {
    const dataSource = productData.result_type || 'unknown';
    
    return `Please assess if this product data is sufficient for corporate ownership research:

BRAND: "${productData.brand || 'MISSING'}"
PRODUCT NAME: "${productData.product_name || 'MISSING'}"
DATA SOURCE: "${dataSource}"
${productData.barcode ? `BARCODE: "${productData.barcode}"` : ''}
${productData.category ? `CATEGORY: "${productData.category}"` : ''}
${productData.country ? `COUNTRY: "${productData.country}"` : ''}

QUESTION: Can we research the corporate ownership of this brand/product with the given information?

Respond with JSON only:
{
  "is_meaningful": true/false,
  "confidence": 0-100,
  "quality_score": 0-100,
  "reasoning": "brief explanation focusing on ownership research readiness",
  "issues": ["list", "of", "problems", "if", "any"]
}`;
  }

  /**
   * Parse the assessment result from AI response
   */
  parseAssessmentResult(result) {
    try {
      // Extract JSON from response (handle any extra text)
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        is_meaningful: Boolean(parsed.is_meaningful),
        confidence: Math.min(100, Math.max(0, parsed.confidence || 0)),
        quality_score: Math.min(100, Math.max(0, parsed.quality_score || 0)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        issues: Array.isArray(parsed.issues) ? parsed.issues : []
      };
      
    } catch (error) {
      console.error('Failed to parse assessment result:', error);
      return {
        is_meaningful: false,
        confidence: 0,
        quality_score: 0,
        reasoning: 'Failed to parse AI assessment',
        issues: ['Parse error']
      };
    }
  }

  /**
   * Fallback assessment when AI fails
   */
  fallbackAssessment(productData) {
    const brandValue = (productData.brand || '').toLowerCase().trim();
    const productValue = (productData.product_name || '').toLowerCase().trim();
    
    // Check for clearly invalid/unknown brand values
    const invalidBrandTerms = ['unknown', 'generic', 'n/a', 'null', 'undefined', 'brand'];
    const hasBrand = productData.brand && 
      brandValue.length > 2 &&
      !invalidBrandTerms.some(term => brandValue.includes(term));
      
    // Check for clearly invalid/unknown product values  
    const invalidProductTerms = ['unknown', 'product with', 'generic', 'n/a', 'null', 'undefined'];
    const hasProduct = productData.product_name &&
      productValue.length > 2 &&
      !invalidProductTerms.some(term => productValue.includes(term));
      
    // For ownership research, brand alone is sufficient
    const isMeaningful = hasBrand;
    const qualityScore = hasBrand ? (hasProduct ? 75 : 65) : 20;
      
    return {
      is_meaningful: isMeaningful,
      confidence: 60,
      quality_score: qualityScore,
      reasoning: hasBrand ? 
        (hasProduct ? 'Fallback: Brand and product identified' : 'Fallback: Brand identified (sufficient for ownership research)') :
        `Fallback: No meaningful brand identified (brand: "${productData.brand || 'missing'}")`,
      issues: !hasBrand ? ['Missing or generic brand'] : [],
      fallback: true
    };
  }

  /**
   * Get the prompt for the dashboard
   */
  static getPromptForDashboard() {
    return {
      name: 'Quality Assessment Agent',
      version: '1.0',
      description: 'Assesses product data quality from barcode lookups to determine if data is meaningful enough for ownership research',
      model: 'gpt-3.5-turbo',
      system_prompt: `You are a Product Data Quality Assessment Agent. Your job is to determine if product data from a barcode lookup is meaningful enough to proceed with corporate ownership research.

CRITERIA FOR MEANINGFUL DATA (for ownership research):
1. BRAND: Must be a recognizable brand/company name (not "Unknown", "N/A", "Generic", etc.)
2. PRODUCT NAME: Helpful but NOT required if brand is meaningful
3. OWNERSHIP RESEARCH READINESS: Brand should be a real company that can be researched

IMPORTANT: For ownership research, a meaningful brand alone is sufficient. We can research "Nike" even without knowing the specific product.

EXAMPLES:
✅ MEANINGFUL (sufficient for ownership research):
- Brand="Apple", Product="iPhone 15" 
- Brand="Coca-Cola", Product="Coke"
- Brand="Nike" (no product name needed)
- Brand="Samsung" (no product name needed)
- Brand="Pepsi" (no product name needed)

❌ NOT MEANINGFUL:
- Brand="Unknown Brand", Product="Unknown Product" 
- Brand="Unknown Brand", Product="Product with 1234567890"
- Brand="Generic", Product="Soda"
- Brand="Store Brand", Product="Item 12345"
- Brand contains "Unknown", "N/A", "Generic", "Undefined"
- No brand provided

QUALITY SCORING:
- 80-100: Strong brand + specific product (perfect for ownership research)
- 60-79: Strong brand alone or weak brand + product (good for ownership research)  
- 40-59: Weak brand or very generic brand (marginal)
- 0-39: Missing/generic brand (not suitable)

Respond with valid JSON only. Be reasonable - if brand is identifiable, mark as meaningful even without product name.`,
      user_prompt_template: `Please assess if this product data is sufficient for corporate ownership research:

BRAND: "{{brand}}"
PRODUCT NAME: "{{product_name}}"
DATA SOURCE: "{{result_type || 'unknown'}}"
{{productData.barcode ? 'BARCODE: "' + productData.barcode + '"' : ''}}
{{productData.category ? 'CATEGORY: "' + productData.category + '"' : ''}}
{{productData.country ? 'COUNTRY: "' + productData.country + '"' : ''}}

QUESTION: Can we research the corporate ownership of this brand/product with the given information?

Respond with JSON only:
{
  "is_meaningful": true/false,
  "confidence": 0-100,
  "quality_score": 0-100,
  "reasoning": "brief explanation focusing on ownership research readiness",
  "issues": ["list", "of", "problems", "if", "any"]
}`,
      parameters: {
        max_tokens: 150,
        temperature: 0.1,
        model: 'gpt-3.5-turbo'
      },
      usage: 'Called before ownership research to determine if product data is sufficient',
      category: 'quality_assessment'
    };
  }
} 