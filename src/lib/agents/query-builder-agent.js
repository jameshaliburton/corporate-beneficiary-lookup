import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

/**
 * Query Builder Agent
 * Analyzes brand/product information to generate optimized search queries
 * for ownership research
 */
export async function QueryBuilderAgent({
  brand,
  product_name,
  barcode,
  hints = {}
}) {
  console.log(`[QueryBuilderAgent] Starting query building for: ${brand}`)
  
  try {
    const queryAnalysis = await analyzeBrandAndGenerateQueries(brand, product_name, barcode, hints)
    
    console.log(`[QueryBuilderAgent] Query analysis complete:`, {
      companyType: queryAnalysis.company_type,
      countryGuess: queryAnalysis.country_guess,
      queryCount: queryAnalysis.recommended_queries.length
    })
    
    return queryAnalysis
    
  } catch (error) {
    console.error('[QueryBuilderAgent] Error:', error)
    
    // Return fallback queries
    return {
      company_type: 'Unknown',
      country_guess: 'Unknown',
      flags: ['fallback_queries'],
      reasoning: 'Query builder failed, using fallback queries',
      recommended_queries: [
        `${brand} ownership`,
        `${brand} parent company`,
        `${brand} corporate structure`,
        `${brand} annual report`,
        `${brand} investor relations`
      ]
    }
  }
}

/**
 * Analyzes brand and generates optimized search queries
 */
async function analyzeBrandAndGenerateQueries(brand, product_name, barcode, hints) {
  const prompt = buildQueryAnalysisPrompt(brand, product_name, barcode, hints)
  
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: `You are a corporate research query builder with expertise in:
1. Company type classification (public, private, state-owned, cooperative, franchise)
2. Geographic market analysis
3. Industry-specific research strategies
4. Search query optimization for ownership research

Your analytical approach:
1. Analyze brand name patterns and product context
2. Infer likely company type based on naming conventions
3. Determine probable geographic markets
4. Generate targeted search queries for ownership research
5. Prioritize queries by expected effectiveness

Your key principles:
1. Evidence-based: Use naming patterns and context clues
2. Geographic awareness: Consider regional naming conventions
3. Industry-specific: Adapt queries to company type
4. Comprehensive: Cover multiple research angles
5. Practical: Focus on queries likely to yield ownership information

CRITICAL: You MUST respond with valid JSON only. No additional text before or after the JSON object.`,
    messages: [
      { role: 'user', content: prompt }
    ]
  })
  
  const text = response.content?.[0]?.text || ''
  console.log(`[QueryBuilderAgent] AI response:`, text.substring(0, 200) + '...')
  
  // Parse JSON response
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error('No JSON found in response')
    }
    
    const analysis = JSON.parse(match[0])
    
    // Validate and sanitize the response
    return validateAndSanitizeQueryAnalysis(analysis, brand)
    
  } catch (parseError) {
    console.error('[QueryBuilderAgent] JSON parsing failed:', parseError)
    throw new Error('Failed to parse query analysis response')
  }
}

/**
 * Builds the query analysis prompt
 */
function buildQueryAnalysisPrompt(brand, product_name, barcode, hints) {
  return `OBJECTIVE:
Analyze the brand "${brand}" and generate optimized search queries for corporate ownership research.

BRAND ANALYSIS:
- Brand: ${brand}
- Product: ${product_name}
- Barcode: ${barcode || 'Not provided'}
- Known Parent: ${hints.parent_company || 'Unknown'}
- Country of Origin: ${hints.country_of_origin || 'Unknown'}
- Industry Hints: ${hints.industry || 'Unknown'}

ANALYSIS TASKS:
1. Company Type Inference:
   - Analyze brand name patterns and product context
   - Classify as: Public, Private, State-owned, Cooperative, Franchise, or Unknown
   - Consider naming conventions, product types, and geographic indicators

2. Geographic Market Analysis:
   - Infer likely primary markets based on brand name and product
   - Consider language patterns, cultural references, and market presence
   - Identify probable countries of operation

3. Search Query Generation:
   - Create 8-12 targeted search queries for ownership research
   - Prioritize by expected effectiveness
   - Include company-specific, regulatory, and news-based queries
   - Adapt queries based on inferred company type

QUERY STRATEGIES BY COMPANY TYPE:
- Public Companies: Focus on SEC filings, investor relations, annual reports
- Private Companies: Emphasize news articles, acquisitions, corporate databases
- State-owned: Target government records, official statements, regulatory filings
- Cooperatives: Look for member information, cooperative registries, industry reports
- Franchises: Search for franchisor information, franchise disclosure documents

OUTPUT REQUIREMENTS:
You must respond with a VALID JSON object containing ONLY the following fields:

{
  "company_type": "Public/Private/State-owned/Cooperative/Franchise/Unknown",
  "country_guess": "Primary country or Unknown",
  "flags": ["array", "of", "analysis", "flags"],
  "reasoning": "Clear explanation of analysis",
  "recommended_queries": ["array", "of", "search", "queries"]
}

CRITICAL JSON FORMATTING RULES:
1. ALL keys must be in double quotes
2. ALL string values must be in double quotes
3. Arrays must use square brackets []
4. NO trailing commas
5. NO comments or additional text outside the JSON object

Example of VALID response format:
{
  "company_type": "Public",
  "country_guess": "United States",
  "flags": ["large_brand", "english_naming"],
  "reasoning": "Brand name suggests large public company with English naming conventions",
  "recommended_queries": [
    "BrandName investor relations",
    "BrandName SEC filings",
    "BrandName annual report",
    "BrandName parent company"
  ]
}`
}

/**
 * Validates and sanitizes query analysis results
 */
function validateAndSanitizeQueryAnalysis(analysis, brand) {
  const validated = { ...analysis }
  
  // Ensure required fields exist
  validated.company_type = validated.company_type || 'Unknown'
  validated.country_guess = validated.country_guess || 'Unknown'
  validated.flags = Array.isArray(validated.flags) ? validated.flags : []
  validated.reasoning = validated.reasoning || 'Analysis completed'
  validated.recommended_queries = Array.isArray(validated.recommended_queries) ? validated.recommended_queries : []
  
  // Validate company type
  const validCompanyTypes = ['Public', 'Private', 'State-owned', 'Cooperative', 'Franchise', 'Unknown']
  if (!validCompanyTypes.includes(validated.company_type)) {
    validated.company_type = 'Unknown'
    validated.flags.push('invalid_company_type')
  }
  
  // Ensure we have at least some queries
  if (validated.recommended_queries.length === 0) {
    validated.recommended_queries = [
      `${brand} ownership`,
      `${brand} parent company`,
      `${brand} corporate structure`
    ]
    validated.flags.push('fallback_queries')
  }
  
  // Limit queries to reasonable number
  if (validated.recommended_queries.length > 15) {
    validated.recommended_queries = validated.recommended_queries.slice(0, 15)
    validated.flags.push('truncated_queries')
  }
  
  return validated
}

/**
 * Helper function to check if query builder is available
 */
export function isQueryBuilderAvailable() {
  return !!(process.env.ANTHROPIC_API_KEY)
}

/**
 * Helper function to get query builder status
 */
export function getQueryBuilderStatus() {
  return {
    available: isQueryBuilderAvailable(),
    hasApiKey: !!process.env.ANTHROPIC_API_KEY
  }
} 