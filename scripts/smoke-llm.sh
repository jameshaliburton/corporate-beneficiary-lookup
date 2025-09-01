#!/usr/bin/env bash
set -euo pipefail

echo "SMOKE: Normal path"
curl -s -X POST http://localhost:3000/api/lookup -H "Content-Type: application/json" -d '{"brand":"Nike"}' | jq '.trace.llm.status, .trace.cache, .trace.sources' || true

echo "SMOKE: Simulated overload (dev only)"
curl -s -X POST http://localhost:3000/api/lookup -H "Content-Type: application/json" -H "X-Debug-LLM: 529" -d '{"brand":"Delta"}' | jq '.trace.llm, .trace.decision_rules, (.trace.disambiguation_options|length)' || true

echo "SMOKE: Warm cache"
curl -s -X POST http://localhost:3000/api/lookup -H "Content-Type: application/json" -d '{"brand":"Nike"}' | jq '.trace.cache' || true
