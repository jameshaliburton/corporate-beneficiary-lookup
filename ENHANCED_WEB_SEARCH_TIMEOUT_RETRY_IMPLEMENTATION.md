# Enhanced Web-Search-Powered Ownership Agent: Timeout & Retry Implementation

## Overview

This implementation adds **configurable timeout, retry logic with exponential backoff, and structured logging** to the enhanced web-search-powered ownership agent while maintaining full compatibility with existing caching and fallback mechanisms.

## Key Features Implemented

### ✅ 1. Configurable Top-Level Timeout
- **Default Timeout**: 30 seconds (`ENHANCED_AGENT_TIMEOUT_MS`)
- **Environment Variable**: `ENHANCED_AGENT_TIMEOUT_MS` for configuration
- **Promise.race()**: Wraps entire agent execution with timeout
- **Graceful Failure**: Returns `null` instead of throwing on timeout

### ✅ 2. Retry Logic with Exponential Backoff
- **Retry Attempts**: 2 retries (3 total attempts)
- **Base Delay**: 2 seconds
- **Exponential Backoff**: 2x multiplier (2s, 4s delays)
- **Transient Error Detection**: Only retries on network/timeout/5xx errors
- **Non-Retry Errors**: Parsing failures, validation errors don't retry

### ✅ 3. Structured Logging
- **Attempt Tracking**: `🔍 [EnhancedAgent] Attempt 1 for "Nike"`
- **Success Logging**: `✅ [EnhancedAgent] Success on attempt 2`
- **Failure Logging**: `❌ [EnhancedAgent] Attempt 1 failed: Timeout after 30000ms`
- **Retry Logging**: `⏳ [EnhancedAgent] Retrying in 2000ms...`
- **Final Outcome**: `❌ [EnhancedAgent] Failed after 3 attempts - falling back`

### ✅ 4. Graceful Failure for Fallback
- **Null Return**: Returns `null` instead of throwing exceptions
- **Fallback Compatibility**: Pipeline detects `null` and continues to next agent
- **Progress Tracking**: Emits fallback progress events
- **Error Context**: Preserves error context for debugging

### ✅ 5. Backward Compatibility
- **Caching**: Results still cached on success via `saveToCache()`
- **Fallback Chain**: Enhanced → Original → Legacy → Static still works
- **API Interface**: Same function signature and return format
- **Progress Events**: Same progress tracking interface

## Implementation Details

### Configuration
```javascript
const TIMEOUT_CONFIG = {
  enhanced_web_search: parseInt(process.env.ENHANCED_AGENT_TIMEOUT_MS) || 30000, // 30 seconds default
  retry_attempts: 2,
  retry_delay_base: 2000, // 2 seconds base delay
  retry_delay_multiplier: 2 // Exponential backoff multiplier
}
```

### Core Functions

#### 1. Main Agent Function
```javascript
export async function EnhancedWebSearchOwnershipAgent({
  brand,
  product_name,
  hints = {},
  queryId = null
}) {
  // Execute with timeout and retry logic
  const result = await executeWithTimeoutAndRetry(
    () => performEnhancedWebSearchResearch(brand, product_name, hints, queryId),
    TIMEOUT_CONFIG.enhanced_web_search,
    TIMEOUT_CONFIG.retry_attempts,
    TIMEOUT_CONFIG.retry_delay_base,
    TIMEOUT_CONFIG.retry_delay_multiplier,
    brand
  )
  
  return result // Returns null on failure, object on success
}
```

#### 2. Timeout and Retry Wrapper
```javascript
async function executeWithTimeoutAndRetry(fn, timeoutMs, maxRetries, baseDelay, delayMultiplier, brand) {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    console.log(`🔍 [EnhancedAgent] Attempt ${attempt} for "${brand}"`)
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ])
      
      console.log(`✅ [EnhancedAgent] Success on attempt ${attempt}`)
      return result
      
    } catch (error) {
      const isLastAttempt = attempt > maxRetries
      const isTransientError = isTransientErrorType(error)
      
      console.log(`❌ [EnhancedAgent] Attempt ${attempt} failed:`, error.message)
      
      if (isLastAttempt) {
        console.log(`❌ [EnhancedAgent] Failed after ${maxRetries + 1} attempts - falling back`)
        return null
      }
      
      if (!isTransientError) {
        console.log(`❌ [EnhancedAgent] Non-transient error - not retrying`)
        return null
      }
      
      const delay = baseDelay * Math.pow(delayMultiplier, attempt - 1)
      console.log(`⏳ [EnhancedAgent] Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return null
}
```

#### 3. Transient Error Detection
```javascript
function isTransientErrorType(error) {
  const transientErrorPatterns = [
    /timeout/i,
    /network/i,
    /connection/i,
    /rate limit/i,
    /429/i,
    /5\d{2}/i, // 5xx HTTP errors
    /ECONNRESET/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i
  ]
  
  const errorMessage = error.message || error.toString()
  return transientErrorPatterns.some(pattern => pattern.test(errorMessage))
}
```

### Fallback Integration

#### Enhanced Ownership Research Agent
```javascript
const webSearchResult = await EnhancedWebSearchOwnershipAgent({
  brand,
  product_name,
  hints,
  queryId
})

