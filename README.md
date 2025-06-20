# Slack MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to interact with Slack workspaces. Connect to multiple workspaces, read unread messages, and send messages directly through your AI assistant.

## Quick Start

### 1. Install & Build

```bash
# Clone the repository
git clone https://github.com/Multivariate-AI-Inc/slack-mcp-server.git
cd slack-mcp-server

# Install dependencies and build
npm install
npm run build
```

### 2. Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Name your app and select your workspace
3. Go to **OAuth & Permissions** → **Scopes** → **Bot Token Scopes**
4. Add these permissions:
   ```
   channels:history    channels:read    groups:history    groups:read
   im:history         im:read          chat:write        users:read
   team:read
   ```
5. Click **Install to Workspace** → **Allow**
6. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### 3. Configure MCP Client

Add to your MCP client config (e.g., Claude Desktop at `~/Library/Application Support/Claude/claude_desktop_config.json`):

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

**Replace `/path/to/slack-mcp-server` with your actual path**

### 4. Add Your Slack Workspace

In your AI assistant, use the MCP tool:

```
Tool: add_workspace
- id: my-workspace
- name: My Company Slack  
- token: xoxb-your-bot-token-here
- teamId: your-team-id
```

**Done!** You can now use Slack through your AI assistant.

## Available Tools

| Tool | Description |
|------|-------------|
| `add_workspace` | Connect a new Slack workspace |
| `list_workspaces` | Show all connected workspaces |
| `get_unread_conversations` | Get all unread messages |
| `get_channels` | List channels, DMs, and groups |
| `get_messages` | Get recent messages from a channel |
| `send_message` | Send a message to any channel/DM |
| `get_users` | List workspace users |
| `get_user_info` | Get detailed user information |

## Advanced Setup

### Send Messages as Yourself (Not Bot)

For messages that appear to come from you instead of a bot, see [USER-AUTH-GUIDE.md](USER-AUTH-GUIDE.md) for user authentication setup.

### Multiple Workspaces

Add additional workspaces by calling `add_workspace` with different IDs:

```
add_workspace:
- id: company-1
- name: Company One
- token: xoxb-token-1

add_workspace:
- id: company-2  
- name: Company Two
- token: xoxb-token-2
```

## Troubleshooting

**"Permission denied" errors**
- Verify your bot has the required scopes listed above
- Reinstall your Slack app if you added scopes after installation
- Invite your bot to private channels you want to access

**"Channel not found" errors**
- Use `get_channels` to see available channels and their IDs
- Make sure your bot is a member of the channel

**Setup questions**
- Configuration is stored in `~/.slack-mcp/config.json`
- Check [TESTING-GUIDE.md](TESTING-GUIDE.md) for testing instructions
- See other documentation files for specific setup scenarios

## Documentation

- [USER-AUTH-GUIDE.md](USER-AUTH-GUIDE.md) - Send messages as yourself
- [TESTING-GUIDE.md](TESTING-GUIDE.md) - Test your setup
- [USAGE.md](USAGE.md) - Detailed usage examples
- [SECURE-SETUP.md](SECURE-SETUP.md) - Security best practices

## License

MIT License - see [LICENSE](LICENSE) file for details.