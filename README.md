# SeaCalendar

> **Ocean-themed friend group hangout organizer with Discord bot and web app**

Full-stack event coordination platform for organizing friend hangouts through Discord and web interfaces.

**Live:** https://cal.billyeatstofu.com

## Quick Start

```bash
npm install
cp .env.development.example .env.development
# Edit .env.development with Discord credentials
npm run db:setup
npm run dev
```

**Result:**
- Web: http://localhost:5173
- API: http://localhost:3001
- Discord bot connected
- PostgreSQL: localhost:5432

*Full setup instructions: use Claude skill `setup-dev`*

## Project Structure

```
seacalendar/
├── packages/
│   ├── shared/              # Shared types & utilities
│   ├── database/            # Prisma schema & migrations
│   ├── api/                 # Express REST API
│   ├── discord-bot/         # Discord.js bot
│   └── web/                 # React app (Vite)
└── scripts/                 # Deploy & utility scripts
```

## Discord Bot Commands

- `/event <description>` - Create events with natural language
- `/status <event-url>` - Check vote progress
- `/myevents` - List your events
- `/cancel <event-url>` - Cancel event
- `/share <poll-id>` - Share poll to channel
- `/reopen <poll-id>` - Reopen closed poll

## Status

**Production:** LIVE at https://cal.billyeatstofu.com

**In Progress:**
- Multi-provider auth (local, Google OAuth)
- Google Calendar sync
- Web app migration to new API
- Discord emoji voting
- Real-time WebSocket updates

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS, Socket.io
**Backend:** Express, Prisma, PostgreSQL 15, discord.js v14
**Dev:** npm workspaces, TypeScript, Vitest, Playwright
**Deploy:** Docker, Caddy, GitHub Actions, Hetzner VPS

---

Built with [Claude Code](https://claude.com/claude-code) 🌊
