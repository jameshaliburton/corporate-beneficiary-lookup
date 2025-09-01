#!/usr/bin/env bash
curl -s http://localhost:3000/api/health | jq '{llm, db, cache}'
