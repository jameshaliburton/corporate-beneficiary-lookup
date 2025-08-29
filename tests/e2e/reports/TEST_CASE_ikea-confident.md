# Test Case: ikea-confident

**Timestamp**: 2025-08-29T10:15:39.130Z  
**Category**: high_confidence_normal  
**Description**: High confidence IKEA lookup

## ✅ Pipeline Summary

- **Input**: IKEA | Billy Bookcase
- **Confidence Score**: 95%
- **Success Flag**: ✅ true
- **Financial Beneficiary**: INGKA Foundation
- **Response Time**: 17999ms
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
- **Cache Key**: ikea::billy bookcase
- **Cache Hit**: ❌ No
- **Cache Write**: ✅ Yes
- **Cache Payload**: {
  "brand": "IKEA",
  "product": "Billy Bookcase",
  "beneficiary": "INGKA Foundation",
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
- **Trace ID**: query_1756462335223_0p9eqaf98
- **Timestamp**: 2025-08-29T10:12:33.215Z

## 📊 Raw Response Data

```json
{
  "success": true,
  "product_name": "Billy Bookcase",
  "brand": "IKEA",
  "barcode": null,
  "financial_beneficiary": "INGKA Foundation",
  "beneficiary_country": "Netherlands",
  "beneficiary_flag": "🇳🇱",
  "confidence_score": 95,
  "confidence_level": "Very High",
  "ownership_structure_type": "Private Foundation",
  "ownership_flow": [
    {
      "name": "IKEA (Brand)",
      "type": "Brand",
      "country": "Sweden",
      "flag": "🇸🇪",
      "ultimate": false
    },
    {
      "name": "Inter IKEA Systems B.V.",
      "type": "Brand Owner",
      "country": "Netherlands",
      "flag": "🇳🇱",
      "ultimate": false
    },
    {
      "name": "INGKA Group",
      "type": "Operating Company",
      "country": "Netherlands",
      "flag": "🇳🇱",
      "ultimate": false
    },
    {
      "name": "INGKA Foundation",
      "type": "Ultimate Owner",
      "country": "Netherlands",
      "flag": "🇳🇱",
      "ultimate": true
    }
  ],
  "sources": [
    "LLM analysis of IKEA"
  ],
  "reasoning": "IKEA has a complex ownership structure deliberately designed for tax efficiency and control. The IKEA brand and concept is owned by Inter IKEA Systems B.V., which is the worldwide IKEA franchisor. However, most IKEA stores are operated by INGKA Group (formerly IKEA Group), which is controlled by the INGKA Foundation, a Dutch-registered entity established by IKEA founder Ingvar Kamprad. The INGKA Foundation is the largest owner of IKEA stores worldwide and is the ultimate financial beneficiary of most IKEA retail operations, including the sale of products like the Billy Bookcase. This structure has been well-documented in corporate filings and investigative reporting. The high confidence score reflects the extensive public documentation of this ownership structure, though its complexity makes it challenging to track all financial flows with absolute certainty.",
  "agent_results": {
    "llm_first_analysis": {
      "success": true,
      "data": {
        "financial_beneficiary": "INGKA Foundation",
        "beneficiary_country": "Netherlands",
        "ownership_structure_type": "Private Foundation",
        "ownership_flow": [
          {
            "name": "IKEA (Brand)",
            "type": "Brand",
            "country": "Sweden",
            "source": "public knowledge"
          },
          {
            "name": "Inter IKEA Systems B.V.",
            "type": "Brand Owner",
            "country": "Netherlands",
            "source": "corporate filings"
          },
          {
            "name": "INGKA Group",
            "type": "Operating Company",
            "country": "Netherlands",
            "source": "corporate structure documents"
          },
          {
            "name": "INGKA Foundation",
            "type": "Ultimate Owner",
            "country": "Netherlands",
            "source": "corporate documentation"
          }
        ],
        "confidence_score": 95,
        "reasoning": "IKEA has a complex ownership structure deliberately designed for tax efficiency and control. The IKEA brand and concept is owned by Inter IKEA Systems B.V., which is the worldwide IKEA franchisor. However, most IKEA stores are operated by INGKA Group (formerly IKEA Group), which is controlled by the INGKA Foundation, a Dutch-registered entity established by IKEA founder Ingvar Kamprad. The INGKA Foundation is the largest owner of IKEA stores worldwide and is the ultimate financial beneficiary of most IKEA retail operations, including the sale of products like the Billy Bookcase. This structure has been well-documented in corporate filings and investigative reporting. The high confidence score reflects the extensive public documentation of this ownership structure, though its complexity makes it challenging to track all financial flows with absolute certainty."
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
              "cacheKey": "ikea::billy bookcase"
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
                "brand": "IKEA",
                "product_name": "Billy Bookcase",
                "barcode": null,
                "hints": "{}",
                "rag_context": ""
              },
              "outputVariables": {
                "financial_beneficiary": "INGKA Foundation",
                "beneficiary_country": "Netherlands",
                "ownership_structure_type": "Private Foundation",
                "confidence_score": 95,
                "reasoning": "IKEA has a complex ownership structure deliberately designed for tax efficiency and control. The IKEA brand and concept is owned by Inter IKEA Systems B.V., which is the worldwide IKEA franchisor. However, most IKEA stores are operated by INGKA Group (formerly IKEA Group), which is controlled by the INGKA Foundation, a Dutch-registered entity established by IKEA founder Ingvar Kamprad. The INGKA Foundation is the largest owner of IKEA stores worldwide and is the ultimate financial beneficiary of most IKEA retail operations, including the sale of products like the Billy Bookcase. This structure has been well-documented in corporate filings and investigative reporting. The high confidence score reflects the extensive public documentation of this ownership structure, though its complexity makes it challenging to track all financial flows with absolute certainty.",
                "ownership_flow": [
                  {
                    "name": "IKEA (Brand)",
                    "type": "Brand",
                    "country": "Sweden",
                    "source": "public knowledge"
                  },
                  {
                    "name": "Inter IKEA Systems B.V.",
                    "type": "Brand Owner",
                    "country": "Netherlands",
                    "source": "corporate filings"
                  },
                  {
                    "name": "INGKA Group",
                    "type": "Operating Company",
                    "country": "Netherlands",
                    "source": "corporate structure documents"
                  },
                  {
                    "name": "INGKA Foundation",
                    "type": "Ultimate Owner",
                    "country": "Netherlands",
                    "source": "corporate documentation"
                  }
                ]
              },
              "intermediateVariables": {
                "rag_context_count": 0,
                "llm_response_length": 1672,
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
              "beneficiary": "INGKA Foundation",
              "confidence": 95
            },
            "outputVariables": {
              "success": true,
              "beneficiary": "INGKA Foundation"
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
  "headline": "IKEA's Dutch secret: not so Swedish after all 🇳🇱",
  "tagline": "World's favorite furniture store owned by Dutch foundation",
  "story": "While IKEA feels Swedish through and through, it's actually controlled by the INGKA Foundation in the Netherlands, making this furniture giant's true home in Dutch territory.",
  "ownership_notes": [
    "INGKA Foundation is the largest owner of IKEA stores worldwide",
    "The foundation structure helps maintain IKEA's long-term independence",
    "This unique ownership model was established in 1982"
  ],
  "behind_the_scenes": [
    "Ultimate owner is INGKA Foundation based in the Netherlands",
    "Ownership confidence is high at 95%",
    "Structure is a private foundation, not a traditional corporation",
    "Original Swedish connection remains through brand heritage"
  ],
  "narrative_template_used": "hidden_global_owner",
  "query_id": "query_1756462335223_0p9eqaf98"
}
```

---

*Generated by Extended Pipeline Verification Test Suite*
