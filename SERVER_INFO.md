# SeaCalendar Production Server

> **📋 DOCUMENTATION ONLY**: This file documents the Hetzner production server state.
> **Local developers**: Ignore this file - it's a snapshot of production infrastructure, not applicable to local environments.

---

## Production Server Details

**⚠️ This section describes the Hetzner production server only**

---

## Server Information

- **Hostname**: `seacalendar-prod`
- **IP Address**: `5.78.132.232`
- **OS**: Ubuntu 24.04.3 LTS
- **Provider**: Hetzner Cloud
- **User**: `deploy`
- **Location**: `/opt/seacalendar`

### Hardware Resources
- **CPU**: 2 vCPU (shared)
- **RAM**: 2 GB
- **Disk**: 38 GB (11% used - 3.8GB used, 32GB free)

---

## Setup Status

### ✅ Completed from HETZNER_SETUP.md

**Phase 1-2: Basic Server Setup**
- ✅ VPS provisioned (Hetzner CX21 equivalent)
- ✅ Non-root user created (`deploy`)
- ✅ SSH access configured

**Phase 3: Docker**
- ✅ Docker installed (v28.5.1)
- ✅ Docker Compose v2 installed (v2.24.0)
- ✅ User added to docker group

**Phase 4-5: Reverse Proxy**
- ✅ Caddy configuration file exists (`/etc/caddy/Caddyfile`)

**Phase 6: Application**
- ✅ Application directory: `/opt/seacalendar`
- ✅ Git repository cloned
- ✅ Dependencies installed (npm)
- ✅ Environment files:
  - `.env.development` ✅
  - `.env.production` ✅
  - `docker-compose.prod.yml` ✅
  - `docker-compose.dev.yml` ✅

**Phase 7: Database**
- ✅ PostgreSQL 15 running in Docker (`seacalendar-dev-db`)
- ✅ Database: `seacalendar_dev`
- ✅ Port: 5432
- ✅ Prisma migrations applied (initial migration: 20251029035909_init)
- ✅ Backup script exists (`backup.sh`)

**Build Status**
- ✅ All packages build successfully (web, api, database, shared)

---

### ⚠️ Partially Completed / Needs Verification

**Phase 2: SSH Security**
- ⚠️ SSH config appears to be default (not hardened)
- ⚠️ Root login status: unknown
- ⚠️ Password authentication status: unknown
- **Action needed**: Review `/etc/ssh/sshd_config` for security hardening

**Phase 5: Caddy/SSL**
- ⚠️ Caddy service status: unknown
- ⚠️ SSL certificates: not verified
- **Action needed**: Check if Caddy is running and configured properly

---

### ❌ Not Yet Completed from HETZNER_SETUP.md

**Phase 2: Security Hardening**
- ❌ UFW firewall not configured
- ❌ fail2ban not installed/configured
- ❌ Automatic security updates not verified

**Phase 4: Domain & DNS**
- ❌ Domain DNS not configured
- ❌ Domain name: TBD

**Phase 7: Backups**
- ❌ Automated backup cron job not scheduled

**Phase 8: CI/CD**
- ❌ GitHub Actions secrets not configured
- ❌ Automated deployment workflow not set up

**Phase 9: Production Deployment**
- ❌ Production containers not running (only dev database)
- ❌ Production database migrations not run

**Phase 10: Monitoring**
- ❌ No monitoring configured

---

## Current State

### Running Services
```bash
docker ps
# seacalendar-dev-db (PostgreSQL 15) - healthy, port 5432
```

### Environment
- **Node.js**: v20.19.5 ✅ (upgraded from v18.19.1)
- **npm**: v10.8.2 ✅ (upgraded from v9.2.0)
- **Docker**: 28.5.1
- **Docker Compose**: v2.24.0
- **Kernel**: 6.8.0-71-generic (⚠️ 6.8.0-86-generic available - reboot required)

### System Updates
✅ Node.js successfully upgraded to v20.19.5

⚠️ **Pending Kernel Upgrade**:
- Current kernel: `6.8.0-71-generic`
- Available kernel: `6.8.0-86-generic`
- **Reboot required** to activate new kernel (security patches)

Since this server is still in setup phase (not serving production traffic), **now is a good time to reboot**:
```bash
# Save any work, then:
sudo reboot

# After reboot, verify:
uname -r  # Should show 6.8.0-86-generic
docker ps # Verify database auto-started
```

**Note**: The dev database container (`seacalendar-dev-db`) has `restart: unless-stopped` policy and will auto-start after reboot.

---

## Next Steps for Production Deployment

### Priority 1: Security (Before Going Live)
1. Harden SSH configuration (disable root login, disable password auth)
2. Configure UFW firewall (allow only 22, 80, 443)
3. Install and configure fail2ban
4. Enable automatic security updates
5. Upgrade Node.js to v20 LTS

### Priority 2: Production Infrastructure
1. Configure domain and DNS
2. Verify Caddy is running and get SSL certificate
3. Set up automated backups (cron job)
4. Update `.env.production` with production values

### Priority 3: Application Deployment
1. Build production Docker images
2. Start production services with `docker-compose.prod.yml`
3. Run production database migrations
4. Test production deployment

### Priority 4: CI/CD & Monitoring
1. Configure GitHub Actions secrets
2. Set up automated deployment
3. Configure monitoring and alerting
4. Test full deployment pipeline

---

## Important Notes

- **This is a production server**: All changes should be tested locally first
- **No sudo access in current session**: Some operations require manual intervention
- **Development database is running**: This is using dev credentials, not production
- **No production containers running yet**: Only development database is active

---

## Quick Reference Commands

### Check Service Status
```bash
# Docker containers
docker ps

# Database status
docker compose -f docker-compose.dev.yml ps

# System resources
free -h
df -h

# Check running services
systemctl status caddy
systemctl status fail2ban
```

### Development
```bash
cd /opt/seacalendar
npm run dev          # Start all dev services
npm run db:studio    # Open Prisma Studio
npm run build        # Build all packages
```

### Production
```bash
cd /opt/seacalendar
docker compose -f docker-compose.prod.yml up -d --build  # Deploy production
docker compose -f docker-compose.prod.yml logs -f        # View logs
docker compose -f docker-compose.prod.yml down           # Stop services
```

---

## Production Deployment Readiness

### Missing for Docker Production Deployment
The `docker-compose.prod.yml` exists but requires:
- ❌ `packages/api/Dockerfile` - not created yet
- ❌ `packages/web/Dockerfile` - not created yet
- ❌ `packages/discord-bot/Dockerfile` - not created yet
- ⚠️ `.env.production` needs real credentials (currently placeholder values)

### Current Build Status
The monorepo packages build successfully with npm:
- ✅ `packages/web/dist/` - production web build exists
- ✅ `packages/api/dist/` - API compiled successfully
- ✅ `packages/database/dist/` - database package compiled
- ✅ `packages/shared/dist/` - shared package compiled

**Note**: Dockerfiles need to be created before production Docker deployment can proceed.

---

## Recent Changes

**2025-10-29 04:40 UTC**:
- ✅ Node.js upgraded: v18.19.1 → v20.19.5
- ✅ npm upgraded: v9.2.0 → v10.8.2
- ⚠️ Kernel upgrade pending: 6.8.0-71 → 6.8.0-86 (reboot needed)

**Next Action**: Reboot server to apply kernel security updates

---

**Last Updated**: 2025-10-29 04:40 UTC
**Setup Status**: ~45% Complete (Development environment ready, Node.js upgraded, production deployment pending)
