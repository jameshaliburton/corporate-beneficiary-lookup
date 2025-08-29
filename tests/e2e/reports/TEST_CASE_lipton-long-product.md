# Test Case: lipton-long-product

**Timestamp**: 2025-08-29T10:15:39.134Z  
**Category**: edge_case  
**Description**: Long product name variant

## ✅ Pipeline Summary

- **Input**: Lipton | Lipton Ice Tea 330ml
- **Confidence Score**: 95%
- **Success Flag**: ✅ true
- **Financial Beneficiary**: Unilever PLC
- **Response Time**: 19018ms
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
- **Cache Key**: lipton::lipton ice tea 330ml
- **Cache Hit**: ❌ No
- **Cache Write**: ✅ Yes
- **Cache Payload**: {
  "brand": "Lipton",
  "product": "Lipton Ice Tea 330ml",
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
- **Trace ID**: query_1756462518117_iw9drqfuc
- **Timestamp**: 2025-08-29T10:15:37.128Z

## 📊 Raw Response Data

```json
{
  "success": true,
  "product_name": "Lipton Ice Tea 330ml",
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
  "reasoning": "Lipton's ready-to-drink beverages (including Lipton Ice Tea) are produced and marketed through Pepsi Lipton International, which is a joint venture between PepsiCo and Unilever. However, the Lipton brand itself is owned by Unilever PLC, who acquired it in 1972. The joint venture was established in 1991 to leverage PepsiCo's distribution network and beverage expertise while utilizing Unilever's brand and tea expertise. For ready-to-drink products like Lipton Ice Tea, profits are shared between PepsiCo and Unilever through the joint venture, but Unilever maintains ownership of the core brand and receives royalties. This structure is well-documented and has been stable for many years, making this analysis highly confident. The ultimate financial beneficiary is Unilever PLC, as they own the brand itself and receive both joint venture profits and brand royalties.",
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
        "reasoning": "Lipton's ready-to-drink beverages (including Lipton Ice Tea) are produced and marketed through Pepsi Lipton International, which is a joint venture between PepsiCo and Unilever. However, the Lipton brand itself is owned by Unilever PLC, who acquired it in 1972. The joint venture was established in 1991 to leverage PepsiCo's distribution network and beverage expertise while utilizing Unilever's brand and tea expertise. For ready-to-drink products like Lipton Ice Tea, profits are shared between PepsiCo and Unilever through the joint venture, but Unilever maintains ownership of the core brand and receives royalties. This structure is well-documented and has been stable for many years, making this analysis highly confident. The ultimate financial beneficiary is Unilever PLC, as they own the brand itself and receive both joint venture profits and brand royalties."
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
              "cacheKey": "lipton::lipton ice tea 330ml"
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
                "product_name": "Lipton Ice Tea 330ml",
                "barcode": null,
                "hints": "{}",
                "rag_context": ""
              },
              "outputVariables": {
                "financial_beneficiary": "Unilever PLC",
                "beneficiary_country": "United Kingdom",
                "ownership_structure_type": "Joint Venture",
                "confidence_score": 95,
                "reasoning": "Lipton's ready-to-drink beverages (including Lipton Ice Tea) are produced and marketed through Pepsi Lipton International, which is a joint venture between PepsiCo and Unilever. However, the Lipton brand itself is owned by Unilever PLC, who acquired it in 1972. The joint venture was established in 1991 to leverage PepsiCo's distribution network and beverage expertise while utilizing Unilever's brand and tea expertise. For ready-to-drink products like Lipton Ice Tea, profits are shared between PepsiCo and Unilever through the joint venture, but Unilever maintains ownership of the core brand and receives royalties. This structure is well-documented and has been stable for many years, making this analysis highly confident. The ultimate financial beneficiary is Unilever PLC, as they own the brand itself and receive both joint venture profits and brand royalties.",
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
                "llm_response_length": 1526,
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
  "headline": "Lipton's British twist on your tea break 🇬🇧",
  "tagline": "Your favorite tea brand is steeped in British ownership",
  "story": "That iconic yellow label tea actually belongs to British giant Unilever PLC, making your daily cuppa a truly British affair through a complex joint venture structure.",
  "ownership_notes": [
    "Unilever PLC is the ultimate owner, based in the United Kingdom",
    "Ownership structure is a joint venture arrangement",
    "95% confidence in ownership data",
    "Original brand country information unavailable"
  ],
  "behind_the_scenes": [
    "Verified Unilever PLC as ultimate owner",
    "Confirmed UK as country of ownership",
    "Identified joint venture structure",
    "Noted high confidence level (95%)",
    "Flagged missing brand origin data"
  ],
  "narrative_template_used": "global_ownership_reveal",
  "query_id": "query_1756462518117_iw9drqfuc"
}
```

---

*Generated by Extended Pipeline Verification Test Suite*
