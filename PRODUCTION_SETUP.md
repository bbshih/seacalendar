# SeaCalendar Production Setup Guide

**Server:** seacalendar-prod (5.78.132.232)
**Domain:** cal.billyeatstofu.com
**Status:** 🎉 **SETUP COMPLETE - PRODUCTION LIVE** 🎉

> **📝 Note on Environment Files:**
> When this guide mentions `.env.production`, use `.env.production.local` instead (your gitignored secrets file).
> See `ENV_FILE_GUIDE.md` for details on the `.local` pattern.

---

## ✅ Completion Status (2025-10-30)

**All core setup tasks have been completed:**
- ✅ Security hardening complete (SSH, UFW, fail2ban, auto-updates)
- ✅ Automated backups configured (daily at 2 AM)
- ✅ Caddy web server running with Cloudflare SSL
- ✅ Site live: https://cal.billyeatstofu.com
- ✅ All services healthy (web, API, Discord bot)

**This guide is now a reference for maintenance and optional enhancements.**

---

## 🚀 Quick Setup (Run these in order)

### Step 1: Security Hardening ⚠️ IMPORTANT

**⚠️ WARNING:** This will disable SSH password authentication. Ensure you have SSH key access working before proceeding!

```bash
cd /opt/seacalendar
sudo bash scripts/security-hardening.sh
```

This script will:
- ✅ Disable SSH password authentication
- ✅ Disable root login
- ✅ Configure UFW firewall (ports 22, 80, 443)
- ✅ Install and configure fail2ban
- ✅ Enable automatic security updates

**After running, test a NEW SSH connection in a separate terminal before closing your current session!**

---

### Step 2: Database Backups

```bash
sudo bash scripts/setup-backups.sh
```

This will:
- ✅ Create backup directory (`/opt/seacalendar/backups`)
- ✅ Install daily backup cron job (2 AM)
- ✅ Retain backups for 30 days

Test manually:
```bash
sudo -u deploy /opt/seacalendar/scripts/backup.sh
```

---

### Step 3: Caddy Web Server

```bash
sudo bash scripts/setup-caddy.sh
```

This will:
- ✅ Install Caddy (if not already installed)
- ✅ Validate configuration
- ✅ Start Caddy service
- ✅ Enable automatic HTTPS via Let's Encrypt

**Prerequisites:**
- DNS must point `cal.billyeatstofu.com` → `5.78.132.232`

Verify DNS:
```bash
dig cal.billyeatstofu.com +short
# Should return: 5.78.132.232
```

---

### Step 4: Configure Production Environment

Edit `.env.production` with real credentials:

```bash
cd /opt/seacalendar
nano .env.production
```

**Required changes:**

```bash
# 1. Generate secure database password
DATABASE_URL="postgresql://seacalendar:YOUR_SECURE_PASSWORD@postgres:5432/seacalendar"
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD

# 2. Generate JWT secret (random 64-char string)
JWT_SECRET="YOUR_RANDOM_SECRET"

# 3. Update domain
WEB_APP_URL="https://cal.billyeatstofu.com"

# 4. Add Discord credentials (from Discord Developer Portal)
DISCORD_TOKEN="your-actual-bot-token"
DISCORD_CLIENT_ID="your-actual-client-id"
DISCORD_CLIENT_SECRET="your-actual-client-secret"
DISCORD_GUILD_ID="your-discord-server-id"
DISCORD_REDIRECT_URI="https://cal.billyeatstofu.com/api/auth/discord/callback"
```

**Generate secure secrets:**
```bash
# Database password (32 chars)
openssl rand -base64 32

# JWT secret (64 chars)
openssl rand -hex 64
```

---

### Step 5: Deploy Production Services

```bash
cd /opt/seacalendar

# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
1. Build Docker images for web, api, discord-bot
2. Start PostgreSQL database
3. Run database migrations automatically
4. Start all services

**Monitor deployment:**
```bash
# Watch logs
docker compose -f docker-compose.prod.yml logs -f

# Check container status
docker ps

