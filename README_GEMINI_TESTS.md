# Gemini Verification Test Suite

This test suite validates the cache + Gemini verification system behavior in production without modifying any data.

## 🧪 **What It Tests**

The test suite checks:
- **Cache State**: Whether brands are cached and have verification metadata
- **Gemini Behavior**: Whether Gemini runs or skips based on cache state
- **Expected Behavior**: Validates that the system behaves as expected

## 🚀 **How to Run**

### **Basic Test Run**
```bash
# Run tests against production
npx ts-node testGeminiBehavior.ts
```

### **Fresh Run (Purge Cache)**
```bash
# Run with cache purging (use with caution)
npx ts-node testGeminiBehavior.ts --fresh-run
```

## 📊 **Test Brands**

The suite tests these brands with different expected behaviors:

| Brand | Expected Behavior | Notes |
|-------|------------------|-------|
| **Pop-Tarts** | Cache hit with verification | Known working case |
| **Delta** | Potential no Gemini | Airline brand |
| **Rabén & Sjögren** | Previously failed | Complex brand name |
| **Kellogg's** | Should skip Gemini | Parent company |
| **Zara** | Possibly unverified | Fashion brand |
| **Red Bull** | Known verified | Energy drink |
| **Boots Pharmacy** | Gemini fallback | UK pharmacy |
| **Super Unknown™️** | Expect Gemini run | Unknown brand |

## 📋 **Output**

### **Console Output**
- Real-time test progress
- Cache state for each brand
- Gemini trigger status
- Pass/fail indicators

### **Results File**
- **Location**: `logs/gemini_verification_results.md`
- **Format**: Markdown table with detailed results
- **Columns**: Brand, Cache Hit, Verification Status, Gemini Triggered, Expected?, Notes

## 🛡️ **Safety Features**

- **Read-Only**: Never modifies database or cache
- **Rate Limiting**: 1-second delay between requests
- **Error Handling**: Graceful handling of API errors
- **Fresh Run Protection**: 5-second delay before cache purging

## 📊 **Expected Results**

### **✅ Pass Cases**
- No cache → Gemini triggered
- Cache with verification → Gemini skipped
- Cache without verification → Logged as warning

### **❌ Fail Cases**
- Cache hit but Gemini still triggered (unexpected)
- No cache but Gemini skipped (unexpected)

### **⚠️ Warning Cases**
- Cache hit without verification metadata (ambiguous)

## 🔧 **Configuration**

### **Environment Variables Required**
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for cache access

### **API Endpoint**
- **Production**: `https://ownedby.app/api/lookup`
- **Method**: POST
- **Body**: `{ "brand": string, "product_name": string }`

## 📈 **Performance**

- **Target Runtime**: <10 minutes
- **Concurrency**: Sequential (1 request per second)
- **Rate Limiting**: Built-in delays to avoid API limits

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Environment Variables Missing**
   ```bash
   # Check if variables are set
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **API Errors**
   - Check production API status
   - Verify network connectivity
   - Check rate limiting

3. **Cache Access Issues**
   - Verify Supabase credentials
   - Check database permissions
   - Ensure service role key is correct

### **Debug Mode**
```bash
# Run with verbose logging
DEBUG=* npx ts-node testGeminiBehavior.ts
```

## 📝 **Results Interpretation**

### **Status Indicators**
- ✅ **Pass**: Expected behavior confirmed
- ❌ **Fail**: Unexpected behavior detected
- 🚨 **Error**: API or database error
- ⚠️ **Warning**: Ambiguous cache state

### **Cache States**
- **Hit**: Brand found in cache
- **Miss**: Brand not in cache
- **Verification**: Has verification metadata
- **No Verification**: Missing verification fields

### **Gemini Behavior**
- **Triggered**: Gemini analysis was run
- **Skipped**: Gemini was bypassed (cache hit)

## 🔄 **Integration with CI/CD**

The test suite can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Gemini Verification Tests
  run: |
    npx ts-node testGeminiBehavior.ts
    # Check if results file was created
    test -f logs/gemini_verification_results.md
```

## 📚 **Related Documentation**

- [Production Status](PRODUCTION_STATUS.md)
- [Release Notes](RELEASE_NOTES.md)
- [Deployment Guide](SAFE_DEPLOY_PLAN_CACHE_GEMINI.md)

---

**Last Updated**: September 5, 2025  
**Test Suite Version**: 1.0.0  
**Production System**: v2.0.0-cache-verification
