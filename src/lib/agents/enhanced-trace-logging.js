/**
 * Enhanced Trace Logging System
 * Provides detailed step-by-step reasoning and decision tracking
 */

/**
 * Enhanced execution trace structure
 */
export class EnhancedExecutionTrace {
  constructor(queryId, brand, productName, barcode) {
    this.trace_id = queryId
    this.start_time = new Date().toISOString()
    this.brand = brand
    this.product_name = productName
    this.barcode = barcode
    this.stages = []
    this.decisions = []
    this.reasoning_chain = []
    this.performance_metrics = {
      total_duration_ms: 0,
      stage_durations: {},
      memory_usage: null,
      api_calls: 0,
      token_usage: 0
    }
    this.final_result = null
    this.error_details = null
    this.confidence_evolution = []
  }

  /**
   * Add a stage to the trace
   */
  addStage(stageName, description, options = {}) {
    const stage = {
      stage_id: `${stageName}_${Date.now()}`,
      stage: stageName,
      description,
      start_time: new Date().toISOString(),
      status: 'started',
      reasoning: [],
      decisions: [],
      data: {},
      error: null,
      duration_ms: 0,
      ...options
    }
    
    this.stages.push(stage)
    return stage
  }

  /**
   * Complete a stage
   */
  completeStage(stageName, result, data = {}, reasoning = []) {
    const stage = this.stages.find(s => s.stage === stageName && s.status === 'started')
    if (!stage) {
      console.warn(`[EnhancedTrace] Stage ${stageName} not found or already completed`)
      return
    }

    stage.status = result
    stage.end_time = new Date().toISOString()
    stage.duration_ms = new Date(stage.end_time) - new Date(stage.start_time)
    stage.data = { ...stage.data, ...data }
    stage.reasoning = [...stage.reasoning, ...reasoning]

    // Update performance metrics
    this.performance_metrics.stage_durations[stageName] = stage.duration_ms
    this.performance_metrics.total_duration_ms = this.stages.reduce((sum, s) => sum + (s.duration_ms || 0), 0)

    return stage
  }

  /**
   * Add reasoning to current stage
   */
  addReasoning(stageName, reasoning, type = 'analysis') {
    const stage = this.stages.find(s => s.stage === stageName && s.status === 'started')
    if (!stage) {
      console.warn(`[EnhancedTrace] Stage ${stageName} not found or already completed`)
      return
    }

    stage.reasoning.push({
      timestamp: new Date().toISOString(),
      type,
      content: reasoning
    })

    // Also add to global reasoning chain
    this.reasoning_chain.push({
      stage: stageName,
      timestamp: new Date().toISOString(),
      type,
      content: reasoning
    })
  }

  /**
   * Add decision to current stage
   */
  addDecision(stageName, decision, alternatives = [], reasoning = '') {
    const stage = this.stages.find(s => s.stage === stageName && s.status === 'started')
    if (!stage) {
      console.warn(`[EnhancedTrace] Stage ${stageName} not found or already completed`)
      return
    }

    const decisionRecord = {
      timestamp: new Date().toISOString(),
      decision,
      alternatives,
      reasoning
    }

    stage.decisions.push(decisionRecord)

    // Also add to global decisions
    this.decisions.push({
      stage: stageName,
      ...decisionRecord
    })
  }

  /**
   * Track confidence evolution
   */
  trackConfidence(stageName, confidence, factors = {}) {
    this.confidence_evolution.push({
      stage: stageName,
      timestamp: new Date().toISOString(),
      confidence,
      factors
    })
  }

  /**
   * Add performance metric
   */
  addPerformanceMetric(metric, value) {
    this.performance_metrics[metric] = value
  }

  /**
   * Increment API calls
   */
  incrementApiCalls(count = 1) {
    this.performance_metrics.api_calls += count
  }

  /**
   * Add token usage
   */
  addTokenUsage(tokens) {
    this.performance_metrics.token_usage += tokens
  }

  /**
   * Set final result
   */
  setFinalResult(result, errorDetails = null) {
    this.final_result = result
    this.error_details = errorDetails
    this.performance_metrics.total_duration_ms = new Date() - new Date(this.start_time)
  }

  /**
   * Get trace summary
   */
  getSummary() {
    return {
      trace_id: this.trace_id,
      brand: this.brand,
      total_duration_ms: this.performance_metrics.total_duration_ms,
      stages_count: this.stages.length,
      decisions_count: this.decisions.length,
      reasoning_count: this.reasoning_chain.length,
      final_result: this.final_result,
      api_calls: this.performance_metrics.api_calls,
      token_usage: this.performance_metrics.token_usage
    }
  }

  /**
   * Get trace for database storage
   */
  toDatabaseFormat() {
    return {
      trace_id: this.trace_id,
      start_time: this.start_time,
      brand: this.brand,
      product_name: this.product_name,
      barcode: this.barcode,
      stages: this.stages,
      decisions: this.decisions,
      reasoning_chain: this.reasoning_chain,
      performance_metrics: this.performance_metrics,
      final_result: this.final_result,
      error_details: this.error_details,
      confidence_evolution: this.confidence_evolution
    }
  }
}

