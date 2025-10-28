# SeaCalendar 2.0 - Monorepo Architecture

> **Ocean-themed friend group hangout organizer with Discord bot integration**

## 🌊 What's New in 2.0?

SeaCalendar is evolving from a simple web app into a comprehensive event coordination platform:

**Before (v1.0)**:
- ✅ Web-only event creation
- ✅ GitHub Gist storage
- ✅ Manual URL sharing

**After (v2.0)**:
- ✨ **Discord bot** with natural language event creation
- ✨ **Database-backed** (PostgreSQL) for better features
- ✨ **Automated reminders** (vote + event reminders)
- ✨ **Venue tracking** and group analytics
- ✨ **Templates** for recurring events
- ✨ **Real-time updates** via WebSockets

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.development.example .env.development
# Edit .env.development with your Discord test bot token

# 3. Set up database
npm run db:setup

# 4. Start development
npm run dev
```

**That's it!** You now have:
- ✅ Web app: http://localhost:5173
- ✅ API server: http://localhost:3001
- ✅ Discord bot: Connected to your test server
- ✅ Database: PostgreSQL on localhost:5432

---

## 📁 Project Structure

```
seacalendar/
├── packages/
│   ├── shared/              # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/       # Poll, Vote, User types
│   │   │   └── utils/       # dateHelpers, voteHelpers, etc.
│   │   └── package.json
│   │
│   ├── database/            # Prisma schema & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   ├── api/                 # Express REST API (Phase 1)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── services/
│   │   └── package.json
│   │
│   ├── discord-bot/         # Discord.js bot (Phase 2)
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   ├── services/
│   │   │   └── cron/
│   │   └── package.json
│   │
│   └── web/                 # React app (Phase 3 - migration)
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   └── hooks/
│       └── package.json
│
├── scripts/
│   └── watch-claude.js      # Branch watcher (secure)
│
├── docker-compose.dev.yml   # Local PostgreSQL
├── package.json             # Root workspace
└── .env.development.example
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md)** | Complete architecture & implementation plan |
| **[DEVELOPMENT.md](./DEVELOPMENT.md)** | Local development guide |
| **[MONOREPO_MIGRATION.md](./MONOREPO_MIGRATION.md)** | Migration progress tracker |
| `.env.development.example` | Environment variables reference |

---

## 🎯 Key Features (Planned)

### Discord Bot
- `/event <natural language>` - Create events with NLP
- `/status` - Check vote progress
- `/myevents` - List your events
- `/remind` - Send manual reminders
- `/venues` - View venue history
- `/stats` - Server analytics

### Web App
- Full event creation with calendar UI
- Vote on dates (primary voting method)
- Event dashboard
- Venue management
- Analytics with charts
- Discord OAuth login

### Automated System
- **Vote reminders**: 3 days before, 1 day before deadline
- **Event reminders**: 1 week, 1 day, 2 hours before
- **Activity nudges**: "Nothing planned next month!"
- **Real-time updates**: Live vote counts in Discord

---

## 🏗️ Implementation Status

### ✅ Completed (Architecture Phase)
- [x] Feature specification
- [x] System architecture design
- [x] Database schema (Prisma)
- [x] Monorepo structure
- [x] Shared types & utilities package
- [x] Development workflow (branch watcher)
- [x] Docker Compose for local dev
- [x] Comprehensive documentation

### 🚧 In Progress
- [ ] Move existing web app to `packages/web`
- [ ] Finish monorepo migration
- [ ] Test build process

### 📋 Next Up (Phase 1)
- [ ] Build Express API server
- [ ] Implement Discord OAuth
- [ ] Create core API endpoints
- [ ] Database integration tests

See [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md) for complete roadmap (Phases 0-7).

---

## 🛠️ Development Commands

### Start Services
```bash
npm run dev              # Start all services
npm run dev:db          # PostgreSQL only
npm run dev:api         # API server only
npm run dev:bot         # Discord bot only
npm run dev:web         # Web app only
```

### Database
```bash
npm run db:studio       # Visual database editor (localhost:5555)
npm run db:migrate:dev  # Create new migration
npm run db:seed         # Seed test data
npm run db:reset        # Reset database
```

