# SeaCalendar 2.0 - Architecture & Implementation Plan

## Executive Summary

SeaCalendar is being transformed from a Gist-based web app into a full-stack platform with:
- **Database-backed storage** (PostgreSQL + Prisma)
- **Discord bot** for natural language event creation
- **REST API** for web and bot integration
- **Automated reminders** and notifications
- **Venue tracking** and group analytics

**Target**: Small friend groups (<20 people) on a single Discord server
**Hosting**: Hetzner VPS (CX21: €4.15/month)
**Development**: Local-first with secure branch watching

---

## ✅ What's Been Built (Architecture Phase)

### 1. Monorepo Structure
```
seacalendar/
├── packages/
│   ├── shared/          # Types, utilities, validation
│   ├── database/        # Prisma schema, migrations
│   ├── api/             # Express REST API (to build)
│   ├── discord-bot/     # Discord.js bot (to build)
│   └── web/             # React app (to migrate)
├── scripts/
│   └── watch-claude.js  # Branch watcher (secure polling)
├── docker-compose.dev.yml
├── package.json         # Workspace config
└── .env.development.example
```

### 2. Database Schema (Prisma)
- **Generic polling system** (supports events + future poll types)
- **User management** (Discord identity, email/phone linking)
- **Vote tracking** with reminders
- **Venue management** (simple historical reference)
- **Templates** for recurring events
- **Audit logging** for security
- **Rate limiting** protection

**Key design decisions**:
- Poll-centric (not just events) for future flexibility
- Discord ID as primary identity
- Reminder scheduling built-in
- Security-first with audit logs

### 3. Development Workflow
- **One command start**: `npm run dev`
- **Hot reload** on all packages
- **Branch watcher**: Polls GitHub for Claude Code pushes
- **Docker Compose**: Local PostgreSQL
- **Prisma Studio**: Visual database editor

### 4. Documentation
- `DEVELOPMENT.md` - Complete dev guide
- `MONOREPO_MIGRATION.md` - Migration tracking
- `.env.development.example` - Environment setup
- `ARCHITECTURE_PLAN.md` - This document

---

## 🎯 Feature Specification

### Core Features (v1.0)

#### Event Creation
- **Discord**: `/event <natural language>` with confirmation UI
- **Web**: Full form with calendar view
- **Templates**: Save and reuse common events
- **Auto-detection**: Invite all server members or specific @mentions

#### Voting System
- **Web voting** (primary): Click link → vote → return to Discord
- **Discord voting** (≤5 options): React with emojis
- **Real-time updates**: Discord message shows vote count
- **Deadlines**: Auto-close voting (default: 2 weeks)

#### Reminders & Notifications
- **Vote reminders**: 3 days before, 1 day before deadline
- **Event reminders**: 1 week before, 1 day before, 2 hours before
- **Activity nudges**: "Nothing planned for next month!"
- **Channel mentions** (not DMs for reminders)

#### Event Finalization
- **Private to creator**: DM or email only
- **After deadline**: Bot analyzes votes, suggests best date
- **Venue collection**: Name, address, Google Maps link
- **Public announcement**: Post finalized event to channel

#### Venue Management
- **Simple storage**: Name, address, maps link, notes
- **History view**: `/venues` shows past venues
- **Quick reference**: "Where did we go last time?"

#### Member Management
- **Discord primary**: Discord ID is main identity
- **Contact linking**: `/profile link email/phone`
- **Auto-detection**: Optionally invite all server members
- **No roles**: Creator owns their events only

#### Analytics
- **Server stats**: Events per month, response rates, popular days/times
- **User stats**: Events created, attendance rate
- **Venue stats**: Most visited venues

### Platform Parity

| Feature | Discord | Web |
|---------|---------|-----|
| Create Event | ✅ NLP | ✅ Form |
| Vote | ✅ (≤5 opts) | ✅ Always |
| View Results | ✅ Summary | ✅ Detailed |
| Finalize | ✅ DM | ✅ Dashboard |
| Templates | ✅ Commands | ✅ Library |
| Venues | ✅ History | ✅ Manager |
| Analytics | ✅ Stats | ✅ Charts |

---

## 🏗️ Implementation Phases

### Phase 0: Infrastructure Setup ⏱️ Week 1
**Status**: Planning

- [ ] Set up Hetzner VPS (CX21)
- [ ] Configure SSH, firewall, fail2ban
- [ ] Install Docker, Docker Compose
- [ ] Set up domain + DNS
- [ ] Configure Caddy for SSL
- [ ] Set up PostgreSQL container
- [ ] Configure automated backups

**Deliverable**: VPS ready for deployment

