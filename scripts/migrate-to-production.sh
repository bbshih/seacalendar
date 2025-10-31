#!/bin/bash
# Migration script: Dev mode → Production Docker containers
# Run this on the production server to switch from npm dev to Docker prod

set -e

echo "🔄 Migrating to Production Docker Containers"
echo "============================================="
echo ""

# Check if running on production server
HOSTNAME=$(hostname)
if [ "$HOSTNAME" != "seacalendar-prod" ]; then
  echo "⚠️  Warning: Not on production server (hostname: $HOSTNAME)"
  read -p "Continue anyway? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
  fi
fi

echo "This script will:"
echo "  1. Stop npm dev services"
echo "  2. Stop dev database"
echo "  3. Verify .env.production is configured"
echo "  4. Start production Docker containers"
echo "  5. Run database migrations"
echo ""

read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Step 1: Checking .env.production.local"
echo "======================================="

# Check for .env.production.local first (preferred), fallback to .env.production
if [ -f .env.production.local ]; then
  ENV_FILE=".env.production.local"
  echo "✅ Using .env.production.local (gitignored secrets file)"
elif [ -f .env.production ]; then
  ENV_FILE=".env.production"
  echo "ℹ️  Using .env.production (consider renaming to .env.production.local)"
else
  echo "❌ Error: Neither .env.production.local nor .env.production found"
  exit 1
fi

# Check for placeholder values
if grep -q "CHANGE_THIS_PASSWORD\|your-production-bot-token\|yourdomain.com" "$ENV_FILE"; then
  echo "❌ Error: $ENV_FILE contains placeholder values"
  echo ""
  echo "Please update $ENV_FILE with real credentials:"
  echo "  nano $ENV_FILE"
  echo ""
  echo "Required changes:"
  echo "  - DATABASE_URL password"
  echo "  - POSTGRES_PASSWORD"
  echo "  - JWT_SECRET (generate: openssl rand -hex 64)"
  echo "  - DISCORD_TOKEN"
  echo "  - DISCORD_CLIENT_ID"
  echo "  - DISCORD_CLIENT_SECRET"
  echo "  - WEB_APP_URL (should be: https://cal.billyeatstofu.com)"
  echo "  - DISCORD_REDIRECT_URI (should be: https://cal.billyeatstofu.com/api/auth/discord/callback)"
  exit 1
fi

echo "✅ $ENV_FILE exists and appears configured"

echo ""
echo "Step 2: Stopping npm dev services"
echo "==================================="

echo "Stopping npm processes..."
pkill -f "npm run dev" || true
pkill -f "vite" || true
pkill -f "tsx watch" || true
sleep 2

echo "✅ Dev services stopped"

echo ""
echo "Step 3: Stopping dev database"
echo "=============================="

if docker ps | grep -q "seacalendar-dev-db"; then
  echo "Stopping dev database container..."
  docker compose -f docker-compose.dev.yml down
  echo "✅ Dev database stopped"
else
  echo "ℹ️  Dev database not running"
fi

echo ""
echo "Step 4: Starting production containers"
echo "======================================="

echo "Building and starting production services..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "Waiting for services to start..."
sleep 10

echo ""
echo "Step 5: Checking container status"
echo "=================================="

docker compose -f docker-compose.prod.yml ps

echo ""
echo "Step 6: Checking logs"
echo "====================="

# Show logs for a few seconds
timeout 5 docker compose -f docker-compose.prod.yml logs --tail=50 || true

echo ""
echo "========================================"
echo "✅ Migration Complete!"
echo "========================================"
echo ""
echo "Production containers are now running:"
echo "  - postgres (seacalendar-db)"
echo "  - api (seacalendar-api)"
echo "  - discord-bot (seacalendar-bot)"
echo "  - web (seacalendar-web)"
echo ""
echo "Verify deployment:"
echo "  docker ps"
echo "  curl https://cal.billyeatstofu.com"
echo "  docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "If issues occur, rollback with:"
echo "  docker compose -f docker-compose.prod.yml down"
echo "  docker compose -f docker-compose.dev.yml up -d"
echo "  cd /opt/seacalendar && npm run dev"
echo ""
