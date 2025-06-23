# Corporate Beneficiary Research Agent Development Guide

## Overview
This project builds an AI-powered system to research and reveal the ultimate financial beneficiaries of consumer products. The goal is to improve corporate transparency using barcode scanning, web agents, and structured inference pipelines.

The architecture is designed to be *modular and reusable* so that this platform can support other agentic use cases in the future.

## Agentic Workflow Strategy

### Lookup Pipeline Stages
1. **Barcode/Product Cache** (`products` table in Supabase)
2. **Static Ownership Mapping** (`ownership_mappings` table)
3. **External APIs** (UPCitemdb, OpenFoodFacts)
4. **AI Research Agent** (`ownership-research-agent`)
5. **Manual User Entry** (optional prompt to improve result)

### Ownership Inference Logic
- Static table supports both:
  - **Exact barcode matches**
  - **Brand-based inferences**
- Hierarchies supported:
  - `brand` → `regional_entity` → `intermediate_entity` → `ultimate_owner`
- The `ownership_mappings` table includes:
  - Brand name
  - Regional brand entity (if any)
  - Intermediate corporate entity
  - Ultimate parent company
  - Country and flag

---

## Agents

### 1. `ownership-research-agent.ts`
- Main research agent (Claude 3 Haiku)
- Performs deep ownership inference via:
  - Web search + content scraping
  - API lookups (OpenCorporates)
  - Source reasoning and credibility scoring
- Returns structured output with:
  - Financial beneficiary, country, structure type, sources, confidence, reasoning
- Includes anti-hallucination constraints
- JSON format is validated

### 2. `web-research-agent.ts`
- Uses Google Custom Search API
- Scrapes official sources (company websites, registries)
- Optional: integrates with OpenCorporates API
- Provides source quality scores and raw snippets

### 3. `query-builder-agent.ts` (New)
- Builds high-quality search queries before any scraping or research
- Infers company type and best query strategy based on:
  - Brand, product name, barcode, country
- Differentiates between:
  - Public, private, state-owned, cooperative, franchise
- Output includes:
  - `recommended_queries`
  - `company_type`
  - `country_guess`
  - `flags`
  - `reasoning`
- Enables intelligent routing of research workflows

---

## Evaluation Strategy

### Eval Framework Goals
- Use **Google Sheets** as the interface for defining test cases and logging results.
- Help humans refine agent prompting, catch hallucinations, and improve pipeline logic.

### Google Sheets Integration
- `eval_tests` sheet:
  - `barcode`, `product_name`, `expected_owner`, `expected_country`, `expected_structure_type`, `notes`
- `eval_results` sheet:
  - Automatically populated from evaluation runs
  - Includes raw response JSON, sources, agent trace, match quality

### Evaluation Dashboard
- Accessible at `/evaluation`
- Filters: match/failure, agent type, source credibility
- Admin controls: re-run test, override score
- Debug info:
  - Prompts, search queries, raw results, LLM response
- Tracing integrated across pipeline

---

## Data Model

### Supabase Tables
- `products`: Cached product lookups
- `ownership_mappings`: Manual/static mappings of brands → owners
- `scan_logs`: Tracks all user barcode queries and result types
- `eval_tests`: Imported from Google Sheets
- `eval_results`: Logs full trace and accuracy per test

---

## Prompting and Performance

### Prompting Strategy
- Queries are tightly scoped and differ by company type
- `query-builder-agent` is used to improve targeting before web search
- Prompts are continuously refined via Google Sheets feedback
- Hallucination control:
  - Force use of real sources
  - Source quality scoring
  - Confidence downgrades for unverified claims

### Performance Targets
- <10s for typical lookup
- >95% JSON parse success
- Source quality >70 on average
- Eval match rate >80%

---

## API Keys Required in `.env.local`
- `GOOGLE_API_KEY`
- `GOOGLE_CSE_ID`
- `OPENCORPORATES_API_KEY` (optional)
- `ANTHROPIC_API_KEY`

---

## Next Steps
- ✅ Agent pipeline working
- ✅ Static lookup functioning
- ✅ Google Sheets eval integration planned
- 🔜 Add `query-builder-agent.ts`
- 🔜 Add `eval_results` syncing to Google Sheets
- 🔜 Improve prompt tuning via failed test cases
- 🔜 Use result_type to trace and filter agent behavior

---

## Reusability
This platform is built to support other agentic apps. The current codebase and evaluation system are designed to be modular, scalable, and agent-first.

The Google Sheets eval structure and tracing logic can be reused for any research or automation agents built on this base.