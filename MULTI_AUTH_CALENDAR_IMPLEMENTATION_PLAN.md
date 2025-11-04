# Multi-Provider Authentication & Calendar Sync Implementation Plan

## Overview

This document outlines the implementation plan for enhancing SeaCalendar's authentication system to support multiple auth providers (Discord, Google, Username/Password) and integrating Google Calendar sync for busy time display during voting.

## Goals

1. **Multi-Provider Authentication**
   - Support Discord OAuth (required, can link later)
   - Support Google OAuth (optional, enables calendar sync)
   - Support Username/Password (basic auth, requires Discord link within 7 days)

2. **Calendar Integration**
   - Google Calendar OAuth with read-only access
   - Fetch and cache user calendar events
   - Display busy times on voting UI
   - Show event details (optional, user preference)

3. **Account Linking**
   - Allow users to link multiple auth providers to one account
   - Enforce Discord linking for non-Discord signups (7-day deadline)
   - Prevent duplicate accounts across providers

## Current Status

### ✅ Completed (Phase 1 - Backend Foundation)

#### Database Schema
- [x] Created `AuthProvider` model for multi-provider support
  - Fields: provider (DISCORD/GOOGLE/LOCAL), providerId, tokens, metadata
  - Unique constraints on (provider, providerId) and (userId, provider)
- [x] Updated `User` model for flexible authentication
  - Made `discordId` nullable (allow non-Discord signups)
  - Added `passwordHash` for local auth
  - Added `discordLinkDeadline` and `requireDiscordLink` flags
  - Added `displayName`, `emailVerified`, `isActive`
- [x] Created `CalendarConnection` model
  - OAuth tokens for Google Calendar API
  - Settings: syncEnabled, showBusyTimes, showEventTitles
  - Sync metadata: lastSyncAt, syncStatus, syncError
- [x] Created `CalendarEvent` model for caching
  - Event details: title, description, location
  - Timing: startTime, endTime, isAllDay, timezone
  - Status: confirmed/tentative/cancelled, busy/free
- [x] Applied database migration to production
- [x] Migrated existing Discord users to AuthProvider table

#### Backend Services
- [x] **Local Auth Service** (`packages/api/src/services/localAuth.ts`)
  - `register()` - Create account with username/password
  - `login()` - Authenticate with credentials
  - `changePassword()` - Update password
  - Password validation (8+ chars, uppercase, lowercase, number)
  - Username validation (3-20 alphanumeric chars)
  - 7-day Discord link requirement for new accounts

- [x] **Google OAuth Service** (`packages/api/src/services/google.ts`)
  - `getAuthUrl()` - Generate OAuth authorization URL
  - `exchangeCode()` - Exchange auth code for tokens
  - `getUserInfo()` - Fetch Google user profile
  - `refreshAccessToken()` - Refresh expired tokens
  - `createOrLinkAccount()` - Create new user or link to existing
  - Support for calendar scope (offline access + refresh tokens)

- [x] **Config Updates** (`packages/api/src/config.ts`)
  - Added Google OAuth config (clientId, clientSecret, redirectUri)
  - Added scope definitions for basic OAuth and calendar access

### 📋 Remaining Work (Phase 2-4)

## Phase 2: Backend API Routes & Auth Flow

### 2.1 Local Auth Routes
**File:** `packages/api/src/routes/auth.ts`

Add endpoints:
```typescript
POST   /api/auth/register          // Username/password registration
POST   /api/auth/login             // Username/password login
POST   /api/auth/change-password   // Change password (authenticated)
```

**Tasks:**
- [ ] Add Zod schemas for request validation
- [ ] Implement rate limiting (stricter for auth endpoints)
- [ ] Add registration endpoint with email verification (optional)
- [ ] Add login endpoint returning JWT tokens
- [ ] Add password change endpoint (requires auth)
- [ ] Add input sanitization
- [ ] Install `bcrypt` package (not yet installed!)