# Check specific service
docker compose -f docker-compose.prod.yml logs api
```

---

## 🔍 Verification Checklist

### Security
- [ ] SSH: Can connect with key, password auth fails
- [ ] UFW: `sudo ufw status` shows ports 22, 80, 443
- [ ] fail2ban: `sudo systemctl status fail2ban` is active
- [ ] Auto-updates: Check `/etc/apt/apt.conf.d/20auto-upgrades`

### Infrastructure
- [ ] DNS: `dig cal.billyeatstofu.com +short` returns `5.78.132.232`
- [ ] Caddy: `sudo systemctl status caddy` is active
- [ ] SSL: Visit `https://cal.billyeatstofu.com` (no cert errors)
- [ ] Backups: Check `/opt/seacalendar/backups/` has files

### Application
- [ ] Database: `docker exec seacalendar-db pg_isready -U seacalendar`
- [ ] API: `curl http://localhost:3001/health` returns OK
- [ ] Web: `curl http://localhost:3000` returns HTML
- [ ] Discord Bot: Check logs for "Bot is ready!"

### End-to-End
- [ ] Visit https://cal.billyeatstofu.com
- [ ] Create an event via Discord
- [ ] Vote on the event via web
- [ ] Check database has records

---

## 📊 Service Management

### Start services
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Stop services
```bash
docker compose -f docker-compose.prod.yml down
```

### Restart a specific service
```bash
docker compose -f docker-compose.prod.yml restart api
```

### View logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f discord-bot

# Caddy logs
sudo journalctl -u caddy -f
```

### Rebuild and redeploy
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🔧 Troubleshooting

### SSH Lockout
If you accidentally lock yourself out:
1. Use Hetzner web console to access server
2. Restore SSH config: `sudo cp /etc/ssh/sshd_config.backup.* /etc/ssh/sshd_config`
3. Restart SSH: `sudo systemctl restart sshd`

### Caddy SSL Issues
```bash
# Check Caddy logs
sudo journalctl -u caddy -n 100

# Common issues:
# - DNS not pointing to server
# - Port 80/443 blocked by firewall
# - Rate limit from Let's Encrypt (wait 1 hour)
```

### Database Connection Issues
```bash
# Check database is running
docker ps | grep postgres

# Check database logs
docker logs seacalendar-db

# Connect to database
docker exec -it seacalendar-db psql -U seacalendar
```

### Application Errors
```bash
# Check all container logs
docker compose -f docker-compose.prod.yml logs --tail=100

# Check container status
docker compose -f docker-compose.prod.yml ps

# Restart containers
docker compose -f docker-compose.prod.yml restart
```

---

## 🔄 Backup & Recovery

### Manual Backup
```bash
sudo -u deploy /opt/seacalendar/scripts/backup.sh
```

### Restore from Backup
```bash
# List backups
ls -lh /opt/seacalendar/backups/

# Restore (replace TIMESTAMP)
gunzip < /opt/seacalendar/backups/seacalendar_TIMESTAMP.sql.gz | \
  docker exec -i seacalendar-db psql -U seacalendar seacalendar
```

### Backup Location
- **Directory:** `/opt/seacalendar/backups/`
- **Schedule:** Daily at 2:00 AM
- **Retention:** 30 days
- **Format:** `seacalendar_YYYYMMDD_HHMMSS.sql.gz`

---

## 📈 Monitoring

### System Resources
```bash
# Disk usage
df -h

# Memory usage
free -h

# Docker stats
docker stats

# Top processes
htop
```

### Service Health
```bash
# All services status
docker compose -f docker-compose.prod.yml ps

# Caddy status
sudo systemctl status caddy

# fail2ban status
sudo systemctl status fail2ban
```

---

## 🔐 Security Best Practices

1. **SSH Keys:** Never re-enable password authentication
2. **Secrets:** Never commit `.env.production` to git
3. **Updates:** Check `sudo apt update && sudo apt upgrade` monthly
4. **Backups:** Verify backups work by testing restore
5. **Logs:** Monitor logs regularly for suspicious activity
6. **Firewall:** Never open unnecessary ports
7. **Discord Token:** Rotate tokens if compromised

---

## 📚 Additional Resources

- **Hetzner Cloud:** https://console.hetzner.cloud/
- **Caddy Docs:** https://caddyserver.com/docs/
- **Docker Compose:** https://docs.docker.com/compose/
- **Let's Encrypt:** https://letsencrypt.org/

---

## 🆘 Emergency Contacts

If something goes wrong:
1. Check logs first (see Troubleshooting section)
2. Review recent git commits: `git log --oneline -10`
3. Check SERVER_INFO.md for current state
4. Use Hetzner web console if SSH fails

---

**Last Updated:** 2025-10-30
**Status:** Ready for production deployment
