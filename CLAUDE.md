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
- ✅ React Router setup with hash routing (6 placeholder pages)
- ✅ Shared UI components (Button, Card, Input, Modal, CopyButton)
- ✅ CreateEventPage implementation with date selection & password protection
- ✅ Custom hooks (useEventFromUrl, useOrganizerKey)
- ✅ GitHub Gist storage with AES-GCM encryption
- ✅ GitHubTokenSetup component for PAT management
- ✅ VotingPage implementation with password support
- ✅ ResultsPage implementation with vote tallies & organizer controls
- ✅ Security improvements (sessionStorage, PBKDF2 password protection)
- ✅ Serverless vote submission (Vercel API endpoint)
- ⏳ E2e tests (next up)

**Total: 80 tests passing**

**Phase 1 Status: COMPLETE** ✅

### Storage Architecture

**GitHub Gist Backend (Private & Encrypted):**
- Private Gists store event data
- AES-GCM client-side encryption (256-bit keys)
- Encryption keys embedded in URLs, never stored on GitHub
- Organizer can delete event data anytime
- Requires GitHub Personal Access Token (gist scope)

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

Phase 1 is complete! Next priorities:
1. **E2e tests** - Add Playwright tests for complete voting flow
2. **Phase 2 features** (venue selection, calendar invites):
   - VenueSelectionPage with OpenTable integration
   - ICS file generator for calendar invites
   - Email template generator
3. **Polish & improvements**:
   - Additional animations and ocean theme enhancements
   - Better mobile responsiveness
   - Accessibility improvements
   - Performance optimizations

### Serverless Voting

**✅ IMPLEMENTED** - Voters can now vote without GitHub tokens!

The app uses a Vercel serverless function (`/api/submit-vote`) to handle Gist updates server-side. This means:
- Voters don't need GitHub accounts or tokens
- Only the organizer needs to set up a GitHub PAT in Vercel environment variables
- Event data is encrypted client-side before being sent to the serverless function
- The serverless function securely updates Gists using the server-side token

**Setup Requirements:**
1. Deploy to Vercel (or compatible serverless platform)
2. Set `GITHUB_TOKEN` environment variable in Vercel dashboard
3. See DEPLOYMENT.md for detailed setup instructions

Refer to TECHNICAL_SPEC.md for detailed requirements for Phase 2 components.
