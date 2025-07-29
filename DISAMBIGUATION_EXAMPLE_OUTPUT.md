# Disambiguation Example Output

When two or more companies share the same/similar name, the pipeline returns the best guess PLUS an `alternatives[]` array with confidence scores, reasoning, and verification status.

## Example: "OK Snacks" (Denmark)

**Scenario**: User searches for "OK Snacks" with context "pork rinds from Denmark". The pipeline finds multiple companies with "OK" in their name and must disambiguate.

### Output Structure

```json
{
  "ownership_chain": [
    {
      "name": "OK Snacks A/S",
      "role": "Brand",
      "country": "Denmark",
      "sources": [
        {
          "url": "https://www.oksnacks.dk/about",
          "title": "About OK Snacks A/S",
          "date": "2024-01-15",
          "tier": 1,
          "confidence": 0.95
        }
      ]
    },
    {
      "name": "Kims A/S",
      "role": "Parent",
      "country": "Denmark",
      "sources": [
        {
          "url": "https://www.kims.dk/brands",
          "title": "Kims Brands - OK Snacks",
          "date": "2024-03-01",
          "tier": 1,
          "confidence": 0.92
        }
      ]
    },
    {
      "name": "Orkla ASA",
      "role": "Ultimate Owner",
      "country": "Norway",
      "sources": [
        {
          "url": "https://www.orkla.com/brands/kims/",
          "title": "Orkla - Kims",
          "date": "2024-02-20",
          "tier": 1,
          "confidence": 0.98
        }
      ]
    }
  ],
  "alternatives": [
    {
      "name": "OK Benzin A/S",
      "role": "Alternative Company",
      "country": "Denmark",
      "confidence": 0.6,
      "reason": "Shares 'OK' prefix and is also based in Denmark, but operates in the energy/fuel industry, not food. No direct link to 'snacks' found.",
      "sources": [
        "https://www.ok.dk/om-ok",
        "https://cvr.dk/virksomhed/ok-benzin-as"
      ]
    },
    {
      "name": "OK Foods (US)",
      "role": "Alternative Company",
      "country": "United States",
      "confidence": 0.4,
      "reason": "Matches 'OK' and 'Foods' but is based in the US and primarily a poultry producer. No connection to Danish 'OK Snacks' found.",
      "sources": [
        "https://www.okfoods.com/about-us"
      ]
    }
  ],
  "reasoning_steps": [
    {
      "step": "Initial search for 'OK Snacks' parent company and ultimate owner, prioritizing Danish sources due to context hints.",
      "conclusion": "Identified OK Snacks A/S as a Danish company, with strong indications of ownership by Kims A/S.",
      "evidence_sources": ["virk.dk", "oksnacks.dk"]
    },
    {
      "step": "Cross-referenced Kims A/S ownership and found it is a subsidiary of Orkla ASA, a Norwegian conglomerate.",
      "conclusion": "Established the ownership chain: OK Snacks A/S → Kims A/S → Orkla ASA.",
      "evidence_sources": ["kims.dk", "orkla.com"]
    },
    {
      "step": "Evaluated other companies with 'OK' in their name, specifically 'OK Benzin A/S' (Denmark) and 'OK Foods' (US).",
      "conclusion": "Determined these are distinct entities in different industries (fuel, poultry) with no direct relation to the 'OK Snacks' brand, but included them as alternatives due to name similarity and shared country (for OK Benzin).",
      "evidence_sources": ["ok.dk", "okfoods.com"]
    }
  ],
  "overall_confidence": 0.95,
  "verification_status": "verified",
  "confidence_explanation": "Ownership verified through multiple Tier 1 sources including official company websites (oksnacks.dk, kims.dk, orkla.com) and Danish corporate registry (virk.dk). The ownership chain is clear and consistently reported. Disambiguation was successful by confirming industry and geographic differences for similarly named entities.",
  "disambiguation_notes": "Successfully identified and differentiated 'OK Snacks A/S' (food) from 'OK Benzin A/S' (fuel) both in Denmark, and 'OK Foods' (US poultry). The primary brand's industry and country context were crucial for accurate disambiguation.",
  "notes": "OK Snacks is a well-known Danish snack brand, part of the Orkla Foods portfolio.",
  "research_summary": "Found 3 high-confidence sources out of 5 total sources. Searched: corporate registry, company websites, financial news."
}
```

## Key Features Demonstrated

1. **Primary Ownership Chain**: The most likely ownership structure based on evidence
2. **Alternatives Array**: Other companies with similar names, ranked by relevance
3. **Confidence Scoring**: Each alternative has a confidence score (0.0-1.0)
4. **Reasoning**: Clear explanation of why each alternative was considered/rejected
5. **Verification Status**: Overall confidence level and verification status
6. **Disambiguation Notes**: Summary of how the disambiguation was performed
7. **Research Summary**: What was searched and what was found

## When Ambiguity Remains

If the pipeline cannot definitively determine the correct company, it will:

- Return the **best guess** as the primary ownership chain
- Set `verification_status` to `"needs_verification"`
- Include all relevant alternatives with detailed reasoning
- Provide clear guidance on what additional information would help resolve the ambiguity 