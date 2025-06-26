# OwnedBy Pipeline & Dashboard Enhancement Implementation Plan

## Overview
This plan outlines the implementation of a robust, multi-stage product identification and ownership research pipeline with intelligent fallback, user-friendly UI, prompt management, and full traceability.

## 1. Backend Pipeline & Agent Updates

### 1.1 Pipeline Logic Flow
```
Barcode Scan → Cache Lookup → Parallel Barcode/Product DBs → Quality Agent
                                                              ↓
If insufficient data: OCR Extraction → Vision Agent → Manual Entry
                                                              ↓
Only proceed to Ownership Research if brand/company is confidently known
```

### 1.2 Agent Prompt Tool Updates
- **Add/Update Prompts:**
  - Vision agent prompt (for product/brand extraction from images)
  - Quality agent prompt (for semantic assessment of data sufficiency)
  - Ensure all prompts are editable and versioned in the prompt dashboard
- **Expose structured prompt objects in the dashboard (pretty-printed JSON, not [object Object])**
- **Allow prompt testing with sample inputs and show expected outputs**

### 1.3 Trace & Logging Enhancements
- **Log each pipeline stage:**
  - Input, output, confidence, reasoning, fallback triggers, and duration
- **Include vision agent and OCR steps in the trace**
- **Log when/why manual entry is triggered**
- **Store trace in a way that's queryable for dashboard visualization**

## 2. Frontend & Dashboard Updates

### 2.1 Result Screen Enhancements
- **Show full agent execution trace:**
  - Each step (barcode lookup, quality agent, OCR, vision agent, manual entry, ownership research)
  - Inputs, outputs, confidence scores, fallback reasons, and agent reasoning
- **Visualize pipeline as a timeline or stepper (with icons for each stage, color-coded by success/failure/confidence)**
- **Show any partial data found (e.g., "Beans from France") above manual entry form, pre-filled for correction**
- **Display confidence attribution and quality agent assessment clearly**
- **If manual/camera fallback is triggered, show a clear message explaining why**

### 2.2 Dashboard Views
- **Prompt Management:**
  - List all agent prompts (barcode, quality, vision, ownership, etc.)
  - Allow editing, versioning, and testing of prompts
  - Show prompt usage stats (e.g., how often each is used, average confidence)
- **Trace Explorer:**
  - Search/filter past agent traces by barcode, product, date, confidence, fallback reason, etc.
  - Visualize common failure points and fallback triggers
- **Metrics:**
  - Success rates per pipeline stage
  - Average time per stage
  - Manual entry/camera fallback rates
  - Confidence score distributions

## 3. Data Model & API Updates

### 3.1 API Response Structure
```json
{
  "agent_execution_trace": {
    "stages": [
      {
        "name": "barcode_lookup",
        "input": "...",
        "output": "...",
        "confidence": 85,
        "reasoning": "...",
        "duration_ms": 1200,
        "success": true
      },
      {
        "name": "quality_assessment",
        "input": "...",
        "output": "...",
        "confidence": 30,
        "reasoning": "Insufficient data for ownership research",
        "duration_ms": 800,
        "success": false,
        "fallback_reason": "low_confidence"
      }
    ],
    "fallback_triggers": ["low_confidence", "manual_entry_required"],
    "total_duration_ms": 5000
  }
}
```

### 3.2 Database Schema Updates
- Add fields for vision agent results
- Add fields for OCR results
- Add fields for fallback reasons
- Add fields for prompt versions

## 4. Implementation Phases

### Phase 1: Backend Pipeline Updates
1. Update lookup API route to include vision agent fallback
2. Enhance quality agent with better sufficiency checks
3. Update agent execution trace logging
4. Add vision agent prompt to prompt registry

### Phase 2: Frontend Result Screen
1. Update ProductResultScreen to show full pipeline trace
2. Add pipeline stepper visualization
3. Enhance manual entry form with partial data display
4. Add fallback reason messaging

### Phase 3: Dashboard Enhancements
1. Update prompt dashboard to handle structured prompts
2. Add trace explorer functionality
3. Add metrics and analytics views
4. Add prompt testing interface

