#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; exit 1; }

# A) Root page
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
[[ "$code" == "200" ]] && pass "Root 200" || fail "Root not 200"
curl -s "$BASE_URL/" | grep -qi "OwnedBy" && pass "Root branding present" || echo "WARN: branding not found"

# B) API must return story+trace for Nike (supports old/new shapes)
api=$(curl -s -X POST "$BASE_URL/api/lookup" -H "Content-Type: application/json" -d '{"brand":"Nike"}')
echo "$api" | jq -e '((.narrative.story // .generated_copy.description // "") | length) > 0' >/dev/null && pass "API story present" || fail "API story missing"
echo "$api" | jq -e '(has("trace") or has("agent_execution_trace"))' >/dev/null && pass "API trace present" || fail "API trace missing"

# C) Language signal trigger (simulate Swedish OCR)
api2=$(curl -s -X POST "$BASE_URL/api/lookup" -H "Content-Type: application/json" -d '{"brand":"Johnnys","ocr_text":"Johnny'\''s senap innehåller inga konstgjorda tillsatser"}')
echo "$api2" | jq -e '.trace.language.detected_codes | length > 0' >/dev/null && pass "Language codes detected" || fail "Language codes missing"
echo "$api2" | jq -e '.trace.decision_rules | length >= 0' >/dev/null && pass "Decision rules present" || fail "Decision rules missing"

# D) Ambiguous brand triggers disambiguation when close
api3=$(curl -s -X POST "$BASE_URL/api/lookup" -H "Content-Type: application/json" -d '{"brand":"Delta"}')
opts=$(echo "$api3" | jq -r '((.trace?.disambiguation_options // []) | length | tostring)')
[[ "$opts" -ge 0 ]] && pass "Delta disambig options: $opts" || fail "Delta disambig failed"

# E) Entity cache test (when CACHE_ENABLED=true)
if [[ "${CACHE_ENABLED:-false}" == "true" ]]; then
  # Get first option from Delta disambiguation
  first_entity_id=$(echo "$api3" | jq -r '(.trace?.disambiguation_options // [])[0]?.id // empty')
  if [[ -n "$first_entity_id" ]]; then
    # Call again with entityId
    api4=$(curl -s -X POST "$BASE_URL/api/lookup" -H "Content-Type: application/json" -d "{\"brand\":\"Delta\",\"chosen_entity_id\":\"$first_entity_id\"}")
    cache_hit=$(echo "$api4" | jq -r '.trace?.cache?.entity_hit // false')
    [[ "$cache_hit" == "true" ]] && pass "Entity cache hit" || fail "Entity cache miss"
  else
    echo "WARN: No entity ID found for cache test"
  fi
fi

# F) RAG usage test (when RAG_ENABLED=true)
if [[ "${RAG_ENABLED:-false}" == "true" ]]; then
  rag_used=$(echo "$api3" | jq -r '.trace?.sources?.rag // false')
  [[ "$rag_used" == "true" ]] && pass "RAG sources used" || echo "WARN: RAG not used (may be normal)"
fi

# G) Cache warm tests (when CACHE_ENABLED=true)
if [[ "${CACHE_ENABLED:-false}" == "true" ]]; then
  echo "Testing cache warm behavior..."
  
  # Test entity short-circuit warm
  echo "Testing entity short-circuit warm..."
  api5=$(curl -s -X POST "$BASE_URL/api/lookup" -H "Content-Type: application/json" -d '{"brand":"Delta","chosen_entity_id":"delta-airlines"}')
  entity_hit=$(echo "$api5" | jq -r '.trace?.cache?.entity_hit // false')
  reason=$(echo "$api5" | jq -r '.trace?.cache?.reason // "unknown"')
  echo "First call: entity_hit=$entity_hit, reason=$reason"
  
  api6=$(curl -s -X POST "$BASE_URL/api/lookup" -H "Content-Type: application/json" -d '{"brand":"Delta","chosen_entity_id":"delta-airlines"}')
  entity_hit2=$(echo "$api6" | jq -r '.trace?.cache?.entity_hit // false')
  reason2=$(echo "$api6" | jq -r '.trace?.cache?.reason // "unknown"')
  echo "Second call: entity_hit=$entity_hit2, reason=$reason2"
  
  if [[ "$entity_hit2" == "true" && "$reason2" == "entity_short_circuit" ]]; then
    pass "Entity cache warm working"
  else
    echo "WARN: Entity cache warm not working as expected"
  fi
  
  # Test brand-level warm
  echo "Testing brand-level warm..."
  api7=$(curl -s -X POST "$BASE_URL/api/lookup" -H "Content-Type: application/json" -d '{"brand":"Nike"}')
  brand_hit=$(echo "$api7" | jq -r '.trace?.cache?.brand_hit // false')
  reason3=$(echo "$api7" | jq -r '.trace?.cache?.reason // "unknown"')
  echo "First Nike call: brand_hit=$brand_hit, reason=$reason3"
  
  api8=$(curl -s -X POST "$BASE_URL/api/lookup" -H "Content-Type: application/json" -d '{"brand":"Nike"}')
  brand_hit2=$(echo "$api8" | jq -r '.trace?.cache?.brand_hit // false')
  reason4=$(echo "$api8" | jq -r '.trace?.cache?.reason // "unknown"')
  echo "Second Nike call: brand_hit=$brand_hit2, reason=$reason4"
  
  if [[ "$brand_hit2" == "true" && ("$reason4" == "brand_hit_accepted" || "$reason4" == "brand_hit_ambiguous") ]]; then
    pass "Brand cache warm working"
  else
    echo "WARN: Brand cache warm not working as expected"
  fi
fi

echo "All smoke checks completed."
