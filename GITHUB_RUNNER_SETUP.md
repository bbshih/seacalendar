# GitHub Actions Self-Hosted Runner Setup

**No SSH deployment** - Push to `main` triggers automatic deployment on the server.

## Quick Setup

### On Your Server (One-Time Setup)

```bash
# SSH into server (last time you'll need to!)
ssh deploy@5.78.132.232

# Navigate to seacalendar
cd /opt/seacalendar

# Pull latest changes (includes setup script)
git pull origin main

# Run setup script
sudo ./scripts/setup-runner.sh
```

The script will:
1. Download GitHub Actions runner
2. Prompt for registration token
3. Configure runner as systemd service
4. Start runner automatically

### Get Registration Token

1. Go to https://github.com/bbshih/seacalendar/settings/actions/runners/new
2. Select **Linux** and **x64**
3. Copy the token from the command shown (looks like: `ABCD1234567890`)
4. Paste when prompted by setup script

## Usage

### Deploy from Local Machine

```bash
# Make changes
git add .
git commit -m "Your changes"

# Push to main - triggers automatic deployment!
git push origin main
```

**No SSH needed!** Watch deployment at: https://github.com/bbshih/seacalendar/actions

### Manual Deployment Trigger

```bash
# Trigger deployment without pushing code
gh workflow run deploy-production.yml
```

Or via GitHub UI:
1. Go to https://github.com/bbshih/seacalendar/actions
2. Select "Deploy to Production"
3. Click "Run workflow"

## How It Works

**Before (SSH-based):**
```
Local → Push to GitHub → GitHub Actions → SSH into server → Deploy
```

**After (Self-hosted runner):**
```
Local → Push to GitHub → Runner on server executes deployment
```

The runner runs AS the `deploy` user ON the server, so it has direct access to:
- `/opt/seacalendar` directory
- Docker commands
- npm commands
- No network latency

## Runner Management

### Check Status
```bash
sudo /opt/actions-runner/svc.sh status
```

### View Logs
```bash
# Real-time logs
sudo journalctl -u actions.runner.* -f

# Recent logs
sudo journalctl -u actions.runner.* -n 100
```

### Restart Runner
```bash
sudo /opt/actions-runner/svc.sh stop
sudo /opt/actions-runner/svc.sh start
```

### Remove Runner
```bash
# Stop service
sudo /opt/actions-runner/svc.sh stop
sudo /opt/actions-runner/svc.sh uninstall

# Remove from GitHub
cd /opt/actions-runner
sudo -u deploy ./config.sh remove --token YOUR_REMOVAL_TOKEN

# Delete directory
sudo rm -rf /opt/actions-runner
```

## Troubleshooting

### Runner Not Starting
```bash
# Check service status
sudo systemctl status actions.runner.*

# Check for errors
sudo journalctl -u actions.runner.* -n 50

# Restart service
sudo /opt/actions-runner/svc.sh restart
```

### Deployment Failing
```bash
# Check runner logs during deployment
sudo journalctl -u actions.runner.* -f

# Verify runner is connected
# Go to: https://github.com/bbshih/seacalendar/settings/actions/runners
# Should show green "Idle" or "Active" status
```

### Permission Issues
```bash
# Ensure deploy user owns seacalendar
sudo chown -R deploy:deploy /opt/seacalendar

# Ensure runner owned by deploy
sudo chown -R deploy:deploy /opt/actions-runner
```

### Docker Permission Issues
```bash
# Ensure deploy user in docker group
sudo usermod -aG docker deploy

# Restart runner to pick up new group
sudo /opt/actions-runner/svc.sh restart
```

## Security

### What Changed
- **Removed:** SSH private key from GitHub Secrets
- **Added:** Self-hosted runner on production server

### Security Considerations
- Runner executes workflows from `main` branch only
- Runner runs as `deploy` user (limited permissions)
- Workflow files are version controlled (auditable)
- Runner only accessible from your GitHub repo

### Best Practices
1. Only merge trusted code to `main`
2. Review PRs before merging
3. Monitor runner logs periodically
4. Update runner quarterly:
   ```bash
   cd /opt/actions-runner
   sudo ./bin/Runner.Listener configure --url https://github.com/bbshih/seacalendar --token NEW_TOKEN
   ```

## Workflow Configuration

**Location:** `.github/workflows/deploy-production.yml`

**Key changes:**
```yaml
jobs:
  deploy:
    runs-on: self-hosted  # Instead of ubuntu-latest
```

**Triggers:**
- Push to `main` branch (automatic)
- Manual trigger via GitHub UI

**Steps:**
1. Pull latest code
2. Install dependencies
3. Build packages
4. Restart Docker containers (if production mode)
5. Verify deployment (curl health check)

## Migration Complete

You can now:
- ✅ Deploy by pushing to `main` (no SSH)
- ✅ Trigger deployments from GitHub UI
- ✅ Remove SSH private key from GitHub Secrets (optional)
- ✅ Close local SSH port if desired

Old deployment script (`scripts/deploy.sh`) still works if needed.
