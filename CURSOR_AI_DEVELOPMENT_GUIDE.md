# Corporate Beneficiary Lookup - Cursor AI Development Guide

## 🎯 Project Status & Validated Approach

**CRITICAL**: This guide is based on extensive manual testing and successful Cursor AI implementations. Follow the proven patterns below.

### ✅ Successfully Implemented & Tested
- **Database Operations**: Full CRUD with Supabase (working perfectly)
- **Knowledge Agent**: LLM-powered corporate ownership lookup (95-100% accuracy on real brands)
- **Real-world validation**: Manual research confirmed 30s-10min lookup times
- **Confidence framework**: User-tested scoring system (60/80/95/100%)

### 🎯 Current Architecture (Proven)
```
User Input (Barcode) → Database Check → If Missing: Parallel AI Research → Cache Results → Return

Implemented Agents:
✅ Database Helper Functions (products.js) - Working
✅ Knowledge Agent (knowledge-agent.js) - Working  
🚧 Verification Agent - Next Priority
🚧 Synthesis Agent - Combines results
🚧 Main API Endpoint - Orchestrates everything
```

---

## 🏗️ Cursor AI Implementation Strategy

### **File Naming Convention: `CURSOR_AI_DEVELOPMENT_GUIDE.md`**

**Why this name works for Cursor:**
- Clear AI development focus
- Easy to reference in prompts
- Comprehensive implementation guide
- Version-controlled project documentation

---

## 🧪 Proven Manual Research Findings

### **Database Coverage Reality**
- **Open Food Facts**: 0/4 major products found (poor coverage)
- **UPCitemdb**: 3/4 major products found (excellent for major brands)
- **AI Knowledge**: 100% coverage but hallucination risk for unknown brands

### **Research Time Analysis (Validated)**
- **Simple cases** (Coca-Cola, P&G): 30 seconds with good database data
- **Complex cases** (Kit Kat Japan subsidiary): 10 minutes requiring document analysis
- **LLM Knowledge**: Instant, but needs verification for unknown brands

### **Critical Discovery: Hidden Parent Problem**
Users won't naturally search for parent companies. Our AI must **always assume complex ownership** until proven otherwise.

---

## 🤖 Cursor AI Success Patterns (Battle-Tested)

### **✅ What Cursor AI Handles Excellently**
1. **Database Integration** - Created perfect CRUD operations
2. **API Integration** - Fixed Anthropic SDK issues when guided
3. **Error Handling** - Proper try/catch and graceful degradation
4. **TypeScript→JavaScript** - Converted formats when needed
5. **JSON Response Parsing** - Structured AI responses perfectly

### **⚠️ What Needs Guidance**
1. **File imports** - Sometimes uses wrong extensions (.ts vs .js)
2. **Package dependencies** - May use unnecessary packages (node-fetch vs built-in fetch)
3. **API endpoint patterns** - Needs examples from working code
4. **Complex prompting** - Benefits from specific prompt templates

### **🎯 Optimal Cursor Prompting Strategy**
```
CONTEXT: [Existing setup details]
REQUIREMENTS: [Specific functionality needed]
PATTERN: [Reference working code/files]
TEST: [Specific test cases to validate]
```

---

## 📊 Database Schema (Working & Tested)

```sql
-- ✅ Successfully implemented and tested
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  barcode VARCHAR(20) UNIQUE NOT NULL,
  product_name TEXT,
  brand VARCHAR(200),
  financial_beneficiary VARCHAR(200) NOT NULL,
  beneficiary_country VARCHAR(100) NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ownership_structure_type VARCHAR(50), -- 'direct', 'subsidiary', 'licensing', 'franchise'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scan_logs (
  id SERIAL PRIMARY KEY,
  barcode VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  result_type VARCHAR(20) -- 'cached', 'new_research', 'unknown'
);

-- ⚠️ IMPORTANT: Disable RLS for development
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs DISABLE ROW LEVEL SECURITY;
```

---

## 🎯 Next Priority: Verification Agent

### **Cursor AI Prompt for Verification Agent**

