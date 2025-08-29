/**
 * Enhanced Confidence Estimation System
 * Implements multi-factor scoring for more accurate confidence assessment
 */

import { validateConfidence, safeParseOwnershipData, ConfidenceSchema } from '../schemas/ownership-schema.ts'

/**
 * Calculate enhanced confidence score using multiple factors
 * @param {Object} params - Confidence calculation parameters
 * @param {Object} params.ownershipData - Ownership research results
 * @param {Object} params.webResearchData - Web research data
 * @param {Object} params.queryAnalysis - Query analysis results
 * @param {Object} params.agentResults - Individual agent results
 * @param {Object} params.executionTrace - Execution trace data
 * @returns {Object} Enhanced confidence assessment
 */
export function calculateEnhancedConfidence({
  ownershipData,
  webResearchData,
  queryAnalysis,
  agentResults,
  executionTrace
}) {
  const factors = {
    sourceQuality: calculateSourceQualityScore(ownershipData, webResearchData),
    evidenceStrength: calculateEvidenceStrength(ownershipData, webResearchData),
    agentAgreement: calculateAgentAgreement(agentResults),
    reasoningQuality: calculateReasoningQuality(ownershipData),
    dataConsistency: calculateDataConsistency(ownershipData, webResearchData),
    executionReliability: calculateExecutionReliability(executionTrace)
  }

  // Weighted scoring
  const weights = {
    sourceQuality: 0.25,
    evidenceStrength: 0.30,
    agentAgreement: 0.20,
    reasoningQuality: 0.15,
    dataConsistency: 0.05,
    executionReliability: 0.05
  }

  // Calculate weighted score
  let weightedScore = 0
  let totalWeight = 0

  for (const [factor, score] of Object.entries(factors)) {
    const weight = weights[factor]
    weightedScore += score * weight
    totalWeight += weight
  }

  const finalScore = Math.round(weightedScore / totalWeight)

  // Determine confidence level
  const confidenceLevel = getConfidenceLevel(finalScore)

  // Generate confidence breakdown
  const breakdown = Object.entries(factors).map(([factor, score]) => ({
    factor,
    score: Math.round(score),
    weight: Math.round(weights[factor] * 100),
    contribution: Math.round(score * weights[factor])
  }))

  // 🧠 SCHEMA VALIDATION
  console.log('[SCHEMA_GUARD] calculateEnhancedConfidence - Validating result before return')
  const rawResult = {
    confidence_score: finalScore,
    confidence_level: confidenceLevel,
    factors,
    breakdown,
    reasoning: generateConfidenceReasoning(factors, finalScore)
  }
  
  const validatedResult = safeParseOwnershipData(ConfidenceSchema, rawResult, 'calculateEnhancedConfidence')
  return validatedResult
}

/**
 * Calculate source quality score (0-100)
 */
function calculateSourceQualityScore(ownershipData, webResearchData) {
  if (!ownershipData.sources || ownershipData.sources.length === 0) {
    return 20 // Very low score for no sources
  }

  let totalScore = 0
  let sourceCount = 0

  for (const source of ownershipData.sources) {
    const sourceScore = getSourceTypeScore(source)
    totalScore += sourceScore
    sourceCount++
  }

  // Bonus for multiple high-quality sources
  const highQualitySources = ownershipData.sources.filter(s => getSourceTypeScore(s) >= 70).length
  if (highQualitySources >= 2) {
    totalScore += 10
  }

  // Penalty for too many low-quality sources
  const lowQualitySources = ownershipData.sources.filter(s => getSourceTypeScore(s) <= 30).length
  if (lowQualitySources > ownershipData.sources.length * 0.5) {
    totalScore *= 0.8
  }

  return Math.min(100, Math.round(totalScore / sourceCount))
}

/**
 * Calculate evidence strength score (0-100)
 */
