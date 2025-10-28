# Phase 1 Progress & Next Steps

**Last Updated**: 2025-10-28
**Current Branch**: `claude/discord-bot-architecture-011CUVU7qwh3DSvgqPCyWWK1`
**Status**: Ready to continue Phase 1 (API Foundation)

---

## ✅ What's Complete

### Architecture & Planning
- [x] Complete system architecture designed (ARCHITECTURE_PLAN.md)
- [x] Feature specification finalized
- [x] Database schema created (13 models in Prisma)
- [x] Security architecture defined
- [x] 8-phase implementation roadmap

### Monorepo Migration
- [x] npm workspaces structure created
- [x] All packages set up (shared, database, api, discord-bot, web)
- [x] Existing web app migrated to packages/web
- [x] Shared utilities package built and tested
- [x] Development workflow established
- [x] Branch watcher implemented (secure polling)

### Documentation
- [x] ARCHITECTURE_PLAN.md - Complete roadmap
- [x] DEVELOPMENT.md - Local dev guide
- [x] HETZNER_SETUP.md - Production VPS setup guide
- [x] README_MONOREPO.md - Project overview
- [x] MONOREPO_MIGRATION.md - Migration tracker
- [x] .env.development.example - Environment template

### Infrastructure
- [x] Docker Compose for local PostgreSQL
- [x] Secure branch watcher (no external services)
- [x] All dependencies installed (379 packages)
- [x] Web app confirmed working (localhost:5173)

### Phase 1: API Foundation (20% Complete)
- [x] API package.json with all dependencies
- [x] TypeScript configuration
- [x] Environment validation system (config.ts with Zod)
- [x] Directory structure (middleware, routes, services, utils)

---

## 🚧 What's Next: Phase 1 (API Foundation)

### Immediate Next Steps

#### 1. Create Express Server (server.ts)
Location: `packages/api/src/server.ts`

```typescript
// Need to create:
- Express app initialization
- Middleware setup (body-parser, cors, helmet)
- Route registration
- Error handling
- Server startup
- Graceful shutdown
```

#### 2. Implement Security Middleware
Location: `packages/api/src/middleware/`

Files to create:
- `security.ts` - Helmet, CORS configuration
- `rateLimit.ts` - Rate limiting per endpoint
- `errorHandler.ts` - Global error handling
- `auth.ts` - JWT verification middleware
- `logger.ts` - Request logging (Winston)

#### 3. Implement Discord OAuth
Location: `packages/api/src/routes/auth.ts` and `packages/api/src/services/discord.ts`

Need to implement:
- `/api/auth/discord/callback` - OAuth callback handler
- `/api/auth/refresh` - Refresh JWT tokens
- `/api/auth/logout` - Invalidate tokens
- Discord API integration (fetch user profile)
- JWT token generation
- Refresh token storage (database)

#### 4. Create Core API Endpoints
Location: `packages/api/src/routes/`

Files to create:
- `polls.ts` - Poll CRUD operations
- `votes.ts` - Vote submission
- `users.ts` - User profile management

Endpoints needed:
```
POST   /api/polls           - Create poll
GET    /api/polls/:id       - Get poll details
PATCH  /api/polls/:id       - Update poll (creator only)
DELETE /api/polls/:id       - Cancel poll (creator only)
POST   /api/polls/:id/vote  - Submit/update vote
GET    /api/polls/:id/results - Get vote results
GET    /api/users/me        - Get current user
PATCH  /api/users/me        - Update user profile
```

#### 5. Database Integration
- Connect Prisma client
- Run migrations: `npm run db:migrate:dev`
- Seed test data: `npm run db:seed`
- Create seed file: `packages/database/prisma/seed.ts`

#### 6. WebSocket Setup (Socket.io)
Location: `packages/api/src/sockets/`

Need to implement:
- Socket.io server integration
- Real-time poll updates
- Vote submission events
- Connection authentication

#### 7. Testing
Location: `packages/api/src/**/*.test.ts`

