# SeaCalendar - Technical Specification

## Project Overview

**SeaCalendar** is a database-less React web application for organizing monthly friend group hangouts. It streamlines the process of proposing dates, collecting votes, selecting venues, and sending calendar invites.

**Target Users**: Friend groups (6-10 people) organizing quarterly hangouts
**Deployment**: GitHub Pages (static site)
**Theme**: Creative and playful ocean/sea theme

---

## User Workflow

### Current Manual Process (to be automated)
1. Organizer sends list of available dates (quarterly: 3 months of Fri-Sun dates)
2. Friends vote on dates via email/Discord/text (1-2 weeks voting period)
3. Organizer tallies votes, considers who can attend
4. Organizer searches OpenTable for restaurants with specific requirements
5. Organizer sends Google Calendar invite via email

### Improved Digital Workflow
1. **Create Event**: Organizer creates event with date options → generates shareable link
2. **Vote**: Friends click link, enter name, select available dates → votes embedded in URL
3. **Review Results**: Organizer views vote tallies and attendee lists
4. **Select Venue**: Organizer picks winning date, enters venue details (with helper tools)
5. **Send Invite**: Generate .ics file + email template, send to group

---

## Technical Architecture

### Tech Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Framework | React 18+ | Modern, component-based UI |
| Build Tool | Vite | Fast dev server, optimized builds |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS | Rapid UI development, ocean theme customization |
| Routing | React Router v6 | Client-side routing for SPA |
| State Management | URL-based (hash routing) | No backend needed, shareable links |
| Compression | lz-string | Keep URLs manageable |
| Deployment | GitHub Pages | Free, static hosting |

### Why Database-less?

**Pros:**
- No backend infrastructure needed
- No hosting costs
- Privacy-friendly (no data stored on servers)
- Shareable links contain all state
- Works offline after initial load

**Cons:**
- URLs can get long (mitigated with compression)
- No central "view all past events" (could use localStorage)
- Need to keep links to access past data

### URL State Architecture

All application state is encoded in the URL hash using compressed JSON:

```
Base URL structure:
https://username.github.io/seacalendar/#/[route]?data=[compressed-json]&key=[organizer-key]

Examples:
- Create event: /#/create
- Voting link:   /#/vote?data=N4IgdghgtgpiBc...
- Results:       /#/results?data=N4IgdghgtgpiBc...&key=abc123
- Summary:       /#/event?data=N4IgdghgtgpiBc...
```

**Organizer Key**: Simple hash appended to results/edit links. Not cryptographically secure, but prevents accidental editing by voters.

---

## Data Model

### Core Types (TypeScript)

```typescript
interface Event {
  id: string;                    // UUID v4
  title: string;                 // "Q1 2025 Hangouts"
  organizer: string;             // Organizer's name
  dateOptions: DateOption[];     // Proposed dates
  votes: Vote[];                 // Collected votes
  finalizedEvent?: FinalizedEvent;
  createdAt: string;             // ISO timestamp
}

interface DateOption {
  id: string;                    // UUID or index
  date: string;                  // ISO date format: "2025-01-10"
  label: string;                 // Display: "Fri Jan 10"
}

interface Vote {
  voterName: string;             // Required, free text
  selectedDates: string[];       // Array of DateOption ids
  timestamp: string;             // When vote was submitted
}

interface FinalizedEvent {
  selectedDateId: string;        // Reference to DateOption
  venue: VenueDetails;
  attendees: string[];           // Derived from votes for selected date
}

interface VenueDetails {
  name: string;
  address: string;
  time: string;                  // "7:00 PM"
  websiteUrl?: string;
  menuUrl?: string;
  notes?: string;
}
```

### State Encoding/Decoding

```typescript
// utils/urlState.ts

import LZString from 'lz-string';

export function encodeEventToUrl(event: Event): string {
  const json = JSON.stringify(event);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeEventFromUrl(encoded: string): Event {
  const json = LZString.decompressFromEncodedURIComponent(encoded);
  return JSON.parse(json);
}

export function generateOrganizerKey(eventId: string): string {
  // Simple hash for organizer access
  // Not secure, but prevents accidental edits
  return btoa(eventId).substring(0, 8);
}
```

