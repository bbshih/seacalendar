# Hetzner VPS Setup Guide for SeaCalendar 2.0

Complete step-by-step guide to set up a Hetzner VPS for hosting SeaCalendar with Docker, PostgreSQL, and automated deployments.

**Estimated Time**: 2-3 hours
**Cost**: €4.15/month (Hetzner CX21)
**Difficulty**: Intermediate

---

## Prerequisites

Before starting, you'll need:
- [ ] Credit card or PayPal for Hetzner account
- [ ] A domain name (e.g., seacalendar.yourdomain.com)
- [ ] SSH client (Terminal on Mac/Linux, PuTTY on Windows)
- [ ] Basic command-line knowledge

---

## Phase 0: Hetzner Account Setup

### Step 1: Create Hetzner Account

1. Go to https://www.hetzner.com/cloud
2. Click "Sign Up" (top right)
3. Fill in:
   - Email address
   - Password
   - Accept terms
4. Verify email (check your inbox)
5. Log in to https://console.hetzner.cloud

### Step 2: Create Project

1. In Hetzner Cloud Console, click "New Project"
2. Name it: `seacalendar`
3. Click "Create"

### Step 3: Add Payment Method

1. Click your name (top right) → "Billing"
2. Add payment method (credit card or PayPal)
3. You may get €20 free credit for new accounts!

---

## Phase 1: Provision VPS

### Step 4: Create Server

1. In your `seacalendar` project, click "Add Server"

2. **Location**: Choose closest to your friend group
   - 🇺🇸 Ashburn, VA (US East)
   - 🇺🇸 Hillsboro, OR (US West)
   - 🇩🇪 Falkenstein (Europe)
   - 🇫🇮 Helsinki (Europe)

3. **Image**: Ubuntu 22.04 LTS

4. **Type**: Shared vCPU
   - Click "CX21" (2 vCPU, 4GB RAM, 40GB SSD)
   - Cost: €4.15/month (~$4.50)

5. **Networking**:
   - ✅ Enable "Public IPv4"
   - ✅ Enable "Public IPv6" (optional)

6. **SSH Key** (IMPORTANT for security):

   **On Mac/Linux:**
   ```bash
   # Generate SSH key if you don't have one
   ssh-keygen -t ed25519 -C "seacalendar-server"
   # Press Enter for default location (~/.ssh/id_ed25519)
   # Set a passphrase (recommended)

   # Copy public key
   cat ~/.ssh/id_ed25519.pub
   ```

   **On Windows (PowerShell):**
   ```powershell
   # Generate SSH key
   ssh-keygen -t ed25519 -C "seacalendar-server"

   # Copy public key
   type $env:USERPROFILE\.ssh\id_ed25519.pub
   ```

   **In Hetzner Console:**
   - Click "Add SSH Key"
   - Paste your public key (starts with `ssh-ed25519`)
   - Name it: "My Laptop"
   - Click "Add SSH Key"
   - Select it for the server