/**
 * Create enhanced trace logger
 */
export function createEnhancedTraceLogger(queryId, brand, productName, barcode) {
  return new EnhancedExecutionTrace(queryId, brand, productName, barcode)
}

/**
 * Enhanced stage tracking with reasoning
 */
export class EnhancedStageTracker {
  constructor(traceLogger, stageName, description) {
    this.traceLogger = traceLogger
    this.stageName = stageName
    this.description = description
    this.startTime = Date.now()
    
    // Start the stage
    this.stage = this.traceLogger.addStage(stageName, description)
  }

  /**
   * Add reasoning to current stage
   */
  reason(reasoning, type = 'analysis') {
    this.traceLogger.addReasoning(this.stageName, reasoning, type)
  }

  /**
   * Add decision to current stage
   */
  decide(decision, alternatives = [], reasoning = '') {
    this.traceLogger.addDecision(this.stageName, decision, alternatives, reasoning)
  }

  /**
   * Track confidence change
   */
  trackConfidence(confidence, factors = {}) {
    this.traceLogger.trackConfidence(this.stageName, confidence, factors)
  }

  /**
   * Complete stage with success
   */
  success(data = {}, reasoning = []) {
    return this.traceLogger.completeStage(this.stageName, 'success', data, reasoning)
  }

  /**
   * Complete stage with error
   */
  error(error, data = {}, reasoning = []) {
    const errorReasoning = [`Error: ${error.message}`, ...reasoning]
    return this.traceLogger.completeStage(this.stageName, 'error', data, errorReasoning)
  }

  /**
   * Complete stage with partial success
   */
  partial(data = {}, reasoning = []) {
    return this.traceLogger.completeStage(this.stageName, 'partial', data, reasoning)
  }

  /**
   * Get stage duration
   */
  getDuration() {
    return Date.now() - this.startTime
  }
}

/**
 * Enhanced reasoning types
 */