---

## Application Routes & Pages

### Route Structure

| Route | Purpose | Access | URL Pattern |
|-------|---------|--------|-------------|
| `/` | Landing page | Public | `/#/` |
| `/create` | Create new event | Organizer | `/#/create` |
| `/vote` | Vote on dates | Voters | `/#/vote?data=...` |
| `/results` | View vote results | Organizer | `/#/results?data=...&key=...` |
| `/venue` | Select venue | Organizer | `/#/venue?data=...&key=...` |
| `/event` | Final event summary | Public | `/#/event?data=...` |

### Page 1: Landing Page (`/`)

**Purpose**: Welcome page, navigation to create event

**Ocean Theme Ideas**:
- Wave animations
- "Dive into planning" CTA
- Fish/sea creature illustrations
- Gradient blues/teals

**Content**:
- App logo/title: "SeaCalendar" with wave icon
- Tagline: "Making friend hangouts flow like the tide"
- Primary CTA: "Create Event" → `/create`
- Secondary: "How it works" section
- Footer: Link to GitHub, credits

### Page 2: Create Event Page (`/create`)

**Purpose**: Organizer creates event with date options

**Ocean Theme Ideas**:
- "Set sail on a new adventure"
- Date selector styled like shells or buoys
- "Cast your net" for date range selection

**Form Fields**:
1. **Event Title**
   - Input: Text
   - Placeholder: "Q1 2025 Hangouts"
   - Default: Auto-generate based on current quarter?

2. **Your Name (Organizer)**
   - Input: Text
   - Required

3. **Date Options**
   - Two methods:
     - **Quick Add**: Date range picker + day selector
       - Start date, end date
       - Checkboxes: Fri, Sat, Sun
       - Button: "Generate dates"
     - **Manual Add**: Individual date picker + "Add Date" button
   - Display: List of added dates (with remove button)
   - Preview: "Fri Jan 10, 2025" format

**Actions**:
- Button: "Generate Voting Link"
- On click:
  - Create Event object with unique ID
  - Encode to URL
  - Show modal with:
    - **Voting Link**: For friends (copy button)
    - **Results Link**: For organizer (copy button, includes key)
  - Store organizer key in localStorage for easy access

**Validation**:
- At least 1 date option required
- Event title and organizer name required

### Page 3: Voting Page (`/vote?data=...`)

**Purpose**: Friends vote on available dates

**Ocean Theme Ideas**:
- "Swim with us!" header
- Dates styled as floating islands or boats
- Selected dates get wave/ripple effect
- "Drop anchor" for submit button

**Layout**:
1. **Event Header**
   - Event title (large)
   - "Organized by [name]"
   - Instructions: "Select all dates you're available"

2. **Voter Name Input**
   - Input: Text
   - Placeholder: "Your name"
   - Required before selecting dates

3. **Date Selection**
   - Display: Grid/list of DateOptions
   - UI: Toggle buttons or checkboxes with custom styling
   - Show day of week + date: "Fri Jan 10"
   - Visual feedback for selected dates

4. **Submit Vote**
   - Button: "Submit Vote"
   - Disabled until name entered

**Post-Submit State**:
- Update URL with new vote added
- Show success message: "Vote submitted!"
- Display: "You can change your vote by bookmarking this link:"
- Show updated URL (with their vote) + copy button
- Option: "Vote again as someone else" (clears name, keeps event)

**Edge Cases**:
- If voter name already exists, show warning: "Someone already voted as [name]. Use a different name or replace their vote?"
- Allow re-voting by reloading same URL

### Page 4: Results Page (`/results?data=...&key=...`)

**Purpose**: Organizer views vote tallies and selects winning date

**Ocean Theme Ideas**:
- "Tide is turning" header
- Vote counts shown as wave heights
- Selected date gets "treasure chest" icon
- Attendee avatars as fish/sea creatures