7. **Firewalls**: Skip for now (we'll configure manually)

8. **Volumes**: None needed

9. **Server Name**: `seacalendar-prod`

10. Click "Create & Buy Now"

⏱️ Server will be ready in ~1 minute

### Step 5: Note Your Server IP

1. In Hetzner Console, you'll see your server
2. **Copy the IPv4 address** (e.g., `123.45.67.89`)
3. Save this somewhere - you'll need it!

---

## Phase 2: Initial Server Configuration

### Step 6: First SSH Connection

```bash
# Replace with your server IP
ssh root@123.45.67.89

# First time you'll see:
# The authenticity of host '123.45.67.89' can't be established...
# Type: yes

# You're now logged in as root!
```

### Step 7: Update System

```bash
# Update package lists
apt update

# Upgrade all packages
apt upgrade -y

# This may take 5-10 minutes
```

### Step 8: Create Non-Root User

```bash
# Create new user
adduser deploy

# You'll be prompted for:
# - Password (choose a strong one!)
# - Full name (can leave blank)
# - Other info (press Enter to skip)

# Add user to sudo group
usermod -aG sudo deploy

# Copy SSH key to new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

### Step 9: Configure SSH Security

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Find and change these lines (use Ctrl+W to search):
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Save and exit:
# Ctrl+X → Y → Enter

# Restart SSH service
# Note: On Ubuntu/Debian it's "ssh", on RHEL/CentOS it's "sshd"
systemctl restart ssh
```

**⚠️ IMPORTANT**: Test new user login before closing root session!

```bash
# In a NEW terminal window:
ssh deploy@123.45.67.89

# If it works, you're good!
# Keep the root session open as backup for now
```

### Step 10: Configure Firewall (UFW)

```bash
# SSH as deploy user
ssh deploy@123.45.67.89

# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status

# Should show:
# Status: active
# 22/tcp         ALLOW       Anywhere
# 80/tcp         ALLOW       Anywhere
# 443/tcp        ALLOW       Anywhere
```

### Step 11: Install fail2ban (Brute Force Protection)

```bash
# Install fail2ban
sudo apt install fail2ban -y

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit config
sudo nano /etc/fail2ban/jail.local

# Find [sshd] section and ensure:
# enabled = true
# maxretry = 3
# bantime = 3600

# Save and exit (Ctrl+X → Y → Enter)

# Restart fail2ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status sshd
```

### Step 12: Set Up Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades -y

# Enable it
sudo dpkg-reconfigure -plow unattended-upgrades

# Select "Yes" when prompted
```

---

## Phase 3: Install Docker & Docker Compose

### Step 13: Install Docker

```bash
# Install prerequisites
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package list
sudo apt update

# Install Docker
sudo apt install docker-ce docker-ce-cli containerd.io -y

# Add deploy user to docker group
sudo usermod -aG docker deploy

# Log out and back in for group change to take effect
exit
ssh deploy@123.45.67.89

# Test Docker
docker --version
# Should show: Docker version 24.x.x

# Test with hello-world
docker run hello-world
# Should see "Hello from Docker!"
```

### Step 14: Install Docker Compose

```bash
# Create directory for Docker CLI plugins
mkdir -p ~/.docker/cli-plugins/

# Download Docker Compose
curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose

# Make it executable
chmod +x ~/.docker/cli-plugins/docker-compose

# Test
docker compose version
# Should show: Docker Compose version v2.24.0
```

---

## Phase 4: Domain & DNS Setup

### Step 15: Configure DNS

You need to point your domain to your Hetzner server.

**In your domain registrar** (GoDaddy, Namecheap, Cloudflare, etc.):

1. Go to DNS settings for your domain
2. Add an **A record**:
   - **Name/Host**: `seacalendar` (or your subdomain)
   - **Type**: A
   - **Value/Points to**: `123.45.67.89` (your server IP)
   - **TTL**: 300 (5 minutes)

3. **Optional but recommended**: Add to Cloudflare
   - Sign up at https://www.cloudflare.com (free)
   - Add your domain
   - Update nameservers at your registrar
   - Cloudflare provides DDoS protection + caching

**Wait 5-15 minutes for DNS to propagate**

Test:
```bash
# On your local machine
ping seacalendar.yourdomain.com

# Should show your server IP
```

---

## Phase 5: Install Caddy (Reverse Proxy + SSL)

### Step 16: Install Caddy

```bash
# SSH to server
ssh deploy@123.45.67.89

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy -y

# Check Caddy is running
sudo systemctl status caddy
# Should show "active (running)"
```

### Step 17: Configure Caddy

```bash
# Create Caddyfile
sudo nano /etc/caddy/Caddyfile

# Replace ALL contents with:
```

```caddyfile
# Caddyfile for SeaCalendar

seacalendar.yourdomain.com {
    # Web app (static files)
    handle /* {
        reverse_proxy localhost:3000
    }

    # API endpoints
    handle /api/* {
        reverse_proxy localhost:3001
    }

    # WebSocket
    handle /ws/* {
        reverse_proxy localhost:3001
    }

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Rate limiting (Caddy will handle this automatically)

    # Automatic HTTPS (Let's Encrypt)
    # Caddy handles this automatically!

    # Logs
    log {
        output file /var/log/caddy/seacalendar.log
        format json
    }
}
```

```bash
# Save and exit (Ctrl+X → Y → Enter)

# Create log directory
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy

# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

**⚠️ IMPORTANT**: Caddy will automatically get SSL certificates from Let's Encrypt. Make sure:
- Your domain DNS is pointing to the server
- Ports 80 and 443 are open (we did this in Step 10)

---

## Phase 6: Application Deployment Setup

### Step 18: Create Application Directory

```bash
# Create app directory
sudo mkdir -p /opt/seacalendar
sudo chown deploy:deploy /opt/seacalendar
cd /opt/seacalendar

# Clone your repository
git clone https://github.com/yourusername/seacalendar.git .

# Or create directory structure for manual deployment
mkdir -p {api,web,bot,database}
```

### Step 19: Create Production Environment File

```bash
cd /opt/seacalendar

# Create .env.production
nano .env.production
```

```bash
# Database
DATABASE_URL="postgresql://seacalendar:CHANGE_THIS_PASSWORD@postgres:5432/seacalendar"

# API Server
API_PORT=3001
JWT_SECRET="GENERATE_A_RANDOM_SECRET_HERE"
WEB_APP_URL="https://seacalendar.yourdomain.com"
NODE_ENV="production"

# Discord Bot
DISCORD_TOKEN="your-production-bot-token"
DISCORD_CLIENT_ID="your-production-bot-client-id"
DISCORD_CLIENT_SECRET="your-production-bot-client-secret"
DISCORD_GUILD_ID="your-discord-server-id"
DISCORD_REDIRECT_URI="https://seacalendar.yourdomain.com/api/auth/discord/callback"

# PostgreSQL
POSTGRES_DB=seacalendar
POSTGRES_USER=seacalendar
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
```

```bash
# Save and exit (Ctrl+X → Y → Enter)

# Secure the file
chmod 600 .env.production
```

**Generate secure secrets:**
```bash
# JWT Secret (256-bit random)
openssl rand -base64 32

# PostgreSQL Password
openssl rand -base64 24
```

### Step 20: Create Production Docker Compose

```bash
cd /opt/seacalendar

# Create docker-compose.prod.yml
nano docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: seacalendar-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - seacalendar
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./packages/api
      dockerfile: Dockerfile
    container_name: seacalendar-api
    restart: unless-stopped
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - seacalendar
    ports:
      - "3001:3001"

  discord-bot:
    build:
      context: ./packages/discord-bot
      dockerfile: Dockerfile
    container_name: seacalendar-bot
    restart: unless-stopped
    env_file:
      - .env.production
    depends_on:
      - postgres
      - api
    networks:
      - seacalendar

  web:
    build:
      context: ./packages/web
      dockerfile: Dockerfile
    container_name: seacalendar-web
    restart: unless-stopped
    ports:
      - "3000:80"
    networks:
      - seacalendar

volumes:
  postgres_data:

networks:
  seacalendar:
    driver: bridge
```

```bash
# Save and exit (Ctrl+X → Y → Enter)
```

---

## Phase 7: Database Backups

### Step 21: Create Backup Script

```bash
# Create backup script
nano /opt/seacalendar/backup.sh
```

```bash
#!/bin/bash

# SeaCalendar Database Backup Script

BACKUP_DIR="/opt/seacalendar/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_$DATE.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
docker exec seacalendar-db pg_dump -U seacalendar seacalendar | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE"
```

```bash
# Save and exit

# Make executable
chmod +x /opt/seacalendar/backup.sh

# Test it
/opt/seacalendar/backup.sh

# Should see: "Backup created: ..."
```

### Step 22: Schedule Automatic Backups

```bash
# Edit crontab
crontab -e

# Choose editor (nano is easiest, usually option 1)

# Add this line at the end:
0 2 * * * /opt/seacalendar/backup.sh >> /opt/seacalendar/backup.log 2>&1

# This runs backup every day at 2 AM

# Save and exit (Ctrl+X → Y → Enter)

# Verify crontab
crontab -l
```

---

## Phase 8: GitHub Actions CI/CD

### Step 23: Set Up GitHub Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret"
3. Add these secrets:

| Secret Name | Value |
|------------|-------|
| `HETZNER_HOST` | `123.45.67.89` (your server IP) |
| `HETZNER_SSH_KEY` | Your private SSH key (entire contents of `~/.ssh/id_ed25519`) |
| `HETZNER_USER` | `deploy` |

**To get your private SSH key:**
```bash
# On your local machine
cat ~/.ssh/id_ed25519

# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... key contents ...
# -----END OPENSSH PRIVATE KEY-----
```

### Step 24: Create GitHub Action Workflow

This will be created in your repository (I'll do this in Phase 1), but here's the preview:

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Hetzner
        env:
          SSH_PRIVATE_KEY: ${{ secrets.HETZNER_SSH_KEY }}
          HOST: ${{ secrets.HETZNER_HOST }}
          USER: ${{ secrets.HETZNER_USER }}
        run: |
          # SSH to server and deploy
          # (Full script will be implemented in Phase 1)
```

---

## Phase 9: Initial Deployment

### Step 25: Deploy Application (Manual First Time)

```bash
# SSH to server
ssh deploy@123.45.67.89
cd /opt/seacalendar

# Pull latest code
git pull origin main

# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# This will:
# 1. Build Docker images
# 2. Start PostgreSQL
# 3. Run database migrations
# 4. Start API server
# 5. Start Discord bot
# 6. Start web app

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Press Ctrl+C to exit logs
```

### Step 26: Run Database Migrations

```bash
# SSH to server
ssh deploy@123.45.67.89
cd /opt/seacalendar

# Run migrations (once API is built in Phase 1)
docker compose -f docker-compose.prod.yml exec api npm run db:migrate:deploy

# Seed database (optional)
docker compose -f docker-compose.prod.yml exec api npm run db:seed
```

---

## Phase 10: Monitoring & Maintenance

### Step 27: Check Service Status

```bash
# View running containers
docker ps

# Should see:
# - seacalendar-db
# - seacalendar-api
# - seacalendar-bot
# - seacalendar-web

# Check logs
docker logs seacalendar-api
docker logs seacalendar-bot
docker logs seacalendar-web

# Follow logs in real-time
docker logs -f seacalendar-api
```

### Step 28: Useful Commands

```bash
# Restart a service
docker restart seacalendar-api

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# View resource usage
docker stats

# Clean up old images/containers
docker system prune -a
```

### Step 29: Check SSL Certificate

```bash
# Visit your site in a browser
https://seacalendar.yourdomain.com

# Should see:
# - 🔒 Secure (green padlock)
# - Valid SSL certificate from Let's Encrypt

# Check certificate details
curl -I https://seacalendar.yourdomain.com

# Should show:
# HTTP/2 200
# (Not HTTP/1.1 or errors)
```

---

## Troubleshooting

### Can't SSH to Server

```bash
# Check SSH key permissions
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Try with verbose output
ssh -v deploy@123.45.67.89
```

### Docker Permission Denied

```bash
# Make sure you're in docker group
groups

# Should see "docker" in the list
# If not, run:
sudo usermod -aG docker $USER

# Then log out and back in
```

### Caddy SSL Certificate Issues

```bash
# Check Caddy logs
sudo journalctl -u caddy -f

# Common issues:
# - DNS not pointing to server yet (wait 15 min)
# - Ports 80/443 blocked (check firewall)
# - Wrong domain in Caddyfile

# Test manually
sudo caddy run --config /etc/caddy/Caddyfile
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs seacalendar-db

# Access PostgreSQL directly
docker exec -it seacalendar-db psql -U seacalendar

# Inside PostgreSQL:
\l          # List databases
\c seacalendar  # Connect to database
\dt         # List tables
\q          # Quit
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a -f

# Remove old backups
cd /opt/seacalendar/backups
ls -lah
# Manually delete old ones
```

---

## Security Checklist

Before going live, verify:

- [ ] SSH password login disabled
- [ ] Root SSH login disabled
- [ ] SSH key authentication working
- [ ] UFW firewall enabled (ports 22, 80, 443 only)
- [ ] fail2ban installed and running
- [ ] Automatic security updates enabled
- [ ] Strong database password set
- [ ] JWT secret is random 256-bit string
- [ ] `.env.production` file permissions set to 600
- [ ] SSL certificate working (Let's Encrypt via Caddy)
- [ ] Discord bot token kept secret
- [ ] Database backups running daily

---

## Maintenance Schedule

**Daily** (Automated):
- Database backups (2 AM via cron)
- Security updates (unattended-upgrades)

**Weekly** (Manual):
- Check disk space: `df -h`
- Check logs: `docker logs seacalendar-api`
- Check failed login attempts: `sudo fail2ban-client status sshd`

**Monthly** (Manual):
- Review backups: `ls -lah /opt/seacalendar/backups`
- Update Docker images: `docker compose -f docker-compose.prod.yml pull`
- Clean up old images: `docker system prune -a`
- Check SSL certificate expiry (Caddy auto-renews)

---

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| Hetzner CX21 VPS | €4.15/month | 2 vCPU, 4GB RAM |
| Domain name | $10-15/year | From any registrar |
| Cloudflare (optional) | Free | DDoS protection + CDN |
| SSL Certificate | Free | Let's Encrypt via Caddy |
| **Total** | **~$5/month** | Plus domain (~$1/month) |

---

## Next Steps

After VPS is set up:

1. ✅ Server is running and secured
2. ✅ Docker and Docker Compose installed
3. ✅ Domain pointing to server
4. ✅ Caddy configured with SSL
5. ✅ Backups scheduled

**Return to Phase 1** to build the application:
- Express API server
- Discord bot
- Database migrations
- Deploy to production!

---

## Support & Resources

- **Hetzner Docs**: https://docs.hetzner.com/cloud/
- **Docker Docs**: https://docs.docker.com/
- **Caddy Docs**: https://caddyserver.com/docs/
- **Ubuntu Server Guide**: https://ubuntu.com/server/docs

---

**Questions?** Review the Troubleshooting section or check the resources above.

**Ready to deploy?** Once Phase 1 is complete, you'll deploy the actual application to this server!
