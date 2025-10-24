# SeaCalendar Deployment Guide

## Quick Deploy to Vercel (Recommended)

SeaCalendar uses a serverless function to handle vote submissions. Deploy to Vercel for the best experience.

### Prerequisites

1. **GitHub Account** - Your code is already in a Git repository
2. **GitHub Personal Access Token** - Create one at https://github.com/settings/tokens/new
   - Scope needed: `gist` (read and write)
   - Expiration: 90 days or No expiration
   - Copy the token (starts with `ghp_`)

### Deployment Steps

#### 1. Push to GitHub

```bash
git add .
git commit -m "feat: add serverless vote submission"
git push origin main
```

#### 2. Deploy to Vercel

**Option A: Using Vercel CLI (Fastest)**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel (creates account if needed)
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: seacalendar
# - Directory: ./
# - Override settings? No
```

**Option B: Using Vercel Dashboard**

1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Click "Import Project"
4. Select your `seacalendar` repository
5. Leave all settings as default
6. Click "Deploy"

#### 3. Add Environment Variable

After deployment, you need to add your GitHub token:

1. Go to your project dashboard on Vercel
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. Add new variable:
   - **Name:** `GITHUB_TOKEN`
   - **Value:** Your GitHub PAT (starts with `ghp_`)
   - **Environment:** Production, Preview, Development (check all)
5. Click "Save"

#### 4. Redeploy

After adding the environment variable, trigger a new deployment:

```bash
vercel --prod
```

Or in the Vercel dashboard:
1. Go to "Deployments" tab
2. Click "Redeploy" on the latest deployment

### ✅ That's It!

Your app is now live at `https://seacalendar.vercel.app` (or your custom domain)

**Voters can now submit votes without needing a GitHub token!**

---

## Local Development with Serverless API

To test the serverless function locally:

### Option 1: Vercel Dev Server

```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variable locally
export GITHUB_TOKEN="ghp_your_token_here"

# Run dev server (includes serverless functions)
vercel dev
```

The app will run at `http://localhost:3000` with API routes working.

### Option 2: Mock API (For Quick Testing)

If you don't want to set up Vercel locally, the app will fall back to requiring GitHub tokens in development mode. To test:

1. Set `VITE_GITHUB_TOKEN` in `.env`
2. Run `npm run dev`
3. The app will use client-side GitHub calls (voters need token)

---

## Alternative Deployment Options

### Netlify

1. Go to https://netlify.com
2. "Import from Git" → Select repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variable:
   - Key: `GITHUB_TOKEN`
   - Value: Your GitHub PAT
5. Deploy

### Self-Hosted (Docker)

```dockerfile
# Dockerfile (create this file)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

```bash
# Build and run
docker build -t seacalendar .
docker run -p 3000:3000 -e GITHUB_TOKEN="ghp_your_token" seacalendar
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes (Production) | GitHub Personal Access Token with `gist` scope |
| `VITE_GITHUB_TOKEN` | No (Development) | Optional: Auto-loads token for organizer in dev mode |

---

## Troubleshooting

### "Server configuration error" when voting

**Problem:** The serverless function can't find your GitHub token.

**Solution:**
1. Check that `GITHUB_TOKEN` is set in Vercel environment variables
2. Make sure you redeployed after adding the variable
3. Verify the token has `gist` scope

### API returns 404

**Problem:** Serverless function isn't deployed.

**Solution:**
- Ensure `api/submit-vote.ts` exists in your repository
- Redeploy with `vercel --prod`

### CORS errors

**Problem:** Browser blocking API requests.

**Solution:**
- Check that `vercel.json` includes CORS headers
- Ensure API URL matches your deployment domain

---

## Security Notes

- ✅ GitHub token is stored as an environment variable (not in code)
- ✅ Token is only accessible server-side (voters never see it)
- ✅ Event data is encrypted client-side before sending to server
- ✅ Server only writes to Gists (can't read other repositories)
- ⚠️ Consider rotating your GitHub token every 90 days

---

## Cost

**Vercel/Netlify Free Tier:**
- ✅ 100 deployments/month
- ✅ Unlimited bandwidth
- ✅ Serverless functions included
- ✅ Perfect for friend group hangouts

**GitHub API Limits:**
- 5,000 requests/hour with token
- More than enough for typical usage
