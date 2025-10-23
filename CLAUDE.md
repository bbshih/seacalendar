# CLAUDE.md

This file provides guidance to Claude Code when working with the SeaCalendar repository.

## Overview

**SeaCalendar** is an ocean-themed React web application for organizing friend group hangouts. It's a database-less system that uses URL-based state management to handle event creation, voting, and calendar invite generation.

See [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md) for complete technical specification.

## Development Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:5173

# Testing
npm test                 # Run unit tests with Vitest
npm run test:ui          # Open Vitest UI
npm run test:e2e         # Run Playwright e2e tests
npm run test:e2e:ui      # Open Playwright UI

# Build
npm run build            # Build for production
npm run preview          # Preview production build
```

## Architecture

### Tech Stack
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** with ocean theme (blues, corals, teals)
- **React Router v6** (hash routing)
- **LZ-String** for URL compression
- **Vitest** + **Testing Library** for unit tests
- **Playwright** for e2e tests

### Project Structure

```
src/
├── components/
│   ├── pages/          # Page components (CreateEventPage, VotingPage, etc.)
│   ├── shared/         # Reusable UI components (Button, Card, Input, etc.)
│   └── features/       # Feature-specific components (DateSelector, etc.)
├── utils/              # Utility functions
│   ├── urlState.ts     # ✅ URL encoding/decoding (23 tests)
│   ├── dateHelpers.ts  # ✅ Date formatting/generation (26 tests)
│   ├── voteHelpers.ts  # ✅ Vote tallying/statistics (31 tests)
│   └── icsGenerator.ts # ⏳ Phase 2
├── types/              # ✅ TypeScript type definitions
├── hooks/              # Custom React hooks
└── test/               # ✅ Test setup and utilities
```

### Current Status

**Phase 1 Progress (Core Voting System):**
- ✅ Project setup & configuration
- ✅ Type definitions (Event, Vote, DateOption, etc.)
- ✅ URL state utilities with tests (23 passing)
- ✅ Date helpers with tests (26 passing)
- ✅ Vote helpers with tests (31 passing)
- ⏳ React Router setup (next up)
- ⏳ Shared UI components
- ⏳ CreateEventPage
- ⏳ VotingPage
- ⏳ ResultsPage
- ⏳ E2e tests

**Total: 80 tests passing**

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

### Key Implementation Details

1. **URL-based State:** All event data is compressed and stored in URL hash parameters using LZ-String. No backend required.

2. **Organizer Key:** Simple base64-encoded key (not cryptographically secure) to prevent accidental edits. Format: `btoa(eventId).substring(0, 8)`

3. **Testing:** All features must have unit tests and e2e tests. Use Vitest for unit tests, Playwright for e2e.

4. **Git Commits:** Make reasonably-sized commits with descriptive messages. Include emoji footer for Claude-generated code.

### Next Steps

Continue with Phase 1:
1. Implement `voteHelpers.ts` with tests
2. Set up React Router with hash routing
3. Create shared components (Button, Card, Input, Modal, CopyButton)
4. Build CreateEventPage
5. Build VotingPage
6. Build ResultsPage
7. Add e2e tests for complete voting flow
8. Apply ocean theme styling

Refer to TECHNICAL_SPEC.md for detailed requirements for each component.
