# Agent Evaluation System Guide

## Overview

The Agent Evaluation System provides comprehensive monitoring and analysis of the Ownership Research Agent's behavior, helping you:

- **Score agents** by how often they ignore viable sources
- **Train/finetune** on known failures (e.g., "This source did mention ownership")
- **Improve source parsing** (e.g., fetch the page instead of relying on snippet)
- **Detect hallucinations** and prevent them
- **Monitor performance** metrics in real-time

## Key Features

### 1. Behavior Tracking
- **Source Usage Patterns**: Track how many available sources are actually used
- **Ignored Viable Sources**: Identify when agents miss relevant information
- **Hallucination Detection**: Detect patterns that indicate AI making up information
- **Response Time Monitoring**: Track performance and identify bottlenecks

### 2. Quality Assessment
- **Source Quality Scoring**: Rate sources by credibility (SEC filings = 95, Reddit = 15)
- **Confidence Accuracy**: Compare predicted vs actual confidence levels
- **Failure Pattern Analysis**: Categorize and track different types of failures

### 3. Performance Metrics
- **Success Rate**: Percentage of successful ownership determinations
- **Average Response Time**: Performance monitoring
- **Web Research Usage**: Track when external research is utilized
- **Hallucination Rate**: Monitor AI reliability

## Usage

### 1. Enable Evaluation in Agent Calls

```javascript
import { AgentOwnershipResearch } from './src/lib/agents/ownership-research-agent.js'

const result = await AgentOwnershipResearch({
  barcode: "1234567890123",
  product_name: "Kit Kat Chocolate Bar",
  brand: "Kit Kat",
  hints: { country_of_origin: "Switzerland" },
  enableEvaluation: true  // Enable detailed evaluation tracking
})

// Access evaluation data
if (result.evaluation) {
  console.log('Source Quality Score:', result.evaluation.sourceQualityScore)
  console.log('Viable Sources Ignored:', result.evaluation.viableSourcesIgnored)
  console.log('Hallucination Indicators:', result.evaluation.hallucinationIndicators)
}
```

### 2. Run Evaluation Tests

```bash
# Run the comprehensive evaluation test
node test-agent-evaluation.ts

# Run the demo
node test-evaluation-demo.js
```

### 3. Monitor via Dashboard

Start your development server and visit `/evaluation` to see the real-time dashboard:

```bash
npm run dev
# Then visit http://localhost:3000/evaluation
```

### 4. Access Metrics via API

```bash
# Get current metrics
curl http://localhost:3000/api/evaluation

# Reset metrics
curl http://localhost:3000/api/evaluation?action=reset
```

## Metrics Explained

### Success Rate
- **Good**: ≥80%
- **Warning**: 60-79%
- **Poor**: <60%

**Improvement**: Expand knowledge base, improve source parsing

### Response Time
- **Good**: <5 seconds
- **Warning**: 5-10 seconds
- **Poor**: >10 seconds

**Improvement**: Optimize web research, implement caching

### Source Quality
- **Good**: ≥70 (high-credibility sources)
- **Warning**: 50-69 (mixed sources)
- **Poor**: <50 (low-credibility sources)

**Improvement**: Implement better source credibility scoring

### Hallucination Rate
- **Good**: 0 instances
- **Warning**: 1-2 instances
- **Poor**: >2 instances

**Improvement**: Strengthen validation rules, require specific sources

## Failure Patterns

### 1. Hallucination
**Symptoms**: High confidence without good sources, suspicious reasoning patterns
**Detection**: 
- `high_confidence_no_sources`
- `suspicious_reasoning_pattern`
- `ignored_web_research`
- `generic_sources_specific_claims`

**Solutions**:
- Require specific source citations
- Implement stricter validation rules
- Improve source parsing to fetch full pages

### 2. Insufficient Data
**Symptoms**: Low confidence, no specific sources found
**Detection**: `insufficient_data` pattern

**Solutions**:
- Expand web research queries
- Add more data sources
- Improve search term generation

## Source Quality Scoring

| Source Type | Score | Description |
|-------------|-------|-------------|
| SEC filings | 95 | Official regulatory documents |
| Annual reports | 90 | Company financial reports |
| Bloomberg | 90 | Professional financial data |
| OpenCorporates | 85 | Business registry data |
| Crunchbase | 80 | Business database |
| Press releases | 75 | Official company announcements |
| Company websites | 70 | Official company information |
| LinkedIn | 70 | Professional networking |
| Wikipedia | 60 | Crowdsourced encyclopedia |
| News articles | 65 | Journalistic sources |
| Blog posts | 40 | Personal/company blogs |
| Social media | 30 | Informal sources |
| Forums | 20 | Community discussions |
| Reddit | 15 | Social platform discussions |

