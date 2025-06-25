# 🔧 OwnedBy Prompt + Eval Optimization Workflow

## 🎯 Project Overview

We're entering the **prompt iteration + evaluation refinement** phase of development. The goal is to make the entire AI agent workflow **transparent, tunable, and evaluable**. These updates will ensure fast iteration, higher research reliability, and readiness for scaling.

### Core Objectives

1. **Enable live iteration and versioning of agent prompts and instructions**
2. **Improve the traceability of agent behavior (prompt → step → result)**
3. **Log all AI responses and decisions with metadata**
4. **Make evaluations easy to run, review, and interpret via dashboard and Google Sheets**
5. **Give the team a tight feedback loop for prompt tuning and agentic design improvements**

---

## ✅ Required System Improvements

### 1. **Prompt/Instruction Versioning & Editing**

#### File Structure
Create a `/prompts` or `/instructions` folder in the repo:
```
/prompts/
├── ownership_agent.md
├── query_builder.md
├── web_research_agent.md
├── verification_agent.md
└── knowledge_agent.md
```

#### Prompt Metadata Format
Each prompt should include metadata at the top (YAML-style):

```yaml
---
prompt_id: ownership_agent_v1
description: Main prompt for ownership research agent
created: 2025-06-25
last_updated: 2025-06-25
version: 1.0
author: team
tags: [ownership, research, llm]
---

# Ownership Research Agent

You are an expert corporate ownership researcher...
```

#### Implementation
- Load prompts dynamically in each agent file (using file read or Supabase pull)
- Add the `prompt_id` or a `prompt_hash` to all logs and eval results
- Support for hot-reloading prompts during development

### 2. **Agent Execution Tracing**

#### Trace Structure
Each agent should return a full trace of its behavior:

```json
{
  "execution_trace": {
    "trace_id": "trace_1750845646259_abc123",
    "prompt_id": "ownership_agent_v1",
    "start_time": "2025-06-25T10:00:46.259Z",
    "steps": [
      {
        "step_id": "step_1",
        "agent": "query_builder",
        "prompt_id": "query_builder_v2",
        "tokens_used": 308,
        "duration_ms": 432,
        "output_summary": "3 search queries targeting company ownership",
        "raw_output": "...",
        "status": "success",
        "error": null,
        "metadata": {
          "queries_generated": 3,
          "confidence": 0.85
        }
      },
      {
        "step_id": "step_2",
        "agent": "web_research",
        "prompt_id": "web_research_v1",
        "sources_used": ["openCorporates", "Google"],
        "duration_ms": 10243,
        "output_summary": "Found 2 candidate owners",
        "status": "success",
        "error": null,
        "metadata": {
          "sources_count": 2,
          "api_calls": 5
        }
      }
    ],
    "total_duration_ms": 10675,
    "final_status": "success",
    "final_result": {
      "financial_beneficiary": "Unilever",
      "confidence_score": 85,
      "reasoning": "..."
    }
  }
}
```

#### Integration Points
- Return as part of every lookup
- Store in Supabase `agent_execution_traces` table
- Include in evaluation results
- Display in frontend trace viewer

### 3. **Google Sheets Integration for Evals**

#### Sheet Structure
We use **four sheets** in a single Google Sheets workbook:

| Sheet Name         | Purpose | Key Fields |
|--------------------|---------|------------|
| `eval_cases`       | Source-of-truth test cases | barcode, product, expected_owner, case_id |
| `eval_results`     | Logs of each agent run | trace_id, prompt_id, confidence, result_type, result |
| `human_ratings`    | Manual human feedback | case_id, rating (✅/❌/🟡), notes, reviewer |
| `ownership_mappings` | Known verified brand → owner chains | brand, parent_company, country, verified_date |

#### Evaluation Workflow
1. **Read test cases** from `eval_cases`
2. **Run agent pipeline** with specified prompt version
3. **Write results** to `eval_results` with full trace
4. **Enable filtering** by `prompt_id`, barcode, or result_type
5. **Support manual review** via `human_ratings` sheet

### 4. **Frontend Improvements (Next.js)**

#### 📍 Evaluation Dashboard (`/evaluation`)
```typescript
interface EvaluationCase {
  case_id: string;
  barcode: string;
  product: string;
  expected_owner: string;
  actual_result?: {
    owner: string;
    confidence: number;
    result_type: 'cached' | 'static_mapping' | 'ai_research';
    trace_id: string;
  };
  human_rating?: 'pass' | 'fail' | 'unsure';
  notes?: string;
}
```

