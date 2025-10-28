# Disabling Vercel Integration

Since SeaCalendar 2.0 is moving to self-hosted Hetzner VPS, Vercel is no longer needed.

## ✅ Steps Completed (in this commit)

1. **Removed Vercel configuration**
   - Deleted `vercel.json`
   - Deleted `api/submit-vote.ts` (old serverless function)
   - Deleted `scripts/get-vercel-url.sh`
   - Removed `@vercel/node` dependency from web package

2. **What was removed:**
   - Vercel serverless vote submission endpoint (replaced by our API server)
   - Vercel build configuration
   - Vercel-specific scripts and utilities

## 🌐 Disconnect from Vercel Dashboard

If you had the project deployed on Vercel, follow these steps:

### Option 1: Delete the Project (Recommended)

1. Go to https://vercel.com/dashboard
2. Find the `seacalendar` project
3. Click on the project
4. Go to **Settings** (top navigation)
5. Scroll to bottom → **Delete Project**
6. Type the project name to confirm
7. Click **Delete**

### Option 2: Pause Deployments (Keep project)

1. Go to https://vercel.com/dashboard
2. Find the `seacalendar` project
3. Go to **Settings** → **Git**
4. Click **Disconnect** next to your GitHub repository
5. The project will stop deploying on new commits

### Option 3: Just Disconnect GitHub

1. Go to https://github.com/settings/installations
2. Find "Vercel" in the list
3. Click **Configure**
4. Either:
   - Remove `seacalendar` from the repository list, OR
   - Uninstall Vercel entirely if not using it elsewhere

## 🎯 Why We Removed Vercel

**Old Architecture (v1.0):**
- Static site hosted on Vercel
- Gist-based storage
- Serverless function (`/api/submit-vote`) for votes

**New Architecture (v2.0):**
- Self-hosted on Hetzner VPS
- PostgreSQL database
- Full Express API server
- Discord bot
- More control, more features!

## ✨ Benefits of Self-Hosting

1. **More Features**: Database enables reminders, analytics, templates
2. **Discord Bot**: Needs persistent server (not serverless)
3. **Cost**: ~$5/month vs Vercel's potential overage charges
4. **Control**: Full control over infrastructure
5. **Learning**: Great DevOps experience

## 🚀 New Deployment (Phase 1+)

After Phase 1 is complete, deployment will be:

```bash
# On your local machine
git push origin main

# GitHub Actions automatically:
# 1. Runs tests
# 2. Builds Docker images
# 3. SSH to Hetzner VPS
# 4. Pulls new code
# 5. Restarts services
# 6. Runs database migrations
```

See `HETZNER_SETUP.md` for full deployment setup.

---

**No action required beyond disconnecting from Vercel dashboard if desired!**
