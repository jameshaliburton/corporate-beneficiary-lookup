#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting disambiguation evaluation...${NC}"

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
    SERVER_PID=""
else
    echo -e "${YELLOW}Starting development server...${NC}"
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to start
    echo -e "${YELLOW}Waiting for server to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}Server started successfully${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}Server failed to start within 30 seconds${NC}"
            if [ ! -z "$SERVER_PID" ]; then
                kill $SERVER_PID 2>/dev/null || true
            fi
            exit 1
        fi
        sleep 1
    done
fi

# Run evaluation
echo -e "${YELLOW}Running evaluation...${NC}"
node scripts/eval-disambig.mjs

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    echo -e "${YELLOW}Stopping server...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
fi

echo -e "${GREEN}Evaluation complete!${NC}"
echo -e "${YELLOW}Check eval/out/ for results${NC}"
