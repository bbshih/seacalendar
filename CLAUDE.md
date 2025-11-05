# CLAUDE.md

This file provides guidance to Claude Code when working with the SeaCalendar repository.

## Communication Style

**Be extremely concise. Sacrifice grammar for the sake of concision.**

## Environment Detection

**CRITICAL**: Check hostname at session start to determine environment:
- Hostname `seacalendar-prod` = **PRODUCTION HETZNER SERVER** (exercise extreme caution)
- Any other hostname = **LOCAL DEVELOPMENT** (safe to experiment)

Use `hostname` or check system environment. Adjust behavior accordingly:
- Production: Confirm destructive operations, no experiments
- Local: Normal development workflow

## Overview

**SeaCalendar** is a full-stack event coordination platform for organizing friend hangouts through Discord and web interfaces.

**Architecture:**
- Discord bot with natural language event creation
- REST API with PostgreSQL database backend
- React web app with calendar integration
- Real-time updates via WebSockets

See [README.md](README.md) for project overview and [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide.

## Development Commands

```bash
# Start all services
npm run dev              # Web app + API + Discord bot + Database

# Individual services
npm run dev:db           # PostgreSQL only
npm run dev:api          # API server only (port 3001)
npm run dev:bot          # Discord bot only
npm run dev:web          # React web app only (port 5173)

# Database
npm run db:studio        # Visual database editor (port 5555)
npm run db:migrate:dev   # Create new migration
npm run db:seed          # Seed test data
npm run db:reset         # Reset database

# Testing
npm test                 # Run all unit tests (Vitest)
npm run test:e2e         # Run Playwright e2e tests
npm run test:e2e:ui      # Open Playwright UI

# Build
npm run build            # Build all packages
npm run clean            # Clean all dependencies
```

## Architecture

### Monorepo Structure

```
seacalendar/
├── packages/
│   ├── shared/              # Shared types & utilities (TypeScript)
│   ├── database/            # Prisma schema & migrations
│   ├── api/                 # Express REST API
│   ├── discord-bot/         # Discord.js bot
│   └── web/                 # React app (Vite)
├── scripts/
│   └── watch-claude.js      # Branch watcher
├── docker-compose.dev.yml   # Local PostgreSQL
└── package.json             # Root workspace (npm workspaces)
```

### Tech Stack

**Frontend:**
- React 19 + TypeScript + Vite
- Tailwind CSS with ocean theme
- React Router v7
- Socket.io Client (real-time updates)

**Backend:**
- Express (REST API)
- Prisma ORM + PostgreSQL 15
- discord.js v14
- Socket.io (WebSocket server)

**Development:**
- npm workspaces (monorepo)
- TypeScript (strict mode)
- Vitest (unit tests)
- Playwright (E2E tests)
- Docker Compose (local database)

### Current Status

**✅ Completed:**
- Monorepo structure with npm workspaces
- Database schema (Prisma + PostgreSQL)
- Express REST API with Discord OAuth
- Discord bot with natural language processing
  - `/event` - Create events from natural language
  - `/status` - Check vote progress
  - `/myevents` - List your events
  - `/cancel` - Cancel events
  - `/share` - Share polls to channels
  - `/reopen` - Reopen closed polls
- React web app (original Gist-based version)
- Comprehensive test coverage (102 API tests, E2E tests)
- Production deployment to Hetzner VPS (LIVE at https://cal.billyeatstofu.com)
- Multi-provider auth foundation (database schema, backend services)

**🚧 In Progress:**
- Multi-provider authentication (local auth, Google OAuth routes pending)
- Google Calendar sync integration (API routes & frontend pending)
- Web app migration to use new API backend
- Discord emoji voting for simple polls (≤5 options)
- Real-time vote updates via WebSockets

**📋 Planned:**
- Event and vote reminder system (cron jobs)
- Venue tracking and recommendations
- Poll templates for recurring events
- Analytics and insights

### Design System

**Ocean Theme Colors:**
- `ocean-500` (#0ea5e9) - Primary blue
- `coral-400` (#fb923c) - Accent orange
- `sand-100` (#fef3c7) - Light backgrounds
- `seaweed-500` (#10b981) - Success green

**Animations:**
- `animate-wave` - Gentle bobbing
- `animate-float` - Floating effect
- `animate-ripple` - Click ripples

### Database Schema

**Key models** (see `packages/database/prisma/schema.prisma`):
- **Poll** - Event polls with options and metadata
- **PollOption** - Date/time options for polls
- **Vote** - User votes with available/maybe selections
- **User** - Discord identity with preferences
- **Venue** - Venue history and details
- **PollTemplate** - Reusable event templates
- **EventReminder** - Scheduled reminders
- **AuditLog** - Security audit trail

### Key Implementation Details

1. **Database-backed**: All data persisted in PostgreSQL via Prisma ORM
2. **Discord OAuth**: Web authentication uses Discord OAuth 2.0
3. **JWT Tokens**: API uses JWT with refresh tokens for auth
4. **Natural Language Processing**: Bot uses chrono-node for date parsing
5. **Testing**: All features require unit tests (Vitest) and E2E tests (Playwright)
6. **Git Commits**: Make reasonably-sized commits with descriptive messages

### Package-Specific Notes

**packages/api:**
- Express server with comprehensive middleware (auth, rate limiting, logging)
- JWT authentication service
- Discord OAuth integration
- WebSocket support via Socket.io
- 102 passing unit tests

**packages/discord-bot:**
- Natural language event creation
- Slash command registration system
- Poll service integration with database
- 13 NLP tests passing

**packages/web:**
- Original Gist-based React app (v1.0)
- Needs migration to use new API backend (v2.0)
- Ocean-themed UI with Tailwind CSS
- Complete E2E test coverage

**packages/shared:**
- Shared TypeScript types
- Common utility functions
- Used by all packages

**packages/database:**
- Prisma schema and migrations
- Database client generation
- Seed data for testing

### Next Steps

**Priority 1: Web App Migration**
- Update web app to use new API backend instead of GitHub Gist
- Implement Discord OAuth login flow
- Add real-time vote updates via WebSockets

**Priority 2: Enhanced Discord Integration**
- Discord emoji voting for simple polls
- Real-time vote count updates in Discord messages
- Channel notifications for events

**Priority 3: Advanced Features**
- Event and vote reminder system
- Venue tracking and recommendations
- Poll templates
- Analytics dashboard

**Priority 4: Multi-Provider Auth & Calendar Sync**
- Complete Phase 2-4 of multi-auth implementation (see MULTI_AUTH_CALENDAR_IMPLEMENTATION_PLAN.md)
- Implement local auth & Google OAuth routes
- Build calendar sync service & API routes
- Add frontend UI for auth & calendar features

See [README.md](README.md) for current status and [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow.
