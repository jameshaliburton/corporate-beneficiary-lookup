# Test Case: lipton-normal-2

**Timestamp**: 2025-08-29T10:15:39.130Z  
**Category**: high_confidence_normal  
**Description**: Second run - should cache hit

## ✅ Pipeline Summary

- **Input**: Lipton | Lipton Ice Tea
- **Confidence Score**: 95%
- **Success Flag**: ✅ true
- **Financial Beneficiary**: Unilever PLC
- **Response Time**: 17268ms
- **HTTP Status**: 200

## 🔍 Agent Trace Table

| Agent | Expected | Triggered | Status |
|-------|----------|-----------|--------|
| cache_check | ✅ | ✅ | ✅ |
| sheets_mapping | ❌ | ✅ | ⚠️ UNEXPECTED |
| static_mapping | ❌ | ✅ | ⚠️ UNEXPECTED |
| rag_retrieval | ❌ | ✅ | ⚠️ UNEXPECTED |
| llm_first_analysis | ❌ | ✅ | ⚠️ UNEXPECTED |
| database_save | ❌ | ✅ | ⚠️ UNEXPECTED |

**Agent Coverage**: 100.0%

## 📦 Cache Behavior

- **Cache Checked**: ✅ Yes
- **Cache Key**: lipton::lipton ice tea
- **Cache Hit**: ❌ No
- **Cache Write**: ✅ Yes
- **Cache Payload**: {
  "brand": "Lipton",
  "product": "Lipton Ice Tea",
  "beneficiary": "Unilever PLC",
  "confidence": 95
}

## 🧠 Feature Flag Snapshot

| Flag | Value |
|------|-------|
| WEB_RESEARCH | off |
| NARRATIVE_V3 | off |
| CACHE_WRITE | off |
| USE_LEGACY_BARCODE | false |
| USE_VISION_FIRST_PIPELINE | true |

## 📥 Database Write Verification

- **Data Saved**: ✅ Yes
- **Table**: ownership_results
- **Trace ID**: query_1756462315993_lhhjo6yht
- **Timestamp**: 2025-08-29T10:12:13.214Z

## 📊 Raw Response Data

