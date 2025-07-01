# ✅ Comprehensive Test Checklist for OwnedBy Product Ownership Workflow

## 📋 TEST EXECUTION CHECKLIST

### Pre-Test Setup
- [ ] Development server running on `http://localhost:3000`
- [ ] All environment variables configured (Supabase, Anthropic, Google, etc.)
- [ ] Database tables created and accessible
- [ ] Test data populated in `ownership_mappings` table
- [ ] Evaluation framework accessible (Google Sheets API working)

---

## 🎯 PRIMARY FUNCTIONAL WORKFLOWS

### 1. Camera Input Flow
- [ ] **T001**: App launches with clean UI and single CTA
- [ ] **T002**: Camera activation works without permission issues
- [ ] **T003**: Photo capture succeeds and passes to OCR
- [ ] **T004**: Camera permission denied handled gracefully
- [ ] **T005**: Invalid image format handled with error message

### 2. OCR + Brand/Company Extraction
- [ ] **T006**: OCR extracts text from clear product images
- [ ] **T007**: Brand disambiguation agent identifies brand_name correctly
- [ ] **T008**: Company extraction works for "a Unilever brand" patterns
- [ ] **T009**: Distributor detection works for "Distributed by..." patterns
- [ ] **T010**: High confidence results proceed to ownership research
- [ ] **T011**: Low confidence triggers fallback mechanisms
- [ ] **T012**: Ambiguous results trigger clarification prompts

### 3. Vision Agent Fallback (Claude 3/GPT-4 Vision)
- [ ] **T013**: Vision agent activates when OCR confidence < threshold
- [ ] **T014**: Logo detection works on brand logos
- [ ] **T015**: Brand inference from packaging context
- [ ] **T016**: Vision results re-enter pipeline correctly
- [ ] **T017**: Vision timeout handled gracefully
- [ ] **T018**: Vision API errors don't crash the flow

### 4. Manual Input Fallback
- [ ] **T019**: Manual entry modal appears when automated methods fail
- [ ] **T020**: Partial data pre-fills manual form
- [ ] **T021**: Manual input requires brand_name and product_name
- [ ] **T022**: Manual entries logged with correct metadata
- [ ] **T023**: User can cancel manual entry and restart

### 5. Cache Check Layer
- [ ] **T024**: Products table checked by barcode before research
- [ ] **T025**: Ownership mappings checked by brand/company
- [ ] **T026**: Cached results return with `result_type: "cached"`
- [ ] **T027**: Cache miss triggers full research pipeline
- [ ] **T028**: Cache disabled mode bypasses cache checks

### 6. Query Builder + Ownership Research
- [ ] **T029**: Query builder generates relevant search queries
- [ ] **T030**: Web research agent finds ownership sources
- [ ] **T031**: Ownership research agent processes sources correctly
- [ ] **T032**: Confidence scores attached to results
- [ ] **T033**: Source URLs and reasoning included
- [ ] **T034**: Context from earlier steps used in queries

### 7. Evaluation + Logging
- [ ] **T035**: Every lookup logs to evaluation framework
- [ ] **T036**: Trace information included in logs
- [ ] **T037**: Confidence and sources recorded
- [ ] **T038**: Comparison against known mappings works
- [ ] **T039**: Google Sheets logging functional

---

## 💥 FAILURE MODE TESTING

### Camera & Image Handling
- [ ] **E001**: Camera permissions denied → Shows permission prompt
- [ ] **E002**: Image too dark/blurry → Prompts for better photo
- [ ] **E003**: Image too small/cropped → Requests full product view
- [ ] **E004**: No camera available → Falls back to file upload

### OCR & Vision Failures
- [ ] **E005**: OCR returns partial text → Vision fallback triggered
- [ ] **E006**: OCR returns irrelevant text → Manual entry prompted
- [ ] **E007**: Vision API timeout → Graceful fallback to manual
- [ ] **E008**: Vision returns malformed response → Error handling

### Database & API Failures
- [ ] **E009**: Supabase connection fails → Shows offline mode
- [ ] **E010**: OpenCorporates 401 error → Continues with other sources
- [ ] **E011**: Google API rate limits → Implements backoff strategy
- [ ] **E012**: Serper API fails → Falls back to alternative search

### Research Agent Failures
- [ ] **E013**: Web research finds no results → Returns "Unknown" gracefully
- [ ] **E014**: Ownership agent returns invalid JSON → Parses partial data
- [ ] **E015**: Agent timeout → Shows progress and eventual timeout message
- [ ] **E016**: Multiple conflicting sources → Shows confidence ranges

### User Experience Failures
- [ ] **E017**: User backs out mid-flow → State resets properly
- [ ] **E018**: User submits empty manual form → Validation errors shown
- [ ] **E019**: Network disconnected → Offline mode or retry options
- [ ] **E020**: Session timeout → Graceful re-authentication

---

## 📊 TRACE & DEBUGGING VALIDATION

### Execution Trace Requirements
- [ ] **D001**: Every scan produces `agent_execution_trace[]`
- [ ] **D002**: Trace includes `step_name`, `start_time`, `duration_ms`
- [ ] **D003**: Each step has `result`, `confidence`, `source`
- [ ] **D004**: Fallback reasons logged when applicable
- [ ] **D005**: Result type correctly set: "cached", "ocr", "vision", "user_input", "ai_research"

