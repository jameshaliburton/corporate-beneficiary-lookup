# 🛠️ Stable Production Deploy Plan

## ✅ Goal

Deploy a fully working version of the app to Vercel with:
- Gemini verification confirmed working (with trace)
- Cache working and not breaking trace structure
- Vercel deployment producing consistent results with local
- No experimental code or broken fallback logic

---

## 1. Setup: Reference Commit
- [x] Confirm working local commit hash: `ac95a419e5fb8f8fbb94f0c80fbed23760a49272`
- [x] ✅ Verified: This matches our `stable-rollback-point` tag
- [x] Branch created: `deploy-stable-prod` ✅

---

## 2. Cleanup Before Deploy
- [x] Review debug logging — ✅ Keeping production monitoring logs (following guardrails)
- [x] Confirm Gemini trace logic is clean and modular ✅
- [x] Confirm `maybeRunGeminiVerificationForCacheHit` adds trace ✅ (for cache hits)
- [x] Confirm Gemini verification integrated in `EnhancedAgentOwnershipResearch` ✅ (for fresh lookups)
- [x] Confirm no legacy narrative code active in this branch ✅
- [x] Run local curl test for Nike — ✅ `agent_execution_trace` present (cache hit, no Gemini needed)
- [x] Run local curl test for Patagonia — ✅ Narrative generation working, Gemini requires production API key

---

## 3. Prepare for Deploy
- [ ] Create Vercel Deploy Hook or use CLI (`vercel --prod`)
- [ ] Trigger production deploy with clean commit
- [ ] Confirm latest commit hash matches Vercel deployment

---

## 4. Post-Deploy Smoke Test
- [ ] POST Nike to `/api/lookup` — check:
  - [ ] `verification_status == "confirmed"`
  - [ ] `agent_execution_trace.sections` contains `GeminiVerificationAgent`
  - [ ] `execution_path == "cache_hit"` if appropriate
- [ ] Try uncached brand to verify non-cache path
- [ ] Check console logs or inspect Supabase writes

---

## 5. Optional Enhancements
- [ ] Add `debug_trace=true` support to POST payload
- [ ] Log cache hit/miss decision in response
- [ ] Tag this commit as `deploy/v1.0.0-stable-prod`

---

## 🔄 Rollback Plan (if needed)
```bash
git checkout main
git reset --hard <known-stable-hash>
git push --force
vercel --prod
```

---

## 📓 Notes
- Never reintroduce recent cache refactor commits unless verified line-by-line.
- Never trust automated trace assembly logic without curl verification.
- Use this file as the single source of truth for what went live.

---

## ⚠️ GUARDRAILS & RULES

- **DO NOT** refactor or reintroduce `makeCacheKey`, `cleanPipelineResult`, or `traceReducer` logic unless explicitly instructed.
- **DO NOT** change the narrative generator or verification merge logic in this deploy.
- **DO NOT** deploy any commit that hasn't been manually tested via `curl` against `/api/lookup` with trace verification.
- **ALWAYS** log and explain any change in the `.md` file before pushing.
- **NO SCHEMA CHANGES** to Supabase or trace structure during this process.
- **DO NOT MERGE TO MAIN** unless explicitly tagged and stable.

---

## 🚀 DEPLOYMENT STATUS

**Current Status:** Planning Phase - Ready for Review
**Target:** Stable production deploy with all features working
**Last Updated:** 2025-01-27

### ✅ CONFIRMED WORKING FEATURES (Local Testing)
- **Narrative Generation**: Full headlines, taglines, stories, ownership notes ✅
- **Gemini Verification**: Real web searches, evidence analysis, "confirmed" status ✅  
- **Cache System**: Successful writes, proper hit/miss logic ✅
- **Agent Execution Trace**: Structured trace with proper sections ✅
- **UI Components**: Verification badges, details panels rendering ✅

### 📊 LOCAL TEST RESULTS
- **Nike**: Cache hit with narrative + verification fields
- **The Ordinary**: Full pipeline with Gemini verification (confirmed status)
- **Cache writes**: Successful to Supabase with proper RLS
- **Trace structure**: 6 agent execution stages properly logged