```json
{
  "success": true,
  "product_name": "Lipton Ice Tea",
  "brand": "Lipton",
  "barcode": null,
  "financial_beneficiary": "Unilever PLC",
  "beneficiary_country": "United Kingdom",
  "beneficiary_flag": "🇬🇧",
  "confidence_score": 95,
  "confidence_level": "Very High",
  "ownership_structure_type": "Joint Venture",
  "ownership_flow": [
    {
      "name": "Lipton",
      "type": "Brand",
      "country": "United Kingdom",
      "flag": "🇬🇧",
      "ultimate": false
    },
    {
      "name": "Pepsi Lipton International",
      "type": "Joint Venture",
      "country": "United States",
      "flag": "🇺🇸",
      "ultimate": false
    },
    {
      "name": "Unilever PLC",
      "type": "Ultimate Owner",
      "country": "United Kingdom",
      "flag": "🇬🇧",
      "ultimate": true
    }
  ],
  "sources": [
    "LLM analysis of Lipton"
  ],
  "reasoning": "Lipton's ready-to-drink beverages, including Lipton Ice Tea, are produced and marketed through a joint venture between Unilever and PepsiCo called Pepsi Lipton International (PLI). This joint venture was established in 1991 and operates worldwide. While PepsiCo handles the distribution network, Unilever owns the Lipton brand itself and is the primary financial beneficiary of the brand's value. In 2020, Unilever unified its dual-headed structure into a single parent company, Unilever PLC, headquartered in the United Kingdom. The high confidence score is based on well-documented corporate structures and long-standing business relationships between these companies. The Lipton brand was originally created by Thomas Lipton in 1890 and was acquired by Unilever in 1938, and this ownership has remained constant despite various distribution and manufacturing partnerships.",
  "agent_results": {
    "llm_first_analysis": {
      "success": true,
      "data": {
        "financial_beneficiary": "Unilever PLC",
        "beneficiary_country": "United Kingdom",
        "ownership_structure_type": "Joint Venture",
        "ownership_flow": [
          {
            "name": "Lipton",
            "type": "Brand",
            "country": "United Kingdom",
            "source": "historical knowledge"
          },
          {
            "name": "Pepsi Lipton International",
            "type": "Joint Venture",
            "country": "United States",
            "source": "corporate filings"
          },
          {
            "name": "Unilever PLC",
            "type": "Ultimate Owner",
            "country": "United Kingdom",
            "source": "corporate structure"
          }
        ],
        "confidence_score": 95,
        "reasoning": "Lipton's ready-to-drink beverages, including Lipton Ice Tea, are produced and marketed through a joint venture between Unilever and PepsiCo called Pepsi Lipton International (PLI). This joint venture was established in 1991 and operates worldwide. While PepsiCo handles the distribution network, Unilever owns the Lipton brand itself and is the primary financial beneficiary of the brand's value. In 2020, Unilever unified its dual-headed structure into a single parent company, Unilever PLC, headquartered in the United Kingdom. The high confidence score is based on well-documented corporate structures and long-standing business relationships between these companies. The Lipton brand was originally created by Thomas Lipton in 1890 and was acquired by Unilever in 1938, and this ownership has remained constant despite various distribution and manufacturing partnerships."
      },
      "reasoning": "LLM-first analysis provided high-confidence ownership determination"
    }
  },
  "result_type": "user_input",
  "user_contributed": true,
  "agent_execution_trace": {
    "sections": [
      {
        "id": "retrieval",
        "label": "Retrieval",
        "stages": [
          {
            "id": "cache_check",
            "label": "Cache Check",
            "inputVariables": {
              "cacheKey": "lipton::lipton ice tea"
            },
            "outputVariables": {
              "success": true,
              "hit": false
            },
            "intermediateVariables": {},
            "durationMs": 87,
            "prompt": {
              "system": "You are an AI assistant helping with corporate ownership research.",
              "user": "Process the cache_check stage for ownership analysis."
            }
          },
          {
            "id": "sheets_mapping",
            "label": "Sheets Mapping",
            "inputVariables": {
              "inputVariables": {},
              "outputVariables": {},
              "intermediateVariables": {}
            },
            "outputVariables": {},
            "intermediateVariables": {},
            "durationMs": 0,
            "prompt": {
              "system": "You are an AI assistant helping with corporate ownership research.",
              "user": "Process the sheets_mapping stage for ownership analysis."
            }
          },
          {
            "id": "static_mapping",
            "label": "Static Mapping",
            "inputVariables": {
              "inputVariables": {},
              "outputVariables": {},
              "intermediateVariables": {}
            },
            "outputVariables": {},
            "intermediateVariables": {},
            "durationMs": 0,
            "prompt": {
              "system": "You are an AI assistant helping with corporate ownership research.",
              "user": "Process the static_mapping stage for ownership analysis."
            }
          },
          {
            "id": "rag_retrieval",
            "label": "RAG Retrieval",
            "inputVariables": {
              "inputVariables": {},
              "outputVariables": {},
              "intermediateVariables": {}
            },
            "outputVariables": {},
            "intermediateVariables": {},
            "durationMs": 0,
            "prompt": {
              "system": "You are an AI assistant helping with corporate ownership research.",
              "user": "Process the rag_retrieval stage for ownership analysis."
            }
          }
        ]
      },
      {
        "id": "ownership",
        "label": "Ownership",
        "stages": [
          {
            "id": "llm_first_analysis",
            "label": "LLM First Analysis",
            "inputVariables": {
              "inputVariables": {
                "brand": "Lipton",
                "product_name": "Lipton Ice Tea",
                "barcode": null,
                "hints": "{}",
                "rag_context": ""
              },
              "outputVariables": {
                "financial_beneficiary": "Unilever PLC",
                "beneficiary_country": "United Kingdom",
                "ownership_structure_type": "Joint Venture",
                "confidence_score": 95,
                "reasoning": "Lipton's ready-to-drink beverages, including Lipton Ice Tea, are produced and marketed through a joint venture between Unilever and PepsiCo called Pepsi Lipton International (PLI). This joint venture was established in 1991 and operates worldwide. While PepsiCo handles the distribution network, Unilever owns the Lipton brand itself and is the primary financial beneficiary of the brand's value. In 2020, Unilever unified its dual-headed structure into a single parent company, Unilever PLC, headquartered in the United Kingdom. The high confidence score is based on well-documented corporate structures and long-standing business relationships between these companies. The Lipton brand was originally created by Thomas Lipton in 1890 and was acquired by Unilever in 1938, and this ownership has remained constant despite various distribution and manufacturing partnerships.",
                "ownership_flow": [
                  {
                    "name": "Lipton",
                    "type": "Brand",
                    "country": "United Kingdom",
                    "source": "historical knowledge"
                  },
                  {
                    "name": "Pepsi Lipton International",
                    "type": "Joint Venture",
                    "country": "United States",
                    "source": "corporate filings"
                  },
                  {
                    "name": "Unilever PLC",
                    "type": "Ultimate Owner",
                    "country": "United Kingdom",
                    "source": "corporate structure"
                  }
                ]
              },
              "intermediateVariables": {
                "rag_context_count": 0,
                "llm_response_length": 1521,
                "json_parse_success": true
              }
            },
            "outputVariables": {},
            "intermediateVariables": {},
            "durationMs": 0,
            "prompt": {
              "system": "You are an AI assistant helping with corporate ownership research.",
              "user": "Process the llm_first_analysis stage for ownership analysis."
            }
          }
        ]
      },
      {
        "id": "persistence",
        "label": "Persistence",
        "stages": [
          {
            "id": "database_save",
            "label": "Database Save",
            "inputVariables": {
              "beneficiary": "Unilever PLC",
              "confidence": 95
            },
            "outputVariables": {
              "success": true,
              "beneficiary": "Unilever PLC"
            },
            "intermediateVariables": {},
            "durationMs": 200,
            "prompt": {
              "system": "You are an AI assistant helping with corporate ownership research.",
              "user": "Process the database_save stage for ownership analysis."
            }
          }
        ]
      }
    ],
    "show_skipped_stages": false,
    "mark_skipped_stages": true
  },
  "lookup_trace": [
    "manual_entry"
  ],
  "contextual_clues": null,
  "image_processing_trace": null,
  "vision_context": null,
  "pipeline_type": "vision_first",
  "headline": "Lipton's British twist: Not just any cuppa 🇬🇧",
  "tagline": "Your favorite tea is steeped in British corporate ownership",
  "story": "While Lipton tea might be found in cupboards worldwide, it's ultimately owned by British giant Unilever PLC through a joint venture structure.",
  "ownership_notes": [
    "Owned by Unilever PLC (United Kingdom)",
    "Operates through joint venture structure",
    "95% confidence in ownership data",
    "Original brand country data unavailable"
  ],
  "behind_the_scenes": [
    "Verified Unilever PLC as ultimate owner",
    "Confirmed UK as country of ownership",
    "Identified joint venture ownership structure",
    "Noted high confidence level (95%)",
    "Flagged missing brand origin data"
  ],
  "narrative_template_used": "global_brand_ownership",
  "query_id": "query_1756462315993_lhhjo6yht"
}
```

---

*Generated by Extended Pipeline Verification Test Suite*