**Features:**
- Table/card view of evaluation cases
- Visual trace summary (step names + duration)
- Buttons for manual pass/fail rating
- Filter by prompt version, result type, confidence
- Export results to CSV/Google Sheets

#### ✍️ Prompt Editor UI (Optional)
```typescript
interface PromptEditor {
  prompt_id: string;
  content: string;
  metadata: PromptMetadata;
  preview: string;
  save: () => Promise<void>;
  reload: () => Promise<void>;
  test: (case_id: string) => Promise<EvaluationResult>;
}
```

**Features:**
- Editable UI for all loaded prompt files
- Live markdown preview
- Save and reload buttons
- Trigger rerun of selected eval cases
- Version history and diff view

---

## 📈 Logging Requirements

### Database Schema
```sql
-- Agent execution traces
CREATE TABLE agent_execution_traces (
  trace_id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  tokens_used INTEGER,
  duration_ms INTEGER,
  confidence_score FLOAT,
  sources_used JSONB,
  ownership_flow JSONB,
  execution_trace JSONB,
  status TEXT,
  error TEXT
);

-- Evaluation results
CREATE TABLE evaluation_results (
  id SERIAL PRIMARY KEY,
  case_id TEXT NOT NULL,
  trace_id TEXT REFERENCES agent_execution_traces(trace_id),
  prompt_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  actual_result JSONB,
  human_rating TEXT,
  notes TEXT
);
```

### Logging Fields
Each record should include:
- `prompt_id` - Version of prompt used
- `agent_name` - Which agent executed
- `timestamp` - When execution occurred
- `tokens_used` - Token consumption
- `duration_ms` - Execution time
- `confidence_score` - Agent confidence (0-100)
- `sources_used` - URLs or APIs accessed
- `ownership_flow` - Ownership chain if found
- `execution_trace` - Full step-by-step trace

---

## 🧪 Development Tools & Scripts

### 1. **Batch Evaluation Runner**
```typescript
// scripts/run-evals.ts
interface EvalRunner {
  runAllCases(prompt_id: string): Promise<EvalResult[]>;
  runSingleCase(case_id: string, prompt_id: string): Promise<EvalResult>;
  comparePrompts(prompt_ids: string[], case_ids: string[]): Promise<ComparisonResult>;
}
```

**Usage:**
```bash
# Run all cases with specific prompt
npm run eval:run -- --prompt ownership_agent_v2

# Run single case
npm run eval:run -- --case case_123 --prompt ownership_agent_v2

# Compare two prompt versions
npm run eval:compare -- --prompts ownership_agent_v1,ownership_agent_v2
```

### 2. **Result Logger**
```typescript
// scripts/log-eval-result.ts
interface ResultLogger {
  logToSheets(result: EvalResult): Promise<void>;
  logToSupabase(result: EvalResult): Promise<void>;
  logToFile(result: EvalResult, format: 'json' | 'csv'): Promise<void>;
}
```

### 3. **Prompt Management**
```typescript
// scripts/prompt-manager.ts
interface PromptManager {
  loadPrompt(prompt_id: string): Promise<Prompt>;
  savePrompt(prompt: Prompt): Promise<void>;
  listPrompts(): Promise<PromptMetadata[]>;
  validatePrompt(prompt: Prompt): Promise<ValidationResult>;
}
```

---

## 🧠 Prompt Design Guidelines

### Best Practices
1. **Readability First** - Prompts should be human-readable and well-structured
2. **Explicit JSON Structure** - Require specific output formats
3. **Anti-hallucination Techniques** - Include "don't guess unless..." instructions
4. **Structured Formatting** - Use clear sections for sources, reasoning, steps
5. **Version Control** - Track changes and improvements over time

### Example Prompt Structure
```markdown
# Ownership Research Agent v1.0

## Role
You are an expert corporate ownership researcher...

## Instructions
1. Analyze the provided brand and product information
2. Search for ownership information using available sources
3. Structure your response as follows:

## Output Format
```json
{
  "financial_beneficiary": "string or 'Unknown'",
  "beneficiary_country": "string or 'Unknown'",
  "confidence_score": 0-100,
  "reasoning": "detailed explanation",
  "sources": ["url1", "url2"],
  "ownership_flow": [
    {"name": "Brand", "type": "brand"},
    {"name": "Parent", "type": "parent"}
  ]
}
```

## Anti-Hallucination Rules
- Only claim ownership if you have clear evidence
- If uncertain, return "Unknown" with reasoning
- Cite specific sources for all claims
```

