# FULL PIPELINE E2E VERIFICATION REPORT

**Date**: 2025-08-29T09:26:45.822Z  
**Status**: ❌ TESTS FAILED

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | 20 |
| **Passed** | 18 |
| **Failed** | 2 |
| **Success Rate** | 90.0% |
| **Average Response Time** | 17920ms |

## 🧪 Test Results

| Brand | Product | Status | HTTP | Time(ms) | Ownership | Narrative | Confidence | Disambiguation | Cache | Supabase | Schema |
|-------|---------|--------|------|----------|-----------|-----------|------------|----------------|-------|----------|--------|
| Lipton | Lipton Ice Tea | ✅ | 200 | 17555 | ✅ | ✅ | 95% | No | Miss | Success | Pass |
| ikea | Billy Bookcase | ✅ | 200 | 16011 | ✅ | ✅ | 95% | No | Miss | Success | Pass |
| Nestlé™ | Nescafé | ✅ | 200 | 18455 | ✅ | ✅ | 100% | No | Miss | Success | Pass |
| PePsI | Pepsi Max | ✅ | 200 | 16806 | ✅ | ✅ | 100% | No | Miss | Success | Pass |
| Starbux | Coffee Beans | ✅ | 200 | 29841 | ✅ | ✅ | 90% | No | Miss | Success | Pass |
| Moose Milk | Local Cream Liqueur | ✅ | 200 | 30387 | ✅ | ✅ | 90% | No | Miss | Success | Pass |
| 百事可乐 | Pepsi China | ✅ | 200 | 19515 | ✅ | ✅ | 95% | No | Miss | Success | Pass |
| 🤯🥩🚀 | Chaos Product | ❌ | 200 | 1191 | ❌ | ❌ | N/A | No | Miss | Skipped | Pass |
| NO_BRAND | No Brand | ❌ | 200 | 1265 | ❌ | ❌ | N/A | No | Miss | Skipped | Pass |
| Samsung | Galaxy Buds | ✅ | 200 | 17014 | ✅ | ✅ | 95% | No | Miss | Success | Pass |
| LG | OLED TV | ✅ | 200 | 17308 | ✅ | ✅ | 95% | No | Miss | Success | Pass |
| Danone | Activia Yogurt | ✅ | 200 | 16530 | ✅ | ✅ | 100% | No | Miss | Success | Pass |
| Unilever | Dove Soap | ✅ | 200 | 18160 | ✅ | ✅ | 100% | No | Miss | Success | Pass |
| Nike | Jordan Shoes | ✅ | 200 | 16652 | ✅ | ✅ | 100% | No | Miss | Success | Pass |
| Jordan | Toothpaste | ✅ | 200 | 15432 | ✅ | ✅ | 95% | No | Miss | Success | Pass |
| Tide | Laundry Detergent | ✅ | 200 | 15020 | ✅ | ✅ | 100% | No | Miss | Success | Pass |
| Equate | Walmart Vitamins | ✅ | 200 | 17200 | ✅ | ✅ | 100% | No | Miss | Success | Pass |
| Keurig | Coffee Pods | ✅ | 200 | 15817 | ✅ | ✅ | 95% | No | Miss | Success | Pass |
| Dr. Oetker | Frozen Pizza | ✅ | 200 | 17810 | ✅ | ✅ | 95% | No | Miss | Success | Pass |
| GreenMetrica | Carbon Report | ✅ | 200 | 40428 | ✅ | ✅ | 90% | No | Miss | Success | Pass |

## 🤖 Agent Coverage Analysis

| Agent | Triggered | Expected Brands |
|-------|-----------|-----------------|
| RAG / cache lookup | ❌ | Lipton, ikea |
| DisambiguationAgent | ❌ | Samsung, Jordan, Nestlé™ |
| EnhancedAgentOwnershipResearch | ❌ | Lipton, Dr. Oetker, Danone |
| GeminiOwnershipResearchAgent | ❌ | Moose Milk, Equate |
| WebSearchOwnershipAgent | ❌ | 🤯🥩🚀, 百事可乐,  |
| ConfidenceScoringAgent | ❌ | All applicable cases |
| NarrativeGenerator | ❌ | All valid completions |
| Supabase cache write | ❌ | All uncached cases |

## 💾 Cache Statistics

| Behavior | Count | Percentage |
|----------|-------|------------|
| Hits | 0 | 0.0% |
| Misses | 20 | 100.0% |
| Writes | 0 | 0.0% |
| Errors | 0 | 0.0% |

## 🗄️ Supabase Statistics

| Status | Count | Percentage |
|--------|-------|------------|
| Success | 18 | 90.0% |
| Failure | 0 | 0.0% |
| Skipped | 2 | 10.0% |
| Error | 0 | 0.0% |

## 🔍 Detailed Test Results

