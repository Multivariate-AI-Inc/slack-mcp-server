import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
// import open from 'open';
import { WebClient } from '@slack/web-api';
import { ensureCertificateExists } from './cert-utils.js';

const CONFIG_DIR = path.join(os.homedir(), '.slack-mcp');
const USER_TOKENS_PATH = path.join(CONFIG_DIR, 'user-tokens.json');
const OAUTH_CONFIG_PATH = path.join(CONFIG_DIR, 'oauth-config.json');

export interface UserTokens {
  [workspaceId: string]: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    userId: string;
    teamId: string;
  };
}

export interface OAuthAppsConfig {
  apps: {
    [workspaceId: string]: {
      clientId: string;
      clientSecret: string;
    };
  };
}

export function loadOAuthConfig(): OAuthAppsConfig {
  if (!fs.existsSync(OAUTH_CONFIG_PATH)) {
    throw new Error(`OAuth config not found at ${OAUTH_CONFIG_PATH}. Please create this file with your Slack app credentials.`);
  }
  
  try {
    const content = fs.readFileSync(OAUTH_CONFIG_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load OAuth config: ${error}`);
  }
}

export function getAppCredentials(workspaceId: string): { clientId: string; clientSecret: string } {
  const config = loadOAuthConfig();
  const appConfig = config.apps[workspaceId];
  
  if (!appConfig) {
    throw new Error(`No OAuth app configured for workspace: ${workspaceId}. Add it to ${OAUTH_CONFIG_PATH}`);
  }
  
  return appConfig;
}

export function ensureUserTokensFile(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(USER_TOKENS_PATH)) {
    fs.writeFileSync(USER_TOKENS_PATH, JSON.stringify({}));
  }
}

export function loadUserTokens(): UserTokens {
  ensureUserTokensFile();
  
  try {
    const content = fs.readFileSync(USER_TOKENS_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

export function saveUserTokens(tokens: UserTokens): void {
  ensureUserTokensFile();
  
  try {
    fs.writeFileSync(USER_TOKENS_PATH, JSON.stringify(tokens, null, 2));
  } catch (error) {
    throw new Error('Failed to save user tokens');
  }
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}

export class UserOAuthManager {
  private config: OAuthConfig;
  private server?: https.Server;

  constructor(config: OAuthConfig) {
    this.config = {
      ...config,
      redirectUri: config.redirectUri || 'https://localhost:3001/oauth/callback'
    };
  }

  async startOAuthFlow(workspaceId: string, scopes: string[] = [
    'channels:history',
    'channels:read',
    'groups:history',
    'groups:read',
    'im:history',
    'im:read',
    'chat:write',
    'users:read',
    'team:read'
  ]): Promise<{ accessToken: string; userId: string; teamId: string; authUrl?: string }> {
    
    return new Promise((resolve, reject) => {
      const port = new URL(this.config.redirectUri!).port || '3001';
      
      // Get or create HTTPS certificates
      const { cert, key } = ensureCertificateExists();
      
      this.server = https.createServer({ cert, key });
      
      this.server.listen(parseInt(port), () => {
        const authUrl = `https://slack.com/oauth/v2/authorize?` +
          `client_id=${this.config.clientId}&` +
          `scope=${scopes.join(',')}&` +
          `redirect_uri=${encodeURIComponent(this.config.redirectUri!)}&` +
          `state=${workspaceId}`;

        // Return the OAuth URL so it can be displayed to the user properly
        // Don't log to console as Claude Desktop treats it as error output
      });

      this.server.on('request', async (req, res) => {
        if (!req.url?.startsWith('/oauth/callback')) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const url = new URL(req.url, `http://localhost:${port}`);
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
          // Exchange code for access token
          const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: this.config.clientId,
              client_secret: this.config.clientSecret,
              code: code,
              redirect_uri: this.config.redirectUri!
            })
          });

          const tokenData = await tokenResponse.json() as any;

          if (!tokenData.ok) {
            throw new Error(`Token exchange failed: ${tokenData.error}`);
          }

          // Get user info
          const client = new WebClient(tokenData.authed_user.access_token);
          const authTest = await client.auth.test();

          if (!authTest.ok) {
            throw new Error('Failed to verify token');
          }

          // Save tokens
          const userTokens = loadUserTokens();
          userTokens[workspaceId] = {
            accessToken: tokenData.authed_user.access_token,
            refreshToken: tokenData.authed_user.refresh_token,
            userId: authTest.user_id!,
            teamId: authTest.team_id!
          };
          saveUserTokens(userTokens);

          res.writeHead(200);
          res.end(`
            <html>
              <body>
                <h1>✅ Authentication Successful!</h1>
                <p>You can now close this window and return to your MCP client.</p>
                <p>Workspace: ${workspaceId}</p>
                <p>User: ${authTest.user}</p>
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
  }

  stop(): void {
    if (this.server) {
      this.server.close();
    }
  }
}

export function getUserToken(workspaceId: string): string | null {
  const tokens = loadUserTokens();
  return tokens[workspaceId]?.accessToken || null;
}

export function getUserInfo(workspaceId: string): { userId: string; teamId: string } | null {
  const tokens = loadUserTokens();
  const tokenInfo = tokens[workspaceId];
  if (tokenInfo) {
    return {
      userId: tokenInfo.userId,
      teamId: tokenInfo.teamId
    };
  }
  return null;
}