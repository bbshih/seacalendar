# Deploy to Production

Deploy SeaCalendar to production server (seacalendar-prod, 5.78.132.232).

## Quick Deploy

```bash
# Option 1: Deploy script
./scripts/deploy.sh

# Option 2: GitHub Actions
git push origin main  # Auto-deploys via GitHub Actions

# Option 3: Manual
ssh deploy@5.78.132.232
cd /opt/seacalendar
git pull
npm install
docker compose -f docker-compose.prod.yml up -d --build
```

## Rollback

```bash
# Local machine
git checkout <previous-commit>
./scripts/deploy.sh

# Or on server
ssh deploy@5.78.132.232
cd /opt/seacalendar
git log --oneline
git checkout <commit-hash>
docker compose -f docker-compose.prod.yml up -d --build
```

## Check Status

```bash
# Health check
curl https://cal.billyeatstofu.com/api/health

# Logs
ssh deploy@5.78.132.232 "cd /opt/seacalendar && docker compose -f docker-compose.prod.yml logs -f"

# Container status
ssh deploy@5.78.132.232 "docker ps"
```

## Troubleshooting

```bash
# Force rebuild
ssh deploy@5.78.132.232 "cd /opt/seacalendar && docker compose -f docker-compose.prod.yml up -d --build --force-recreate"

# Check logs
ssh deploy@5.78.132.232 "cd /opt/seacalendar && docker compose -f docker-compose.prod.yml logs"

# Restart services
ssh deploy@5.78.132.232 "cd /opt/seacalendar && docker compose -f docker-compose.prod.yml restart"
```
