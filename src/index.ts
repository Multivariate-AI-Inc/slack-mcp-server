#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { SlackClientManager } from './slack-client.js';
import { 
  loadConfig, 
  saveConfig, 
  addWorkspace, 
  removeWorkspace, 
  listWorkspaces,
  getWorkspace 
} from './config.js';
import { SlackWorkspace } from './types.js';
import { UserOAuthManager, getUserToken, getUserInfo, getAppCredentials } from './user-auth.js';
import { UserOnlyOAuthManager, getUserOnlyToken, getUserOnlyInfo } from './user-only-auth.js';

// Initialize Slack client manager
const slackManager = new SlackClientManager();

// Load existing workspaces
const config = loadConfig();
config.workspaces.forEach(workspace => {
  slackManager.addWorkspace(workspace);
});

// Schema definitions
const AddWorkspaceSchema = z.object({
  id: z.string().describe('Unique identifier for the workspace'),
  name: z.string().describe('Display name for the workspace'),
  token: z.string().describe('Slack Bot Token (xoxb-...) or User Token (xoxp-...)'),
  teamId: z.string().describe('Slack Team ID'),
  tokenType: z.enum(['bot', 'user']).optional().default('bot').describe('Type of token - bot or user'),
  userId: z.string().optional().describe('User ID (required for user tokens)')
});


const AuthenticateUserOnlySchema = z.object({
  workspaceId: z.string().describe('Unique identifier for the workspace (must match OAuth config file)'),
  workspaceName: z.string().describe('Display name for the workspace')
});

const RemoveWorkspaceSchema = z.object({
  workspaceId: z.string().describe('ID of the workspace to remove')
});

const ListWorkspacesSchema = z.object({}).describe('List all configured workspaces');

const GetUnreadConversationsSchema = z.object({
  workspaceId: z.string().optional().describe('Specific workspace ID (if not provided, gets from all workspaces)')
});

const GetChannelsSchema = z.object({
  workspaceId: z.string().describe('Workspace ID to get channels from')
});

const GetMessagesSchema = z.object({
  workspaceId: z.string().describe('Workspace ID'),
  channelId: z.string().describe('Channel ID to get messages from'),
  limit: z.number().optional().default(50).describe('Maximum number of messages to retrieve')
});

const SendMessageSchema = z.object({
  workspaceId: z.string().describe('Workspace ID to send message to'),
  channelId: z.string().describe('Channel ID to send message to'),
  text: z.string().describe('Message text to send'),
  threadTs: z.string().optional().describe('Thread timestamp to reply to (optional)')
});

const GetUsersSchema = z.object({
  workspaceId: z.string().describe('Workspace ID to get users from')
});

const GetUserInfoSchema = z.object({
  workspaceId: z.string().describe('Workspace ID'),
  userId: z.string().describe('User ID to get information for')
});

const SearchMessagesSchema = z.object({
  workspaceId: z.string().describe('Workspace ID to search in'),
  query: z.string().describe('Search query'),
  limit: z.number().optional().default(20).describe('Maximum number of results')
});

// Enhanced function schemas
const GetDMChannelByUserSchema = z.object({
  workspaceId: z.string().describe('Workspace ID'),
  userIdentifier: z.string().describe('User ID, username, or display name (@username or username)')
});

const FindUserSchema = z.object({
  workspaceId: z.string().describe('Workspace ID'),
  query: z.string().describe('Search query (name, username, or partial match)')
});

const GetRecentConversationsSchema = z.object({
  workspaceId: z.string().describe('Workspace ID'),
  limit: z.number().optional().default(20).describe('Number of conversations to return'),
  includeUserInfo: z.boolean().optional().default(true).describe('Include resolved user names')
});

const ResolveUserIdsSchema = z.object({
  workspaceId: z.string().describe('Workspace ID'),
  userIds: z.array(z.string()).describe('Array of user IDs to resolve')
});

