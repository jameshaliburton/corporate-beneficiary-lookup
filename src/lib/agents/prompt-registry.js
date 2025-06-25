/**
 * Prompt Registry System
 * 
 * Manages different versions of agent prompts for A/B testing and incremental improvements.
 * This allows us to test prompt changes without breaking the existing system.
 */

// Current prompt versions
export const PROMPT_VERSIONS = {
  OWNERSHIP_RESEARCH: {
    'v1.0': 'current', // Current production version
    'v1.1': 'testing', // New improved version
    'v1.2': 'development' // Future version
  },
  QUERY_BUILDER: {
    'v1.0': 'current',
    'v1.1': 'development'
  },
  VERIFICATION: {
    'v1.0': 'current',
    'v1.1': 'development'
  }
}

// Prompt status types
export const PROMPT_STATUS = {
  DEVELOPMENT: 'development', // In development, not ready for testing
  TESTING: 'testing', // Ready for A/B testing
  CURRENT: 'current', // Currently in production
  DEPRECATED: 'deprecated' // No longer used
}

/**
 * Get the current production prompt version for an agent
 */
export function getCurrentPromptVersion(agentType) {
  const versions = PROMPT_VERSIONS[agentType]
  if (!versions) {
    throw new Error(`Unknown agent type: ${agentType}`)
  }
  
  for (const [version, status] of Object.entries(versions)) {
    if (status === 'current') {
      return version
    }
  }
  
  throw new Error(`No current version found for agent: ${agentType}`)
}

/**
 * Get all available prompt versions for an agent
 */
export function getAvailablePromptVersions(agentType) {
  const versions = PROMPT_VERSIONS[agentType]
  if (!versions) {
    throw new Error(`Unknown agent type: ${agentType}`)
  }
  
  return Object.keys(versions)
}

/**
 * Check if a prompt version is available for testing
 */
export function isPromptVersionAvailable(agentType, version) {
  const versions = PROMPT_VERSIONS[agentType]
  if (!versions) {
    return false
  }
  
  return versions[version] === 'testing' || versions[version] === 'current'
}

/**
 * Get prompt builder function for a specific version
 */
export function getPromptBuilder(agentType, version = null) {
  if (!version) {
    version = getCurrentPromptVersion(agentType)
  }
  
  switch (agentType) {
    case 'OWNERSHIP_RESEARCH':
      return getOwnershipResearchPrompt(version)
    case 'QUERY_BUILDER':
      return getQueryBuilderPrompt(version)
    case 'VERIFICATION':
      return getVerificationPrompt(version)
    default:
      throw new Error(`Unknown agent type: ${agentType}`)
  }
}

/**
 * Get ownership research prompt for specific version
 */
function getOwnershipResearchPrompt(version) {
  switch (version) {
    case 'v1.0':
      return buildResearchPromptV1_0
    case 'v1.1':
      return buildResearchPromptV1_1
    default:
      throw new Error(`Unknown ownership research prompt version: ${version}`)
  }
}

/**
 * Get query builder prompt for specific version
 */
function getQueryBuilderPrompt(version) {
  switch (version) {
    case 'v1.0':
      return buildQueryBuilderPromptV1_0
    case 'v1.1':
      return buildQueryBuilderPromptV1_1
    default:
      throw new Error(`Unknown query builder prompt version: ${version}`)
  }
}

/**
 * Get verification prompt for specific version
 */
function getVerificationPrompt(version) {
  switch (version) {
    case 'v1.0':
      return buildVerificationPromptV1_0
    case 'v1.1':
      return buildVerificationPromptV1_1
    default:
      throw new Error(`Unknown verification prompt version: ${version}`)
  }
}