**Access Control**:
- Check URL for organizer key
- If missing/invalid: Show message "You need the organizer link to view results"

**Layout**:

1. **Event Info**
   - Event title
   - Total votes: X people voted
   - Link to re-share voting link

2. **Vote Summary Table**
   - Columns:
     - Date (sorted by vote count, descending)
     - Vote Count (highlight ties)
     - Attendees (comma-separated names)
   - Visual: Progress bar or wave graphic for vote counts
   - Hover: Highlight who voted

3. **Date Selection**
   - Each row has "Select This Date" button
   - On click: Navigate to `/venue` with selected date

4. **Ties & Considerations**
   - Highlight tied dates visually
   - Show note: "Consider who can attend when breaking ties"

**Export Options** (nice to have):
- Download CSV of votes
- Copy table as text

### Page 5: Venue Selection Page (`/venue?data=...&key=...`)

**Purpose**: Organizer selects venue for chosen date

**Ocean Theme Ideas**:
- "Chart your course" header
- Form styled like a ship's log or nautical map
- Requirements shown as compass points

**Layout**:

1. **Selected Date Summary**
   - Display: "Planning for [Day, Date]"
   - Attendees: List of people who voted for this date
   - Count: "X people attending"

2. **Venue Requirements Helper**
   - Collapsible panel: "Venue Requirements Checklist"
   - Static reminders:
     - ✓ Seats 6-10 people
     - ✓ Vegan options available
     - ✓ Allergen-free options (no dairy/fruit)
     - ✓ Casual-upscale atmosphere
     - ✓ Check OpenTable for availability
   - Link to OpenTable (opens in new tab)

3. **Past Venues Reference** (Phase 3)
   - Show recent venues to avoid repetition
   - Stored in localStorage or separate URL param

4. **Venue Details Form**
   - **Venue Name** (required)
   - **Address** (required)
   - **Time** (required) - Time picker, default 7:00 PM
   - **Website URL** (optional)
   - **Menu URL** (optional)
   - **Notes** (optional) - Textarea for any special instructions

5. **Action Button**
   - "Finalize Event" → Navigate to `/event`

### Page 6: Event Summary Page (`/event?data=...`)

**Purpose**: Final event details, download .ics, share link

**Ocean Theme Ideas**:
- "Your crew is ready to set sail!"
- Event details in a message-in-a-bottle design
- Download button styled as treasure chest

**Layout**:

1. **Event Details Card**
   - Event title
   - 📅 Date & time (large, prominent)
   - 📍 Venue name
   - Address (with Google Maps link)
   - 🌐 Website/menu links (if provided)
   - 👥 Attendees list
   - 📝 Notes (if any)

2. **Calendar Actions**
   - **Download .ics File** button (primary CTA)
     - Generates RFC-5545 compliant calendar file
     - Auto-download on click
   - Preview: "Add to Google Calendar, Apple Calendar, Outlook, etc."

3. **Share Options**
   - **Copy Event Link** button
     - Copies current URL to clipboard
     - Shareable read-only link
   - **Share via Email** button
     - Opens mailto: with pre-filled template:
       ```
       Subject: [Event Title] - [Date] at [Venue]

       Hey everyone!

       Our next hangout is confirmed:

       📅 [Day, Date] at [Time]
       📍 [Venue Name]
       [Address]

       Menu: [link]

       Please add this to your calendar - see attached .ics file.
       You can also view details here: [event-link]

       See you there!
       ```

4. **Edit Option** (for organizer)
   - If has organizer key: Show "Edit Event" button
   - Returns to venue selection to modify details

---

## Utilities & Helpers

### URL State Management (`utils/urlState.ts`)

```typescript
import LZString from 'lz-string';
import { Event } from '../types';

export function encodeEventToUrl(event: Event): string {
  const json = JSON.stringify(event);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeEventFromUrl(encoded: string | null): Event | null {
  if (!encoded) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decode event from URL', error);
    return null;
  }
}

export function generateOrganizerKey(eventId: string): string {
  return btoa(eventId).substring(0, 8);
}

export function verifyOrganizerKey(eventId: string, key: string): boolean {
  return generateOrganizerKey(eventId) === key;
}

export function buildVotingUrl(event: Event): string {
  const data = encodeEventToUrl(event);
  return `${window.location.origin}${window.location.pathname}#/vote?data=${data}`;
}

