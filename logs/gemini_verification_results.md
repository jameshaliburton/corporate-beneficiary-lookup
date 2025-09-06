# Gemini Verification Test Results

**Test Date**: 2025-09-05T21:27:06.628Z
**Production API**: https://ownedby.app/api/lookup
**Total Tests**: 8
**Passed**: 5 ✅
**Failed**: 3 ❌
**Errors**: 0 🚨
**Warnings**: 0 ⚠️

## Test Results

| Brand | Product | Cache Hit | Has Verification | Verification Status | Gemini Triggered | Expected? | Response Time | Notes |
|-------|---------|-----------|------------------|-------------------|------------------|-----------|---------------|-------|
| Pop-Tarts | Frosted Cookies & Crème | ❌ | ❌ | N/A | ⏭️ | ❌ | 13333ms | No cache entry - Gemini should run |
| Delta | Airlines | ❌ | ❌ | N/A | ⏭️ | ❌ | 11753ms | No cache entry - Gemini should run |
| Rabén & Sjögren | Rabén & Sjögren | ❌ | ❌ | N/A | ⏭️ | ❌ | 12856ms | No cache entry - Gemini should run |
| Kellogg's | Kellogg's | ❌ | ❌ | N/A | ✅ | ✅ | 66433ms | No cache entry - Gemini should run |
| Zara | Zara | ❌ | ❌ | N/A | ✅ | ✅ | 46396ms | No cache entry - Gemini should run |
| Red Bull | Red Bull | ❌ | ❌ | N/A | ✅ | ✅ | 36336ms | No cache entry - Gemini should run |
| Boots Pharmacy | Boots Pharmacy | ❌ | ❌ | N/A | ✅ | ✅ | 27869ms | No cache entry - Gemini should run |
| Super Unknown™️ | Super Unknown™️ | ❌ | ❌ | N/A | ✅ | ✅ | 2224ms | No cache entry - Gemini should run |

## Summary

❌ **Unexpected behavior detected!** 3 tests showed unexpected behavior. Review the cache logic.

## Test Configuration

- **API Endpoint**: https://ownedby.app/api/lookup
- **Cache Table**: products
- **Test Brands**: 8
- **Test Duration**: 226s

