/**
 * Ownership Research Agent Prompt v1.1
 * 
 * Improvements over v1.0:
 * - Enhanced source prioritization logic
 * - Better confidence scoring guidelines
 * - Improved JSON parsing instructions
 * - More specific evidence requirements
 * - Better handling of conflicting information
 */

export function buildResearchPromptV1_1(product_name, brand, hints, webResearchData, queryAnalysis) {
  let prompt = `OBJECTIVE:
You are a corporate ownership researcher tasked with identifying the ultimate financial beneficiary of the brand "${brand}". Your goal is to establish clear, evidence-based ownership relationships while maintaining high accuracy and avoiding assumptions.

RESEARCH STRATEGY:
1. Primary Sources (Highest Priority - 90-100% confidence):
   - SEC filings, annual reports, official regulatory documents
   - Company's own investor relations or corporate structure pages
   - Stock exchange listings and official business registries
   - Government ownership declarations for state-owned entities

2. Secondary Sources (Medium Priority - 50-89% confidence):
   - Financial news from reputable sources (Bloomberg, Reuters, FT, WSJ)
   - Business databases (OpenCorporates, D&B, ZoomInfo)
   - Press releases about acquisitions, mergers, or ownership changes
   - Official company press releases and statements

3. Supporting Sources (Low Priority - 30-49% confidence):
   - Industry analysis reports from established firms
   - Company history pages with verifiable information
   - News articles about company operations (cross-referenced)

4. Weak Sources (<30% confidence):
   - General web content without clear sourcing
   - Social media posts or unofficial blogs
   - Regional presence indicators (not ownership evidence)

ANALYSIS FRAMEWORK:
1. Ownership Structure Analysis:
   - Direct ownership: Who directly owns the brand?
   - Ultimate ownership: Follow the chain up to the ultimate beneficiary
   - Structure type: Public, Private, Subsidiary, Cooperative, State-owned, or Unknown
   - Ownership percentage: If available, include ownership stakes

2. Evidence Quality Assessment:
   - Direct statements of ownership (strongest - 90-100%)
   - Official documentation with specific ownership details (very strong - 80-89%)
   - Recent financial news with clear ownership information (strong - 70-79%)
   - Cross-referenced secondary sources (medium - 50-69%)
   - Single secondary source (weak - 30-49%)
   - Indirect references or assumptions (very weak - <30%)

3. Confidence Scoring Guidelines:
   - 90-100%: Multiple high-quality sources with direct ownership statements
   - 80-89%: Single high-quality source with official documentation
   - 70-79%: Recent financial news with clear ownership information
   - 50-69%: Multiple secondary sources with consistent information
   - 30-49%: Single secondary source or weak evidence
   - <30%: Insufficient evidence, conflicting information, or assumptions

PRODUCT CONTEXT:
- Brand: ${brand}
- Product: ${product_name}${hints.parent_company ? '\n- Known Parent Company: ' + hints.parent_company : ''}${hints.country_of_origin ? '\n- Country of Origin: ' + hints.country_of_origin : ''}${hints.website_url ? '\n- Company Website: ' + hints.website_url : ''}`

  // Add query analysis information if available
  if (queryAnalysis) {
    prompt += `\n\nQUERY ANALYSIS INSIGHTS:
- Inferred Company Type: ${queryAnalysis.company_type}
- Geographic Market: ${queryAnalysis.country_guess}
- Analysis Flags: ${queryAnalysis.flags.join(', ')}
- Analysis Reasoning: ${queryAnalysis.reasoning}

COMPANY TYPE-SPECIFIC GUIDANCE:
${getCompanyTypeGuidanceV1_1(queryAnalysis.company_type)}`
  }

  prompt += `\n\nCRITICAL GUIDELINES:
1. Evidence-Based Claims: Every ownership claim must be supported by specific evidence with source references
2. Source Quality Priority: Always prioritize official and financial sources over general web content
3. Chain of Ownership: Map the complete ownership chain when possible, noting any gaps
4. Uncertainty Handling: Default to "Unknown" when evidence is insufficient or conflicting
5. Regional Context: Use location only for finding relevant sources, never for ownership assumptions
6. Time Sensitivity: Prefer recent sources (within 2 years) for ownership changes
7. Conflicting Data: When sources conflict, explain the conflict and justify which source you trust more
8. Source Utilization: Use ALL available high-quality sources, especially those marked as regulatory or financial_news
9. Specific Evidence: Quote or reference specific content from sources when making claims
10. Confidence Calibration: Be conservative with confidence scores - it's better to be uncertain than wrong
11. JSON Formatting: Ensure perfect JSON formatting with no syntax errors
12. Source Attribution: Always include the specific sources used in your analysis`

  if (webResearchData && webResearchData.success && webResearchData.findings.length > 0) {
    prompt += `\n\nWEB RESEARCH FINDINGS (${webResearchData.findings.length} sources available):`;
    
    // Sort findings by priority score for better presentation
    const sortedFindings = [...webResearchData.findings].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    
    sortedFindings.forEach((finding, index) => {
      const sourceType = getSourceType(finding.url)
      const priorityLevel = finding.priorityScore >= 15 ? 'HIGH' : finding.priorityScore >= 10 ? 'MEDIUM' : 'LOW'
      
      prompt += `\n\nSource ${index + 1} [${priorityLevel} Priority - ${sourceType.toUpperCase()}]: ${finding.url}`;
      prompt += `\nTitle: ${finding.title}`;
      prompt += `\nSnippet: ${finding.snippet}`;
      if (finding.content) {
        // Extract key ownership-related content
        const content = finding.content.toLowerCase()
        const ownershipKeywords = ['owned', 'subsidiary', 'parent', 'acquisition', 'merger', 'investor', 'corporate', 'structure', 'annual report', 'financial', 'ownership', 'stake', 'holding']
        const hasOwnershipContent = ownershipKeywords.some(keyword => content.includes(keyword))
        
        if (hasOwnershipContent) {
          prompt += `\nContent: ${finding.content.substring(0, 1000)}...`;
        } else {
          prompt += `\nContent: ${finding.content.substring(0, 400)}...`;
        }
      }
    });
    
    prompt += `\n\nSOURCE ANALYSIS INSTRUCTIONS:
1. Start with HIGH priority sources first (regulatory, financial_news, company_official)
2. Look for direct ownership statements in official documents and financial reports
3. Cross-reference information across multiple sources for consistency
4. Pay special attention to sources marked as regulatory, financial_news, or company_official
5. Use specific quotes or references from the content when making claims
6. If sources conflict, explain the conflict and which source you trust more and why
7. Note any gaps in the ownership chain or missing information
8. Consider the recency of information - prefer recent sources for ownership changes`;
  } else {
    prompt += `\n\nNo web research data available. Apply the research strategy using only verifiable information from your training data. Maintain high standards for evidence quality and be conservative with confidence scores.`;
  }

  prompt += `\n\nOUTPUT REQUIREMENTS:
You must respond with a VALID JSON object containing ONLY the following fields:

{
  "financial_beneficiary": "Ultimate owner or Unknown",
  "beneficiary_country": "Country of owner or Unknown",
  "ownership_structure_type": "Public/Private/Subsidiary/Cooperative/State-owned/Unknown",
  "confidence_score": 0-100,
  "sources": ["array", "of", "specific", "sources"],
  "reasoning": "Clear explanation with evidence and source references"
}

CRITICAL JSON FORMATTING RULES:
1. ALL keys must be in double quotes
2. ALL string values must be in double quotes
3. Numbers (confidence_score) must NOT be in quotes
4. Arrays must use square brackets []
5. NO trailing commas
6. NO comments or additional text outside the JSON object
7. NO line breaks within the JSON object
8. NO special characters that could break JSON parsing
9. Ensure all quotes are properly escaped if they appear in string values

Example of VALID response format:
{
  "financial_beneficiary": "Unknown",
  "beneficiary_country": "Unknown",
  "ownership_structure_type": "Unknown",
  "confidence_score": 30,
  "sources": ["Web research", "AI analysis"],
  "reasoning": "No clear evidence found in available sources. The sources provided do not contain specific ownership information for this brand."
}`;

  return prompt;
}

