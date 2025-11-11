# Migration Guide: Express/React → Next.js

## Overview

This guide documents the migration from the current architecture (separate Express API + React app) to a consolidated Next.js application. This improves Claude's efficiency by reducing context switching across packages.

**Current Architecture:**
```
packages/
├── api/          # Express server (102 tests)
├── web/          # React + Vite
├── discord-bot/  # Discord bot (stays separate)
├── database/     # Prisma schema
└── shared/       # Shared types
```

**New Architecture:**
```
web-next/         # Next.js 15 (API + frontend + DB)
discord-bot/      # Discord bot (unchanged)
```

---

## Complete Example: Poll Feature

The `web-next/` directory contains a **complete working example** of the poll feature migration:

### 1. Service Layer Migration

**Before:** `packages/api/src/services/pollService.ts`
```typescript
import { prisma } from '@seacalendar/database';
import { logger } from '../middleware/logger';

export const createPoll = async (userId: string, data: CreatePollData) => {
  const poll = await prisma.poll.create({ ... });
  logger.info('Poll created', { pollId: poll.id });
  return poll;
};
```

**After:** `web-next/lib/services/poll.ts`
```typescript
import { db } from '../db';

export async function createPoll(userId: string, data: CreatePollData) {
  const poll = await db.poll.create({ ... });
  console.log('Poll created:', { pollId: poll.id });
  return poll;
}
```

**Changes:**
- `prisma` → `db` (singleton pattern)
- `logger` → `console.log` (Next.js has built-in logging)
- `export const` → `export async function` (cleaner imports)

### 2. API Route Migration

**Before:** `packages/api/src/routes/polls.ts` (Express)
```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createPoll } from '../services/pollService';

const router = Router();

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const poll = await createPoll(req.user!.id, req.body);
  res.status(201).json({ success: true, data: { poll } });
}));

export default router;
```

**After:** `web-next/app/api/polls/route.ts` (Next.js)
```typescript
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createPoll } from '@/lib/services/poll';
import { handleApiError, successResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const poll = await createPoll(user.id, body);
    return successResponse({ poll }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Changes:**
- Express router → Next.js route handlers
- Middleware → Direct function calls
- `req.user` → `requireAuth(request)` returns user
- Error handling in try/catch (no global error middleware)

### 3. API Route Structure

**Express pattern:**
```
packages/api/src/routes/
├── polls.ts          # router.get/post/patch/delete
└── votes.ts          # router.get/post/delete
```

**Next.js pattern:**
```
app/api/
├── polls/
│   ├── route.ts              # POST /api/polls
│   ├── [id]/
│   │   ├── route.ts          # GET/PATCH/DELETE /api/polls/[id]
│   │   ├── finalize/
│   │   │   └── route.ts      # POST /api/polls/[id]/finalize
│   │   └── reopen/
│   │       └── route.ts      # POST /api/polls/[id]/reopen
└── votes/
    └── [pollId]/
        └── route.ts          # POST /api/votes/[pollId]
```

### 4. Frontend Page Migration

**Before:** `packages/web/src/components/pages/VotingPageDb.tsx` (React Router)
```typescript
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

export default function VotingPageDb() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async () => {
    await api.post(`/polls/${pollId}/vote`, data, true);
    navigate('/results');
  };

  return <div>...</div>;
}
```

**After:** `web-next/app/polls/[id]/page.tsx` (Next.js)
```typescript
'use client';

import { useParams, useRouter } from 'next/navigation';

export default function PollVotingPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const handleSubmit = async () => {
    const token = localStorage.getItem('accessToken');
    await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    router.push('/results');
  };

  return <div>...</div>;
}
```

**Changes:**
- `react-router-dom` → `next/navigation`
- `useNavigate` → `useRouter`
- `useParams()` → `useParams()` (same name, different package)
- Custom `api` util → `fetch` (or keep your API utility)
- Add `'use client'` directive for client components

---

## Step-by-Step Migration Process

### Phase 1: Setup (✅ Complete)

```bash
# Structure created in web-next/
web-next/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/          # API routes
├── lib/
│   ├── db.ts         # Prisma client
│   ├── config.ts     # Environment config
│   ├── errors.ts     # Error handling
│   ├── auth.ts       # Auth helpers
│   └── services/     # Business logic
├── components/       # React components
├── prisma/
│   └── schema.prisma # Database schema
└── package.json
```

### Phase 2: Migrate Remaining Features

For each feature (votes, users, auth), repeat this pattern:

#### Step 1: Migrate Service Layer

```bash
# Copy service file
cp packages/api/src/services/voteService.ts web-next/lib/services/vote.ts
```

**Update imports:**
```typescript
// Remove
import { prisma } from '@seacalendar/database';
import { logger } from '../middleware/logger';

