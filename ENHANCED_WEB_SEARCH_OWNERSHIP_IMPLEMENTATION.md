# Enhanced Web-Search-Powered Ownership Agent Implementation

## Overview

This implementation refactors the ownership retrieval agent to support an **LLM-led, web-search-powered approach** for global brand ownership resolution, while still integrating authoritative sources and transparent reporting.

## Key Features Implemented

### ✅ 1. Always Attempt Web Search First
- **Enhanced Web Search Agent**: `EnhancedWebSearchOwnershipAgent` always performs web search as the primary method
- **Multi-language Query Generation**: Supports global brands with language detection and translation
- **Fallback Chain**: Enhanced → Original → Legacy web research

### ✅ 2. Extract Ownership Information Only from Explicit Mentions
- **Structured LLM Analysis**: Uses Claude 3.5 Sonnet to analyze web search results
- **Explicit Evidence Requirement**: Only extracts ownership information that is explicitly mentioned in sources
- **Source Validation**: Validates each source for explicit ownership statements

### ✅ 3. Tiered Confidence System
- **Authority Tiers**:
  - Tier 1 (0.9-1.0): Official corporate registry, investor relations, Wikipedia/Wikidata
  - Tier 2 (0.7-0.9): Reuters, Bloomberg, FT, CNBC, Crunchbase, PitchBook
  - Tier 3 (0.5-0.7): Local media, trade publications
  - Tier 4 (0.3-0.5): Brand's own About page, low-authority blogs/forums
- **Recency Scoring**: Newer sources get higher confidence
- **Explicit Mention Bonus**: Sources with clear ownership statements get higher scores

### ✅ 4. Structured JSON Output
- **Ownership Chain**: Complete chain from brand to ultimate owner
- **Source Attribution**: Each entity includes specific URLs, dates, and confidence scores
- **Conflict Resolution**: Handles conflicting information with highest-confidence wins
- **Notes Field**: Includes uncertainty, limitations, and "Limited Verified Information" labels

## Implementation Details

### File Structure
```
src/lib/agents/
├── enhanced-web-search-ownership-agent.js    # New enhanced agent
├── enhanced-ownership-research-agent.js      # Updated to use enhanced agent
├── web-search-ownership-agent.js             # Original agent (fallback)
└── web-research-agent.js                     # Legacy web research
```

### Core Components

#### 1. Enhanced Web Search Ownership Agent (`enhanced-web-search-ownership-agent.js`)

**Key Functions:**
- `EnhancedWebSearchOwnershipAgent()`: Main entry point
- `generateMultiLanguageQueries()`: Creates search queries in multiple languages
- `performEnhancedLLMAnalysis()`: LLM-led analysis with structured confidence
- `validateAndStructureResults()`: Validates and structures results with conflict resolution
- `calculateTieredConfidence()`: Implements tiered confidence system

**Multi-language Support:**
- Language detection from brand names (Chinese, Japanese, Korean, Arabic, Cyrillic, Hindi, Thai)
- Query translation for global brands
- Country-specific query generation

**Search Query Strategy:**
```javascript
const baseQueries = [
  `"${brand}" parent company`,
  `"${brand}" ultimate owner`,
  `"${brand}" acquired by`,
  `"${brand}" owner site:wikipedia.org`,
  `"${brand}" corporate structure`,
  `"${brand}" subsidiary of`,
  `"${brand}" owned by site:bloomberg.com`,
  `"${brand}" owned by site:reuters.com`,
  // ... more queries
]
```

#### 2. Enhanced Ownership Research Agent Integration

**Updated Flow:**
1. **Enhanced Agent First**: Tries `EnhancedWebSearchOwnershipAgent`
2. **Original Agent Fallback**: Falls back to `WebSearchOwnershipAgent`
3. **Legacy Research**: Falls back to `WebResearchAgent`
4. **Knowledge Agent**: Final fallback

**Structured Output Conversion:**
- `convertStructuredOwnershipChain()`: Converts structured chain to expected format
- `determineOwnershipStructureType()`: Determines ownership structure type
- `calculateSourceAuthorityScore()`: Calculates authority-based confidence
- `calculateSourceRecencyScore()`: Calculates recency-based confidence

### Confidence Scoring System

#### Tiered Authority Scoring
```javascript
const tierWeights = {
  1: 1.0,   // Tier 1 sources get full weight
  2: 0.8,   // Tier 2 sources get 80% weight
  3: 0.6,   // Tier 3 sources get 60% weight
  4: 0.4    // Tier 4 sources get 40% weight
}
```

#### Confidence Calculation
```javascript
let finalConfidence = averageConfidence

// Boost confidence if we have multiple high-tier sources
if (highTierSources >= 2) {
  finalConfidence = Math.min(1.0, finalConfidence + 0.1)
}

// Reduce confidence if we have very few sources
if (totalSources < 2) {
  finalConfidence = Math.max(0.0, finalConfidence - 0.2)
}

// Reduce confidence if we have mostly low-tier sources
const lowTierRatio = (totalSources - highTierSources) / totalSources
if (lowTierRatio > 0.7) {
  finalConfidence = Math.max(0.0, finalConfidence - 0.15)
}
```

### Output Format

