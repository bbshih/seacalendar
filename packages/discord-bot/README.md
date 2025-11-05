# SeaCalendar Discord Bot

Discord bot for creating and managing events with natural language processing.

## Commands

- `/event <description>` - Create event with natural language parsing
  - Example: `Q1 2025 Hangout - Fridays in January at 7pm`
- `/status <event_url>` - Check vote progress
- `/myevents` - List your events
- `/cancel <event_url>` - Cancel event (creator only)
- `/share <poll-id>` - Share poll to current channel
- `/reopen <poll-id>` - Reopen closed poll

## Quick Setup

```bash
# Deploy commands
npm run deploy-commands -w @seacalendar/discord-bot

# Run bot
npm run dev:bot
```

*Full setup: use Claude skill `setup-dev`*

## Project Structure

```
src/
├── bot.ts              # Main entry
├── commands/           # Slash commands
├── services/           # Business logic
│   ├── nlp.ts          # Natural language parsing
│   └── pollService.ts  # Poll/event management
└── test/               # Tests
```

## Testing

```bash
npm test -w @seacalendar/discord-bot
```