---

## 🌐 External Systems Integration

### Current Systems
- **Supabase DB** - Primary data storage
- **Google Sheets** - Evaluation and human review
- **Google Custom Search API** - Web research
- **OpenCorporates API** - Corporate data
- **Anthropic Claude 3 (Haiku)** - LLM processing

### Integration Points
```typescript
// lib/integrations/
├── google-sheets.ts    // Eval case management
├── supabase.ts         // Trace and result storage
├── opencorporates.ts   // Corporate data lookup
├── google-search.ts    // Web research
└── anthropic.ts        // LLM processing
```

---

## 🎬 Implementation Roadmap

### Phase 0: Environment Stabilization (NEW)

### 0.1 Current State Assessment
- **Audit existing agents**: Document current prompt versions and performance
- **Trace structure analysis**: Map existing execution traces and data flows
- **Database schema review**: Understand current evaluation metrics storage
- **Frontend evaluation dashboard**: Assess current UI capabilities

### 0.2 Environment Cleanup
- **Dependency resolution**: Fix corrupted node_modules and build issues
- **Cache management**: Implement proper .next cache handling
- **Build optimization**: Streamline development and production builds
- **Error handling**: Implement graceful fallbacks for common failures

### 0.3 Baseline Establishment
- **Performance benchmarks**: Establish current agent performance metrics
- **Test dataset**: Create standardized test cases for evaluation
- **Monitoring setup**: Implement basic logging and error tracking
- **Rollback procedures**: Document safe rollback mechanisms

### Phase 1: Incremental Prompt Versioning

### 1.1 Version Control Strategy
- **Prompt registry**: Maintain versioned prompts in `src/lib/agents/prompts/`
- **Change tracking**: Document prompt modifications with reasoning
- **A/B testing framework**: Enable side-by-side prompt comparison
- **Rollback capability**: Quick reversion to previous prompt versions

### 1.2 Current Agent Enhancement
- **Ownership Research Agent**: Incremental improvements to existing prompts
- **Query Builder Agent**: Optimize search query generation
- **Verification Agent**: Enhance confidence scoring and validation
- **Knowledge Agent**: Improve context and reasoning capabilities

### 1.3 Trace Structure Leverage
- **Existing trace enhancement**: Build upon current `agent_execution_trace` structure
- **Step-level logging**: Add detailed reasoning at each agent step
- **Confidence tracking**: Implement confidence scores throughout pipeline
- **Error categorization**: Classify and track different failure modes

### Phase 2: Phased Google Sheets Integration

### 2.1 Read-Only Phase (Phase 2a)
- **Data export**: Export evaluation results to Google Sheets
- **Manual analysis**: Enable human review of agent performance
- **Pattern identification**: Identify common failure patterns
- **Metrics dashboard**: Visualize performance trends

### 2.2 Interactive Phase (Phase 2b)
- **Manual corrections**: Allow human experts to correct agent results
- **Training data generation**: Create training datasets from corrections
- **Feedback loops**: Implement feedback collection mechanisms
- **Quality scoring**: Develop human-based quality metrics

### 2.3 Automated Phase (Phase 2c)
- **Real-time sync**: Live synchronization with evaluation data
- **Automated analysis**: Script-based performance analysis
- **Alert system**: Notify on performance degradation
- **Continuous improvement**: Automated prompt optimization suggestions

### Phase 3: Enhanced Evaluation Framework

### 3.1 Frontend Dashboard Enhancement
- **Real-time metrics**: Live performance monitoring
- **Prompt comparison**: Side-by-side prompt performance analysis
- **Error analysis**: Detailed error categorization and visualization
- **User feedback**: In-app feedback collection mechanisms

### 3.2 Database Schema Optimization
- **Evaluation metrics table**: Structured storage for performance data
- **Prompt versioning**: Track prompt changes and their impact
- **User contributions**: Store manual corrections and feedback
- **Performance history**: Maintain historical performance data

### 3.3 Logging and Monitoring
- **Structured logging**: Consistent log format across all agents
- **Performance tracking**: Detailed timing and resource usage
- **Error categorization**: Systematic error classification
- **Alert thresholds**: Performance degradation alerts

### Phase 4: Advanced Optimization

