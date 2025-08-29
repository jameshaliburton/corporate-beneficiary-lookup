# Test Case: moose-milk-fallback

**Timestamp**: 2025-08-29T10:15:39.133Z  
**Category**: edge_case  
**Description**: Force fallback to web research

## ✅ Pipeline Summary

- **Input**: Moose Milk | Local Cream Liqueur
- **Confidence Score**: 85%
- **Success Flag**: ✅ true
- **Financial Beneficiary**: Sons of Kent Brewing Company
- **Response Time**: 29470ms
- **HTTP Status**: 200

## 🔍 Agent Trace Table

| Agent | Expected | Triggered | Status |
|-------|----------|-----------|--------|
| cache_check | ✅ | ✅ | ✅ |
| sheets_mapping | ✅ | ✅ | ✅ |
| static_mapping | ✅ | ✅ | ✅ |
| rag_retrieval | ✅ | ✅ | ✅ |
| query_builder | ✅ | ✅ | ✅ |
| llm_first_analysis | ✅ | ✅ | ✅ |
| web_research | ✅ | ✅ | ✅ |
| database_save | ✅ | ✅ | ✅ |


**Agent Coverage**: 100.0%

## 📦 Cache Behavior

- **Cache Checked**: ✅ Yes
- **Cache Key**: moose milk::local cream liqueur
- **Cache Hit**: ❌ No
- **Cache Write**: ✅ Yes
- **Cache Payload**: {
  "brand": "Moose Milk",
  "product": "Local Cream Liqueur",
  "beneficiary": "Sons of Kent Brewing Company",
  "confidence": 85
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
- **Trace ID**: query_1756462476744_4g7bi38v2
- **Timestamp**: 2025-08-29T10:15:06.205Z

## 📊 Raw Response Data

```json
{
  "success": true,
  "product_name": "Local Cream Liqueur",
  "brand": "Moose Milk",
  "barcode": null,
  "financial_beneficiary": "Sons of Kent Brewing Company",
  "beneficiary_flag": "🏳️",
  "confidence_score": 85,
  "ownership_flow": [
    {
      "name": "Moose Milk Ltd.",
      "role": "Unknown",
      "country": "Canada",
      "flag": "🏳️",
      "ultimate": false,
      "sources": []
    },
    {
      "name": "Sons of Kent Brewing Company",
      "role": "Unknown",
      "country": "Canada",
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
        "brand": "Moose Milk",
        "product_name": "Local Cream Liqueur",
        "ownership_chain": [
          {
            "name": "Moose Milk Ltd.",
            "role": "Brand",
            "country": "Canada",
            "flag": "🇨🇦",
            "ultimate": false,
            "sources": [
              {
                "url": "https://www.ic.gc.ca/app/scr/cc/CorporationsCanada/fdrlCrpSrch.html",
                "name": "Canada Business Registry",
                "type": "registry",
                "confidence": 0.9,
                "tier": 1
              },
              {
                "url": "https://www.lcbo.com",
                "name": "LCBO Product Listing",
                "type": "official",
                "confidence": 0.85,
                "tier": 2
              },
              {
                "url": "https://www.sonsofkent.ca",
                "name": "Sons of Kent Company Website",
                "type": "official",
                "confidence": 0.8,
                "tier": 2
              }
            ]
          },
          {
            "name": "Sons of Kent Brewing Company",
            "role": "Parent",
            "country": "Canada",
            "flag": "🇨🇦",
            "ultimate": true,
            "sources": [
              {
                "url": "https://www.ic.gc.ca/app/scr/cc/CorporationsCanada/fdrlCrpSrch.html",
                "name": "Canada Business Registry",
                "type": "registry",
                "confidence": 0.9,
                "tier": 1
              },
              {
                "url": "https://www.lcbo.com",
                "name": "LCBO Product Listing",
                "type": "official",
                "confidence": 0.85,
                "tier": 2
              },
              {
                "url": "https://www.sonsofkent.ca",
                "name": "Sons of Kent Company Website",
                "type": "official",
                "confidence": 0.8,
                "tier": 2
              }
            ]
          }
        ],
        "final_confidence": 0.85,
        "sources": [
          {
            "name": "Canada Business Registry",
            "url": "https://www.ic.gc.ca/app/scr/cc/CorporationsCanada/fdrlCrpSrch.html",
            "type": "registry",
            "reliability": 0.9
          },
          {
            "name": "LCBO Product Listing",
            "url": "https://www.lcbo.com",
            "type": "official",
            "reliability": 0.85
          },
          {
            "name": "Sons of Kent Company Website",
            "url": "https://www.sonsofkent.ca",
            "type": "official",
            "reliability": 0.8
          }
        ],
        "verification_status": "verified",
        "verification_reasoning": "Found 3 sources with 1 verified sources",
        "research_summary": "Moose Milk cream liqueur is produced and owned by Sons of Kent Brewing Company, based in Chatham, Ontario, Canada. The product is registered under Moose Milk Ltd. as a subsidiary brand, but ultimate ownership remains with Sons of Kent Brewing Company. The company maintains active registration status in Canadian business records.",
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
              "Ltd.",
              "Inc.",
              "Corp."
            ],
            "industry_keywords": [
              "beverages",
              "alcohol",
              "dairy",
              "spirits"
            ]
          }
        },
        "research_method": "llm_first_research",
        "total_sources": 3,
        "notes": "Moose Milk cream liqueur is produced and owned by Sons of Kent Brewing Company, based in Chatham, Ontario, Canada. The product is registered under Moose Milk Ltd. as a subsidiary brand, but ultimate ownership remains with Sons of Kent Brewing Company. The company maintains active registration status in Canadian business records.",
        "trusted_sources": [
          {
            "name": "Canada Business Registry",
            "url": "https://www.ic.gc.ca/app/scr/cc/CorporationsCanada/fdrlCrpSrch.html",
            "type": "registry",
            "reliability": 0.9
          }
        ],
        "verified_sources": [
          {
            "name": "Canada Business Registry",
            "url": "https://www.ic.gc.ca/app/scr/cc/CorporationsCanada/fdrlCrpSrch.html",
            "type": "registry",
            "reliability": 0.9
          }
        ],
        "highly_likely_sources": [
          {
            "name": "Canada Business Registry",
            "url": "https://www.ic.gc.ca/app/scr/cc/CorporationsCanada/fdrlCrpSrch.html",
            "type": "registry",
            "reliability": 0.9
          },
          {
            "name": "LCBO Product Listing",
            "url": "https://www.lcbo.com",
            "type": "official",
            "reliability": 0.85
          },
          {
            "name": "Sons of Kent Company Website",
            "url": "https://www.sonsofkent.ca",
            "type": "official",
            "reliability": 0.8
          }
        ]
      },
      "reasoning": "LLM-first research provided high-confidence ownership determination"
    },
    "ownership_analysis": {
      "success": true,
      "data": {
        "financial_beneficiary": "Sons of Kent Brewing Company",
        "confidence_score": 85,
        "ownership_flow": [
          {
            "name": "Moose Milk Ltd.",
            "role": "Unknown",
            "country": "Canada",
            "flag": "🏳️",
            "ultimate": false,
            "sources": []
          },
          {
            "name": "Sons of Kent Brewing Company",
            "role": "Unknown",
            "country": "Canada",
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
              "cacheKey": "moose milk::local cream liqueur"
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
                "brand": "Moose Milk",
                "product_name": "Local Cream Liqueur",
                "barcode": null,
                "hints": "{}",
                "rag_context": ""
              },
              "outputVariables": {
                "financial_beneficiary": "Unknown Local Producer",
                "beneficiary_country": "Canada",
                "ownership_structure_type": "Private Company/Small Business",
                "confidence_score": 40,
                "reasoning": "This analysis is based on several factors: 1) Moose Milk is a cream liqueur product that appears to be locally produced, given its name and category. 2) The name 'Moose Milk' suggests Canadian origin, as it's a reference to a traditional Canadian military drink. 3) Without a barcode or additional identifying information, and given the nature of the product as a cream liqueur, this is likely a small-scale or local production rather than a major corporate brand. 4) The confidence score is low because without more specific identifying information, we cannot definitively determine the exact producer or verify corporate ownership. Many craft and local spirits producers operate as independent businesses or small private companies. The ownership structure is likely simple, with the brand being directly owned by its producer, but without more information, we cannot make a more detailed determination.",
                "ownership_flow": [
                  {
                    "name": "Moose Milk",
                    "type": "Brand",
                    "country": "Canada",
                    "source": "product category analysis"
                  },
                  {
                    "name": "Unknown Local Producer",
                    "type": "Ultimate Owner",
                    "country": "Canada",
                    "source": "market analysis"
                  }
                ]
              },
              "intermediateVariables": {
                "rag_context_count": 0,
                "llm_response_length": 1411,
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
          },
          {
            "id": "web_research",
            "label": "Web Research",
            "inputVariables": {
              "inputVariables": {
                "brand": "Moose Milk",
                "product_name": "Local Cream Liqueur",
                "hints": "{}",
                "query_analysis": "[{\"query\":\"\\\"[object Object]\\\" parent company\",\"purpose\":\"find parent company information\",\"priority\":5,\"expected_sources\":[\"company websites\",\"financial news\"]},{\"query\":\"\\\"[object Object]\\\" ultimate owner\",\"purpose\":\"find ultimate ownership\",\"priority\":5,\"expected_sources\":[\"financial filings\",\"corporate registries\"]}]"
              },
              "outputVariables": {
                "success": true,
                "total_sources": 3,
                "ownership_chain_length": 2,
                "final_confidence": 0.85,
                "research_method": "llm_first_research",
                "notes": "Moose Milk cream liqueur is produced and owned by Sons of Kent Brewing Company, based in Chatham, Ontario, Canada. The product is registered under Moose Milk Ltd. as a subsidiary brand, but ultimate ownership remains with Sons of Kent Brewing Company. The company maintains active registration status in Canadian business records."
              },
              "intermediateVariables": {
                "llm_research_available": true,
                "evidence_tracked": 3
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
              "beneficiary": "Sons of Kent Brewing Company",
              "confidence": 85
            },
            "outputVariables": {
              "success": true,
              "beneficiary": "Sons of Kent Brewing Company"
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
  "headline": "Moose Milk's local craft beer connection",
  "tagline": "Crafted by Sons of Kent Brewing Company",
  "story": "Moose Milk is produced by independent craft brewer Sons of Kent Brewing Company, though we're still researching their exact location and ownership structure.",
  "ownership_notes": [
    "85% confidence in ownership connection",
    "Location data currently unavailable",
    "Appears to be a craft brewing relationship"
  ],
  "behind_the_scenes": [
    "Limited ownership data available",
    "Company appears to be independent but needs verification",
    "Further research needed for complete ownership picture"
  ],
  "narrative_template_used": "limited_data_local",
  "query_id": "query_1756462476744_4g7bi38v2"
}
```

---

*Generated by Extended Pipeline Verification Test Suite*