**Dependencies:**
```bash
npm install bcrypt @types/bcrypt
```

### 2.2 Google OAuth Routes
**File:** `packages/api/src/routes/auth.ts`

Add endpoints:
```typescript
GET    /api/auth/google/url              // Get OAuth URL
GET    /api/auth/google/callback         // OAuth callback handler
POST   /api/auth/google/link             // Link Google to existing account
```

**Tasks:**
- [ ] Add Google auth URL endpoint (similar to Discord)
- [ ] Add Google callback handler
  - Create new user OR link to existing account
  - Return JWT tokens
- [ ] Add account linking endpoint (requires authentication)
- [ ] Handle errors (missing refresh token, already linked, etc.)

### 2.3 Update Discord Auth Service
**File:** `packages/api/src/services/discord.ts`

**Tasks:**
- [ ] Update `createOrUpdateUser()` to use `AuthProvider` model
- [ ] Support linking Discord to existing account
- [ ] Migrate away from `DiscordToken` table to `AuthProvider`
- [ ] Handle Discord link deadline for local/Google accounts
- [ ] Update Discord callback to check for existing accounts

### 2.4 Account Linking Endpoints
**File:** `packages/api/src/routes/users.ts`

Add endpoints:
```typescript
GET    /api/users/me/providers          // List linked providers
POST   /api/users/me/link/discord       // Link Discord account
POST   /api/users/me/link/google        // Link Google account
DELETE /api/users/me/unlink/:provider   // Unlink provider
```

**Tasks:**
- [ ] Add endpoint to list linked auth providers
- [ ] Add Discord linking endpoint
- [ ] Add Google linking endpoint
- [ ] Add provider unlinking (prevent unlinking last provider)
- [ ] Add deadline warnings for Discord link requirement

## Phase 3: Google Calendar Sync

### 3.1 Calendar Sync Service
**File:** `packages/api/src/services/calendar.ts`

Create service with methods:
```typescript
- connectCalendar(userId, authCode)      // Initial OAuth connection
- syncCalendarEvents(userId)              // Fetch & cache events
- getBusyTimes(userId, dateRange)         // Get busy times for dates
- disconnectCalendar(userId)              // Remove connection
- refreshCalendarToken(connectionId)     // Refresh expired tokens
```

**Tasks:**
- [ ] Install googleapis package
  ```bash
  npm install googleapis @types/googleapis
  ```
- [ ] Implement Google Calendar API client
- [ ] Create `connectCalendar()` - save OAuth tokens
- [ ] Create `syncCalendarEvents()`:
  - Fetch events for next 90 days
  - Store in `CalendarEvent` table
  - Delete old cached events
  - Update `lastSyncAt` timestamp
- [ ] Create `getBusyTimes()`:
  - Query cached events for date range
  - Return busy time slots with optional event details
  - Respect `showEventTitles` preference
- [ ] Create background sync job (cron every 15 min)
- [ ] Handle token refresh automatically
- [ ] Add error handling and retry logic

### 3.2 Calendar API Endpoints
**File:** `packages/api/src/routes/calendar.ts` (new file)

Add endpoints:
```typescript
POST   /api/calendar/connect          // Connect Google Calendar (OAuth)
GET    /api/calendar/status            // Get sync status
POST   /api/calendar/sync              // Trigger manual sync
GET    /api/calendar/busy-times        // Get busy times for date range
PATCH  /api/calendar/settings          // Update calendar settings
DELETE /api/calendar/disconnect        // Disconnect calendar
```

**Tasks:**
- [ ] Create new router file
- [ ] Add calendar connection endpoint (OAuth flow)
- [ ] Add sync status endpoint (lastSyncAt, event count, errors)
- [ ] Add manual sync trigger endpoint
- [ ] Add busy times endpoint:
  - Query params: startDate, endDate
  - Return array of busy time slots
  - Include event titles if user preference allows
- [ ] Add settings update endpoint:
  - syncEnabled, showBusyTimes, showEventTitles
