#!/bin/bash
set -e

echo "🔒 SeaCalendar Security Hardening Script"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: This script must be run with sudo${NC}"
  echo "Usage: sudo bash scripts/security-hardening.sh"
  exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This script will modify SSH configuration${NC}"
echo "Make sure you have SSH key authentication working before continuing!"
echo ""
read -p "Do you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "========================"
echo "Phase 1: SSH Hardening"
echo "========================"

# Backup original SSH config
echo -e "${YELLOW}Backing up SSH config...${NC}"
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)

# Harden SSH configuration
echo -e "${YELLOW}Hardening SSH configuration...${NC}"
cat >> /etc/ssh/sshd_config <<EOF

# Security hardening - added $(date +%Y-%m-%d)
PasswordAuthentication no
PermitRootLogin no
MaxAuthTries 3
MaxSessions 5
PubkeyAuthentication yes
EOF

# Test SSH config syntax
echo -e "${YELLOW}Testing SSH configuration...${NC}"
if sshd -t; then
  echo -e "${GREEN}✅ SSH configuration is valid${NC}"
  systemctl reload ssh || systemctl reload sshd
  echo -e "${GREEN}✅ SSH service reloaded${NC}"
else
  echo -e "${RED}❌ SSH configuration has errors. Restoring backup...${NC}"
  cp /etc/ssh/sshd_config.backup.* /etc/ssh/sshd_config
  exit 1
fi

echo ""
echo "========================"
echo "Phase 2: UFW Firewall"
echo "========================"

echo -e "${YELLOW}Configuring UFW firewall...${NC}"
# Allow SSH (important: do this first!)
ufw allow 22/tcp comment 'SSH'
# Allow HTTP and HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
# Set default policies
ufw default deny incoming
ufw default allow outgoing
# Enable firewall
echo "y" | ufw enable
echo -e "${GREEN}✅ UFW firewall configured and enabled${NC}"

# Show firewall status
ufw status verbose

echo ""
echo "========================"
echo "Phase 3: fail2ban"
echo "========================"

echo -e "${YELLOW}Installing fail2ban...${NC}"
apt-get update -qq
apt-get install -y fail2ban

echo -e "${YELLOW}Configuring fail2ban...${NC}"
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 22
logpath = %(sshd_log)s
backend = %(sshd_backend)s
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo -e "${GREEN}✅ fail2ban installed and configured${NC}"

echo ""
echo "========================"
echo "Phase 4: Automatic Security Updates"
echo "========================"

echo -e "${YELLOW}Installing unattended-upgrades...${NC}"
apt-get install -y unattended-upgrades apt-listchanges

# Configure automatic updates
cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo -e "${GREEN}✅ Automatic security updates enabled${NC}"

echo ""
echo "========================================"
echo -e "${GREEN}✅ Security Hardening Complete!${NC}"
echo "========================================"
echo ""
echo "Summary of changes:"
echo "  ✅ SSH: Password auth disabled, root login disabled"
echo "  ✅ UFW: Firewall enabled (ports 22, 80, 443 allowed)"
echo "  ✅ fail2ban: Installed and configured"
echo "  ✅ Automatic security updates: Enabled"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC}"
echo "  - Keep this SSH session open and test new SSH connection"
echo "  - If you can't connect, restore from backup: /etc/ssh/sshd_config.backup.*"
echo "  - Firewall is active - only ports 22, 80, 443 are open"
echo ""
