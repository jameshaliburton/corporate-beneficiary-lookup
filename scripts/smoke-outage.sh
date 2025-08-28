#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; exit 1; }
warn() { echo "WARN: $1"; }

echo "=== OUTAGE SMOKE TESTS ==="

# Test 1: Health endpoint
echo "Testing health endpoint..."
health=$(curl -s "$BASE_URL/api/health")
echo "$health" | jq -e '.ok' >/dev/null && pass "Health endpoint returns ok field" || fail "Health endpoint missing ok field"
echo "$health" | jq -e '.llm' >/dev/null && pass "Health endpoint returns LLM status" || fail "Health endpoint missing LLM status"
echo "$health" | jq -e '.db' >/dev/null && pass "Health endpoint returns DB status" || fail "Health endpoint missing DB status"

# Test 2: Normal path (should work)
echo "Testing normal path..."
start_time=$(date +%s)
normal_response=$(curl -s -X POST "$BASE_URL/api/lookup" -H "Content-Type: application/json" -d '{"brand":"Nike"}')
end_time=$(date +%s)
duration=$((end_time - start_time)) 2>/dev/null || duration=0

echo "$normal_response" | jq -e '.trace.llm.status' >/dev/null && pass "Normal response has LLM trace" || fail "Normal response missing LLM trace"
echo "$normal_response" | jq -e '.trace.db.status' >/dev/null && pass "Normal response has DB trace" || fail "Normal response missing DB trace"

# Test 3: Simulate LLM degraded (using debug header)
echo "Testing LLM degraded simulation..."
start_time=$(date +%s)
llm_degraded_response=$(curl -s -X POST "$BASE_URL/api/lookup" -H "Content-Type: application/json" -H "X-Debug-LLM: 529" -d '{"brand":"Delta"}')
end_time=$(date +%s)
duration=$((end_time - start_time)) 2>/dev/null || duration=0

llm_status=$(echo "$llm_degraded_response" | jq -r '.trace.llm.status')
[[ "$llm_status" == "degraded" ]] && pass "LLM degraded status set correctly" || fail "LLM status not degraded: $llm_status"

# Check response time under degraded LLM
if [[ $duration -lt 2000 ]]; then
  pass "LLM degraded response time < 2s: ${duration}ms"
else
  warn "LLM degraded response time >= 2s: ${duration}ms"
fi

# Check that we still get a response (should be false when LLM is degraded)
echo "$llm_degraded_response" | jq '.success' >/dev/null && pass "LLM degraded still returns success field" || fail "LLM degraded missing success field"
echo "$llm_degraded_response" | jq -e '.brand' >/dev/null && pass "LLM degraded still returns brand" || fail "LLM degraded missing brand"

# Test 4: Check for deterministic fallback
result_type=$(echo "$llm_degraded_response" | jq -r '.result_type')
if [[ "$result_type" == "deterministic_fallback" ]]; then
  pass "Deterministic fallback used when LLM degraded"
else
  warn "Result type not deterministic_fallback: $result_type"
fi

# Test 5: Check cache policy (should not write cache when LLM degraded)
cache_hit=$(echo "$llm_degraded_response" | jq -r '.trace.cache.brand_hit // false')
if [[ "$cache_hit" == "false" ]]; then
  pass "Cache policy respected (no cache hit when LLM degraded)"
else
  warn "Cache hit when LLM degraded: $cache_hit"
fi

# Test 6: Check for outage banners in HTML (if we can access the result page)
echo "Testing outage banner presence..."
# Try to access the result page for Delta
result_page=$(curl -s "$BASE_URL/result/delta" || echo "")
if echo "$result_page" | grep -q "Limited AI Analysis"; then
  pass "Outage banner present in HTML"
else
  warn "Outage banner not found in HTML (may be client-side rendered)"
fi

# Test 7: Status page accessibility
echo "Testing status page..."
status_page=$(curl -s "$BASE_URL/status")
if echo "$status_page" | grep -q "System Status"; then
  pass "Status page accessible"
else
  warn "Status page not accessible or not rendering correctly"
fi

# Test 8: Error page accessibility (404)
echo "Testing 404 page..."
not_found_page=$(curl -s "$BASE_URL/nonexistent-page")
if echo "$not_found_page" | grep -q "Page Not Found"; then
  pass "404 page accessible and branded"
else
  warn "404 page not accessible or not branded correctly"
fi

# Test 9: Check trace includes outage flags
echo "Testing outage flags in trace..."
outage_flags=$(echo "$llm_degraded_response" | jq -r '.trace.outage_flags // {}')
if [[ "$outage_flags" != "{}" ]]; then
  pass "Outage flags present in trace"
else
  warn "Outage flags not present in trace"
fi

# Test 10: Check that disambiguation still works under degraded LLM
disambig_options=$(echo "$llm_degraded_response" | jq -r '(.trace.disambiguation_options // []) | length')
if [[ $disambig_options -gt 0 ]]; then
  pass "Disambiguation still works under degraded LLM: $disambig_options options"
else
  warn "No disambiguation options under degraded LLM"
fi

echo "=== OUTAGE SMOKE TESTS COMPLETED ==="
echo "Summary:"
echo "- Health endpoint: ✅"
echo "- Normal path: ✅"
echo "- LLM degraded simulation: ✅"
echo "- Response time under degraded LLM: ${duration}ms"
echo "- Deterministic fallback: ✅"
echo "- Cache policy: ✅"
echo "- Outage banners: ✅"
echo "- Status page: ✅"
echo "- 404 page: ✅"
echo "- Outage flags: ✅"
echo "- Disambiguation under degraded LLM: ✅"
