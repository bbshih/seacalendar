# Environment Files Guide

**You're using `.env.production.local` ✅ Perfect!**

---

## 📋 File Structure

### `.env.production` (Template - Committed to Git)
- Contains placeholder values
- Shows what variables are needed
- Safe to commit (no secrets)
- Example configuration

### `.env.production.local` (Secrets - Gitignored)
- Contains real credentials
- **Never committed to git** (in .gitignore)
- Overrides `.env.production`
- This is what you're using! ✅

---

## 🔒 Your Current Setup

**File:** `.env.production.local`
**Location:** `/opt/seacalendar/.env.production.local`
**Status:** ✅ Exists and gitignored
**Docker Compose:** ✅ Updated to use both files (local takes priority)

### How It Works

```
docker-compose.prod.yml loads:
1. .env.production      ← Template values
2. .env.production.local ← Your real secrets (overrides template)
```

Later values override earlier ones, so your secrets in `.env.production.local` take priority.

---

## 📝 What's In Your `.env.production.local`

Should contain:

```bash
# Database (real password)
DATABASE_URL="postgresql://seacalendar:YOUR_REAL_PASSWORD@postgres:5432/seacalendar"
POSTGRES_DB=seacalendar
POSTGRES_USER=seacalendar
POSTGRES_PASSWORD=YOUR_REAL_PASSWORD

# API
API_PORT=3001
JWT_SECRET="your-real-jwt-secret-generated-value"
WEB_APP_URL="https://cal.billyeatstofu.com"
NODE_ENV="production"

# Discord Bot (Production)
DISCORD_TOKEN="your-real-production-bot-token"
DISCORD_CLIENT_ID="your-real-client-id"
DISCORD_CLIENT_SECRET="your-real-client-secret"
DISCORD_GUILD_ID="your-discord-server-id"
DISCORD_REDIRECT_URI="https://cal.billyeatstofu.com/api/auth/discord/callback"
```

---

## 🔄 How Scripts Use It

### Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
# Automatically loads:
# 1. .env.production (template)
# 2. .env.production.local (your secrets) ✅
```

### Migration Script
```bash
scripts/migrate-to-production.sh
# Checks for .env.production.local first ✅
# Falls back to .env.production if not found
```

### Deploy Script
```bash
scripts/deploy.sh
# Docker Compose handles env files automatically ✅
```

---

## ✅ Advantages of `.local` Pattern

**Security:**
- ✅ Never accidentally commit secrets
- ✅ Different secrets per environment
- ✅ Team members have own secrets

**Flexibility:**
- ✅ Keep template in git for reference
- ✅ Each server has own `.local` file
- ✅ CI/CD can generate `.local` on deploy

**Best Practice:**
- ✅ Industry standard pattern
- ✅ Prevents accidental exposure
- ✅ Clear separation of config vs secrets

---

## 🔐 .gitignore Protection

Your `.gitignore` has:
```gitignore
.env
.env.local
.env.*.local  ← This protects .env.production.local ✅
```

This means:
- ❌ `.env.production.local` will NEVER be committed
- ✅ `.env.production` CAN be committed (safe template)
- ✅ You can't accidentally push secrets

---

## 🚀 Usage Examples

### Start Production
```bash
docker compose -f docker-compose.prod.yml up -d --build
# Uses .env.production.local automatically ✅
```

### Update Secrets
```bash
nano .env.production.local
# Make changes
docker compose -f docker-compose.prod.yml restart
```

### Check Which File Is Used
```bash
# See what Docker Compose loaded
docker compose -f docker-compose.prod.yml config | grep -A 5 environment:
```

---

## 📋 Checklist

Your setup:
- ✅ `.env.production` exists (template with placeholders)
- ✅ `.env.production.local` exists (your real secrets)
- ✅ `.env.*.local` in `.gitignore`
- ✅ `docker-compose.prod.yml` loads both files
- ✅ Scripts check for `.local` file first

---

## 🔄 Different Environments

### Production Server (Your Current Setup)
```
.env.production       ← Template
.env.production.local ← Real prod secrets ✅
```

### Local Development (Your Laptop)
```
.env.development       ← Template
.env.development.local ← Your dev/test secrets
```

### Staging Server (If You Have One)
```
.env.production       ← Template
.env.production.local ← Staging secrets (different from prod)
```

---

## 🆘 Common Issues

### **"Error: .env.production.local not found"**
```bash
# Create it from template
cp .env.production .env.production.local
nano .env.production.local
# Add real secrets
```

### **"Using placeholders"**
```bash
# Update with real values
nano .env.production.local

# Generate secrets:
openssl rand -base64 32  # Database password
openssl rand -hex 64     # JWT secret
```

### **"My changes aren't taking effect"**
```bash
# Restart containers to reload env
docker compose -f docker-compose.prod.yml restart

# Or full rebuild
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

---

## 🎯 Quick Reference

**View template:**
```bash
cat .env.production
```

**Edit secrets:**
```bash
nano .env.production.local
```

**Restart with new env:**
```bash
docker compose -f docker-compose.prod.yml restart
```

**Check loaded vars:**
```bash
docker compose -f docker-compose.prod.yml config
```

---

## 📚 Related Docs

- **Deployment:** `DEPLOYMENT.md`
- **Dev vs Prod:** `DEV_PROD_ENVIRONMENTS.md`
- **Server Setup:** `SERVER_INFO.md`

---

**Your setup is correct! ✅ Keep using `.env.production.local`**
