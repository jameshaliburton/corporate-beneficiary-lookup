import OpenAI from 'openai';
import { supabase } from '../supabase.ts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Check Supabase cache for existing product data
 */
async function checkSupabaseCache(brand, product_name) {
  try {
    if (!brand || brand === 'Unknown Brand') {
      return null;
    }

    // Try to find by brand name first
    const { data: cached, error: cacheError } = await supabase
      .from('products')
      .select('*')
      .ilike('brand', `%${brand}%`)
      .maybeSingle();
    
    if (cacheError) {
      console.error('Products table lookup error:', cacheError);
      return null;
    }
    
    if (cached) {
      console.log('✅ Found in Supabase cache by brand:', cached);
      return cached;
    }

    // If no brand match, try by product name if we have one
    if (product_name && product_name !== 'Unknown Product') {
      const { data: cachedByProduct, error: productCacheError } = await supabase
        .from('products')
        .select('*')
        .ilike('product_name', `%${product_name}%`)
        .maybeSingle();
      
      if (!productCacheError && cachedByProduct) {
        console.log('✅ Found in Supabase cache by product name:', cachedByProduct);
        return cachedByProduct;
      }
    }
    
    return null;
  } catch (err) {
    console.error('Supabase cache check error:', err);
    return null;
  }
}

/**
 * Check ownership mappings database for brand-based ownership
 */
async function checkOwnershipMappings(brand) {
  try {
    if (!brand || brand === 'Unknown Brand') {
      return null;
    }

    const { data, error } = await supabase
      .from('ownership_mappings')
      .select('*')
      .ilike('brand_name', `%${brand}%`)
      .maybeSingle();
    
    if (error) {
      console.error('Ownership mappings lookup error:', error);
      return null;
    }
    
    if (data) {
      console.log('✅ Found in ownership mappings:', data);
      const ownership_flow = [
        data.brand_name,
        data.regional_entity,
        data.intermediate_entity,
        data.ultimate_owner_name
      ].filter(Boolean);
      
      return {
        success: true,
        financial_beneficiary: data.ultimate_owner_name,
        beneficiary_country: data.ultimate_owner_country,
        beneficiary_flag: data.ultimate_owner_flag,
        ownership_flow,
        source: 'ownership_mappings',
        result_type: 'static-ownership-mapping'
      };
    }
    
    return null;
  } catch (err) {
    console.error('Ownership mappings lookup error:', err);
    return null;
  }
}

/**
 * Analyze product image using the new flow: Cache → OCR → lightweight brand extractor → quality agent → vision agent (if needed)
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} imageFormat - Image format (e.g., 'jpeg', 'png')
 * @returns {Promise<Object>} Recognition results
 */
