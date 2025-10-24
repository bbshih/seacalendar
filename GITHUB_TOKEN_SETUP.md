# GitHub Token Setup for SeaCalendar

SeaCalendar uses GitHub Gists to store event data securely. You'll need a GitHub Personal Access Token to create and manage events.

## Option 1: Use .env File (Recommended for Development)

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Get your GitHub token:
   - Go to https://github.com/settings/tokens/new
   - **Note**: "SeaCalendar App"
   - **Expiration**: Choose your preferred duration (90 days recommended)
   - **Scopes**: Check only `gist`
   - Click "Generate token"
   - Copy the token (starts with `ghp_`)

3. Add your token to `.env`:
   ```
   VITE_GITHUB_TOKEN=ghp_your_token_here
   ```

4. Restart your dev server:
   ```bash
   npm run dev
   ```

The app will automatically use this token and you won't need to enter it again!

## Option 2: Enter Token in UI

1. Open the app and go to "Create Event"
2. Click "How do I get a token?" for instructions
3. Enter your token in the field
4. Click "Save Token"

Your token will be saved in your browser's localStorage and persist across sessions.

## Security Notes

- Your token is **only stored locally** (in `.env` file or browser localStorage)
- It's **never sent to any third-party servers**
- It's only used to communicate with GitHub's API
- The `.env` file is in `.gitignore` so it won't be committed to git
- You can disconnect/delete your token anytime from the UI

## Token Permissions

The token only needs the `gist` scope, which allows:
- ✅ Create private gists
- ✅ Read your gists
- ✅ Update your gists
- ✅ Delete your gists

It does **NOT** have access to:
- ❌ Your repositories
- ❌ Your profile
- ❌ Any other GitHub data

## Troubleshooting

**Token not working?**
- Make sure you selected the `gist` scope when creating it
- Check that the token hasn't expired
- Try creating a new token

**Want to use a different token?**
- Delete the `.env` file or clear the `VITE_GITHUB_TOKEN` variable
- Clear localStorage in your browser
- Enter the new token in the UI
