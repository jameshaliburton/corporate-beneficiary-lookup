# 🎯 OwnedBy Dashboard: Human-in-the-Loop Evaluation & Agent Refinement System

## 📋 Overview

Transform the OwnedBy dashboard into a fully interactive evaluation interface that supports manual refinement of agent results, trace inspection, and systematic logging of corrections to Google Sheets.

## 🎯 Core Goals

1. **Manual Flagging**: Identify incorrect or incomplete results
2. **Trace Inspection**: View query and reasoning that led to output
3. **Query Refinement**: Manually improve queries or prompts
4. **Agent Rerun**: Execute research agent with corrected input
5. **Evaluation Logging**: Submit evaluations to Google Sheets system
6. **Progress Tracking**: Monitor refinements over time

## 🗂️ Implementation Plan

### Phase 1: Core Components ✅
- [x] Create planning document
- [ ] Scaffold RefineModal component
- [ ] Create evaluation-rerun API route
- [ ] Update Google Sheets evaluation logging

### Phase 2: Dashboard Integration ✅
- [ ] Add "Refine" button to result cards
- [ ] Integrate RefineModal with existing dashboard
- [ ] Add evaluation status badges

### Phase 3: Testing & Validation ✅
- [ ] Create test cases for refinement flow
- [ ] Test Google Sheets integration
- [ ] Validate trace inspection functionality

### Phase 4: Polish & Enhancement ✅
- [ ] Add copy-to-clipboard functionality
- [ ] Implement color-coded result indicators
- [ ] Add bulk evaluation features

## 📁 File Structure

```
src/
├── components/
│   ├── EvaluationDashboard.tsx (update)
│   ├── RefineModal.tsx (new)
│   └── Trace.tsx (reuse)
├── app/api/
│   └── evaluation-rerun/
│       └── route.ts (new)
└── lib/services/
    └── google-sheets-evaluation.js (update)
```

## 🔄 User Flow

1. **User views dashboard** with ownership results
2. **Clicks "Refine"** on incorrect result
3. **Opens RefineModal** showing trace and reasoning
4. **Inspects trace** to understand agent's decision process
5. **Inputs corrections**:
   - Corrected owner name
   - Improved query
   - Error type classification
   - Suggested evidence/sources
6. **Submits refinement** → triggers agent rerun
7. **Views new result** with updated confidence
8. **Evaluation logged** to Google Sheets

## 📊 Data Flow

### Input to RefineModal
```typescript
interface RefineModalProps {
  originalResult: ProductResult;
  trace: AgentTrace;
  onRefine: (correction: RefinementData) => Promise<void>;
  onClose: () => void;
}
```

### Refinement Data Structure
```typescript
interface RefinementData {
  trace_id: string;
  corrected_owner: string;
  corrected_query: string;
  error_type: 'wrong_company' | 'hallucinated_source' | 'outdated_info' | 'incomplete';
  suggested_evidence: string;
  submit_as_test_case: boolean;
  notes: string;
}
```

### API Request Structure
```typescript
interface EvaluationRerunRequest {
  trace_id: string;
  corrected_query: string;
  original_result: ProductResult;
  refinement_data: RefinementData;
}
```

## 🧪 Testing Strategy

### Unit Tests
- [ ] RefineModal renders correctly with trace data
- [ ] API route accepts valid refinement requests
- [ ] Google Sheets logging captures all required fields

### Integration Tests
- [ ] Full refinement flow from dashboard to result
- [ ] Evaluation logging creates proper Google Sheets entries
- [ ] Trace inspection shows correct agent reasoning

### User Acceptance Tests
- [ ] User can identify and correct wrong ownership results
- [ ] Refined queries produce better results
- [ ] Evaluation system tracks improvement over time

## 🎨 UI/UX Considerations

### RefineModal Design
- **Step-by-step layout** for clarity
- **Trace visualization** with expandable sections
- **Form validation** for required fields
- **Loading states** during agent rerun
- **Success/error feedback** after submission

### Dashboard Enhancements
- **Evaluation badges** on result cards
- **Confidence indicators** with color coding
- **Quick refine buttons** for common corrections
- **Bulk selection** for multiple refinements

## 📈 Success Metrics

### Technical Metrics
- [ ] Refinement API response time < 5 seconds
- [ ] Google Sheets logging success rate > 95%
- [ ] Trace inspection loads in < 2 seconds

### User Experience Metrics
- [ ] Users can complete refinement in < 3 minutes
- [ ] Refined results show > 20% confidence improvement
- [ ] Evaluation logging reduces manual data entry by 80%

### Quality Metrics
- [ ] Refined queries produce more accurate results
- [ ] Error classification helps identify agent weaknesses
- [ ] Test case generation improves future agent performance

## 🚀 Implementation Priority

1. **High Priority**: Core refinement functionality
2. **Medium Priority**: Advanced trace inspection
3. **Low Priority**: Bulk operations and analytics

## 📝 Notes

- Ensure backward compatibility with existing dashboard
- Consider rate limiting for agent reruns
- Plan for Google Sheets API quota management
- Design for mobile responsiveness
- Include accessibility features (ARIA labels, keyboard navigation)

---

**Status**: Planning Complete ✅  
**Next Step**: Scaffold RefineModal component 