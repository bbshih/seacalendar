#!/bin/bash
# Setup GitHub Actions self-hosted runner
# Run this ON THE SERVER: sudo ./scripts/setup-runner.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏃 GitHub Actions Self-Hosted Runner Setup${NC}"
echo "=============================================="
echo ""

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Error: Please run with sudo${NC}"
  echo "Usage: sudo ./scripts/setup-runner.sh"
  exit 1
fi

# Get actual user (not root)
ACTUAL_USER="${SUDO_USER:-$USER}"
if [ "$ACTUAL_USER" = "root" ]; then
  echo -e "${YELLOW}⚠️  Running as root. Which user should run the runner?${NC}"
  read -p "Username (e.g., deploy): " ACTUAL_USER
fi

echo -e "${BLUE}Installing for user: $ACTUAL_USER${NC}"
echo ""

# Create runner directory
RUNNER_DIR="/opt/actions-runner"
echo -e "${YELLOW}Step 1: Creating runner directory${NC}"
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# Download runner
RUNNER_VERSION="2.311.0"
echo -e "${YELLOW}Step 2: Downloading runner v${RUNNER_VERSION}${NC}"
curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L \
  "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

# Extract
echo -e "${YELLOW}Step 3: Extracting runner${NC}"
tar xzf "./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
rm "./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

# Set ownership
chown -R "$ACTUAL_USER:$ACTUAL_USER" "$RUNNER_DIR"

echo ""
echo -e "${GREEN}✅ Runner files downloaded${NC}"
echo ""
echo -e "${YELLOW}Step 4: Generate registration token${NC}"
echo "=============================================="
echo ""
echo "Go to: https://github.com/bbshih/seacalendar/settings/actions/runners/new"
echo ""
echo "1. Select 'Linux' and 'x64'"
echo "2. Copy the registration token from the command that looks like:"
echo "   ./config.sh --url https://github.com/bbshih/seacalendar --token YOUR_TOKEN"
echo ""
read -p "Paste the registration token: " RUNNER_TOKEN

# Configure runner as the actual user
echo ""
echo -e "${YELLOW}Step 5: Configuring runner${NC}"
sudo -u "$ACTUAL_USER" bash << EOF
cd "$RUNNER_DIR"
./config.sh \
  --url https://github.com/bbshih/seacalendar \
  --token "$RUNNER_TOKEN" \
  --name "seacalendar-prod" \
  --work _work \
  --labels self-hosted,Linux,X64,production \
  --unattended
EOF

# Install as service
echo ""
echo -e "${YELLOW}Step 6: Installing as systemd service${NC}"
cd "$RUNNER_DIR"
./svc.sh install "$ACTUAL_USER"

# Start service
echo -e "${YELLOW}Step 7: Starting service${NC}"
./svc.sh start

# Check status
echo ""
echo -e "${YELLOW}Step 8: Checking status${NC}"
./svc.sh status

echo ""
echo -e "${GREEN}=============================================="
echo "✅ Runner Setup Complete!"
echo "==============================================${NC}"
echo ""
echo "Runner name: seacalendar-prod"
echo "Status: $(./svc.sh status)"
echo ""
echo "📋 Useful commands:"
echo "  Check status:  sudo /opt/actions-runner/svc.sh status"
echo "  Stop runner:   sudo /opt/actions-runner/svc.sh stop"
echo "  Start runner:  sudo /opt/actions-runner/svc.sh start"
echo "  View logs:     sudo journalctl -u actions.runner.* -f"
echo ""
echo "🚀 Next steps:"
echo "1. Push code to 'main' branch"
echo "2. Watch deployment: https://github.com/bbshih/seacalendar/actions"
echo "3. No more SSH needed!"
echo ""
