/**
 * Enhanced Quality Assessment Agent v1.2
 * 
 * Improvements over v1.0:
 * - Current ownership validation
 * - Historical ownership filtering
 * - Acquisition date verification
 * - Confidence scoring for ownership recency
 * - Cross-checking multiple candidate owners
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class QualityAssessmentAgentV1_2 {
  constructor() {
    this.model = 'gpt-4-turbo-preview';
    this.maxTokens = 1000;
  }

  /**
   * Assess the quality of ownership data with focus on current ownership
   * @param {Object} ownershipData - Ownership research results
   * @param {Object} webResearchData - Web research data
   * @returns {Promise<Object>} Quality assessment result
   */
  async assessOwnershipQuality(ownershipData, webResearchData = null) {
    try {
      console.log('🔍 Quality Assessment Agent v1.2: Analyzing ownership data...');
      
      const prompt = this.buildOwnershipAssessmentPrompt(ownershipData, webResearchData);
      
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
        temperature: 0.1,
      });

      const result = response.choices[0].message.content;
      const assessment = this.parseOwnershipAssessmentResult(result);
      
      console.log('✅ Quality Assessment v1.2 complete:', assessment);
      
      return {
        success: true,
        assessment,
        reasoning: assessment.reasoning,
        is_current_owner: assessment.is_current_owner,
        confidence: assessment.confidence,
        quality_score: assessment.quality_score,
        issues: assessment.issues,
        acquisition_year: assessment.acquisition_year,
        ownership_timeline: assessment.ownership_timeline
      };

    } catch (error) {
      console.error('❌ Quality Assessment Agent v1.2 error:', error);
      return {
        success: false,
        error: error.message,
        fallback_assessment: this.fallbackOwnershipAssessment(ownershipData)
      };
    }
  }

  /**
   * Get the system prompt for the agent
   */
  getSystemPrompt() {
    return `You are an Ownership Quality Assessment Agent v1.2. Your job is to validate ownership claims and ensure they represent CURRENT ownership as of 2025, not historical ownership.

CRITICAL REQUIREMENTS:
1. CURRENT OWNERSHIP FOCUS: Only validate claims that represent the current owner as of 2025
2. HISTORICAL FILTERING: Identify and flag historical ownership information
3. ACQUISITION DATE VERIFICATION: Check acquisition dates to ensure recency
4. MULTIPLE OWNER CROSS-CHECKING: If multiple owners are found, identify the most recent
5. CONFIDENCE SCORING: Adjust confidence based on ownership recency and source quality

ASSESSMENT CRITERIA:
1. **Current Ownership Validation**: Is this the current owner as of 2025?
2. **Acquisition Date Verification**: When was the most recent acquisition/ownership change?
3. **Source Recency**: Are sources from 2023-2025 for ownership information?
4. **Historical vs Current**: Does the evidence support current or historical ownership?
5. **Multiple Owner Resolution**: If multiple owners found, which is most recent?
6. **Confidence Alignment**: Does confidence score reflect ownership recency?

CONFIDENCE SCORING FOR CURRENT OWNERSHIP:
- 90-100%: Multiple high-quality sources with explicit current ownership statements (2023-2025)
- 80-89%: Single high-quality source with current ownership documentation
- 70-79%: Recent financial news with clear current ownership information
- 50-69%: Multiple secondary sources with consistent current information
- 30-49%: Single secondary source or weak current evidence
- <30%: Insufficient current evidence, conflicting information, or outdated data

HISTORICAL OWNERSHIP PENALTIES:
- Sources mentioning "formerly owned", "previously owned", "sold to": -30% confidence
- Sources without clear acquisition dates: -20% confidence
- Sources older than 2023 for ownership info: -25% confidence
- Conflicting ownership information: -40% confidence

Respond with valid JSON only. Be conservative - if ownership recency is unclear, mark as questionable.`;
  }

  /**
   * Build the ownership assessment prompt
   */
  buildOwnershipAssessmentPrompt(ownershipData, webResearchData) {
    const sources = ownershipData.sources || [];
    const webSources = webResearchData?.findings || [];
    
    return `Please assess the quality and current ownership validity of this ownership claim:

OWNERSHIP CLAIM:
- Financial Beneficiary: "${ownershipData.financial_beneficiary || 'Unknown'}"
- Country: "${ownershipData.beneficiary_country || 'Unknown'}"
- Structure Type: "${ownershipData.ownership_structure_type || 'Unknown'}"
- Confidence Score: ${ownershipData.confidence_score || 0}
- Reasoning: "${ownershipData.reasoning || 'No reasoning provided'}"

SOURCES USED:
${sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}

WEB RESEARCH SOURCES (if available):
${webSources.map((finding, index) => `${index + 1}. ${finding.url} - ${finding.title}`).join('\n')}

ASSESSMENT QUESTIONS:
1. Is this the CURRENT owner as of 2025?
2. What is the most recent acquisition date mentioned?
3. Are the sources recent (2023-2025) for ownership information?
4. Is there evidence of historical vs current ownership?
5. Are there multiple owners mentioned? If so, which is most recent?
6. Does the confidence score align with ownership recency?

Respond with JSON only:
{
  "is_current_owner": true/false,
  "confidence": 0-100,
  "quality_score": 0-100,
  "acquisition_year": "YYYY or Unknown",
  "ownership_timeline": "Brief timeline of ownership changes",
  "reasoning": "Detailed explanation of current ownership validation",
  "issues": ["list", "of", "problems", "if", "any"],
  "recommendations": ["list", "of", "improvements", "if", "needed"]
}`;
  }

  /**
   * Parse the ownership assessment result from AI response
   */
  parseOwnershipAssessmentResult(result) {
    try {
      // Extract JSON from response (handle any extra text)
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        is_current_owner: Boolean(parsed.is_current_owner),
        confidence: Math.min(100, Math.max(0, parsed.confidence || 0)),
        quality_score: Math.min(100, Math.max(0, parsed.quality_score || 0)),
        acquisition_year: parsed.acquisition_year || 'Unknown',
        ownership_timeline: parsed.ownership_timeline || 'No timeline provided',
        reasoning: parsed.reasoning || 'No reasoning provided',
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
      };
      
    } catch (error) {
      console.error('Failed to parse ownership assessment result:', error);
      return {
        is_current_owner: false,
        confidence: 0,
        quality_score: 0,
        acquisition_year: 'Unknown',
        ownership_timeline: 'Parse error',
        reasoning: 'Failed to parse AI assessment',
        issues: ['Parse error'],
        recommendations: ['Check data format']
      };
    }
  }

  /**
   * Fallback assessment when AI fails
   */
  fallbackOwnershipAssessment(ownershipData) {
    const beneficiary = ownershipData.financial_beneficiary || '';
    const reasoning = ownershipData.reasoning || '';
    
    // Check for historical ownership indicators
    const historicalIndicators = ['formerly', 'previously', 'was owned', 'sold to', 'divested', 'historical'];
    const hasHistoricalIndicators = historicalIndicators.some(indicator => 
      reasoning.toLowerCase().includes(indicator)
    );
    
    // Check for current ownership indicators
    const currentIndicators = ['currently', 'current owner', 'as of 2024', 'as of 2025', 'recently acquired'];
    const hasCurrentIndicators = currentIndicators.some(indicator => 
      reasoning.toLowerCase().includes(indicator)
    );
    
    const isCurrentOwner = !hasHistoricalIndicators && (hasCurrentIndicators || beneficiary !== 'Unknown');
    const confidence = hasHistoricalIndicators ? 30 : (hasCurrentIndicators ? 70 : 50);
    
    return {
      is_current_owner: isCurrentOwner,
      confidence: confidence,
      quality_score: confidence,
      acquisition_year: 'Unknown',
      ownership_timeline: 'Fallback assessment - timeline unknown',
      reasoning: hasHistoricalIndicators ? 
        'Fallback: Historical ownership indicators detected' :
        (hasCurrentIndicators ? 'Fallback: Current ownership indicators detected' : 'Fallback: Ownership status unclear'),
      issues: hasHistoricalIndicators ? ['Historical ownership detected'] : [],
      recommendations: hasHistoricalIndicators ? ['Seek current ownership information'] : [],
      fallback: true
    };
  }

  /**
   * Get the prompt for the dashboard
   */
  static getPromptForDashboard() {
    return {
      name: 'Quality Assessment Agent v1.2',
      version: '1.2',
      description: 'Assesses ownership data quality with focus on current ownership validation and historical filtering',
      model: 'gpt-4-turbo-preview',
      system_prompt: `You are an Ownership Quality Assessment Agent v1.2. Your job is to validate ownership claims and ensure they represent CURRENT ownership as of 2025, not historical ownership.

CRITICAL REQUIREMENTS:
1. CURRENT OWNERSHIP FOCUS: Only validate claims that represent the current owner as of 2025
2. HISTORICAL FILTERING: Identify and flag historical ownership information
3. ACQUISITION DATE VERIFICATION: Check acquisition dates to ensure recency
4. MULTIPLE OWNER CROSS-CHECKING: If multiple owners are found, identify the most recent
5. CONFIDENCE SCORING: Adjust confidence based on ownership recency and source quality

ASSESSMENT CRITERIA:
1. **Current Ownership Validation**: Is this the current owner as of 2025?
2. **Acquisition Date Verification**: When was the most recent acquisition/ownership change?
3. **Source Recency**: Are sources from 2023-2025 for ownership information?
4. **Historical vs Current**: Does the evidence support current or historical ownership?
5. **Multiple Owner Resolution**: If multiple owners found, which is most recent?
6. **Confidence Alignment**: Does confidence score reflect ownership recency?

CONFIDENCE SCORING FOR CURRENT OWNERSHIP:
- 90-100%: Multiple high-quality sources with explicit current ownership statements (2023-2025)
- 80-89%: Single high-quality source with current ownership documentation
- 70-79%: Recent financial news with clear current ownership information
- 50-69%: Multiple secondary sources with consistent current information
- 30-49%: Single secondary source or weak current evidence
- <30%: Insufficient current evidence, conflicting information, or outdated data

HISTORICAL OWNERSHIP PENALTIES:
- Sources mentioning "formerly owned", "previously owned", "sold to": -30% confidence
- Sources without clear acquisition dates: -20% confidence
- Sources older than 2023 for ownership info: -25% confidence
- Conflicting ownership information: -40% confidence

Respond with valid JSON only. Be conservative - if ownership recency is unclear, mark as questionable.`,
      user_prompt: `Please assess the quality and current ownership validity of this ownership claim:

OWNERSHIP CLAIM:
- Financial Beneficiary: "{{financial_beneficiary}}"
- Country: "{{beneficiary_country}}"
- Structure Type: "{{ownership_structure_type}}"
- Confidence Score: {{confidence_score}}
- Reasoning: "{{reasoning}}"

SOURCES USED:
{{sources}}

ASSESSMENT QUESTIONS:
1. Is this the CURRENT owner as of 2025?
2. What is the most recent acquisition date mentioned?
3. Are the sources recent (2023-2025) for ownership information?
4. Is there evidence of historical vs current ownership?
5. Are there multiple owners mentioned? If so, which is most recent?
6. Does the confidence score align with ownership recency?

Respond with JSON only:
{
  "is_current_owner": true/false,
  "confidence": 0-100,
  "quality_score": 0-100,
  "acquisition_year": "YYYY or Unknown",
  "ownership_timeline": "Brief timeline of ownership changes",
  "reasoning": "Detailed explanation of current ownership validation",
  "issues": ["list", "of", "problems", "if", "any"],
  "recommendations": ["list", "of", "improvements", "if", "needed"]
}`
    };
  }
} 