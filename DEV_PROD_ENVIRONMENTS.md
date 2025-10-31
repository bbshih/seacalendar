# Dev vs Production Environments

**Current Status:** All services running in dev mode on production server

> **📝 Note on Environment Files:**
> This guide references `.env.production` but you should use `.env.production.local` (gitignored).
> The `.env.production` is just a template. See `ENV_FILE_GUIDE.md` for the full explanation.

---

## 🎯 Recommended Setup: Local Dev + Server Prod

### Overview

**Best Practice:** Develop locally, deploy to production server

```
┌─────────────────────┐         ┌──────────────────────┐
│   Your Local Mac    │         │   Production Server  │
│                     │         │  seacalendar-prod    │
│  Dev Mode (npm)     │         │  Prod Docker         │
│  localhost:5173     │         │  cal.billyeatstofu   │
│  Test Discord Bot   │         │  Prod Discord Bot    │
│  Dev Database       │         │  Prod Database       │
└─────────────────────┘         └──────────────────────┘
```

### Benefits
- ✅ Develop and test locally without affecting prod
- ✅ Fast dev cycle (no deploy needed)
- ✅ Separate Discord bots (dev bot in test server)
- ✅ Clean separation of concerns
- ✅ Can test before deploying

---

## 🚀 Setup Instructions

### Local Development Environment

**1. Clone repo on your local machine:**
```bash
cd ~/projects
git clone git@github.com:bbshih/seacalendar.git
cd seacalendar
```

**2. Install dependencies:**
```bash
npm install
```

**3. Set up dev database (Docker):**
```bash
docker compose -f docker-compose.dev.yml up -d
```

**4. Run migrations:**
```bash
npm run db:migrate:dev
```

**5. Configure dev environment:**
```bash
cp .env.development .env.development.local

# Edit with your dev values:
nano .env.development.local
```

**Required dev values:**
```bash
# Database (Docker on localhost)
DATABASE_URL="postgresql://dev:dev@localhost:5432/seacalendar_dev"

# Create a TEST Discord bot (separate from prod)
# Go to: https://discord.com/developers/applications
DISCORD_TOKEN="your-DEV-bot-token"
DISCORD_CLIENT_ID="your-DEV-bot-client-id"
DISCORD_CLIENT_SECRET="your-DEV-bot-client-secret"
DISCORD_GUILD_ID="your-TEST-discord-server-id"
DISCORD_REDIRECT_URI="http://localhost:3001/api/auth/discord/callback"

# JWT (any random string for dev)
JWT_SECRET="dev-jwt-secret-123"

# URLs
WEB_APP_URL="http://localhost:5173"
VITE_API_URL="http://localhost:3001"
```

**6. Start dev services:**
```bash
npm run dev
```

**Access dev:**
- Web: http://localhost:5173
- API: http://localhost:3001
- Database: localhost:5432

---

### Production Environment (Server)

**1. Stop dev services on server:**
```bash
ssh deploy@5.78.132.232
cd /opt/seacalendar

# Stop npm dev processes
pkill -f "npm run dev"
pkill -f "vite"
pkill -f "tsx watch"
```

**2. Configure production environment:**
```bash
nano .env.production
```

**Update with real production values:**
```bash
# Generate secure password
openssl rand -base64 32

# Update .env.production:
DATABASE_URL="postgresql://seacalendar:YOUR_SECURE_PASSWORD@postgres:5432/seacalendar"
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD

# Generate JWT secret
openssl rand -hex 64
JWT_SECRET="your-generated-jwt-secret"

# Production URLs
WEB_APP_URL="https://cal.billyeatstofu.com"
DISCORD_REDIRECT_URI="https://cal.billyeatstofu.com/api/auth/discord/callback"

# Production Discord bot (create separate prod bot)
DISCORD_TOKEN="your-PRODUCTION-bot-token"
DISCORD_CLIENT_ID="your-PRODUCTION-bot-client-id"
DISCORD_CLIENT_SECRET="your-PRODUCTION-bot-client-secret"
DISCORD_GUILD_ID="your-PRODUCTION-discord-server-id"
```

**3. Deploy production containers:**
```bash
cd /opt/seacalendar

# Stop dev database
docker compose -f docker-compose.dev.yml down

# Start production
docker compose -f docker-compose.prod.yml up -d --build
```

**4. Verify production:**
```bash
docker ps
docker compose -f docker-compose.prod.yml logs -f

# Test
curl https://cal.billyeatstofu.com
```

---

## 🔧 Alternative: Both Envs on Server (Not Recommended)

If you really want both dev and prod on the same server:

### Separate Ports Approach

