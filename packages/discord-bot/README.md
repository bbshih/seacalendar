# SeaCalendar Discord Bot

Discord bot for creating and managing events with natural language processing.

## Features

- **Natural Language Event Creation**: Use `/event` to create events from plain English
- **Vote Status Tracking**: Check event status and vote counts with `/status`
- **Event Management**: View your events with `/myevents`, cancel with `/cancel`
- **Smart Date Parsing**: Automatically extract dates and times from descriptions
- **Web Integration**: Generate voting links that connect to the web app

## Commands

### `/event <description>`
Create a new event with natural language parsing.

**Examples:**
- `/event Q1 2025 Hangout - Fridays in January at 7pm`
- `/event Movie night next Friday and Saturday`
- `/event Dinner on Jan 10, Jan 17, and Jan 24 at 7:30pm`

### `/status <event_url>`
Check the vote progress and status of an event.

**Example:**
- `/status https://seacalendar.com/vote/abc123`
- `/status abc123` (just the poll ID)

### `/myevents`
List all events you've created in the current server.

### `/cancel <event_url>`
Cancel an event (creator only).

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (shared with API)
- Discord Bot Token
- Discord Application Client ID

### Environment Variables

Create `.env.development` in the root directory:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/seacalendar"

# Discord Bot
DISCORD_BOT_TOKEN="your_bot_token_here"
DISCORD_CLIENT_ID="your_client_id_here"
DISCORD_TEST_GUILD_ID="your_test_server_id" # Optional, for faster command deployment

# Web App
WEB_APP_URL="http://localhost:5173"

# Optional: Cron schedules
VOTE_REMINDER_CRON="0 10 * * *"  # Daily at 10 AM
EVENT_REMINDER_CRON="0 10 * * *" # Daily at 10 AM
```

### Installation

```bash
# From root directory
npm install

# Deploy slash commands to Discord
npm run deploy-commands -w @seacalendar/discord-bot
```

### Running the Bot

```bash
# Development (with auto-reload)
npm run dev:bot

# Production
npm run build -w @seacalendar/discord-bot
npm start -w @seacalendar/discord-bot
```

## Development

### Project Structure

```
src/
├── bot.ts              # Main bot entry point
├── config.ts           # Environment configuration
├── commands/           # Slash command implementations
│   ├── event.ts        # /event command
│   ├── status.ts       # /status command
│   ├── myevents.ts     # /myevents command
│   └── cancel.ts       # /cancel command
├── services/           # Business logic
│   ├── nlp.ts          # Natural language processing
│   └── pollService.ts  # Poll/event management
├── events/             # Discord event handlers (future)
├── cron/               # Scheduled tasks (future)
├── utils/              # Utility functions
├── types/              # TypeScript types
│   └── command.ts      # Command interface
└── test/               # Test files
    ├── setup.ts
    └── *.test.ts
```

### Natural Language Processing

The bot uses `chrono-node` to parse dates and times from natural language:

```typescript
parseEventDescription("Q1 Hangout on Jan 10 and Jan 17 at 7pm")
// Returns:
// {
//   title: "Q1 Hangout",
//   dates: [Date(2025-01-10), Date(2025-01-17)],
//   times: ["7:00 PM"],
//   raw: "..."
// }
```

### Testing

```bash
# Run tests
npm test -w @seacalendar/discord-bot

# Run tests with coverage
npm test -w @seacalendar/discord-bot -- --coverage

# Run specific test file
npm test -w @seacalendar/discord-bot -- nlp.test.ts
```

## Phase 2 Status

### ✅ Completed
- [x] Bot project setup with TypeScript
- [x] Discord client initialization
- [x] Slash command registration system
- [x] Natural language parsing (chrono-node + date-fns)
- [x] `/event` command with confirmation UI
- [x] `/status` command with vote tracking
- [x] `/myevents` command
- [x] `/cancel` command with confirmation
- [x] Poll service integration with database
- [x] Web app URL generation
- [x] Comprehensive tests (13 passing)

### 🚧 In Progress / Future
- [ ] Discord emoji voting (≤5 options)
- [ ] Real-time vote count updates
- [ ] Event reminder system (Phase 4)
- [ ] Vote reminder system (Phase 4)
- [ ] Channel notifications on events
- [ ] Venue management commands (Phase 5)

## Contributing

See main [DEVELOPMENT.md](../../DEVELOPMENT.md) for development workflow.

## License

See root [LICENSE](../../LICENSE)