export function buildResultsUrl(event: Event): string {
  const data = encodeEventToUrl(event);
  const key = generateOrganizerKey(event.id);
  return `${window.location.origin}${window.location.pathname}#/results?data=${data}&key=${key}`;
}

export function buildEventUrl(event: Event): string {
  const data = encodeEventToUrl(event);
  return `${window.location.origin}${window.location.pathname}#/event?data=${data}`;
}
```

### .ics File Generator (`utils/icsGenerator.ts`)

```typescript
import { Event, FinalizedEvent } from '../types';

export function generateIcsFile(event: Event): string {
  if (!event.finalizedEvent) {
    throw new Error('Event must be finalized before generating .ics file');
  }

  const { venue, selectedDateId, attendees } = event.finalizedEvent;
  const dateOption = event.dateOptions.find(d => d.id === selectedDateId);

  if (!dateOption) {
    throw new Error('Selected date not found');
  }

  // Parse date and time
  const eventDate = new Date(`${dateOption.date}T${venue.time}`);
  const dtStart = formatIcsDateTime(eventDate);
  const dtEnd = formatIcsDateTime(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)); // +2 hours

  // Build description
  let description = `Attendees: ${attendees.join(', ')}`;
  if (venue.menuUrl) description += `\\nMenu: ${venue.menuUrl}`;
  if (venue.websiteUrl) description += `\\nWebsite: ${venue.websiteUrl}`;
  if (venue.notes) description += `\\n\\n${venue.notes}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SeaCalendar//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@seacalendar`,
    `DTSTAMP:${formatIcsDateTime(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${venue.name}`,
    `LOCATION:${venue.address}`,
    `DESCRIPTION:${description}`,
    `ORGANIZER:CN=${event.organizer}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

function formatIcsDateTime(date: Date): string {
  // Format: YYYYMMDDTHHMMSS
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function downloadIcsFile(event: Event): void {
  const icsContent = generateIcsFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

### Date Helpers (`utils/dateHelpers.ts`)

```typescript
export function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${dayOfWeek} ${month} ${day}`;
}

export function generateDatesInRange(
  startDate: Date,
  endDate: Date,
  daysOfWeek: number[] // 0 = Sunday, 5 = Friday, 6 = Saturday
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (daysOfWeek.includes(current.getDay())) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function createDateOption(isoDate: string, index: number): DateOption {
  return {
    id: `date-${index}`,
    date: isoDate,
    label: formatDateLabel(isoDate)
  };
}
```

### Vote Tally Helper (`utils/voteHelpers.ts`)

```typescript
import { Event, DateOption, Vote } from '../types';

export interface VoteTally {
  dateOption: DateOption;
  voteCount: number;
  voters: string[];
}

export function calculateVoteTallies(event: Event): VoteTally[] {
  const tallies: Map<string, VoteTally> = new Map();

  // Initialize tallies
  event.dateOptions.forEach(dateOption => {
    tallies.set(dateOption.id, {
      dateOption,
      voteCount: 0,
      voters: []
    });
  });

  // Count votes
  event.votes.forEach(vote => {
    vote.selectedDates.forEach(dateId => {
      const tally = tallies.get(dateId);
      if (tally) {
        tally.voteCount++;
        tally.voters.push(vote.voterName);
      }
    });
  });

  // Sort by vote count (descending)
  return Array.from(tallies.values()).sort((a, b) => b.voteCount - a.voteCount);
}

export function getAttendeesForDate(event: Event, dateId: string): string[] {
  return event.votes
    .filter(vote => vote.selectedDates.includes(dateId))
    .map(vote => vote.voterName);
}
```

---

## Design System - Ocean Theme

### Color Palette

