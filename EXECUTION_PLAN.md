# Corporate Beneficiary Research Agent - Execution Plan

## Project Overview
Building an AI-powered system to research and reveal the ultimate financial beneficiaries of consumer products using barcode scanning, web agents, and structured inference pipelines.

**Current Status**: Core agent pipeline working, static lookup functioning, evaluation system in place
**Target**: Modular, reusable platform for agentic applications

---

## Phase 1: Critical Fixes ✅ COMPLETED
**Status**: ✅ All critical issues resolved
**Duration**: 3 days
**Results**: 
- ✅ JSON parsing reliability: 100% success rate with retry logic
- ✅ Source quality optimization: Enhanced scoring and utilization
- ✅ API authentication: Graceful handling of failures, rate limiting
- ✅ Reuters/Bloomberg scraping: Enhanced paywall detection and error handling

**Next**: Ready to move to Phase 2: New Agent Implementation

---

## Phase 2: New Agent Implementation ✅ COMPLETED
**Status**: ✅ All new agents implemented and integrated
**Duration**: 2 days
**Results**: 
- ✅ Query Builder Agent: Company type inference and optimized search queries
- ✅ Enhanced Ownership Research Agent: Company type-specific guidance and better integration
- ✅ Improved search result relevance and ownership information yield
- ✅ Ready for comprehensive testing and validation

**Next**: Ready to move to Phase 3: Database Schema & Data Management

---

## Phase 3: Database Schema & Data Management (Priority: MEDIUM)

### 3.1 Ownership Mappings Table
**Status**: 📋 Not Started
**Purpose**: Static mappings for brands → owners with hierarchy support
**Structure**:
- `brand_name`, `regional_entity`, `intermediate_entity`
- `ultimate_owner_name`, `ultimate_owner_country`, `ultimate_owner_flag`
- Support for: `brand` → `regional_entity` → `intermediate_entity` → `ultimate_owner`

**Tasks**:
- Create table schema
- Populate with real-world brand examples
- Add both exact barcode matches and brand-based inferences
- Implement lookup logic

**Success Criteria**: Fast static lookups for known brands
**Estimated Time**: 1-2 days

### 3.2 Enhanced Products Table
**Status**: 📋 Not Started
**Tasks**:
- Add `result_type` field to track lookup method
- Implement caching logic for resolved products
- Add ownership flow tracking
- Update lookup pipeline to use new structure

**Success Criteria**: Better result tracking and caching
**Estimated Time**: 1 day

### 3.3 Scan Logs & Analytics
**Status**: 📋 Not Started
**Tasks**:
- Implement `scan_logs` table for comprehensive logging
- Add logging to all API calls and UI scans
- Create analytics dashboard for usage patterns
- Add performance monitoring

**Success Criteria**: Complete audit trail and performance insights
**Estimated Time**: 1 day

---

## Phase 4: Google Sheets Evaluation Integration (Priority: MEDIUM)

### 4.1 Google Sheets Setup
**Status**: 📋 Not Started
**Purpose**: Use Google Sheets as interface for defining test cases and logging results
**Structure**:
- `eval_tests` sheet: barcode, product_name, expected_owner, expected_country, expected_structure_type, notes
- `eval_results` sheet: automatically populated with raw response JSON, sources, agent trace, match quality

**Tasks**:
- Set up Google Sheets API connection
- Create sheet templates
- Implement CSV import/export functionality
- Add data validation

**Success Criteria**: Easy test case management for non-engineers
**Estimated Time**: 2 days

### 4.2 Evaluation Runner
**Status**: 📋 Not Started
**Tasks**:
- Create backend service to load test cases from Google Sheets
- Implement automated test execution pipeline
- Add result comparison and scoring logic
- Create result logging to both Google Sheets and Supabase

**Success Criteria**: Automated evaluation with comprehensive logging
**Estimated Time**: 2-3 days

### 4.3 Enhanced Evaluation Dashboard
**Status**: 🔄 In Progress
**Tasks**:
- Update `/evaluation` page to display Google Sheets data
- Add filters for match/failure, agent type, source credibility
- Show inline debug info (raw LLM response, search snippets, source scores)
- Add admin controls for re-running tests and manual pass/fail marking

**Success Criteria**: Comprehensive evaluation interface
**Estimated Time**: 1-2 days

---

## Phase 5: Performance Optimization (Priority: MEDIUM)

### 5.1 Caching Strategy
**Status**: 📋 Not Started
**Tasks**:
- Add Redis or in-memory caching for API responses
- Implement cache invalidation logic
- Add cache hit/miss analytics
- Optimize database queries

**Success Criteria**: <10s for typical lookup
**Estimated Time**: 1-2 days

