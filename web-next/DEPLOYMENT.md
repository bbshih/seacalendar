# Deployment Guide

## Overview

SeaCalendar Next.js app deploys to Hetzner VPS using PM2 process manager.

## Prerequisites

1. PostgreSQL running (Docker or native)
2. Node.js 20+ with npm
3. PM2 installed globally: `npm install -g pm2`
4. Environment variables configured

## First-Time Setup

### 1. Clone Repository

```bash
cd /opt
git clone https://github.com/yourusername/seacalendar.git
cd seacalendar
```

### 2. Configure Environment

```bash
# Create production environment file
cp .env.production.example .env.production.local

# Edit with production values
nano .env.production.local
```

Required variables:
```bash
NODE_ENV="production"
DATABASE_URL="postgresql://user:pass@localhost:5432/seacalendar"
JWT_SECRET="your-secure-32-char-secret"
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."
DISCORD_REDIRECT_URI="https://cal.billyeatstofu.com/api/auth/discord/callback"
NEXT_PUBLIC_APP_URL="https://cal.billyeatstofu.com"
DISCORD_TOKEN="..."  # For bot
```

### 3. Install Dependencies

```bash
cd web-next
npm install
cd ../discord-bot
npm install
cd ..
```

### 4. Build Applications

```bash
# Build Next.js app
cd web-next
npx prisma generate
npm run build
cd ..

# Build Discord bot
cd discord-bot
npm run build
cd ..
```

### 5. Run Database Migrations

```bash
cd web-next
npx prisma migrate deploy
cd ..
```

### 6. Start with PM2

```bash
# Start both services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

## Regular Deployments

GitHub Actions automatically deploys on push to `main`:

```yaml
# .github/workflows/deploy-production.yml
on:
  push:
    branches:
      - main
```

Manual deployment:

```bash
cd /opt/seacalendar
git pull origin main
cd web-next && npm install && npm run build && cd ..
cd discord-bot && npm install && npm run build && cd ..
cd web-next && npx prisma migrate deploy && cd ..
pm2 reload ecosystem.config.js
```

## PM2 Commands

```bash
# Status
pm2 status

# Logs
pm2 logs seacalendar-web
pm2 logs seacalendar-bot

# Reload (zero-downtime)
pm2 reload seacalendar-web
pm2 reload seacalendar-bot
pm2 reload all

# Restart
pm2 restart seacalendar-web
pm2 restart seacalendar-bot

# Stop
pm2 stop seacalendar-web
pm2 stop seacalendar-bot

# Delete
pm2 delete seacalendar-web
pm2 delete seacalendar-bot

# View details
pm2 show seacalendar-web

# Monitor
pm2 monit
```

## Nginx/Caddy Configuration

### Caddy (Recommended)

```
cal.billyeatstofu.com {
    reverse_proxy localhost:3000
}
```

### Nginx

```nginx
server {
    listen 80;
    server_name cal.billyeatstofu.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Backups

```bash
# Create backup directory
mkdir -p /opt/seacalendar/backups

# Backup
pg_dump -U postgres seacalendar > /opt/seacalendar/backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Restore
psql -U postgres seacalendar < /opt/seacalendar/backups/backup-20250101-120000.sql

# Automated daily backups (crontab)
0 2 * * * pg_dump -U postgres seacalendar > /opt/seacalendar/backups/backup-$(date +\%Y\%m\%d).sql
```

## Logs

PM2 logs location: `/opt/seacalendar/logs/`

```bash
# Tail logs
tail -f /opt/seacalendar/logs/web-out.log
tail -f /opt/seacalendar/logs/web-error.log
tail -f /opt/seacalendar/logs/bot-out.log
tail -f /opt/seacalendar/logs/bot-error.log

# Or use PM2
pm2 logs --lines 100
```

## Troubleshooting

### Check if services are running

```bash
pm2 status
ps aux | grep node
netstat -tulpn | grep 3000
```

### Database connection issues

```bash
# Test connection
psql -U postgres -h localhost -d seacalendar

# Check Prisma can connect
cd web-next
npx prisma db pull
```

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Build fails

```bash
# Clear cache
cd web-next
rm -rf .next node_modules
npm install
npm run build
```

### Environment variables not loaded

```bash
# Verify .env.production.local exists
ls -la .env.production.local

# Check PM2 env
pm2 env seacalendar-web
```

## Monitoring

### Health Check Endpoints

```bash
# Web app
curl https://cal.billyeatstofu.com/api/health

# Check authentication
curl -H "Authorization: Bearer YOUR_TOKEN" https://cal.billyeatstofu.com/api/auth/me
```

### Resource Usage

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
free -h
df -h
```

### PM2 Plus (Optional)

For advanced monitoring:

```bash
pm2 link <secret> <public>
pm2 install pm2-logrotate
```

## Rollback

```bash
# Rollback code
cd /opt/seacalendar
git log --oneline  # Find commit to rollback to
git checkout <commit-hash>

# Rebuild
cd web-next && npm install && npm run build && cd ..
cd discord-bot && npm install && npm run build && cd ..

# Reload
pm2 reload all
```

## Security

- Environment variables in `.env.production.local` (not committed)
- JWT secret minimum 32 characters
- Database credentials secured
- Firewall configured (only 80/443/22 open)
- PM2 runs as non-root user
- Regular security updates: `apt update && apt upgrade`

## Performance

- Next.js standalone build is optimized
- PM2 cluster mode for web (multiple instances)
- PostgreSQL connection pooling via Prisma
- Static files served by Next.js

## Updates

```bash
# Update dependencies
cd web-next
npm update
cd ../discord-bot
npm update

# Update Node.js (via nvm)
nvm install 20
nvm use 20

# Update PM2
npm install -g pm2@latest
pm2 update
```
