# Phase 1 Validation Suite

## 🎯 Overview

The Phase 1 Validation Suite provides comprehensive regression testing for the OwnedBy pipeline's core functionality. It includes a dev-only cache flush endpoint and a complete test suite that validates all critical pipeline components.

## 🚀 Quick Start

### Prerequisites
- Development server running (`npm run dev`)
- Environment variables configured in `.env.local`
- Supabase connection established

### Running Tests

```bash
# Run the complete Phase 1 regression test suite
npm run test:phase1

# Flush cache manually (dev-only)
npm run test:phase1:flush
```

## 📋 Test Scenarios

### A. Brand with Known Single Owner (Therabreath)
- **Purpose**: Validates LLM-first analysis with high confidence results
- **Expected**: Church & Dwight Co., Inc. ownership, 95%+ confidence
- **Agents**: LLM First Analysis

### B. Ambiguous Brand (Jordan - No Product)
- **Purpose**: Tests disambiguation agent triggering
- **Expected**: Disambiguation options for Nike vs Colgate
- **Agents**: Web Research, Disambiguation, Gemini Analysis

### C. Brand with Misspelled Input (Nescafe → Nescafé)
- **Purpose**: Validates brand name correction and lookup
- **Expected**: Nestlé S.A. ownership with corrected brand name
- **Agents**: LLM First Analysis

### D. Cache Hit vs Miss Performance
- **Purpose**: Validates caching system performance
- **Expected**: First request cache miss, second request cache hit with performance improvement
- **Agents**: Cache Lookup, LLM First Analysis

### E. Feature Flag Enforcement
- **Purpose**: Validates feature flag controls for agents
- **Expected**: Agents execute/skip based on environment flags
- **Agents**: All agents (controlled by flags)

## 🔧 Dev Cache Flush Endpoint

### Endpoint: `POST /api/dev/flush-cache`

**Production Safety**: Automatically blocks in production environments

**Usage**:
```bash
# Flush all cache
curl -X POST http://localhost:3000/api/dev/flush-cache \
  -H 'Content-Type: application/json' \
  -d '{}'

# Flush specific brands
curl -X POST http://localhost:3000/api/dev/flush-cache \
  -H 'Content-Type: application/json' \
  -d '{"brands": ["apple", "jordan"]}'
```

**Response**:
```json
{
  "success": true,
  "message": "Cache flushed successfully",
  "operation": "flush_all",
  "brands_flushed": 0,
  "tables_flushed": {
    "products": {"deleted": 0, "remaining": 0},
    "pipeline_results": {"deleted": 0, "remaining": 0},
    "agent_results": {"deleted": 0, "remaining": 0}
  }
}
```

## 📊 Test Reports

### Generated Reports
- **Location**: `tests/reports/phase-1-validation.md`
- **Content**: Detailed test results, assertions, performance metrics
- **Format**: Structured markdown with JSON result details

### Report Sections
1. **Test Summary**: Pass/fail counts, duration, environment info
2. **Feature Flags**: Current flag states
3. **Test Results**: Individual test case details with assertions

## 🛡️ Safety Features

### Production Safeguards
- Cache flush endpoint blocks in production (`NODE_ENV === 'production'`)
- All dev-only code wrapped in environment checks
- No schema modifications from test suite

### Git Hygiene
- Feature branch: `phase-1-validation-suite`
- Structured commit messages with `feat:`, `test:`, `chore:` prefixes
- Clear separation of test code from production logic

## 🔍 Debugging

### Test Logs
All tests use structured logging with prefixes:
- `[TEST_SUITE]`: Test suite initialization and summary
- `[TEST_CASE_X]`: Individual test case execution
- `[CACHE_FLUSH]`: Cache flush operations
- `[API_REQUEST]`: API request/response details

### Common Issues

**Cache Hit on First Request**:
- Solution: Use `flushCache()` without parameters to flush all cache
- Check: Verify cache flush endpoint is working

**Feature Flag Not Respected**:
- Check: Environment variables in `.env.local`
- Restart: Development server after changing flags

**API Timeout**:
- Check: Development server is running
- Verify: All environment variables are set

## 📈 Performance Expectations

### Typical Durations
- **Cache Hit**: 5-8 seconds
- **Cache Miss**: 15-25 seconds
- **Disambiguation**: 6-12 seconds
- **Gemini Analysis**: +3-5 seconds when enabled

### Performance Improvements
- Cache hits should be 60-80% faster than cache misses
- Feature flag enforcement should have minimal overhead

## 🔄 Integration

### CI/CD Integration
```bash
# In CI pipeline
npm run test:phase1
# Exit code 0 = all tests passed
# Exit code 1 = tests failed
```

### Development Workflow
1. Make changes to pipeline
2. Run `npm run test:phase1` to validate
3. Check generated report for detailed results
4. Fix any failing assertions
5. Commit with proper message format

## 📝 Maintenance

### Adding New Test Cases
1. Add new test method to `Phase1RegressionTestSuite` class
2. Include in `runAllTests()` method
3. Update documentation with new scenario

### Updating Assertions
- Modify assertion arrays in individual test methods
- Ensure assertions are specific and meaningful
- Update expected results in documentation

---

**Status**: ✅ Complete  
**Last Updated**: August 29, 2025  
**Branch**: `phase-1-validation-suite`
