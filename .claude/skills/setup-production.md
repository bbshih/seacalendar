# Production Server Setup

Set up SeaCalendar on a new Hetzner VPS from scratch.

## Server Specs
- **Provider:** Hetzner Cloud CX21
- **OS:** Ubuntu 24.04 LTS
- **Resources:** 2 vCPU, 2GB RAM, 40GB disk
- **Domain:** cal.billyeatstofu.com

## Quick Setup

```bash
# 1. Initial server access (as root)
ssh root@<server-ip>

# 2. Create deploy user
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# 3. Switch to deploy user
su - deploy

# 4. Run setup scripts
cd /opt
sudo git clone https://github.com/bbshih/seacalendar.git
cd seacalendar
sudo chown -R deploy:deploy /opt/seacalendar

# Security hardening
sudo bash scripts/security-hardening.sh

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y docker.io docker-compose

# Install Caddy
sudo bash scripts/setup-caddy.sh

# Setup backups
sudo bash scripts/setup-backups.sh

# 5. Configure environment
cp .env.production.example .env.production.local
nano .env.production.local  # Add real credentials

# 6. Deploy
npm install
docker compose -f docker-compose.prod.yml up -d --build
```

## DNS Setup

1. Point domain to server IP:
   - `A` record: `cal.billyeatstofu.com` → `<server-ip>`
2. Optional: Enable Cloudflare proxy for DDoS protection

## Generate Secrets

```bash
# Database password
openssl rand -base64 32

# JWT secret
openssl rand -hex 64
```

## Security Checklist

- [ ] UFW firewall active (ports 22, 80, 443)
- [ ] fail2ban running
- [ ] SSH password auth disabled
- [ ] Root login disabled
- [ ] Automatic updates enabled
- [ ] Backups configured (daily at 2 AM)

## Verify Setup

```bash
# Services
systemctl status caddy
systemctl status fail2ban
docker ps

# Application
curl http://localhost:3001/api/health
curl https://cal.billyeatstofu.com

# Security
sudo ufw status
sudo fail2ban-client status
```

## Manual Security Hardening

If scripts fail, manual steps:

```bash
# UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# fail2ban
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local  # Set bantime = 1h, maxretry = 3
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# SSH hardening
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no, PermitRootLogin no
sudo systemctl restart sshd

# Auto-updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Backups

```bash
# Manual backup
sudo -u deploy /opt/seacalendar/scripts/backup.sh

# Check backups
ls -lh /opt/seacalendar/backups/

# Restore
gunzip < /opt/seacalendar/backups/seacalendar_*.sql.gz | \
  docker exec -i seacalendar-db psql -U seacalendar seacalendar
```