async function main() {
  const server = new Server({
    name: 'slack-mcp-server',
    version: '1.0.0',
    capabilities: {
      tools: {},
    },
  });

  // Tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'add_workspace',
        description: 'Add a new Slack workspace configuration (bot or user token)',
        inputSchema: zodToJsonSchema(AddWorkspaceSchema),
      },
      {
        name: 'authenticate_user_only',
        description: 'Authenticate as user-only (no bot required) - for apps configured without bot users',
        inputSchema: zodToJsonSchema(AuthenticateUserOnlySchema),
      },
      {
        name: 'remove_workspace',
        description: 'Remove a Slack workspace configuration',
        inputSchema: zodToJsonSchema(RemoveWorkspaceSchema),
      },
      {
        name: 'list_workspaces',
        description: 'List all configured Slack workspaces',
        inputSchema: zodToJsonSchema(ListWorkspacesSchema),
      },
      {
        name: 'get_unread_conversations',
        description: 'Get unread conversations from DMs, channels, and groups',
        inputSchema: zodToJsonSchema(GetUnreadConversationsSchema),
      },
      {
        name: 'get_channels',
        description: 'Get all channels, DMs, and groups from a workspace',
        inputSchema: zodToJsonSchema(GetChannelsSchema),
      },
      {
        name: 'get_messages',
        description: 'Get messages from a specific channel',
        inputSchema: zodToJsonSchema(GetMessagesSchema),
      },
      {
        name: 'send_message',
        description: 'Send a message to a channel or DM',
        inputSchema: zodToJsonSchema(SendMessageSchema),
      },
      {
        name: 'get_users',
        description: 'Get all users from a workspace',
        inputSchema: zodToJsonSchema(GetUsersSchema),
      },
      {
        name: 'get_user_info',
        description: 'Get information about a specific user',
        inputSchema: zodToJsonSchema(GetUserInfoSchema),
      },
      {
        name: 'search_messages',
        description: 'Search for messages in a workspace',
        inputSchema: zodToJsonSchema(SearchMessagesSchema),
      },
      {
        name: 'get_dm_channel_by_user',
        description: 'Get DM channel ID for a specific user (by ID, username, or display name)',
        inputSchema: zodToJsonSchema(GetDMChannelByUserSchema),
      },
      {
        name: 'find_user',
        description: 'Smart user search with DM channel - find by name, username, or partial match',
        inputSchema: zodToJsonSchema(FindUserSchema),
      },
      {
        name: 'get_recent_conversations',
        description: 'Get recent conversations with user names and metadata',
        inputSchema: zodToJsonSchema(GetRecentConversationsSchema),
      },
      {
        name: 'resolve_user_ids',
        description: 'Bulk resolve user IDs to user information',
        inputSchema: zodToJsonSchema(ResolveUserIdsSchema),
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'add_workspace': {
          const validatedArgs = AddWorkspaceSchema.parse(args);
          const workspace: SlackWorkspace = {
            id: validatedArgs.id,
            name: validatedArgs.name,
            token: validatedArgs.token,
            teamId: validatedArgs.teamId,
            tokenType: validatedArgs.tokenType,
            userId: validatedArgs.userId
          };

          // Add to client manager
          slackManager.addWorkspace(workspace);
          
          // Test connection
          const isConnected = await slackManager.testConnection(workspace.id);
          if (!isConnected) {
            throw new Error('Failed to connect to Slack workspace. Please check your token.');
          }

          // Save to config
          addWorkspace(workspace);

          return {
            content: [
              {
                type: 'text',
                text: `Successfully added workspace: ${workspace.name} (${workspace.id})`,
              },
            ],
          };
        }


        case 'authenticate_user_only': {
          const validatedArgs = AuthenticateUserOnlySchema.parse(args);
          
          try {
            // Get credentials from local config file
            const credentials = getAppCredentials(validatedArgs.workspaceId);
            
            const userOnlyManager = new UserOnlyOAuthManager();
            
            const { authUrl, promise: authPromise } = await userOnlyManager.startUserOnlyFlow(
              validatedArgs.workspaceId,
              credentials.clientId,
              credentials.clientSecret
            );

            // Handle authentication in background
            setTimeout(async () => {
              try {
                const authResult = await authPromise;
                
                // Create workspace with user token
                const workspace: SlackWorkspace = {
                  id: validatedArgs.workspaceId,
                  name: validatedArgs.workspaceName,
                  token: authResult.accessToken,
                  teamId: authResult.teamId,
                  tokenType: 'user',
                  userId: authResult.userId
                };

                // Add to client manager and config
                slackManager.addWorkspace(workspace);
                addWorkspace(workspace);
              } catch (error) {
                // OAuth failed, but we already returned to user
              }
            }, 0);

            return {
              content: [
                {
                  type: 'text',
                  text: `🔐 User-Only OAuth Authentication Started\n\n` +
                        `Please visit this URL to authenticate with Slack (USER PERMISSIONS ONLY):\n\n` +
                        `${authUrl}\n\n` +
                        `⚠️ Your browser may show a security warning for the self-signed certificate.\n` +
                        `Click "Advanced" → "Proceed to localhost (unsafe)" to continue.\n\n` +
                        `This will grant USER permissions only (no bot required).\n` +
                        `After authorization, use 'list_workspaces' to verify authentication completed.`,
                },
              ],
            };
          } catch (error) {
            throw new Error(`User-only authentication failed: ${error}`);
          }
        }


        case 'remove_workspace': {
          const validatedArgs = RemoveWorkspaceSchema.parse(args);
          const workspace = getWorkspace(validatedArgs.workspaceId);
          
          if (!workspace) {
            throw new Error(`Workspace ${validatedArgs.workspaceId} not found`);
          }

          removeWorkspace(validatedArgs.workspaceId);

          return {
            content: [
              {
                type: 'text',
                text: `Successfully removed workspace: ${workspace.name}`,
              },
            ],
          };
        }

        case 'list_workspaces': {
          const workspaces = listWorkspaces();
          
          if (workspaces.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'No workspaces configured. Use add_workspace to add your first workspace.',
                },
              ],
            };
          }

          const workspacesList = workspaces.map(w => 
            `- ${w.name} (${w.id}) - Team: ${w.teamId} - Type: ${w.tokenType || 'bot'}${w.userId ? ` - User: ${w.userId}` : ''}`
          ).join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Configured workspaces (${workspaces.length}):\n${workspacesList}`,
              },
            ],
          };
        }

        case 'get_unread_conversations': {
          const validatedArgs = GetUnreadConversationsSchema.parse(args);
          const workspaces = validatedArgs.workspaceId 
            ? [getWorkspace(validatedArgs.workspaceId)].filter(Boolean) as SlackWorkspace[]
            : listWorkspaces();

          if (workspaces.length === 0) {
            throw new Error('No workspaces found');
          }

          let allUnreadConversations: any[] = [];

          for (const workspace of workspaces) {
            try {
              const unreadConversations = await slackManager.getAllUnreadConversations(workspace.id);
              allUnreadConversations.push(...unreadConversations.map(conv => ({
                ...conv,
                workspaceName: workspace.name
              })));
            } catch (error) {
              // Skip workspace on error
            }
          }

          if (allUnreadConversations.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'No unread conversations found.',
                },
              ],
            };
          }

          const conversationSummary = allUnreadConversations.map(conv => {
            const channelType = conv.channel.is_im ? 'DM' : 
                             conv.channel.is_group ? 'Group' : 'Channel';
            const recentMessages = conv.messages.slice(-3).map((msg: any) => 
              `  ${msg.user}: ${msg.text.slice(0, 100)}${msg.text.length > 100 ? '...' : ''}`
            ).join('\n');
            
            return `${channelType}: #${conv.channel.name} (${conv.workspaceName})\n` +
                   `Unread: ${conv.unread_count} messages\n` +
                   `Recent messages:\n${recentMessages}\n`;
          }).join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Found ${allUnreadConversations.length} unread conversations:\n\n${conversationSummary}`,
              },
            ],
          };
        }

        case 'get_channels': {
          const validatedArgs = GetChannelsSchema.parse(args);
          const channels = await slackManager.getChannels(validatedArgs.workspaceId);

          const channelsByType = {
            channels: channels.filter(c => c.is_channel),
            groups: channels.filter(c => c.is_group),
            dms: channels.filter(c => c.is_im)
          };

          const summary = [
            `Channels (${channelsByType.channels.length}):`,
            ...channelsByType.channels.map(c => `  #${c.name} (${c.id})`),
            '',
            `Private Groups (${channelsByType.groups.length}):`,
            ...channelsByType.groups.map(c => `  #${c.name} (${c.id})`),
            '',
            `Direct Messages (${channelsByType.dms.length}):`,
            ...channelsByType.dms.map(c => `  @${c.name} (${c.id})`),
          ].join('\n');

          return {
            content: [
              {
                type: 'text',
                text: summary,
              },
            ],
          };
        }

        case 'get_messages': {
          const validatedArgs = GetMessagesSchema.parse(args);
          const messages = await slackManager.getUnreadMessages(
            validatedArgs.workspaceId, 
            validatedArgs.channelId
          );

          if (messages.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'No messages found in this channel.',
                },
              ],
            };
          }

          const limitedMessages = messages.slice(-validatedArgs.limit);
          const messageList = limitedMessages.map(msg => {
            const timestamp = new Date(parseFloat(msg.ts) * 1000).toLocaleString();
            return `[${timestamp}] ${msg.user}: ${msg.text}`;
          }).join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Messages (showing last ${limitedMessages.length}):\n\n${messageList}`,
              },
            ],
          };
        }

        case 'send_message': {
          const validatedArgs = SendMessageSchema.parse(args);
          await slackManager.sendMessage(
            validatedArgs.workspaceId,
            validatedArgs.channelId,
            validatedArgs.text,
            validatedArgs.threadTs
          );

          return {
            content: [
              {
                type: 'text',
                text: `Message sent successfully to channel ${validatedArgs.channelId}`,
              },
            ],
          };
        }

        case 'get_users': {
          const validatedArgs = GetUsersSchema.parse(args);
          const users = await slackManager.getUsers(validatedArgs.workspaceId);

          const userList = users
            .filter(u => !u.is_bot)
            .map(u => `${u.real_name || u.name} (@${u.name}) - ${u.id}`)
            .join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Users (${users.length}):\n${userList}`,
              },
            ],
          };
        }

        case 'get_user_info': {
          const validatedArgs = GetUserInfoSchema.parse(args);
          const user = await slackManager.getUserInfo(
            validatedArgs.workspaceId,
            validatedArgs.userId
          );

          if (!user) {
            throw new Error(`User ${validatedArgs.userId} not found`);
          }

          const userInfo = [
            `Name: ${user.real_name || user.name}`,
            `Username: @${user.name}`,
            `ID: ${user.id}`,
            `Email: ${user.email || 'Not available'}`,
            `Is Bot: ${user.is_bot ? 'Yes' : 'No'}`,
          ].join('\n');

          return {
            content: [
              {
                type: 'text',
                text: userInfo,
              },
            ],
          };
        }

        case 'search_messages': {
          const validatedArgs = SearchMessagesSchema.parse(args);
          // Note: Slack's search API requires additional scopes
          // This is a simplified implementation
          return {
            content: [
              {
                type: 'text',
                text: 'Search functionality requires additional Slack API scopes. ' +
                      'Please use the Slack app to search for messages.',
              },
            ],
          };
        }

        case 'get_dm_channel_by_user': {
          const validatedArgs = GetDMChannelByUserSchema.parse(args);
          const channelId = await slackManager.getDMChannelByUser(
            validatedArgs.workspaceId,
            validatedArgs.userIdentifier
          );

          if (!channelId) {
            throw new Error(`Could not find DM channel for user: ${validatedArgs.userIdentifier}`);
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  channelId,
                  userIdentifier: validatedArgs.userIdentifier
                }, null, 2),
              },
            ],
          };
        }

        case 'find_user': {
          const validatedArgs = FindUserSchema.parse(args);
          const result = await slackManager.findUser(
            validatedArgs.workspaceId,
            validatedArgs.query
          );

          if (!result) {
            throw new Error(`No user found matching: ${validatedArgs.query}`);
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  user: result.user,
                  dmChannelId: result.dmChannelId,
                  query: validatedArgs.query
                }, null, 2),
              },
            ],
          };
        }

        case 'get_recent_conversations': {
          const validatedArgs = GetRecentConversationsSchema.parse(args);
          const conversations = await slackManager.getRecentConversationsWithMetadata(
            validatedArgs.workspaceId,
            validatedArgs.limit
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  workspaceId: validatedArgs.workspaceId,
                  count: conversations.length,
                  conversations
                }, null, 2),
              },
            ],
          };
        }

        case 'resolve_user_ids': {
          const validatedArgs = ResolveUserIdsSchema.parse(args);
          const userMap = await slackManager.resolveUserIds(
            validatedArgs.workspaceId,
            validatedArgs.userIds
          );

          // Convert Map to object for JSON serialization
          const users: Record<string, any> = {};
          userMap.forEach((user, userId) => {
            users[userId] = user;
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  workspaceId: validatedArgs.workspaceId,
                  requestedIds: validatedArgs.userIds,
                  resolvedCount: userMap.size,
                  users
                }, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  });

  const transport = new StdioServerTransport();
  server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});