// Add
import { db } from '../db';
```

**Update function exports:**
```typescript
// Before
export const submitVote = async (...) => { ... }

// After
export async function submitVote(...) { ... }
```

#### Step 2: Create API Routes

```bash
# Create route file
mkdir -p web-next/app/api/votes/[pollId]
touch web-next/app/api/votes/[pollId]/route.ts
```

**Template:**
```typescript
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { submitVote } from '@/lib/services/vote';
import { handleApiError, successResponse } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const vote = await submitVote(params.pollId, user.id, body);
    return successResponse({ vote });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### Step 3: Migrate Frontend Pages

```bash
# Copy component
cp packages/web/src/components/pages/ResultsPageDb.tsx \
   web-next/app/polls/[id]/results/page.tsx
```

**Update imports:**
```typescript
// Remove
import { useNavigate } from 'react-router-dom';

// Add
'use client';
import { useRouter } from 'next/navigation';
```

**Update hooks:**
```typescript
// Before
const navigate = useNavigate();
navigate('/home');

// After
const router = useRouter();
router.push('/home');
```

### Phase 3: Shared Components

Move shared components to `web-next/components/`:

```bash
cp -r packages/web/src/components/shared web-next/components/
cp -r packages/web/src/components/features web-next/components/
```

Update imports to use `@/components/...` alias.

### Phase 4: Authentication

The Discord OAuth flow remains similar:

**`web-next/app/api/auth/discord/callback/route.ts`:**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Exchange code for token (same logic as Express)
  const tokenData = await exchangeCodeForToken(code);
  const discordUser = await fetchDiscordUser(tokenData.access_token);

  // Create/update user (same logic)
  const user = await db.user.upsert({ ... });

  // Generate JWT (same logic)
  const tokens = await generateTokens({ userId: user.id, ... });

  // Redirect to frontend with tokens
  return NextResponse.redirect(`${config.appUrl}/auth/callback?token=${tokens.accessToken}`);
}
```

### Phase 5: WebSocket (Optional)

Two approaches:

**Option A: Keep in API routes** (use Next.js custom server)
```typescript
// server.ts (custom Next.js server)
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';

