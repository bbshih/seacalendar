# SeaCalendar Next.js App

Modern Next.js 15 application consolidating API + frontend for SeaCalendar.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Environment Variables

Create `.env.local` with:

```bash
DATABASE_URL="postgresql://dev:dev@localhost:5432/seacalendar_dev"
JWT_SECRET="your-32-char-secret"
DISCORD_CLIENT_ID="your_client_id"
DISCORD_CLIENT_SECRET="your_client_secret"
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/discord/callback"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Development

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Run linter
```

## Project Structure

```
web-next/
├── app/
│   ├── api/                 # API routes (replaces Express)
│   │   ├── auth/           # Authentication
│   │   ├── polls/          # Poll endpoints
│   │   ├── votes/          # Vote endpoints
│   │   └── users/          # User endpoints
│   ├── polls/[id]/         # Poll pages
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── lib/
│   ├── services/           # Business logic
│   │   ├── poll.ts
│   │   ├── vote.ts
│   │   ├── user.ts
│   │   ├── jwt.ts
│   │   └── discord.ts
│   ├── db.ts               # Prisma client
│   ├── config.ts           # Environment config
│   ├── errors.ts           # Error handling
│   ├── auth.ts             # Auth utilities
│   └── types.ts            # TypeScript types
├── components/             # React components
├── prisma/
│   └── schema.prisma       # Database schema
└── package.json
```

## API Routes

### Authentication
- `GET /api/auth/discord/url` - Get Discord OAuth URL
- `GET /api/auth/discord/callback` - OAuth callback
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Polls
- `POST /api/polls` - Create poll
- `GET /api/polls/[id]` - Get poll
- `PATCH /api/polls/[id]` - Update poll
- `DELETE /api/polls/[id]` - Cancel poll
- `POST /api/polls/[id]/finalize` - Finalize poll
- `POST /api/polls/[id]/reopen` - Reopen poll

### Votes
- `POST /api/polls/[id]/vote` - Submit vote
- `GET /api/polls/[id]/vote` - Get user's vote
- `DELETE /api/polls/[id]/vote` - Delete vote
- `GET /api/polls/[id]/results` - Get results
- `GET /api/polls/[id]/voters` - Get voter details
- `GET /api/votes/stats` - Get voting stats

### Users
- `GET /api/users/me` - Get profile
- `PATCH /api/users/me` - Update profile
- `DELETE /api/users/me` - Delete account
- `GET /api/users/me/preferences` - Get preferences
- `PATCH /api/users/me/preferences` - Update preferences
- `GET /api/users/me/polls` - Get user's polls
- `GET /api/users/me/stats` - Get user stats

## Database

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

## Deployment

### Production Build

```bash
# Install dependencies
npm install

# Build Next.js app (creates standalone output)
npm run build

# The build creates:
# .next/standalone/server.js - Optimized server
# .next/static/ - Static assets
# public/ - Public files
```

### PM2 Deployment

The app uses standalone output for PM2:

```bash
# Start with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs seacalendar-web

# Reload
pm2 reload seacalendar-web

# Stop
pm2 stop seacalendar-web
```

### Environment Variables (Production)

Set in `.env.production.local`:

```bash
NODE_ENV="production"
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."
DISCORD_REDIRECT_URI="https://cal.billyeatstofu.com/api/auth/discord/callback"
NEXT_PUBLIC_APP_URL="https://cal.billyeatstofu.com"
```

## Features

- ✅ Discord OAuth authentication
- ✅ Poll creation and management
- ✅ Real-time voting
- ✅ Results and analytics
- ✅ User preferences
- ⏳ Google OAuth (optional)
- ⏳ Google Calendar sync (optional)
- ⏳ WebSocket real-time updates

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL 15 + Prisma ORM
- **Auth:** JWT + Discord OAuth
- **Styling:** Tailwind CSS 4
- **Deployment:** PM2 on Hetzner VPS

## Migration from Express

This app replaces:
- `packages/api/` - Express REST API
- `packages/web/` - React + Vite app
- `packages/shared/` - Shared types

Benefits:
- Single codebase (API + frontend)
- Co-located features
- Simpler deployment
- Better Claude efficiency (~50% less context switching)

See [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) for details.
