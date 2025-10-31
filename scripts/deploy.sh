#!/bin/bash
# Deploy to production from local machine
# Run this from your local repo: ./scripts/deploy.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="deploy"
SERVER_HOST="5.78.132.232"
SERVER_PATH="/opt/seacalendar"
BRANCH="${1:-main}"

echo -e "${BLUE}🚀 Deploying SeaCalendar to Production${NC}"
echo "========================================"
echo ""
echo "Server: $SERVER_USER@$SERVER_HOST"
echo "Path: $SERVER_PATH"
echo "Branch: $BRANCH"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Not in seacalendar directory${NC}"
  echo "Run this script from the root of your local seacalendar repo"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
  read -p "Continue anyway? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Aborted. Commit your changes first."
    exit 0
  fi
fi

echo -e "${YELLOW}Step 1: Pushing to GitHub${NC}"
echo "=========================="
git push origin "$BRANCH"
echo -e "${GREEN}✅ Pushed to GitHub${NC}"
echo ""

echo -e "${YELLOW}Step 2: Deploying to server${NC}"
echo "============================"

# Deploy via SSH
ssh "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
set -e

cd /opt/seacalendar

echo "📦 Pulling latest code..."
git fetch origin
git checkout main
git pull origin main

echo ""
echo "🔨 Installing dependencies..."
npm install

echo ""
echo "🐳 Checking if using Docker production..."
if docker ps | grep -q "seacalendar-api\|seacalendar-web\|seacalendar-bot"; then
  echo "Production Docker containers detected"
  echo ""
  echo "🔄 Rebuilding and restarting containers..."
  docker compose -f docker-compose.prod.yml up -d --build

  echo ""
  echo "⏳ Waiting for services to start..."
  sleep 5

  echo ""
  echo "📊 Container status:"
  docker compose -f docker-compose.prod.yml ps

  echo ""
  echo "📝 Recent logs:"
  docker compose -f docker-compose.prod.yml logs --tail=20
else
  echo "Dev mode detected (npm run dev)"
  echo "Services will auto-restart via watch mode"
  echo ""
  echo "If services aren't auto-restarting, you may need to manually restart:"
  echo "  ssh deploy@5.78.132.232"
  echo "  cd /opt/seacalendar"
  echo "  pkill -f 'npm run dev' && nohup npm run dev > /dev/null 2>&1 &"
fi

echo ""
echo "✅ Deployment complete!"
ENDSSH

echo ""
echo -e "${GREEN}========================================"
echo "✅ Deploy Complete!"
echo "========================================${NC}"
echo ""
echo "🌐 Check your site: https://cal.billyeatstofu.com"
echo "📊 View logs: ssh deploy@5.78.132.232 'cd /opt/seacalendar && docker compose -f docker-compose.prod.yml logs -f'"
echo ""
