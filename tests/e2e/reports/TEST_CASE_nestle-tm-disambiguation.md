# Test Case: nestle-tm-disambiguation

**Timestamp**: 2025-08-29T10:15:39.131Z  
**Category**: high_confidence_normal  
**Description**: TM symbol disambiguation check

## ✅ Pipeline Summary

- **Input**: Nestlé™ | Nescafé
- **Confidence Score**: 100%
- **Success Flag**: ✅ true
- **Financial Beneficiary**: Nestlé S.A.
- **Response Time**: 15080ms
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
- **Cache Key**: nestlé™::nescafé
- **Cache Hit**: ❌ No
- **Cache Write**: ✅ Yes
- **Cache Payload**: {
  "brand": "Nestlé™",
  "product": "Nescafé",
  "beneficiary": "Nestlé S.A.",
  "confidence": 100
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
- **Trace ID**: query_1756462373113_vsdhdzb9f
- **Timestamp**: 2025-08-29T10:13:08.180Z

## 📊 Raw Response Data

```json
{
  "success": true,
  "product_name": "Nescafé",
  "brand": "Nestlé™",
  "barcode": null,
  "financial_beneficiary": "Nestlé S.A.",
  "beneficiary_country": "Switzerland",
  "beneficiary_flag": "🇨🇭",
  "confidence_score": 100,
  "confidence_level": "Very High",
  "ownership_structure_type": "Public Company",
  "ownership_flow": [
    {
      "name": "Nescafé",
      "type": "Brand",
      "country": "Switzerland",
      "flag": "🇨🇭",
      "ultimate": false
    },
    {
      "name": "Nestlé S.A.",
      "type": "Ultimate Owner",
      "country": "Switzerland",
      "flag": "🇨🇭",
      "ultimate": true
    }
  ],
  "sources": [
    "LLM analysis of Nestlé™"
  ],
  "reasoning": "Nescafé is one of Nestlé's flagship brands and has been owned by Nestlé since its creation in 1938. The brand name itself is a portmanteau of 'Nestlé' and 'café'. Nestlé S.A. is a publicly traded company headquartered in Vevey, Switzerland, and is listed on the SIX Swiss Exchange. Nescafé was developed by Nestlé's own scientists and has remained a core brand throughout its history. The ownership is direct and clear, with no intermediate holding companies or complex ownership structures between the brand and the parent company. The brand is so integral to Nestlé that it represents one of their most valuable and recognized global brands. The confidence score is 100 because this is a well-documented, straightforward ownership case with no ambiguity or recent changes in ownership structure.",
  "agent_results": {
    "llm_first_analysis": {
      "success": true,
      "data": {
        "financial_beneficiary": "Nestlé S.A.",
        "beneficiary_country": "Switzerland",
        "ownership_structure_type": "Public Company",
        "ownership_flow": [
          {
            "name": "Nescafé",
            "type": "Brand",
            "country": "Switzerland",
            "source": "Direct brand knowledge"
          },
          {
            "name": "Nestlé S.A.",
            "type": "Ultimate Owner",
            "country": "Switzerland",
            "source": "Corporate documentation and public records"
          }
        ],
        "confidence_score": 100,
        "reasoning": "Nescafé is one of Nestlé's flagship brands and has been owned by Nestlé since its creation in 1938. The brand name itself is a portmanteau of 'Nestlé' and 'café'. Nestlé S.A. is a publicly traded company headquartered in Vevey, Switzerland, and is listed on the SIX Swiss Exchange. Nescafé was developed by Nestlé's own scientists and has remained a core brand throughout its history. The ownership is direct and clear, with no intermediate holding companies or complex ownership structures between the brand and the parent company. The brand is so integral to Nestlé that it represents one of their most valuable and recognized global brands. The confidence score is 100 because this is a well-documented, straightforward ownership case with no ambiguity or recent changes in ownership structure."
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
              "cacheKey": "nestlé™::nescafé"
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
                "brand": "Nestlé™",
                "product_name": "Nescafé",
                "barcode": null,
                "hints": "{}",
                "rag_context": ""
              },
              "outputVariables": {
                "financial_beneficiary": "Nestlé S.A.",
                "beneficiary_country": "Switzerland",
                "ownership_structure_type": "Public Company",
                "confidence_score": 100,
                "reasoning": "Nescafé is one of Nestlé's flagship brands and has been owned by Nestlé since its creation in 1938. The brand name itself is a portmanteau of 'Nestlé' and 'café'. Nestlé S.A. is a publicly traded company headquartered in Vevey, Switzerland, and is listed on the SIX Swiss Exchange. Nescafé was developed by Nestlé's own scientists and has remained a core brand throughout its history. The ownership is direct and clear, with no intermediate holding companies or complex ownership structures between the brand and the parent company. The brand is so integral to Nestlé that it represents one of their most valuable and recognized global brands. The confidence score is 100 because this is a well-documented, straightforward ownership case with no ambiguity or recent changes in ownership structure.",
                "ownership_flow": [
                  {
                    "name": "Nescafé",
                    "type": "Brand",
                    "country": "Switzerland",
                    "source": "Direct brand knowledge"
                  },
                  {
                    "name": "Nestlé S.A.",
                    "type": "Ultimate Owner",
                    "country": "Switzerland",
                    "source": "Corporate documentation and public records"
                  }
                ]
              },
              "intermediateVariables": {
                "rag_context_count": 0,
                "llm_response_length": 1302,
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
              "beneficiary": "Nestlé S.A.",
              "confidence": 100
            },
            "outputVariables": {
              "success": true,
              "beneficiary": "Nestlé S.A."
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
  "headline": "Nestlé: Swiss precision in global snacking 🇨🇭",
  "tagline": "World's largest food company calls Switzerland home",
  "story": "While Nestlé's products are everywhere, the company's heart beats in Switzerland, where it was founded in 1866 by Henri Nestlé.",
  "ownership_notes": [
    "Nestlé S.A. is publicly traded but headquartered in Switzerland",
    "One of Switzerland's most valuable companies by market cap",
    "Operates in 186 countries worldwide"
  ],
  "behind_the_scenes": [
    "Confirmed Swiss ownership through corporate registry",
    "Verified public company status on stock exchange",
    "High confidence (100%) in ownership data"
  ],
  "narrative_template_used": "global_heritage",
  "query_id": "query_1756462373113_vsdhdzb9f"
}
```

---

*Generated by Extended Pipeline Verification Test Suite*
