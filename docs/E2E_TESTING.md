# E2E Testing Guide

Comprehensive guide for end-to-end testing in SeaCalendar.

## Overview

SeaCalendar uses a multi-layered E2E testing approach:

- **API E2E Tests** - Test REST API endpoints with real PostgreSQL database
- **Web E2E Tests** - Test web application with real API backend using Playwright
- **Integration Tests** - Test cross-service interactions

## Quick Start

```bash
# Setup test environment (start test DB, run migrations, seed)
npm run test:e2e:setup

# Run API E2E tests
npm run test:e2e:api

# Run Web E2E tests with real API
npm run test:e2e:web

# Run all E2E tests
npm run test:e2e:full

# Clean up test environment
npm run test:e2e:clean
```

## Test Environment

### Test Database

- **Database:** PostgreSQL 15 (isolated from dev database)
- **Port:** 5433 (dev uses 5432)
- **Credentials:** `test/test`
- **URL:** `postgresql://test:test@localhost:5433/seacalendar_test`
- **Storage:** tmpfs (in-memory for speed)

### Test Services

- **API:** Port 3002 (dev uses 3001)
- **Web:** Port 5174 (dev uses 5173)
- **Environment:** `.env.test`

## Architecture

```
┌─────────────────────────────────────────────┐
│          E2E Test Workflow                  │
├─────────────────────────────────────────────┤
│                                             │
│  1. Start Test DB (docker-compose.test.yml)│
│  2. Run Migrations                          │
│  3. Seed Test Data                          │
│  4. Start API Server (port 3002)           │
│  5. Start Web App (port 5174)              │
│  6. Run E2E Tests                          │
│  7. Cleanup                                │
│                                             │
└─────────────────────────────────────────────┘
```

## Writing E2E Tests

### API E2E Tests

Location: `packages/api/src/e2e/`

**Example:**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { createTestUser, getTestPrisma } from '@seacalendar/database';

