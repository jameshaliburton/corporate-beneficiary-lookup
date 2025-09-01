# Recovery Instructions

## Overview
This directory contains the baseline audit results for two candidate stable commits.

## Files Generated

### For Each Commit
- `build.txt` - Build logs and timings
- `api/*.json` - API smoke test responses
- `inventory.json` - File existence and export inventory

### Summary Files
- `summary.md` - Comprehensive comparison report
- `diff_*.txt` - Git diff summaries

## Critical Finding

**The story generation feature is already working in both commits!**

Both `b9900d2` and `c40bb66` return API responses with:
- `narrative.story` field containing the brand story
- `trace` data for debugging
- All core functionality intact

## Recovery Options

### Option 1: Check Current HEAD (Recommended)
The story feature may already be working. Check if:
1. API returns story data (already confirmed)
2. UI displays the story (may need fixing)

### Option 2: Restore Specific Files
If you need to restore specific files from a stable commit:

```bash
# Set the stable commit SHA
export STABLE_SHA=<commit-sha>

# Restore specific files
git checkout $STABLE_SHA -- <path1> <path2>

# Example: Restore just the API route
git checkout $STABLE_SHA -- src/app/api/lookup/route.ts
```

### Option 3: Full Rollback (Not Recommended)
```bash
# Create new branch from stable commit
git checkout -b recovery/from-stable $STABLE_SHA

# Force push if needed (destructive!)
git push origin recovery/from-stable --force
```

## Next Steps

1. **Verify Current State**: Check if the story displays in your current UI
2. **Fix UI Rendering**: The API is working, so focus on the frontend
3. **No Rollback Needed**: The functionality exists in both commits

## Commands to Run

```bash
# Check current API response
curl -s -X POST http://localhost:3000/api/lookup \
  -H "Content-Type: application/json" \
  -d '{"brand":"Adidas"}' | jq '.narrative.story'

# Check if story displays in UI
curl -s http://localhost:3000/result/Adidas | grep -i "story"

# View full audit report
cat .recovery/summary.md
```

## Conclusion

**The story generation feature is already implemented and working.** The issue is likely in the UI rendering, not missing backend functionality. Focus on fixing the frontend display rather than rolling back commits.