// Import prompt builders (these will be implemented in separate files)
function buildResearchPromptV1_0(product_name, brand, hints, webResearchData, queryAnalysis) {
  // Defensive defaults
  product_name = product_name || 'Sample Product';
  brand = brand || 'Sample Brand';
  hints = hints || {};
  webResearchData = webResearchData || { success: false, findings: [] };
  queryAnalysis = queryAnalysis || { company_type: 'Unknown', country_guess: 'Unknown', flags: [], reasoning: '' };

  let prompt = `OBJECTIVE:
You are a corporate ownership researcher tasked with identifying the ultimate financial beneficiary of the brand "${brand}". Your goal is to establish clear, evidence-based ownership relationships while maintaining high accuracy and avoiding assumptions.

RESEARCH STRATEGY:
1. Primary Sources (Highest Priority):
   - SEC filings, annual reports, official regulatory documents
   - Company's own investor relations or corporate structure pages
   - Stock exchange listings and official business registries

2. Secondary Sources (Medium Priority):
   - Financial news from reputable sources (Bloomberg, Reuters, FT, WSJ)
   - Business databases (OpenCorporates, D&B, ZoomInfo)
   - Press releases about acquisitions, mergers, or ownership changes

3. Supporting Sources (Low Priority):
   - Industry analysis reports
   - Company history pages
   - News articles about company operations

ANALYSIS FRAMEWORK:
1. Ownership Structure:
   - Direct ownership: Who directly owns the brand?
   - Ultimate ownership: Follow the chain up to the ultimate beneficiary
   - Structure type: Public, Private, Subsidiary, Cooperative, or State-owned

2. Evidence Quality:
   - Direct statements of ownership (strongest)
   - Official documentation (very strong)
   - Recent financial news (strong)
   - Indirect references (weak)
   - Regional/market presence (not evidence of ownership)

3. Confidence Assessment:
   - Multiple high-quality sources (90-100%)
   - Single high-quality source (70-89%)
   - Multiple secondary sources (50-69%)
   - Single secondary source (30-49%)
   - Weak/unclear evidence (<30%)

PRODUCT CONTEXT:
- Brand: ${brand}
- Product: ${product_name}${hints.parent_company ? '\n- Known Parent Company: ' + hints.parent_company : ''}`

  if (queryAnalysis) {
    prompt += `\n\nQUERY ANALYSIS INSIGHTS:
- Inferred Company Type: ${queryAnalysis.company_type}
- Geographic Market: ${queryAnalysis.country_guess}
- Analysis Flags: ${queryAnalysis.flags.join(', ')}
- Analysis Reasoning: ${queryAnalysis.reasoning}`
  }

  prompt += `\n\nCRITICAL GUIDELINES:
1. Evidence-Based: Every ownership claim must be supported by specific evidence
2. Source Quality: Prioritize official and financial sources over general web content
3. Chain of Ownership: Map the complete ownership chain when possible
4. Uncertainty: Default to "Unknown" when evidence is insufficient
5. Regional Context: Use location only for finding relevant sources, never for assumptions
6. Time Sensitivity: Prefer recent sources, especially for ownership changes
7. Conflicting Data: Address and explain any contradictory information
8. Source Utilization: Use ALL available sources, especially high-quality ones
9. Specific Evidence: Quote or reference specific content from sources when making claims`

  if (webResearchData && webResearchData.success && webResearchData.findings.length > 0) {
    prompt += `\n\nWEB RESEARCH FINDINGS (${webResearchData.findings.length} sources available):`;
    
    const sortedFindings = [...webResearchData.findings].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    
    sortedFindings.forEach((finding, index) => {
      const sourceType = getSourceType(finding.url)
      const priorityLevel = finding.priorityScore >= 15 ? 'HIGH' : finding.priorityScore >= 10 ? 'MEDIUM' : 'LOW'
      
      prompt += `\n\nSource ${index + 1} [${priorityLevel} Priority - ${sourceType.toUpperCase()}]: ${finding.url}`;
      prompt += `\nTitle: ${finding.title}`;
      prompt += `\nSnippet: ${finding.snippet}`;
      if (finding.content) {
        const content = finding.content.toLowerCase()
        const ownershipKeywords = ['owned', 'subsidiary', 'parent', 'acquisition', 'merger', 'investor', 'corporate', 'structure', 'annual report', 'financial']
        const hasOwnershipContent = ownershipKeywords.some(keyword => content.includes(keyword))
        
        if (hasOwnershipContent) {
          prompt += `\nContent: ${finding.content.substring(0, 800)}...`;
        } else {
          prompt += `\nContent: ${finding.content.substring(0, 300)}...`;
        }
      }
    });
    
    prompt += `\n\nSOURCE ANALYSIS INSTRUCTIONS:
1. Start with HIGH priority sources first
2. Look for direct ownership statements in official documents
3. Cross-reference information across multiple sources
4. Pay special attention to sources marked as regulatory, financial_news, or company_official
5. Use specific quotes or references from the content when making claims
6. If sources conflict, explain the conflict and which source you trust more and why`;
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

function buildResearchPromptV1_1(product_name, brand, hints, webResearchData, queryAnalysis) {
  // Defensive defaults
  product_name = product_name || 'Sample Product';
  brand = brand || 'Sample Brand';
  hints = hints || {};
  webResearchData = webResearchData || { success: false, findings: [] };
  queryAnalysis = queryAnalysis || { company_type: 'Unknown', country_guess: 'Unknown', flags: [], reasoning: '' };

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
- Product: ${product_name}${hints.parent_company ? '\n- Known Parent Company: ' + hints.parent_company : ''}${hints.country_of_origin ? '\n- Country of Origin: ' + hints.country_of_origin : ''}${hints.website_url ? '\n- Company Website: ' + hints.website_url : ''}`;

  if (queryAnalysis) {
    prompt += `\n\nQUERY ANALYSIS INSIGHTS:
- Inferred Company Type: ${queryAnalysis.company_type}
- Geographic Market: ${queryAnalysis.country_guess}
- Analysis Flags: ${queryAnalysis.flags.join(', ')}
- Analysis Reasoning: ${queryAnalysis.reasoning}`;
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
12. Source Attribution: Always include the specific sources used in your analysis`;

  if (webResearchData && webResearchData.success && webResearchData.findings.length > 0) {
    prompt += `\n\nWEB RESEARCH FINDINGS (${webResearchData.findings.length} sources available):`;
    const sortedFindings = [...webResearchData.findings].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    sortedFindings.forEach((finding, index) => {
      const sourceType = getSourceType(finding.url);
      const priorityLevel = finding.priorityScore >= 15 ? 'HIGH' : finding.priorityScore >= 10 ? 'MEDIUM' : 'LOW';
      prompt += `\n\nSource ${index + 1} [${priorityLevel} Priority - ${sourceType.toUpperCase()}]: ${finding.url}`;
      prompt += `\nTitle: ${finding.title}`;
      prompt += `\nSnippet: ${finding.snippet}`;
      if (finding.content) {
        const content = finding.content.toLowerCase();
        const ownershipKeywords = ['owned', 'subsidiary', 'parent', 'acquisition', 'merger', 'investor', 'corporate', 'structure', 'annual report', 'financial', 'ownership', 'stake', 'holding'];
        const hasOwnershipContent = ownershipKeywords.some(keyword => content.includes(keyword));
        if (hasOwnershipContent) {
          prompt += `\nContent: ${finding.content.substring(0, 1000)}...`;
        } else {
          prompt += `\nContent: ${finding.content.substring(0, 400)}...`;
        }
      }
    });
    prompt += `\n\nSOURCE ANALYSIS INSTRUCTIONS:\n1. Start with HIGH priority sources first (regulatory, financial_news, company_official)\n2. Look for direct ownership statements in official documents and financial reports\n3. Cross-reference information across multiple sources for consistency\n4. Pay special attention to sources marked as regulatory, financial_news, or company_official\n5. Use specific quotes or references from the content when making claims\n6. If sources conflict, explain the conflict and which source you trust more and why\n7. Note any gaps in the ownership chain or missing information\n8. Consider the recency of information - prefer recent sources for ownership changes`;
  } else {
    prompt += `\n\nNo web research data available. Apply the research strategy using only verifiable information from your training data. Maintain high standards for evidence quality and be conservative with confidence scores.`;
  }

  prompt += `\n\nOUTPUT REQUIREMENTS:\nYou must respond with a VALID JSON object containing ONLY the following fields:\n\n{\n  "financial_beneficiary": "Ultimate owner or Unknown",\n  "beneficiary_country": "Country of owner or Unknown",\n  "ownership_structure_type": "Public/Private/Subsidiary/Cooperative/State-owned/Unknown",\n  "confidence_score": 0-100,\n  "sources": ["array", "of", "specific", "sources"],\n  "reasoning": "Clear explanation with evidence and source references"\n}\n\nCRITICAL JSON FORMATTING RULES:\n1. ALL keys must be in double quotes\n2. ALL string values must be in double quotes\n3. Numbers (confidence_score) must NOT be in quotes\n4. Arrays must use square brackets []\n5. NO trailing commas\n6. NO comments or additional text outside the JSON object\n7. NO line breaks within the JSON object\n8. NO special characters that could break JSON parsing\n9. Ensure all quotes are properly escaped if they appear in string values\n\nExample of VALID response format:\n{\n  "financial_beneficiary": "Unknown",\n  "beneficiary_country": "Unknown",\n  "ownership_structure_type": "Unknown",\n  "confidence_score": 30,\n  "sources": ["Web research", "AI analysis"],\n  "reasoning": "No clear evidence found in available sources. The sources provided do not contain specific ownership information for this brand."\n}`;

  return prompt;
}

// Placeholder functions for other agents
function buildQueryBuilderPromptV1_0() {
  return "Query builder prompt v1.0 - to be implemented";
}

function buildQueryBuilderPromptV1_1() {
  return "Query builder prompt v1.1 - to be implemented";
}

function buildVerificationPromptV1_0() {
  return "Verification prompt v1.0 - to be implemented";
}

function buildVerificationPromptV1_1() {
  return "Verification prompt v1.1 - to be implemented";
}

// Helper function
function getSourceType(url) {
  if (!url) return 'unknown';
  
  const domain = url.toLowerCase();
  
  if (domain.includes('sec.gov') || domain.includes('edgar') || domain.includes('regulatory')) return 'regulatory';
  if (domain.includes('bloomberg') || domain.includes('reuters') || domain.includes('ft.com') || domain.includes('wsj.com')) return 'financial_news';
  if (domain.includes('annual') || domain.includes('investor') || domain.includes('corporate')) return 'company_official';
  if (domain.includes('opencorporates') || domain.includes('dun') || domain.includes('zoominfo')) return 'business_database';
  if (domain.includes('news') || domain.includes('press')) return 'news';
  
  return 'other';
}