### Test 1: Lipton | Lipton Ice Tea

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 17555ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 95%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 2: ikea | Billy Bookcase

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 16011ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 95%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 3: Nestlé™ | Nescafé

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 18455ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 100%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 4: PePsI | Pepsi Max

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 16806ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 100%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 5: Starbux | Coffee Beans

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 29841ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 90%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, query_builder, llm_first_analysis, web_research, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 6: Moose Milk | Local Cream Liqueur

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 30387ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 90%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, query_builder, llm_first_analysis, web_research, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 7: 百事可乐 | Pepsi China

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 19515ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 95%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 8: 🤯🥩🚀 | Chaos Product

- **Status**: ❌ FAIL
- **HTTP Status**: 200
- **Response Time**: 1191ms
- **Ownership Chain**: ❌ Missing
- **Narrative**: ❌ Missing
- **Confidence Score**: N/A
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: None
- **Cache Behavior**: Miss
- **Supabase Write**: Skipped
- **Schema Validation**: Pass


### Test 9: NO_BRAND | No Brand

- **Status**: ❌ FAIL
- **HTTP Status**: 200
- **Response Time**: 1265ms
- **Ownership Chain**: ❌ Missing
- **Narrative**: ❌ Missing
- **Confidence Score**: N/A
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: None
- **Cache Behavior**: Miss
- **Supabase Write**: Skipped
- **Schema Validation**: Pass


### Test 10: Samsung | Galaxy Buds

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 17014ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 95%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 11: LG | OLED TV

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 17308ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 95%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 12: Danone | Activia Yogurt

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 16530ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 100%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 13: Unilever | Dove Soap

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 18160ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 100%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 14: Nike | Jordan Shoes

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 16652ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 100%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 15: Jordan | Toothpaste

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 15432ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 95%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 16: Tide | Laundry Detergent

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 15020ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 100%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 17: Equate | Walmart Vitamins

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 17200ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 100%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 18: Keurig | Coffee Pods

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 15817ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 95%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 19: Dr. Oetker | Frozen Pizza

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 17810ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 95%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


### Test 20: GreenMetrica | Carbon Report

- **Status**: ✅ PASS
- **HTTP Status**: 200
- **Response Time**: 40428ms
- **Ownership Chain**: ✅ Present
- **Narrative**: ✅ Generated
- **Confidence Score**: 90%
- **Disambiguation**: ❌ Not triggered
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, query_builder, llm_first_analysis, web_research, database_save
- **Cache Behavior**: Miss
- **Supabase Write**: Success
- **Schema Validation**: Pass


## 🧹 Possible Legacy Files

Based on codebase analysis, the following files contain legacy or potentially unused components:

### Legacy Components & Interfaces
- **`src/types/trace.ts`**: Contains `TraceStage` interface marked as "Legacy trace stage interface (for backward compatibility)"
- **`src/components/eval-v4/EvalV4TraceModal.tsx`**: Contains `LegacyTraceView` component for backward compatibility
- **`src/lib/config/feature-flags.js`**: Contains `shouldUseLegacyBarcode()` function for legacy barcode lookup
- **`src/app/api/lookup/route.ts`**: Contains "LEGACY BARCODE PIPELINE" section with TODO to clean up

### Backup Files
- **`src/app/page.tsx.backup`**: Backup file that should be removed if no longer needed

### Evaluation Components (Potentially Unused)
- **`src/components/EvaluationDashboard.tsx`**: Evaluation dashboard component
- **`src/components/EvaluationDashboardV3.tsx`**: V3 evaluation dashboard
- **`src/components/eval-v4/EvalV4Dashboard.tsx`**: V4 evaluation dashboard
- **`src/components/eval-v4/EvalV4StructuredTrace.tsx`**: Structured trace component
- **`src/app/api/evaluation/v3/results/route.ts`**: Evaluation API endpoint

### Alternative Page Routes (Potentially Unused)
- **`src/app/lovable-all/page.tsx`**: Alternative Lovable page
- **`src/app/lovable-camera/page.tsx`**: Camera-specific Lovable page

### Legacy Transformation Functions
- **`src/app/api/evaluation/v3/results/route.ts`**: Contains `transformLegacyTraceToStructured()` function

### Recommendations for Legacy File Cleanup
1. **Remove backup files**: Delete `src/app/page.tsx.backup` if no longer needed
2. **Consolidate evaluation components**: Multiple evaluation dashboard versions exist
3. **Clean up legacy barcode pipeline**: Remove when vision-first pipeline is stable
4. **Remove unused page routes**: Clean up alternative Lovable pages if not used
5. **Deprecate legacy trace interfaces**: Plan migration from `TraceStage` to `StructuredTraceStage`

## 📋 Next Steps

1. **Review Failed Tests**: Investigate any tests that failed validation
2. **Agent Coverage**: Ensure all expected agents are being triggered
3. **Performance**: Optimize response times for slow requests
4. **Cache Strategy**: Review cache hit/miss ratios
5. **Database Writes**: Address any Supabase write failures
6. **Legacy Cleanup**: Remove or consolidate identified legacy files
7. **Code Maintenance**: Update legacy interfaces and remove deprecated components

---

*Report generated by FULL PIPELINE E2E VERIFICATION TEST RUNNER*
