#!/bin/bash

# Warm cache evaluation script
# Runs cold pass (priming), then warm pass (re-using cache), and compares results

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting warm cache evaluation...${NC}"

# Set environment flags for evaluation
export CACHE_ENABLED=true
export RAG_ENABLED=true
export SEARCH_WIDER_ENABLED=true
export CACHE_ENTITY_TTL=1209600
export CACHE_CANDIDATE_TTL=259200

echo -e "${YELLOW}Cache and RAG enabled for evaluation${NC}"

# Check if server is already running
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${YELLOW}Server already running on port 3000${NC}"
else
    echo -e "${YELLOW}Starting development server...${NC}"
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to be ready
    echo -e "${YELLOW}Waiting for server to be ready...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}Server ready!${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}Server failed to start within 30 seconds${NC}"
            exit 1
        fi
        sleep 1
    done
fi

# Create output directory
mkdir -p eval/out

echo -e "${YELLOW}Running COLD PASS (priming cache)...${NC}"
node scripts/eval-disambig.mjs --out eval/out/report-cold.csv --summary eval/out/summary-cold.json

echo -e "${YELLOW}Running WARM PASS (using cache)...${NC}"
node scripts/eval-disambig.mjs --out eval/out/report-warm.csv --summary eval/out/summary-warm.json

# Load results for comparison
COLD_SUMMARY=$(cat eval/out/summary-cold.json)
WARM_SUMMARY=$(cat eval/out/summary-warm.json)

# Extract metrics
COLD_BRAND_HIT_RATE=$(echo "$COLD_SUMMARY" | jq -r '.brand_cache_hit_rate // 0')
WARM_BRAND_HIT_RATE=$(echo "$WARM_SUMMARY" | jq -r '.brand_cache_hit_rate // 0')
COLD_ENTITY_HIT_RATE=$(echo "$COLD_SUMMARY" | jq -r '.entity_cache_hit_rate // 0')
WARM_ENTITY_HIT_RATE=$(echo "$WARM_SUMMARY" | jq -r '.entity_cache_hit_rate // 0')
COLD_WRONG_ACCEPT=$(echo "$COLD_SUMMARY" | jq -r '.wrong_accept_excluding_ties // 0')
WARM_WRONG_ACCEPT=$(echo "$WARM_SUMMARY" | jq -r '.wrong_accept_excluding_ties // 0')
COLD_RAG_USED=$(echo "$COLD_SUMMARY" | jq -r '.rag_usage_rate // 0')
WARM_RAG_USED=$(echo "$WARM_SUMMARY" | jq -r '.rag_usage_rate // 0')

echo -e "${YELLOW}=== CACHE WARM COMPARISON ===${NC}"
echo -e "Brand cache hit rate: ${COLD_BRAND_HIT_RATE} → ${WARM_BRAND_HIT_RATE}"
echo -e "Entity cache hit rate: ${COLD_ENTITY_HIT_RATE} → ${WARM_ENTITY_HIT_RATE}"
echo -e "Wrong accept rate: ${COLD_WRONG_ACCEPT} → ${WARM_WRONG_ACCEPT}"
echo -e "RAG usage rate: ${COLD_RAG_USED} → ${WARM_RAG_USED}"

# Check acceptance gates
FAILED=false

if (( $(echo "$WARM_BRAND_HIT_RATE < 0.60" | bc -l) )); then
    echo -e "${RED}❌ Warm brand cache hit rate ${WARM_BRAND_HIT_RATE} < 0.60 threshold${NC}"
    FAILED=true
fi

if (( $(echo "$WARM_WRONG_ACCEPT > $COLD_WRONG_ACCEPT + 0.05" | bc -l) )); then
    echo -e "${RED}❌ Warm wrong accept rate ${WARM_WRONG_ACCEPT} > cold ${COLD_WRONG_ACCEPT} + 0.05${NC}"
    FAILED=true
fi

if [ "$FAILED" = true ]; then
    echo -e "${RED}❌ Warm cache evaluation FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Warm cache evaluation PASSED${NC}"
fi

# Clean up server if we started it
if [ ! -z "$SERVER_PID" ]; then
    echo -e "${YELLOW}Stopping development server...${NC}"
    kill $SERVER_PID 2>/dev/null || true
fi
