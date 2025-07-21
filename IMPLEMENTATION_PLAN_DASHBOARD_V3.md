# Evaluation Dashboard V3 - Complete Implementation Plan

## 🎯 **PROJECT INTENT**
Support **full human-in-the-loop prompt iteration and test evaluation** across live and test scans with granular trace inspection and step-level feedback.

## 📊 **CURRENT STATE AUDIT**

### ❌ **MISSING CORE FUNCTIONALITY**

| Feature | Status | Priority |
|---------|--------|----------|
| Step-level trace logging | ❌ Missing | 🔴 Critical |
| Prompt version tracking | ❌ Missing | 🔴 Critical |
| Google Sheets evaluation integration | ❌ Missing | 🔴 Critical |
| Step-level feedback/flagging | ❌ Missing | 🟡 High |
| Step-level rerun support | ❌ Missing | 🟡 High |
| Expected vs actual comparison | ❌ Missing | 🟡 High |
| Agent metrics by prompt version | ❌ Missing | 🟡 High |
| Inline prompt editing | ❌ Missing | 🟢 Medium |

### ⚠️ **PARTIALLY IMPLEMENTED**

| Feature | Status | Completion |
|---------|--------|------------|
| Unified Results Table | ⚠️ Basic | 30% |
| Rerun Functionality | ⚠️ Full flow only | 40% |
| Feedback Modal | ⚠️ Basic form | 25% |
| Metrics API | ⚠️ Basic counts | 20% |

### ✅ **WORKING INFRASTRUCTURE**

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard Loading | ✅ Complete | Routes and components render |
| API Endpoints | ✅ Complete | Basic CRUD operations |
| Component Structure | ✅ Complete | Tab system and layout |
| Environment Setup | ✅ Complete | Supabase and local fallbacks |

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Core Data Integration (Week 1)**

#### **1.1 Trace Logging Enhancement**
**Goal:** Add step-level logging to all agent calls with clear metadata

**Tasks:**
- [ ] Enhance agent execution to log each step
- [ ] Create trace data structure with: step_name, agent_type, tool, input, output, latency, outcome
- [ ] Update API responses to include full trace data
- [ ] Add trace_id linking to all result records

**Files to modify:**
- `src/lib/agents/*.js` - Add step logging
- `src/lib/services/evaluation-framework.js` - Trace data handling
- `src/app/api/evaluation/v3/results/route.ts` - Include trace data

#### **1.2 Prompt Version Tracking**
**Goal:** Link prompt versions to result records and enable version comparison

**Tasks:**
- [ ] Add prompt_version field to all result records
- [ ] Update prompt registry to track version metadata
- [ ] Modify API responses to include prompt version info
- [ ] Create prompt version comparison UI

**Files to modify:**
- `src/lib/services/prompt-registry.js` - Version tracking
- `src/app/api/evaluation/v3/results/route.ts` - Include prompt version
- `src/components/UnifiedResultsTableV3Simple.tsx` - Show prompt version

#### **1.3 Google Sheets Evaluation Integration**
**Goal:** Connect evaluation cases from sheets and map expected vs actual

**Tasks:**
- [ ] Enhance Google Sheets service to fetch evaluation cases
- [ ] Map evaluation cases to result records
- [ ] Add expected vs actual comparison logic
- [ ] Create evaluation case display in UI

**Files to modify:**
- `src/lib/services/google-sheets-evaluation.js` - Evaluation case fetching
- `src/app/api/evaluation/v3/results/route.ts` - Include evaluation data
- `src/components/UnifiedResultsTableV3Simple.tsx` - Show evaluation data

### **Phase 2: Advanced UI Components (Week 2)**

#### **2.1 Enhanced Trace Inspector**
**Goal:** Step-by-step breakdown with individual rerun and feedback

**Tasks:**
- [ ] Create step-by-step trace display
- [ ] Add individual step rerun buttons
- [ ] Implement step-level feedback forms
- [ ] Add step metadata display (agent, tool, latency)

**Files to create/modify:**
- `src/components/TraceInspectorV3.tsx` - Complete implementation
- `src/app/api/evaluation/v3/step-rerun/route.ts` - Step rerun API
- `src/app/api/evaluation/v3/step-feedback/route.ts` - Step feedback API

#### **2.2 Prompt Inspector Enhancement**
**Goal:** Show prompt version per run with inline editing and testing

**Tasks:**
- [ ] Display prompt version used per run
- [ ] Add inline prompt editing capability
- [ ] Implement prompt version comparison
- [ ] Create prompt testing workflow

**Files to create/modify:**
- `src/components/PromptInspectorV3.tsx` - Complete implementation
- `src/app/api/evaluation/v3/prompts/edit/route.ts` - Prompt editing API
- `src/app/api/evaluation/v3/prompts/test/route.ts` - Prompt testing API

#### **2.3 Granular Feedback System**
**Goal:** Step-level and agent-level feedback with rerun intent

**Tasks:**
- [ ] Enhance feedback modal for step-level input
- [ ] Add agent-level flagging
- [ ] Implement rerun intent tracking
- [ ] Create feedback history and management

