# Deployment Guide

**Deploy from your local machine to production easily!**

> **📝 Note on Environment Files:**
> Throughout this guide, when you see `.env.production`, you should use `.env.production.local` instead.
> This is the gitignored file with your real secrets. See `ENV_FILE_GUIDE.md` for details.

---

## 🚀 Quick Deploy Options

### **Option 1: One-Command Deploy Script** ⭐ Easiest

Run from your local machine:

```bash
cd ~/projects/seacalendar
./scripts/deploy.sh
```

**What it does:**
1. ✅ Pushes your code to GitHub
2. ✅ SSHs to production server
3. ✅ Pulls latest code
4. ✅ Installs dependencies
5. ✅ Rebuilds Docker containers (if in prod mode)
6. ✅ Shows deployment status

**Requirements:**
- SSH key access to server (already set up ✅)
- Git remote configured

---

### **Option 2: GitHub Actions CI/CD** ⭐ Most Automated

Push to main branch, auto-deploys:

```bash
cd ~/projects/seacalendar
git add .
git commit -m "feat: my changes"
git push origin main
# 🎉 Auto-deploys to production!
```

**What it does:**
1. ✅ Runs on every push to `main`
2. ✅ Can also trigger manually
3. ✅ SSHs to server
4. ✅ Pulls code & rebuilds
5. ✅ Verifies site is up
6. ✅ Notifies on failure

**Requirements:**
- Add SSH key to GitHub Secrets (see setup below)

---

## 🔧 Setup Instructions

### **Option 1: Deploy Script Setup**

Already working! Just make it executable on your local machine:

```bash
# On your local machine (when you clone the repo)
cd ~/projects/seacalendar
chmod +x scripts/deploy.sh

# Test SSH connection first
ssh deploy@5.78.132.232 "echo 'SSH working!'"

# Deploy!
./scripts/deploy.sh
```

**Customize branch (optional):**
```bash
./scripts/deploy.sh feature-branch  # Deploy specific branch
```

---

### **Option 2: GitHub Actions Setup**

**Step 1: Generate SSH key for GitHub Actions**

On the production server:
```bash
ssh deploy@5.78.132.232

# Generate deployment key (separate from your personal key)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
# Press Enter for no passphrase

# Add to authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Display private key (copy this)
cat ~/.ssh/github_actions_deploy
```

**Step 2: Add SSH key to GitHub Secrets**

1. Go to: https://github.com/bbshih/seacalendar/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SSH_PRIVATE_KEY`
4. Value: Paste the entire private key (including `-----BEGIN` and `-----END`)
5. Click "Add secret"

**Step 3: Test the workflow**

```bash
# On your local machine
cd ~/projects/seacalendar
git add .
git commit -m "test: trigger deployment"
git push origin main

# Watch the deployment
# Go to: https://github.com/bbshih/seacalendar/actions
```

**Manual trigger:**
1. Go to: https://github.com/bbshih/seacalendar/actions
2. Select "Deploy to Production"
3. Click "Run workflow"

---

## 📋 Deployment Workflow Comparison

| Feature | Deploy Script | GitHub Actions |
|---------|--------------|----------------|
| **Speed** | Fast (~30s) | Medium (~1-2min) |
| **Automation** | Semi (run manually) | Full (auto on push) |
| **Setup** | None needed ✅ | Requires GitHub secret |
| **Visibility** | Terminal output | GitHub Actions UI |
| **Rollback** | Manual | Manual (revert commit) |
| **Best for** | Quick deploys | Team workflows |

---

## 🔄 Complete Development → Production Flow

### **Daily Workflow**

**1. Develop locally:**
```bash
cd ~/projects/seacalendar
git checkout -b feat/new-feature
npm run dev
# Make changes, test with localhost:5173
```

**2. Commit changes:**
```bash
git add .
git commit -m "feat: add awesome feature"
git push origin feat/new-feature
```

**3. Create Pull Request:**
- Go to GitHub
- Create PR from `feat/new-feature` → `main`
- Review code
- Merge PR

**4. Deploy to production:**

**Option A: Auto-deploy (if GitHub Actions set up)**
- Merging PR automatically deploys ✅

**Option B: Manual deploy (script)**
```bash
git checkout main
git pull
./scripts/deploy.sh
```

---

## 🛠️ Advanced Deployment Options

### **Deploy Specific Branch**

```bash
# Deploy a feature branch to test in production
./scripts/deploy.sh feature-branch
```

### **Deploy with Zero Downtime** (Docker only)

The current setup already does rolling updates:
```bash
docker compose -f docker-compose.prod.yml up -d --build
# Updates containers one-by-one, no downtime
```

### **Rollback to Previous Version**

