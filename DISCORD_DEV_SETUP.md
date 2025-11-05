# Discord Development Bot Setup Guide

This guide walks you through setting up a separate Discord bot for local development.

## Why a Separate Dev Bot?

**Always create a separate dev bot** instead of using your production bot:

1. **Safety**: Dev bot can break/crash without affecting production users
2. **Different tokens**: Keeps dev credentials separate from production
3. **Testing**: Test new commands and features safely
4. **Different servers**: Use a test Discord server for experimentation
5. **Rate limits**: Separate API rate limits from production

---

## Step 1: Create Your Dev Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Name it something like **"SeaCalendar Dev"** or **"SeaCalendar Test"**
4. Click **"Create"**

---

## Step 2: Get Your Bot Credentials

### Bot Token

1. Go to the **"Bot"** section in the left sidebar
2. Click **"Add Bot"** (if not already created)
3. Click **"Reset Token"** and confirm
4. **Copy the token** → Save this for `DISCORD_TOKEN` in `.env.development`
   - ⚠️ Never share this token or commit it to git!

### Client ID & Client Secret

1. Go to **"OAuth2"** → **"General"** in the left sidebar
2. **Copy "Client ID"** → Save this for `DISCORD_CLIENT_ID` in `.env.development`
3. Click **"Reset Secret"** under "Client Secret"
4. **Copy "Client Secret"** → Save this for `DISCORD_CLIENT_SECRET` in `.env.development`
   - ⚠️ Never share this secret or commit it to git!

---

## Step 3: Configure OAuth2 Redirect URI

1. Still in **OAuth2** → **"General"**
2. Under **"Redirects"**, click **"Add Redirect"**
3. Add this URL:
   ```
   http://localhost:3001/api/auth/discord/callback
   ```
4. Click **"Save Changes"**

---

## Step 4: Invite Bot to Your Test Server

### Option A: Use URL Generator (Recommended)

1. Go to **OAuth2** → **"URL Generator"**
2. Select these **Scopes**:
   - ✅ `bot`
   - ✅ `applications.commands`

3. Select these **Bot Permissions**:
   - ✅ Send Messages
   - ✅ Manage Messages
   - ✅ Read Message History
   - ✅ Embed Links
   - ✅ Add Reactions

4. Copy the **Generated URL** at the bottom
5. Open the URL in your browser
6. Select your test Discord server
7. Click **"Authorize"**

### Option B: Use Direct URL

Replace `YOUR_CLIENT_ID` with your actual Client ID:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=92224&scope=bot%20applications.commands
```

**Permission Integer Breakdown:**
- `92224` = Send Messages (2048) + Manage Messages (8192) + Read Message History (65536) + Embed Links (16384) + Add Reactions (64)

---

## Step 5: Get Your Guild ID (Server ID)

1. Open Discord and go to **User Settings** → **Advanced**
2. Enable **"Developer Mode"**
3. Right-click on your test server icon (left sidebar)
4. Click **"Copy Server ID"**
5. Save this for `DISCORD_GUILD_ID` in `.env.development`

---

## Step 6: Configure Environment Variables

1. Open `.env.development` in the project root
2. Fill in these values with your copied credentials:

```bash
# Discord Bot (TEST BOT - create a separate test bot!)
DISCORD_TOKEN="paste_your_bot_token_here"
DISCORD_CLIENT_ID="paste_your_client_id_here"
DISCORD_CLIENT_SECRET="paste_your_client_secret_here"
DISCORD_GUILD_ID="paste_your_server_id_here"
```

3. **Verify other values are correct:**

```bash
# Database
DATABASE_URL="postgresql://dev:dev@localhost:5432/seacalendar_dev"

# API Server
API_PORT=3001
JWT_SECRET="dev-secret-change-in-production"
WEB_APP_URL="http://localhost:5173"
NODE_ENV="development"

# OAuth2 Redirect
DISCORD_REDIRECT_URI="http://localhost:3001/api/auth/discord/callback"

# Web App (Vite)
VITE_API_URL="http://localhost:3001"
VITE_WS_URL="ws://localhost:3001"
```

---

## Step 7: Start Development Server

1. Make sure Docker is running
2. Start the database:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

3. Generate Prisma client:
   ```bash
   npx prisma generate --schema=packages/database/prisma/schema.prisma
   ```

4. Build shared packages:
   ```bash
   npm run build -w @seacalendar/database
   npm run build -w @seacalendar/shared
   ```

5. Start all dev services:
   ```bash
   npm run dev
   ```

---

## What the Bot Can Do

Your SeaCalendar Discord bot provides these slash commands:

- `/event` - Create events with date options
- `/status` - Check vote status for an event
- `/myevents` - List your events
- `/cancel` - Cancel an event
- `/share` - Share event in a channel
- `/reopen` - Reopen a closed event

---

## OAuth2 Scopes Explained

### For Bot Functionality
- **`bot`** - Required for bot to join servers
- **`applications.commands`** - Required for slash commands

### For User Login (Web App)
- **`identify`** - Get basic user info (username, avatar, etc.)
- **`email`** - Get user's email address

These scopes are automatically requested by the API when users log in via Discord on the web app.

---

## Gateway Intents Used

The bot uses these Gateway Intents (configured in code):

- `Guilds` - Access to guild/server information
- `GuildMessages` - Read messages in guilds
- `GuildMessageReactions` - React to messages and detect reactions
- `DirectMessages` - Send/receive direct messages

---

## Troubleshooting

### Bot won't start - "Invalid environment variables"
- Make sure all required variables are set in `.env.development`
- Check for typos in variable names
- Ensure no extra spaces around the `=` sign

### Bot doesn't respond to commands
- Make sure the bot is online in your Discord server
- Check that `applications.commands` scope was granted when inviting
- Try re-inviting the bot with the correct scopes

### "Prisma Client not initialized"
- Run: `npx prisma generate --schema=packages/database/prisma/schema.prisma`
- Restart the dev server

### Docker connection errors
- Make sure Docker Desktop is running
- Run: `docker compose -f docker-compose.dev.yml up -d`

---

## Security Notes

⚠️ **NEVER commit these to git:**
- Bot Token (`DISCORD_TOKEN`)
- Client Secret (`DISCORD_CLIENT_SECRET`)
- JWT Secret (in production)

✅ **Safe to share:**
- Client ID (`DISCORD_CLIENT_ID`)
- Guild ID (`DISCORD_GUILD_ID`)

The `.env.development` file is already in `.gitignore` to prevent accidental commits.

---

## Production vs Development

| | Development | Production |
|---|---|---|
| **Bot** | Separate test bot | Production bot |
| **Server** | Test Discord server | Live Discord server |
| **Database** | Local PostgreSQL | Production database |
| **Domain** | localhost:3001 | your-domain.com |
| **Redirect URI** | http://localhost:3001/... | https://your-domain.com/... |

Make sure to use different bots and credentials for dev and prod!

---

## Next Steps

Once your dev environment is running:

1. Test slash commands in your Discord test server
2. Try creating events with `/event`
3. Check the web app at http://localhost:3000/
4. Monitor logs for any errors

For more information, see:
- [DEVELOPMENT.md](./DEVELOPMENT.md) - General development guide
- [ENV_FILE_GUIDE.md](./ENV_FILE_GUIDE.md) - Complete environment variable reference
