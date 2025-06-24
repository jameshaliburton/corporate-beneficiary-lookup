# Evaluation Framework Guide

## Overview

The Evaluation Framework connects agent workflows with structured Google Sheets for human-in-the-loop feedback, regression testing, and systematic agent improvement. This system enables systematic evaluation of AI agent performance and continuous improvement through human feedback.

## Architecture

### 📋 Sheet Structure

The framework creates a Google Sheets file with the following tabs:

1. **Evaluation Cases** - Defines evaluation prompts with metadata
2. **Human Ratings** - Manual scores and comments from evaluators  
3. **AI Results** - Automated agent outputs and metrics
4. **Ownership Mappings** - Reference data for brand-to-owner mappings
5. **Feedback & Suggestions** - Freeform comments and improvement suggestions

### 🔄 Workflow

1. **Case Creation**: Evaluation prompts are written by humans or exported from Supabase
2. **Agent Execution**: Agents run on cases and log results to AI Results tab
3. **Human Evaluation**: Evaluators compare AI results against expectations
4. **Analysis**: System compares human vs AI scores and identifies mismatches
5. **Improvement**: Insights drive agent refinement and prompt engineering

## Evaluation Mode

### 🎯 Selective Logging

The framework uses **evaluation mode** to prevent expensive and noisy logging of all AI results. By default, Google Sheets logging is **disabled**.

#### Normal Operation (Default)
```javascript
// No Google Sheets logging
const result = await AgentOwnershipResearch({
  barcode: '123456789',
  product_name: 'Product Name',
  brand: 'Brand Name'
  // evaluation_mode defaults to false
})
```

#### Evaluation Mode (Selective)
```javascript
// Enable Google Sheets logging for specific requests
const result = await AgentOwnershipResearch({
  barcode: '123456789',
  product_name: 'Product Name',
  brand: 'Brand Name',
  enableEvaluation: true  // Enable evaluation logging
})
```

#### API-Level Control
```javascript
// Via API with evaluation_mode parameter
const response = await fetch('/api/lookup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    barcode: '123456789',
    product_name: 'Test Product',
    brand: 'Test Brand',
    evaluation_mode: true  // Enable Google Sheets logging
  })
})
```

### 🔧 Environment Variables

```bash
# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./gcp-service-account.json
GOOGLE_SHEETS_EVALUATION_ID=your_spreadsheet_id_here

# Evaluation Mode Control
ENABLE_EVALUATION_LOGGING=false  # Default: disabled
```

### 📊 When to Use Evaluation Mode

**Use evaluation mode for:**
- Testing new agent versions
- Debugging specific cases
- Systematic evaluation runs
- Performance benchmarking
- Regression testing

**Don't use evaluation mode for:**
- Normal user requests
- Production traffic
- High-volume operations
- Cost-sensitive operations

## Setup

### 1. Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a Service Account
5. Download the JSON key file
6. Place the key file in your project (e.g., `gcp-service-account.json`)

### 2. Environment Variables

Add to your `.env.local`:

```bash
# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./gcp-service-account.json
GOOGLE_SHEETS_EVALUATION_ID=your_spreadsheet_id_here

# Optional: Custom spreadsheet title
GOOGLE_SHEETS_EVALUATION_TITLE="Agent Evaluation Framework"

# Evaluation Mode Control (default: false)
ENABLE_EVALUATION_LOGGING=false
```

### 3. Install Dependencies

```bash
npm install googleapis
```

## Usage

### Creating an Evaluation Spreadsheet

```javascript
import { evaluationFramework } from './src/lib/services/evaluation-framework.js'

// Create a new evaluation spreadsheet
const spreadsheetId = await evaluationFramework.createEvaluationSpreadsheet('My Agent Evaluation')
console.log('Created spreadsheet:', spreadsheetId)
```

### Logging AI Results

```javascript
// Log an AI result to the evaluation framework
const aiResult = {
  case_id: 'barcode_123456789',
  agent_version: 'v1.0',
  output: {
    financial_beneficiary: 'Nestlé S.A.',
    beneficiary_country: 'Switzerland',
    confidence_score: 85,
    result_type: 'ai_research',
    sources: ['https://example.com/source1'],
    reasoning: 'Based on web research...'
  },
  evaluation_score: 8.5,
  logs: {
    warnings: [],
    source_quality: 8.0,
    hallucination_indicators: [],
    response_time_ms: 2500
  },
  execution_trace: { /* detailed execution trace */ },
  confidence_score: 85,
  sources_used: ['https://example.com/source1'],
  fallback_reason: null,
  total_duration_ms: 2500
}

await evaluationFramework.addAIResult(aiResult)
```

### Retrieving Evaluation Data

```javascript
// Get evaluation statistics
const stats = await evaluationFramework.getEvaluationStats()
console.log('Total cases:', stats.total_cases)
console.log('Average human score:', stats.average_human_score)

// Get AI results for a specific case
const aiResults = await evaluationFramework.getAIResults('barcode_123456789')

// Compare human vs AI evaluations
const comparison = await evaluationFramework.compareEvaluations('barcode_123456789')
console.log('Score difference:', comparison.mismatches)
```

