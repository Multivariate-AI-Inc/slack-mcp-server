# User Authentication Guide - Send Messages as Yourself

This guide explains how to authenticate as yourself (user) instead of a bot, allowing you to send messages that appear to come from your actual Slack account.

## Why User Authentication?

**Bot Authentication:**
- Messages appear as "Claude Bot" or similar
- Limited to channels where bot is invited
- Obvious it's automated

**User Authentication:**
- Messages appear to come from YOU
- Access to all channels/DMs you can access
- Appears as if you typed the message yourself

## Setting Up User Authentication

### Step 1: Create a Slack App

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Enter app name (e.g., "Personal MCP Client")
4. Select your workspace
5. Click "Create App"

### Step 2: Configure OAuth & Permissions

1. In your app settings, go to "OAuth & Permissions"
2. Under "Redirect URLs", add: `http://localhost:3001/oauth/callback`
3. Under "User Token Scopes" (NOT Bot Token Scopes), add:
   - `channels:history` - Read messages in public channels
   - `channels:read` - List public channels
   - `groups:history` - Read messages in private groups
   - `groups:read` - List private groups  
   - `im:history` - Read messages in DMs
   - `im:read` - List DMs
   - `chat:write` - **Send messages as YOU**
   - `users:read` - Read user information

### Step 3: Get App Credentials

1. In your app settings, go to "Basic Information"
2. Copy the **Client ID** and **Client Secret**
3. Keep these secure - they're like passwords

### Step 4: Authenticate via MCP

Use the `authenticate_user` tool:

```json
{
  "workspaceId": "my-personal",
  "workspaceName": "My Personal Workspace", 
  "clientId": "your-client-id-here",
  "clientSecret": "your-client-secret-here"
}
```

This will:
1. Start a local web server
2. Print an authorization URL
3. Open your browser (or you manually visit the URL)
4. You'll authorize the app to act as you
5. Tokens are securely saved for future use

## Using User Authentication

### Send Messages as Yourself

```json
{
  "tool": "send_message",
  "args": {
    "workspaceId": "my-personal",
    "channelId": "C1234567890",
    "text": "This message appears to come from me!"
  }
}
```

The message will appear in Slack as if you typed it yourself - no "APP" or "BOT" label.

### Reading Your Conversations

```json
{
  "tool": "get_unread_conversations",
  "args": {
    "workspaceId": "my-personal"
  }
}
```

You'll see ALL conversations you have access to, including:
- Private channels you're in
- All your DMs
- Group messages
- Any channel you can normally access

## Comparison: Bot vs User

| Feature | Bot Token | User Token |
|---------|-----------|------------|
| **Message Appearance** | "Claude Bot" | Your actual name |
| **Channel Access** | Only where invited | All channels you can access |
| **DM Access** | Limited | All your DMs |
| **Rate Limits** | App-level limits | User-level limits (higher) |
| **Setup Complexity** | Simple | OAuth flow required |
| **Security** | Lower risk | Higher risk (acts as you) |

## Security Considerations

### User Tokens Are Powerful
- They can send messages AS YOU
- They can read EVERYTHING you can read
- Store them securely
- Never share them

### Best Practices
1. **Use dedicated Slack app** - Don't reuse apps for multiple purposes
2. **Minimal scopes** - Only request permissions you need
3. **Secure storage** - Tokens stored in `~/.slack-mcp/user-tokens.json`
4. **Regular rotation** - Refresh tokens periodically
5. **Monitor usage** - Check Slack's audit logs

### Token Storage
Tokens are stored in: `~/.slack-mcp/user-tokens.json`

```json
{
  "my-workspace": {
    "accessToken": "xoxp-...",
    "refreshToken": "xoxe-...",
    "userId": "U1234567890",
    "teamId": "T1234567890"
  }
}
```

## Troubleshooting

### Common Issues

**"Invalid redirect_uri"**
- Make sure you added `http://localhost:3001/oauth/callback` to your app's redirect URLs
- Check for typos in the URL

**"Missing scopes"**
- Verify you added scopes to "User Token Scopes" (not Bot Token Scopes)
- Make sure you have `chat:write` for sending messages

**"Access denied"**
- You may have clicked "Deny" during OAuth
- Try the authentication flow again

**"Token expired"**
- User tokens can expire
- Re-run the authentication flow to get fresh tokens

### Manual Token Setup

If OAuth flow doesn't work, you can manually add a user token:

1. Go to your app's "OAuth & Permissions"
2. Install to workspace (if not already)
3. Copy the "User OAuth Token" (starts with `xoxp-`)
4. Use `add_workspace` tool with `tokenType: "user"`

## Advanced Usage

### Multiple User Accounts

You can authenticate as different users for the same workspace:

```json
{
  "workspaceId": "work-as-manager",
  "workspaceName": "Work (Manager Account)",
  "clientId": "same-client-id",
  "clientSecret": "same-client-secret"
}
```

### Custom Scopes

Request additional permissions:

```json
{
  "workspaceId": "my-workspace",
  "workspaceName": "My Workspace",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret", 
  "scopes": [
    "channels:history",
    "chat:write",
    "users:read",
    "files:read",
    "reactions:write"
  ]
}
```

### Workspace Admin Features

With admin permissions, you can:
- Access all channels (even private ones)
- Manage workspace settings
- Read all user messages

*Note: Requires workspace admin approval and additional scopes*

## FAQ

**Q: Will people know it's automated?**
A: No, messages appear exactly as if you typed them manually.

**Q: Can I use this for multiple workspaces?**
A: Yes, authenticate separately for each workspace.

**Q: What if my token expires?**
A: Re-run the authentication flow to get a fresh token.

**Q: Is this against Slack's terms?**
A: It's allowed for personal automation, but check your organization's policies.

**Q: Can I revoke access?**
A: Yes, go to Slack Settings → Apps → Your App → Remove

**Q: Does this work with Slack Enterprise Grid?**
A: Yes, but you may need admin approval for certain scopes.

## Example Workflows

### Personal Assistant
1. Authenticate as yourself
2. Read unread messages from important channels
3. Draft replies using AI
4. Send responses as yourself

### Status Updates
1. Get project updates from various channels
2. Summarize progress
3. Post standup updates to team channels
4. Appears as your personal update

### Meeting Coordination
1. Read messages about meeting conflicts
2. Check calendars and suggest alternatives
3. Send rescheduling messages as yourself
4. Natural conversation flow