describe('Polls API E2E', () => {
  it('should create new poll', async () => {
    const user = await createTestUser();

    const response = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Team Lunch',
        options: [...]
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

**Key Features:**
- Real database interactions (no mocks)
- Automatic setup/teardown via `src/e2e/setup.ts`
- Database reset before each test
- Test fixtures and factories available

### Web E2E Tests

Location: `packages/web/e2e-api/`

**Example:**

```typescript
import { test, expect } from '@playwright/test';
import { registerUser, createPoll } from './helpers';

test('user can create and vote on poll', async ({ page }) => {
  const user = await registerUser(page);

  await page.goto('/');
  await page.click('text=Create Poll');
  // ... test flow
});
```

**Key Features:**
- Tests against real API backend
- Helper functions for common operations
- Screenshot/video on failure
- Automatic API/Web server startup

## Test Utilities

### Database Helpers

Located in `packages/database/src/testHelpers.ts`

```typescript
import {
  getTestPrisma,
  resetTestDatabase,
  seedTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
  withTestTransaction,
  cleanupTables,
} from '@seacalendar/database';

// Get test database client
const prisma = getTestPrisma();

// Reset database to clean state
await resetTestDatabase();

// Seed with basic data
const { user1, user2 } = await seedTestDatabase();

// Run in transaction (for isolation)
await withTestTransaction(async (tx) => {
  // Your test logic
});

// Clean specific tables
await cleanupTables(['vote', 'poll']);
```

### Test Fixtures

Located in `packages/database/src/testFixtures.ts`

```typescript
import {
  createTestUser,
  createTestPoll,
  createTestVote,
  createTestVenue,
  createPollScenario,
} from '@seacalendar/database';

// Create test user
const user = await createTestUser(prisma, {
  username: 'testuser',
  email: 'test@example.com',
});

// Create test poll with options
const poll = await createTestPoll(prisma, {
  title: 'Test Event',
  optionsCount: 3,
});

// Create complete scenario
const { poll, voters, votes } = await createPollScenario(prisma, {
  voterCount: 5,
  optionsCount: 3,
  withVotes: true,
});
```

### Web Test Helpers

Located in `packages/web/e2e-api/helpers.ts`

```typescript
import {
  registerUser,
  loginUser,
  createPoll,
  submitVotes,
  resetDatabase,
} from './helpers';

// Register user and get token
const { user, accessToken } = await registerUser(page);

// Create poll via API
const poll = await createPoll(page, accessToken, {
  title: 'Team Lunch',
  options: [...],
});

// Submit votes
await submitVotes(page, accessToken, poll.id, [
  { optionId: poll.options[0].id, availability: 'AVAILABLE' }
]);
```

## Configuration Files

### Test Database

**`docker-compose.test.yml`**
- Isolated PostgreSQL instance on port 5433
- Uses tmpfs for faster tests
- Automatic health checks

### Environment

**`.env.test`**
- Test-specific configuration
- Separate ports to avoid conflicts
- Mock Discord credentials

### Vitest Config

**`packages/api/vitest.e2e.config.ts`**
- E2E-specific test configuration
- Sequential execution for DB consistency
- 30s timeout for slower tests

### Playwright Config

**`packages/web/playwright.e2e.config.ts`**
- Starts both API and Web servers
- Single worker for consistency
- Screenshots/videos on failure

## CI/CD Integration

The E2E tests are designed to work in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Setup E2E Tests
  run: npm run test:e2e:setup

- name: Run E2E Tests
  run: npm run test:e2e:full

- name: Cleanup
  run: npm run test:e2e:clean
```

## Troubleshooting

### Port Conflicts

If ports 3002 or 5174 are in use, update `.env.test`:

```bash
API_PORT=3003
VITE_PORT=5175
```

### Database Connection Issues

```bash
# Check if test DB is running
docker ps | grep seacalendar-test-db

# Restart test DB
docker-compose -f docker-compose.test.yml restart

# Check logs
docker logs seacalendar-test-db
```

### Test Failures

```bash
# Reset test database
npm run test:e2e:reset

# Run single test file
npm run test:e2e:api -- src/e2e/auth.e2e.test.ts

# Run with UI (Playwright)
npm run test:e2e:web -- --ui
```

### Clean State

```bash
# Full cleanup and restart
npm run test:e2e:clean
docker system prune -f
npm run test:e2e:setup
```

## Best Practices

### 1. Database Isolation

- Use `resetTestDatabase()` before each test
- Or use `withTestTransaction()` for parallel tests
- Never rely on test execution order

### 2. Test Data

- Use fixtures/factories instead of hardcoding
- Create minimal data needed for test
- Clean up after yourself

### 3. Assertions

- Test behavior, not implementation
- Use real database checks to verify state
- Test both happy and error paths

### 4. Performance

- Test DB uses tmpfs (fast)
- Run tests in parallel when possible
- Use test fixtures to speed up setup

### 5. Debugging

- Use `--ui` flag for Playwright tests
- Check screenshots/videos on failure
- Use `console.log` in test helpers

## Scripts Reference

```bash
# Setup & Teardown
npm run test:e2e:setup    # Start test environment
npm run test:e2e:clean    # Stop test environment
npm run test:e2e:reset    # Reset test database

# Run Tests
npm run test:e2e:api      # API E2E tests only
npm run test:e2e:web      # Web E2E tests only
npm run test:e2e:full     # All E2E tests

# Development
npm run test:e2e:api -- --watch        # Watch mode
npm run test:e2e:web -- --ui           # Playwright UI
npm run test:e2e:web -- --debug        # Debug mode
```

## File Structure

```
seacalendar/
├── docker-compose.test.yml           # Test database
├── .env.test                         # Test environment
├── scripts/
│   ├── e2e-setup.sh                  # Setup script
│   ├── e2e-teardown.sh               # Teardown script
│   └── e2e-reset.sh                  # Reset script
├── packages/
│   ├── database/
│   │   └── src/
│   │       ├── testHelpers.ts        # Database helpers
│   │       └── testFixtures.ts       # Test fixtures
│   ├── api/
│   │   ├── vitest.e2e.config.ts      # Vitest config
│   │   └── src/
│   │       └── e2e/
│   │           ├── setup.ts          # Test setup
│   │           ├── auth.e2e.test.ts  # Auth tests
│   │           ├── polls.e2e.test.ts # Poll tests
│   │           └── votes.e2e.test.ts # Vote tests
│   └── web/
│       ├── playwright.e2e.config.ts  # Playwright config
│       └── e2e-api/
│           ├── helpers.ts            # Test helpers
│           ├── auth-flow.spec.ts     # Auth E2E tests
│           └── poll-flow.spec.ts     # Poll E2E tests
└── docs/
    └── E2E_TESTING.md                # This file
```

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