### Branch Watcher
```bash
npm run watch           # Watch for Claude Code pushes
npm run watch:auto      # Auto-checkout new branches
```

### Testing
```bash
npm test                # Run all tests
npm run test:e2e        # E2E tests (Playwright)
```

### Building
```bash
npm run build           # Build all packages
npm run clean           # Clean all dependencies
```

---

## 🔐 Security Features

- **Discord OAuth 2.0** for web authentication
- **JWT tokens** with refresh mechanism
- **Rate limiting** (IP + user-based)
- **Input validation** (Zod schemas)
- **Audit logging** for all sensitive operations
- **SQL injection protection** (Prisma ORM)
- **XSS protection** (React + CSP headers)
- **Secure branch watcher** (no external services)

---

## 🌐 Deployment (Planned)

### Hosting
- **Provider**: Hetzner VPS
- **Size**: CX21 (2 vCPU, 4GB RAM, 40GB SSD)
- **Cost**: €4.15/month (~$4.50)
- **Location**: Choose nearest datacenter

### Stack
- **Docker Compose**: All services containerized
- **Caddy**: Reverse proxy + automatic SSL
- **PostgreSQL**: Database
- **Backups**: Automated daily backups

### CI/CD
- **GitHub Actions**: Auto-deploy on push to `main`
- **Zero downtime**: Rolling deployment
- **Smoke tests**: Verify deployment

---

## 🔄 Working with Claude Code

### Automated Workflow
```bash
# Terminal 1: Start branch watcher
npm run watch:auto

# Claude Code Web pushes to: claude/add-feature-xyz
# → Branch watcher detects (60s)
# → Auto-checks out branch
# → Auto-installs dependencies
# → Auto-runs migrations
# → Notification sound plays

# You: npm run dev
# Test Claude's changes locally
```

### Manual Workflow
```bash
# Claude Code Web pushes changes
git fetch origin
git checkout claude/add-feature-xyz
npm install
npm run db:migrate:dev
npm run dev
```

### Merging to Production
```bash
# After testing
git checkout main
git merge claude/add-feature-xyz
git push origin main

# GitHub Action auto-deploys to Hetzner VPS
```

---

## 🎨 Tech Stack

### Frontend
- **React 19** + TypeScript
- **Vite** (build tool, HMR)
- **Tailwind CSS** (ocean theme)
- **React Router** v7
- **Socket.io Client** (real-time)

### Backend
- **Express** (API server)
- **Prisma** (ORM)
- **PostgreSQL** 15
- **discord.js** v14 (bot)
- **Socket.io** (WebSocket)

### Development
- **npm workspaces** (monorepo)
- **TypeScript** (strict mode)
- **Vitest** (unit tests)
- **Playwright** (E2E tests)
- **Docker Compose** (local dev)

### Deployment
- **Docker** + **Docker Compose**
- **Caddy** (reverse proxy)
- **GitHub Actions** (CI/CD)
- **Hetzner** (VPS hosting)

---

## 📊 Database Schema

Key models:
- **Poll** - Generic polling system (events + future poll types)
- **PollOption** - Date/time options
- **Vote** - User votes with available/maybe selections
- **User** - Discord identity + contacts
- **Venue** - Venue history
- **PollTemplate** - Reusable event templates
- **EventReminder** - Scheduled reminders
- **AuditLog** - Security audit trail

See `packages/database/prisma/schema.prisma` for full schema.

---

## 🤝 Contributing

This is currently a solo project by [@bbshih](https://github.com/bbshih) with assistance from Claude Code.

### Development Process
1. Feature design → Architecture plan
2. Implementation in phases
3. Testing (unit + E2E)
4. Code review (manual or Claude Code)
5. Deploy to production

---

## 📝 License

[Add license here]

---

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Inspired by the need to hang out with friends more IRL
- Ocean theme because... why not? 🌊

---

## 📞 Support

- **Issues**: GitHub Issues
- **Questions**: Check DEVELOPMENT.md and ARCHITECTURE_PLAN.md
- **Urgent**: [Your contact method]

---

## 🚦 Current Status

**Architecture Phase: Complete ✅**

Next: Finish monorepo migration → Start Phase 1 (API Foundation)

See [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md) for detailed roadmap.

---

**Happy coding! 🌊⚓**
