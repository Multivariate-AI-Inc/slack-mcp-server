# Slack MCP Server Usage Guide

## Quick Start

1. **Build the server**:
   ```bash
   npm install && npm run build
   ```

2. **Add to your MCP client** (e.g., Claude Desktop config):
   ```json
   {
     "mcpServers": {
       "slack": {
         "command": "node",
         "args": ["/full/path/to/slack-mcp-server/dist/index.js"]
       }
     }
   }
   ```

3. **Get your Slack Bot Token**:
   - Go to https://api.slack.com/apps
   - Create a new app or use existing
   - Add required scopes (see README.md)
   - Install to workspace
   - Copy Bot User OAuth Token

## Common Use Cases

### 1. Reading Unread Messages

**Add your workspace first**:
```
Tool: add_workspace
Arguments: {
  "id": "my-work",
  "name": "My Work Slack",
  "token": "xoxb-your-bot-token-here",
  "teamId": "T1234567890"
}
```

**Get all unread conversations**:
```
Tool: get_unread_conversations
Arguments: {}
```

**Get unread from specific workspace**:
```
Tool: get_unread_conversations
Arguments: {
  "workspaceId": "my-work"
}
```

### 2. Sending Messages

**Send to a channel**:
```
Tool: send_message
Arguments: {
  "workspaceId": "my-work",
  "channelId": "C1234567890",
  "text": "Hello from Claude!"
}
```

**Reply to a thread**:
```
Tool: send_message
Arguments: {
  "workspaceId": "my-work",
  "channelId": "C1234567890",
  "text": "This is a thread reply",
  "threadTs": "1234567890.123456"
}
```

### 3. Managing Multiple Workspaces

**List all workspaces**:
```
Tool: list_workspaces
Arguments: {}
```

**Add multiple workspaces**:
```
Tool: add_workspace
Arguments: {
  "id": "personal",
  "name": "Personal Slack",
  "token": "xoxb-personal-token",
  "teamId": "T0987654321"
}
```

### 4. Channel and User Management

**Get all channels in workspace**:
```
Tool: get_channels
Arguments: {
  "workspaceId": "my-work"
}
```

**Get users in workspace**:
```
Tool: get_users
Arguments: {
  "workspaceId": "my-work"
}
```

**Get specific user info**:
```
Tool: get_user_info
Arguments: {
  "workspaceId": "my-work",
  "userId": "U1234567890"
}
```

## Workflow Examples

### Daily Standup Assistant

1. Get unread conversations from work Slack
2. Summarize important messages
3. Send standup updates to team channel

### Customer Support Monitor

1. Monitor specific support channels
2. Get unread customer messages
3. Draft helpful responses
4. Send replies when approved

### Multi-Team Coordinator

1. Connect to multiple workspace
2. Monitor project channels across teams
3. Coordinate updates between workspaces
4. Send status updates to relevant channels

## Finding Channel and User IDs

### Channel IDs
- Right-click on channel name → Copy link
- Channel ID is at the end: `/archives/C1234567890`
- Or use `get_channels` tool to list all with IDs

### User IDs
- Use `get_users` tool to see all users with IDs
- Or mention user in message and inspect message payload

### Team IDs
- Workspace Settings → Menu → About this workspace
- Or use any Slack API call to get team info

## Troubleshooting

### Common Issues

1. **"Failed to connect"**
   - Check bot token is correct
   - Verify bot is installed in workspace
   - Ensure required scopes are added

2. **"Channel not found"**
   - Bot needs to be invited to private channels
   - Check channel ID is correct
   - Verify bot has access permissions

3. **"Rate limited"**
   - Slack limits API calls
   - Wait a moment before retrying
   - Consider batching operations

### Debug Mode

Set environment variable for more logging:
```bash
DEBUG=slack-mcp node dist/index.js
```

## Security Best Practices

- Store bot tokens securely
- Use least-privilege scopes
- Regularly rotate tokens
- Monitor API usage
- Don't log sensitive messages

## Advanced Configuration

### Custom Config Location

Set environment variable:
```bash
SLACK_MCP_CONFIG=/custom/path/config.json
```

### Rate Limiting

The server handles basic rate limiting, but for high-volume usage:
- Implement exponential backoff
- Use batch operations when possible  
- Monitor Slack's rate limit headers