const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handler);
  const io = new SocketIOServer(server);

  // WebSocket logic here
  io.on('connection', (socket) => { ... });

  server.listen(3000);
});
```

**Option B: Server-Sent Events** (simpler, no WebSocket)
```typescript
// app/api/polls/[id]/stream/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const stream = new ReadableStream({
    start(controller) {
      // Send updates
      setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({ update: 'poll changed' })}\n\n`);
      }, 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## Deployment Changes

### PM2 Configuration

**`ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [
    {
      name: 'seacalendar-web',
      script: 'web-next/.next/standalone/server.js',
      cwd: '/opt/seacalendar',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'seacalendar-bot',
      script: 'discord-bot/dist/bot.js',
      cwd: '/opt/seacalendar',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

### GitHub Actions

**`.github/workflows/deploy-production.yml`:**
```yaml
- name: Build Next.js app
  run: |
    cd web-next
    npm install
    npm run build

- name: Deploy with PM2
  run: |
    pm2 reload ecosystem.config.js
```

### Caddy Configuration

No changes needed - Caddy still reverse proxies to port 3000:

```
cal.billyeatstofu.com {
    reverse_proxy localhost:3000
}
```

---

## Discord Bot Integration

The Discord bot **requires no changes** if it calls the API via HTTP:

```typescript
// discord-bot/src/services/pollService.ts
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function createPoll(data: CreatePollData) {
  const response = await fetch(`${API_URL}/api/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

Just update `API_URL` env var from `:3001` to `:3000`.

---

## Testing Strategy

1. **Unit tests:** Migrate service tests to `web-next/lib/services/__tests__/`
2. **API tests:** Convert Express tests to Next.js route tests
3. **E2E tests:** Playwright tests should work with minimal changes (just update port)

**Example test:**
```typescript
// web-next/lib/services/__tests__/poll.test.ts
import { createPoll } from '../poll';
import { db } from '../../db';

jest.mock('../../db');

describe('Poll Service', () => {
  it('creates a poll', async () => {
    const mockPoll = { id: '123', title: 'Test' };
    (db.poll.create as jest.Mock).mockResolvedValue(mockPoll);

    const result = await createPoll('user-123', { title: 'Test', options: [...] });

    expect(result).toEqual(mockPoll);
  });
});
```

---

## Benefits for Claude

**Before migration:**
- 📁 Open file: `packages/api/src/services/pollService.ts`
- 📁 Open file: `packages/api/src/routes/polls.ts`
- 📁 Open file: `packages/shared/src/types/index.ts`
- 📁 Open file: `packages/web/src/components/pages/VotingPageDb.tsx`
- **4 packages, 4+ files** to understand one feature

**After migration:**
- 📁 Open file: `web-next/lib/services/poll.ts`
- 📁 Open file: `web-next/app/api/polls/[id]/route.ts`
- 📁 Open file: `web-next/app/polls/[id]/page.tsx`
- **1 project, 3 files** (adjacent in tree)

**~50% reduction in context switching.**

---

## Checklist

Use this checklist to track migration progress:

### Core Infrastructure
- [x] Next.js project setup
- [x] Prisma schema migrated
- [x] Config & environment variables
- [x] Error handling utilities
- [x] Auth utilities (JWT, Discord OAuth)

### Services (lib/services/)
- [x] Poll service
- [ ] Vote service
- [ ] User service
- [ ] Discord OAuth service
- [ ] Google OAuth service
- [ ] Local auth service

### API Routes (app/api/)
- [x] `/api/polls/*`
- [ ] `/api/votes/*`
- [ ] `/api/users/*`
- [ ] `/api/auth/discord/*`
- [ ] `/api/auth/google/*`
- [ ] `/api/auth/local/*`

### Frontend Pages (app/)
- [x] `/polls/[id]` (voting page - simplified)
- [ ] `/polls/[id]/results`
- [ ] `/` (landing page)
- [ ] `/login`
- [ ] `/auth/callback`
- [ ] `/create`
- [ ] `/my-events`

### Components
- [ ] Shared components (Button, Card, Modal, etc.)
- [ ] Feature components (Calendar, DatePicker, etc.)

### WebSocket
- [ ] Real-time poll updates
- [ ] Vote notifications

### Testing
- [ ] Service unit tests
- [ ] API route tests
- [ ] E2E tests updated

### Deployment
- [ ] PM2 config
- [ ] GitHub Actions updated
- [ ] Environment variables configured
- [ ] Prisma migrations working

### Cleanup
- [ ] Remove `packages/api/`
- [ ] Remove `packages/web/`
- [ ] Remove `packages/shared/`
- [ ] Update root package.json
- [ ] Update README.md

---

## Rollback Plan

Keep both systems running in parallel during migration:

1. Deploy Next.js app on port 3000 (new)
2. Keep Express API on port 3001 (existing)
3. Migrate routes incrementally
4. Use Caddy routing to split traffic:

```
cal.billyeatstofu.com {
    # New routes → Next.js
    reverse_proxy /api/polls/* localhost:3000

    # Old routes → Express
    reverse_proxy /api/* localhost:3001

    # Frontend → Next.js
    reverse_proxy localhost:3000
}
```

Once all routes migrated and tested, remove Express.

---

## Questions?

Review the complete working example in `web-next/`:
- `lib/services/poll.ts` - Service layer pattern
- `app/api/polls/*/route.ts` - API route pattern
- `app/polls/[id]/page.tsx` - Frontend page pattern

This demonstrates the full migration flow for one feature. Apply the same pattern to remaining features.
