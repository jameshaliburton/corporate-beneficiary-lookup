/**
 * Ownership Research Agent Prompt v1.2
 * 
 * Improvements over v1.1:
 * - Enhanced current ownership detection
 * - Acquisition date tracking and validation
 * - Improved confidence filtering for historical vs current owners
 * - Better handling of ownership changes and divestments
 * - Explicit reasoning about ownership timeline
 */

export function buildResearchPromptV1_2(product_name, brand, hints, webResearchData, queryAnalysis) {
  let prompt = `OBJECTIVE:
You are a corporate ownership researcher tasked with identifying the CURRENT ultimate financial beneficiary of the brand "${brand}" as of 2025. Your goal is to establish clear, evidence-based CURRENT ownership relationships while avoiding outdated or historical ownership information.

CRITICAL REQUIREMENT: You must identify the CURRENT owner, not historical owners. If a brand has been acquired or divested, you must find the most recent ownership information.

RESEARCH STRATEGY:
1. Primary Sources (Highest Priority - 90-100% confidence):
   - SEC filings, annual reports, official regulatory documents (2023-2025)
   - Company's own investor relations or corporate structure pages (current)
   - Stock exchange listings and official business registries (current)
   - Government ownership declarations for state-owned entities (current)
   - Recent press releases about acquisitions, mergers, or ownership changes

2. Secondary Sources (Medium Priority - 50-89% confidence):
   - Financial news from reputable sources (Bloomberg, Reuters, FT, WSJ) - 2023-2025
   - Business databases (OpenCorporates, D&B, ZoomInfo) - current data
   - Official company press releases and statements (2023-2025)
   - Recent acquisition announcements and corporate filings

3. Supporting Sources (Low Priority - 30-49% confidence):
   - Industry analysis reports from established firms (2023-2025)
   - Company history pages with verifiable current information
   - News articles about company operations (cross-referenced, recent)

4. Weak Sources (<30% confidence):
   - General web content without clear sourcing
   - Social media posts or unofficial blogs
   - Regional presence indicators (not ownership evidence)
   - Historical information without current updates

CURRENT OWNERSHIP DETECTION FRAMEWORK:
1. Ownership Timeline Analysis:
   - Current ownership: Who owns the brand as of 2025?
   - Acquisition dates: When was the most recent acquisition/ownership change?
   - Historical ownership: What was the previous ownership structure?
   - Divestment dates: When did previous owners sell/divest?
   - Ownership chain: Map the complete current ownership structure

2. Evidence Quality Assessment for Current Ownership:
   - Direct statements of CURRENT ownership (strongest - 90-100%)
   - Official documentation with specific CURRENT ownership details (very strong - 80-89%)
   - Recent financial news with clear CURRENT ownership information (strong - 70-79%)
   - Cross-referenced secondary sources with current data (medium - 50-69%)
   - Single secondary source with current information (weak - 30-49%)
   - Historical or outdated information (very weak - <30%)

3. Confidence Scoring Guidelines for Current Ownership:
   - 90-100%: Multiple high-quality sources with direct CURRENT ownership statements
   - 80-89%: Single high-quality source with official CURRENT documentation
   - 70-79%: Recent financial news with clear CURRENT ownership information
   - 50-69%: Multiple secondary sources with consistent CURRENT information
   - 30-49%: Single secondary source or weak current evidence
   - <30%: Insufficient current evidence, conflicting information, or outdated data

4. Historical vs Current Ownership Detection:
   - HIGHER confidence for sources that explicitly mention "current owner", "as of 2024/2025", "currently owned by"
   - LOWER confidence for sources that mention "formerly owned", "sold to", "previously owned", "was acquired by"
   - If multiple owners are found, prioritize the one with the LATEST acquisition date
   - Cross-reference acquisition dates to ensure you're using the most recent information

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
${getCompanyTypeGuidanceV1_2(queryAnalysis.company_type)}`
  }

  prompt += `\n\nCRITICAL GUIDELINES FOR CURRENT OWNERSHIP:
1. CURRENT OWNERSHIP FOCUS: Always prioritize the most recent ownership information available
2. Acquisition Date Tracking: Look for and verify acquisition dates to ensure you're using current data
3. Historical Information Filtering: Discard or heavily discount historical ownership information
4. Source Recency: Prefer sources from 2023-2025 for ownership information
5. Evidence-Based Claims: Every ownership claim must be supported by specific evidence with source references
6. Source Quality Priority: Always prioritize official and financial sources over general web content
7. Chain of Ownership: Map the complete CURRENT ownership chain when possible, noting any gaps
8. Uncertainty Handling: Default to "Unknown" when evidence is insufficient or conflicting
9. Regional Context: Use location only for finding relevant sources, never for ownership assumptions
10. Time Sensitivity: Prefer recent sources (within 2 years) for ownership changes
11. Conflicting Data: When sources conflict, explain the conflict and justify which source you trust more
12. Source Utilization: Use ALL available high-quality sources, especially those marked as regulatory or financial_news
13. Specific Evidence: Quote or reference specific content from sources when making claims
14. Confidence Calibration: Be conservative with confidence scores - it's better to be uncertain than wrong
15. JSON Formatting: Ensure perfect JSON formatting with no syntax errors
16. Source Attribution: Always include the specific sources used in your analysis
17. Current Ownership Reasoning: Always include reasoning about why you believe this is the CURRENT owner`

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
        // Extract key ownership-related content with focus on current ownership
        const content = finding.content.toLowerCase()
        const currentOwnershipKeywords = ['currently owned', 'current owner', 'as of 2024', 'as of 2025', 'recently acquired', 'latest acquisition', 'current parent', 'current ownership']
        const historicalOwnershipKeywords = ['formerly owned', 'previously owned', 'was acquired', 'sold to', 'divested', 'historical ownership']
        const generalOwnershipKeywords = ['owned', 'subsidiary', 'parent', 'acquisition', 'merger', 'investor', 'corporate', 'structure', 'annual report', 'financial', 'ownership', 'stake', 'holding']
        
        const hasCurrentOwnershipContent = currentOwnershipKeywords.some(keyword => content.includes(keyword))
        const hasHistoricalOwnershipContent = historicalOwnershipKeywords.some(keyword => content.includes(keyword))
        const hasGeneralOwnershipContent = generalOwnershipKeywords.some(keyword => content.includes(keyword))
        
        if (hasCurrentOwnershipContent) {
          prompt += `\nContent: ${finding.content.substring(0, 1200)}...`;
          prompt += `\n[NOTE: This source contains CURRENT ownership information]`;
        } else if (hasHistoricalOwnershipContent) {
          prompt += `\nContent: ${finding.content.substring(0, 800)}...`;
          prompt += `\n[NOTE: This source contains HISTORICAL ownership information - use with caution]`;
        } else if (hasGeneralOwnershipContent) {
          prompt += `\nContent: ${finding.content.substring(0, 1000)}...`;
        } else {
          prompt += `\nContent: ${finding.content.substring(0, 400)}...`;
        }
      }
    });
    
    prompt += `\n\nSOURCE ANALYSIS INSTRUCTIONS FOR CURRENT OWNERSHIP:
1. Start with HIGH priority sources first (regulatory, financial_news, company_official)
2. Look for direct statements of CURRENT ownership in official documents and financial reports
3. Cross-reference information across multiple sources for consistency
4. Pay special attention to sources marked as regulatory, financial_news, or company_official
5. Use specific quotes or references from the content when making claims
6. If sources conflict, explain the conflict and which source you trust more and why
7. Note any gaps in the ownership chain or missing information
8. Consider the recency of information - prefer recent sources for ownership changes
9. PRIORITIZE sources that explicitly mention "current owner", "as of 2024/2025", "currently owned by"
10. DISCOUNT sources that mention "formerly owned", "sold to", "previously owned" unless they provide current updates
11. If multiple owners are found, choose the one with the LATEST acquisition date
12. Always verify acquisition dates to ensure you're using the most recent information`;
  } else {
    prompt += `\n\nNo web research data available. Apply the research strategy using only verifiable information from your training data. Maintain high standards for evidence quality and be conservative with confidence scores. Focus on CURRENT ownership information.`;
  }

  prompt += `\n\nOUTPUT REQUIREMENTS:
You must respond with a VALID JSON object containing ONLY the following fields:

{
  "financial_beneficiary": "Current ultimate owner as of 2025 or Unknown",
  "beneficiary_country": "Country of current owner or Unknown",
  "ownership_structure_type": "Public/Private/Subsidiary/Cooperative/State-owned/Unknown",
  "acquisition_year": "Year of most recent acquisition or Unknown",
  "confidence_score": 0-100,
  "sources": ["array", "of", "specific", "sources"],
  "reasoning": "Clear explanation with evidence, source references, and reasoning about why this is the CURRENT owner as of 2025"
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
  "financial_beneficiary": "KKR & Co.",
  "beneficiary_country": "United States",
  "ownership_structure_type": "Private",
  "acquisition_year": "2023",
  "confidence_score": 85,
  "sources": ["SEC filings", "Company press release", "Financial news"],
  "reasoning": "Based on available sources, the current owner as of 2025 is KKR & Co. The brand was acquired by KKR in 2023 from Coty Inc. This information is supported by SEC filings and recent press releases confirming the current ownership structure."
}`;

  return prompt;
}