export const REASONING_TYPES = {
  ANALYSIS: 'analysis',
  DECISION: 'decision',
  EVIDENCE: 'evidence',
  INFERENCE: 'inference',
  VALIDATION: 'validation',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

/**
 * Enhanced decision tracking
 */
export class DecisionTracker {
  constructor(traceLogger) {
    this.traceLogger = traceLogger
    this.decisions = []
  }

  /**
   * Track a decision with alternatives
   */
  trackDecision(stageName, decision, alternatives = [], reasoning = '', confidence = null) {
    const decisionRecord = {
      stage: stageName,
      timestamp: new Date().toISOString(),
      decision,
      alternatives,
      reasoning,
      confidence
    }

    this.decisions.push(decisionRecord)
    this.traceLogger.addDecision(stageName, decision, alternatives, reasoning)

    if (confidence !== null) {
      this.traceLogger.trackConfidence(stageName, confidence, { decision })
    }

    return decisionRecord
  }

  /**
   * Get decision history
   */
  getDecisionHistory() {
    return this.decisions
  }

  /**
   * Get decisions by stage
   */
  getDecisionsByStage(stageName) {
    return this.decisions.filter(d => d.stage === stageName)
  }
}

/**
 * Enhanced evidence tracking
 */
export class EvidenceTracker {
  constructor(traceLogger) {
    this.traceLogger = traceLogger
    this.evidence = []
  }

  /**
   * Track evidence found
   */
  trackEvidence(stageName, evidence, source, confidence, type = 'ownership') {
    const evidenceRecord = {
      stage: stageName,
      timestamp: new Date().toISOString(),
      evidence,
      source,
      confidence,
      type
    }

    this.evidence.push(evidenceRecord)
    this.traceLogger.addReasoning(stageName, `Found ${type} evidence: ${evidence} (source: ${source}, confidence: ${confidence}%)`, REASONING_TYPES.EVIDENCE)

    return evidenceRecord
  }

  /**
   * Track conflicting evidence
   */
  trackConflictingEvidence(stageName, evidence1, evidence2, resolution = null) {
    const conflictRecord = {
      stage: stageName,
      timestamp: new Date().toISOString(),
      evidence1,
      evidence2,
      resolution
    }

    this.evidence.push(conflictRecord)
    this.traceLogger.addReasoning(stageName, `Conflicting evidence detected: ${evidence1} vs ${evidence2}${resolution ? ` (resolved: ${resolution})` : ''}`, REASONING_TYPES.WARNING)

    return conflictRecord
  }

  /**
   * Get evidence by type
   */
  getEvidenceByType(type) {
    return this.evidence.filter(e => e.type === type)
  }

  /**
   * Get evidence by stage
   */
  getEvidenceByStage(stageName) {
    return this.evidence.filter(e => e.stage === stageName)
  }
}

/**
 * Enhanced performance tracking
 */
export class PerformanceTracker {
  constructor(traceLogger) {
    this.traceLogger = traceLogger
    this.metrics = {
      api_calls: 0,
      token_usage: 0,
      memory_usage: null,
      stage_durations: {}
    }
  }

  /**
   * Track API call
   */
  trackApiCall(apiName, duration, tokens = 0) {
    this.metrics.api_calls++
    this.traceLogger.incrementApiCalls()
    
    if (tokens > 0) {
      this.traceLogger.addTokenUsage(tokens)
    }

    return {
      api_name: apiName,
      duration_ms: duration,
      tokens,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(usage) {
    this.metrics.memory_usage = usage
    this.traceLogger.addPerformanceMetric('memory_usage', usage)
  }

  /**
   * Track stage duration
   */
  trackStageDuration(stageName, duration) {
    this.metrics.stage_durations[stageName] = duration
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      total_api_calls: this.metrics.api_calls,
      total_token_usage: this.metrics.token_usage,
      memory_usage: this.metrics.memory_usage,
      average_stage_duration: Object.values(this.metrics.stage_durations).reduce((sum, d) => sum + d, 0) / Object.keys(this.metrics.stage_durations).length
    }
  }
}

/**
 * Enhanced trace analysis utilities
 */
export class TraceAnalyzer {
  constructor(trace) {
    this.trace = trace
  }

  /**
   * Analyze trace performance
   */
  analyzePerformance() {
    const stages = this.trace.stages || []
    const performance = this.trace.performance_metrics || {}

    return {
      total_duration: performance.total_duration_ms || 0,
      average_stage_duration: stages.length > 0 ? 
        stages.reduce((sum, s) => sum + (s.duration_ms || 0), 0) / stages.length : 0,
      slowest_stage: stages.reduce((slowest, stage) => 
        (stage.duration_ms || 0) > (slowest.duration_ms || 0) ? stage : slowest, { duration_ms: 0 }),
      api_efficiency: performance.api_calls > 0 ? 
        (performance.token_usage || 0) / performance.api_calls : 0,
      success_rate: stages.filter(s => s.status === 'success').length / stages.length
    }
  }

  /**
   * Analyze decision patterns
   */
  analyzeDecisions() {
    const decisions = this.trace.decisions || []
    
    return {
      total_decisions: decisions.length,
      decisions_by_stage: decisions.reduce((acc, d) => {
        acc[d.stage] = (acc[d.stage] || 0) + 1
        return acc
      }, {}),
      average_alternatives: decisions.length > 0 ? 
        decisions.reduce((sum, d) => sum + (d.alternatives?.length || 0), 0) / decisions.length : 0
    }
  }

  /**
   * Analyze reasoning patterns
   */
  analyzeReasoning() {
    const reasoning = this.trace.reasoning_chain || []
    
    return {
      total_reasoning: reasoning.length,
      reasoning_by_type: reasoning.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1
        return acc
      }, {}),
      reasoning_by_stage: reasoning.reduce((acc, r) => {
        acc[r.stage] = (acc[r.stage] || 0) + 1
        return acc
      }, {})
    }
  }

  /**
   * Analyze confidence evolution
   */
  analyzeConfidenceEvolution() {
    const evolution = this.trace.confidence_evolution || []
    
    if (evolution.length === 0) {
      return { confidence_changes: 0, average_confidence: 0 }
    }

    const confidences = evolution.map(e => e.confidence)
    const changes = evolution.slice(1).map((e, i) => e.confidence - evolution[i].confidence)

    return {
      confidence_changes: changes.length,
      average_confidence: confidences.reduce((sum, c) => sum + c, 0) / confidences.length,
      confidence_trend: changes.reduce((sum, c) => sum + c, 0),
      max_confidence: Math.max(...confidences),
      min_confidence: Math.min(...confidences)
    }
  }

  /**
   * Generate trace insights
   */
  generateInsights() {
    const performance = this.analyzePerformance()
    const decisions = this.analyzeDecisions()
    const reasoning = this.analyzeReasoning()
    const confidence = this.analyzeConfidenceEvolution()

    const insights = []

    // Performance insights
    if (performance.slowest_stage.duration_ms > 10000) {
      insights.push(`Slow stage detected: ${performance.slowest_stage.stage} took ${performance.slowest_stage.duration_ms}ms`)
    }

    if (performance.success_rate < 0.8) {
      insights.push(`Low success rate: ${(performance.success_rate * 100).toFixed(1)}% of stages succeeded`)
    }

    // Decision insights
    if (decisions.average_alternatives > 3) {
      insights.push(`High decision complexity: average of ${decisions.average_alternatives.toFixed(1)} alternatives per decision`)
    }

    // Reasoning insights
    if (reasoning.total_reasoning < 5) {
      insights.push(`Limited reasoning: only ${reasoning.total_reasoning} reasoning steps recorded`)
    }

    // Confidence insights
    if (confidence.confidence_trend < -10) {
      insights.push(`Declining confidence: confidence decreased by ${Math.abs(confidence.confidence_trend).toFixed(1)} points`)
    }

    return insights
  }
} 