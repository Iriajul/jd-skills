#!/usr/bin/env bash
# =============================================================================
# JD Skills AI Career Agent — First-Time VPS Setup
# =============================================================================
# Run once on a fresh VPS to install everything and start the project.
#
# Usage:
#   bash setup-vps.sh
#
# Or download and run directly:
#   curl -fsSL https://raw.githubusercontent.com/Iriajul/jd-skills/main/scripts/setup-vps.sh | bash
# =============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log()     { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
section() { echo -e "\n${BOLD}── $1 ──${NC}"; }

# ── Config ────────────────────────────────────────────────────────────────────
REPO_URL="git@github.com:Iriajul/jd-skills.git"
DEPLOY_DIR="/home/zed/jd-skills"

# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BOLD}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  JD Skills — AI Career Agent             ║"
echo "  ║  VPS First-Time Setup                    ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ── Guard: do NOT run as root; must be a sudo-capable user ───────────────────
if [ "$(id -u)" -eq 0 ]; then
    error "Do not run this script with 'sudo bash'. Run as your regular user:\n  bash setup-vps.sh"
fi
if ! groups | grep -qE '\b(sudo|wheel|admin)\b'; then
    error "Current user is not in the sudo group. Add with: sudo usermod -aG sudo $USER"
fi
SUDO="sudo"
# Use sudo for docker if the user is not yet in the docker group
if groups | grep -q docker; then
    DOCKER="docker"
else
    DOCKER="sudo docker"
fi

# ── 1. System packages ────────────────────────────────────────────────────────
section "1. System packages"
log "Updating package index..."
$SUDO apt-get update -qq

for pkg in curl git python3; do
    if ! command -v "$pkg" &>/dev/null; then
        log "Installing $pkg..."
        $SUDO apt-get install -y -qq "$pkg"
    fi
    success "$pkg is available"
done

# ── 2. Docker ─────────────────────────────────────────────────────────────────
section "2. Docker"
if ! command -v docker &>/dev/null; then
    log "Installing Docker..."
    curl -fsSL https://get.docker.com | $SUDO sh
    $SUDO systemctl enable --now docker
    $SUDO usermod -aG docker "$USER"
    DOCKER="sudo docker"   # group membership only takes effect in next login
    success "Docker installed: $(docker --version)"
else
    success "Docker already installed: $(docker --version)"
fi

if ! $DOCKER compose version &>/dev/null; then
    log "Installing Docker Compose plugin..."
    $SUDO apt-get install -y -qq docker-compose-plugin
    success "Docker Compose installed"
else
    success "Docker Compose available: $($DOCKER compose version)"
fi

# ── 3. GitHub SSH access ──────────────────────────────────────────────────────
section "3. GitHub SSH"
SSH_TEST=$(ssh -o StrictHostKeyChecking=no -T git@github.com 2>&1 || true)
if echo "$SSH_TEST" | grep -q "successfully authenticated"; then
    success "GitHub SSH access confirmed"
else
    warn "GitHub SSH key not set up on this VPS."
    echo ""
    echo "  Run these commands, then re-run this script:"
    echo ""
    echo "    ssh-keygen -t ed25519 -C 'vps-deploy' -f ~/.ssh/id_ed25519 -N ''"
    echo "    cat ~/.ssh/id_ed25519.pub"
    echo ""
    echo "  Then add that key at: github.com/settings/keys"
    echo ""
    exit 1
fi

# ── 4. Clone / update repository ─────────────────────────────────────────────
section "4. Repository"
if [ -d "$DEPLOY_DIR/.git" ]; then
    log "Repository already exists — pulling latest code..."
    cd "$DEPLOY_DIR"
    git pull origin main
    success "Code updated to latest main"
else
    log "Cloning repository to $DEPLOY_DIR..."
    git clone "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    success "Repository cloned"
fi

# ── 5. Environment configuration ─────────────────────────────────────────────
section "5. Environment (.env)"
if [ -f "src/.env" ]; then
    warn "src/.env already exists — skipping configuration."
    warn "To reconfigure: rm src/.env && bash scripts/setup-vps.sh"
else
    log "Creating src/.env from example..."
    cp src/.env.example src/.env

    # Auto-generate a secure SECRET_KEY
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i "s|<64-char-hex-string-no-special-characters>|$SECRET_KEY|" src/.env
    success "SECRET_KEY generated automatically"

    # Detect VPS public IP
    VPS_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

    echo ""
    echo -e "${BOLD}  Please enter your configuration values:${NC}"
    echo "  ─────────────────────────────────────────"

    read -rp "  Database password       : " DB_PASS
    sed -i "s|<your-db-password>|$DB_PASS|" src/.env

    read -rp "  OpenAI API key          : " OPENAI_KEY
    sed -i "s|<your-openai-api-key>|$OPENAI_KEY|" src/.env

    read -rp "  Tavily API key          : " TAVILY_KEY
    sed -i "s|<your-tavily-api-key>|$TAVILY_KEY|" src/.env

    # Set CORS to allow the VPS IP
    sed -i "s|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=[\"http://$VPS_IP:8080\"]|" src/.env

    # Set DB host to Docker service name
    sed -i "s|DB_HOST=.*|DB_HOST=db|" src/.env

    success ".env configured for production"
fi

# ── 6. Start containers ───────────────────────────────────────────────────────
section "6. Starting containers"
log "Building images and starting services (this takes a few minutes)..."
$DOCKER compose -f docker-compose.yml up -d --build
$DOCKER image prune -f
success "All containers started"

# ── 7. Health check ───────────────────────────────────────────────────────────
section "7. Health check"
log "Waiting 15 seconds for services to initialize..."
sleep 15

if curl -sf http://localhost:8080/health > /dev/null; then
    success "API is healthy and responding"
else
    error "Health check failed.\n  Check logs: docker compose -f docker-compose.yml logs web"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
VPS_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║  Setup complete!                                         ║"
echo "  ╠══════════════════════════════════════════════════════════╣"
printf "  ║  %-56s ║\n" "API:          http://$VPS_IP:8080"
printf "  ║  %-56s ║\n" "Swagger docs: http://$VPS_IP:8080/api/docs"
printf "  ║  %-56s ║\n" "Qdrant:       http://$VPS_IP:6333/dashboard"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
