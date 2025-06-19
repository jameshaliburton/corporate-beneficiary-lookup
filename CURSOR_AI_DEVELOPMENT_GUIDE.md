# Agentic Research Platform - Cursor AI Development Guide

## 🧠 Project Scope: Reusable Agentic Architecture

This project is no longer just a barcode-specific app. We're building a **modular agentic platform** for structured research tasks that:
- Automates investigation workflows using multiple agents (Knowledge, Verification, Document Reader, Synthesis)
- Allows **manual EVALs** via Google Sheets
- Can be **repurposed across apps** (e.g. corporate lookups, product scans, public disclosures, sustainability research)

This file is kept as `CURSOR_AI_DEVELOPMENT_GUIDE.md` to maintain compatibility and discoverability within Cursor.

---

## ✅ Validated Working Stack

### Cursor AI and Manual Integration Patterns:
- **Supabase DB**: Full CRUD implemented and stable
- **Knowledge Agent**: Working (LLM-only, ~95% accuracy on known brands)
- **Research Pipeline**: Working for real barcode lookups
- **Confidence Scoring**: Integrated into Supabase + UI
- **Research Result UI**: User-tested, currently missing some Supabase data display (to fix)

---

## 🧩 Modular Agent Architecture (Reusable)

### Agents Implemented or Planned:
| Agent | Status | Role |
|-------|--------|------|
| `knowledge-agent.js` | ✅ | LLM-based ownership reasoning |
| `verification-agent.js` | 🚧 | Confirms or contradicts LLM claims via web research |
| `document-reader-agent.js` | 🚧 | Parses filings, PDF reports, websites |
| `synthesis-agent.js` | 🚧 | Combines agent results, scores confidence |
| `eval-sheet-agent.js` | ⏳ | Syncs/reads evals from Google Sheets |

### Common Agent I/O Interface:
```ts
interface ResearchResult {
  product_name: string;
  brand: string;
  financial_beneficiary: string;
  beneficiary_country: string;
  confidence_score: number;
  ownership_structure_type: 'direct' | 'subsidiary' | 'licensing' | 'franchise';
  result_type: 'cached' | 'ai' | 'verified' | 'manual';
}
```

---

## 🔄 Platform Workflow (Pipeline)

```
User → /api/lookup → DB Cache → [Missing → AI Agents → DB Upsert → UI Render]
                            ↘ Manual Eval Sheet Sync (optional)
```

This entire workflow is meant to be **replicable**. You can substitute the input type (e.g., not barcode but URL, company name, SKU, etc.), and reuse the agents.

---

## 🧪 Manual Eval Integration Strategy

### Goal:
Let users or analysts **edit/improve** agentic results in Google Sheets:
- Add structured edits (correct confidence, beneficiary, structure)
- Add notes and override values
- Add “verified” or “contradicted” evidence markers

### Planned Google Sheets Format:

| Barcode | Product Name | Brand | Final Beneficiary | Country | Confidence | Notes | Source Links |
|---------|--------------|-------|-------------------|---------|------------|-------|--------------|

Agents will have optional Sheet read/write integrations (bidirectional sync planned).

---

## 📦 Working DB Schema

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  barcode VARCHAR(20) UNIQUE NOT NULL,
  product_name TEXT,
  brand VARCHAR(200),
  financial_beneficiary VARCHAR(200) NOT NULL,
  beneficiary_country VARCHAR(100) NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ownership_structure_type VARCHAR(50),
  result_type VARCHAR(20), -- 'cached', 'ai', 'manual', 'verified'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scan_logs (
  id SERIAL PRIMARY KEY,
  barcode VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  result_type VARCHAR(20)
);

ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs DISABLE ROW LEVEL SECURITY;
```

---

## 📊 Confidence Display Framework

| Score | Label          | Description                         |
|-------|----------------|-------------------------------------|
| 100   | Confirmed      | Multiple official sources           |
| 80–99 | Highly Likely  | Verified by research                |
| 60–79 | Likely         | LLM + weak evidence                 |
| 20–59 | Unconfirmed    | Little or no confirmation           |
| < 20  | Unknown        | No data, hallucination possible     |

---

## 🧠 Critical Discovery: Hidden Parent Problem

Most users won't search for ownership hierarchy.  
Agents must **always assume complex ownership** until proven simple.

---

## 💡 Cursor Prompting Structure

### Use this pattern when creating new features with Cursor:
```
CONTEXT: [Describe current agentic framework and goals]
REQUIREMENTS: [Describe new agent task in detail]
PATTERN: [Reference to existing agents e.g. knowledge-agent.js]
TEST CASES: [Input barcodes or scenarios]
ERROR AVOIDANCE: [Avoid .ts imports, node-fetch, vague sources]
```

---

## 🧭 Current Limitations / Next Steps

### UI Display Gaps:
- Not all fields from Supabase shown (e.g. confidence, structure type)
- Styling broken when research fails — needs fallback formatting

### Agent Logic Gaps:
- Document parsing not implemented yet
- Verification agent incomplete
- No EVAL pipeline or history tracking yet

### Architectural Risks:
- Currently structured as a single-use app
- Plan: extract reusable `agents/` layer and EVAL manager
- Research agent isn’t yet parallelized or segmented across tiers

---

## 🎯 Action Priorities

1. [ ] Fix UI to reflect all DB values and format on failure  
2. [ ] Finalize Verification Agent using proven patterns  
3. [ ] Add Sheet-based EVAL logic (manual correction + notes)  
4. [ ] Modularize agent interface → prep for other projects  
5. [ ] Add Document Reader Agent for structured PDF/HTML parsing  
6. [ ] Sync pipeline metadata into DB (timing, source URLs, hallucination flags)

---

## 🧪 Validated Test Cases

```ts
{
  barcode: "4902201746640", // Kit Kat Matcha (Japan)
  expected_beneficiary: "Nestlé S.A.",
  expected_country: "Switzerland",
  confidence: 80,
  complexity: "subsidiary"
}
```

---

**Bottom Line:**  
You’re now building both a functioning app **and** a scalable research platform.  
This guide supports both tracks and should be updated as the platform matures.