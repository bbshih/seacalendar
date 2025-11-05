# Local Development Setup

Set up SeaCalendar for local development.

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd seacalendar
npm install

# 2. Set up environment
cp .env.development.example .env.development
# Edit .env.development with Discord bot credentials

# 3. Start database and run migrations
npm run db:setup

# 4. Start all services
npm run dev
```

**Result:**
- Web: http://localhost:5173
- API: http://localhost:3001
- Discord bot: Connected
- PostgreSQL: localhost:5432

## Discord Bot Setup

### 1. Create Discord Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Bot tab → Create bot → Copy token
4. OAuth2 tab → URL Generator:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Send Messages`, `Manage Messages`, `Read Message History`
5. Copy generated URL → Add to test server

### 2. Configure Environment
```bash
# .env.development
DISCORD_TOKEN="your-bot-token"
DISCORD_CLIENT_ID="your-client-id"
DISCORD_CLIENT_SECRET="your-client-secret"
DISCORD_GUILD_ID="your-test-server-id"  # Optional, limits bot to one server
```

### 3. Test Bot
```bash
npm run dev:bot

# In Discord:
/event Dinner next Friday 7pm
/status
/myevents
```

## Individual Services

```bash
npm run dev:db    # PostgreSQL only
npm run dev:api   # API server only (hot reload)
npm run dev:bot   # Discord bot only (hot reload)
npm run dev:web   # Web app only (Vite HMR)
```

## Database

```bash
npm run db:studio       # GUI at localhost:5555
npm run db:migrate:dev  # Create migration after schema changes
npm run db:seed         # Seed test data
npm run db:reset        # Reset database
```

## Testing

```bash
npm test                # All unit tests (Vitest)
npm run test:e2e        # E2E tests (Playwright)
npm test -- --watch     # Watch mode
```

## Troubleshooting

### Port in use
```bash
lsof -i :5432  # PostgreSQL
lsof -i :3001  # API
lsof -i :5173  # Web
kill -9 <PID>
```

### Database issues
```bash
docker ps
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d postgres
docker logs seacalendar-dev-db
```

### Clean install
```bash
npm run clean
npm install
npm run db:setup
npm run dev
```
