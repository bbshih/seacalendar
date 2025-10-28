# SeaCalendar Development Guide

Complete guide for local development with the SeaCalendar monorepo.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** (for PostgreSQL)
- **Git**

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd seacalendar
npm install

# 2. Set up environment
cp .env.development.example .env.development
# Edit .env.development with your Discord test bot credentials

# 3. Start database and run migrations
npm run db:setup

# 4. Start all services
npm run dev
```

That's it! You now have:
- ✅ PostgreSQL running on localhost:5432
- ✅ API server on http://localhost:3001
- ✅ Discord bot connected to your test server
- ✅ Web app on http://localhost:5173

## Monorepo Structure

```
seacalendar/
├── packages/
│   ├── shared/          # Shared types, utilities (@seacalendar/shared)
│   ├── database/        # Prisma schema, migrations (@seacalendar/database)
│   ├── api/             # Express REST API (@seacalendar/api)
│   ├── discord-bot/     # Discord bot (@seacalendar/discord-bot)
│   └── web/             # React app (@seacalendar/web)
│
├── scripts/
│   ├── watch-claude.js  # Claude Code branch watcher
│   └── dev-setup.js     # Development environment setup
│
├── docker-compose.dev.yml
├── package.json         # Root workspace config
└── .env.development
```

## Development Workflows

### Daily Development

```bash
# Start everything (in one terminal)
npm run dev

# Or run services individually (in separate terminals)
npm run dev:db        # PostgreSQL only
npm run dev:api       # API server (hot reload)
npm run dev:bot       # Discord bot (hot reload)
npm run dev:web       # Web app (Vite HMR)
```

### Working with Claude Code Web

```bash
# Terminal 1: Watch for Claude's pushes
npm run watch

# When Claude pushes a branch:
# → You'll get notified
# → See what changed
# → Manually sync or...

# Terminal 1: Auto-sync mode (auto-checkout + install)
npm run watch:auto

# Claude pushes → auto-checks out → installs deps → ready!
```

### Database Management

```bash
# View/edit database in GUI
npm run db:studio
# Opens http://localhost:5555

# Create new migration after schema changes
npm run db:migrate:dev
# Prompts for migration name, generates SQL

# Reset database (fresh start with seed data)
npm run db:reset

# Seed database with test data
npm run db:seed
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific package
npm test -w @seacalendar/shared
npm test -w @seacalendar/api

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm test -- --watch
```

### Building for Production

```bash
# Build all packages
npm run build

# Build specific package
npm run build -w @seacalendar/web
npm run build -w @seacalendar/api
```

## Package Development

### Adding Dependencies

```bash
# Add to specific package
npm install <package> -w @seacalendar/web
npm install <package> -D -w @seacalendar/api

# Add to root (dev tools only)
npm install <package> -D -w root
```

### Using Shared Package

```typescript
// In any package (api, bot, web)
import { Poll, User, VoteTally } from '@seacalendar/shared';
import { formatDateLabel, generateDateRange } from '@seacalendar/shared';
```

### Database Changes

1. **Edit schema**: `packages/database/prisma/schema.prisma`
2. **Create migration**: `npm run db:migrate:dev`
3. **Name it**: e.g., "add_templates_table"
4. **Migration created** in `packages/database/prisma/migrations/`
5. **Prisma Client regenerated** automatically

Example:
```bash
# Edit schema.prisma
# Add new model or field

npm run db:migrate:dev
# ? Enter migration name: add_venue_ratings
# ✔ Migration created!

# Now use in code:
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.venueRating.create({ ... });
```

## Discord Bot Development

### Setting Up Test Discord Server

1. Create a new Discord server (for testing only)
2. Create a Discord application at https://discord.com/developers/applications
3. Bot tab → Create bot → Copy token
4. OAuth2 tab → URL Generator:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Send Messages`, `Manage Messages`, `Read Message History`
5. Copy generated URL → Open in browser → Add to test server
6. Add bot token to `.env.development`

### Testing Bot Commands

```bash
# Start bot in dev mode
npm run dev:bot

# In your test Discord server:
/event Dinner next Friday 7pm @user1 @user2
/status
/myevents
```

### Bot Hot Reload

Bot automatically restarts when you edit code in `packages/discord-bot/src/`.

## API Development

### Testing API Endpoints

```bash
# API runs on http://localhost:3001

# Example requests (using curl or Postman)
curl http://localhost:3001/api/health
curl http://localhost:3001/api/polls
```

### API Hot Reload

API automatically restarts when you edit code in `packages/api/src/`.

## Web App Development

### Vite Dev Server

Web app uses Vite with Hot Module Replacement (HMR):
- Edit React code → instant browser update
- No page refresh needed
- State preserved

### Testing Web Features

1. Open http://localhost:5173
2. Make changes in `packages/web/src/`
3. See instant updates in browser

## Troubleshooting

### Port Already in Use

```bash
# Check what's using a port
lsof -i :5432  # PostgreSQL
lsof -i :3001  # API
lsof -i :5173  # Web

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart PostgreSQL
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d postgres

# Check logs
docker logs seacalendar-dev-db
```

### Migration Issues

```bash
# Reset database completely
npm run db:reset

# This will:
# - Drop all tables
# - Run all migrations
# - Seed with test data
```

### Clean Install

```bash
# Nuclear option: clean everything
npm run clean
npm install
npm run db:setup
npm run dev
```

## Git Workflow with Claude Code

### Syncing Claude's Changes

```bash
# Option 1: Manual sync
git fetch origin
git checkout claude/feature-branch
npm install
npm run db:migrate:dev
npm run dev

# Option 2: Automated with watch script
npm run watch:auto
# Handles everything automatically
```

### Continuing Claude's Work

```bash
# Claude pushes to: claude/add-templates-abc123

# You sync and test
npm run watch:auto
npm run dev

# Make additional changes
# ... edit files ...
git add .
git commit -m "polish: improve template UI"
git push origin claude/add-templates-abc123

# Tell Claude Code Web:
# "Continue working on branch claude/add-templates-abc123"
```

### Merging to Main

```bash
# After testing Claude's changes
git checkout main
git merge claude/add-templates-abc123
git push origin main

# GitHub Action auto-deploys to production Hetzner VPS
```

## Environment Variables

See `.env.development.example` for all available environment variables.

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `DISCORD_TOKEN` - Discord bot token (test bot)
- `JWT_SECRET` - Secret for JWT tokens

### Optional Variables

- `DISCORD_GUILD_ID` - Limit bot to specific server (recommended for dev)
- `VITE_API_URL` - API URL for web app (default: http://localhost:3001)

## Database GUI (Prisma Studio)

Prisma Studio is a visual database editor:

```bash
npm run db:studio
# Opens http://localhost:5555

# Features:
# - Browse all tables
# - Edit records
# - Run queries
# - See relationships
```

## VSCode Setup (Recommended)

Install these extensions:
- **Prisma** - Syntax highlighting for schema.prisma
- **ESLint** - Linting
- **Prettier** - Code formatting
- **GitLens** - Git integration

### Workspace Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "git.autofetch": true,
  "prisma.showPrismaDataPlatformNotification": false
}
```

## Next Steps

1. ✅ Set up development environment
2. 📚 Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. 🔨 Start building! See [MONOREPO_MIGRATION.md](./MONOREPO_MIGRATION.md) for implementation phases
4. 🚀 Deploy to production: See [DEPLOYMENT.md](./DEPLOYMENT.md) (Hetzner VPS setup)

## Getting Help

- **Issues**: Check existing GitHub issues
- **Documentation**: See `/docs` folder
- **Discord**: #seacalendar-dev channel (if applicable)
