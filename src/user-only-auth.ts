import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import { WebClient } from '@slack/web-api';
import { ensureCertificateExists } from './cert-utils.js';

const CONFIG_DIR = path.join(os.homedir(), '.slack-mcp');
const USER_TOKENS_PATH = path.join(CONFIG_DIR, 'user-tokens.json');
const OAUTH_CONFIG_PATH = path.join(CONFIG_DIR, 'oauth-config.json');

export interface UserOnlyTokens {
  [workspaceId: string]: {
    accessToken: string;
    userId: string;
    teamId: string;
  };
}

export function loadUserOnlyTokens(): UserOnlyTokens {
  if (!fs.existsSync(USER_TOKENS_PATH)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(USER_TOKENS_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

export function saveUserOnlyTokens(tokens: UserOnlyTokens): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  
  try {
    fs.writeFileSync(USER_TOKENS_PATH, JSON.stringify(tokens, null, 2));
  } catch (error) {
    throw new Error(`Failed to save user tokens: ${error}`);
  }
}

export class UserOnlyOAuthManager {
  private server?: https.Server;

  async startUserOnlyFlow(workspaceId: string, clientId: string, clientSecret: string): Promise<{ 
    authUrl: string;
    promise: Promise<{ accessToken: string; userId: string; teamId: string }>;
  }> {
    const redirectUri = 'https://localhost:3001/oauth/callback';
    
    // Create the OAuth URL for user-only permissions
    const authUrl = `https://slack.com/oauth/v2/authorize?` +
      `client_id=${clientId}&` +
      `scope=&` + // Empty bot scope
      `user_scope=${encodeURIComponent([
        'channels:history',
        'channels:read', 
        'groups:history',
        'groups:read',
        'im:history',
        'im:read',
        'chat:write',
        'users:read',
        'team:read'
      ].join(','))}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${workspaceId}`;

    const authPromise = new Promise<{ accessToken: string; userId: string; teamId: string }>((resolve, reject) => {
      const port = 3001;
      
      // Get or create HTTPS certificates
      const { cert, key } = ensureCertificateExists();
      
      this.server = https.createServer({ cert, key });
      
      this.server.listen(port, () => {
        // Server started, OAuth URL is ready
      });

      this.server.on('request', async (req, res) => {
        if (!req.url?.startsWith('/oauth/callback')) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const url = new URL(req.url, `https://localhost:${port}`);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400);
          res.end(`OAuth error: ${error}`);
          this.server?.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (!code) {
          res.writeHead(400);
          res.end('No authorization code received');
          this.server?.close();
          reject(new Error('No authorization code received'));
          return;
        }

        try {
          // Exchange code for access token using Slack's OAuth v2
          const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              code: code,
              redirect_uri: redirectUri
            })
          });

          const tokenData = await tokenResponse.json() as any;

          if (!tokenData.ok) {
            throw new Error(`Token exchange failed: ${tokenData.error}`);
          }

          // For user-only apps, the token is in authed_user
          if (!tokenData.authed_user || !tokenData.authed_user.access_token) {
            throw new Error('No user access token received');
          }

          // Get user info to verify token
          const client = new WebClient(tokenData.authed_user.access_token);
          const authTest = await client.auth.test();

          if (!authTest.ok) {
            throw new Error('Failed to verify user token');
          }

          // Save tokens
          const userTokens = loadUserOnlyTokens();
          userTokens[workspaceId] = {
            accessToken: tokenData.authed_user.access_token,
            userId: authTest.user_id!,
            teamId: authTest.team_id!
          };
          saveUserOnlyTokens(userTokens);

          res.writeHead(200);
          res.end(`
            <html>
              <body>
                <h1>✅ User Authentication Successful!</h1>
                <p>You can now close this window and return to Claude.</p>
                <p>Workspace: ${workspaceId}</p>
                <p>User: ${authTest.user}</p>
                <p>You can now send messages as yourself!</p>
                <script>setTimeout(() => window.close(), 3000);</script>
              </body>
            </html>
          `);

          this.server?.close();
          resolve({
            accessToken: tokenData.authed_user.access_token,
            userId: authTest.user_id!,
            teamId: authTest.team_id!
          });

        } catch (error) {
          res.writeHead(500);
          res.end(`Authentication failed: ${error}`);
          this.server?.close();
          reject(error);
        }
      });
    });

    return {
      authUrl,
      promise: authPromise
    };
  }

  stop(): void {
    if (this.server) {
      this.server.close();
    }
  }
}

export function getUserOnlyToken(workspaceId: string): string | null {
  const tokens = loadUserOnlyTokens();
  return tokens[workspaceId]?.accessToken || null;
}

export function getUserOnlyInfo(workspaceId: string): { userId: string; teamId: string } | null {
  const tokens = loadUserOnlyTokens();
  const tokenInfo = tokens[workspaceId];
  if (tokenInfo) {
    return {
      userId: tokenInfo.userId,
      teamId: tokenInfo.teamId
    };
  }
  return null;
}