# Test Case: nike-lip-gloss-wrong-match

**Timestamp**: 2025-08-29T10:15:39.133Z  
**Category**: ambiguous_brand  
**Description**: Nike lip gloss wrong match test

## ✅ Pipeline Summary

- **Input**: Nike | Lip Gloss
- **Confidence Score**: 97%
- **Success Flag**: ✅ true
- **Financial Beneficiary**: Nike, Inc.
- **Response Time**: 29373ms
- **HTTP Status**: 200

## 🔍 Agent Trace Table

| Agent | Expected | Triggered | Status |
|-------|----------|-----------|--------|
| cache_check | ✅ | ✅ | ✅ |
| sheets_mapping | ✅ | ✅ | ✅ |
| static_mapping | ✅ | ✅ | ✅ |
| rag_retrieval | ✅ | ✅ | ✅ |
| llm_first_analysis | ✅ | ✅ | ✅ |
| web_research | ✅ | ✅ | ✅ |
| database_save | ✅ | ✅ | ✅ |
| query_builder | ❌ | ✅ | ⚠️ UNEXPECTED |

**Agent Coverage**: 100.0%

## 📦 Cache Behavior

- **Cache Checked**: ✅ Yes
- **Cache Key**: nike::lip gloss
- **Cache Hit**: ❌ No
- **Cache Write**: ✅ Yes
- **Cache Payload**: {
  "brand": "Nike",
  "product": "Lip Gloss",
  "beneficiary": "Nike, Inc.",
  "confidence": 97
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
- **Trace ID**: query_1756462445369_ofcbwwyod
- **Timestamp**: 2025-08-29T10:14:34.733Z

## 📊 Raw Response Data

```json
{
  "success": true,
  "product_name": "Lip Gloss",
  "brand": "Nike",
  "barcode": null,
  "financial_beneficiary": "Nike, Inc.",
  "beneficiary_flag": "🏳️",
  "confidence_score": 97,
  "ownership_flow": [
    {
      "name": "Nike Lip Gloss",
      "role": "Unknown",
      "country": "United States",
      "flag": "🏳️",
      "ultimate": false,
      "sources": []
    },
    {
      "name": "Nike, Inc.",
      "role": "Unknown",
      "country": "United States",
      "flag": "🏳️",
      "ultimate": false,
      "sources": []
    }
  ],
  "agent_results": {
    "query_builder": {
      "success": true,
      "data": [
        {
          "query": "\"[object Object]\" parent company",
          "purpose": "find parent company information",
          "priority": 5,
          "expected_sources": [
            "company websites",
            "financial news"
          ]
        },
        {
          "query": "\"[object Object]\" ultimate owner",
          "purpose": "find ultimate ownership",
          "priority": 5,
          "expected_sources": [
            "financial filings",
            "corporate registries"
          ]
        }
      ],
      "reasoning": "Query builder analyzed brand characteristics and generated optimized search queries"
    },
    "web_research": {
      "success": true,
      "data": {
        "success": true,
        "brand": "Nike",
        "product_name": "Lip Gloss",
        "ownership_chain": [
          {
            "name": "Nike Lip Gloss",
            "role": "Brand",
            "country": "United States",
            "flag": "🇺🇸",
            "ultimate": false,
            "sources": [
              {
                "url": "https://www.sec.gov/edgar/browse/?CIK=320187",
                "name": "SEC EDGAR Database",
                "type": "registry",
                "confidence": 0.99,
                "tier": 1
              },
              {
                "url": "https://about.nike.com",
                "name": "Nike Official Website",
                "type": "official",
                "confidence": 0.95,
                "tier": 2
              }
            ]
          },
          {
            "name": "Nike, Inc.",
            "role": "Parent",
            "country": "United States",
            "flag": "🇺🇸",
            "ultimate": true,
            "sources": [
              {
                "url": "https://www.sec.gov/edgar/browse/?CIK=320187",
                "name": "SEC EDGAR Database",
                "type": "registry",
                "confidence": 0.99,
                "tier": 1
              },
              {
                "url": "https://about.nike.com",
                "name": "Nike Official Website",
                "type": "official",
                "confidence": 0.95,
                "tier": 2
              }
            ]
          }
        ],
        "final_confidence": 0.95,
        "sources": [
          {
            "name": "SEC EDGAR Database",
            "url": "https://www.sec.gov/edgar/browse/?CIK=320187",
            "type": "registry",
            "reliability": 0.99
          },
          {
            "name": "Nike Official Website",
            "url": "https://about.nike.com",
            "type": "official",
            "reliability": 0.95
          }
        ],
        "verification_status": "verified",
        "verification_reasoning": "Found 2 sources with 1 verified sources",
        "research_summary": "Nike Lip Gloss is a beauty product line owned and marketed directly by Nike, Inc., the publicly traded parent company (NYSE: NKE). Nike, Inc. is incorporated in Oregon, USA and maintains direct control over its beauty and personal care products division. No recent ownership changes or acquisitions were found related to this product line.",
        "data_quality": {
          "completeness": 0.5,
          "recency": 0.5,
          "consistency": 0.5
        },
        "debug_info": {
          "research_rounds": 1,
          "best_round": "registry_research",
          "strategy_used": {
            "primary_approach": "registry_research",
            "secondary_approaches": [
              "news_research",
              "corporate_structure"
            ],
            "language_priority": [
              "en"
            ],
            "registry_focus": [],
            "legal_suffixes": [
              "Inc.",
              "Corp.",
              "LLC"
            ],
            "industry_keywords": [
              "cosmetics",
              "beauty",
              "consumer goods",
              "retail",
              "sportswear"
            ]
          }
        },
        "research_method": "llm_first_research",
        "total_sources": 2,
        "notes": "Nike Lip Gloss is a beauty product line owned and marketed directly by Nike, Inc., the publicly traded parent company (NYSE: NKE). Nike, Inc. is incorporated in Oregon, USA and maintains direct control over its beauty and personal care products division. No recent ownership changes or acquisitions were found related to this product line.",
        "trusted_sources": [
          {
            "name": "SEC EDGAR Database",
            "url": "https://www.sec.gov/edgar/browse/?CIK=320187",
            "type": "registry",
            "reliability": 0.99
          }
        ],
        "verified_sources": [
          {
            "name": "SEC EDGAR Database",
            "url": "https://www.sec.gov/edgar/browse/?CIK=320187",
            "type": "registry",
            "reliability": 0.99
          }
        ],
        "highly_likely_sources": [
          {
            "name": "SEC EDGAR Database",
            "url": "https://www.sec.gov/edgar/browse/?CIK=320187",
            "type": "registry",
            "reliability": 0.99
          },
          {
            "name": "Nike Official Website",
            "url": "https://about.nike.com",
            "type": "official",
            "reliability": 0.95
          }
        ]
      },
      "reasoning": "LLM-first research provided high-confidence ownership determination"
    },
    "ownership_analysis": {
      "success": true,
      "data": {
        "financial_beneficiary": "Nike, Inc.",
        "confidence_score": 97,
        "ownership_flow": [
          {
            "name": "Nike Lip Gloss",
            "role": "Unknown",
            "country": "United States",
            "flag": "🏳️",
            "ultimate": false,
            "sources": []
          },
          {
            "name": "Nike, Inc.",
            "role": "Unknown",
            "country": "United States",
            "flag": "🏳️",
            "ultimate": false,
            "sources": []
          }
        ]
      },
      "reasoning": "Ownership analysis completed using LLM research results"
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
              "cacheKey": "nike::lip gloss"
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
          },
          {
            "id": "query_builder",
            "label": "Query Builder",
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
              "user": "Process the query_builder stage for ownership analysis."
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
                "brand": "Nike",
                "product_name": "Lip Gloss",
                "barcode": null,
                "hints": "{}",
                "rag_context": ""
              },
              "outputVariables": {},
              "intermediateVariables": {
                "rag_context_count": 0
              }
            },
            "outputVariables": {},
            "intermediateVariables": {},
            "durationMs": 0,
            "prompt": {
              "system": "You are an AI assistant helping with corporate ownership research.",
              "user": "Process the llm_first_analysis stage for ownership analysis."
            }
          },
          {
            "id": "web_research",
            "label": "Web Research",
            "inputVariables": {
              "inputVariables": {
                "brand": "Nike",
                "product_name": "Lip Gloss",
                "hints": "{}",
                "query_analysis": "[{\"query\":\"\\\"[object Object]\\\" parent company\",\"purpose\":\"find parent company information\",\"priority\":5,\"expected_sources\":[\"company websites\",\"financial news\"]},{\"query\":\"\\\"[object Object]\\\" ultimate owner\",\"purpose\":\"find ultimate ownership\",\"priority\":5,\"expected_sources\":[\"financial filings\",\"corporate registries\"]}]"
              },
              "outputVariables": {
                "success": true,
                "total_sources": 2,
                "ownership_chain_length": 2,
                "final_confidence": 0.95,
                "research_method": "llm_first_research",
                "notes": "Nike Lip Gloss is a beauty product line owned and marketed directly by Nike, Inc., the publicly traded parent company (NYSE: NKE). Nike, Inc. is incorporated in Oregon, USA and maintains direct control over its beauty and personal care products division. No recent ownership changes or acquisitions were found related to this product line."
              },
              "intermediateVariables": {
                "llm_research_available": true,
                "evidence_tracked": 2
              }
            },
            "outputVariables": {},
            "intermediateVariables": {},
            "durationMs": 0,
            "prompt": {
              "system": "You are an AI assistant helping with corporate ownership research.",
              "user": "Process the web_research stage for ownership analysis."
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
              "confidence": 97
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
  "headline": "Nike: The brand that owns itself 🇺🇸",
  "tagline": "Independent powerhouse headquartered in Oregon",
  "story": "Unlike many global brands that get acquired, Nike remains its own boss, operating as an independent public company since its 1964 founding.",
  "ownership_notes": [
    "Nike, Inc. is a publicly traded company on the NYSE",
    "Founded by Phil Knight and Bill Bowerman",
    "Maintains independence as its own parent company"
  ],
  "behind_the_scenes": [
    "High confidence match (97%) between brand and owner",
    "Brand and owner share same name, indicating self-ownership",
    "Limited location data in source, but Nike is known to be US-based"
  ],
  "narrative_template_used": "independent_company",
  "query_id": "query_1756462445369_ofcbwwyod"
}
```

---

*Generated by Extended Pipeline Verification Test Suite*
