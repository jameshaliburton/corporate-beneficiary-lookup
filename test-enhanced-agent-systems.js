/**
 * Test script for Enhanced Agent Systems
 * Demonstrates multi-factor confidence estimation and detailed trace logging
 */

import { calculateEnhancedConfidence, getConfidenceLabel, getConfidenceColor } from './src/lib/agents/confidence-estimation.js';
import { 
  createEnhancedTraceLogger, 
  EnhancedStageTracker, 
  DecisionTracker, 
  EvidenceTracker, 
  PerformanceTracker,
  TraceAnalyzer,
  REASONING_TYPES 
} from './src/lib/agents/enhanced-trace-logging.js';

async function testEnhancedSystems() {
  console.log('🧪 Testing Enhanced Agent Systems');
  console.log('==================================');
  
  // Test case
  const testCase = {
    barcode: '1234567890123',
    product_name: 'Test Product',
    brand: 'TestBrand',
    hints: {}
  };
  
  console.log(`\n📋 Test Case: ${testCase.brand}`);
  console.log(`Barcode: ${testCase.barcode}`);
  
  // Initialize enhanced trace logger
  const traceLogger = createEnhancedTraceLogger(
    `test_${Date.now()}`,
    testCase.brand,
    testCase.product_name,
    testCase.barcode
  );
  
  const decisionTracker = new DecisionTracker(traceLogger);
  const evidenceTracker = new EvidenceTracker(traceLogger);
  const performanceTracker = new PerformanceTracker(traceLogger);
  
  try {
    // Simulate research process with enhanced tracking
    
    // Step 1: Cache Check
    const cacheStage = new EnhancedStageTracker(traceLogger, 'cache_check', 'Checking for existing cached result');
    cacheStage.reason('Checking database for existing product record', REASONING_TYPES.INFO);
    
    // Simulate cache miss
    cacheStage.reason('No cached result found, proceeding with research', REASONING_TYPES.INFO);
    cacheStage.success({ result: 'miss' }, ['No cached result available']);
    
    // Step 2: Static Mapping
    const staticStage = new EnhancedStageTracker(traceLogger, 'static_mapping', 'Checking static ownership mappings');
    staticStage.reason('Checking static mappings for brand: TestBrand', REASONING_TYPES.INFO);
    
    // Simulate static mapping miss
    staticStage.reason('No static mapping found, proceeding with AI research', REASONING_TYPES.INFO);
    staticStage.success({ result: 'miss' }, ['No static mapping available']);
    
    // Step 3: Query Builder
    const queryStage = new EnhancedStageTracker(traceLogger, 'query_builder', 'Analyzing brand for optimal search queries');
    queryStage.reason('Query builder available, generating optimized search queries', REASONING_TYPES.INFO);
    
    // Simulate query analysis
    const mockQueryAnalysis = {
      company_type: 'Private',
      country_guess: 'United States',
      recommended_queries: [
        'TestBrand ownership structure',
        'TestBrand parent company',
        'TestBrand corporate ownership'
      ],
      flags: ['private_company', 'us_based']
    };
    
    queryStage.reason(`Query analysis complete: ${mockQueryAnalysis.company_type} company, ${mockQueryAnalysis.recommended_queries.length} queries`, REASONING_TYPES.ANALYSIS);
    queryStage.decide('Use query analysis', ['Use default queries'], 'Query builder provided optimized search strategy');
    queryStage.success({
      company_type: mockQueryAnalysis.company_type,
      country_guess: mockQueryAnalysis.country_guess,
      query_count: mockQueryAnalysis.recommended_queries.length,
      flags: mockQueryAnalysis.flags
    }, ['Query analysis completed successfully']);
    
    // Step 4: Web Research
    const webStage = new EnhancedStageTracker(traceLogger, 'web_research', 'Performing web research for ownership information');
    webStage.reason('Web research available, performing comprehensive search', REASONING_TYPES.INFO);
    
    // Simulate web research results
    const mockWebResearch = {
      success: true,
      total_sources: 5,
      search_results_count: 15,
      scraped_sites_count: 3,
      findings: [
        { owner: 'ParentCorp Inc', source: 'https://example.com/ownership', confidence: 80, type: 'ownership' },
        { owner: 'ParentCorp Inc', source: 'https://example.com/about', confidence: 75, type: 'ownership' },
        { country: 'United States', source: 'https://example.com/location', confidence: 90, type: 'location' }
      ]
    };
    
    webStage.reason(`Web research successful: ${mockWebResearch.total_sources} sources, ${mockWebResearch.findings.length} findings`, REASONING_TYPES.EVIDENCE);
    
    // Track evidence found
    mockWebResearch.findings.forEach(finding => {
      if (finding.owner) {
        evidenceTracker.trackEvidence('web_research', finding.owner, finding.source, finding.confidence, 'ownership');
      }
    });
    
    webStage.success({
      success: mockWebResearch.success,
      total_sources: mockWebResearch.total_sources,
      search_results_count: mockWebResearch.search_results_count,
      scraped_sites_count: mockWebResearch.scraped_sites_count,
      findings_count: mockWebResearch.findings.length
    }, ['Web research completed successfully']);
    
    // Step 5: Ownership Analysis
    const analysisStage = new EnhancedStageTracker(traceLogger, 'ownership_analysis', 'Performing LLM-based ownership analysis');
    analysisStage.reason('Analyzing ownership with 5 sources', REASONING_TYPES.ANALYSIS);
    
    // Simulate ownership analysis results
    const mockOwnership = {
      financial_beneficiary: 'ParentCorp Inc',
      beneficiary_country: 'United States',
      ownership_structure_type: 'Subsidiary',
      confidence_score: 75,
      sources: [
        'https://example.com/ownership',
        'https://example.com/about',
        'https://example.com/location'
      ],
      reasoning: 'Based on web research findings, TestBrand appears to be a subsidiary of ParentCorp Inc, a US-based company. Multiple sources confirm this ownership structure.'
    };
    
    analysisStage.reason(`Analysis complete: ${mockOwnership.financial_beneficiary} (confidence: ${mockOwnership.confidence_score}%)`, REASONING_TYPES.INFERENCE);
    analysisStage.trackConfidence(mockOwnership.confidence_score, { 
      sources_count: mockOwnership.sources.length,
      web_research_used: true
    });
    
    analysisStage.success({
      confidence_score: mockOwnership.confidence_score,
      financial_beneficiary: mockOwnership.financial_beneficiary,
      beneficiary_country: mockOwnership.beneficiary_country,
      sources_count: mockOwnership.sources.length
    }, ['Ownership analysis completed']);
    
    // Step 6: Enhanced Confidence Calculation
    const confidenceStage = new EnhancedStageTracker(traceLogger, 'confidence_calculation', 'Calculating enhanced confidence score');
    
    // Calculate enhanced confidence using multi-factor approach
    const enhancedConfidence = calculateEnhancedConfidence({
      ownershipData: mockOwnership,
      webResearchData: mockWebResearch,
      queryAnalysis: mockQueryAnalysis,
      agentResults: {
        query_builder: { success: true, data: mockQueryAnalysis },
        web_research: { success: true, data: mockWebResearch },
        ownership_analysis: { success: true, data: mockOwnership }
      },
      executionTrace: traceLogger.toDatabaseFormat()
    });
    
    console.log('\n📊 Enhanced Confidence Calculation:');
    console.log(`Final Score: ${enhancedConfidence.confidence_score}%`);
    console.log(`Confidence Level: ${enhancedConfidence.confidence_level}`);
    console.log(`Reasoning: ${enhancedConfidence.reasoning}`);
    
    console.log('\n🔍 Confidence Factors:');
    Object.entries(enhancedConfidence.factors).forEach(([factor, score]) => {
      console.log(`  ${factor}: ${Math.round(score)}%`);
    });
    
    console.log('\n📈 Confidence Breakdown:');
    enhancedConfidence.breakdown.forEach(item => {
      console.log(`  ${item.factor}: ${item.score}% × ${item.weight}% = ${item.contribution} pts`);
    });
    
    // Update ownership data with enhanced confidence
    mockOwnership.confidence_score = enhancedConfidence.confidence_score;
    mockOwnership.confidence_level = enhancedConfidence.confidence_level;
    mockOwnership.confidence_factors = enhancedConfidence.factors;
    mockOwnership.confidence_breakdown = enhancedConfidence.breakdown;
    mockOwnership.confidence_reasoning = enhancedConfidence.reasoning;
    
    confidenceStage.reason(`Enhanced confidence calculated: ${enhancedConfidence.confidence_score}% (${enhancedConfidence.confidence_level})`, REASONING_TYPES.ANALYSIS);
    confidenceStage.success({
      final_confidence_score: enhancedConfidence.confidence_score,
      confidence_level: enhancedConfidence.confidence_level,
      factors_count: Object.keys(enhancedConfidence.factors).length
    }, ['Enhanced confidence calculation completed']);
    
    // Step 7: Validation
    const validationStage = new EnhancedStageTracker(traceLogger, 'validation', 'Validating and sanitizing results');
    validationStage.reason(`Validation complete: ${mockOwnership.financial_beneficiary} (final confidence: ${mockOwnership.confidence_score}%)`, REASONING_TYPES.VALIDATION);
    validationStage.success({
      final_confidence_score: mockOwnership.confidence_score,
      warnings_count: 0,
      validation_passed: true
    }, ['Validation and sanitization completed']);
    
    // Set final result
    traceLogger.setFinalResult('success');
    
    // Analyze trace
    const traceAnalyzer = new TraceAnalyzer(traceLogger.toDatabaseFormat());
    const performanceAnalysis = traceAnalyzer.analyzePerformance();
    const decisionAnalysis = traceAnalyzer.analyzeDecisions();
    const reasoningAnalysis = traceAnalyzer.analyzeReasoning();
    const confidenceAnalysis = traceAnalyzer.analyzeConfidenceEvolution();
    const insights = traceAnalyzer.generateInsights();
    
    console.log('\n📊 Trace Analysis:');
    console.log(`Total Duration: ${performanceAnalysis.total_duration}ms`);
    console.log(`Average Stage Duration: ${Math.round(performanceAnalysis.average_stage_duration)}ms`);
    console.log(`Success Rate: ${(performanceAnalysis.success_rate * 100).toFixed(1)}%`);
    console.log(`Total Decisions: ${decisionAnalysis.total_decisions}`);
    console.log(`Total Reasoning: ${reasoningAnalysis.total_reasoning}`);
    console.log(`Confidence Changes: ${confidenceAnalysis.confidence_changes}`);
    
    if (insights.length > 0) {
      console.log('\n💡 Insights:');
      insights.forEach(insight => console.log(`  • ${insight}`));
    }
    
    console.log('\n🎉 Enhanced Systems Test Complete!');
    
    return {
      ownership: mockOwnership,
      trace: traceLogger.toDatabaseFormat(),
      enhancedConfidence,
      analysis: {
        performance: performanceAnalysis,
        decisions: decisionAnalysis,
        reasoning: reasoningAnalysis,
        confidence: confidenceAnalysis,
        insights
      }
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    const errorStage = new EnhancedStageTracker(traceLogger, 'error_recovery', 'Error recovery and fallback response');
    errorStage.reason(`Test failed: ${error.message}`, REASONING_TYPES.ERROR);
    errorStage.error(error, {}, ['Test process encountered an error']);
    
    traceLogger.setFinalResult('error', error.message);
    
    throw error;
  }
}

// Run the test
testEnhancedSystems()
  .then(result => {
    console.log('\n✅ Test completed successfully!');
    console.log('Final ownership result:', result.ownership.financial_beneficiary);
    console.log('Final confidence score:', result.ownership.confidence_score);
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
  }); 