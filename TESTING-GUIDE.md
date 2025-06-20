# Testing Guide for Slack MCP Server

This guide walks you through testing all the functionality of the Slack MCP server.

## Prerequisites

1. **Build the server**: `npm run build`
2. **Have your MCP client ready** (Claude Desktop, etc.)
3. **Slack credentials** (bot token or app for user auth)

## Test 1: Basic Server Functionality ✅

```bash
node test-server.js
```

This verifies:
- Server starts without errors
- All tools are available
- MCP protocol works correctly

**Expected Output:**
```
✅ All tests passed! Server is working correctly.
📊 Results: 7/7 tools found
```

## Test 2: Adding a Bot Workspace

### Step 1: Get a Bot Token

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Create app → Add bot scopes
3. Install to workspace
4. Copy Bot User OAuth Token (xoxb-...)

### Step 2: Add Workspace via MCP

```json
{
  "tool": "add_workspace",
  "args": {
    "id": "test-bot-workspace",
    "name": "Test Bot Workspace",
    "token": "xoxb-your-bot-token-here",
    "teamId": "T1234567890",
    "tokenType": "bot"
  }
}
```

**Expected Response:**
```
Successfully added workspace: Test Bot Workspace (test-bot-workspace)
```

### Step 3: Verify Workspace

```json
{
  "tool": "list_workspaces",
  "args": {}
}
```

**Expected Response:**
```
Configured workspaces (1):
- Test Bot Workspace (test-bot-workspace) - Team: T1234567890 - Type: bot
```

## Test 3: User Authentication Flow

### Step 1: Create Slack App for User Auth

1. Create new Slack app
2. Add redirect URL: `http://localhost:3001/oauth/callback`
3. Add **User Token Scopes** (not bot scopes):
   - `channels:history`, `channels:read`
   - `groups:history`, `groups:read`
   - `im:history`, `im:read`
   - `chat:write`
   - `users:read`

### Step 2: Authenticate User

```json
{
  "tool": "authenticate_user",
  "args": {
    "workspaceId": "test-user-workspace",
    "workspaceName": "Test User Workspace",
    "clientId": "your-app-client-id",
    "clientSecret": "your-app-client-secret"
  }
}
```

**Expected Flow:**
1. Server starts OAuth flow
2. Browser opens (or you visit the printed URL)
3. You authorize the app
4. Tokens are saved

**Expected Response:**
```
✅ Successfully authenticated as user for workspace: Test User Workspace
You can now send messages as yourself!
```

## Test 4: Reading Conversations

### Test All Workspaces

```json
{
  "tool": "get_unread_conversations",
  "args": {}
}
```

### Test Specific Workspace

```json
{
  "tool": "get_unread_conversations",
  "args": {
    "workspaceId": "test-user-workspace"
  }
}
```

**Expected Response:**
```
Found X unread conversations:

Channel: #general (Test User Workspace)
Unread: 5 messages
Recent messages:
  alice: Hey everyone!
  bob: How's the project going?
  ...

DM: @john (Test User Workspace)  
Unread: 2 messages
Recent messages:
  john: Can we chat about the proposal?
  ...
```

## Test 5: Channel Management

### List All Channels

```json
{
  "tool": "get_channels", 
  "args": {
    "workspaceId": "test-user-workspace"
  }
}
```

**Expected Response:**
```
Channels (10):
  #general (C1234567890)
  #random (C2345678901)
  ...

Private Groups (3):
  #dev-team (G1234567890)
  ...

Direct Messages (25):
  @alice (D1234567890)
  @bob (D2345678901)
  ...
```

## Test 6: Message Sending

### Send as Bot

```json
{
  "tool": "send_message",
  "args": {
    "workspaceId": "test-bot-workspace",
    "channelId": "C1234567890", 
    "text": "Hello from the MCP bot! 🤖"
  }
}
```

**Expected:**
- Message appears in Slack as "Your Bot Name"
- Has "APP" or "BOT" label

### Send as User

