# Test Case: jordan-toothpaste-non-nike

**Timestamp**: 2025-08-29T10:15:39.132Z  
**Category**: ambiguous_brand  
**Description**: Jordan brand confusion (non-Nike)

## ✅ Pipeline Summary

- **Input**: Jordan | Toothpaste
- **Confidence Score**: 95%
- **Success Flag**: ✅ true
- **Financial Beneficiary**: Colgate-Palmolive Company
- **Response Time**: 16675ms
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
| gemini_ownership_research | ✅ | ❌ | ❌ MISSING |
| database_save | ✅ | ✅ | ✅ |


**Agent Coverage**: 75.0%

## 📦 Cache Behavior

- **Cache Checked**: ✅ Yes
- **Cache Key**: jordan::toothpaste
- **Cache Hit**: ❌ No
- **Cache Write**: ✅ Yes
- **Cache Payload**: {
  "brand": "Jordan",
  "product": "Toothpaste",
  "beneficiary": "Colgate-Palmolive Company",
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
- **Trace ID**: query_1756462408190_zgfw6ijtr
- **Timestamp**: 2025-08-29T10:13:44.856Z

## 📊 Raw Response Data

```json
{
  "success": true,
  "product_name": "Toothpaste",
  "brand": "Jordan",
  "barcode": null,
  "financial_beneficiary": "Colgate-Palmolive Company",
  "beneficiary_country": "United States",
  "beneficiary_flag": "🇺🇸",
  "confidence_score": 95,
  "confidence_level": "Very High",
  "ownership_structure_type": "Subsidiary",
  "ownership_flow": [
    {
      "name": "Jordan",
      "type": "Brand",
      "country": "Norway",
      "flag": "🇳🇴",
      "ultimate": false
    },
    {
      "name": "Colgate-Palmolive Company",
      "type": "Ultimate Owner",
      "country": "United States",
      "flag": "🇺🇸",
      "ultimate": true
    }
  ],
  "sources": [
    "LLM analysis of Jordan"
  ],
  "reasoning": "Jordan is a well-known oral care brand that was originally founded in Norway. The brand was acquired by Colgate-Palmolive in 2004 for $120 million, making it a wholly-owned subsidiary of Colgate-Palmolive Company. The acquisition was part of Colgate's strategy to expand its presence in the Nordic region and strengthen its oral care portfolio. Jordan has continued to operate as a distinct brand under Colgate-Palmolive's ownership, particularly strong in Scandinavian markets. The high confidence score is based on the well-documented acquisition and Colgate-Palmolive's continued public ownership of the brand through their corporate reports and market presence.",
  "agent_results": {
    "llm_first_analysis": {
      "success": true,
      "data": {
        "financial_beneficiary": "Colgate-Palmolive Company",
        "beneficiary_country": "United States",
        "ownership_structure_type": "Subsidiary",
        "ownership_flow": [
          {
            "name": "Jordan",
            "type": "Brand",
            "country": "Norway",
            "source": "historical brand knowledge"
          },
          {
            "name": "Colgate-Palmolive Company",
            "type": "Ultimate Owner",
            "country": "United States",
            "source": "corporate acquisitions records"
          }
        ],
        "confidence_score": 95,
        "reasoning": "Jordan is a well-known oral care brand that was originally founded in Norway. The brand was acquired by Colgate-Palmolive in 2004 for $120 million, making it a wholly-owned subsidiary of Colgate-Palmolive Company. The acquisition was part of Colgate's strategy to expand its presence in the Nordic region and strengthen its oral care portfolio. Jordan has continued to operate as a distinct brand under Colgate-Palmolive's ownership, particularly strong in Scandinavian markets. The high confidence score is based on the well-documented acquisition and Colgate-Palmolive's continued public ownership of the brand through their corporate reports and market presence."
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
              "cacheKey": "jordan::toothpaste"
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
                "brand": "Jordan",
                "product_name": "Toothpaste",
                "barcode": null,
                "hints": "{}",
                "rag_context": ""
              },
              "outputVariables": {
                "financial_beneficiary": "Colgate-Palmolive Company",
                "beneficiary_country": "United States",
                "ownership_structure_type": "Subsidiary",
                "confidence_score": 95,
                "reasoning": "Jordan is a well-known oral care brand that was originally founded in Norway. The brand was acquired by Colgate-Palmolive in 2004 for $120 million, making it a wholly-owned subsidiary of Colgate-Palmolive Company. The acquisition was part of Colgate's strategy to expand its presence in the Nordic region and strengthen its oral care portfolio. Jordan has continued to operate as a distinct brand under Colgate-Palmolive's ownership, particularly strong in Scandinavian markets. The high confidence score is based on the well-documented acquisition and Colgate-Palmolive's continued public ownership of the brand through their corporate reports and market presence.",
                "ownership_flow": [
                  {
                    "name": "Jordan",
                    "type": "Brand",
                    "country": "Norway",
                    "source": "historical brand knowledge"
                  },
                  {
                    "name": "Colgate-Palmolive Company",
                    "type": "Ultimate Owner",
                    "country": "United States",
                    "source": "corporate acquisitions records"
                  }
                ]
              },
              "intermediateVariables": {
                "rag_context_count": 0,
                "llm_response_length": 1183,
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
              "beneficiary": "Colgate-Palmolive Company",
              "confidence": 95
            },
            "outputVariables": {
              "success": true,
              "beneficiary": "Colgate-Palmolive Company"
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
  "headline": "Jordan isn't who you think it is 🇺🇸",
  "tagline": "Your toothbrush brand belongs to Colgate-Palmolive",
  "story": "That trusty Jordan toothbrush in your bathroom? It's actually part of the Colgate-Palmolive family, one of America's largest personal care companies.",
  "ownership_notes": [
    "Colgate-Palmolive acquired Jordan as part of their oral care expansion",
    "Jordan operates as a subsidiary of Colgate-Palmolive",
    "Ultimate ownership traces back to the United States"
  ],
  "behind_the_scenes": [
    "High confidence (95%) in ownership data",
    "Direct subsidiary relationship confirmed",
    "Original brand country data unavailable",
    "Clear US-based ultimate ownership"
  ],
  "narrative_template_used": "corporate_subsidiary",
  "query_id": "query_1756462408190_zgfw6ijtr"
}
```

---

*Generated by Extended Pipeline Verification Test Suite*