export async function analyzeProductImage(imageBase64, imageFormat = 'jpeg') {
  try {
    console.log('🔍 Starting enhanced image analysis flow with cache checks...');
    
    // Step 1: OCR + Lightweight Brand Extractor (Claude Haiku equivalent - using GPT-3.5-turbo for speed)
    console.log('📝 Step 1: Running OCR + Lightweight brand extractor...');
    const initialAnalysis = await runLightweightAnalysis(imageBase64, imageFormat);
    
    console.log('📊 Initial analysis result:', initialAnalysis);
    
    // Step 1.5: Check cache with extracted brand/product
    console.log('🔍 Step 1.5: Checking cache with extracted data...');
    const cachedData = await checkSupabaseCache(initialAnalysis.brand_name, initialAnalysis.product_name);
    
    if (cachedData) {
      console.log('✅ Found cached data, returning with ownership data');
      return {
        success: true,
        data: {
          ...initialAnalysis,
          financial_beneficiary: cachedData.financial_beneficiary,
          beneficiary_country: cachedData.beneficiary_country,
          beneficiary_flag: cachedData.beneficiary_flag,
          ownership_flow: cachedData.ownership_flow,
          confidence: 85, // High confidence for cached data
          reasoning: 'Found cached ownership data'
        },
        source: 'enhanced_image_recognition_with_cache',
        flow: {
          step1: 'ocr_lightweight_extractor',
          step1_5: 'cache_check_success',
          final_confidence: 85,
          cache_hit: true
        },
        // Store contextual clues in the result for UI display
        contextual_clues: {
          step: 'lightweight_analysis',
          step_name: 'OCR + Contextual Clue Extraction',
          extracted_data: {
            brand_name: initialAnalysis.brand_name,
            product_name: initialAnalysis.product_name,
            product_type: initialAnalysis.product_type,
            confidence: initialAnalysis.confidence,
            reasoning: initialAnalysis.reasoning,
            language_indicators: initialAnalysis.language_indicators,
            country_indicators: initialAnalysis.country_indicators,
            product_style: initialAnalysis.product_style,
            packaging_characteristics: initialAnalysis.packaging_characteristics,
            regional_clues: initialAnalysis.regional_clues,
            certification_marks: initialAnalysis.certification_marks,
            store_brand_indicators: initialAnalysis.store_brand_indicators,
            premium_indicators: initialAnalysis.premium_indicators,
            dietary_indicators: initialAnalysis.dietary_indicators,
            size_format: initialAnalysis.size_format
          },
          raw_extraction: initialAnalysis.raw_extraction,
          extraction_timestamp: initialAnalysis.extraction_timestamp
        },
        timestamp: new Date().toISOString()
      };
    }
    
    // Step 1.6: Check ownership mappings
    console.log('🗂️ Step 1.6: Checking ownership mappings...');
    const ownershipData = await checkOwnershipMappings(initialAnalysis.brand_name);
    
    if (ownershipData) {
      console.log('✅ Found ownership mapping, returning with ownership data');
      return {
        success: true,
        data: {
          ...initialAnalysis,
          financial_beneficiary: ownershipData.financial_beneficiary,
          beneficiary_country: ownershipData.beneficiary_country,
          beneficiary_flag: ownershipData.beneficiary_flag,
          ownership_flow: ownershipData.ownership_flow,
          confidence: 85, // High confidence for ownership mapping
          reasoning: 'Found ownership mapping in database'
        },
        source: 'enhanced_image_recognition_with_ownership_mapping',
        flow: {
          step1: 'ocr_lightweight_extractor',
          step1_5: 'cache_check_failed',
          step1_6: 'ownership_mapping_success',
          final_confidence: 85,
          ownership_mapping_hit: true
        },
        // Store contextual clues in the result for UI display
        contextual_clues: {
          step: 'lightweight_analysis',
          step_name: 'OCR + Contextual Clue Extraction',
          extracted_data: {
            brand_name: initialAnalysis.brand_name,
            product_name: initialAnalysis.product_name,
            product_type: initialAnalysis.product_type,
            confidence: initialAnalysis.confidence,
            reasoning: initialAnalysis.reasoning,
            language_indicators: initialAnalysis.language_indicators,
            country_indicators: initialAnalysis.country_indicators,
            product_style: initialAnalysis.product_style,
            packaging_characteristics: initialAnalysis.packaging_characteristics,
            regional_clues: initialAnalysis.regional_clues,
            certification_marks: initialAnalysis.certification_marks,
            store_brand_indicators: initialAnalysis.store_brand_indicators,
            premium_indicators: initialAnalysis.premium_indicators,
            dietary_indicators: initialAnalysis.dietary_indicators,
            size_format: initialAnalysis.size_format
          },
          raw_extraction: initialAnalysis.raw_extraction,
          extraction_timestamp: initialAnalysis.extraction_timestamp
        },
        timestamp: new Date().toISOString()
      };
    }
    
    // Step 2: Quality Assessment
    console.log('🧐 Step 2: Running quality assessment...');
    const qualityResult = await assessQuality(initialAnalysis);
    
    console.log('📈 Quality assessment result:', qualityResult);
    
    // Step 3: Vision Agent (if confidence is low)
    let finalAnalysis = qualityResult;
    let visionAgentUsed = false;
    let visionAgentData = null;
    
    if (qualityResult.needs_escalation) {
      console.log('🔍 Step 3: Running vision agent (high-powered analysis)...');
      const visionResult = await runVisionAgent(imageBase64, imageFormat, qualityResult);
      
      if (visionResult.success && visionResult.confidence > qualityResult.confidence) {
        console.log('✅ Vision agent improved results');
        finalAnalysis = {
          ...qualityResult,
          brand_name: visionResult.brand_name || qualityResult.brand_name,
          product_name: visionResult.product_name || qualityResult.product_name,
          confidence: visionResult.confidence,
          reasoning: visionResult.reasoning
        };
        visionAgentUsed = true;
        visionAgentData = visionResult;
      } else {
        console.log('❌ Vision agent did not improve results, keeping quality assessment');
      }
    }
    
    console.log('🎯 Final analysis result:', finalAnalysis);
    
    return {
      success: true,
      data: finalAnalysis,
      source: visionAgentUsed ? 'enhanced_image_recognition_with_vision' : 'enhanced_image_recognition',
      flow: {
        step1: 'ocr_lightweight_extractor',
        step1_5: 'cache_check_failed',
        step1_6: 'ownership_mapping_failed',
        step2: 'quality_assessment',
        step3: visionAgentUsed ? 'vision_agent_used' : 'vision_agent_skipped',
        final_confidence: finalAnalysis.confidence,
        vision_agent_used: visionAgentUsed
      },
      // Store contextual clues in the result for UI display
      contextual_clues: {
        step: 'lightweight_analysis',
        step_name: 'OCR + Contextual Clue Extraction',
        extracted_data: {
          brand_name: initialAnalysis.brand_name,
          product_name: initialAnalysis.product_name,
          product_type: initialAnalysis.product_type,
          confidence: initialAnalysis.confidence,
          reasoning: initialAnalysis.reasoning,
          language_indicators: initialAnalysis.language_indicators,
          country_indicators: initialAnalysis.country_indicators,
          product_style: initialAnalysis.product_style,
          packaging_characteristics: initialAnalysis.packaging_characteristics,
          regional_clues: initialAnalysis.regional_clues,
          certification_marks: initialAnalysis.certification_marks,
          store_brand_indicators: initialAnalysis.store_brand_indicators,
          premium_indicators: initialAnalysis.premium_indicators,
          dietary_indicators: initialAnalysis.dietary_indicators,
          size_format: initialAnalysis.size_format
        },
        raw_extraction: initialAnalysis.raw_extraction,
        extraction_timestamp: initialAnalysis.extraction_timestamp,
        quality_assessment: {
          step: 'quality_assessment',
          step_name: 'Quality Assessment Agent',
          result: qualityResult,
          needs_escalation: qualityResult.needs_escalation
        },
        vision_agent: visionAgentUsed ? {
          step: 'vision_agent',
          step_name: 'Vision Agent (High-Powered Analysis)',
          used: true,
          result: visionAgentData,
          improved_results: visionAgentData && visionAgentData.confidence > qualityResult.confidence
        } : {
          step: 'vision_agent',
          step_name: 'Vision Agent (High-Powered Analysis)',
          used: false,
          reason: 'Quality assessment confidence sufficient'
        }
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in enhanced image analysis:', error);
    return {
      success: false,
      error: error.message,
      source: 'enhanced_image_recognition_error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Step 1: Enhanced OCR + Contextual Clue Extractor
 * Extracts brand/product info AND multiple contextual clues for disambiguation
 */
async function runLightweightAnalysis(imageBase64, imageFormat) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use GPT-4o for image support
      messages: [
        {
          role: "system",
          content: `You are an enhanced OCR and contextual analysis tool. Analyze the product image and extract:

1. **Brand Name**: The main brand/company name (look for logos, prominent text)
2. **Product Name**: Specific product name or description
3. **Product Type**: General category (food, beverage, household, etc.)
4. **Confidence**: Your confidence level (0-100) in the identification
5. **Reasoning**: Brief explanation of what you found

PLUS extract these contextual clues for brand disambiguation:

6. **Language Indicators**: What languages do you see on the packaging? (e.g., "Swedish", "English", "German", "French")
7. **Country Indicators**: Any country-specific clues? (e.g., "Made in Sweden", "Product of USA", flags, country codes)
8. **Product Style**: What style/type of product is this? (e.g., "American Style", "Traditional", "Organic", "Premium")
9. **Packaging Characteristics**: Any distinctive packaging features? (e.g., "Glass jar", "Plastic bottle", "Metal can", "Cardboard box")
10. **Regional Clues**: Any regional or cultural indicators? (e.g., "Nordic", "Mediterranean", "Asian", "European")
11. **Certification Marks**: Any certification logos or marks? (e.g., "Organic", "Fair Trade", "Kosher", "Halal")
12. **Store Brand Indicators**: Does this look like a store brand? (e.g., "Private label", "Store brand", "Generic")
13. **Premium Indicators**: Any premium/luxury indicators? (e.g., "Premium", "Artisanal", "Craft", "Gourmet")
14. **Dietary Indicators**: Any dietary restrictions or preferences? (e.g., "Vegan", "Gluten-free", "Low-sodium", "Sugar-free")
15. **Size/Format**: What size or format is this? (e.g., "Family size", "Travel size", "Mini", "Large")

IMPORTANT:
- Be fast and efficient - this is the lightweight first pass
- Focus on visible text and obvious visual cues
- Don't guess - if you're not sure about a clue, mark it as "Unknown" or omit it
- For language detection, look for actual text in different languages
- For country indicators, look for "Made in", "Product of", flags, or country codes
- These clues will help distinguish between similar brand names in different countries

Return your analysis as JSON with all fields.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this product image and extract brand, product, and contextual clues for disambiguation."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/${imageFormat};base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    console.log('📝 Raw lightweight analysis response:', content);

    // Parse the response
    let parsedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to text parsing
        parsedData = extractInfoFromText(content);
      }
    } catch (parseError) {
      console.error('❌ Error parsing lightweight analysis response:', parseError);
      parsedData = extractInfoFromText(content);
    }

    // Ensure all required fields are present
    const result = {
      brand_name: parsedData.brand_name || parsedData.brand || parsedData['Brand Name'] || 'Unknown Brand',
      product_name: parsedData.product_name || parsedData['Product Name'] || 'Unknown Product',
      product_type: parsedData.product_type || parsedData['Product Type'] || 'Unknown',
      confidence: parsedData.confidence || parsedData['Confidence'] || 50,
      reasoning: parsedData.reasoning || parsedData['Reasoning'] || 'Extracted from image analysis',
      
      // Contextual clues for disambiguation
      language_indicators: parsedData.language_indicators || parsedData['Language Indicators'] || [],
      country_indicators: parsedData.country_indicators || parsedData['Country Indicators'] || [],
      product_style: parsedData.product_style || parsedData['Product Style'] || 'Unknown',
      packaging_characteristics: parsedData.packaging_characteristics || parsedData['Packaging Characteristics'] || [],
      regional_clues: parsedData.regional_clues || parsedData['Regional Clues'] || [],
      certification_marks: parsedData.certification_marks || parsedData['Certification Marks'] || [],
      store_brand_indicators: parsedData.store_brand_indicators || parsedData['Store Brand Indicators'] || false,
      premium_indicators: parsedData.premium_indicators || parsedData['Premium Indicators'] || false,
      dietary_indicators: parsedData.dietary_indicators || parsedData['Dietary Indicators'] || [],
      size_format: parsedData.size_format || parsedData['Size/Format'] || 'Unknown',
      
      // Raw extraction for debugging
      raw_extraction: content,
      extraction_timestamp: new Date().toISOString()
    };

    console.log('🔍 Enhanced lightweight analysis result:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in lightweight analysis:', error);
    return {
      brand_name: 'Unknown Brand',
      product_name: 'Unknown Product',
      product_type: 'Unknown',
      confidence: 0,
      reasoning: 'Error in image analysis',
      language_indicators: [],
      country_indicators: [],
      product_style: 'Unknown',
      packaging_characteristics: [],
      regional_clues: [],
      certification_marks: [],
      store_brand_indicators: false,
      premium_indicators: false,
      dietary_indicators: [],
      size_format: 'Unknown',
      raw_extraction: 'Error occurred during analysis',
      extraction_timestamp: new Date().toISOString()
    };
  }
}

/**
 * Step 2: Quality Assessment Agent
 */
async function assessQuality(analysisResult) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a quality assessment agent. Evaluate the brand and product identification quality:

ANALYSIS TO ASSESS:
Brand: "${analysisResult.brand_name}"
Product: "${analysisResult.product_name}"
Type: "${analysisResult.product_type}"
Initial Confidence: ${analysisResult.confidence}
Reasoning: "${analysisResult.reasoning}"

ASSESSMENT CRITERIA:
1. **Brand Specificity**: Is the brand name specific and recognizable? (vs generic terms like "Brand", "Company")
2. **Product Clarity**: Is the product name clear and specific?
3. **Confidence Alignment**: Does the confidence score match the quality of identification?
4. **Overall Quality**: How reliable is this identification for ownership research?

Return JSON:
{
  "brand_name": "string (improved if possible)",
  "product_name": "string (improved if possible)", 
  "product_type": "string",
  "confidence": number (adjusted based on quality),
  "reasoning": "string (quality assessment explanation)",
  "quality_score": number (0-100),
  "needs_escalation": boolean
}`
        },
        {
          role: "user",
          content: "Assess the quality of this brand and product identification."
        }
      ],
      max_tokens: 400,
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    let result;
    
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      // Fallback to original result with quality assessment
      result = {
        ...analysisResult,
        quality_score: analysisResult.confidence,
        needs_escalation: analysisResult.confidence < 70
      };
    }

    return {
      brand_name: result.brand_name || analysisResult.brand_name,
      product_name: result.product_name || analysisResult.product_name,
      product_type: result.product_type || analysisResult.product_type,
      confidence: Math.min(100, Math.max(0, result.confidence || analysisResult.confidence)),
      reasoning: result.reasoning || analysisResult.reasoning,
      quality_score: result.quality_score || analysisResult.confidence,
      needs_escalation: result.needs_escalation || (result.confidence < 70)
    };

  } catch (error) {
    console.error('❌ Quality assessment failed:', error);
    return {
      ...analysisResult,
      quality_score: analysisResult.confidence,
      needs_escalation: analysisResult.confidence < 70
    };
  }
}

/**
 * Step 3: Vision Agent (high-powered analysis when confidence is low)
 */
async function runVisionAgent(imageBase64, imageFormat, previousAnalysis) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // High-powered model for difficult cases
      messages: [
        {
          role: "system",
          content: `You are a high-powered vision agent for product identification. Previous analysis found:

BRAND: "${previousAnalysis.brand_name}"
PRODUCT: "${previousAnalysis.product_name}"
CONFIDENCE: ${previousAnalysis.confidence}

Your task is to perform a detailed, thorough analysis of the product image to improve this identification.

ANALYSIS REQUIREMENTS:
1. **Exhaustive Text Recognition**: Read ALL visible text on the packaging
2. **Logo Analysis**: Identify brand logos, symbols, and visual elements
3. **Context Clues**: Use packaging design, colors, and layout to identify brand
4. **Product Details**: Extract specific product name, variant, size, etc.
5. **Confidence Assessment**: Provide detailed reasoning for your confidence level

IMPORTANT:
- Be thorough and methodical
- Consider multiple possible brand interpretations
- Look for parent companies or subsidiary brands
- If you find a more specific brand than the previous analysis, use it
- Return as JSON: {"brand_name": "...", "product_name": "...", "product_type": "...", "confidence": number, "reasoning": "detailed explanation"}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Perform a detailed analysis of this product image to improve the brand and product identification."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/${imageFormat};base64,${imageBase64}`,
                detail: "high" // High detail for thorough analysis
              }
            }
          ]
        }
      ],
      max_tokens: 600,
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    let result;
    
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      result = extractInfoFromText(content);
    }

    return {
      brand_name: result.brand_name || previousAnalysis.brand_name,
      product_name: result.product_name || previousAnalysis.product_name,
      product_type: result.product_type || previousAnalysis.product_type,
      confidence: Math.min(100, Math.max(0, result.confidence || previousAnalysis.confidence)),
      reasoning: result.reasoning || 'Vision agent analysis completed'
    };

  } catch (error) {
    console.error('❌ Vision agent failed:', error);
    return previousAnalysis; // Fallback to previous result
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