---

### Phase 1: Database & API Foundation ⏱️ Week 2
**Status**: Ready to start (schema complete)

**Tasks**:
- [ ] Finish monorepo migration
  - [ ] Move existing web app to `packages/web`
  - [ ] Copy utilities to `packages/shared`
  - [ ] Test builds and imports
- [ ] Set up API server (`packages/api`)
  - [ ] Express + TypeScript setup
  - [ ] Prisma client integration
  - [ ] Auth middleware (Discord OAuth)
  - [ ] Rate limiting
  - [ ] Security headers (Helmet)
- [ ] Core API endpoints
  - [ ] `POST /api/polls` - Create poll
  - [ ] `GET /api/polls/:id` - Get poll
  - [ ] `POST /api/polls/:id/vote` - Submit vote
  - [ ] `GET /api/polls/:id/results` - Get results
  - [ ] `POST /api/auth/discord/callback` - OAuth
- [ ] Database setup
  - [ ] Run migrations
  - [ ] Create seed data
  - [ ] Test Prisma Studio
- [ ] Testing
  - [ ] API endpoint tests
  - [ ] Auth flow tests
  - [ ] Database integration tests

**Deliverable**: Working API with auth

---

### Phase 2: Discord Bot Core ⏱️ Week 3
**Status**: Ready to start

**Tasks**:
- [ ] Bot project setup (`packages/discord-bot`)
  - [ ] discord.js v14 setup
  - [ ] Slash command registration
  - [ ] Event handlers
- [ ] Natural language parsing
  - [ ] Install chrono-node
  - [ ] Parse dates from text
  - [ ] Extract event details
  - [ ] Handle edge cases
- [ ] Event creation command
  - [ ] `/event` slash command
  - [ ] Confirmation UI (buttons)
  - [ ] Edit modal
  - [ ] Link to web for complex edits
- [ ] Basic commands
  - [ ] `/status <event-link>` - Show vote progress
  - [ ] `/myevents` - List user's events
  - [ ] `/cancel <event-link>` - Cancel event
- [ ] Discord voting (≤5 options)
  - [ ] React with emojis (🅰️ 🅱️ 🅲️ 🅳️ 🅴️)
  - [ ] Track reactions as votes
  - [ ] Update database
- [ ] Testing
  - [ ] Test in Discord test server
  - [ ] NLP parsing tests
  - [ ] Command integration tests

**Deliverable**: Working bot for event creation

---

### Phase 3: Web App Migration ⏱️ Week 4
**Status**: Ready to start (existing app works)

**Tasks**:
- [ ] Move web app to `packages/web`
- [ ] Update imports to use `@seacalendar/shared`
- [ ] Replace Gist storage with API calls
  - [ ] Remove `githubStorage.ts` dependency
  - [ ] Add API client (fetch/axios)
  - [ ] Update all pages to use API
- [ ] Add Discord OAuth login
  - [ ] Login button
  - [ ] OAuth redirect handling
  - [ ] Store JWT tokens
  - [ ] Auto-refresh tokens
- [ ] Real-time updates (WebSockets)
  - [ ] Socket.io integration
  - [ ] Subscribe to poll updates
  - [ ] Live vote counter
- [ ] Update existing pages
  - [ ] CreateEventPage → API
  - [ ] VotingPage → API
  - [ ] ResultsPage → API with real-time
  - [ ] VenueSelectionPage → API
  - [ ] EventSummaryPage → API
- [ ] Add new features
  - [ ] Event dashboard (My Events)
  - [ ] User profile (link email/phone)
  - [ ] Analytics page (charts)
- [ ] Testing
  - [ ] Update E2E tests
  - [ ] Test OAuth flow
  - [ ] Test real-time updates

**Deliverable**: Web app fully database-backed

---

### Phase 4: Reminders & Notifications ⏱️ Week 5
**Status**: Depends on Phase 2-3

**Tasks**:
- [ ] Cron job system (node-cron)
- [ ] Vote reminders
  - [ ] 3-day reminder job
  - [ ] 1-day reminder job
  - [ ] Track sent reminders
  - [ ] Check user preferences
- [ ] Event reminders
  - [ ] 1-week reminder
  - [ ] 1-day reminder
  - [ ] 2-hour reminder (optional)
  - [ ] Generate calendar .ics
- [ ] Activity nudges
  - [ ] Monthly check: "Nothing planned?"
  - [ ] Suggest popular day/time
  - [ ] Link to template or create
- [ ] Email notifications (optional)
  - [ ] SMTP setup
  - [ ] Email templates
  - [ ] Unsubscribe links
