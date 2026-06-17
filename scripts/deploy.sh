#!/usr/bin/env bash
# =============================================================================
# JD Skills AI Career Agent — Deploy / Redeploy
# =============================================================================
# Called by GitHub Actions on every push to main.
# Can also be run manually on the VPS for a forced redeploy.
#
# Usage (on VPS):
#   bash /opt/jd-skills/scripts/deploy.sh
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

DEPLOY_DIR="/home/zed/jd-skills"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S UTC')

log()     { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }

echo ""
echo "── Deploy started: $TIMESTAMP ──"

# ── 1. Ensure we are in the project directory ──────────────────────────────
cd "$DEPLOY_DIR" || error "Deploy directory not found: $DEPLOY_DIR"
log "Working directory: $DEPLOY_DIR"

# Compose wrapper. --env-file makes ${DB_PASSWORD} etc. in docker-compose.yml
# resolve from src/.env (the app's env file). Without it, Compose has no source
# for those vars and silently falls back to defaults (e.g. POSTGRES_PASSWORD
# would become "postgres"), causing DB auth failures.
COMPOSE="docker compose --env-file ./src/.env -f docker-compose.yml"

# ── 2. Pull latest code ────────────────────────────────────────────────────
log "Pulling latest code from main..."
git pull origin main
success "Code updated"

# ── 3. Rebuild and restart containers ─────────────────────────────────────
log "Rebuilding images and restarting services..."
$COMPOSE up -d --build
success "Containers restarted"

# ── 3b. Apply database migrations ──────────────────────────────────────────
# Runs in a one-off container that waits for the healthy db (depends_on).
log "Applying database migrations..."
$COMPOSE run --rm web alembic upgrade head
success "Migrations applied"

# ── 4. Clean up stale images (free disk space) ─────────────────────────────
log "Pruning unused images..."
docker image prune -f
success "Disk cleaned"

# ── 5. Health check ────────────────────────────────────────────────────────
log "Waiting 8 seconds for services to be ready..."
sleep 8

if curl -sf http://localhost:8080/health > /dev/null; then
    success "Health check passed — API is live"
else
    echo ""
    echo "Health check failed. Last 30 lines of web logs:"
    $COMPOSE logs --tail=30 web
    error "Deploy failed"
fi

echo ""
echo "── Deploy finished: $(date '+%Y-%m-%d %H:%M:%S UTC') ──"
echo ""
