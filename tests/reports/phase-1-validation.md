# Phase 1 Regression Test Report

**Generated:** 2025-08-29T19:19:06.523Z
**Environment:** undefined

## 📊 Test Summary

| Metric | Value |
|--------|-------|
| Total Tests | 5 |
| ✅ Passed | 4 |
| ❌ Failed | 1 |
| ⏭️ Skipped | 0 |
| ⏱️ Duration | 52277.11ms |

## 🔧 Feature Flags

| Flag | Value |
|------|-------|
| ENABLE_GEMINI_OWNERSHIP_AGENT | ✅ true |
| ENABLE_DISAMBIGUATION_AGENT | ✅ true |

## 🧪 Test Results

### ✅ A. Brand with Known Single Owner (Therabreath)

**Status:** PASS
**Duration:** 9375.81ms
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
**Duration:** 6706.86ms
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
**Duration:** 18251.90ms
**Cache State:** MISS
**Agents Triggered:** llm_first_analysis

**Result Details:**
```json
{
  "success": true,
  "beneficiary": "Nestlé S.A.",
  "confidence": 100,
  "brand": "Nescafe"
}
```

### ❌ D. Cache Hit vs Miss Performance

**Status:** FAIL
**Duration:** 12059.43ms
**Cache State:** HIT → HIT
**Agents Triggered:** llm_first_analysis

**Error:** Failed: First Request Cache Miss

**Result Details:**
```json
{
  "firstRequest": {
    "duration": 6237.037375,
    "cacheState": "HIT",
    "beneficiary": "Apple Inc."
  },
  "secondRequest": {
    "duration": 5411.086042000003,
    "cacheState": "HIT",
    "beneficiary": "Apple Inc."
  },
  "performanceImprovement": "13.2%"
}
```

### ✅ E. Feature Flag Enforcement

**Status:** PASS
**Duration:** 5881.59ms
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

