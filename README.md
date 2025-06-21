# Slack MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to interact with Slack workspaces. Connect to multiple workspaces, read unread messages, and send messages directly through your AI assistant.

## Quick Start

### Option 1: Install via npm (Recommended)

```bash
# Install globally
npm install -g @multivariate-ai-inc/slack-mcp-server

# Or install locally in your project
npm install @multivariate-ai-inc/slack-mcp-server
```

### Option 2: Install from Source

```bash
# Clone the repository
git clone https://github.com/Multivariate-AI-Inc/slack-mcp-server.git
cd slack-mcp-server

# Install dependencies and build
npm install
npm run build
```

### 2. Create Your Slack App

**This lets you send messages as yourself (not a bot).**

1. Go to [api.slack.com/apps](https://api.slack.com/apps) 
2. Click **"Create New App"** → **"From scratch"**
3. App Name: **"My Personal Assistant"**
4. Pick your Slack workspace → **"Create App"**

5. Click **"OAuth & Permissions"** (in the left sidebar)
6. Scroll to **"Redirect URLs"** → Click **"Add New Redirect URL"**
7. Type: `https://localhost:3001/oauth/callback` → **"Add"** → **"Save URLs"**

8. Scroll to **"User Token Scopes"** (NOT "Bot Token Scopes")
9. Click **"Add an OAuth Scope"** and add these **9 permissions**:
   - `channels:history` - Read channel messages
   - `channels:read` - See channel list
   - `groups:history` - Read private group messages  
   - `groups:read` - See private groups
   - `im:history` - Read direct messages
   - `im:read` - See direct message list
   - `chat:write` - Send messages as you
   - `users:read` - See user info
   - `team:read` - See workspace info

10. **Important**: Don't add anything to "Bot Token Scopes" - leave it empty!

11. Click **"Basic Information"** (in left sidebar)
12. Copy your **"Client ID"** (save it somewhere safe)
13. Click **"Show"** next to **"Client Secret"** → Copy it (save it somewhere safe)

### 3. Create Security Certificates

Open Terminal and run:
```bash
cd slack-mcp-server
./generate-certs.sh
```

This creates secure certificates needed for authentication.

### 4. Set Up Your App Configuration

Create a folder and file to store your app info:

**On Mac/Linux:**
```bash
mkdir -p ~/.slack-mcp
```

**On Windows:**
```bash
mkdir %USERPROFILE%\.slack-mcp
```

Create a file called `oauth-config.json` in that folder with your app details:

```json
{
  "apps": {
    "my-workspace": {
      "clientId": "paste-your-client-id-here",
      "clientSecret": "paste-your-client-secret-here"
    }
  }
}
```

Replace the text with your actual Client ID and Client Secret from step 2.

### 5. Connect to Claude Desktop

Find your Claude Desktop configuration file:
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Open it and add this configuration:

#### If you installed via npm globally:
```json
{
  "mcpServers": {
    "slack": {
      "command": "slack-mcp-server"
    }
  }
}
```

#### If you installed locally or from source:
```json
{
  "mcpServers": {
    "slack": {
      "command": "node",
      "args": ["/path/to/slack-mcp-server/dist/index.js"]
    }
  }
}
```

**Example source path**: `/Users/john/Downloads/slack-mcp-server/dist/index.js`

### 6. Restart Claude & Connect Your Slack

1. **Quit Claude Desktop completely** and reopen it
2. In Claude, type: **"Please authenticate my Slack workspace"**
3. Claude will ask for your workspace details - provide:
   - **Workspace ID**: `my-workspace` 
   - **Workspace Name**: `My Company Slack` (or whatever you want to call it)

Claude will open your browser for you to approve the connection.

**Done!** You can now use Slack through your AI assistant with messages appearing as yourself.

## Available Tools

| Tool | Description |
|------|-------------|
| `authenticate_user` | Authenticate workspace as user (messages appear as you) |
| `list_workspaces` | Show all connected workspaces |
| `get_unread_conversations` | Get all unread messages |
| `get_channels` | List channels, DMs, and groups |
| `get_messages` | Get recent messages from a channel |
| `send_message` | Send a message to any channel/DM |
| `get_users` | List workspace users |
| `get_user_info` | Get detailed user information |

## Multiple Workspaces

Configure multiple workspaces in your `oauth-config.json`:

```json
{
  "apps": {
    "company-1": {
      "clientId": "client-id-1",
      "clientSecret": "client-secret-1"
    },
    "company-2": {
      "clientId": "client-id-2", 
      "clientSecret": "client-secret-2"
    }
  }
}
```

Then authenticate each workspace:

```
authenticate_user:
- workspaceId: company-1
- workspaceName: Company One

authenticate_user:
- workspaceId: company-2
- workspaceName: Company Two
```

## Troubleshooting

**"This app is requesting permission to install a bot"**
- Your app has bot scopes configured - remove ALL bot token scopes
- Make sure "Bot Token Scopes" section is completely empty
- Only "User Token Scopes" should have permissions

**"Permission denied" errors**
- Verify your app has the required user scopes listed above
- Some workspaces require admin approval for user apps
- Check that you have access to the channels you're trying to read

**"Channel not found" errors**
- Use `get_channels` to see available channels and their IDs
- Make sure you're a member of the channel

**"invalid_scope" errors**
- Check that scopes are in "User Token Scopes" (not Bot Token Scopes)
- Verify all required user scopes are added with correct spelling

**Setup questions**
- OAuth configuration is stored in `~/.slack-mcp/oauth-config.json`
- User authentication tokens are stored in `~/.slack-mcp/config.json`
- Check [TESTING-GUIDE.md](TESTING-GUIDE.md) for testing instructions

## Additional Guides

- [TESTING-GUIDE.md](TESTING-GUIDE.md) - Test your setup
- [USAGE.md](USAGE.md) - Examples of what to say to Claude

## License

MIT License - see [LICENSE](LICENSE) file for details.