- [ ] Testing
  - [ ] Test cron timing
  - [ ] Test user preferences
  - [ ] Test reminder delivery

**Deliverable**: Automated reminder system

---

### Phase 5: Finalization & Venues ⏱️ Week 6
**Status**: Depends on Phase 2-4

**Tasks**:
- [ ] Finalization flow
  - [ ] Private DM to creator after deadline
  - [ ] Show vote results
  - [ ] Button UI for date selection
  - [ ] Venue input form
  - [ ] Notes input
  - [ ] Confirmation
- [ ] Public announcement
  - [ ] Post to channel after finalization
  - [ ] Show venue details
  - [ ] List attendees
  - [ ] Calendar download link
  - [ ] Google Maps link
- [ ] Venue management
  - [ ] `/venues` command
  - [ ] Venue search
  - [ ] Quick-add when finalizing
  - [ ] History view (web)
- [ ] Calendar generation
  - [ ] ICS file with venue address
  - [ ] Google Calendar link
  - [ ] Email with calendar invite
- [ ] Testing
  - [ ] Test finalization flow
  - [ ] Test venue storage
  - [ ] Test calendar files

**Deliverable**: Complete event lifecycle

---

### Phase 6: Advanced Features ⏱️ Week 7
**Status**: Depends on Phase 5

**Tasks**:
- [ ] Templates system
  - [ ] `/template create` command
  - [ ] Save event structure
  - [ ] `/template use` to create from template
  - [ ] Template library (web)
  - [ ] Edit/delete templates
- [ ] Analytics
  - [ ] Server stats endpoint
  - [ ] User stats endpoint
  - [ ] `/stats` command
  - [ ] Analytics page (web) with charts
  - [ ] Export data (CSV)
- [ ] User preferences
  - [ ] `/profile` command
  - [ ] Link email/phone
  - [ ] Notification settings
  - [ ] Privacy settings
  - [ ] Settings page (web)
- [ ] Testing
  - [ ] Test templates
  - [ ] Test analytics accuracy
  - [ ] Test preferences

**Deliverable**: Power user features

---

### Phase 7: Polish & Launch ⏱️ Week 8
**Status**: Final phase

**Tasks**:
- [ ] Comprehensive testing
  - [ ] E2E test all flows
  - [ ] Load testing
  - [ ] Security testing
  - [ ] Mobile responsive testing
- [ ] Performance optimization
  - [ ] Database query optimization
  - [ ] API response caching
  - [ ] Bundle size reduction
  - [ ] Image optimization
- [ ] Security audit
  - [ ] Review all endpoints
  - [ ] Test rate limiting
  - [ ] Review audit logs
  - [ ] Penetration testing
- [ ] Documentation
  - [ ] User guide
  - [ ] Bot command reference
  - [ ] API documentation
  - [ ] Deployment guide
- [ ] Monitoring setup
  - [ ] Application logs
  - [ ] Error tracking (Sentry?)
  - [ ] Uptime monitoring
  - [ ] Database backups verified
- [ ] Deploy to production
  - [ ] Build production images
  - [ ] Deploy to Hetzner VPS
  - [ ] Set up Caddy
  - [ ] Configure environment
  - [ ] Run migrations
  - [ ] Smoke test
- [ ] Launch
  - [ ] Announce to friend group
  - [ ] Monitor for issues
  - [ ] Gather feedback

**Deliverable**: Production-ready system

---

## 🔒 Security Architecture

### Authentication
- **Discord OAuth 2.0** for web login
- **JWT tokens** (1-hour expiry, refresh tokens)
- **Bot token** never exposed to clients

### Authorization
- **Creator-only actions**: Edit, cancel, finalize
- **Server-scoped data**: Only see your Discord server's events
- **Privacy settings**: Users control data visibility

### Input Validation
- **Zod schemas** for all API inputs
- **SQL injection**: Protected by Prisma
- **XSS protection**: React auto-escapes, CSP headers

### Rate Limiting
- **IP-based**: 100 req/min general
- **User-based**: 200 req/min authenticated
- **Endpoint-specific**: 10 event creations/hour

### Data Security
- **Environment variables**: All secrets in .env
- **Database**: Password-protected, localhost only
- **Backups**: Automated daily, encrypted at rest
- **Audit logs**: All sensitive operations logged

### Infrastructure
- **Firewall**: Only ports 80, 443, 22 open
- **SSH**: Key-based auth only, fail2ban enabled
- **SSL/TLS**: Automatic via Caddy + Let's Encrypt
- **DDoS**: Cloudflare free tier

---

## 📊 System Architecture

