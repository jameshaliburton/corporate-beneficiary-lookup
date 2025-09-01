# TEST TRACE SUMMARY

**Date**: 2025-08-29T10:11:37.022Z  
**Analysis**: Agent execution summary per test case

## 📊 Test Execution Summary

| Test ID | Category | Status | Response Time | Confidence | Agents | Coverage |
|---------|----------|--------|---------------|------------|--------|----------|
| lipton-normal-1 | high_confidence_normal | ✅ | 16919ms | 95% | 6 | 100.0% |
| lipton-normal-2 | high_confidence_normal | ✅ | 17268ms | 95% | 6 | 100.0% |
| ikea-confident | high_confidence_normal | ✅ | 17999ms | 95% | 6 | 100.0% |
| equate-walmart | high_confidence_normal | ✅ | 15880ms | 100% | 6 | 100.0% |
| nestle-tm-disambiguation | high_confidence_normal | ✅ | 15080ms | 100% | 6 | 85.7% |
| samsung-multi-division | ambiguous_brand | ✅ | 15997ms | 95% | 6 | 85.7% |
| jordan-toothpaste-non-nike | ambiguous_brand | ✅ | 16675ms | 95% | 6 | 75.0% |
| jordan-shoes-nike-confusion | ambiguous_brand | ✅ | 16500ms | 100% | 6 | 75.0% |
| nike-lip-gloss-wrong-match | ambiguous_brand | ✅ | 29373ms | 97% | 8 | 100.0% |
| moose-milk-fallback | edge_case | ✅ | 29470ms | 85% | 8 | 100.0% |
| chaos-product-junk | edge_case | ❌ | 1773ms | N/A | 0 | 0.0% |
| no-brand-null | edge_case | ❌ | 952ms | N/A | 0 | 0.0% |
| zzzcorp-nonexistent | edge_case | ❌ | 1171ms | N/A | 0 | 0.0% |
| lipton-long-product | edge_case | ✅ | 19018ms | 95% | 6 | 100.0% |

## 🔍 Detailed Agent Execution

### lipton-normal-1: Lipton | Lipton Ice Tea

- **Status**: ✅ PASS
- **Response Time**: 16919ms
- **Confidence**: 95%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Missing Agents**: None
- **Unexpected Agents**: None
- **Agent Coverage**: 100.0%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

### lipton-normal-2: Lipton | Lipton Ice Tea

- **Status**: ✅ PASS
- **Response Time**: 17268ms
- **Confidence**: 95%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Expected Agents**: cache_check
- **Missing Agents**: None
- **Unexpected Agents**: sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Agent Coverage**: 100.0%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

### ikea-confident: IKEA | Billy Bookcase

- **Status**: ✅ PASS
- **Response Time**: 17999ms
- **Confidence**: 95%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Missing Agents**: None
- **Unexpected Agents**: None
- **Agent Coverage**: 100.0%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

### equate-walmart: Equate | Walmart Vitamins

- **Status**: ✅ PASS
- **Response Time**: 15880ms
- **Confidence**: 100%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Missing Agents**: None
- **Unexpected Agents**: None
- **Agent Coverage**: 100.0%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

### nestle-tm-disambiguation: Nestlé™ | Nescafé

- **Status**: ✅ PASS
- **Response Time**: 15080ms
- **Confidence**: 100%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, disambiguation, database_save
- **Missing Agents**: disambiguation
- **Unexpected Agents**: None
- **Agent Coverage**: 85.7%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

### samsung-multi-division: Samsung | Galaxy Buds

- **Status**: ✅ PASS
- **Response Time**: 15997ms
- **Confidence**: 95%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, disambiguation, database_save
- **Missing Agents**: disambiguation
- **Unexpected Agents**: None
- **Agent Coverage**: 85.7%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

### jordan-toothpaste-non-nike: Jordan | Toothpaste

- **Status**: ✅ PASS
- **Response Time**: 16675ms
- **Confidence**: 95%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, disambiguation, gemini_ownership_research, database_save
- **Missing Agents**: disambiguation, gemini_ownership_research
- **Unexpected Agents**: None
- **Agent Coverage**: 75.0%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

### jordan-shoes-nike-confusion: Jordan | Shoes

- **Status**: ✅ PASS
- **Response Time**: 16500ms
- **Confidence**: 100%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, disambiguation, gemini_ownership_research, database_save
- **Missing Agents**: disambiguation, gemini_ownership_research
- **Unexpected Agents**: None
- **Agent Coverage**: 75.0%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

### nike-lip-gloss-wrong-match: Nike | Lip Gloss

- **Status**: ✅ PASS
- **Response Time**: 29373ms
- **Confidence**: 97%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, query_builder, llm_first_analysis, web_research, database_save
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, web_research, database_save
- **Missing Agents**: None
- **Unexpected Agents**: query_builder
- **Agent Coverage**: 100.0%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

### moose-milk-fallback: Moose Milk | Local Cream Liqueur

- **Status**: ✅ PASS
- **Response Time**: 29470ms
- **Confidence**: 85%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, query_builder, llm_first_analysis, web_research, database_save
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, query_builder, llm_first_analysis, web_research, database_save
- **Missing Agents**: None
- **Unexpected Agents**: None
- **Agent Coverage**: 100.0%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

### chaos-product-junk: 🤯🥩🚀 | Chaos Product

- **Status**: ❌ FAIL
- **Response Time**: 1773ms
- **Confidence**: N/A
- **Agents Triggered**: None
- **Expected Agents**: None
- **Missing Agents**: None
- **Unexpected Agents**: None
- **Agent Coverage**: 0.0%
- **Cache Hit**: ❌
- **Cache Write**: ❌
- **Database Write**: ❌

### no-brand-null:  | No Brand Product

- **Status**: ❌ FAIL
- **Response Time**: 952ms
- **Confidence**: N/A
- **Agents Triggered**: None
- **Expected Agents**: None
- **Missing Agents**: None
- **Unexpected Agents**: None
- **Agent Coverage**: 0.0%
- **Cache Hit**: ❌
- **Cache Write**: ❌
- **Database Write**: ❌

### zzzcorp-nonexistent: ZzzCorp | Nonexistent Brand

- **Status**: ❌ FAIL
- **Response Time**: 1171ms
- **Confidence**: N/A
- **Agents Triggered**: None
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, query_builder, llm_first_analysis, web_research
- **Missing Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, query_builder, llm_first_analysis, web_research
- **Unexpected Agents**: None
- **Agent Coverage**: 0.0%
- **Cache Hit**: ❌
- **Cache Write**: ❌
- **Database Write**: ❌

### lipton-long-product: Lipton | Lipton Ice Tea 330ml

- **Status**: ✅ PASS
- **Response Time**: 19018ms
- **Confidence**: 95%
- **Agents Triggered**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Expected Agents**: cache_check, sheets_mapping, static_mapping, rag_retrieval, llm_first_analysis, database_save
- **Missing Agents**: None
- **Unexpected Agents**: None
- **Agent Coverage**: 100.0%
- **Cache Hit**: ❌
- **Cache Write**: ✅
- **Database Write**: ✅

## 📈 Performance Metrics

- **Average Response Time**: 15291ms
- **Fastest Response**: 952ms
- **Slowest Response**: 29470ms
- **Success Rate**: 78.6%

---

*Generated by Extended Pipeline Verification Test Suite*