/**
 * Gets company type-specific guidance for the research prompt (v1.1)
 */
function getCompanyTypeGuidanceV1_1(companyType) {
  switch (companyType) {
    case 'Public':
      return `PUBLIC COMPANY RESEARCH STRATEGY:
- Focus on SEC filings, annual reports, and investor relations pages
- Look for stock exchange listings and regulatory filings
- Check for recent acquisitions, mergers, or ownership changes
- Verify through official company statements and financial reports
- High confidence (80-100%) can be given to official regulatory documents
- Cross-reference with financial news sources for recent changes
- Check for institutional ownership and major shareholders`
      
    case 'Private':
      return `PRIVATE COMPANY RESEARCH STRATEGY:
- Focus on news articles about acquisitions, investments, or ownership changes
- Look for press releases and official company statements
- Check business databases and corporate registries
- Be more cautious with confidence scores (30-70%) due to limited public information
- Cross-reference multiple sources for verification
- Look for private equity or venture capital ownership
- Check for family ownership or founder information`
      
    case 'State-owned':
      return `STATE-OWNED COMPANY RESEARCH STRATEGY:
- Focus on government records, official statements, and regulatory filings
- Look for government ownership declarations and official documents
- Check for privatization announcements or ownership changes
- Verify through official government sources
- Be aware of complex ownership structures with multiple government entities
- Check for state investment funds or government holding companies
- High confidence (80-100%) for official government declarations`
      
    case 'Cooperative':
      return `COOPERATIVE RESEARCH STRATEGY:
- Focus on cooperative registries and member information
- Look for cooperative federation or association records
- Check for member-owned structure and governance documents
- Verify through official cooperative statements
- Be aware of regional cooperative structures and hierarchies
- Check for cooperative unions or federations
- Moderate confidence (50-80%) for official cooperative documents`
      
    case 'Franchise':
      return `FRANCHISE RESEARCH STRATEGY:
- Focus on franchisor information and franchise disclosure documents
- Look for parent company ownership of the franchisor
- Check for franchise agreements and corporate structure
- Verify through official franchisor statements
- Be aware of complex franchise ownership structures
- Check for franchise holding companies or parent entities
- Moderate confidence (50-80%) for official franchise documents`
      
    default:
      return `GENERAL RESEARCH STRATEGY:
- Use a balanced approach across all source types
- Focus on official documents and reputable news sources
- Cross-reference information from multiple sources
- Be conservative with confidence scores (30-70%) when evidence is limited
- Default to "Unknown" when evidence is insufficient
- Look for patterns across multiple sources
- Consider the reliability and recency of each source`
  }
}

/**
 * Helper function to get source type (same as original)
 */
function getSourceType(url) {
  if (!url) return 'unknown'
  
  const domain = url.toLowerCase()
  
  if (domain.includes('sec.gov') || domain.includes('edgar') || domain.includes('regulatory')) return 'regulatory'
  if (domain.includes('bloomberg') || domain.includes('reuters') || domain.includes('ft.com') || domain.includes('wsj.com')) return 'financial_news'
  if (domain.includes('annual') || domain.includes('investor') || domain.includes('corporate')) return 'company_official'
  if (domain.includes('opencorporates') || domain.includes('dun') || domain.includes('zoominfo')) return 'business_database'
  if (domain.includes('news') || domain.includes('press')) return 'news'
  
  return 'other'
} 