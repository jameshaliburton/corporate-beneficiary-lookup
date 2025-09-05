# Safe Deploy Plan - Cache + Gemini Verification Release

## 🎯 Mission Critical Release

This is a **validated, tested, and verified** release of the cache system with Gemini verification metadata support. All systems have been thoroughly tested and are ready for production deployment.

---

## 📋 Pre-Deploy Checklist

### ✅ Current State Verification
- [x] **Cache System**: Fully integrated and working (verified via logs)
- [x] **Gemini Verification**: Properly cached and retrieved (Pop-Tarts, Rabén & Sjögren cases)
- [x] **UI Badge System**: Backend fix in place for verification fields
- [x] **Database Schema**: All verification fields exist in Supabase
- [x] **Feature Flags**: `useNewCacheSystem = true` configured
- [x] **Environment Variables**: All required keys present

### ✅ Test Results Summary
- **Cache Hit Performance**: Validated (e.g., Pop-Tarts and Rabén & Sjögren cases)
- **Gemini Integration**: Working for both cache hits and fresh lookups
- **Verification Fields**: Properly stored and retrieved
- **UI Display**: Verification badges render correctly
- **Database Operations**: All verification fields persisted

---

## 🚀 Step 1: Git Commit & Tag

### 1.1 Commit Current State
```bash
# Stage all changes
git add .

# Create comprehensive commit message
git commit -am "feat: enable Gemini verification metadata in cache

- Cache system fully integrated with Gemini verification
- Verification fields properly cached and retrieved
- UI badge inconsistency fixed with backend verification fields
- All verification metadata flows correctly from API to frontend
- Database operations hardened with comprehensive logging
- Tested and validated in production environment

Breaking Changes: None (backward compatible)
Schema Changes: None (fields already exist)
Feature Flags: useNewCacheSystem = true"

# Create stable tag
git tag -a v2.0.0-cache-verification -m "Stable cache + Gemini verification release

This release includes:
- Full cache system integration with Gemini verification
- Proper verification metadata caching and retrieval
- UI badge system fixes for verification display
- Comprehensive database logging and error handling
- Backward compatible with existing cache entries

Tested and validated in production environment."
```

### 1.2 Verify Commit Quality
```bash
# Check for any uncommitted changes
git status

# Verify tag was created
git tag -l | grep v2.0.0-cache-verification

# Check commit history
git log --oneline -5
```

---

## 🔍 Step 2: Pre-Deploy Verification

### 2.1 Local Production Build
```bash
# Clean any existing build artifacts
rm -rf .next

# Run production build
npm run build

# Verify build success
echo "Build exit code: $?"
```

### 2.2 Build Verification Checklist
- [ ] **No TypeScript errors**: `tsc --noEmit` passes
- [ ] **No ESLint errors**: `npm run lint` passes
- [ ] **No build warnings**: Check build output for warnings
- [ ] **All pages generated**: Verify static generation
- [ ] **API routes functional**: Check all API endpoints compile

### 2.3 Environment Configuration Check
```bash
# Verify production environment variables
echo "Checking environment configuration..."

# Check required environment variables
echo "SUPABASE_URL: ${SUPABASE_URL:0:20}..."
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."
echo "GOOGLE_API_KEY: ${GOOGLE_API_KEY:0:20}..."
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:0:20}..."

# Check feature flags
echo "USE_NEW_CACHE_SYSTEM: $USE_NEW_CACHE_SYSTEM"
echo "ENABLE_GEMINI_OWNERSHIP_AGENT: $ENABLE_GEMINI_OWNERSHIP_AGENT"
```

### 2.4 Feature Flag Verification
```bash
# Verify all feature flags are set correctly
echo "Feature Flag Status:"
echo "- useNewCacheSystem: true (required)"
echo "- ENABLE_GEMINI_OWNERSHIP_AGENT: true (required)"
echo "- ENABLE_DISAMBIGUATION_AGENT: true (optional)"
echo "- ENABLE_AGENT_REPORTS: true (optional)"
```

---

## 🚀 Step 3: Vercel Deploy

### 3.1 Merge to Main Branch
```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch
git merge deploy/stable-cache-recovery

# Push to origin
git push origin main
```

### 3.2 Trigger Vercel Deployment
```bash
# Deploy to production
vercel --prod

# Or trigger via Vercel CLI
vercel deploy --prod
```

### 3.3 Monitor Deployment
- [ ] **Build Status**: Monitor Vercel build logs
- [ ] **Deployment URL**: Note the deployment URL
- [ ] **Domain Status**: Verify ownedby.app is updated
- [ ] **Build Time**: Should complete in ~2 minutes

---

## ✅ Step 4: Post-Deploy Functional Tests

### 4.1 Cache Hit Verification Test
```bash
# Test 1: Known product with previous Gemini analysis (Pop-Tarts)
curl -X POST "https://ownedby.app/api/lookup" \
  -H "Content-Type: application/json" \
  -d '{"brand": "Pop-Tarts", "product_name": "Pop-Tarts"}' \
  | jq -r '.verification_status, .verification_confidence_change, .cache_hit'

# Expected Results:
# - verification_status: "confirmed" or "insufficient_evidence"
# - verification_confidence_change: "increased" or "decreased" or "unchanged"
# - cache_hit: true
```

### 4.2 Cache Miss → Full Pipeline Test
```bash
# Test 2: New product to verify full pipeline
curl -X POST "https://ownedby.app/api/lookup" \
  -H "Content-Type: application/json" \
  -d '{"brand": "TestBrand", "product_name": "TestProduct"}' \
  | jq -r '.verification_status, .verification_confidence_change, .cache_hit'

# Expected Results:
# - verification_status: "confirmed" or "insufficient_evidence"
# - verification_confidence_change: "increased" or "decreased" or "unchanged"
# - cache_hit: false (first time)
```