```css
/* tailwind.config.js custom colors */

theme: {
  extend: {
    colors: {
      ocean: {
        50: '#f0f9ff',   // Foam white
        100: '#e0f2fe',  // Light sky blue
        200: '#b9e6fe',  // Light cyan
        300: '#7dd3fc',  // Bright cyan
        400: '#38bdf8',  // Sky blue
        500: '#0ea5e9',  // Ocean blue (primary)
        600: '#0284c7',  // Deep ocean
        700: '#0369a1',  // Navy blue
        800: '#075985',  // Dark navy
        900: '#0c4a6e',  // Midnight blue
      },
      coral: {
        400: '#fb923c',  // Coral orange (accent)
        500: '#f97316',
      },
      sand: {
        100: '#fef3c7',  // Light sand
        200: '#fde68a',
        300: '#fcd34d',
      },
      seaweed: {
        500: '#10b981',  // Sea green
        600: '#059669',
      }
    }
  }
}
```

### Typography

- **Headings**: Consider playful fonts like "Baloo 2", "Quicksand", or "Fredoka"
- **Body**: Clean sans-serif like "Inter" or "Poppins"
- **Accents**: Optional script font for taglines

### Visual Elements

**Animations**:
- Wave animations on landing page (CSS keyframes)
- Ripple effects on button clicks
- Floating/bobbing animations for cards
- Smooth transitions between pages

**Graphics**:
- SVG illustrations: fish, waves, boats, anchors, shells
- Background patterns: subtle wave patterns, bubbles
- Icons: Use ocean-themed alternatives
  - ✓ → fish icon
  - Calendar → anchor or ship wheel
  - Copy link → message in bottle

**Component Styling**:
- Rounded corners (medium to large radius)
- Soft shadows (water reflections)
- Gradient backgrounds (ocean depths)
- Glassmorphism effects for cards

### Component Examples

**Button Styles**:
```tsx
// Primary CTA
className="bg-ocean-500 hover:bg-ocean-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"

// Secondary
className="bg-white border-2 border-ocean-400 text-ocean-600 hover:bg-ocean-50 py-2 px-4 rounded-lg transition-colors"
```

**Card Styles**:
```tsx
className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-ocean-400"
```

**Date Selection Tiles**:
```tsx
// Unselected
className="bg-ocean-50 border-2 border-ocean-200 rounded-lg p-4 hover:border-ocean-400 transition-colors cursor-pointer"

// Selected
className="bg-ocean-400 border-2 border-ocean-600 rounded-lg p-4 text-white shadow-lg transform scale-105"
```

---

## Development Phases

### Phase 1: Core Voting System (MVP)

**Goal**: Functional voting flow without styling polish

**Tasks**:
1. Project setup
   - Initialize Vite + React + TypeScript
   - Install dependencies: react-router-dom, lz-string, tailwind
   - Configure Tailwind with ocean theme colors
   - Set up basic project structure

2. URL state utilities
   - Implement encode/decode functions
   - Test compression with sample data
   - Organizer key generation/verification

3. Type definitions
   - Create all TypeScript interfaces

4. Basic routing
   - Set up React Router with hash routing
   - Create placeholder pages

5. CreateEventPage
   - Form with all fields
   - Date range generator
   - Manual date add/remove
   - Generate voting + results links
   - Copy to clipboard functionality

6. VotingPage
   - Decode event from URL
   - Voter name input
   - Date selection UI
   - Submit vote (update URL)
   - Show updated link

7. ResultsPage
   - Decode event + verify organizer key
   - Calculate vote tallies
   - Display results table
   - Select date button → navigate to venue

8. Basic styling
   - Apply ocean theme colors
   - Responsive layout
   - Basic animations

**Deliverable**: Working MVP that can be tested end-to-end

### Phase 2: Calendar Integration

**Goal**: Complete the workflow with venue selection and .ics generation

**Tasks**:
1. VenueSelectionPage
   - Display selected date + attendees
   - Venue requirements checklist
   - Venue details form
   - Finalize event

2. .ics file generation
   - Implement RFC-5545 compliance
   - Test with various calendar apps
   - Download functionality