**Dev services (npm):**
- Web: localhost:5173
- API: localhost:3001
- DB: localhost:5432

**Prod services (Docker):**
- Web: localhost:4000 → Caddy → cal.billyeatstofu.com
- API: localhost:4001 → Caddy
- DB: Docker internal

**Issues with this approach:**
- Resource usage (running everything twice)
- Port conflicts
- Confusion about which env you're in
- Both Discord bots running simultaneously
- Not standard practice

**Only use if:** You can't develop locally (e.g., headless development server)

---

## 📋 Discord Bot Setup

### Create Separate Bots

**You need TWO Discord bots:**

**1. Development Bot:**
- Name: "SeaCalendar Dev"
- Test server: Your private Discord server
- Redirect URI: `http://localhost:3001/api/auth/discord/callback`
- For testing and development

**2. Production Bot:**
- Name: "SeaCalendar"
- Production server: Your main Discord community
- Redirect URI: `https://cal.billyeatstofu.com/api/auth/discord/callback`
- For real users

**Setup steps:**
1. Go to https://discord.com/developers/applications
2. Create two applications (Dev and Prod)
3. For each:
   - Create bot user
   - Enable privileged gateway intents
   - Add OAuth2 redirect URIs
   - Copy token, client ID, client secret
   - Invite to respective Discord servers

---

## 🔄 Development Workflow

### Daily Development

**On your local machine:**

```bash
# 1. Pull latest
cd ~/projects/seacalendar
git pull

# 2. Create feature branch
git checkout -b feat/my-feature

# 3. Start dev environment
npm run dev

# 4. Make changes, test locally
# - Visit http://localhost:5173
# - Use test Discord bot
# - Test with dev database

# 5. Commit changes
git add .
git commit -m "feat: my feature"
git push origin feat/my-feature

# 6. Create PR on GitHub
```

### Deploying to Production

**Option A: Manual Deploy**
```bash
# SSH to server
ssh deploy@5.78.132.232
cd /opt/seacalendar

# Pull latest
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

**Option B: Automated CI/CD** (Future setup)
- Push to main branch
- GitHub Actions automatically deploys
- Runs tests first
- Zero-downtime deployment

---

## 📊 Environment Comparison

| Aspect | Local Development | Production Server |
|--------|------------------|-------------------|
| **Code Location** | Your computer | Hetzner server |
| **URL** | localhost:5173 | cal.billyeatstofu.com |
| **API** | localhost:3001 | cal.billyeatstofu.com/api |
| **Database** | Docker (local) | Docker (server) |
| **Discord Bot** | Test bot | Production bot |
| **Running Mode** | npm run dev | Docker containers |
| **Hot Reload** | ✅ Yes | ❌ No |
| **Build Time** | Fast | Slower |
| **Real Users** | ❌ No | ✅ Yes |
| **SSL** | ❌ No | ✅ Yes (Cloudflare) |

---

## 🎯 Recommended Next Steps

**1. Set up local development:**
- Clone repo to your local machine
- Install dependencies
- Create test Discord bot
- Run `npm run dev`

**2. Migrate server to production:**
- Stop npm dev services
- Configure .env.production with real credentials
- Deploy Docker production containers
- Test production site

**3. Establish workflow:**
- Develop locally
- Test locally
- Push to GitHub
- Deploy to production (manually or via CI/CD)

---

## ❓ FAQ

**Q: Can I develop directly on the server?**
A: Not recommended. Develop locally, deploy to server.

**Q: What if I don't have a local environment?**
A: Use GitHub Codespaces or keep both envs on server (see alternative setup).

**Q: Do I need two Discord servers?**
A: Yes, or use one server with two separate bot users and channels for testing.

**Q: How do I switch between environments?**
A: Local = dev automatically. Server = production containers.

**Q: What about .env files?**
A: `.env.development.local` (local, gitignored), `.env.production` (server, gitignored)

**Q: How do I test production locally?**
A: Build production Docker locally: `docker compose -f docker-compose.prod.yml up --build`

---

## 🔐 Security Notes

**Never commit:**
- `.env.development.local`
- `.env.production`
- Real Discord tokens
- Real database passwords
- Real JWT secrets

**Git ignores:**
- `.env*.local` (already in .gitignore)
- `.env.production` (should be in .gitignore)

**Secrets management:**
- Development: Hardcoded test values OK
- Production: Real secrets in `.env.production` on server only
- Future: Use secrets manager (GitHub Secrets, Vault, etc.)

---

## 📚 References

- **Local Setup:** This guide
- **Production Deployment:** `PRODUCTION_SETUP.md`
- **Server Status:** `SERVER_INFO.md`
- **Discord Bot Setup:** https://discord.com/developers/docs
