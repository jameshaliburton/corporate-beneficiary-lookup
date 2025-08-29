# Phase 1 Regression Test Report

**Generated:** 2025-08-29T19:42:33.576Z
**Environment:** undefined

## 📊 Test Summary

| Metric | Value |
|--------|-------|
| Total Tests | 5 |
| ✅ Passed | 4 |
| ❌ Failed | 1 |
| ⏭️ Skipped | 0 |
| ⏱️ Duration | 38254.04ms |

## 🔧 Feature Flags

| Flag | Value |
|------|-------|
| ENABLE_GEMINI_OWNERSHIP_AGENT | ✅ true |
| ENABLE_DISAMBIGUATION_AGENT | ✅ true |

## 🧪 Test Results

### ✅ A. Brand with Known Single Owner (Therabreath)

**Status:** PASS
**Duration:** 6783.98ms
**Cache State:** HIT
**Agents Triggered:** llm_first_analysis

**Result Details:**
```json
{
  "success": true,
  "beneficiary": "Church & Dwight Co., Inc.",
  "confidence": 95,
  "hasGeminiAnalysis": false,
  "hasLLMAnalysis": true
}
```

### ✅ B. Ambiguous Brand (Jordan - No Product)

**Status:** PASS
**Duration:** 6355.23ms
**Cache State:** HIT
**Agents Triggered:** web_research, query_builder, gemini_analysis, ownership_analysis

**Result Details:**
```json
{
  "success": true,
  "disambiguationTriggered": true,
  "optionsCount": 2,
  "options": [
    {
      "name": "Jordan (Nike)",
      "company": "Nike, Inc."
    },
    {
      "name": "Jordan (Colgate)",
      "company": "Colgate-Palmolive Company"
    }
  ]
}
```

### ✅ C. Brand with Misspelled Input (Nescafe → Nescafé)

**Status:** PASS
**Duration:** 6592.55ms
**Cache State:** HIT
**Agents Triggered:** llm_first_analysis

**Result Details:**
```json
{
  "success": true,
  "beneficiary": "Nestlé S.A.",
  "confidence": 100,
  "brand": "nescafe"
}
```

### ❌ D. Cache Hit vs Miss Performance

**Status:** FAIL
**Duration:** 12272.65ms
**Cache State:** HIT → HIT
**Agents Triggered:** llm_first_analysis

**Error:** Failed: First Request Cache Miss

**Result Details:**
```json
{
  "firstRequest": {
    "duration": 6241.063208,
    "cacheState": "HIT",
    "beneficiary": "Apple Inc."
  },
  "secondRequest": {
    "duration": 5682.388625,
    "cacheState": "HIT",
    "beneficiary": "Apple Inc."
  },
  "performanceImprovement": "9.0%"
}
```

### ✅ E. Feature Flag Enforcement

**Status:** PASS
**Duration:** 6247.99ms
**Cache State:** HIT
**Agents Triggered:** web_research, query_builder, gemini_analysis, ownership_analysis

**Result Details:**
```json
{
  "success": true,
  "geminiEnabled": true,
  "geminiTriggered": true,
  "disambiguationEnabled": true,
  "disambiguationTriggered": true,
  "flagCompliance": {
    "gemini": true,
    "disambiguation": true
  }
}
```