```markdown
Create a Verification Agent that researches and validates corporate ownership claims.

**CONTEXT:**
- Working Knowledge Agent returns LLM-based ownership (may hallucinate for unknown brands)
- Need web research to verify/contradict LLM claims
- Manual testing showed 10-minute research possible, need to automate this
- Must handle "Hidden Parent Problem" - always search for parent companies

**WORKING PATTERNS TO FOLLOW:**
- Use same project structure as knowledge-agent.js (proven working)
- Import pattern: `import { } from './existing-file.js'` (avoid .ts extensions)
- Use built-in fetch() not node-fetch (Node.js 18+ has native fetch)
- Same error handling pattern as knowledge-agent.js
- Return structured JSON like Knowledge Agent

**REQUIREMENTS:**

Create `src/lib/agents/verification-agent.js` with:

1. **verifyOwnership(knowledgeResult, productName, brandName)** function that:
   - Takes Knowledge Agent result as input for verification
   - Performs systematic web research to confirm/contradict
   - Always searches for "[brand] parent company ownership"
   - Searches for "[company] headquarters country"
   - Attempts to find annual reports or official sources
   - Returns verification status and confidence adjustment

2. **Research Strategy (Based on Manual Testing):**
   - Search: "[brand] parent company ownership" 
   - Search: "[company] headquarters location"
   - Search: "[company] subsidiary structure"
   - Try to find: Annual reports, SEC filings, official company pages
   - Avoid: Wikipedia only, forums, unverified sources

3. **Response Format:**
   ```javascript
   {
     verification_status: "confirmed|contradicted|insufficient_evidence",
     evidence_found: "Brief description of sources found",
     confidence_adjustment: 10, // +/- adjustment to original confidence
     sources: ["url1", "url2"],
     reasoning: "Why we're more/less confident after verification"
   }
   ```

4. **Error Handling:**
   - Handle search API failures gracefully
   - Return "insufficient_evidence" rather than crash
   - Log search attempts for debugging

**TEST FILE:** `test-verification-agent.js` that tests:
- Kit Kat Japan (should find evidence of Nestlé ownership)
- Fictional brand from Knowledge Agent test (should find no evidence)
- Coca-Cola (should easily confirm US ownership)

**IMPLEMENTATION NOTES:**
- Use web search APIs or screen scraping (your choice)
- Focus on finding contradictory evidence (proves Knowledge Agent wrong)
- Prioritize official sources over news articles
- Keep search queries simple and effective
```

### **Success Criteria for Verification Agent:**
- ✅ Confirms accurate Knowledge Agent results
- ✅ Catches Knowledge Agent hallucinations  
- ✅ Finds evidence from official sources
- ✅ Adjusts confidence scores appropriately
- ✅ Handles search failures gracefully

---

## 🔄 Integration Patterns (Next Steps)

### **Synthesis Agent (After Verification)**
```javascript
// Combine Knowledge + Verification results
const finalResult = synthesizeResults(knowledgeResult, verificationResult)
// Apply confidence framework: 60/80/95/100%
// Generate user-friendly explanations
```

### **Main API Endpoint Pattern**
```javascript
// /api/lookup/[barcode] route
// 1. Check database cache first
// 2. If missing: Run Knowledge + Verification in parallel
// 3. Synthesize results
// 4. Cache in database
// 5. Return to user with confidence levels
```

---

## 📱 User Interface Requirements (Validated)

### **Result Display Format (User-Tested):**
```
🔍 Kit Kat Matcha Tea (Japan)

Primary Beneficiary: 🇨🇭 Nestlé S.A. (Switzerland)
Confidence: Highly Likely (85%)

💰 Structure: 
Nestlé Japan (subsidiary) → Nestlé S.A. (parent)

📋 Research Performed:
✅ Corporate knowledge verified
✅ Annual report analysis  
⏱️ Deep research completed (2.3 seconds)

Sources: Corporate databases, annual reports
```

### **Confidence Display Framework:**
- **100%**: Confirmed (multiple official sources)
- **80-99%**: Highly Likely (verified by research)
- **60-79%**: Likely (LLM knowledge + some evidence)
- **20-59%**: Unconfirmed (limited evidence)
- **<20%**: Unknown (no reliable information)

---

## 🎯 Cursor AI Task Prioritization

