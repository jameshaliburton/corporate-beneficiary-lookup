# Test Case: samsung-multi-division

**Timestamp**: 2025-08-29T10:15:39.131Z  
**Category**: ambiguous_brand  
**Description**: Multi-division Samsung brand

## ✅ Pipeline Summary

- **Input**: Samsung | Galaxy Buds
- **Confidence Score**: 95%
- **Success Flag**: ✅ true
- **Financial Beneficiary**: Samsung Group
- **Response Time**: 15997ms
- **HTTP Status**: 200

## 🔍 Agent Trace Table

| Agent | Expected | Triggered | Status |
|-------|----------|-----------|--------|
| cache_check | ✅ | ✅ | ✅ |
| sheets_mapping | ✅ | ✅ | ✅ |
| static_mapping | ✅ | ✅ | ✅ |
| rag_retrieval | ✅ | ✅ | ✅ |
| llm_first_analysis | ✅ | ✅ | ✅ |
| disambiguation | ✅ | ❌ | ❌ MISSING |
| database_save | ✅ | ✅ | ✅ |


**Agent Coverage**: 85.7%

## 📦 Cache Behavior

- **Cache Checked**: ✅ Yes
- **Cache Key**: samsung::galaxy buds
- **Cache Hit**: ❌ No
- **Cache Write**: ✅ Yes
- **Cache Payload**: {
  "brand": "Samsung",
  "product": "Galaxy Buds",
  "beneficiary": "Samsung Group",
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
- **Trace ID**: query_1756462390194_gugpllukd
- **Timestamp**: 2025-08-29T10:13:26.179Z

## 📊 Raw Response Data

```json
{
  "success": true,
  "product_name": "Galaxy Buds",
  "brand": "Samsung",
  "barcode": null,
  "financial_beneficiary": "Samsung Group",
  "beneficiary_country": "South Korea",
  "beneficiary_flag": "🇰🇷",
  "confidence_score": 95,
  "confidence_level": "Very High",
  "ownership_structure_type": "Public Company",
  "ownership_flow": [
    {
      "name": "Galaxy Buds",
      "type": "Product",
      "country": "South Korea",
      "flag": "🇰🇷",
      "ultimate": false
    },
    {
      "name": "Samsung Electronics",
      "type": "Subsidiary",
      "country": "South Korea",
      "flag": "🇰🇷",
      "ultimate": false
    },
    {
      "name": "Samsung Group",
      "type": "Ultimate Owner",
      "country": "South Korea",
      "flag": "🇰🇷",
      "ultimate": true
    }
  ],
  "sources": [
    "LLM analysis of Samsung"
  ],
  "reasoning": "Samsung Galaxy Buds are a product line of wireless earbuds manufactured and sold by Samsung Electronics, which is the flagship company of the Samsung Group (삼성그룹). Samsung Electronics is a publicly traded company, but it is part of the larger Samsung Group chaebol (Korean business conglomerate). The Samsung Group, founded by Lee Byung-chul and now led by Lee Jae-yong, maintains significant control through a complex ownership structure typical of Korean chaebols. Samsung Electronics is the division responsible for consumer electronics and mobile devices, including the Galaxy line of products. The ownership structure is well-documented and stable, having been established for many decades, which contributes to the high confidence score. The company's headquarters and primary decision-making remain in South Korea, though they have global operations.",
  "agent_results": {
    "llm_first_analysis": {
      "success": true,
      "data": {
        "financial_beneficiary": "Samsung Group",
        "beneficiary_country": "South Korea",
        "ownership_structure_type": "Public Company",
        "ownership_flow": [
          {
            "name": "Galaxy Buds",
            "type": "Product",
            "country": "South Korea",
            "source": "product knowledge"
          },
          {
            "name": "Samsung Electronics",
            "type": "Subsidiary",
            "country": "South Korea",
            "source": "corporate structure knowledge"
          },
          {
            "name": "Samsung Group",
            "type": "Ultimate Owner",
            "country": "South Korea",
            "source": "corporate structure knowledge"
          }
        ],
        "confidence_score": 95,
        "reasoning": "Samsung Galaxy Buds are a product line of wireless earbuds manufactured and sold by Samsung Electronics, which is the flagship company of the Samsung Group (삼성그룹). Samsung Electronics is a publicly traded company, but it is part of the larger Samsung Group chaebol (Korean business conglomerate). The Samsung Group, founded by Lee Byung-chul and now led by Lee Jae-yong, maintains significant control through a complex ownership structure typical of Korean chaebols. Samsung Electronics is the division responsible for consumer electronics and mobile devices, including the Galaxy line of products. The ownership structure is well-documented and stable, having been established for many decades, which contributes to the high confidence score. The company's headquarters and primary decision-making remain in South Korea, though they have global operations."
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
              "cacheKey": "samsung::galaxy buds"
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
                "brand": "Samsung",
                "product_name": "Galaxy Buds",
                "barcode": null,
                "hints": "{}",
                "rag_context": ""
              },
              "outputVariables": {
                "financial_beneficiary": "Samsung Group",
                "beneficiary_country": "South Korea",
                "ownership_structure_type": "Public Company",
                "confidence_score": 95,
                "reasoning": "Samsung Galaxy Buds are a product line of wireless earbuds manufactured and sold by Samsung Electronics, which is the flagship company of the Samsung Group (삼성그룹). Samsung Electronics is a publicly traded company, but it is part of the larger Samsung Group chaebol (Korean business conglomerate). The Samsung Group, founded by Lee Byung-chul and now led by Lee Jae-yong, maintains significant control through a complex ownership structure typical of Korean chaebols. Samsung Electronics is the division responsible for consumer electronics and mobile devices, including the Galaxy line of products. The ownership structure is well-documented and stable, having been established for many decades, which contributes to the high confidence score. The company's headquarters and primary decision-making remain in South Korea, though they have global operations.",
                "ownership_flow": [
                  {
                    "name": "Galaxy Buds",
                    "type": "Product",
                    "country": "South Korea",
                    "source": "product knowledge"
                  },
                  {
                    "name": "Samsung Electronics",
                    "type": "Subsidiary",
                    "country": "South Korea",
                    "source": "corporate structure knowledge"
                  },
                  {
                    "name": "Samsung Group",
                    "type": "Ultimate Owner",
                    "country": "South Korea",
                    "source": "corporate structure knowledge"
                  }
                ]
              },
              "intermediateVariables": {
                "rag_context_count": 0,
                "llm_response_length": 1511,
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
              "beneficiary": "Samsung Group",
              "confidence": 95
            },
            "outputVariables": {
              "success": true,
              "beneficiary": "Samsung Group"
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
  "headline": "Samsung: Korea's tech giant rules global markets 🇰🇷",
  "tagline": "The family-controlled empire behind your favorite gadgets",
  "story": "From humble trading roots in 1938, Samsung grew into South Korea's largest chaebol (family-controlled conglomerate), now dominating everything from smartphones to semiconductors.",
  "ownership_notes": [
    "Samsung Group is a South Korean multinational conglomerate",
    "Operates through a complex network of affiliated companies",
    "Publicly traded but family-controlled structure",
    "One of South Korea's largest chaebols (family-run conglomerates)"
  ],
  "behind_the_scenes": [
    "Verified Samsung Group as ultimate owner",
    "Confirmed South Korean ownership",
    "High confidence (95%) in ownership data",
    "Identified as public company structure"
  ],
  "narrative_template_used": "global_tech_leader",
  "query_id": "query_1756462390194_gugpllukd"
}
```

---

*Generated by Extended Pipeline Verification Test Suite*
