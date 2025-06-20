# 🔒 Secure User Authentication Setup

This guide shows you how to authenticate as yourself without exposing any credentials in chat.

## **Step 1: Create Slack Apps**

### **For Main Workspace:**
1. Go to [Slack API Apps](https://api.slack.com/apps)
2. **Create New App** → **From scratch**
3. **App Name:** "Personal MCP - Main" 
4. **Workspace:** Select your main workspace
5. **Create App**

### **For ASO Workspace:**
1. **Create New App** → **From scratch**  
2. **App Name:** "Personal MCP - ASO"
3. **Workspace:** Select your ASO workspace
4. **Create App**

## **Step 2: Configure Both Apps**

For **EACH** app, do the following:

### **OAuth Settings:**
1. Go to **"OAuth & Permissions"**
2. Under **"Redirect URLs"**, add:
   ```
   https://localhost:3001/oauth/callback
   ```
   
   ⚠️ **Important**: Slack now requires HTTPS for OAuth redirects. We'll set up local HTTPS certificates below.

### **User Token Scopes** (NOT Bot Token Scopes):
Add these scopes:
- ✅ `channels:history` - Read messages in public channels
- ✅ `channels:read` - List public channels  
- ✅ `groups:history` - Read messages in private groups
- ✅ `groups:read` - List private groups
- ✅ `im:history` - Read messages in DMs
- ✅ `im:read` - List DMs
- ✅ `chat:write` - **Send messages as YOU**
- ✅ `users:read` - Read user information
- ✅ `team:read` - Read team information

### **Get Credentials:**
1. Go to **"Basic Information"**
2. Copy **Client ID** (numbers)
3. Copy **Client Secret** (click "Show")

## **Step 3: Generate HTTPS Certificates**

Since Slack requires HTTPS for OAuth, we need to generate local certificates:

**Option 1: Automatic Generation (Recommended)**
```bash
cd /Users/harshtrivedi/Downloads/Work/MCP/slack-mcp-server
./generate-certs.sh
```

**Option 2: Manual Generation**
```bash
mkdir -p ~/.slack-mcp
cd ~/.slack-mcp

# Generate self-signed certificate
openssl req -x509 -newkey rsa:2048 \
    -keyout localhost.key \
    -out localhost.crt \
    -days 365 -nodes \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# Set proper permissions
chmod 600 localhost.key
chmod 644 localhost.crt
```

⚠️ **Browser Security Warning**: Your browser will show a security warning for self-signed certificates. During OAuth, click **"Advanced"** → **"Proceed to localhost (unsafe)"**.

## **Step 4: Create Secure Local Config** 

**Create the config directory (if not already created):**
```bash
mkdir -p ~/.slack-mcp
```

**Create the OAuth config file:**
```bash
nano ~/.slack-mcp/oauth-config.json
```

**Add your credentials** (replace with your actual values):
```json
{
  "apps": {
    "main-workspace": {
      "clientId": "1234567890.1234567890",
      "clientSecret": "your-main-workspace-client-secret-here"
    },
    "aso-workspace": {
      "clientId": "0987654321.0987654321", 
      "clientSecret": "your-aso-workspace-client-secret-here"
    }
  }
}
```

**Secure the file:**
```bash
chmod 600 ~/.slack-mcp/oauth-config.json
```

## **Step 5: Restart Claude Desktop**

Restart Claude Desktop to load the updated Slack MCP server.

## **Step 6: Authenticate Safely via Claude**

Now you can safely authenticate **without exposing any credentials in chat**:

```
Please authenticate my main Slack workspace as a user:
- Workspace ID: main-workspace
- Workspace Name: My Main Workspace

Use the credentials from my local OAuth config file.
```

Then for the second workspace:
```  
Please authenticate my ASO workspace as a user:
- Workspace ID: aso-workspace  
- Workspace Name: ASO Workspace

Use the credentials from my local OAuth config file.
```

## **What Happens:**

1. **Claude calls the `authenticate_user` tool**
2. **Server reads credentials from your local file** (never through chat)
3. **OAuth server starts** on localhost:3001
4. **Browser opens** to Slack authorization page
5. **You authorize** the app (one-time per workspace)
6. **Tokens saved locally** to `~/.slack-mcp/user-tokens.json`
7. **Ready to use!**

## **Security Benefits:**

- 🔒 **No credentials in chat history**
- 🔒 **No credentials logged by Claude**  
- 🔒 **Stored locally on your machine only**
- 🔒 **Standard OAuth flow**
- 🔒 **Easy to revoke via Slack settings**
- 🔒 **File permissions protect secrets**

## **Testing After Setup:**

```
Please show me my unread conversations from all workspaces
```

```
Send a test message to #general in my main workspace saying "Testing user authentication - this message appears to come from me!"
```

## **File Structure:**

After setup, you'll have:
```
~/.slack-mcp/
├── oauth-config.json      # Your app credentials (secure)
├── user-tokens.json       # OAuth access tokens (auto-created)
└── config.json           # Workspace configurations (auto-created)
```

## **Managing Access:**

**To revoke access:**
1. Go to Slack → Settings & Administration → Manage Apps
2. Find your "Personal MCP" apps
3. Click "Remove"

**To re-authenticate:**
Just run the authenticate command again in Claude.

**To add more workspaces:**
1. Create new Slack app for that workspace
2. Add credentials to `oauth-config.json`
3. Authenticate via Claude

This approach keeps all your credentials secure while giving you full user-level access to send messages as yourself!

## **Troubleshooting HTTPS Issues**

### **Browser Security Warnings**

When the OAuth flow opens `https://localhost:3001`, you'll see a security warning:

**Chrome/Edge:**
1. Click **"Advanced"**
2. Click **"Proceed to localhost (unsafe)"**

**Firefox:**
1. Click **"Advanced"**
2. Click **"Accept the Risk and Continue"**

**Safari:**
1. Click **"Show Details"**
2. Click **"visit this website"**
3. Click **"Visit Website"**

### **Certificate Issues**

**Error: "SSL certificate problem"**
- Run `./generate-certs.sh` to regenerate certificates
- Make sure certificates exist at `~/.slack-mcp/localhost.crt` and `~/.slack-mcp/localhost.key`

**Error: "Certificate expired"**
- Delete old certificates: `rm ~/.slack-mcp/localhost.*`
- Generate new ones: `./generate-certs.sh`

**Error: "OpenSSL not found"**
- **macOS**: `brew install openssl`
- **Ubuntu/Debian**: `sudo apt-get install openssl`
- **Windows**: Use WSL or install OpenSSL for Windows

### **Port Issues**

**Error: "Port 3001 already in use"**
- Kill existing process: `lsof -ti:3001 | xargs kill`
- Or use a different port by modifying the redirect URL in both:
  - Slack app settings
  - Local OAuth config

### **OAuth Flow Issues**

**Error: "invalid_redirect_uri"**
- Make sure you added `https://localhost:3001/oauth/callback` (with HTTPS) to your Slack app
- Check for typos in the redirect URL
- Ensure the port matches (3001)

**Error: "Browser doesn't open"**
- The server will print the OAuth URL
- Manually copy and paste it into your browser
- Make sure to proceed through security warnings

This secure HTTPS setup ensures your OAuth flow works with Slack's security requirements!