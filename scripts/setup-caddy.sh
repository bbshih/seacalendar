#!/bin/bash
set -e

echo "🌐 Caddy Web Server Setup"
echo "=========================="
echo ""

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run with sudo"
  echo "Usage: sudo bash scripts/setup-caddy.sh"
  exit 1
fi

# Check if Caddy is installed
if ! command -v caddy &> /dev/null; then
  echo "📦 Installing Caddy..."
  apt-get update -qq
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y caddy
  echo "✅ Caddy installed"
else
  echo "✅ Caddy is already installed ($(caddy version))"
fi

# Check Caddyfile syntax
echo ""
echo "🔍 Validating Caddyfile configuration..."
if caddy validate --config /etc/caddy/Caddyfile; then
  echo "✅ Caddyfile configuration is valid"
else
  echo "❌ Caddyfile has syntax errors!"
  exit 1
fi

# Create log directory
echo ""
echo "📁 Creating log directory..."
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy

# Enable and start Caddy
echo ""
echo "🚀 Starting Caddy service..."
systemctl enable caddy
systemctl restart caddy

# Wait a moment for Caddy to start
sleep 2

# Check Caddy status
if systemctl is-active --quiet caddy; then
  echo "✅ Caddy is running"

  # Show status
  echo ""
  echo "Status:"
  systemctl status caddy --no-pager -l | head -n 10

  echo ""
  echo "✅ Caddy setup complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Verify DNS is pointing to this server: 5.78.132.232"
  echo "     Run: dig cal.billyeatstofu.com +short"
  echo "  2. Start your application services (web on :3000, api on :3001)"
  echo "  3. Caddy will automatically obtain SSL certificate from Let's Encrypt"
  echo "  4. Check logs: sudo journalctl -u caddy -f"
  echo ""
else
  echo "❌ Caddy failed to start!"
  echo "Check logs: sudo journalctl -u caddy -n 50"
  exit 1
fi