function calculateEvidenceStrength(ownershipData, webResearchData) {
  let strength = 0

  // Ownership evidence
  if (ownershipData.financial_beneficiary && ownershipData.financial_beneficiary !== 'Unknown') {
    strength += 30
    
    // Check for specific ownership evidence in web research
    if (webResearchData?.findings) {
      const ownershipEvidence = webResearchData.findings.filter(f => 
        f.owner && f.owner.toLowerCase() === ownershipData.financial_beneficiary.toLowerCase()
      ).length
      strength += Math.min(20, ownershipEvidence * 5)
    }
  }

  // Country evidence
  if (ownershipData.beneficiary_country && ownershipData.beneficiary_country !== 'Unknown') {
    strength += 20
    
    if (webResearchData?.findings) {
      const countryEvidence = webResearchData.findings.filter(f => 
        f.country && f.country.toLowerCase() === ownershipData.beneficiary_country.toLowerCase()
      ).length
      strength += Math.min(15, countryEvidence * 3)
    }
  }

  // Structure evidence
  if (ownershipData.ownership_structure_type && ownershipData.ownership_structure_type !== 'Unknown') {
    strength += 20
    
    if (webResearchData?.findings) {
      const structureKeywords = getStructureKeywords(ownershipData.ownership_structure_type)
      const structureEvidence = webResearchData.findings.filter(f => 
        structureKeywords.some(keyword => 
          f.content?.toLowerCase().includes(keyword.toLowerCase())
        )
      ).length
      strength += Math.min(15, structureEvidence * 3)
    }
  }

  // Web research usage bonus
  if (ownershipData.web_research_used && webResearchData?.total_sources > 0) {
    strength += Math.min(15, webResearchData.total_sources * 2)
  }

  return Math.min(100, strength)
}

/**
 * Calculate agent agreement score (0-100)
 */
function calculateAgentAgreement(agentResults) {
  if (!agentResults || Object.keys(agentResults).length === 0) {
    return 50 // Neutral score for no agent results
  }

  let agreementScore = 0
  let agentCount = 0

  // Check success rates of individual agents
  for (const [agentName, result] of Object.entries(agentResults)) {
    if (result.success) {
      agreementScore += 80
    } else {
      agreementScore += 20
    }
    agentCount++
  }

  // Check for conflicting information
  const hasConflicts = checkForConflicts(agentResults)
  if (hasConflicts) {
    agreementScore *= 0.7
  }

  return Math.round(agreementScore / agentCount)
}

/**
 * Calculate reasoning quality score (0-100)
 */
function calculateReasoningQuality(ownershipData) {
  if (!ownershipData.reasoning) {
    return 10
  }

  let quality = 30 // Base score

  // Length factor
  const length = ownershipData.reasoning.length
  if (length > 500) quality += 20
  else if (length > 200) quality += 15
  else if (length > 100) quality += 10
  else if (length > 50) quality += 5

  // Specificity factor
  const hasSpecificClaims = /(owns|acquired|subsidiary|parent|holding)/i.test(ownershipData.reasoning)
  if (hasSpecificClaims) quality += 15

  // Source citation factor
  const hasSourceCitations = /(according to|source|found|research)/i.test(ownershipData.reasoning)
  if (hasSourceCitations) quality += 15

  // Uncertainty acknowledgment
  const acknowledgesUncertainty = /(may be|possibly|likely|appears|seems)/i.test(ownershipData.reasoning)
  if (acknowledgesUncertainty) quality += 10

  // Avoid hallucination patterns
  const hasHallucinationPatterns = /(typically|usually|most|common|pattern)/i.test(ownershipData.reasoning)
  if (hasHallucinationPatterns) quality -= 10

  return Math.max(0, Math.min(100, quality))
}

/**
 * Calculate data consistency score (0-100)
 */
function calculateDataConsistency(ownershipData, webResearchData) {
  let consistency = 80 // Base score

  // Check for conflicting ownership information
  if (webResearchData?.findings) {
    const owners = new Set()
    for (const finding of webResearchData.findings) {
      if (finding.owner) {
        owners.add(finding.owner.toLowerCase())
      }
    }
    
    if (owners.size > 1) {
      consistency -= 20 * (owners.size - 1)
    }
  }

  // Check for circular ownership
  if (ownershipData.financial_beneficiary && 
      ownershipData.financial_beneficiary.toLowerCase() === ownershipData.brand?.toLowerCase()) {
    consistency -= 30
  }

  return Math.max(0, consistency)
}

/**
 * Calculate execution reliability score (0-100)
 */
function calculateExecutionReliability(executionTrace) {
  if (!executionTrace?.stages) {
    return 50
  }

  let reliability = 80 // Base score

  // Check for errors in execution
  const errorStages = executionTrace.stages.filter(stage => stage.result === 'error')
  if (errorStages.length > 0) {
    reliability -= 20 * errorStages.length
  }

  // Check for missing critical stages
  const criticalStages = ['ownership_analysis', 'validation']
  const missingStages = criticalStages.filter(stage => 
    !executionTrace.stages.some(s => s.stage === stage)
  )
  if (missingStages.length > 0) {
    reliability -= 15 * missingStages.length
  }

  // Check execution time (penalty for very fast or very slow)
  if (executionTrace.total_duration_ms) {
    if (executionTrace.total_duration_ms < 1000) {
      reliability -= 10 // Too fast might indicate caching or skipping
    } else if (executionTrace.total_duration_ms > 60000) {
      reliability -= 10 // Too slow might indicate issues
    }
  }

  return Math.max(0, reliability)
}

