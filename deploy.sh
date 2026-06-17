#!/usr/bin/env bash
# =============================================================================
# Local ship command — commit current work and deploy to the VPS.
# =============================================================================
# Usage:
#   ./deploy.sh "feat: my change"
#
# What it does:
#   1. Stages every change          (git add -A)
#   2. Commits with your message     (git commit -m "...")
#   3. Pushes your current branch to main  (git push origin HEAD:main)
#
# Pushing to main triggers GitHub Actions (.github/workflows/deploy.yml),
# which SSHes into the VPS and runs scripts/deploy.sh:
#   git pull → docker compose up -d --build (backend + frontend + nginx)
#   → alembic upgrade head → health check.
#
# NOTE: this does NOT run the deploy on the VPS itself — GitHub Actions does.
#       To force a redeploy directly on the server, run scripts/deploy.sh there.
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
log()     { echo -e "${BLUE}▸${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }

# ── Validate input ──────────────────────────────────────────────────────────
MSG="${1:-}"
[ -z "$MSG" ] && error "Commit message required.  Usage: ./deploy.sh \"feat: my change\""

# ── Must be inside the repo ─────────────────────────────────────────────────
cd "$(dirname "$0")"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || error "Not a git repository."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "Current branch: ${BRANCH}  →  deploying to: main"

# ── Stage + commit (skip commit cleanly if nothing changed) ─────────────────
git add -A
if git diff --cached --quiet; then
    log "No staged changes — skipping commit, will still push current HEAD."
else
    git commit -m "$MSG"
    success "Committed: $MSG"
fi

# ── Push current HEAD to main → triggers the deploy pipeline ────────────────
log "Pushing to origin/main..."
git push origin "HEAD:main"
success "Pushed to main."

echo ""
success "GitHub Actions is now deploying to the VPS."
echo "  Watch:   gh run watch        (or the Actions tab on GitHub)"