### Confidence & Quality Metrics
- [ ] **D006**: Confidence scores range from 0-100
- [ ] **D007**: Source quality metadata attached
- [ ] **D008**: Low confidence results flagged for HITL review
- [ ] **D009**: Source URLs validated and accessible
- [ ] **D010**: Reasoning text provides clear explanation

---

## 📈 UX BEHAVIORAL VALIDATION

### Progress & Feedback
- [ ] **U001**: Clear progress indicators during processing
- [ ] **U002**: Step-by-step status updates ("Analyzing image", "Running research")
- [ ] **U003**: Progressive disclosure of fallback options
- [ ] **U004**: Vision fallback only shown after OCR fails
- [ ] **U005**: Manual entry only shown after automated methods fail

### Results Display
- [ ] **U006**: High confidence results show ownership trail
- [ ] **U007**: Medium confidence shows reasoning and warnings
- [ ] **U008**: Low confidence prompts for verification
- [ ] **U009**: Unknown ownership shows friendly explanation
- [ ] **U010**: Sources and confidence clearly displayed

### Error Handling UX
- [ ] **U011**: Error messages are user-friendly, not technical
- [ ] **U012**: Retry options provided for transient failures
- [ ] **U013**: Help text guides users through manual entry
- [ ] **U014**: Loading states prevent multiple submissions
- [ ] **U015**: Success/failure states clearly indicated

---

## 🧪 SPECIFIC TEST SCENARIOS

### T001: Cached Barcode Hit
```javascript
Input: { barcode: '7318690077503' }
Expected: result_type === 'cached', confidence >= 80
Flow: cache_check → cached_result
```

### T002: OCR Success Path
```javascript
Input: { imageText: 'Ben & Jerry\'s Chunky Monkey' }
Expected: result_type === 'ai_research', brand identified
Flow: ocr_extraction → brand_disambiguation → ownership_research
```

### T003: Vision Fallback
```javascript
Input: { image: blurry_image, simulateOCRFailure: true }
Expected: result_type === 'vision_enhanced'
Flow: ocr_failure → vision_fallback → ownership_research
```

### T004: Manual Entry
```javascript
Input: { brand: 'Tesla', product: 'Model S' }
Expected: result_type === 'user_input', manual_disambiguation: true
Flow: manual_entry → ownership_research
```

### T005: Unknown Ownership
```javascript
Input: { brand: 'LocalCraftBrand2024' }
Expected: financial_beneficiary === 'Unknown', reasoning provided
Flow: ownership_research → unknown_result
```

### T006: Multiple Brands
```javascript
Input: { imageText: 'Distributed by Unilever for Ben & Jerry\'s' }
Expected: requires_disambiguation === true
Flow: ocr_extraction → brand_disambiguation → clarification_prompt
```

### T007: API Failure
```javascript
Input: { brand: 'Nike', simulateAgentFailure: true }
Expected: error handled gracefully, trace shows failure point
Flow: ownership_research → agent_failure → error_handling
```

### T008: Evaluation Logging
```javascript
Input: { brand: 'Nike', enable_evaluation: true }
Expected: Google Sheets row created with trace data
Flow: ownership_research → evaluation_logging
```

---

## 🚀 AUTOMATED TEST EXECUTION

### Test Commands
```bash
# Run comprehensive test suite
node test-comprehensive-ux-workflow.js

# Run with test controls for failure simulation
node test-dev-controls.js batch

# Run specific scenario
node test-dev-controls.js batch vision_only

# Generate test report
node test-comprehensive-ux-workflow.js --report
```

### Expected Success Criteria
- [ ] **90%+ test pass rate** for primary workflows
- [ ] **100% graceful handling** of failure modes
- [ ] **All traces logged** with required fields
- [ ] **UX states tested** and working correctly
- [ ] **Performance within limits** (< 30s for complex research)

---

## 📝 TEST COMPLETION REPORT

### Test Summary
- **Total Tests Executed**: ___/80
- **Passed**: ___
- **Failed**: ___
- **Skipped**: ___
- **Success Rate**: ___%

### Critical Issues Found
- [ ] Issue 1: _________________________________
- [ ] Issue 2: _________________________________
- [ ] Issue 3: _________________________________

### Performance Metrics
- **Average Response Time**: ___ms
- **95th Percentile**: ___ms
- **Cache Hit Rate**: ___%
- **Agent Success Rate**: ___%

### Recommendations
- [ ] Recommendation 1: _______________________
- [ ] Recommendation 2: _______________________
- [ ] Recommendation 3: _______________________

---

## 🎯 PRODUCTION READINESS CHECKLIST

- [ ] All primary workflows tested and passing
- [ ] All failure modes handled gracefully
- [ ] Performance meets requirements
- [ ] Security validations passed
- [ ] User experience tested across devices
- [ ] Monitoring and logging functional
- [ ] Error tracking configured
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Deployment pipeline tested

**Test Sign-off**: ________________ **Date**: ________________ 