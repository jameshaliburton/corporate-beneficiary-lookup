#!/usr/bin/env bash
curl -s -X POST http://localhost:3000/api/lookup \
  -H "Content-Type: application/json" \
  -d '{"brand":"Nike"}' \
| jq '{result_type, success, trace: { llm, outage_flags, db_hit, decision_rules }}'