- [ ] Add disconnect endpoint (delete connection & cached events)
- [ ] Add to main app router

### 3.3 Background Sync Job
**File:** `packages/api/src/jobs/calendarSync.ts` (new file)

**Tasks:**
- [ ] Install node-cron package
  ```bash
  npm install node-cron @types/node-cron
  ```
- [ ] Create cron job (every 15 minutes)
- [ ] Fetch all active calendar connections
- [ ] Sync events for each user
- [ ] Log sync results and errors
- [ ] Update sync status in database
- [ ] Start job on server boot

## Phase 4: Frontend Updates

### 4.1 Authentication Context Updates
**File:** `packages/web/src/contexts/AuthContext.tsx`

**Tasks:**
- [ ] Update user type to include new fields:
  - displayName, emailVerified, requireDiscordLink, discordLinkDeadline
  - authProviders array
- [ ] Add local auth methods:
  - `register(username, email, password)`
  - `loginLocal(username, password)`
- [ ] Add Google auth methods:
  - `loginGoogle()` - redirect to OAuth
  - `linkGoogle()` - link to existing account
- [ ] Add provider management:
  - `getLinkedProviders()`
  - `unlinkProvider(provider)`
- [ ] Show Discord link deadline warnings
- [ ] Update token refresh logic

### 4.2 Login/Signup UI
**Files:**
- `packages/web/src/components/pages/LoginPage.tsx` (update)
- `packages/web/src/components/pages/RegisterPage.tsx` (new)

**Tasks:**
- [ ] Update LoginPage with tabs/sections:
  - Discord login button (existing)
  - Google login button (new)
  - Username/password form (new)
  - "Create account" link to RegisterPage
- [ ] Create RegisterPage:
  - Username input with validation
  - Email input (optional)
  - Password input with strength indicator
  - Confirm password field
  - Submit button
  - Discord link deadline notice
  - "Already have account?" link
- [ ] Add form validation with Zod
- [ ] Add error handling and display
- [ ] Ocean theme styling

### 4.3 Account Linking UI
**File:** `packages/web/src/components/pages/AccountSettingsPage.tsx` (new/update)

**Tasks:**
- [ ] Create account settings page or section
- [ ] Display linked providers with badges:
  - Discord (required) - show username, avatar
  - Google (optional) - show email, picture
  - Local (if using password) - show "Password auth enabled"
- [ ] Add "Link Provider" buttons for unlinked providers
- [ ] Show Discord link deadline if applicable
- [ ] Add "Change Password" button (if using local auth)
- [ ] Add "Unlink" buttons (disable for last provider)
- [ ] Handle OAuth flows for linking

### 4.4 Calendar Sync UI
**File:** `packages/web/src/components/pages/CalendarSettingsPage.tsx` (new)

**Tasks:**
- [ ] Create calendar settings page
- [ ] Add "Connect Google Calendar" button
- [ ] Show connection status:
  - Connected: email, last sync time, event count
  - Not connected: explanation and benefits
- [ ] Add sync settings toggles:
  - Enable/disable sync
  - Show busy times on voting pages
  - Show event titles (privacy option)
- [ ] Add "Sync Now" button
- [ ] Add "Disconnect" button with confirmation
- [ ] Show sync errors if any
- [ ] OAuth flow handling

### 4.5 Voting Page Updates
**File:** `packages/web/src/components/pages/VotingPage.tsx`

**Tasks:**
- [ ] Fetch user's busy times for poll date range
- [ ] Display busy indicators on date options:
  - Visual indicator (e.g., diagonal stripes, yellow bg)
  - Tooltip showing "Busy" or event title
  - Legend explaining busy time display
- [ ] Add loading state while fetching busy times
- [ ] Handle users without calendar connected
- [ ] Don't block voting on busy dates (just informational)
- [ ] Ocean theme styling for busy indicators

### 4.6 User Profile Page Updates
**File:** `packages/web/src/components/pages/UserProfilePage.tsx`