## Hallucination Detection

The system detects potential hallucinations through:

### 1. Suspicious Reasoning Patterns
```javascript
const suspiciousPatterns = [
  /based on.*pattern/i,
  /likely.*owned/i,
  /probably.*subsidiary/i,
  /appears.*to be/i,
  /common.*industry/i,
  /typically.*owned/i,
  /usually.*owned/i,
  /most.*companies/i
]
```

### 2. Source Mismatch
- High confidence claims with generic sources
- Ignoring available web research data
- No specific source citations

### 3. Confidence-Source Mismatch
- High confidence (>70%) without credible sources
- Specific claims with only generic source references

## Improvement Recommendations

### For Low Success Rate
1. **Expand Knowledge Base**: Add more company ownership data
2. **Improve Source Parsing**: Fetch full pages instead of snippets
3. **Enhance Search Queries**: Generate more specific search terms
4. **Add Data Sources**: Integrate more business databases

### For High Hallucination Rate
1. **Require Specific Sources**: Mandate source citations for claims
2. **Strengthen Validation**: Implement stricter confidence thresholds
3. **Improve Source Parsing**: Better extraction of ownership information
4. **Add Fact-Checking**: Cross-reference claims across multiple sources

### For Ignored Sources
1. **Improve Source Prioritization**: Better ranking of relevant sources
2. **Enhanced Parsing**: Extract more information from each source
3. **Query Optimization**: Generate more targeted search queries
4. **Source Diversity**: Use multiple search engines and databases

### For Slow Response Times
1. **Implement Caching**: Cache common queries and results
2. **Parallel Processing**: Run multiple searches simultaneously
3. **Optimize APIs**: Use faster search and scraping services
4. **Reduce Scope**: Limit search depth for faster responses

## Training and Fine-tuning

### 1. Collect Failure Data
```javascript
// Track known failures for training
const failureData = {
  query: "Kit Kat ownership",
  expected: "Nestlé",
  actual: "Unknown",
  sources: ["web_research"],
  failureType: "ignored_viable_sources",
  timestamp: new Date().toISOString()
}
```

### 2. Analyze Patterns
- Identify common failure scenarios
- Track source usage patterns
- Monitor confidence accuracy
- Analyze response time patterns

### 3. Implement Improvements
- Update source parsing logic
- Adjust confidence thresholds
- Improve search query generation
- Enhance validation rules

## API Reference

### GET /api/evaluation
Returns current evaluation metrics.

**Response**:
```json
{
  "success": true,
  "metrics": {
    "totalQueries": 25,
    "successfulQueries": 20,
    "failedQueries": 5,
    "successRate": 80.0,
    "avgResponseTime": 3500,
    "avgSourceQuality": 75.5,
    "ignoredViableSources": 2,
    "usedWebResearch": 23,
    "hallucinationDetected": 1,
    "failurePatterns": {
      "hallucination": 1,
      "insufficient_data": 4
    },
    "sourceUsagePatterns": {
      "5_3": 10,
      "3_2": 8
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/evaluation?action=reset
Resets all evaluation metrics.

**Response**:
```json
{
  "success": true,
  "message": "Evaluation metrics reset successfully"
}
```

## Best Practices

### 1. Regular Monitoring
- Check dashboard daily during development
- Monitor trends over time
- Set up alerts for critical metrics

### 2. Iterative Improvement
- Run evaluation tests after each change
- Track metrics before/after improvements
- Focus on highest-impact areas

### 3. Data Quality
- Validate known truth data
- Cross-reference results
- Maintain test case diversity

### 4. Performance Optimization
- Cache frequently requested data
- Optimize search queries
- Monitor API rate limits

## Troubleshooting

### Common Issues

1. **No Evaluation Data**
   - Ensure `enableEvaluation: true` is set
   - Check that the agent is being called correctly
   - Verify API endpoints are accessible

2. **High Hallucination Rate**
   - Review source parsing logic
   - Check web research availability
   - Validate confidence thresholds

3. **Slow Response Times**
   - Check API rate limits
   - Monitor network connectivity
   - Review search query complexity

4. **Low Success Rate**
   - Verify data sources are working
   - Check search query generation
   - Review validation logic

### Debug Mode

Enable detailed logging by setting environment variables:
```bash
DEBUG=agent-evaluation npm run dev
```

This will provide detailed logs of:
- Source usage patterns
- Hallucination detection
- Performance metrics
- Failure analysis

## Conclusion

The Agent Evaluation System provides comprehensive monitoring and analysis capabilities to improve the reliability and performance of your ownership research agent. By regularly monitoring these metrics and implementing the recommended improvements, you can significantly enhance the quality and accuracy of your agent's results.

For questions or support, refer to the test files and API documentation provided in this codebase. 