Tests to write:
- Auth flow tests (OAuth, JWT)
- API endpoint tests
- Middleware tests
- Database integration tests

---

## 📋 Detailed Task Checklist

### Task 1: Express Server Setup
- [ ] Create `src/server.ts`
- [ ] Initialize Express app
- [ ] Set up body-parser middleware
- [ ] Configure CORS (use Config.corsOrigins)
- [ ] Set up Helmet security headers
- [ ] Register routes
- [ ] Add 404 handler
- [ ] Add global error handler
- [ ] Start server on Config.port
- [ ] Add graceful shutdown handlers

### Task 2: Security Middleware
- [ ] Create `middleware/security.ts`
  - [ ] Configure Helmet with CSP
  - [ ] Set security headers
- [ ] Create `middleware/rateLimit.ts`
  - [ ] General rate limit (100 req/min)
  - [ ] Auth rate limit (10 req/min)
  - [ ] Poll creation limit (10 req/hour)
- [ ] Create `middleware/errorHandler.ts`
  - [ ] Catch async errors
  - [ ] Format error responses
  - [ ] Log errors (Winston)
- [ ] Create `middleware/logger.ts`
  - [ ] Request logging
  - [ ] Response time tracking

### Task 3: Authentication
- [ ] Create `services/discord.ts`
  - [ ] `exchangeCodeForToken()` - OAuth token exchange
  - [ ] `fetchDiscordUser()` - Get user profile
  - [ ] `refreshDiscordToken()` - Refresh OAuth token
- [ ] Create `services/jwt.ts`
  - [ ] `generateTokens()` - Create JWT + refresh token
  - [ ] `verifyAccessToken()` - Verify JWT
  - [ ] `refreshAccessToken()` - Issue new JWT
- [ ] Create `middleware/auth.ts`
  - [ ] `requireAuth` - Verify JWT middleware
  - [ ] `optionalAuth` - Optional authentication
- [ ] Create `routes/auth.ts`
  - [ ] `GET /api/auth/discord/callback`
  - [ ] `POST /api/auth/refresh`
  - [ ] `POST /api/auth/logout`

### Task 4: Poll Routes
- [ ] Create `services/pollService.ts`
  - [ ] `createPoll()` - Business logic
  - [ ] `getPoll()` - Fetch poll with relations
  - [ ] `updatePoll()` - Update poll
  - [ ] `deletePoll()` - Cancel poll
  - [ ] `finalizePoll()` - Set winning option
- [ ] Create `routes/polls.ts`
  - [ ] `POST /api/polls` - Create (requires auth)
  - [ ] `GET /api/polls/:id` - Get details
  - [ ] `PATCH /api/polls/:id` - Update (creator only)
  - [ ] `DELETE /api/polls/:id` - Cancel (creator only)
  - [ ] `POST /api/polls/:id/finalize` - Finalize (creator only)

### Task 5: Vote Routes
- [ ] Create `services/voteService.ts`
  - [ ] `submitVote()` - Create or update vote
  - [ ] `getVoteResults()` - Calculate tallies
  - [ ] `getVoterStats()` - User voting stats
- [ ] Create `routes/votes.ts`
  - [ ] `POST /api/polls/:id/vote` - Submit vote (requires auth)
  - [ ] `GET /api/polls/:id/results` - Get results
  - [ ] `GET /api/polls/:id/invites` - Who voted

### Task 6: User Routes
- [ ] Create `services/userService.ts`
  - [ ] `getUser()` - Get user by ID
  - [ ] `updateUser()` - Update profile
  - [ ] `getUserPolls()` - Get user's polls
  - [ ] `getUserStats()` - Get user stats
- [ ] Create `routes/users.ts`
  - [ ] `GET /api/users/me` - Current user
  - [ ] `PATCH /api/users/me` - Update profile
  - [ ] `GET /api/users/me/polls` - My polls

### Task 7: Database Setup
- [ ] Create `prisma/seed.ts`
  - [ ] Seed test users
  - [ ] Seed test polls
  - [ ] Seed test votes