3. EventSummaryPage
   - Display finalized event details
   - Download .ics button
   - Copy event link
   - Generate mailto: link for email sharing

4. Polish & testing
   - Cross-browser testing
   - Mobile responsive design
   - Error handling
   - Loading states

**Deliverable**: Full working application

### Phase 3: AI & Smart Features

**Goal**: Add intelligent helpers for date selection and venue discovery

**Tasks** (Smart Features without AI APIs):
1. Date pattern helpers
   - Preset options for common patterns
   - Quick "all Fri-Sun in Q1" button

2. Venue checklist enhancements
   - Interactive checklist
   - Link integrations (OpenTable, Google Maps)

3. Past venues tracker
   - localStorage persistence
   - Display on venue selection page
   - "We've been here before" warnings

**Optional** (with AI API integration):
- Natural language date input
- Venue recommendation chatbot
- Smart cuisine/neighborhood suggestions

---

## Deployment Setup

### GitHub Pages Configuration

**Repository**: `https://github.com/[username]/seacalendar`
**GitHub Pages URL**: `https://[username].github.io/seacalendar/`

**Build & Deploy**:
1. Vite build configuration:
   ```js
   // vite.config.ts
   export default defineConfig({
     base: '/seacalendar/',  // Repository name
     build: {
       outDir: 'dist'
       }
   })
   ```

2. GitHub Actions workflow:
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
           with:
             node-version: '18'
         - run: npm ci
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

3. Enable GitHub Pages in repo settings:
   - Source: gh-pages branch
   - Enforce HTTPS

### Build Commands

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

---

## Testing Strategy

### Manual Testing Checklist

**Phase 1 (Core Voting)**:
- [ ] Create event with date range generator
- [ ] Create event with manual dates
- [ ] Copy voting link works
- [ ] Copy results link works
- [ ] Vote with valid name
- [ ] Vote without name (should block)
- [ ] Submit vote and verify URL updates
- [ ] Vote multiple times with same name (should warn/replace)
- [ ] View results with organizer key
- [ ] View results without key (should block)
- [ ] Vote tallies calculate correctly
- [ ] Attendee lists show correct names
- [ ] Select date from results

**Phase 2 (Calendar)**:
- [ ] Enter venue details
- [ ] Finalize event
- [ ] Download .ics file
- [ ] Open .ics in Google Calendar
- [ ] Open .ics in Apple Calendar
- [ ] Open .ics in Outlook
- [ ] Verify event details in calendar
- [ ] Copy event link works
- [ ] Email template generates correctly
- [ ] mailto: link opens with correct content

**Cross-Browser Testing**:
- Chrome/Edge (Chromium)
- Firefox
- Safari (macOS/iOS)
- Mobile browsers (iOS Safari, Chrome Android)

**Edge Cases**:
- Very long event titles
- Special characters in names/venues
- Large number of dates (50+)
- Large number of voters (20+)
- URL length limits (test compression)
- Malformed URLs
- Missing query parameters

---

## Future Enhancements

### Phase 4+: Advanced Features

**Google Calendar Integration** (requires backend):
- OAuth flow for calendar access
- Import organizer's free/busy times
- Auto-suggest available dates
- Send invites via Calendar API

**Email Integration** (requires backend):
- SendGrid/Mailgun integration
- Send voting links via email
- Automated reminders
- Confirmation emails

**Analytics** (privacy-friendly):
- Track usage patterns (no PII)
- Popular date patterns
- Voting completion rates

**Past Events Archive**:
- localStorage-based history
- Export/import event data
- Search past events
- Venue rotation tracker

**Advanced Voting**:
- Ranked choice voting
- "Cannot attend" option
- Preferred vs available dates
- Anonymous voting mode

**Social Features**:
- RSVP confirmations
- Comments/discussion thread
- Photo sharing from past events
- Dietary preference tracking

**AI Enhancements** (with API):
- ChatGPT integration for venue discovery
- Parse natural language: "Third Friday of every month"
- Predict optimal dates based on history
- Venue recommendation engine

---

## Technical Constraints & Limitations