**Tasks:**
- [ ] Show linked providers section
- [ ] Show calendar sync status
- [ ] Link to account settings
- [ ] Link to calendar settings
- [ ] Show Discord link deadline if applicable

## Phase 5: Testing & Deployment

### 5.1 Backend Testing
- [ ] Test local auth registration flow
- [ ] Test local auth login flow
- [ ] Test Google OAuth new user flow
- [ ] Test Google OAuth existing user link flow
- [ ] Test Discord link requirement enforcement
- [ ] Test account linking/unlinking
- [ ] Test calendar OAuth flow
- [ ] Test calendar sync service
- [ ] Test busy times API
- [ ] Test token refresh logic
- [ ] Test edge cases (duplicate emails, already linked, etc.)

### 5.2 Frontend Testing
- [ ] Test registration form validation
- [ ] Test login with all providers
- [ ] Test account linking UI flows
- [ ] Test calendar connection flow
- [ ] Test busy times display on voting page
- [ ] Test responsive design
- [ ] Test error handling and messaging

### 5.3 Database Migration
- [x] Migration already applied to production
- [ ] Verify data integrity
- [ ] Monitor for migration issues

### 5.4 Environment Setup
- [ ] Add Google OAuth credentials to `.env.production.local`:
  ```env
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  GOOGLE_REDIRECT_URI=https://cal.billyeatstofu.com/api/auth/google/callback
  ```
- [ ] Create Google Cloud project
- [ ] Enable Google Calendar API
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URIs

### 5.5 Deployment
- [ ] Install new npm packages (bcrypt, googleapis, node-cron)
- [ ] Rebuild Docker containers
- [ ] Test in staging environment (if available)
- [ ] Deploy to production
- [ ] Monitor logs for errors
- [ ] Test all auth flows in production

## Technical Details

### Database Schema Summary

```prisma
model User {
  // Identity
  username        String   @unique
  displayName     String?
  avatar          String?
  passwordHash    String?  // For local auth

  // Discord (required but linkable later)
  discordId       String?  @unique
  discordLinkDeadline DateTime?
  requireDiscordLink Boolean

  // Contacts
  email           String?  @unique
  emailVerified   Boolean

  // Status
  isActive        Boolean

  // Relations
  authProviders   AuthProvider[]
  calendarConnections CalendarConnection[]
}

model AuthProvider {
  provider     AuthProviderType  // DISCORD | GOOGLE | LOCAL
  providerId   String
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  providerData Json?

  @@unique([provider, providerId])
  @@unique([userId, provider])
}

model CalendarConnection {
  provider        CalendarProvider  // GOOGLE
  accessToken     String
  refreshToken    String
  expiresAt       DateTime

  // Settings
  syncEnabled     Boolean
  showBusyTimes   Boolean
  showEventTitles Boolean

  // Sync metadata
  lastSyncAt      DateTime?
  syncStatus      SyncStatus

  cachedEvents    CalendarEvent[]
}

model CalendarEvent {
  providerEventId String
  title           String
  startTime       DateTime
  endTime         DateTime
  isAllDay        Boolean
  transparency    String?  // opaque (busy) | transparent (free)
}
```

### API Routes Summary

```
Auth:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/change-password
  GET    /api/auth/google/url
  GET    /api/auth/google/callback
  GET    /api/auth/discord/url (existing)
  GET    /api/auth/discord/callback (existing, needs update)

Users:
  GET    /api/users/me/providers
  POST   /api/users/me/link/discord
  POST   /api/users/me/link/google
  DELETE /api/users/me/unlink/:provider

Calendar:
  POST   /api/calendar/connect
  GET    /api/calendar/status
  POST   /api/calendar/sync
  GET    /api/calendar/busy-times?startDate=...&endDate=...
  PATCH  /api/calendar/settings
  DELETE /api/calendar/disconnect
```

### Security Considerations