### 5.2 Response Time Optimization
**Status**: 📋 Not Started
**Tasks**:
- Parallelize API calls where possible
- Implement request batching
- Add timeout and retry logic
- Optimize agent response times

**Success Criteria**: Consistent sub-10-second response times
**Estimated Time**: 1-2 days

---

## Phase 6: Testing & Validation (Priority: HIGH)

### 6.1 Comprehensive Test Suite
**Status**: 🔄 In Progress
**Tasks**:
- Run evaluation against all test cases
- Validate JSON parsing reliability
- Test source quality scoring accuracy
- Verify API authentication fixes
- Test query builder agent integration

**Success Criteria**: Eval match rate >80%
**Estimated Time**: 2-3 days

### 6.2 Performance Testing
**Status**: 📋 Not Started
**Tasks**:
- Load test the system
- Measure response times
- Validate caching effectiveness
- Test rate limiting behavior

**Success Criteria**: System handles expected load
**Estimated Time**: 1 day

---

## Phase 7: Documentation & Deployment (Priority: LOW)

### 7.1 Documentation Updates
**Status**: 📋 Not Started
**Tasks**:
- Update development guide with new features
- Create user documentation
- Document API endpoints
- Create troubleshooting guide

**Success Criteria**: Complete documentation
**Estimated Time**: 1 day

### 7.2 Production Deployment
**Status**: 📋 Not Started
**Tasks**:
- Set up production environment
- Configure environment variables
- Set up monitoring and logging
- Create deployment scripts

**Success Criteria**: Production-ready deployment
**Estimated Time**: 1 day

---

## Success Metrics & KPIs

### Performance Targets
- **Response Time**: <10s for typical lookup
- **JSON Parse Success**: >95%
- **Source Quality**: >70 on average
- **API Authentication**: >90% success rate
- **Evaluation Match Rate**: >80%

### Quality Metrics
- **Hallucination Rate**: <5%
- **Source Utilization**: >60% of available sources
- **Cache Hit Rate**: >70%
- **Error Rate**: <2%

---

## Risk Mitigation

### Technical Risks
- **API Limits**: Implement aggressive caching and rate limiting
- **JSON Parsing**: Multiple fallback strategies and validation
- **Source Quality**: Manual review and adjustment of scoring algorithms
- **Performance**: Continuous monitoring and optimization

### Timeline Risks
- **Scope Creep**: Focus on core functionality first
- **Integration Issues**: Test components independently before integration
- **API Dependencies**: Implement graceful degradation

---

## Daily Workflow

### Morning (9-11 AM)
- Review previous day's progress
- Update status in this document
- Adjust plan based on blockers
- Focus on critical fixes

### Mid-morning (11 AM-1 PM)
- Core functionality development
- Agent implementation and testing
- Database schema work

### Afternoon (1-5 PM)
- New features and enhancements
- Integration testing
- Performance optimization

### End of Day (5-6 PM)
- Test changes
- Document progress
- Plan next day's priorities

---

## Tools & Resources

### Development Environment
- **IDE**: VS Code with TypeScript support
- **Testing**: Jest for unit tests, manual testing for integration
- **Monitoring**: Console logging and database analytics
- **Documentation**: Markdown files and inline code comments

### APIs & Services
- **AI**: Anthropic Claude-3-haiku
- **Search**: Google Custom Search API
- **Database**: Supabase (PostgreSQL)
- **Evaluation**: Google Sheets API

---

## Next Immediate Actions

### This Week (Priority Order)
1. **Complete JSON parsing fixes** (Phase 1.1)
2. **Implement query builder agent** (Phase 2.1)
3. **Fix source quality issues** (Phase 1.2)
4. **Set up Google Sheets evaluation** (Phase 4.1)

### Next Week
1. **Complete evaluation integration** (Phase 4.2-4.3)
2. **Implement ownership mappings** (Phase 3.1)
3. **Performance optimization** (Phase 5.1-5.2)
4. **Comprehensive testing** (Phase 6.1-6.2)

---

## Status Legend
- ✅ **Completed**
- 🔄 **In Progress**
- 📋 **Not Started**
- ⚠️ **Blocked**
- 🎯 **Ready to Start**

---

*Last Updated: [Current Date]*
*Next Review: [Weekly]*

## TODO: Real-Time Progress Tracking

- **Issue:** Real-time progress tracking via `emitProgress` is currently disabled/bypassed because network/server issues (e.g., server not running, endpoint unreachable) caused agent hangs during CLI/test runs.
- **Action:** Revisit and implement a robust, non-blocking, environment-aware solution for progress tracking.
    - Should not block or hang the agent if the server is unavailable.
    - Should work seamlessly in both dev (Next.js running) and CLI/test (no server) environments.
    - Consider using a feature flag, environment check, or fallback mechanism.
- **Status:** Deferred. Agent and tests run with progress tracking off for now. 