### Phase 4: Testing & Documentation
1. Add comprehensive test scripts
2. Update documentation with new pipeline flow
3. Create user guides for new features

## 5. Technical Specifications

### 5.1 Vision Agent Integration
- Use GPT-4 Vision or Claude Opus for image analysis
- Extract product name, brand, and company information
- Return structured data with confidence scores
- Log all attempts and results

### 5.2 Quality Assessment Enhancement
- Semantic evaluation of data completeness
- Confidence scoring for ownership research readiness
- Clear fallback triggers and reasoning
- Integration with existing quality agent

### 5.3 Trace Visualization
- Timeline view of pipeline stages
- Color-coded success/failure indicators
- Expandable details for each stage
- Search and filter capabilities

## 6. Success Metrics

### 6.1 Pipeline Performance
- Reduction in manual entry requirements
- Improved confidence scores
- Faster resolution times
- Better user experience

### 6.2 Dashboard Usability
- Prompt management efficiency
- Trace analysis capabilities
- Metrics visibility
- User adoption rates

## 7. Risk Mitigation

### 7.1 Technical Risks
- Vision API costs and rate limits
- Performance impact of enhanced logging
- UI complexity management
- Data consistency across stages

### 7.2 Mitigation Strategies
- Implement cost controls for vision API
- Optimize logging and storage
- Progressive UI enhancement
- Comprehensive testing and validation

## 8. Timeline

### Week 1: Backend Foundation
- Pipeline logic updates
- Vision agent integration
- Enhanced trace logging

### Week 2: Frontend Core
- Result screen updates
- Pipeline visualization
- Manual entry enhancements

### Week 3: Dashboard Features
- Prompt management updates
- Trace explorer
- Metrics dashboard

### Week 4: Testing & Polish
- Comprehensive testing
- Documentation updates
- Performance optimization

## 9. Files to Modify

### Backend Files
- `src/app/api/lookup/route.ts`
- `src/lib/agents/quality-assessment-agent.js`
- `src/lib/agents/enhanced-trace-logging.js`
- `src/lib/agents/prompt-registry.js`

### Frontend Files
- `src/components/ProductResultScreen/index.tsx`
- `src/components/ProductResultScreen/Trace.tsx`
- `src/app/dashboard/prompts/page.tsx`
- `src/app/dashboard/page.tsx`

### New Files to Create
- `src/lib/agents/vision-agent.js`
- `src/components/PipelineStepper.tsx`
- `src/components/TraceExplorer.tsx`
- `src/components/PromptTester.tsx`

## 10. Testing Strategy

### 10.1 Unit Tests
- Agent functionality tests
- API endpoint tests
- Component rendering tests

### 10.2 Integration Tests
- End-to-end pipeline tests
- Dashboard functionality tests
- Cross-browser compatibility

### 10.3 Performance Tests
- API response times
- UI rendering performance
- Database query optimization

---

**Status**: Ready for implementation
**Priority**: High
**Dependencies**: None (can start immediately)

# Implementation Plan: Vision Agent Fallback Integration

## ✅ COMPLETED: UX Flow Redesign

### **1. Landing Screen Update** ✅
- **Status**: COMPLETED
- **Changes**: 
  - Removed immediate barcode scanner from landing page
  - Added "Take a Photo" as primary CTA with large button
  - Added fallback modal access via "Try manual or barcode entry" link
  - Updated headline to "Find out who really owns the products you buy"
- **Files Modified**: `src/app/page.tsx`

### **2. Enhanced Image Recognition Pipeline** ✅
- **Status**: COMPLETED
- **Flow**: OCR → Lightweight Brand Extractor → Quality Agent → Vision Agent (if needed)
- **Implementation**:
  - **Step 1**: OCR + Lightweight Brand Extractor (GPT-3.5-turbo for speed)
  - **Step 2**: Quality Assessment Agent (evaluates brand specificity, product clarity, confidence alignment)
  - **Step 3**: Vision Agent escalation (GPT-4o) if confidence < 70%