#### Structured Ownership Chain
```json
{
  "ownership_chain": [
    {
      "name": "Nabisco",
      "country": "United States",
      "role": "Brand",
      "sources": [
        {
          "url": "https://en.wikipedia.org/wiki/Nabisco",
          "title": "Nabisco - Wikipedia",
          "date": "2024-10-01",
          "tier": 1,
          "confidence": 0.9
        }
      ]
    },
    {
      "name": "Mondelez International",
      "country": "United States",
      "role": "Ultimate Owner",
      "sources": [
        {
          "url": "https://www.mondelezinternational.com/",
          "title": "Mondelez International – Investor Relations",
          "date": "2025-02-10",
          "tier": 1,
          "confidence": 0.95
        },
        {
          "url": "https://www.reuters.com/business/retail-consumer/mondelez-2025/",
          "title": "Mondelez expands global portfolio",
          "date": "2025-01-18",
          "tier": 2,
          "confidence": 0.85
        }
      ]
    }
  ],
  "final_confidence": 0.9,
  "notes": "Ownership confirmed via Wikipedia and Mondelez investor page. Kraft Foods is excluded as it is an outdated owner."
}
```

### Conflict Resolution

#### Entity Conflict Resolution
```javascript
function resolveEntityConflict(entities, role) {
  // Sort by average confidence of sources
  const entitiesWithConfidence = entities.map(entity => {
    const avgConfidence = entity.sources.reduce((sum, source) => sum + source.confidence, 0) / entity.sources.length
    return { ...entity, avgConfidence }
  })
  
  entitiesWithConfidence.sort((a, b) => b.avgConfidence - a.avgConfidence)
  
  const highestConfidence = entitiesWithConfidence[0]
  const hasConflict = entitiesWithConfidence.length > 1 && 
    (entitiesWithConfidence[1].avgConfidence > highestConfidence.avgConfidence * 0.8)
  
  return {
    entity: highestConfidence,
    hasConflict,
    reason: hasConflict ? 'Multiple high-confidence sources found, selected highest' : 'Clear winner based on confidence'
  }
}
```

## Testing

### Test Script: `test-enhanced-web-search-ownership.js`

**Test Cases:**
1. **Global Consumer Brand**: Nabisco (Oreo Cookies)
2. **European Brand**: L'Oreal (Paris Hair Care)
3. **Asian Brand**: Toyota (Camry Sedan)
4. **Independent Brand**: Patagonia (Outdoor Clothing)

**Validation Checks:**
- Environment availability
- Result structure validation
- Source tier distribution
- Confidence scoring
- Ownership chain completeness

## Acceptance Criteria Verification

### ✅ Always Attempt Web Search First
- Enhanced agent always performs web search unless cache contains verified chain
- Fallback chain ensures web search is attempted at some level

### ✅ Extract Only from Explicit Mentions
- LLM analysis specifically looks for explicit ownership statements
- Sources are validated for explicit ownership information
- Confidence scoring reflects explicit vs. indirect mentions

### ✅ Tiered Confidence System
- 4-tier authority system implemented
- Recency scoring included
- Explicit mention bonus applied
- "Limited Verified Information" label for low-tier sources

### ✅ Structured JSON Output
- Complete ownership chain with sources
- Specific URLs, dates, and authority tiers
- Conflict resolution with highest-confidence wins
- Notes field for uncertainty and limitations

### ✅ Multi-language Support
- Language detection from brand names
- Query translation for global brands
- Country-specific query generation
- Support for Chinese, Japanese, Korean, Arabic, Cyrillic, Hindi, Thai

### ✅ Outdated Owner Exclusion
- Explicit detection of outdated owners (e.g., Kraft Foods for Nabisco)
- Cross-referencing of acquisition dates
- Prioritization of latest ownership information

## Integration Points

### Enhanced Ownership Research Agent
- Primary integration point for the enhanced web-search-powered approach
- Fallback chain: Enhanced → Original → Legacy → Knowledge
- Structured output conversion for compatibility

### API Integration
- Maintains compatibility with existing API endpoints
- Enhanced confidence scoring and breakdown
- Improved source attribution and transparency

### Database Integration
- Caches enhanced ownership chains with source information
- Stores tiered confidence scores and breakdowns
- Maintains backward compatibility with existing data

## Performance Considerations

### Query Optimization
- Limits to 20 queries per research session
- Prioritizes high-authority sources
- Efficient multi-language query generation

### Caching Strategy
- Caches successful ownership chains
- Stores source information for future reference
- Maintains cache TTL for data freshness

### Error Handling
- Graceful fallback through agent chain
- Detailed error logging and tracing
- Recovery mechanisms for failed web searches

## Future Enhancements

### Planned Improvements
1. **Advanced Language Detection**: More sophisticated language detection algorithms
2. **Dynamic Query Generation**: AI-powered query optimization
3. **Real-time Source Validation**: Live source verification
4. **Enhanced Conflict Resolution**: More sophisticated conflict resolution algorithms
5. **Source Quality Metrics**: Additional quality indicators beyond tiers

### Scalability Considerations
- Horizontal scaling for web search agents
- Database optimization for large ownership chains
- Caching improvements for global brand coverage

## Conclusion

The enhanced web-search-powered ownership agent successfully implements all specified requirements:

1. **Always attempts web search first** with comprehensive multi-language support
2. **Extracts ownership information only from explicit mentions** with structured validation
3. **Uses tiered confidence system** based on authority, recency, and explicit mentions
4. **Returns structured JSON output** with complete source attribution and conflict resolution
5. **Supports global brands** with multi-language queries and detection
6. **Excludes outdated owners** with sophisticated conflict resolution

The implementation maintains backward compatibility while providing significantly enhanced accuracy, transparency, and global coverage for brand ownership research. 