/**
 * Get source type score based on source URL
 */
function getSourceTypeScore(source) {
  if (!source || typeof source !== 'string') return 20

  const url = source.toLowerCase()
  
  // High-quality sources
  if (url.includes('sec.gov') || url.includes('edgar')) return 95
  if (url.includes('bloomberg.com')) return 90
  if (url.includes('opencorporates.com')) return 85
  if (url.includes('crunchbase.com')) return 80
  if (url.includes('linkedin.com/company')) return 70
  if (url.includes('wikipedia.org')) return 60
  
  // News sources
  if (url.includes('reuters.com') || url.includes('bloomberg.com')) return 75
  if (url.includes('wsj.com') || url.includes('ft.com')) return 80
  if (url.includes('cnbc.com') || url.includes('forbes.com')) return 70
  
  // Company websites
  if (url.includes('.com') && !url.includes('blog') && !url.includes('news')) return 70
  
  // Social media and blogs
  if (url.includes('twitter.com') || url.includes('facebook.com')) return 30
  if (url.includes('blog') || url.includes('medium.com')) return 40
  if (url.includes('reddit.com')) return 20
  
  // Generic domains
  if (url.includes('google.com') || url.includes('bing.com')) return 50
  if (url.includes('youtube.com')) return 30
  
  return 40 // Default score for unknown sources
}

/**
 * Get structure keywords for ownership structure type
 */
function getStructureKeywords(structureType) {
  const keywords = {
    'Public': ['publicly traded', 'listed company', 'stock exchange', 'nyse', 'nasdaq'],
    'Private': ['privately held', 'private company', 'closely held'],
    'Subsidiary': ['subsidiary', 'wholly owned', 'division of', 'owned by'],
    'Cooperative': ['cooperative', 'co-op', 'member-owned', 'cooperative federation'],
    'State-owned': ['state-owned', 'government-owned', 'public sector', 'state enterprise'],
    'Franchise': ['franchise', 'franchisor', 'franchisee', 'franchise agreement']
  }
  
  return keywords[structureType] || []
}

/**
 * Check for conflicts in agent results
 */
function checkForConflicts(agentResults) {
  const owners = new Set()
  
  for (const [agentName, result] of Object.entries(agentResults)) {
    if (result.data?.financial_beneficiary) {
      owners.add(result.data.financial_beneficiary.toLowerCase())
    }
  }
  
  return owners.size > 1
}

/**
 * Get confidence level based on score
 */
function getConfidenceLevel(score) {
  if (score >= 85) return 'Very High'
  if (score >= 70) return 'High'
  if (score >= 50) return 'Medium'
  if (score >= 30) return 'Low'
  return 'Very Low'
}

/**
 * Generate confidence reasoning
 */
function generateConfidenceReasoning(factors, finalScore) {
  const reasoning = []
  
  if (factors.sourceQuality >= 80) {
    reasoning.push('High-quality sources used')
  } else if (factors.sourceQuality <= 40) {
    reasoning.push('Limited or low-quality sources')
  }
  
  if (factors.evidenceStrength >= 70) {
    reasoning.push('Strong evidence found')
  } else if (factors.evidenceStrength <= 30) {
    reasoning.push('Weak or insufficient evidence')
  }
  
  if (factors.agentAgreement >= 80) {
    reasoning.push('High agent agreement')
  } else if (factors.agentAgreement <= 40) {
    reasoning.push('Agent disagreement detected')
  }
  
  if (factors.reasoningQuality >= 70) {
    reasoning.push('Detailed reasoning provided')
  } else if (factors.reasoningQuality <= 30) {
    reasoning.push('Limited reasoning provided')
  }
  
  return reasoning.join(', ')
}

/**
 * Get confidence label for UI display
 */
export function getConfidenceLabel(score) {
  if (score >= 85) return 'Very High'
  if (score >= 70) return 'High'
  if (score >= 50) return 'Medium'
  if (score >= 30) return 'Low'
  return 'Very Low'
}

/**
 * Get confidence color for UI display
 */
export function getConfidenceColor(score) {
  if (score >= 85) return { bg: '#dcfce7', color: '#166534' } // Green
  if (score >= 70) return { bg: '#dbeafe', color: '#1e40af' } // Blue
  if (score >= 50) return { bg: '#fef9c3', color: '#ca8a04' } // Yellow
  if (score >= 30) return { bg: '#fed7aa', color: '#ea580c' } // Orange
  return { bg: '#fee2e2', color: '#dc2626' } // Red
} 