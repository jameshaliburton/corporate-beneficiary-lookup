# Test Case: lipton-normal-1

**Timestamp**: 2025-08-29T10:15:39.129Z  
**Category**: high_confidence_normal  
**Description**: First run - should cache miss and write

## ✅ Pipeline Summary

- **Input**: Lipton | Lipton Ice Tea
- **Confidence Score**: 95%
- **Success Flag**: ✅ true
- **Financial Beneficiary**: Unilever PLC
- **Response Time**: 16919ms
- **HTTP Status**: 200

## 🔍 Agent Trace Table

| Agent | Expected | Triggered | Status |
|-------|----------|-----------|--------|
| cache_check | ✅ | ✅ | ✅ |
| sheets_mapping | ✅ | ✅ | ✅ |
| static_mapping | ✅ | ✅ | ✅ |
| rag_retrieval | ✅ | ✅ | ✅ |
| llm_first_analysis | ✅ | ✅ | ✅ |
| database_save | ✅ | ✅ | ✅ |


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
- **Trace ID**: query_1756462298264_0r4dzerr2
- **Timestamp**: 2025-08-29T10:11:53.944Z

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
  "reasoning": "Lipton's ready-to-drink beverages, including Lipton Ice Tea, are produced and distributed through a joint venture between Unilever and PepsiCo called Pepsi Lipton International (PLI). While PepsiCo handles much of the distribution, Unilever owns the Lipton brand itself and is the ultimate financial beneficiary of the brand's value. The joint venture was established in 1991 to combine Unilever's tea expertise with PepsiCo's distribution network. In 2021, Unilever sold its tea business (Ekaterra) to CVC Capital Partners, but retained ownership of its ready-to-drink tea joint ventures with PepsiCo, including the Lipton brand for ready-to-drink products. This ownership structure is well-documented and has remained stable for many years, hence the high confidence score.",
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
            "source": "corporate documentation"
          },
          {
            "name": "Unilever PLC",
            "type": "Ultimate Owner",
            "country": "United Kingdom",
            "source": "corporate documentation"
          }
        ],
        "confidence_score": 95,
        "reasoning": "Lipton's ready-to-drink beverages, including Lipton Ice Tea, are produced and distributed through a joint venture between Unilever and PepsiCo called Pepsi Lipton International (PLI). While PepsiCo handles much of the distribution, Unilever owns the Lipton brand itself and is the ultimate financial beneficiary of the brand's value. The joint venture was established in 1991 to combine Unilever's tea expertise with PepsiCo's distribution network. In 2021, Unilever sold its tea business (Ekaterra) to CVC Capital Partners, but retained ownership of its ready-to-drink tea joint ventures with PepsiCo, including the Lipton brand for ready-to-drink products. This ownership structure is well-documented and has remained stable for many years, hence the high confidence score."
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
                "reasoning": "Lipton's ready-to-drink beverages, including Lipton Ice Tea, are produced and distributed through a joint venture between Unilever and PepsiCo called Pepsi Lipton International (PLI). While PepsiCo handles much of the distribution, Unilever owns the Lipton brand itself and is the ultimate financial beneficiary of the brand's value. The joint venture was established in 1991 to combine Unilever's tea expertise with PepsiCo's distribution network. In 2021, Unilever sold its tea business (Ekaterra) to CVC Capital Partners, but retained ownership of its ready-to-drink tea joint ventures with PepsiCo, including the Lipton brand for ready-to-drink products. This ownership structure is well-documented and has remained stable for many years, hence the high confidence score.",
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
                    "source": "corporate documentation"
                  },
                  {
                    "name": "Unilever PLC",
                    "type": "Ultimate Owner",
                    "country": "United Kingdom",
                    "source": "corporate documentation"
                  }
                ]
              },
              "intermediateVariables": {
                "rag_context_count": 0,
                "llm_response_length": 1431,
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
  "story": "Though Lipton tea is enjoyed worldwide, it's actually part of British giant Unilever PLC through a unique joint venture arrangement.",
  "ownership_notes": [
    "Unilever PLC is the ultimate owner, based in the United Kingdom",
    "Operates as a joint venture structure",
    "95% confidence in ownership data",
    "Original brand country information unavailable"
  ],
  "behind_the_scenes": [
    "Verified Unilever PLC as primary owner",
    "Confirmed UK as country of ultimate ownership",
    "Identified joint venture business structure",
    "Noted high confidence level (95%)",
    "Flagged missing brand origin data"
  ],
  "narrative_template_used": "global_brand_ownership",
  "query_id": "query_1756462298264_0r4dzerr2"
}
```

---

*Generated by Extended Pipeline Verification Test Suite*
