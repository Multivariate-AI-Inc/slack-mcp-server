# Slack MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to interact with Slack workspaces. This server allows you to read unread conversations, send messages, and manage multiple Slack workspaces.

## Features

- **Multi-workspace support**: Connect to multiple Slack workspaces simultaneously
- **Read unread conversations**: Get unread messages from DMs, channels, and groups
- **Send messages as yourself**: Authenticate as a user to send messages that appear to come from you (not a bot!)
- **Bot mode**: Traditional bot functionality for automated messaging
- **Channel management**: List and browse all channels, groups, and DMs
- **User management**: Get user information and lists
- **Secure configuration**: Tokens are stored securely in your home directory

## Setup

### Prerequisites

- Node.js 18.0.0 or higher
- A Slack Bot Token for each workspace you want to connect

### Creating a Slack Bot Token

1. Go to [Slack API](https://api.slack.com/apps) and create a new app
2. Navigate to "OAuth & Permissions" in the sidebar
3. Add the following Bot Token Scopes:
   - `channels:history` - Read messages in public channels
   - `channels:read` - List public channels
   - `groups:history` - Read messages in private groups
   - `groups:read` - List private groups
   - `im:history` - Read messages in DMs
   - `im:read` - List DMs
   - `chat:write` - Send messages
   - `users:read` - Read user information
   - `team:read` - Read team information

4. Install the app to your workspace
5. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Add the server to your MCP client configuration (e.g., Claude Desktop):
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

## Usage

### Adding a Workspace

#### Option 1: User Authentication (Recommended - Send as Yourself)

Authenticate as a user to send messages that appear to come from you:

```
Use the authenticate_user tool with:
- workspaceId: A unique identifier (e.g., "my-company")
- workspaceName: Display name for the workspace
- clientId: Your Slack App Client ID
- clientSecret: Your Slack App Client Secret
```

See [USER-AUTH-GUIDE.md](USER-AUTH-GUIDE.md) for detailed setup instructions.

#### Option 2: Bot Token (Traditional)

Add a workspace with a bot token:

```
Use the add_workspace tool with:
- id: A unique identifier for your workspace (e.g., "my-company")
- name: Display name for the workspace
- token: Your Slack Bot Token (xoxb-...)
- teamId: Your Slack Team ID
- tokenType: "bot" (default)
```

### Reading Unread Conversations

```
Use get_unread_conversations to see all unread messages across:
- Direct messages (DMs)
- Public channels you're a member of
- Private groups you're a member of
```

### Sending Messages

```
Use send_message with:
- workspaceId: The workspace ID you configured
- channelId: The channel/DM ID to send to
- text: Your message content
- threadTs: (optional) Reply to a specific thread
```

### Other Features

- `list_workspaces`: See all configured workspaces
- `get_channels`: List all channels, groups, and DMs
- `get_messages`: Get recent messages from a specific channel
- `get_users`: List all users in a workspace
- `get_user_info`: Get detailed information about a user

## Configuration

Configuration is stored in `~/.slack-mcp/config.json`. You can manually edit this file if needed.

## Security

- Bot tokens are stored locally in your home directory
- The server only requests necessary permissions
- No data is sent to external servers (except Slack's API)

## Troubleshooting

### Connection Issues

1. Verify your bot token is correct and has the required scopes
2. Make sure your bot is installed in the workspace
3. Check that your bot has access to the channels you're trying to read

### Permission Errors

1. Review the required scopes in the setup section
2. Reinstall your Slack app with the correct permissions
3. Make sure your bot is invited to private channels/groups

### Rate Limiting

Slack has rate limits on API calls. The server handles basic rate limiting, but you may need to wait if you make too many requests quickly.

## Development

To develop this server:

1. Make changes to the TypeScript source files in `src/`
2. Run `npm run build` to compile
3. Test with your MCP client

## License

MIT License - see LICENSE file for details.