**Files to modify:**
- `src/components/FeedbackModal.tsx` - Step-level feedback
- `src/app/api/evaluation/v3/feedback/route.ts` - Enhanced feedback API
- `src/components/UnifiedResultsTableV3Simple.tsx` - Feedback integration

### **Phase 3: Testing & Validation (Week 3)**

#### **3.1 End-to-End Testing**
**Goal:** Comprehensive test script mimicking real evaluator workflow

**Tasks:**
- [ ] Create test script for complete evaluation workflow
- [ ] Validate all user flows and edge cases
- [ ] Performance and reliability testing
- [ ] User acceptance testing scenarios

**Files to create:**
- `test-evaluation-workflow-complete.js` - End-to-end test
- `test-step-level-functionality.js` - Step-level testing
- `test-prompt-iteration.js` - Prompt iteration testing

#### **3.2 Metrics & Analytics**
**Goal:** Agent performance by prompt version with evaluation success rates

**Tasks:**
- [ ] Implement agent performance metrics
- [ ] Add evaluation case success tracking
- [ ] Create step-level success metrics
- [ ] Build analytics dashboard

**Files to create/modify:**
- `src/components/EvaluationStatsV3.tsx` - Complete analytics
- `src/app/api/evaluation/v3/agent-stats/route.ts` - Agent metrics API
- `src/app/api/evaluation/v3/evaluation-stats/route.ts` - Evaluation metrics API

## 🧪 **TESTING REQUIREMENTS**

### **Before "Production Ready" Status:**

#### **✅ Required Functionality:**
- [ ] Step-level traces for every result
- [ ] Prompt version tracking per run
- [ ] Evaluation sheet alignment visible in dashboard
- [ ] At least 3 full test runs using rerun/feedback flow
- [ ] Manual edit of prompt → rerun flow → evaluation score visible
- [ ] Agent metrics clearly tied to prompt version performance

#### **✅ User Workflow Validation:**
- [ ] Select failed case → inspect trace → flag web_search step → rerun only that step with new prompt → compare results → commit new prompt if improved
- [ ] View evaluation case → see expected vs actual → flag discrepancies → suggest prompt improvements
- [ ] Compare prompt versions → test new version → evaluate performance → iterate

#### **✅ Technical Requirements:**
- [ ] All APIs respond with complete trace data
- [ ] Google Sheets integration working with evaluation cases
- [ ] Step-level rerun functionality operational
- [ ] Prompt version tracking accurate
- [ ] Feedback system captures granular data
- [ ] Metrics calculation accurate and real-time

## 📈 **SUCCESS METRICS**

### **Technical Metrics:**
- **API Response Time:** < 2s for all endpoints
- **Data Completeness:** 100% of results have trace data
- **Integration Success:** 100% of evaluation cases mapped
- **Error Rate:** < 1% for all operations

### **Functional Metrics:**
- **User Workflow Success:** 100% of test scenarios pass
- **Feature Completeness:** All planned features implemented
- **Data Accuracy:** Prompt versions correctly tracked
- **Performance:** Step-level operations < 5s

### **User Experience Metrics:**
- **Workflow Efficiency:** Complete evaluation cycle < 10 minutes
- **Feedback Quality:** Granular feedback captured per step
- **Iteration Speed:** Prompt testing cycle < 5 minutes
- **Error Recovery:** Graceful handling of all edge cases

## 🎯 **DELIVERABLES**

### **Phase 1 Deliverables:**
- [ ] Enhanced trace logging system
- [ ] Prompt version tracking implementation
- [ ] Google Sheets evaluation integration
- [ ] Updated API responses with complete data

### **Phase 2 Deliverables:**
- [ ] Complete Trace Inspector with step-level functionality
- [ ] Enhanced Prompt Inspector with editing capabilities
- [ ] Granular feedback system
- [ ] Step-level rerun functionality

### **Phase 3 Deliverables:**
- [ ] Comprehensive test suite
- [ ] Complete analytics dashboard
- [ ] End-to-end workflow validation
- [ ] Production-ready deployment

## 🚨 **RISK MITIGATION**

### **Technical Risks:**
- **Google Sheets API Limits:** Implement robust fallback mechanisms
- **Performance Issues:** Add caching and optimization
- **Data Consistency:** Implement validation and error handling

### **Functional Risks:**
- **Complex UI:** Create intuitive user experience
- **Data Volume:** Implement efficient data handling
- **User Adoption:** Provide clear documentation and training

## 📅 **TIMELINE**

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1 | Data Integration | Trace logging, prompt tracking, sheets integration |
| 2 | UI Enhancement | Trace inspector, prompt inspector, feedback system |
| 3 | Testing & Validation | Test suite, analytics, production readiness |

## 🎉 **SUCCESS CRITERIA**

The Evaluation Dashboard V3 will be considered **complete** when:

1. **All missing functionality is implemented**
2. **End-to-end testing passes 100%**
3. **User workflows are validated and efficient**
4. **Performance meets all requirements**
5. **Documentation is complete and clear**

---

**Next Action:** Begin Phase 1 implementation with trace logging enhancement. 