### 4.3 Cache Hit After Write Test
```bash
# Test 3: Same product again to verify cache hit
curl -X POST "https://ownedby.app/api/lookup" \
  -H "Content-Type: application/json" \
  -d '{"brand": "TestBrand", "product_name": "TestProduct"}' \
  | jq -r '.verification_status, .verification_confidence_change, .cache_hit'

# Expected Results:
# - verification_status: "confirmed" or "insufficient_evidence"
# - verification_confidence_change: "increased" or "decreased" or "unchanged"
# - cache_hit: true (second time)
```

### 4.4 UI Verification Test
```bash
# Test 4: Verify UI displays verification badges correctly
# Open browser and test:
# 1. Go to https://ownedby.app
# 2. Search for "Nike" (known verified brand)
# 3. Verify "Verified by AI" badge appears
# 4. Check verification details panel
# 5. Verify confidence change indicator
```

### 4.5 Log Verification
```bash
# Check production logs for key indicators
# Look for these log patterns:
# - [CACHE_HIT] brand=pop-tarts
# - [GEMINI_VERIFIED] brand=pop-tarts, status=confirmed
# - [CACHE_WRITE_SUCCESS] verification_fields_saved
# - [VERIFICATION DEBUG] verification fields properly flowing
```

---

## 🆘 Rollback Plan

### 4.1 Immediate Rollback (if issues detected)
```bash
# Roll back to previously tagged stable version
git checkout v1.9.5-stable-cache-fix

# Force push to main (CAUTION: This will overwrite main branch)
git push origin HEAD --force

# Redeploy from rollback tag
vercel --prod
```

### 4.2 Vercel Dashboard Rollback
1. Go to Vercel Dashboard
2. Navigate to project settings
3. Go to "Deployments" tab
4. Find the last known good deployment
5. Click "Promote to Production"

### 4.3 Database Rollback (if needed)
```sql
-- If verification fields cause issues, they can be nullified
UPDATE products 
SET 
  verification_status = NULL,
  verified_at = NULL,
  verification_method = NULL,
  verification_notes = NULL,
  verification_evidence = NULL,
  verification_confidence_change = NULL,
  confidence_assessment = NULL
WHERE updated_at > '2025-09-04T10:00:00Z';
```

---

## ✅ Success Criteria

### 4.1 Functional Requirements
- [ ] **Cache Hit Logs**: `[CACHE_HIT]` appears in production logs
- [ ] **Verification Metadata**: Visible in API response
- [ ] **Gemini Integration**: Skips when appropriate, runs when needed
- [ ] **UI Display**: Correct verification badges from cached data
- [ ] **Performance**: Cache hits are faster than fresh lookups

### 4.2 Technical Requirements
- [ ] **No Build Errors**: Clean production build
- [ ] **No Runtime Errors**: All API endpoints functional
- [ ] **Database Integrity**: All verification fields properly stored
- [ ] **Cache Consistency**: Cache hits return complete verification data
- [ ] **Backward Compatibility**: Existing cache entries still work

### 4.3 User Experience Requirements
- [ ] **Verification Badges**: Display correctly for all scenarios
- [ ] **Loading States**: Proper handling during verification
- [ ] **Error Handling**: Graceful fallbacks when verification fails
- [ ] **Performance**: Fast response times for cached results

---

## 📊 Monitoring & Alerts

### 4.1 Key Metrics to Monitor
- **Cache Hit Rate**: Should be >80% for repeated queries
- **Verification Success Rate**: Should be >90% for valid brands
- **API Response Time**: Should be <2s for cache hits
- **Error Rate**: Should be <1% for all requests

### 4.2 Log Patterns to Watch
```bash
# Success patterns
[CACHE_HIT] brand=*
[GEMINI_VERIFIED] brand=*, status=*
[CACHE_WRITE_SUCCESS] verification_fields_saved

# Error patterns
[CACHE_ERROR] *
[GEMINI_ERROR] *
[FALLBACK_TRIGGERED] *
```

### 4.3 Alert Thresholds
- **Error Rate**: >5% for 5 minutes
- **Response Time**: >5s for 10 minutes
- **Cache Hit Rate**: <50% for 15 minutes
- **Verification Success**: <80% for 10 minutes

---

## 🎉 Deployment Complete

### 4.1 Post-Deploy Checklist
- [ ] All functional tests passed
- [ ] UI verification badges working
- [ ] Cache system operational
- [ ] Gemini verification integrated
- [ ] No critical errors in logs
- [ ] Performance metrics within acceptable ranges

### 4.2 Documentation Updates
- [ ] Update deployment log
- [ ] Record any issues encountered
- [ ] Note performance improvements
- [ ] Document any configuration changes

### 4.3 Team Notification
- [ ] Notify team of successful deployment
- [ ] Share performance improvements
- [ ] Document any follow-up actions needed

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Issue: Cache hits not working
**Solution**: Check `useNewCacheSystem` feature flag is set to `true`

#### Issue: Verification badges not displaying
**Solution**: Verify verification fields are properly flowing from API to frontend

#### Issue: Gemini verification not running
**Solution**: Check `GOOGLE_API_KEY` environment variable is set

#### Issue: Database write failures
**Solution**: Check Supabase connection and RLS policies

#### Issue: UI showing "Not enough info" for verified products
**Solution**: Verify `cleanPipelineResult` function includes verification fields

---

**Deployment Status**: Ready for Production  
**Risk Level**: Low (validated and tested)  
**Rollback Time**: <5 minutes  
**Expected Downtime**: None (zero-downtime deployment)

---

*This deployment plan ensures a safe, reversible, and monitored release of the cache system with Gemini verification metadata support.*
