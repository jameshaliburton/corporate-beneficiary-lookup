# 🎯 E2E Consistency + Schema Guarding - Verification Plan

**Branch**: `feat/e2e-consistency`  
**Date**: August 29, 2025  
**Status**: ✅ **IMPLEMENTATION COMPLETE** - Ready for verification

---

## 📋 **IMPLEMENTATION SUMMARY**

### ✅ **Completed Components**

#### 1. **Runtime Config Logging** ✅
- **File**: `src/lib/utils/runtime-config.ts`
- **Features**:
  - `printMinimalRuntimeConfig(tag)` for environment variable logging
  - `validateRuntimeConfig(tag)` for required variable validation
  - Integrated into API lookup handler
- **Logs**: `[RUNTIME]` tags with environment state

#### 2. **Schema Guards** ✅
- **File**: `src/lib/schemas/ownership-schema.ts`
- **Features**:
  - Zod schemas with safe defaults for all ownership data
  - `OwnershipSchema`, `WebSearchResultSchema`, `EnhancedAgentResultSchema`
  - `safeParseOwnershipData()` with fallback handling
  - `validateOwnershipChain()`, `validateSources()`, `validateConfidence()`
- **Applied to**:
  - `EnhancedWebSearchOwnershipAgent`
  - `EnhancedAgentOwnershipResearch`
  - `calculateEnhancedConfidence`
- **Logs**: `[SCHEMA_GUARD]` tags with validation results

#### 3. **Cache Write Improvements** ✅
- **File**: `src/lib/database/service-client.ts`
- **Features**:
  - Service role client for elevated permissions
  - `safeCacheWrite()` with RLS policy detection
  - `logRlsViolation()` for debugging
  - Updated `upsertProduct()` to use service client
- **Logs**: `[CACHE_WRITE]`, `[RLS_DENY_EXPECTED]` tags

#### 4. **E2E Fixture Tests** ✅
- **Directory**: `tests/e2e/`
- **Fixtures**: `lipton.json`, `ikea.json`, `moosemilk.json`
- **Test Runner**: `e2e-test-runner.mjs`
- **Features**:
  - Golden assertions for structural validation
  - Feature flag matrix testing
  - Comprehensive response validation
  - Results saving and reporting

#### 5. **Matrix Testing** ✅
- **Feature Flags**: `WEB_RESEARCH`, `NARRATIVE_V3`, `CACHE_WRITE`
- **Scripts**: `npm run test:e2e`, `npm run test:e2e:matrix`
- **Coverage**: All flag combinations with fixture tests

---

## 🧪 **VERIFICATION INSTRUCTIONS**

### **Step 1: Environment Verification**
```bash
# Check environment variables are loaded
curl -X POST http://localhost:3000/api/lookup \
  -H "Content-Type: application/json" \
  -d '{"brand": "test", "product_name": "test"}'
```

**Expected Logs**:
```
[RUNTIME] API_LOOKUP_HANDLER - Environment Configuration: {
  NODE_ENV: "development",
  SUPABASE_URL_EXISTS: true,
  SUPABASE_ANON_KEY_EXISTS: true,
  SUPABASE_SERVICE_ROLE_EXISTS: true,
  ANTHROPIC_API_KEY_EXISTS: true,
  GOOGLE_API_KEY_EXISTS: true,
  GOOGLE_CSE_ID_EXISTS: true,
  OPENCORPORATES_API_KEY_EXISTS: true
}
```

### **Step 2: Schema Guard Verification**
```bash
# Test with known brand (Lipton)
curl -X POST http://localhost:3000/api/lookup \
  -H "Content-Type: application/json" \
  -d '{"brand": "Lipton", "product_name": "Lipton"}'
```

**Expected Logs**:
```
[SCHEMA_GUARD] EnhancedWebSearchOwnershipAgent - Validating result before return
[SCHEMA_GUARD] EnhancedWebSearchOwnershipAgent - Data validated successfully ✅
[SCHEMA_GUARD] EnhancedAgentOwnershipResearch - Validating result before return
[SCHEMA_GUARD] EnhancedAgentOwnershipResearch - Data validated successfully ✅
[SCHEMA_GUARD] calculateEnhancedConfidence - Validating result before return
[SCHEMA_GUARD] calculateEnhancedConfidence - Data validated successfully ✅
```

### **Step 3: Cache Write Verification**
**Expected Logs**:
```
[CACHE_WRITE] ProductUpsert - Attempting cache write with service role client
[CACHE_WRITE] ProductUpsert - Cache write successful ✅
```

**OR** (if RLS policy blocks):
```
[RLS_DENY_EXPECTED] ProductUpsert - RLS policy violation detected (expected in test environment)
```

### **Step 4: E2E Fixture Testing**
```bash
# Run all E2E tests
npm run test:e2e

# Run matrix testing
npm run test:e2e:matrix
```

