#!/usr/bin/env bash
set -euo pipefail

# CONFIG
APP_URL_PATH_RESULT="${APP_URL_PATH_RESULT:-/result/Nike}"
APP_API_PATH="${APP_API_PATH:-/api/lookup}"
SMOKE_BRAND="${SMOKE_BRAND:-Nike}"
TMP_DIR_REL="../lovable-reference-temp-$$"

bold(){ printf "\033[1m%s\033[0m\n" "$*"; }
info(){ printf "• %s\n" "$*"; }
ok(){ printf "✅ %s\n" "$*"; }
warn(){ printf "⚠️  %s\n" "$*"; }
err(){ printf "❌ %s\n" "$*"; }

# 0) Sanity
bold "Sanity: tooling & repo"
command -v vercel >/dev/null 2>&1 || { err "Vercel CLI missing. Install then re-run."; exit 1; }
command -v jq >/dev/null 2>&1 || { warn "jq not found; proceeding without jq."; }
command -v curl >/dev/null 2>&1 || { warn "curl not found; please install for smoke checks."; }
NODE_V=$(node -v || echo "unknown")
info "Node: $NODE_V"
BRANCH=$(git rev-parse --abbrev-ref HEAD || echo "unknown")
SHA=$(git rev-parse --short HEAD || echo "unknown")
info "Branch: $BRANCH @ $SHA"

# 1) Check Vercel project link
bold "Verifying Vercel project link"
if ! vercel project ls >/dev/null 2>&1; then
  err "Vercel not authenticated or project not linked. Run 'vercel login' and 'vercel link' first.";
  exit 1
fi
ok "Vercel CLI authenticated & project link accessible."

# 2) Prepare temp move of problematic directories (if exists)
bold "Preparing workspace"
NEEDS_MOVE_LOVABLE=0
NEEDS_MOVE_SCRIPTS=0
TMP_SCRIPTS_DIR="../scripts-temp-$$"

if [ -d "lovable-reference" ]; then
  NEEDS_MOVE_LOVABLE=1
  info "Temporarily moving ./lovable-reference -> $TMP_DIR_REL"
  mv lovable-reference "$TMP_DIR_REL"
  ok "Moved lovable-reference out of tree."
else
  info "No lovable-reference directory present; nothing to move."
fi

if [ -d "scripts" ]; then
  NEEDS_MOVE_SCRIPTS=1
  info "Temporarily moving ./scripts -> $TMP_SCRIPTS_DIR"
  mv scripts "$TMP_SCRIPTS_DIR"
  ok "Moved scripts out of tree."
else
  info "No scripts directory present; nothing to move."
fi

# 3) Clean install & build
bold "Clean install & build"
rm -rf .next
npm ci
npm run build

ok "Local build complete."

# 4) Deploy prebuilt to prod
bold "Deploying prebuilt to production"
# --confirm avoids interactive prompts; --yes for org/dir prompts if any
DEPLOY_URL=$(vercel deploy --prebuilt --prod --confirm --yes 2>&1 | tail -n1 || true)

if [ -z "${DEPLOY_URL}" ]; then
  err "Failed to capture deployment URL from Vercel output."
  # Restore directories before exit
  if [ $NEEDS_MOVE_LOVABLE -eq 1 ]; then
    mv "$TMP_DIR_REL" lovable-reference || true
  fi
  if [ $NEEDS_MOVE_SCRIPTS -eq 1 ]; then
    mv "$TMP_SCRIPTS_DIR" scripts || true
  fi
  exit 1
fi

ok "Deployed to: $DEPLOY_URL"

# 5) Post-deploy smoke checks
bold "Post-deploy smoke checks"

SMOKE_FAIL=0

# 5a) Root check (should return HTML 200 or 307 if you have redirects)
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/")
if [ "$ROOT_STATUS" = "200" ] || [ "$ROOT_STATUS" = "307" ] || [ "$ROOT_STATUS" = "308" ]; then
  ok "Root reachable ($ROOT_STATUS)"
else
  warn "Root returned HTTP $ROOT_STATUS"
  SMOKE_FAIL=1
fi

# 5b) API check (story + trace fields existence)
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$DEPLOY_URL$APP_API_PATH" -H "Content-Type: application/json" -d "{\"brand\":\"$SMOKE_BRAND\"}")
if [ "$API_STATUS" = "200" ]; then
  ok "API reachable (200)"
else
  warn "API returned HTTP $API_STATUS"
  SMOKE_FAIL=1
fi

# 5c) Result page check: contains "The story of"
RESULT_HTML=$(curl -s "$DEPLOY_URL$APP_URL_PATH_RESULT" || true)
if echo "$RESULT_HTML" | grep -q "The story of"; then
  ok "Result page renders Story section"
else
  warn "Story heading not detected on result page"
  SMOKE_FAIL=1
fi

# 5d) BTS snippet check: contains Behind the Scenes or Source chip patterns
if echo "$RESULT_HTML" | grep -Eiq "Behind the Scenes|Source:|AI analysis|Registry lookup|AI \+ web research|Unverified|Verified"; then
  ok "Behind the Scenes block appears"
else
  warn "Behind the Scenes block not detected"
  SMOKE_FAIL=1
fi

# 6) Restore directories
bold "Restoring workspace"
if [ $NEEDS_MOVE_LOVABLE -eq 1 ]; then
  mv "$TMP_DIR_REL" lovable-reference
  ok "Restored lovable-reference."
fi

if [ $NEEDS_MOVE_SCRIPTS -eq 1 ]; then
  mv "$TMP_SCRIPTS_DIR" scripts
  ok "Restored scripts."
fi

# 7) Summary
bold "Deployment summary"
info "Branch: $BRANCH @ $SHA"
info "Prod URL: $DEPLOY_URL"
if [ $SMOKE_FAIL -eq 0 ]; then
  ok "All post-deploy checks passed."
  exit 0
else
  warn "One or more post-deploy checks failed. Review logs and $DEPLOY_URL."
  exit 2
fi
