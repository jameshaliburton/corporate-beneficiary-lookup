/**
 * Enhanced Confidence Estimation System v1.2
 * Implements multi-factor scoring with current ownership validation
 */

/**
 * Calculate enhanced confidence score using multiple factors with current ownership focus
 * @param {Object} params - Confidence calculation parameters
 * @param {Object} params.ownershipData - Ownership research results
 * @param {Object} params.webResearchData - Web research data
 * @param {Object} params.queryAnalysis - Query analysis results
 * @param {Object} params.agentResults - Individual agent results
 * @param {Object} params.executionTrace - Execution trace data
 * @returns {Object} Enhanced confidence assessment
 */
export function calculateEnhancedConfidenceV1_2({
  ownershipData,
  webResearchData,
  queryAnalysis,
  agentResults,
  executionTrace
}) {
  const factors = {
    sourceQuality: calculateSourceQualityScoreV1_2(ownershipData, webResearchData),
    evidenceStrength: calculateEvidenceStrengthV1_2(ownershipData, webResearchData),
    currentOwnershipValidation: calculateCurrentOwnershipValidation(ownershipData, webResearchData),
    agentAgreement: calculateAgentAgreementV1_2(agentResults),
    reasoningQuality: calculateReasoningQualityV1_2(ownershipData),
    dataConsistency: calculateDataConsistencyV1_2(ownershipData, webResearchData),
    executionReliability: calculateExecutionReliabilityV1_2(executionTrace)
  }

  // Weighted scoring with emphasis on current ownership
  const weights = {
    sourceQuality: 0.20,
    evidenceStrength: 0.25,
    currentOwnershipValidation: 0.30, // Increased weight for current ownership
    agentAgreement: 0.15,
    reasoningQuality: 0.05,
    dataConsistency: 0.03,
    executionReliability: 0.02
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
  const confidenceLevel = getConfidenceLevelV1_2(finalScore)

  // Generate confidence breakdown
  const breakdown = Object.entries(factors).map(([factor, score]) => ({
    factor,
    score: Math.round(score),
    weight: Math.round(weights[factor] * 100),
    contribution: Math.round(score * weights[factor])
  }))

  return {
    confidence_score: finalScore,
    confidence_level: confidenceLevel,
    factors,
    breakdown,
    reasoning: generateConfidenceReasoningV1_2(factors, finalScore),
    current_ownership_validated: factors.currentOwnershipValidation >= 70
  }
}

/**
 * Calculate current ownership validation score (0-100)
 */
function calculateCurrentOwnershipValidation(ownershipData, webResearchData) {
  if (!ownershipData.reasoning) {
    return 20 // Very low score for no reasoning
  }

  let score = 50 // Base score
  const reasoning = ownershipData.reasoning.toLowerCase()
  const sources = webResearchData?.findings || []

  // Current ownership indicators (positive)
  const currentIndicators = [
    'currently owned', 'current owner', 'as of 2024', 'as of 2025', 
    'recently acquired', 'latest acquisition', 'current parent',
    'current ownership', 'present owner', 'now owned'
  ]
  
  const currentIndicatorCount = currentIndicators.filter(indicator => 
    reasoning.includes(indicator)
  ).length
  
  if (currentIndicatorCount > 0) {
    score += Math.min(30, currentIndicatorCount * 10)
  }

  // Historical ownership indicators (negative)
  const historicalIndicators = [
    'formerly owned', 'previously owned', 'was acquired', 'sold to',
    'divested', 'historical ownership', 'used to be owned',
    'former owner', 'past ownership'
  ]
  
  const historicalIndicatorCount = historicalIndicators.filter(indicator => 
    reasoning.includes(indicator)
  ).length
  
  if (historicalIndicatorCount > 0) {
    score -= Math.min(40, historicalIndicatorCount * 15)
  }

  // Acquisition date validation
  const acquisitionYearMatch = reasoning.match(/(?:acquired|purchased|bought) in (\d{4})/i)
  if (acquisitionYearMatch) {
    const year = parseInt(acquisitionYearMatch[1])
    if (year >= 2023) {
      score += 20 // Recent acquisition
    } else if (year >= 2020) {
      score += 10 // Moderately recent
    } else {
      score -= 20 // Old acquisition
    }
  }

  // Source recency check
  const recentSources = sources.filter(source => {
    const content = (source.content || '').toLowerCase()
    return currentIndicators.some(indicator => content.includes(indicator)) &&
           !historicalIndicators.some(indicator => content.includes(indicator))
  }).length

  if (recentSources > 0) {
    score += Math.min(20, recentSources * 5)
  }

  // Multiple owner detection
  const multipleOwnersMatch = reasoning.match(/(?:also|additionally|previously|formerly) owned by/i)
  if (multipleOwnersMatch) {
    score -= 15 // Multiple owners mentioned
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate source quality score with current ownership focus (0-100)
 */
function calculateSourceQualityScoreV1_2(ownershipData, webResearchData) {
  if (!ownershipData.sources || ownershipData.sources.length === 0) {
    return 20 // Very low score for no sources
  }

  let totalScore = 0
  let sourceCount = 0

  for (const source of ownershipData.sources) {
    const sourceScore = getSourceTypeScoreV1_2(source)
    totalScore += sourceScore
    sourceCount++
  }

  // Bonus for multiple high-quality sources
  const highQualitySources = ownershipData.sources.filter(s => getSourceTypeScoreV1_2(s) >= 70).length
  if (highQualitySources >= 2) {
    totalScore += 10
  }

  // Penalty for too many low-quality sources
  const lowQualitySources = ownershipData.sources.filter(s => getSourceTypeScoreV1_2(s) <= 30).length
  if (lowQualitySources > ownershipData.sources.length * 0.5) {
    totalScore *= 0.8
  }

  // Current ownership source bonus
  if (webResearchData?.findings) {
    const currentOwnershipSources = webResearchData.findings.filter(finding => {
      const content = (finding.content || '').toLowerCase()
      const currentIndicators = ['currently owned', 'current owner', 'as of 2024', 'as of 2025']
      const historicalIndicators = ['formerly owned', 'previously owned', 'was acquired']
      
      return currentIndicators.some(indicator => content.includes(indicator)) &&
             !historicalIndicators.some(indicator => content.includes(indicator))
    }).length

    if (currentOwnershipSources > 0) {
      totalScore += Math.min(15, currentOwnershipSources * 5)
    }
  }

  return Math.min(100, Math.round(totalScore / sourceCount))
}

/**
 * Calculate evidence strength with current ownership focus (0-100)
 */
function calculateEvidenceStrengthV1_2(ownershipData, webResearchData) {
  if (!ownershipData.reasoning) {
    return 10
  }

  let strength = 30 // Base score
  const reasoning = ownershipData.reasoning.toLowerCase()

  // Direct ownership statements
  const directStatements = ['owns', 'owned by', 'subsidiary of', 'parent company', 'holding company']
  const hasDirectStatements = directStatements.some(statement => reasoning.includes(statement))
  if (hasDirectStatements) {
    strength += 25
  }

  // Current ownership evidence
  const currentEvidence = ['currently', 'current', 'as of 2024', 'as of 2025', 'recently']
  const hasCurrentEvidence = currentEvidence.some(evidence => reasoning.includes(evidence))
  if (hasCurrentEvidence) {
    strength += 20
  }

  // Historical ownership evidence (penalty)
  const historicalEvidence = ['formerly', 'previously', 'was owned', 'sold to', 'divested']
  const hasHistoricalEvidence = historicalEvidence.some(evidence => reasoning.includes(evidence))
  if (hasHistoricalEvidence) {
    strength -= 30
  }

  // Source citations
  const hasSourceCitations = /(according to|source|found|research|filing|report)/i.test(reasoning)
  if (hasSourceCitations) {
    strength += 15
  }

  // Acquisition date specificity
  const hasAcquisitionDate = /\d{4}/.test(reasoning) && /(acquired|purchased|bought)/i.test(reasoning)
  if (hasAcquisitionDate) {
    strength += 10
  }

  // Uncertainty acknowledgment
  const acknowledgesUncertainty = /(may be|possibly|likely|appears|seems)/i.test(reasoning)
  if (acknowledgesUncertainty) {
    strength += 5
  }

  // Avoid hallucination patterns
  const hasHallucinationPatterns = /(typically|usually|most|common|pattern)/i.test(reasoning)
  if (hasHallucinationPatterns) {
    strength -= 10
  }

  return Math.max(0, Math.min(100, strength))
}

/**
 * Calculate agent agreement score with current ownership focus (0-100)
 */
function calculateAgentAgreementV1_2(agentResults) {
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
  const hasConflicts = checkForConflictsV1_2(agentResults)
  if (hasConflicts) {
    agreementScore *= 0.7
  }

  // Check for current ownership agreement
  const hasCurrentOwnershipAgreement = checkCurrentOwnershipAgreement(agentResults)
  if (hasCurrentOwnershipAgreement) {
    agreementScore += 10
  }

  return Math.round(agreementScore / agentCount)
}

/**
 * Calculate reasoning quality score with current ownership focus (0-100)
 */
function calculateReasoningQualityV1_2(ownershipData) {
  if (!ownershipData.reasoning) {
    return 10
  }

  let quality = 30 // Base score
  const reasoning = ownershipData.reasoning.toLowerCase()

  // Length factor
  const length = ownershipData.reasoning.length
  if (length > 500) quality += 20
  else if (length > 200) quality += 15
  else if (length > 100) quality += 10
  else if (length > 50) quality += 5

  // Current ownership specificity
  const hasCurrentOwnershipClaims = /(currently owns|current owner|as of 2024|as of 2025)/i.test(ownershipData.reasoning)
  if (hasCurrentOwnershipClaims) quality += 20

  // Historical ownership claims (penalty)
  const hasHistoricalClaims = /(formerly owned|previously owned|was acquired)/i.test(ownershipData.reasoning)
  if (hasHistoricalClaims) quality -= 15

  // Source citation factor
  const hasSourceCitations = /(according to|source|found|research)/i.test(ownershipData.reasoning)
  if (hasSourceCitations) quality += 15

  // Acquisition date specificity
  const hasAcquisitionDate = /\d{4}/.test(ownershipData.reasoning) && /(acquired|purchased)/i.test(ownershipData.reasoning)
  if (hasAcquisitionDate) quality += 10

  // Uncertainty acknowledgment
  const acknowledgesUncertainty = /(may be|possibly|likely|appears|seems)/i.test(ownershipData.reasoning)
  if (acknowledgesUncertainty) quality += 10

  // Avoid hallucination patterns
  const hasHallucinationPatterns = /(typically|usually|most|common|pattern)/i.test(ownershipData.reasoning)
  if (hasHallucinationPatterns) quality -= 10

  return Math.max(0, Math.min(100, quality))
}

/**
 * Calculate data consistency with current ownership focus (0-100)
 */
function calculateDataConsistencyV1_2(ownershipData, webResearchData) {
  if (!ownershipData.reasoning) {
    return 30
  }

  let consistency = 60 // Base score
  const reasoning = ownershipData.reasoning.toLowerCase()

  // Check for internal consistency
  const hasConsistentOwnership = !/(conflict|discrepancy|different|multiple)/i.test(reasoning)
  if (hasConsistentOwnership) {
    consistency += 20
  } else {
    consistency -= 30
  }

  // Check for current ownership consistency
  const hasCurrentConsistency = /(currently|current|as of 2024|as of 2025)/i.test(reasoning) &&
                               !/(formerly|previously|was owned)/i.test(reasoning)
  if (hasCurrentConsistency) {
    consistency += 15
  } else {
    consistency -= 20
  }

  // Check web research consistency
  if (webResearchData?.findings) {
    const currentSources = webResearchData.findings.filter(finding => {
      const content = (finding.content || '').toLowerCase()
      return /(currently|current|as of 2024|as of 2025)/i.test(content) &&
             !/(formerly|previously|was owned)/i.test(content)
    }).length

    const historicalSources = webResearchData.findings.filter(finding => {
      const content = (finding.content || '').toLowerCase()
      return /(formerly|previously|was owned)/i.test(content)
    }).length

    if (currentSources > historicalSources) {
      consistency += 10
    } else if (historicalSources > currentSources) {
      consistency -= 20
    }
  }

  return Math.max(0, Math.min(100, consistency))
}

/**
 * Calculate execution reliability score (0-100)
 */
function calculateExecutionReliabilityV1_2(executionTrace) {
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
 * Get source type score with current ownership focus
 */
function getSourceTypeScoreV1_2(source) {
  if (!source) return 0
  
  const sourceLower = source.toLowerCase()
  
  // Regulatory sources (highest priority)
  if (sourceLower.includes('sec.gov') || sourceLower.includes('edgar') || sourceLower.includes('regulatory')) {
    return 95
  }
  
  // Financial news (high priority)
  if (sourceLower.includes('bloomberg') || sourceLower.includes('reuters') || sourceLower.includes('wsj') || sourceLower.includes('ft.com')) {
    return 85
  }
  
  // Company official sources
  if (sourceLower.includes('annual') || sourceLower.includes('investor') || sourceLower.includes('ir.') || sourceLower.includes('corporate')) {
    return 80
  }
  
  // Business databases
  if (sourceLower.includes('opencorporates') || sourceLower.includes('dun') || sourceLower.includes('zoominfo')) {
    return 70
  }
  
  // News sources
  if (sourceLower.includes('press') || sourceLower.includes('news') || sourceLower.includes('media')) {
    return 60
  }
  
  // Reference sources
  if (sourceLower.includes('wikipedia') || sourceLower.includes('wiki')) {
    return 40
  }
  
  // Social media (lowest priority)
  if (sourceLower.includes('linkedin') || sourceLower.includes('facebook') || sourceLower.includes('twitter')) {
    return 20
  }
  
  return 30 // Default for unknown sources
}

/**
 * Check for conflicts in agent results
 */
function checkForConflictsV1_2(agentResults) {
  const beneficiaries = []
  
  for (const [agentName, result] of Object.entries(agentResults)) {
    if (result.success && result.data?.financial_beneficiary) {
      beneficiaries.push(result.data.financial_beneficiary)
    }
  }
  
  // Check for unique beneficiaries
  const uniqueBeneficiaries = [...new Set(beneficiaries)]
  return uniqueBeneficiaries.length > 1
}

/**
 * Check for current ownership agreement
 */
function checkCurrentOwnershipAgreement(agentResults) {
  let currentOwnershipCount = 0
  let totalAgents = 0
  
  for (const [agentName, result] of Object.entries(agentResults)) {
    if (result.success && result.data?.reasoning) {
      totalAgents++
      const reasoning = result.data.reasoning.toLowerCase()
      const currentIndicators = ['currently', 'current', 'as of 2024', 'as of 2025']
      const historicalIndicators = ['formerly', 'previously', 'was owned']
      
      if (currentIndicators.some(indicator => reasoning.includes(indicator)) &&
          !historicalIndicators.some(indicator => reasoning.includes(indicator))) {
        currentOwnershipCount++
      }
    }
  }
  
  return totalAgents > 0 && currentOwnershipCount / totalAgents >= 0.5
}

/**
 * Get confidence level based on score
 */
function getConfidenceLevelV1_2(score) {
  if (score >= 85) return 'Very High'
  if (score >= 70) return 'High'
  if (score >= 50) return 'Medium'
  if (score >= 30) return 'Low'
  return 'Very Low'
}

/**
 * Generate confidence reasoning with current ownership focus
 */
function generateConfidenceReasoningV1_2(factors, finalScore) {
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
  
  if (factors.currentOwnershipValidation >= 80) {
    reasoning.push('Current ownership well-validated')
  } else if (factors.currentOwnershipValidation <= 40) {
    reasoning.push('Historical ownership detected')
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
 * Get confidence color for UI display
 */
export function getConfidenceColorV1_2(score) {
  if (score >= 85) return { bg: '#dcfce7', color: '#166534' } // Green
  if (score >= 70) return { bg: '#dbeafe', color: '#1e40af' } // Blue
  if (score >= 50) return { bg: '#fef9c3', color: '#ca8a04' } // Yellow
  if (score >= 30) return { bg: '#fed7aa', color: '#ea580c' } // Orange
  return { bg: '#fee2e2', color: '#dc2626' } // Red
} 