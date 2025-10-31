# SeaCalendar

> **Ocean-themed friend group hangout organizer with Discord bot and web app**

A full-stack event coordination platform for organizing friend hangouts through Discord and web interfaces.

## Features

- 🤖 **Discord Bot** - Create events with natural language, check vote status, manage events
- 🌐 **Web App** - Full event creation, voting, venue selection, and calendar generation
- 📊 **Database-Backed** - PostgreSQL for persistent storage and advanced features
- 🔐 **Secure** - Discord OAuth, JWT tokens, rate limiting, audit logging
- 📅 **Calendar Integration** - Generate .ics files for any calendar app
- ⚡ **Real-Time Updates** - Live vote counts via WebSockets

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.development.example .env.development
# Edit .env.development with your credentials

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
│   ├── database/            # Prisma schema & migrations
│   ├── api/                 # Express REST API
│   ├── discord-bot/         # Discord.js bot
│   └── web/                 # React app
├── scripts/
│   └── watch-claude.js      # Branch watcher
├── docker-compose.dev.yml   # Local PostgreSQL
└── package.json             # Root workspace
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[DEVELOPMENT.md](./DEVELOPMENT.md)** | Local development guide |
| **[HETZNER_SETUP.md](./HETZNER_SETUP.md)** | Production VPS setup guide |
| **[SERVER_INFO.md](./SERVER_INFO.md)** | Production server state |
| **[packages/discord-bot/README.md](./packages/discord-bot/README.md)** | Discord bot documentation |
| `.env.development.example` | Environment variables reference |

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

## 🎯 Discord Bot Commands

- `/event <description>` - Create events with natural language parsing
- `/status <event-url>` - Check vote progress
- `/myevents` - List your events
- `/cancel <event-url>` - Cancel an event (creator only)
- `/share <poll-id>` - Share poll to current channel
- `/reopen <poll-id>` - Reopen a closed poll

---

## 🏗️ Current Status

### ✅ Completed
- [x] Monorepo structure with npm workspaces
- [x] Database schema (Prisma + PostgreSQL)
- [x] Express REST API with Discord OAuth
- [x] Discord bot with natural language processing
- [x] React web app (original Gist-based version)
- [x] Comprehensive test coverage (102 API tests, E2E tests)
- [x] Development workflow and tooling

### 🚧 In Progress
- [ ] Web app migration to use new API backend
- [ ] Discord emoji voting for simple polls (≤5 options)
- [ ] Real-time vote updates via WebSockets

### 📋 Planned
- [ ] Event and vote reminder system
- [ ] Venue tracking and recommendations
- [ ] Poll templates for recurring events
- [ ] Analytics and insights
- [ ] Production deployment to Hetzner VPS

---

## 🎨 Tech Stack

### Frontend
- **React 19** + TypeScript
- **Vite** - Build tool with HMR
- **Tailwind CSS** - Ocean theme styling
- **React Router** v7
- **Socket.io Client** - Real-time updates

### Backend
- **Express** - API server
- **Prisma** - ORM
- **PostgreSQL** 15 - Database
- **discord.js** v14 - Bot framework
- **Socket.io** - WebSocket server

### Development
- **npm workspaces** - Monorepo management
- **TypeScript** - Strict mode
- **Vitest** - Unit tests
- **Playwright** - E2E tests
- **Docker Compose** - Local database

### Deployment
- **Docker** + **Docker Compose**
- **Caddy** - Reverse proxy with automatic SSL
- **GitHub Actions** - CI/CD
- **Hetzner** - VPS hosting

---

## 🔐 Security Features

- Discord OAuth 2.0 for web authentication
- JWT tokens with refresh mechanism
- Rate limiting (IP + user-based)
- Input validation (Zod schemas)
- Audit logging for sensitive operations
- SQL injection protection (Prisma ORM)
- XSS protection (React + CSP headers)

---

## 🤝 Contributing

This is currently a solo project by [@bbshih](https://github.com/bbshih) with assistance from Claude Code.

### Development Process
1. Feature design and planning
2. Implementation with tests
3. Code review
4. Deploy to production

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflow.

---

## 📝 License

[Add license here]

---

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Inspired by the need to hang out with friends more IRL
- Ocean theme because... why not? 🌊

---

**Happy coding! 🌊⚓**
