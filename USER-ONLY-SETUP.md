# 👤 User-Only Authentication Setup (No Bot Required)

This guide shows you how to set up Slack authentication as a **user only** without any bot components.

## **Why User-Only?**

- ✅ **Send messages as yourself** (not as a bot)
- ✅ **No "APP" or "BOT" labels** on your messages
- ✅ **No bot installation required**
- ✅ **Only user permissions needed**
- ✅ **Access to all your personal channels/DMs**

## **Step 1: Create User-Only Slack App**

### **Create New App:**
1. Go to [Slack API Apps](https://api.slack.com/apps)
2. **Create New App** → **From scratch**
3. **App Name:** "Personal MCP - User Only"
4. **Workspace:** Select your workspace
5. **Create App**

### **Configure OAuth (User-Only):**
1. Go to **"OAuth & Permissions"**
2. Under **"Redirect URLs"**, add:
   ```
   https://localhost:3001/oauth/callback
   ```

### **Add User Token Scopes ONLY:**
Under **"User Token Scopes"** (ignore Bot Token Scopes completely), add:
- ✅ `channels:history` - Read messages in public channels
- ✅ `channels:read` - List public channels  
- ✅ `groups:history` - Read messages in private groups
- ✅ `groups:read` - List private groups
- ✅ `im:history` - Read messages in DMs
- ✅ `im:read` - List DMs
- ✅ `chat:write` - **Send messages as YOU**
- ✅ `users:read` - Read user information
- ✅ `team:read` - Read team information

### **⚠️ Important: DO NOT add any Bot Token Scopes**
- Leave the "Bot Token Scopes" section completely empty
- Do NOT add a bot user
- Do NOT go to "App Home"

### **Get App Credentials:**
1. Go to **"Basic Information"**
2. Copy **Client ID**
3. Copy **Client Secret** (click "Show")

## **Step 2: Generate HTTPS Certificates**

```bash
cd /Users/harshtrivedi/Downloads/Work/MCP/slack-mcp-server
./generate-certs.sh
```

## **Step 3: Update Your OAuth Config**

Update your `~/.slack-mcp/oauth-config.json` with the user-only app credentials:

```json
{
  "apps": {
    "mv-workspace": {
      "clientId": "your-user-only-app-client-id",
      "clientSecret": "your-user-only-app-client-secret"
    },
    "aso-workspace": {
      "clientId": "your-other-app-client-id", 
      "clientSecret": "your-other-app-client-secret"
    }
  }
}
```

## **Step 4: Restart Claude Desktop**

Restart Claude Desktop to load the updated server.

## **Step 5: Authenticate as User-Only**

Use the new user-only authentication tool:

```
Please authenticate my MV workspace as user-only:
- Workspace ID: mv-workspace
- Workspace Name: MV Workspace
```

**What this does:**
- ✅ **Uses `user_scope` only** (no bot scope)
- ✅ **No bot installation required**
- ✅ **Pure user authentication**
- ✅ **Messages appear as YOU**

## **Step 6: Test Your Setup**

After authentication:

```
Please list my workspaces and show me unread conversations from MV workspace
```

Then test sending a message:

```
Send a test message to #general in mv-workspace saying "Testing user-only authentication - this message appears as me!"
```

## **Troubleshooting User-Only Issues**

### **Error: "This app is requesting permission to install a bot"**
- ✅ **Solution**: Your app has bot scopes configured
- **Fix**: Remove ALL bot token scopes from your app
- **Check**: Make sure "Bot Token Scopes" section is empty
- **Verify**: Only "User Token Scopes" should have permissions

### **Error: "invalid_scope"**
- ✅ **Check**: Scopes are in "User Token Scopes" (not Bot Token Scopes)
- ✅ **Verify**: All required user scopes are added
- ✅ **Ensure**: No typos in scope names

### **Error: "access_denied"**
- ✅ **User denied**: Run authentication again
- ✅ **Admin approval**: Some workspaces require admin approval for user apps

### **Messages still show as bot**
- ❌ **Wrong token**: You might be using a bot token instead of user token
- ✅ **Check**: Use `authenticate_user_only` tool (not `authenticate_user`)
- ✅ **Verify**: App configured without any bot components

## **Differences: User-Only vs Regular OAuth**

| Feature | Regular OAuth | User-Only OAuth |
|---------|---------------|-----------------|
| **Bot Required** | Yes | No |
| **Bot Scopes** | Required | None |
| **User Scopes** | Required | Required |
| **Installation** | Bot + User | User only |
| **Message Appearance** | Can be bot or user | Always user |
| **Setup Complexity** | More complex | Simpler |
| **App Store** | Can be distributed | Personal use only |

## **Commands Summary**

### **User-Only Authentication:**
```
authenticate_user_only:
- workspaceId: mv-workspace  
- workspaceName: MV Workspace
```

### **Regular Authentication (with bot):**
```
authenticate_user:
- workspaceId: mv-workspace
- workspaceName: MV Workspace  
```

## **Best Practices**

1. **Use user-only** for personal automation
2. **Keep app private** - don't distribute user-only apps
3. **Minimal scopes** - only request what you need
4. **Monitor usage** - check Slack's audit logs
5. **Secure credentials** - protect client ID/secret

## **Security Notes**

- **User-only apps are more secure** - no bot token to compromise
- **Personal access only** - limited to your permissions
- **Easy revocation** - remove app from Slack settings
- **No workspace-wide impact** - only affects your account

This user-only setup gives you the cleanest experience for personal Slack automation!