## Dashboard Integration

The dashboard includes a dedicated "Evaluation" tab with:

- **Statistics Overview**: Cases, ratings, and score averages
- **Case Management**: View and manage evaluation cases
- **Comparison Tools**: Compare human vs AI scores
- **Mismatch Detection**: Identify scoring discrepancies

### Features

- **Real-time Data**: Live updates from Google Sheets
- **Visual Analytics**: Charts and metrics for performance tracking
- **Case Comparison**: Side-by-side human vs AI evaluation comparison
- **Mismatch Alerts**: Automatic detection of significant score differences

## API Endpoints

### GET `/api/evaluation-framework`

Query parameters:
- `action=stats` - Get evaluation statistics
- `action=cases` - Get evaluation cases
- `action=human_ratings&case_id=X` - Get human ratings for case
- `action=ai_results&case_id=X` - Get AI results for case
- `action=comparison&case_id=X` - Compare human vs AI evaluations

### POST `/api/evaluation-framework`

Body:
```json
{
  "action": "create_spreadsheet",
  "data": { "title": "My Evaluation Framework" }
}
```

### POST `/api/lookup` (with evaluation mode)

Body:
```json
{
  "barcode": "123456789",
  "product_name": "Test Product",
  "brand": "Test Brand",
  "evaluation_mode": true
}
```

## Agent Integration

The ownership research agent automatically logs results when evaluation is enabled:

```javascript
// In your agent code
const result = await AgentOwnershipResearch({
  barcode: '123456789',
  product_name: 'Product Name',
  brand: 'Brand Name',
  enableEvaluation: true  // Enable evaluation logging
})
```

Results are automatically logged to the AI Results tab with:
- Execution trace data
- Performance metrics
- Source quality scores
- Confidence assessments

## Testing

### Test Evaluation Mode

```bash
# Test selective logging
node test-evaluation-mode.js

# Test full framework
node test-evaluation-framework.js
```

### Manual Testing

1. **Normal Request** (no logging):
   ```bash
   curl -X POST http://localhost:3001/api/lookup \
     -H "Content-Type: application/json" \
     -d '{"barcode":"123456789","evaluation_mode":false}'
   ```

2. **Evaluation Request** (with logging):
   ```bash
   curl -X POST http://localhost:3001/api/lookup \
     -H "Content-Type: application/json" \
     -d '{"barcode":"987654321","evaluation_mode":true}'
   ```

## Best Practices

### 1. Case Design

- Use clear, specific evaluation criteria
- Include expected behaviors and outcomes
- Provide context and background information
- Use consistent scoring scales (1-10 recommended)

### 2. Human Evaluation

- Train evaluators on consistent scoring
- Use multiple evaluators for important cases
- Document reasoning for scores
- Flag potential hallucinations or errors

### 3. Analysis

- Monitor score discrepancies >2 points
- Track performance trends over time
- Identify common failure patterns
- Use insights for prompt engineering

### 4. Continuous Improvement

- Regular review of evaluation cases
- Update scoring criteria based on learnings
- Retire outdated or ineffective cases
- Add new cases for emerging scenarios

### 5. Cost Management

- Use evaluation mode sparingly
- Batch evaluation runs when possible
- Monitor Google Sheets API usage
- Set up alerts for quota limits

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify service account key file path
   - Check Google Sheets API is enabled
   - Ensure service account has proper permissions

2. **Missing Spreadsheet ID**
   - Create spreadsheet first using dashboard or API
   - Set GOOGLE_SHEETS_EVALUATION_ID in environment

3. **Permission Errors**
   - Share spreadsheet with service account email
   - Grant editor permissions for write access

4. **Rate Limiting**
   - Implement exponential backoff for API calls
   - Batch operations when possible
   - Monitor API quotas in Google Cloud Console

5. **Unexpected Logging**
   - Check ENABLE_EVALUATION_LOGGING environment variable
   - Verify evaluation_mode parameter in API calls
   - Review agent enableEvaluation parameter

### Debug Mode

Enable debug logging:

```javascript
// In your code
console.log('[EvaluationFramework] Debug mode enabled')
evaluationFramework.debug = true
```

## Future Enhancements

- **Automated Evaluation**: AI-powered scoring of agent outputs
- **Regression Testing**: Automated comparison of agent versions
- **Performance Analytics**: Advanced metrics and visualizations
- **Integration APIs**: Connect with external evaluation tools
- **Multi-language Support**: International evaluation frameworks
- **Batch Processing**: Efficient bulk evaluation operations
- **Cost Optimization**: Smart logging strategies

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google Sheets API documentation
3. Examine server logs for detailed error messages
4. Test with the provided test scripts
5. Verify evaluation mode settings 