1. **Password Security**
   - Bcrypt with 12 rounds for hashing
   - Minimum 8 characters, mixed case, numbers required
   - No password in logs or error messages

2. **OAuth Security**
   - State parameter for CSRF protection
   - Refresh token rotation
   - Secure token storage (encrypted at rest recommended)
   - Token expiry enforcement

3. **Calendar Data Privacy**
   - User controls event title visibility
   - Only fetch events user explicitly grants access to
   - Automatic token refresh
   - Secure token storage

4. **Account Linking**
   - Prevent linking already-linked accounts
   - Require at least one auth provider
   - Enforce Discord linking deadline

5. **Rate Limiting**
   - Stricter limits on auth endpoints
   - Prevent brute force attacks
   - IP-based and user-based limits

## Dependencies to Install

```bash
# Backend
cd packages/api
npm install bcrypt @types/bcrypt
npm install googleapis @types/googleapis
npm install node-cron @types/node-cron

# Frontend (if needed)
cd packages/web
# (May need additional packages for forms, validation)
```

## Estimated Timeline

- **Phase 2 (Backend Routes):** 4-6 hours
- **Phase 3 (Calendar Sync):** 6-8 hours
- **Phase 4 (Frontend UI):** 8-10 hours
- **Phase 5 (Testing & Deploy):** 4-6 hours

**Total:** 22-30 hours of development work

## Risks & Mitigation

### Risk 1: Breaking Existing Discord Auth
**Mitigation:**
- Keep DiscordToken table for backward compatibility
- Thorough testing before deployment
- Feature branch development
- Gradual rollout

### Risk 2: Calendar Sync Performance
**Mitigation:**
- Cache events in database (already planned)
- Background sync job (15-min intervals)
- Limit sync to 90 days ahead
- Pagination for large event lists

### Risk 3: OAuth Token Management
**Mitigation:**
- Automatic token refresh
- Error handling for expired tokens
- User-friendly re-auth flow
- Token encryption at rest (future)

### Risk 4: User Confusion (Multiple Auth Methods)
**Mitigation:**
- Clear UI/UX design
- Onboarding flow explanation
- Discord requirement prominently displayed
- Help documentation

## Rollout Strategy

### Option A: Feature Branch (Recommended for Production)
1. Create `feat/multi-auth-calendar` branch
2. Implement all features
3. Test thoroughly in development
4. Deploy to staging environment
5. User acceptance testing
6. Merge to main and deploy

### Option B: Incremental Deployment
1. Deploy Phase 2 (backend auth routes) first
2. Test auth flows
3. Deploy Phase 3 (calendar sync)
4. Test calendar integration
5. Deploy Phase 4 (frontend)
6. Full system testing

### Option C: Direct to Production (Not Recommended)
- High risk on production server
- No rollback plan
- Potential for user disruption

## Success Criteria

- [ ] Users can register with username/password
- [ ] Users can sign in with Discord, Google, or local auth
- [ ] Users can link multiple auth providers
- [ ] Discord linking enforced within 7 days for non-Discord signups
- [ ] Users can connect Google Calendar
- [ ] Calendar events sync automatically
- [ ] Busy times display on voting pages
- [ ] All existing Discord users unaffected
- [ ] No performance degradation
- [ ] Zero data loss during migration

## Next Steps

**Immediate actions needed:**

1. **Decision:** Choose rollout strategy (A, B, or C)
2. **Setup:** Create Google Cloud project and OAuth credentials
3. **Branch:** Create feature branch if using Option A
4. **Install:** Add npm dependencies
5. **Implement:** Start with Phase 2 (backend routes)

---

**Document Status:** Draft - Implementation Plan
**Last Updated:** 2025-11-04
**Author:** Claude Code
**Related Files:**
- `/opt/seacalendar/packages/database/prisma/schema.prisma`
- `/opt/seacalendar/packages/api/src/services/localAuth.ts`
- `/opt/seacalendar/packages/api/src/services/google.ts`
- `/opt/seacalendar/packages/api/src/config.ts`