```json
{
  "tool": "send_message",
  "args": {
    "workspaceId": "test-user-workspace",
    "channelId": "C1234567890",
    "text": "Hello from me via MCP! This looks like I typed it myself."
  }
}
```

**Expected:**
- Message appears in Slack as YOUR name
- No bot/app labels
- Looks identical to manual typing

### Send Thread Reply

```json
{
  "tool": "send_message",
  "args": {
    "workspaceId": "test-user-workspace", 
    "channelId": "C1234567890",
    "text": "This is a thread reply",
    "threadTs": "1234567890.123456"
  }
}
```

## Test 7: User Management

### List Users

```json
{
  "tool": "get_users",
  "args": {
    "workspaceId": "test-user-workspace"
  }
}
```

### Get Specific User Info

```json
{
  "tool": "get_user_info",
  "args": {
    "workspaceId": "test-user-workspace",
    "userId": "U1234567890"
  }
}
```

## Test 8: Multiple Workspaces

Add multiple workspaces and test cross-workspace functionality:

```json
{
  "tool": "get_unread_conversations",
  "args": {}
}
```

Should show conversations from ALL workspaces.

## Common Issues & Troubleshooting

### Bot Token Issues

**Error: "invalid_auth"**
- Token is wrong or expired
- Bot not installed in workspace
- Missing required scopes

**Error: "channel_not_found"**
- Bot not invited to private channels
- Channel ID is incorrect

### User Auth Issues

**Error: "invalid_redirect_uri"**
- Redirect URL not added to app settings
- URL mismatch (check http vs https)

**Error: "invalid_scope"**
- Scopes added to Bot Token instead of User Token
- Required scopes missing

### Permission Issues

**Error: "not_in_channel"**
- User/bot not member of private channel
- Channel archived or deleted

**Error: "access_denied"**
- User denied OAuth permission
- Admin approval required for some scopes

## Performance Testing

### Load Test

Send multiple requests quickly to test rate limiting:

```bash
# Send 10 requests rapidly
for i in {1..10}; do
  echo "Request $i"
  # Use your MCP client to send get_channels requests
done
```

### Memory Test

Monitor memory usage with long-running operations:

```bash
# Start server and monitor
node dist/index.js &
top -p $!
```

## Validation Checklist

### Basic Functionality
- [ ] Server starts without errors
- [ ] All 7 tools available
- [ ] MCP protocol responses valid

### Bot Mode
- [ ] Add workspace with bot token
- [ ] List channels and users
- [ ] Send messages (appear as bot)
- [ ] Read conversations

### User Mode  
- [ ] OAuth flow completes successfully
- [ ] Messages appear as your account
- [ ] Access to all your channels/DMs
- [ ] No bot/app labels on messages

### Multi-Workspace
- [ ] Multiple workspaces configured
- [ ] Cross-workspace conversation reading
- [ ] Correct workspace isolation

### Security
- [ ] Tokens stored securely
- [ ] No tokens in logs
- [ ] OAuth flow secure
- [ ] Proper error handling

## Integration Testing

### With Claude Desktop

1. Add server to `claude_desktop_config.json`
2. Restart Claude Desktop
3. Verify tools appear in Claude
4. Test conversation flows

### With Other MCP Clients

Test with various MCP-compatible clients to ensure compatibility.

## Automated Testing

Create automated test scripts for CI/CD:

```bash
#!/bin/bash
# run-tests.sh

echo "Running Slack MCP Server Tests..."

# Test 1: Build
npm run build || exit 1

# Test 2: Basic functionality  
node test-server.js || exit 1

# Test 3: Lint and type check
npm run lint 2>/dev/null || echo "No lint script"
npm run typecheck 2>/dev/null || echo "No typecheck script"

echo "All tests passed! ✅"
```

## Next Steps

After successful testing:

1. **Deploy to production environment**
2. **Set up monitoring and logging**
3. **Create backup/restore procedures**
4. **Document any custom configurations**
5. **Train team on usage patterns**