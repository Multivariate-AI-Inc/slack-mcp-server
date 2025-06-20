# Testing Your Slack Setup

This guide helps you verify everything is working correctly.

## Quick Test: Is It Working?

After completing the setup, try these simple tests in Claude:

### Test 1: Check Connection ✅

Say to Claude: *"List my Slack workspaces"*

**What you should see:**
- Claude shows your connected workspace
- Example: "Connected workspaces: My Company Slack (my-workspace)"

**If it doesn't work:**
- Restart Claude Desktop completely
- Check that you followed all setup steps
- Make sure the file paths are correct

### Test 2: Read Messages ✅

Say to Claude: *"Show me my unread Slack messages"*

**What you should see:**
- Claude shows unread messages from your channels and DMs
- Messages appear with channel names and sender names

**If it doesn't work:**
- Make sure you have unread messages in Slack
- Check that your Slack app has the right permissions

### Test 3: Send a Message ✅

Say to Claude: *"Send a test message to #general saying 'Hello from Claude!'"*

**What you should see:**
- Claude confirms the message was sent
- The message appears in your #general channel in Slack
- The message appears with YOUR name (not a bot name)

**If it doesn't work:**
- Make sure you have a #general channel
- Try a different channel you know exists
- Check that you gave the app permission to send messages

### Test 4: List Channels ✅

Say to Claude: *"List all my Slack channels"*

**What you should see:**
- Claude shows all your channels, private groups, and direct messages
- Each has a name and ID

**If it doesn't work:**
- Check that your app has permissions to read channels

## Advanced Testing (Optional)

### Test Multiple Workspaces
If you connected multiple Slack workspaces:

Say to Claude: *"Show unread messages from all my Slack workspaces"*

### Test Specific Features
- *"Show me users in my workspace"*
- *"Get recent messages from #dev-team"*
- *"Send a DM to John saying 'Testing!'"*

## Troubleshooting Common Problems

### Problem: "Claude doesn't recognize Slack commands"

**Solution:**
1. Restart Claude Desktop completely (Quit → Reopen)
2. Check your `claude_desktop_config.json` file path is correct
3. Make sure the path to `dist/index.js` is correct

### Problem: "This app is requesting permission to install a bot"

**Solution:**
- Your Slack app has bot permissions - remove them!
- Go to your app → OAuth & Permissions
- Delete everything under "Bot Token Scopes"
- Keep only "User Token Scopes"

### Problem: "Permission denied" when reading messages

**Solutions:**
- Check you added all 9 required permissions to "User Token Scopes"
- Make sure you didn't add them to "Bot Token Scopes" by mistake
- Try disconnecting and reconnecting your Slack workspace

### Problem: "Channel not found" when sending messages

**Solutions:**
- Make sure the channel exists and you're a member
- Try using a public channel like #general first
- Check spelling of channel name

### Problem: Browser doesn't open during setup

**Solutions:**
- Copy the URL Claude shows and paste it in your browser manually
- Make sure you have a default browser set
- Try using a different browser

## Quick Reset Guide

If nothing is working, try this reset:

1. **Delete old config**: Remove the `~/.slack-mcp` folder
2. **Restart Claude**: Quit Claude Desktop completely and reopen
3. **Start over**: Follow the setup guide from step 4 (Create OAuth config)

## Getting More Help

- **Check the logs**: Claude usually shows helpful error messages
- **Try simple commands first**: "List my Slack workspaces" before sending messages
- **Double-check setup**: Make sure each step was completed exactly
- **Test in Slack directly**: Verify your app works by checking its permissions in Slack settings