- **Files Modified**: 
  - `src/lib/apis/image-recognition.js` (complete rewrite)
  - `src/app/api/image-recognition/route.ts` (updated response format)

### **3. Fallback Modal Implementation** ✅
- **Status**: COMPLETED
- **Features**:
  - Accessible via "Try manual or barcode entry" link
  - Three options: Take Photo, Enter Manually, Scan Barcode
  - Proper state management and navigation
- **Files Modified**: `src/app/page.tsx`

### **4. Enhanced User Feedback** ✅
- **Status**: COMPLETED
- **Improvements**:
  - Detailed image processing states showing 3-step flow
  - Better error handling and user messaging
  - Confidence-based decision making (proceed if ≥50%)
  - Comprehensive logging for debugging

## 🔄 IN PROGRESS: Backend Integration

### **5. Vision Agent Integration** ✅
- **Status**: COMPLETED
- **Implementation**: 
  - Vision agent runs only when confidence < 70%
  - Uses GPT-4o for high-powered analysis
  - Fallback to previous result if vision agent fails
- **Files Modified**: `src/lib/apis/image-recognition.js`

### **6. Quality Assessment Agent** ✅
- **Status**: COMPLETED
- **Features**:
  - Evaluates brand specificity vs generic terms
  - Assesses product clarity and confidence alignment
  - Determines if escalation to vision agent is needed
- **Files Modified**: `src/lib/apis/image-recognition.js`

## 📋 REMAINING TASKS

### **7. Frontend/Dashboard Visualization** 🔄
- **Status**: PENDING
- **Tasks**:
  - [ ] Update ProductResultScreen to show image analysis flow steps
  - [ ] Add trace logging for image recognition stages
  - [ ] Display confidence scores and escalation reasons
  - [ ] Show quality assessment results in results page

### **8. Data Model Updates** 🔄
- **Status**: PENDING
- **Tasks**:
  - [ ] Add image_analysis_flow field to products table
  - [ ] Store confidence scores and escalation reasons
  - [ ] Log quality assessment results
  - [ ] Track vision agent usage statistics

### **9. Testing & Validation** 🔄
- **Status**: IN PROGRESS
- **Tasks**:
  - [x] Create test script for enhanced image flow (`test-enhanced-image-flow.js`)
  - [ ] Test with real product images
  - [ ] Validate confidence thresholds
  - [ ] Test fallback scenarios

### **10. Documentation** 🔄
- **Status**: PENDING
- **Tasks**:
  - [ ] Update API documentation
  - [ ] Document new UX flow
  - [ ] Create troubleshooting guide
  - [ ] Update deployment instructions

## 🎯 Key Features Implemented

### **Enhanced Image Recognition Flow**
```
Photo Capture → OCR + Lightweight Extractor → Quality Assessment → [Vision Agent if needed] → Manual Fallback
```

### **Smart Escalation Logic**
- **Confidence ≥ 70%**: Proceed with initial analysis
- **Confidence < 70%**: Escalate to Vision Agent (GPT-4o)
- **Still insufficient**: Show manual entry form

### **Improved User Experience**
- **Primary CTA**: "Take a Photo" (not barcode scanner)
- **Fallback Access**: Clear link to alternative entry methods
- **Progressive Disclosure**: Only show advanced options when needed
- **Better Feedback**: Detailed processing states and error messages

## 🧪 Testing Instructions

1. **Start the dev server**: `npm run dev`
2. **Test the landing page**: Should show "Take a Photo" as primary CTA
3. **Test fallback modal**: Click "Try manual or barcode entry"
4. **Test image flow**: Take a photo and observe the 3-step process
5. **Run test script**: `node test-enhanced-image-flow.js`

## 📊 Success Metrics

- [x] Landing page shows photo-first UX
- [x] Barcode scanner no longer runs on load
- [x] Enhanced image recognition pipeline working
- [x] Fallback modal accessible and functional
- [x] Quality assessment and vision agent escalation working
- [ ] Frontend shows detailed flow information
- [ ] Data properly logged to Supabase
- [ ] All edge cases handled gracefully 