/**
 * Gets company type-specific guidance for the research prompt (v1.2)
 */
function getCompanyTypeGuidanceV1_2(companyType) {
  switch (companyType) {
    case 'Public':
      return `PUBLIC COMPANY RESEARCH STRATEGY:
- Focus on SEC filings, annual reports, and investor relations pages (2023-2025)
- Look for stock exchange listings and regulatory filings (current)
- Check for recent acquisitions, mergers, or ownership changes (2023-2025)
- Verify through official company statements and financial reports (current)
- High confidence (80-100%) can be given to official regulatory documents
- Cross-reference with financial news sources for recent changes
- Check for institutional ownership and major shareholders (current)
- Pay special attention to recent acquisition announcements and ownership changes`
      
    case 'Private':
      return `PRIVATE COMPANY RESEARCH STRATEGY:
- Focus on news articles about acquisitions, investments, or ownership changes (2023-2025)
- Look for press releases and official company statements (current)
- Check business databases and corporate registries (current data)
- Be more cautious with confidence scores (30-70%) due to limited public information
- Cross-reference multiple sources for verification
- Look for private equity or venture capital ownership (current)
- Check for family ownership or founder information (current)
- Pay special attention to recent private equity acquisitions and ownership changes`
      
    case 'State-owned':
      return `STATE-OWNED COMPANY RESEARCH STRATEGY:
- Focus on government records, official statements, and regulatory filings (2023-2025)
- Look for government ownership declarations and official documents (current)
- Check for privatization announcements or ownership changes (2023-2025)
- Verify through official government sources (current)
- Be aware of complex ownership structures with multiple government entities
- Check for state investment funds or government holding companies (current)
- Pay special attention to recent privatization or nationalization announcements`
      
    case 'Cooperative':
      return `COOPERATIVE RESEARCH STRATEGY:
- Focus on cooperative registries and member information (current)
- Look for official cooperative structure documents (2023-2025)
- Check for recent changes in cooperative structure or ownership
- Verify through official cooperative sources and member communications
- Be aware of complex ownership structures with multiple cooperative entities
- Check for federation or alliance structures (current)
- Pay special attention to recent cooperative mergers or restructuring`
      
    case 'Franchise':
      return `FRANCHISE RESEARCH STRATEGY:
- Focus on franchisor information and franchise disclosure documents (current)
- Look for official franchisor corporate structure (2023-2025)
- Check for recent changes in franchisor ownership or corporate structure
- Verify through official franchisor sources and regulatory filings
- Be aware of complex ownership structures with multiple franchise entities
- Check for parent company ownership of franchisor (current)
- Pay special attention to recent franchisor acquisitions or ownership changes`
      
    default:
      return `GENERAL RESEARCH STRATEGY:
- Focus on official company sources and regulatory filings (2023-2025)
- Look for recent ownership changes and acquisition announcements
- Check multiple sources for verification of current ownership
- Be conservative with confidence scores until ownership is clearly established
- Pay special attention to recent corporate changes and ownership updates
- Cross-reference information across multiple sources for consistency`
  }
}

/**
 * Gets source type for classification
 */
function getSourceType(url) {
  if (!url) return 'unknown'
  
  const urlLower = url.toLowerCase()
  
  if (urlLower.includes('sec.gov') || urlLower.includes('edgar') || urlLower.includes('regulatory')) return 'regulatory'
  if (urlLower.includes('bloomberg') || urlLower.includes('reuters') || urlLower.includes('wsj') || urlLower.includes('ft.com')) return 'financial_news'
  if (urlLower.includes('annual') || urlLower.includes('investor') || urlLower.includes('ir.') || urlLower.includes('corporate')) return 'company_official'
  if (urlLower.includes('opencorporates') || urlLower.includes('dun') || urlLower.includes('zoominfo')) return 'business_database'
  if (urlLower.includes('press') || urlLower.includes('news') || urlLower.includes('media')) return 'news'
  if (urlLower.includes('wikipedia') || urlLower.includes('wiki')) return 'reference'
  if (urlLower.includes('linkedin') || urlLower.includes('facebook') || urlLower.includes('twitter')) return 'social'
  
  return 'general'
} 