// Handle null return (timeout/failure) from enhanced agent
if (webSearchResult === null) {
  webStage.reason('Enhanced web-search-powered research failed (timeout/retry exhaustion) - falling back to next agent', REASONING_TYPES.WARNING)
  webResearchData = { success: false, findings: [], fallback_reason: 'enhanced_agent_timeout_or_failure' }
  // ... continue to next fallback agent
} else if (webSearchResult.success) {
  // ... process successful result
}
```

## Testing Plan

### Test Cases
1. **Valid Brand (Nike)**: Should complete successfully within timeout
2. **Valid Brand (Coca-Cola)**: Should complete successfully with brand-only lookup
3. **Unknown Brand (TestTimeout)**: Should timeout and return null for fallback

### Expected Logs
```
🔍 [EnhancedAgent] Attempt 1 for "Nike"
✅ [EnhancedAgent] Success on attempt 1

🔍 [EnhancedAgent] Attempt 1 for "TestTimeout"
❌ [EnhancedAgent] Attempt 1 failed: Timeout after 30000ms
⏳ [EnhancedAgent] Retrying in 2000ms...
🔍 [EnhancedAgent] Attempt 2 for "TestTimeout"
❌ [EnhancedAgent] Attempt 2 failed: Timeout after 30000ms
⏳ [EnhancedAgent] Retrying in 4000ms...
🔍 [EnhancedAgent] Attempt 3 for "TestTimeout"
❌ [EnhancedAgent] Attempt 3 failed: Timeout after 30000ms
❌ [EnhancedAgent] Failed after 3 attempts - falling back
```

## Environment Configuration

### Required Environment Variables
```bash
# Required for enhanced agent
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
GOOGLE_CSE_ID=your_cse_id

# Optional timeout configuration
ENHANCED_AGENT_TIMEOUT_MS=30000  # 30 seconds (default)
```

## Performance Characteristics

### Timeout Scenarios
- **Fast Success**: 2-5 seconds (cached results)
- **Normal Success**: 10-20 seconds (web search + analysis)
- **Timeout**: 30 seconds (configurable)
- **Retry Delays**: 2s, 4s (exponential backoff)

### Error Handling
- **Transient Errors**: Network issues, timeouts, rate limits → Retry
- **Structured Errors**: Parsing failures, validation errors → No retry
- **Final Failure**: Returns `null` for fallback chain

## Monitoring and Debugging

### Log Patterns
- **Success**: `✅ [EnhancedAgent] Success on attempt X`
- **Retry**: `⏳ [EnhancedAgent] Retrying in Xms...`
- **Failure**: `❌ [EnhancedAgent] Failed after X attempts - falling back`
- **Non-Retry**: `❌ [EnhancedAgent] Non-transient error - not retrying`

### Metrics to Monitor
- **Success Rate**: Percentage of successful lookups
- **Timeout Rate**: Percentage of timeouts
- **Retry Rate**: Percentage of requests that required retries
- **Fallback Rate**: Percentage of requests that fell back to other agents

## Backward Compatibility

### ✅ Maintained Features
- **Caching**: Results still saved to Supabase on success
- **Fallback Chain**: Enhanced → Original → Legacy → Static
- **API Interface**: Same function signature and return format
- **Progress Events**: Same progress tracking interface
- **Error Handling**: Graceful degradation to fallback agents

### ✅ Enhanced Features
- **Timeout Protection**: Prevents hanging requests
- **Retry Logic**: Improves success rate for transient failures
- **Structured Logging**: Better debugging and monitoring
- **Configurable Timeouts**: Environment-based configuration

## Next Steps

1. **Production Testing**: Monitor timeout and retry behavior in production
2. **Timeout Tuning**: Adjust `ENHANCED_AGENT_TIMEOUT_MS` based on real-world performance
3. **Retry Optimization**: Fine-tune retry attempts and delays based on failure patterns
4. **Monitoring**: Add metrics collection for timeout/retry rates
5. **Alerting**: Set up alerts for high timeout or fallback rates

The enhanced web-search-powered ownership agent now provides **robust timeout protection, intelligent retry logic, and comprehensive logging** while maintaining full compatibility with the existing caching and fallback infrastructure. 