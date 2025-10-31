#!/bin/bash

echo "🚀 SeaCalendar Production Quick Start"
echo "===================================="
echo ""
echo "This script will guide you through the complete production setup."
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPTS_DIR="/opt/seacalendar/scripts"

echo -e "${BLUE}Current Status:${NC}"
echo "  - Hostname: $(hostname)"
echo "  - IP: $(hostname -I | awk '{print $1}')"
echo "  - User: $(whoami)"
echo ""

echo -e "${YELLOW}Setup Steps:${NC}"
echo "  1. Security Hardening (SSH, UFW, fail2ban, auto-updates)"
echo "  2. Database Backups (automated daily backups)"
echo "  3. Caddy Web Server (HTTPS with Let's Encrypt)"
echo "  4. Configure .env.production (manual step)"
echo "  5. Deploy Production Services (Docker)"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}This script must be run with sudo${NC}"
  echo "Usage: sudo bash scripts/quick-start.sh"
  exit 1
fi

echo -e "${YELLOW}⚠️  WARNING:${NC}"
echo "  - Step 1 will disable SSH password authentication"
echo "  - Ensure you have SSH key access working"
echo "  - Test in a new terminal before proceeding"
echo ""

read -p "Do you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted. Review PRODUCTION_SETUP.md for manual steps."
  exit 0
fi

echo ""
echo "========================================"
echo "Step 1/3: Security Hardening"
echo "========================================"
if [ -f "$SCRIPTS_DIR/security-hardening.sh" ]; then
  bash "$SCRIPTS_DIR/security-hardening.sh"
else
  echo -e "${RED}Error: security-hardening.sh not found${NC}"
  exit 1
fi

echo ""
echo "========================================"
echo "Step 2/3: Database Backups"
echo "========================================"
if [ -f "$SCRIPTS_DIR/setup-backups.sh" ]; then
  bash "$SCRIPTS_DIR/setup-backups.sh"
else
  echo -e "${RED}Error: setup-backups.sh not found${NC}"
  exit 1
fi

echo ""
echo "========================================"
echo "Step 3/3: Caddy Web Server"
echo "========================================"

echo ""
echo -e "${YELLOW}Before installing Caddy, verify DNS is configured:${NC}"
echo "  Domain: cal.billyeatstofu.com"
echo "  Should point to: $(hostname -I | awk '{print $1}')"
echo ""
echo "Check with: dig cal.billyeatstofu.com +short"
echo ""

read -p "Is DNS configured and pointing to this server? (yes/no): " dns_ready
if [ "$dns_ready" != "yes" ]; then
  echo ""
  echo -e "${YELLOW}Skipping Caddy setup.${NC}"
  echo "Configure DNS first, then run: sudo bash scripts/setup-caddy.sh"
else
  if [ -f "$SCRIPTS_DIR/setup-caddy.sh" ]; then
    bash "$SCRIPTS_DIR/setup-caddy.sh"
  else
    echo -e "${RED}Error: setup-caddy.sh not found${NC}"
    exit 1
  fi
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ Automated Setup Complete!${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}Next Manual Steps:${NC}"
echo ""
echo "1. Configure production environment:"
echo "   nano /opt/seacalendar/.env.production"
echo ""
echo "   Required changes:"
echo "   - DATABASE_URL password"
echo "   - JWT_SECRET (generate with: openssl rand -hex 64)"
echo "   - DISCORD_TOKEN (from Discord Developer Portal)"
echo "   - DISCORD_CLIENT_ID"
echo "   - DISCORD_CLIENT_SECRET"
echo "   - DISCORD_GUILD_ID"
echo ""
echo "2. Deploy production services:"
echo "   cd /opt/seacalendar"
echo "   docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "3. Verify deployment:"
echo "   docker ps"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "4. Visit: https://cal.billyeatstofu.com"
echo ""
echo -e "${BLUE}📚 Full guide: /opt/seacalendar/PRODUCTION_SETUP.md${NC}"
echo ""
