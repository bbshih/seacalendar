# GitHub Runner

**Status:** ✅ Installed and active
Push to `main` → auto-deploys (no SSH needed)

## Reinstall (if needed)

```bash
cd /opt/seacalendar
sudo ./scripts/setup-runner.sh
```

Get token: https://github.com/bbshih/seacalendar/settings/actions/runners/new

## Quick Commands

```bash
# Status
sudo systemctl status actions.runner.*

# Logs
sudo journalctl -u actions.runner.* -f

# Restart
sudo /opt/actions-runner/svc.sh restart

# Fix permissions
sudo chown -R deploy:deploy /opt/seacalendar /opt/actions-runner
```

**Monitor deployments:** https://github.com/bbshih/seacalendar/actions
