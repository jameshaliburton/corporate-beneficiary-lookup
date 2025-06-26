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
   * Build the assessment prompt with product data
   */
  buildAssessmentPrompt(productData) {
    return `Please assess the quality of this product data:

BRAND: "${productData.brand || 'MISSING'}"
PRODUCT NAME: "${productData.product_name || 'MISSING'}"
BARCODE: "${productData.barcode || 'MISSING'}"
CATEGORY: "${productData.category || 'MISSING'}"
COUNTRY: "${productData.country || 'MISSING'}"
MANUFACTURER: "${productData.manufacturer || 'MISSING'}"
INGREDIENTS: "${productData.ingredients || 'MISSING'}"
WEIGHT: "${productData.weight || 'MISSING'}"

Respond with JSON only:
{
  "is_meaningful": true/false,
  "confidence": 0-100,
  "quality_score": 0-100,
  "reasoning": "brief explanation",
  "issues": ["list", "of", "problems"]
}`;
  }

  /**
   * Get the system prompt for the agent
   */
  getSystemPrompt() {
    return `You are a Product Data Quality Assessment Agent. Your job is to determine if product data from a barcode lookup is meaningful enough to proceed with ownership research.

CRITERIA FOR MEANINGFUL DATA:
1. BRAND: Must be a specific brand name (not "Unknown", "N/A", "Generic", etc.)
2. PRODUCT NAME: Must be specific (not "Product with barcode", "Item with barcode", etc.)
3. COMPLETENESS: Should have at least brand + product name + some additional data
4. SPECIFICITY: Data should be specific enough to identify the actual product

EXAMPLES:
✅ MEANINGFUL: Brand="Nestlé", Product="KitKat Chocolate Bar", Category="Snacks"
❌ NOT MEANINGFUL: Brand="Unknown Brand", Product="Product with 1234567890"

Respond with valid JSON only. Be conservative - if in doubt, mark as not meaningful.`;
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
    const hasBrand = productData.brand && 
      !productData.brand.toLowerCase().includes('unknown') &&
      productData.brand.trim().length > 2;
      
    const hasProduct = productData.product_name &&
      !productData.product_name.toLowerCase().includes('product with') &&
      productData.product_name.trim().length > 2;
      
    return {
      is_meaningful: hasBrand && hasProduct,
      confidence: 50,
      quality_score: hasBrand && hasProduct ? 60 : 20,
      reasoning: 'Fallback assessment using basic pattern matching',
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
      system_prompt: `You are a Product Data Quality Assessment Agent. Your job is to determine if product data from a barcode lookup is meaningful enough to proceed with ownership research.

CRITERIA FOR MEANINGFUL DATA:
1. BRAND: Must be a specific brand name (not "Unknown", "N/A", "Generic", etc.)
2. PRODUCT NAME: Must be specific (not "Product with barcode", "Item with barcode", etc.)
3. COMPLETENESS: Should have at least brand + product name + some additional data
4. SPECIFICITY: Data should be specific enough to identify the actual product

EXAMPLES:
✅ MEANINGFUL: Brand="Nestlé", Product="KitKat Chocolate Bar", Category="Snacks"
❌ NOT MEANINGFUL: Brand="Unknown Brand", Product="Product with 1234567890"

Respond with valid JSON only. Be conservative - if in doubt, mark as not meaningful.`,
      user_prompt_template: `Please assess the quality of this product data:

BRAND: "{{brand}}"
PRODUCT NAME: "{{product_name}}"
BARCODE: "{{barcode}}"
CATEGORY: "{{category}}"
COUNTRY: "{{country}}"
MANUFACTURER: "{{manufacturer}}"
INGREDIENTS: "{{ingredients}}"
WEIGHT: "{{weight}}"

Respond with JSON only:
{
  "is_meaningful": true/false,
  "confidence": 0-100,
  "quality_score": 0-100,
  "reasoning": "brief explanation",
  "issues": ["list", "of", "problems"]
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