```
Internet
  │
  ▼
Cloudflare (DDoS protection, DNS)
  │
  ▼
Hetzner VPS (CX21: 2 vCPU, 4GB RAM)
┌─────────────────────────────────────┐
│  Caddy (Reverse Proxy + SSL)        │
│  ├─ seacalendar.yourdomain.com      │
│  ├─ /api/* → API Server :3001       │
│  └─ /ws/* → WebSocket :3001         │
├─────────────────────────────────────┤
│  API Server (Express)                │
│  ├─ REST endpoints                   │
│  ├─ WebSocket (Socket.io)           │
│  ├─ Discord OAuth                    │
│  └─ Prisma Client                    │
├─────────────────────────────────────┤
│  Discord Bot (discord.js)            │
│  ├─ Slash commands                   │
│  ├─ Event listeners                  │
│  ├─ Cron jobs (reminders)           │
│  └─ Prisma Client                    │
├─────────────────────────────────────┤
│  PostgreSQL 15                       │
│  └─ Database                         │
├─────────────────────────────────────┤
│  Web App (React + Vite)              │
│  └─ Static files served by Caddy    │
└─────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

### VPS Specifications (Hetzner CX21)
- **CPU**: 2 vCPU (AMD/Intel)
- **RAM**: 4 GB
- **Storage**: 40 GB SSD
- **Traffic**: 20 TB/month
- **Cost**: €4.15/month (~$4.50)

### Docker Compose Production
All services run in Docker containers:
- `postgres` - PostgreSQL database
- `api` - API server
- `discord-bot` - Discord bot
- `web` - Nginx serving static React build
- `caddy` - Reverse proxy + SSL

### CI/CD Pipeline
```
git push origin main
  ↓
GitHub Actions
  ├─ Run tests
  ├─ Build Docker images
  ├─ SSH to Hetzner VPS
  ├─ Pull new images
  ├─ Run migrations
  ├─ Restart services (zero downtime)
  └─ Smoke test
```

### Backup Strategy
- **Database**: Daily pg_dump, keep 7 days
- **Storage**: Optional Hetzner Storage Box
- **Application**: Git is backup (stateless)

---

## 🎓 Development Workflow

### Local Development
```bash
# Start everything
npm run dev

# Prisma Studio
npm run db:studio

# Watch for Claude pushes
npm run watch:auto
```

### Working with Claude Code
1. Claude pushes to `claude/feature-xyz`
2. Branch watcher detects (60s poll)
3. Auto-checkout + install deps
4. Test locally
5. Merge to `main` when ready
6. Auto-deploy to production

### Testing
- **Unit tests**: Vitest (shared, API, bot)
- **E2E tests**: Playwright (web)
- **Integration tests**: Jest (API + database)
- **Manual testing**: Test Discord server

---

## 📈 Future Enhancements (Post-v1.0)

### Phase 8+: Nice-to-Have Features
- [ ] Venue ratings (1-5 stars)
- [ ] Venue recommendations based on past visits
- [ ] Calendar sync (Google Calendar, iCal)
- [ ] SMS reminders (Twilio)
- [ ] Recurring events (e.g., "Every Friday")
- [ ] Event photos/gallery
- [ ] RSV P tracking (confirmed vs tentative)
- [ ] Event cost splitting
- [ ] Multi-server support (one bot, multiple servers)
- [ ] Mobile app (React Native)
- [ ] Generic polls ("What game should we play?")

---

## 📝 Next Immediate Steps

1. **Finish Monorepo Migration** (1-2 hours)
   - Move existing web app to `packages/web`
   - Test that everything builds
   - Commit and push

2. **Set Up Development Environment** (30 min)
   - Create `.env.development` from example
   - Create test Discord bot
   - Add test Discord server
   - Run `npm run db:setup`
   - Test `npm run dev`

3. **Start Phase 1: API Foundation** (Week 2)
   - See Phase 1 tasks above
   - Build core API endpoints
   - Implement Discord OAuth
   - Test authentication flow

4. **Optional: Set Up Hetzner VPS** (Parallel)
   - Can be done while building features locally
   - See separate HETZNER_SETUP.md guide

---

## 📚 Additional Documentation

- **DEVELOPMENT.md** - Local development guide
- **DEPLOYMENT.md** - Production deployment guide
- **API.md** - API endpoint reference (to create)
- **BOT_COMMANDS.md** - Discord bot commands (to create)
- **HETZNER_SETUP.md** - VPS setup guide (to create)

---

## 🤝 Questions?

Review this plan and let me know:
1. Any features to add/remove?
2. Ready to start Phase 1?
3. Need help with VPS setup first?
4. Prefer different tech choices?

This plan is flexible - we can adjust as needed!
