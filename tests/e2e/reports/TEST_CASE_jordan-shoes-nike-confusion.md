# Test Case: jordan-shoes-nike-confusion

**Timestamp**: 2025-08-29T10:15:39.132Z  
**Category**: ambiguous_brand  
**Description**: Jordan shoes Nike confusion

## ✅ Pipeline Summary

- **Input**: Jordan | Shoes
- **Confidence Score**: 100%
- **Success Flag**: ✅ true
- **Financial Beneficiary**: Nike, Inc.
- **Response Time**: 16500ms
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
- **Cache Key**: jordan::shoes
- **Cache Hit**: ❌ No
- **Cache Write**: ✅ Yes
- **Cache Payload**: {
  "brand": "Jordan",
  "product": "Shoes",
  "beneficiary": "Nike, Inc.",
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
- **Trace ID**: query_1756462426867_1whbk4tac
- **Timestamp**: 2025-08-29T10:14:03.357Z

## 📊 Raw Response Data

```json
{
  "success": true,
  "product_name": "Shoes",
  "brand": "Jordan",
  "barcode": null,
  "financial_beneficiary": "Nike, Inc.",
  "beneficiary_country": "United States",
  "beneficiary_flag": "🇺🇸",
  "confidence_score": 100,
  "confidence_level": "Very High",
  "ownership_structure_type": "Brand Subsidiary",
  "ownership_flow": [
    {
      "name": "Jordan Brand",
      "type": "Brand",
      "country": "United States",
      "flag": "🇺🇸",
      "ultimate": false
    },
    {
      "name": "Nike, Inc.",
      "type": "Ultimate Owner",
      "country": "United States",
      "flag": "🇺🇸",
      "ultimate": true
    }
  ],
  "sources": [
    "LLM analysis of Jordan"
  ],
  "reasoning": "Jordan Brand (also known as Air Jordan) is one of Nike's most valuable and well-documented subsidiaries. The brand was created in 1984 through a partnership between Nike and basketball legend Michael Jordan. While Michael Jordan receives royalties from the brand's sales, Nike, Inc. is the full owner of the Jordan Brand and all its intellectual property. This is widely documented in Nike's corporate filings, annual reports, and public records. The brand operates as a separate division within Nike but is fully owned and controlled by Nike, Inc. The relationship between Jordan Brand and Nike is one of the most successful and well-known brand partnerships in sports marketing history, and the ownership structure has remained consistent since the brand's inception. Nike, Inc. is headquartered in Beaverton, Oregon, United States, and is publicly traded on the New York Stock Exchange (NYSE: NKE).",
  "agent_results": {
    "llm_first_analysis": {
      "success": true,
      "data": {
        "financial_beneficiary": "Nike, Inc.",
        "beneficiary_country": "United States",
        "ownership_structure_type": "Brand Subsidiary",
        "ownership_flow": [
          {
            "name": "Jordan Brand",
            "type": "Brand",
            "country": "United States",
            "source": "public knowledge"
          },
          {
            "name": "Nike, Inc.",
            "type": "Ultimate Owner",
            "country": "United States",
            "source": "corporate filings"
          }
        ],
        "confidence_score": 100,
        "reasoning": "Jordan Brand (also known as Air Jordan) is one of Nike's most valuable and well-documented subsidiaries. The brand was created in 1984 through a partnership between Nike and basketball legend Michael Jordan. While Michael Jordan receives royalties from the brand's sales, Nike, Inc. is the full owner of the Jordan Brand and all its intellectual property. This is widely documented in Nike's corporate filings, annual reports, and public records. The brand operates as a separate division within Nike but is fully owned and controlled by Nike, Inc. The relationship between Jordan Brand and Nike is one of the most successful and well-known brand partnerships in sports marketing history, and the ownership structure has remained consistent since the brand's inception. Nike, Inc. is headquartered in Beaverton, Oregon, United States, and is publicly traded on the New York Stock Exchange (NYSE: NKE)."
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
              "cacheKey": "jordan::shoes"
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
                "product_name": "Shoes",
                "barcode": null,
                "hints": "{}",
                "rag_context": ""
              },
              "outputVariables": {
                "financial_beneficiary": "Nike, Inc.",
                "beneficiary_country": "United States",
                "ownership_structure_type": "Brand Subsidiary",
                "confidence_score": 100,
                "reasoning": "Jordan Brand (also known as Air Jordan) is one of Nike's most valuable and well-documented subsidiaries. The brand was created in 1984 through a partnership between Nike and basketball legend Michael Jordan. While Michael Jordan receives royalties from the brand's sales, Nike, Inc. is the full owner of the Jordan Brand and all its intellectual property. This is widely documented in Nike's corporate filings, annual reports, and public records. The brand operates as a separate division within Nike but is fully owned and controlled by Nike, Inc. The relationship between Jordan Brand and Nike is one of the most successful and well-known brand partnerships in sports marketing history, and the ownership structure has remained consistent since the brand's inception. Nike, Inc. is headquartered in Beaverton, Oregon, United States, and is publicly traded on the New York Stock Exchange (NYSE: NKE).",
                "ownership_flow": [
                  {
                    "name": "Jordan Brand",
                    "type": "Brand",
                    "country": "United States",
                    "source": "public knowledge"
                  },
                  {
                    "name": "Nike, Inc.",
                    "type": "Ultimate Owner",
                    "country": "United States",
                    "source": "corporate filings"
                  }
                ]
              },
              "intermediateVariables": {
                "rag_context_count": 0,
                "llm_response_length": 1386,
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
              "beneficiary": "Nike, Inc.",
              "confidence": 100
            },
            "outputVariables": {
              "success": true,
              "beneficiary": "Nike, Inc."
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
  "headline": "Jordan's Swoosh Connection 🇺🇸",
  "tagline": "Michael Jordan's iconic brand is part of Nike's empire",
  "story": "While the Jordan brand began with basketball legend Michael Jordan, it's now a multi-billion dollar subsidiary of American sportswear giant Nike, Inc.",
  "ownership_notes": [
    "100% owned by Nike, Inc. since its creation in 1984",
    "Operates as a distinct brand division within Nike",
    "Based in United States like its parent company"
  ],
  "behind_the_scenes": [
    "Verified Nike, Inc. as ultimate owner",
    "Confirmed 100% ownership confidence",
    "Identified as brand subsidiary relationship",
    "Matched US location of parent company"
  ],
  "narrative_template_used": "brand_subsidiary",
  "query_id": "query_1756462426867_1whbk4tac"
}
```

---

*Generated by Extended Pipeline Verification Test Suite*