**Expected Output**:
```
🧪 E2E Test Runner Starting
============================
Base URL: http://localhost:3000
Feature Flags: { WEB_RESEARCH: 'on', NARRATIVE_V3: 'on', CACHE_WRITE: 'on' }

📋 Found 3 fixtures: lipton, ikea, moosemilk

🧪 Running E2E test for fixture: lipton
✅ lipton test PASSED

🧪 Running E2E test for fixture: ikea
✅ ikea test PASSED

🧪 Running E2E test for fixture: moosemilk
✅ moosemilk test PASSED

📊 E2E Test Summary
===================
Total Tests: 3
Passed: 3
Failed: 0
Success Rate: 100.0%
```

### **Step 5: Manual Verification**
```bash
# Test manual brand input
curl -X POST http://localhost:3000/api/lookup \
  -H "Content-Type: application/json" \
  -d '{"brand": "IKEA", "product_name": "IKEA"}'
```

**Expected Response Structure**:
```json
{
  "success": true,
  "result_type": "ownership_research",
  "ownership_data": {
    "financial_beneficiary": "INGKA Foundation",
    "beneficiary_country": "Netherlands",
    "confidence_score": 95,
    "ownership_flow": [...],
    "sources": [...]
  },
  "narrative": {
    "headline": "IKEA's Dutch connection 🇳🇱",
    "tagline": "Swedish design, Dutch ownership",
    "story": "...",
    "ownership_notes": [...],
    "behind_the_scenes": [...],
    "template_used": "global_brand_ownership"
  }
}
```

---

## 🔍 **VERIFICATION CHECKLIST**

### **Runtime Config Logging** ✅
- [ ] `[RUNTIME]` logs appear in API requests
- [ ] Environment variables are properly detected
- [ ] Missing variables are logged as errors
- [ ] Config validation works correctly

### **Schema Guards** ✅
- [ ] `[SCHEMA_GUARD]` logs appear for all agents
- [ ] Validation succeeds for valid data
- [ ] Fallback values are used for invalid data
- [ ] No undefined property access errors
- [ ] All agents return structured data

### **Cache Writes** ✅
- [ ] `[CACHE_WRITE]` logs appear for database operations
- [ ] Service role client is used for writes
- [ ] RLS violations are properly detected and logged
- [ ] Cache operations don't crash the pipeline
- [ ] `[RLS_DENY_EXPECTED]` logs appear when appropriate

### **E2E Fixture Tests** ✅
- [ ] All fixtures load correctly
- [ ] API requests return valid responses
- [ ] Response structure validation works
- [ ] Golden assertions pass
- [ ] Test results are saved to files
- [ ] Summary reports are generated

### **Matrix Testing** ✅
- [ ] Feature flags are properly set
- [ ] Tests run with different flag combinations
- [ ] Results vary appropriately with flags
- [ ] All combinations are tested

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **Environment Variables Missing**
```
[RUNTIME] API_LOOKUP_HANDLER - Missing required environment variables
```
**Fix**: Ensure `.env.local` file exists with all required variables

#### **Schema Validation Failures**
```
[SCHEMA_GUARD] EnhancedWebSearchOwnershipAgent - Validation failed, using defaults
```
**Fix**: Check agent output structure, may indicate LLM response parsing issues

#### **RLS Policy Violations**
```
[RLS_DENY_EXPECTED] ProductUpsert - RLS policy violation detected
```
**Fix**: This is expected in test environment, check if service role client is working

#### **E2E Test Failures**
```
❌ lipton test FAILED
   Errors: Expected owner 'Unilever', got 'Unknown'
```
**Fix**: Check if ownership research agents are working correctly

### **Debug Commands**
```bash
# Check environment
node -e "console.log(process.env.SUPABASE_URL ? 'SUPABASE_URL: ✅' : 'SUPABASE_URL: ❌')"

# Test schema validation
node -e "import('./src/lib/schemas/ownership-schema.ts').then(m => console.log('Schema loaded:', !!m.OwnershipSchema))"

# Test service client
node -e "import('./src/lib/database/service-client.ts').then(m => console.log('Service client loaded:', !!m.getServiceClient))"
```

---

## 📊 **SUCCESS CRITERIA**

### **Minimum Requirements**
- [ ] All E2E fixture tests pass (100% success rate)
- [ ] Runtime config logging works for all requests
- [ ] Schema guards prevent undefined property access
- [ ] Cache writes use service role client
- [ ] RLS violations are properly logged
- [ ] Manual API requests return structured responses

### **Performance Targets**
- [ ] E2E tests complete within 2 minutes
- [ ] API responses return within 30 seconds
- [ ] Schema validation adds <100ms overhead
- [ ] Cache writes complete within 5 seconds

### **Quality Targets**
- [ ] No undefined property access errors
- [ ] All agents return structured data
- [ ] Response structure matches golden assertions
- [ ] Error handling is graceful and informative

---

## 🎯 **NEXT STEPS**

1. **Run Verification**: Execute all verification steps above
2. **Fix Issues**: Address any failures found during verification
3. **Update Documentation**: Update test plan with verification results
4. **Merge to Main**: Once verification passes, merge to main branch
5. **Deploy**: Deploy to production with confidence

**The E2E consistency and schema guarding system is now complete and ready for comprehensive verification.**