### 4.1 Machine Learning Integration
- **Performance prediction**: Predict success probability for queries
- **Resource optimization**: Optimize agent execution order
- **Confidence calibration**: Improve confidence score accuracy
- **Failure prediction**: Identify likely failure scenarios

### 4.2 External System Integration
- **Corporate databases**: Integrate with business registries
- **News APIs**: Real-time ownership change detection
- **Financial data**: Market-based ownership validation
- **Legal databases**: Regulatory compliance checking

### 4.3 Continuous Improvement
- **Automated testing**: Continuous evaluation of prompt changes
- **Performance regression**: Detect performance degradation
- **A/B testing**: Systematic prompt comparison
- **Feedback integration**: Automated incorporation of user feedback

## Implementation Roadmap

### Week 1-2: Environment Stabilization
- [ ] Fix build and dependency issues
- [ ] Implement proper error handling
- [ ] Establish baseline performance metrics
- [ ] Create rollback procedures

### Week 3-4: Incremental Prompt Versioning
- [ ] Set up prompt version control
- [ ] Enhance existing agent traces
- [ ] Implement A/B testing framework
- [ ] Create prompt comparison tools

### Week 5-6: Google Sheets Integration (Phase 2a)
- [ ] Set up Google Sheets API
- [ ] Implement data export functionality
- [ ] Create manual analysis workflows
- [ ] Develop metrics visualization

### Week 7-8: Enhanced Evaluation Framework
- [ ] Upgrade frontend dashboard
- [ ] Optimize database schema
- [ ] Implement structured logging
- [ ] Create performance monitoring

### Week 9-10: Advanced Features
- [ ] Implement ML-based optimization
- [ ] Add external system integrations
- [ ] Create automated testing
- [ ] Develop continuous improvement loops

## Safety and Rollback Strategies

### 4.1 Prompt Versioning Safety
- **Version tagging**: Clear version identification
- **Performance gates**: Minimum performance thresholds
- **Gradual rollout**: Incremental deployment of changes
- **Quick rollback**: Immediate reversion capability

### 4.2 Data Integrity
- **Backup procedures**: Regular data backups
- **Validation checks**: Data quality verification
- **Audit trails**: Complete change tracking
- **Recovery procedures**: Data restoration processes

### 4.3 System Stability
- **Circuit breakers**: Automatic failure detection
- **Resource limits**: Prevent system overload
- **Graceful degradation**: Maintain functionality during issues
- **Health checks**: Continuous system monitoring

## Success Metrics

### 4.1 Performance Metrics
- **Accuracy improvement**: Measurable accuracy gains
- **Confidence calibration**: Better confidence score accuracy
- **Processing speed**: Reduced execution time
- **Resource efficiency**: Lower computational costs

### 4.2 User Experience Metrics
- **User satisfaction**: Feedback scores
- **Error reduction**: Fewer user-facing errors
- **Response time**: Faster result delivery
- **Feature adoption**: Usage of new capabilities

### 4.3 System Health Metrics
- **Uptime**: System availability
- **Error rates**: Reduced system failures
- **Performance stability**: Consistent performance
- **Scalability**: System growth capacity

## Conclusion

This phased approach ensures:
- **Stable foundation**: Environment issues resolved first
- **Incremental improvement**: Gradual, safe enhancements
- **Measurable progress**: Clear success metrics
- **Risk mitigation**: Comprehensive safety measures
- **Sustainable growth**: Long-term optimization strategy

The plan prioritizes stability and incremental improvement over rapid changes, ensuring the system remains reliable while continuously improving performance and user experience.

---

## 🔧 Development Commands

```bash
# Run evaluations
npm run eval:run -- --prompt ownership_agent_v2
npm run eval:run -- --case case_123 --prompt ownership_agent_v2

# Compare prompts
npm run eval:compare -- --prompts v1,v2 --cases case_123,case_456

# Manage prompts
npm run prompt:list
npm run prompt:edit ownership_agent_v2
npm run prompt:validate ownership_agent_v2

# View results
npm run eval:view -- --prompt ownership_agent_v2
npm run eval:export -- --format csv --prompt ownership_agent_v2
```

---

## 📚 Additional Resources

- [Agent Execution Tracing Best Practices](./docs/agent-tracing.md)
- [Prompt Engineering Guidelines](./docs/prompt-engineering.md)
- [Evaluation Framework Documentation](./docs/evaluation-framework.md)
- [Google Sheets Integration Guide](./docs/sheets-integration.md)

---

*This document should be updated as the system evolves and new requirements emerge.* 