### Browser Support
- Modern browsers only (ES2020+)
- No IE11 support
- Requires JavaScript enabled
- Requires localStorage for organizer key persistence

### URL Length Limits
- Most browsers: ~2000 characters safe
- With compression: Should handle ~50 dates + 20 voters
- If exceeded: Consider localStorage fallback or warning

### Privacy & Security
- Organizer key is NOT cryptographically secure
- Anyone with results link can view votes
- No data encryption (URLs are visible)
- Suitable for trusted friend groups only
- NOT suitable for sensitive/private data

### Performance
- Client-side only - no server costs
- Fast initial load (small bundle size)
- URL decode/encode is synchronous (could block on huge datasets)
- Consider Web Workers for large data if needed

### Offline Capability
- After initial load, app works offline
- Can create events offline
- Can vote offline
- Links must be shared manually (no push notifications)

---

## Project File Structure

```
seacalendar/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment
├── public/
│   └── ocean-wave.svg          # Theme graphics
├── src/
│   ├── assets/                 # Images, SVGs
│   │   ├── logo.svg
│   │   └── illustrations/
│   ├── components/             # React components
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── CreateEventPage.tsx
│   │   │   ├── VotingPage.tsx
│   │   │   ├── ResultsPage.tsx
│   │   │   ├── VenueSelectionPage.tsx
│   │   │   └── EventSummaryPage.tsx
│   │   ├── shared/             # Reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   └── WaveAnimation.tsx
│   │   └── features/           # Feature-specific components
│   │       ├── DateSelector.tsx
│   │       ├── VoteTallyTable.tsx
│   │       └── VenueForm.tsx
│   ├── utils/
│   │   ├── urlState.ts         # Encode/decode event from URL
│   │   ├── icsGenerator.ts     # Calendar file generation
│   │   ├── dateHelpers.ts      # Date formatting utilities
│   │   └── voteHelpers.ts      # Vote tallying logic
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── hooks/                  # Custom React hooks
│   │   ├── useEventFromUrl.ts
│   │   └── useCopyToClipboard.ts
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles + Tailwind
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── README.md                   # User-facing documentation
├── CLAUDE.md                   # AI assistant guidance
└── TECHNICAL_SPEC.md          # This file
```

---

## Dependencies

### Production Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "lz-string": "^1.5.0"
}
```

### Development Dependencies
```json
{
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "@types/lz-string": "^1.5.0",
  "@vitejs/plugin-react": "^4.2.0",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32",
  "tailwindcss": "^3.3.6",
  "typescript": "^5.3.0",
  "vite": "^5.0.0"
}
```

---

## Success Metrics

### MVP Success (Phase 1-2)
- [ ] Successfully create event and generate links
- [ ] 6-10 friends can vote without issues
- [ ] Vote tallies are accurate
- [ ] .ics file works in major calendar apps
- [ ] Works on mobile and desktop
- [ ] No data loss when sharing links

### User Experience Goals
- Create event: < 2 minutes
- Vote: < 30 seconds
- Results review: < 1 minute
- Zero learning curve for voters
- Minimal clicks (< 5 to complete any action)

---

## Open Questions & Decisions Needed

1. **Font choices**: Which specific fonts for headings/body?
2. **Illustrations**: Use library (undraw.co?) or custom SVGs?
3. **Mobile nav**: Hamburger menu or bottom tabs?
4. **Dark mode**: Include from start or add later?
5. **Animations**: How much is too much? (performance vs delight)
6. **Error messages**: Playful ocean puns or straightforward?
7. **Loading states**: Skeleton screens or spinners?
8. **Past venues**: Start in Phase 2 or wait for Phase 3?

---

## Getting Started (for developers)

```bash
# Clone repository
git clone https://github.com/[username]/seacalendar.git
cd seacalendar

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

---

## License & Credits

**License**: MIT (or your choice)

**Credits**:
- Built with React + Vite
- Styled with Tailwind CSS
- Icons from [icon library TBD]
- Illustrations from [source TBD]

---

**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Status**: Planning Phase - Ready for Implementation