```bash
# Option 1: Via deploy script
cd ~/projects/seacalendar
git checkout HEAD~1  # Go back one commit
./scripts/deploy.sh

# Option 2: On server
ssh deploy@5.78.132.232
cd /opt/seacalendar
git log --oneline  # Find commit to rollback to
git checkout <commit-hash>
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🔍 Monitoring Deployments

### **Watch deployment logs:**

```bash
# Option 1: Via SSH
ssh deploy@5.78.132.232 "cd /opt/seacalendar && docker compose -f docker-compose.prod.yml logs -f"

# Option 2: Follow during deploy
./scripts/deploy.sh
# Logs are shown at the end
```

### **Check deployment status:**

```bash
# Quick health check
curl -I https://cal.billyeatstofu.com

# API health
curl https://cal.billyeatstofu.com/api/health

# Container status
ssh deploy@5.78.132.232 "docker ps"
```

### **GitHub Actions dashboard:**

View all deployments:
https://github.com/bbshih/seacalendar/actions

---

## 🐛 Troubleshooting

### **Deploy script fails with "Permission denied"**

```bash
# Fix SSH permissions
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 700 ~/.ssh

# Test SSH
ssh deploy@5.78.132.232 "echo 'SSH works'"
```

### **GitHub Actions fails with SSH error**

1. Verify secret is set correctly
2. Check key has no passphrase
3. Ensure key is added to `~/.ssh/authorized_keys` on server
4. Check server SSH logs: `ssh deploy@5.78.132.232 "sudo tail -f /var/log/auth.log"`

### **Site not updating after deploy**

```bash
# Check if code actually updated
ssh deploy@5.78.132.232 "cd /opt/seacalendar && git log -1"

# Force rebuild
ssh deploy@5.78.132.232 "cd /opt/seacalendar && docker compose -f docker-compose.prod.yml up -d --build --force-recreate"

# Check browser cache (Ctrl+Shift+R to hard refresh)
```

### **Deployment succeeded but site is down**

```bash
# Check container logs
ssh deploy@5.78.132.232 "cd /opt/seacalendar && docker compose -f docker-compose.prod.yml logs"

# Check container status
ssh deploy@5.78.132.232 "docker ps -a"

# Restart services
ssh deploy@5.78.132.232 "cd /opt/seacalendar && docker compose -f docker-compose.prod.yml restart"
```

---

## 🔐 Security Notes

### **SSH Keys**

- ✅ Personal SSH key: For your daily use
- ✅ GitHub Actions key: Separate key for automation
- ❌ Never commit private keys to git
- ❌ Never share private keys

### **GitHub Secrets**

- ✅ Store in GitHub Secrets (encrypted)
- ✅ Not visible in logs
- ✅ Only accessible to GitHub Actions
- ❌ Never print secrets in workflow logs

### **Production Access**

- ✅ SSH keys only (no passwords)
- ✅ fail2ban protecting SSH
- ✅ UFW firewall limiting access
- ❌ Don't share SSH keys between people

---

## 📊 Deployment Checklist

**Before deploying:**
- [ ] Code works locally (`npm run dev`)
- [ ] Tests pass (if you have tests)
- [ ] Committed all changes
- [ ] Pushed to GitHub
- [ ] Merged to main branch (if using PRs)

**After deploying:**
- [ ] Site loads: https://cal.billyeatstofu.com
- [ ] API responds: https://cal.billyeatstofu.com/api/health
- [ ] Discord bot connected (check Discord server)
- [ ] Check logs for errors
- [ ] Test main user flows

**If issues:**
- [ ] Check logs: `docker compose logs`
- [ ] Verify containers running: `docker ps`
- [ ] Test locally to reproduce
- [ ] Rollback if needed

---

## 🎯 Recommended Setup

**For solo development:**
1. ✅ Use deploy script (`./scripts/deploy.sh`)
2. ✅ Keep it simple
3. ✅ Deploy from main branch

**For team development:**
1. ✅ Set up GitHub Actions
2. ✅ Use Pull Requests
3. ✅ Auto-deploy on merge to main
4. ✅ Keep deploy script for emergency manual deploys

---

## 📚 Related Documentation

- **Production Status:** `SERVER_INFO.md`
- **Server Setup:** `PRODUCTION_SETUP.md`

---

## 🚀 Quick Reference

### **Deploy now (script):**
```bash
./scripts/deploy.sh
```

### **Deploy now (GitHub Actions):**
```bash
git push origin main
```

### **Check deployment:**
```bash
curl https://cal.billyeatstofu.com/api/health
```

### **View logs:**
```bash
ssh deploy@5.78.132.232 "cd /opt/seacalendar && docker compose -f docker-compose.prod.yml logs -f"
```

### **Rollback:**
```bash
git checkout <previous-commit>
./scripts/deploy.sh
```

---

**Happy deploying!** 🎉