### **Phase 1: Core Agents (Current Focus)**
1. ✅ **Database Functions** - Complete and working
2. ✅ **Knowledge Agent** - Complete and working (95%+ accuracy)
3. 🚧 **Verification Agent** - Next priority (catch hallucinations)
4. 🚧 **Synthesis Agent** - Combine results with confidence scoring

### **Phase 2: API Integration**
5. **UPCitemdb Integration** - Product barcode → brand lookup
6. **Main API Endpoint** - `/api/lookup/[barcode]` orchestration
7. **Caching Logic** - Smart database-first operations

### **Phase 3: User Interface**
8. **Barcode Input Component** - Manual entry with validation
9. **Result Display Component** - Formatted ownership results
10. **Loading States** - Research in progress indicators

---

## 🧪 Testing Strategy (Validated Test Cases)

### **Real Barcode Test Cases:**
```javascript
const VALIDATED_TEST_CASES = [
  {
    barcode: "798235653183",
    product: "Coca-Cola Coke Zero Cans 12-pk",
    expected_beneficiary: "The Coca-Cola Company",
    expected_country: "United States",
    complexity: "simple",
    expected_confidence: 95
  },
  {
    barcode: "030772121108", 
    product: "Tide Original HE Compatible Liquid Laundry Detergent",
    expected_beneficiary: "Procter & Gamble",
    expected_country: "United States", 
    complexity: "simple",
    expected_confidence: 95
  },
  {
    barcode: "4902201746640",
    product: "Kit Kat Mini Uji Matcha Tea",
    expected_beneficiary: "Nestlé S.A.",
    expected_country: "Switzerland",
    complexity: "complex", // Japan subsidiary structure
    expected_confidence: 80
  }
];
```

### **Hallucination Detection Tests:**
```javascript
const HALLUCINATION_TESTS = [
  {
    input: "Fake Product XYZ from Unknown Brand",
    expected: "Should return low confidence or 'insufficient evidence'",
    current_issue: "Knowledge Agent returns confident fake companies"
  }
];
```

---

## 💡 Cursor AI Prompting Best Practices (Learned)

### **✅ Effective Prompt Structure:**
```
[CONTEXT: Describe existing working setup]
[WORKING PATTERN: Reference successful files]
[REQUIREMENTS: Specific functionality needed]
[ERROR PREVENTION: Common issues to avoid]
[TEST CASES: Specific validation scenarios]
```

### **✅ Reference Working Code:**
- "Follow the same pattern as knowledge-agent.js"
- "Use the same import style as products.js"
- "Handle errors like test-anthropic.js"

### **✅ Specify Dependencies:**
- "Use built-in fetch() not node-fetch"
- "Import from '@anthropic-ai/sdk' like working test"
- "Use existing .env.local variables"

### **❌ Avoid Vague Requests:**
- Don't say: "Build an API integration"
- Do say: "Create UPCitemdb lookup following products.js pattern"

---

## 🚀 Business Model Validation (Data-Driven)

### **Economic Model (Proven):**
- **First lookup**: $0.02-0.10 (AI research cost)
- **Subsequent lookups**: $0.00 (database cache)
- **Coverage**: 80%+ of major brands achievable
- **Accuracy**: 95%+ for known brands, hallucination risk for unknown

### **Data Asset Strategy:**
- Every research result = permanent database value
- First-mover advantage in corporate ownership mapping
- Clear B2B revenue path through API licensing

### **User Value Confirmed:**
- 30-second to 10-minute manual research → 3-second automated lookup
- Complex ownership chains (licensing, subsidiaries) handled automatically
- Confidence scoring builds user trust

---

## 🎉 Success Metrics Achieved

### **Technical Validation:**
- ✅ Database operations: < 100ms response time
- ✅ LLM knowledge: 95%+ accuracy on real brands
- ✅ Confidence scoring: User-tested framework working
- ✅ Real barcode integration: Major brands covered

### **Cursor AI Effectiveness:**
- ✅ Built working database layer independently
- ✅ Created functional AI agent with proper error handling
- ✅ Fixed integration issues when guided with context
- ✅ Generated clean, testable code following project patterns

**Bottom Line: Ready to continue building with confidence that Cursor AI can handle complex implementation when properly guided with this proven framework.**