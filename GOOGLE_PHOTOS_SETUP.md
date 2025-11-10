# Google Photos Integration Setup

SeaCalendar can automatically create shared Google Photos albums for events, making it easy for attendees to upload and share photos.

## Features

- **Auto-create albums** when events are finalized
- **Shared albums** with collaboration enabled (everyone can add photos)
- **Comments enabled** for each photo
- **Automatic links** in post-event followup messages
- `/album view` - Get album link for any event
- `/album create` - Manually create album for an event

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "SeaCalendar Photos")
3. Enable the **Google Photos Library API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Photos Library API"
   - Click "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Name: `seacalendar-bot`
4. Grant role: **None needed** (we'll use OAuth)
5. Click "Done"

### 3. Set Up OAuth 2.0

**Important:** Google Photos API requires OAuth, not service account auth.

#### Option A: Bot Account (Recommended)

1. Create a dedicated Google account for your bot (e.g., `seacalendar.bot@gmail.com`)
2. In Google Cloud Console:
   - Go to "APIs & Services" > "Credentials"
   - Create "OAuth 2.0 Client ID"
   - Application type: **Desktop app**
   - Name: "SeaCalendar Bot"
   - Download JSON credentials

3. Generate refresh token:

```bash
cd packages/discord-bot
npm install googleapis

# Create auth script
cat > scripts/get-refresh-token.js << 'EOF'
const { google } = require('googleapis');
const readline = require('readline');

const credentials = require('./oauth-credentials.json');
const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const scopes = [
  'https://www.googleapis.com/auth/photoslibrary',
  'https://www.googleapis.com/auth/photoslibrary.sharing'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Authorize this app by visiting:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    console.log('Your refresh token:', token.refresh_token);
  });
});
EOF

node scripts/get-refresh-token.js
```

4. Follow the URL, authorize, paste the code
5. Save the **refresh token** output

#### Option B: User Account OAuth Flow (Advanced)

Implement full OAuth flow where each user authorizes their own Google Photos. More complex but gives each user their own albums.

### 4. Configure Environment Variables

Add to your `.env.development` and `.env.production`:

```bash
# Google Photos API
GOOGLE_PHOTOS_ENABLED=true
GOOGLE_PHOTOS_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_PHOTOS_CLIENT_SECRET="your-client-secret"
GOOGLE_PHOTOS_REFRESH_TOKEN="your-refresh-token"

# OR use service account (if you find a way to make it work with Photos API)
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### 5. Update Config

Edit `packages/discord-bot/src/config.ts`:

```typescript
export const Config = {
  // ... existing config
  googlePhotos: {
    enabled: process.env.GOOGLE_PHOTOS_ENABLED === 'true',
    clientId: process.env.GOOGLE_PHOTOS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_PHOTOS_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_PHOTOS_REFRESH_TOKEN,
  },
};
```

Update `packages/discord-bot/src/services/googlePhotosService.ts` to use OAuth credentials:

```typescript
function getPhotosClient(): photoslibrary_v1.Photoslibrary {
  if (photosClient) return photosClient;

  const oauth2Client = new google.auth.OAuth2(
    Config.googlePhotos.clientId,
    Config.googlePhotos.clientSecret,
    'urn:ietf:wg:oauth:2.0:oob'
  );

  oauth2Client.setCredentials({
    refresh_token: Config.googlePhotos.refreshToken,
  });

  photosClient = google.photoslibrary({
    version: 'v1',
    auth: oauth2Client,
  });

  return photosClient;
}
```

### 6. Test

```bash
# Start bot
npm run dev:bot

# In Discord:
/album create https://cal.billyeatstofu.com/events/abc123

# Should create album and return link
```

## Usage

### Automatic Album Creation

When an event is finalized, SeaCalendar will:
1. Automatically create a Google Photos album
2. Schedule a followup message 24hr after the event
3. Include the album link in the followup

### Manual Commands

**View album for an event:**
```
/album view https://cal.billyeatstofu.com/events/abc123
```

**Create album (if doesn't exist):**
```
/album create https://cal.billyeatstofu.com/events/abc123
```

## Troubleshooting

**"Google Photos API not configured"**
- Check `GOOGLE_PHOTOS_ENABLED=true` is set
- Verify credentials are correctly loaded
- Check bot logs for auth errors

**"Failed to create album"**
- Ensure OAuth scopes include `photoslibrary` and `photoslibrary.sharing`
- Verify refresh token is valid
- Check Google Cloud Console quotas

**Albums created but can't add photos**
- Verify `isCollaborative: true` is set in album creation
- Check album share settings in Google Photos

## Limitations

- Google Photos API has quota limits (10,000 requests/day)
- Albums are created in the bot account's Google Photos
- Users must have Google accounts to access albums
- No way to auto-add photos from Discord attachments (Google Photos API limitation)

## Alternative: Manual Album Links

If Google Photos API is too complex, you can:
1. Manually create albums in Google Photos
2. Get shareable link
3. Use `/memory add --type PHOTO --content <album-link>` to attach to event

## Future Enhancements

- Auto-fetch photo count from albums
- Display album thumbnails in Discord embeds
- Remind users to upload photos after events
- Support other photo services (Flickr, iCloud - if APIs available)