- [ ] Run migrations: `npm run db:migrate:dev`
- [ ] Test Prisma Studio: `npm run db:studio`

### Task 8: WebSocket Integration
- [ ] Create `sockets/index.ts`
  - [ ] Initialize Socket.io
  - [ ] Authentication middleware
- [ ] Create `sockets/pollEvents.ts`
  - [ ] `poll:subscribe` - Join poll room
  - [ ] `poll:unsubscribe` - Leave poll room
  - [ ] Emit `poll:vote_submitted` on new vote
  - [ ] Emit `poll:finalized` on finalization

### Task 9: Testing
- [ ] Set up Vitest config
- [ ] Create test database
- [ ] Write auth tests
- [ ] Write poll endpoint tests
- [ ] Write vote endpoint tests
- [ ] Run tests: `npm test -w @seacalendar/api`

---

## 🔧 Development Commands

```bash
# Start local development
npm run dev                # All services
npm run dev:db            # PostgreSQL only
npm run dev:api           # API server only (hot reload)

# Database
npm run db:studio         # Visual editor (localhost:5555)
npm run db:migrate:dev    # Create migration
npm run db:seed           # Seed test data

# Testing
npm test -w @seacalendar/api

# Building
npm run build -w @seacalendar/api
```

---

## 📚 Key Documentation References

| Document | Purpose |
|----------|---------|
| `ARCHITECTURE_PLAN.md` | Full 8-phase roadmap, all features |
| `DEVELOPMENT.md` | Local dev setup, all commands |
| `HETZNER_SETUP.md` | Production VPS setup (independent) |
| `packages/database/prisma/schema.prisma` | Database schema (13 models) |
| `packages/api/src/config.ts` | Environment configuration |
| `.env.development.example` | Environment variables template |

---

## 🎯 Success Criteria for Phase 1

Phase 1 is complete when:

- [ ] Express server running on localhost:3001
- [ ] Discord OAuth flow working (can login from web)
- [ ] JWT authentication working
- [ ] Can create polls via API
- [ ] Can submit votes via API
- [ ] Can fetch poll results via API
- [ ] Rate limiting active
- [ ] Security headers configured
- [ ] Error handling working
- [ ] Logs being written (Winston)
- [ ] Database migrations applied
- [ ] Test data seeded
- [ ] Basic API tests passing

---

## 🚀 Quick Start for Next Session

```bash
# 1. Pull latest code
git checkout main
git merge claude/discord-bot-architecture-011CUVU7qwh3DSvgqPCyWWK1

# 2. Install dependencies (if needed)
npm install

# 3. Set up environment
cp .env.development.example .env.development
# Edit .env.development with your values

# 4. Start database
npm run db:setup

# 5. Continue building API
cd packages/api
# Create src/server.ts (next file to create)
```

---

## 💡 Tips for Next Session

1. **Start with server.ts** - Get Express running first
2. **Test incrementally** - Start server after each middleware
3. **Use Postman/Thunder Client** - Test API endpoints as you build
4. **Check Prisma Studio** - Verify data going into database
5. **Reference existing code** - Web app has similar patterns

---

## 🔗 External Resources

- **Discord OAuth Guide**: https://discord.com/developers/docs/topics/oauth2
- **Prisma Docs**: https://www.prisma.io/docs
- **Express Best Practices**: https://expressjs.com/en/advanced/best-practice-security.html
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725

---

## ❓ Questions to Ask

If you get stuck or need clarification:

1. **Discord OAuth**: "How do I implement the Discord OAuth callback?"
2. **Database**: "How do I connect Prisma to the API server?"
3. **Auth**: "How do I verify JWT tokens in middleware?"
4. **Routes**: "What should the poll creation endpoint look like?"
5. **Testing**: "How do I test API endpoints with authentication?"

All architecture decisions are documented in ARCHITECTURE_PLAN.md.

---

**Ready to continue! Phase 1 is 20% complete. Next: Build Express server and auth flow.**
