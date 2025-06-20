import { WebClient } from '@slack/web-api';
import { SlackWorkspace, SlackMessage, SlackChannel, SlackUser, UnreadConversation } from './types.js';

export class SlackClientManager {
  private clients: Map<string, WebClient> = new Map();

  addWorkspace(workspace: SlackWorkspace): void {
    const client = new WebClient(workspace.token);
    this.clients.set(workspace.id, client);
  }

  getClient(workspaceId: string): WebClient {
    const client = this.clients.get(workspaceId);
    if (!client) {
      throw new Error(`No client found for workspace: ${workspaceId}`);
    }
    return client;
  }

  async testConnection(workspaceId: string): Promise<boolean> {
    try {
      const client = this.getClient(workspaceId);
      const result = await client.auth.test();
      return result.ok === true;
    } catch (error) {
      return false;
    }
  }

  async getChannels(workspaceId: string): Promise<SlackChannel[]> {
    const client = this.getClient(workspaceId);
    const channels: SlackChannel[] = [];

    try {
      // Get public channels
      const publicChannels = await client.conversations.list({
        types: 'public_channel',
        exclude_archived: true
      });

      if (publicChannels.channels) {
        channels.push(...publicChannels.channels.map(ch => ({
          id: ch.id!,
          name: ch.name!,
          is_channel: true,
          is_group: false,
          is_im: false,
          is_private: false,
          is_member: ch.is_member || false,
          num_members: ch.num_members
        })));
      }

      // Get private channels/groups
      const privateChannels = await client.conversations.list({
        types: 'private_channel',
        exclude_archived: true
      });

      if (privateChannels.channels) {
        channels.push(...privateChannels.channels.map(ch => ({
          id: ch.id!,
          name: ch.name!,
          is_channel: false,
          is_group: true,
          is_im: false,
          is_private: true,
          is_member: ch.is_member || false,
          num_members: ch.num_members
        })));
      }

      // Get DMs
      const dms = await client.conversations.list({
        types: 'im',
        exclude_archived: true
      });

      if (dms.channels) {
        channels.push(...dms.channels.map(ch => ({
          id: ch.id!,
          name: ch.user || ch.id!,
          is_channel: false,
          is_group: false,
          is_im: true,
          is_private: true,
          is_member: true
        })));
      }

      return channels;
    } catch (error) {
      throw error;
    }
  }

  async getUnreadMessages(workspaceId: string, channelId: string): Promise<SlackMessage[]> {
    const client = this.getClient(workspaceId);

    try {
      // Get conversation info to check for unread messages
      const convInfo = await client.conversations.info({
        channel: channelId
      });

      if (!convInfo.channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      // Get conversation history
      const history = await client.conversations.history({
        channel: channelId,
        limit: 100 // Adjust as needed
      });

      if (!history.messages) {
        return [];
      }

      // Convert to our message format
      const messages: SlackMessage[] = history.messages.map(msg => ({
        ts: msg.ts!,
        text: msg.text || '',
        user: msg.user || msg.bot_id || 'unknown',
        channel: channelId,
        thread_ts: msg.thread_ts,
        subtype: msg.subtype,
        username: msg.username,
        bot_id: msg.bot_id
      }));

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      throw error;
    }
  }

  async getAllUnreadConversations(workspaceId: string): Promise<UnreadConversation[]> {
    const channels = await this.getChannels(workspaceId);
    const unreadConversations: UnreadConversation[] = [];

    for (const channel of channels) {
      if (!channel.is_member && !channel.is_im) {
        continue; // Skip channels we're not a member of
      }

      try {
        const messages = await this.getUnreadMessages(workspaceId, channel.id);
        
        if (messages.length > 0) {
          unreadConversations.push({
            channel,
            messages,
            unread_count: messages.length,
            workspace: workspaceId
          });
        }
      } catch (error) {
        // Continue with other channels
      }
    }

    return unreadConversations;
  }

  async sendMessage(workspaceId: string, channelId: string, text: string, threadTs?: string): Promise<void> {
    const client = this.getClient(workspaceId);

    try {
      const result = await client.chat.postMessage({
        channel: channelId,
        text: text,
        thread_ts: threadTs
      });

      if (!result.ok) {
        throw new Error(`Failed to send message: ${result.error}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async getUsers(workspaceId: string): Promise<SlackUser[]> {
    const client = this.getClient(workspaceId);

    try {
      const result = await client.users.list({});
      
      if (!result.members) {
        return [];
      }

      return result.members.map(member => ({
        id: member.id!,
        name: member.name!,
        real_name: member.real_name,
        display_name: member.profile?.display_name,
        email: member.profile?.email,
        is_bot: member.is_bot || false
      }));
    } catch (error) {
      throw error;
    }
  }

  async getUserInfo(workspaceId: string, userId: string): Promise<SlackUser | null> {
    const client = this.getClient(workspaceId);

    try {
      const result = await client.users.info({
        user: userId
      });

      if (!result.user) {
        return null;
      }

      const user = result.user;
      return {
        id: user.id!,
        name: user.name!,
        real_name: user.real_name,
        display_name: user.profile?.display_name,
        email: user.profile?.email,
        is_bot: user.is_bot || false
      };
    } catch (error) {
      return null;
    }
  }

  // Enhanced functions for better UX
  async getDMChannelByUser(workspaceId: string, userIdentifier: string): Promise<string | null> {
    const client = this.getClient(workspaceId);

    try {
      let userId = userIdentifier;

      // If identifier looks like a username (@username or username), find the user ID
      if (userIdentifier.includes('@') || !userIdentifier.startsWith('U')) {
        const userName = userIdentifier.replace('@', '');
        const users = await this.getUsers(workspaceId);
        const user = users.find(u => 
          u.name === userName || 
          u.display_name === userName ||
          u.real_name === userName
        );
        if (!user) return null;
        userId = user.id;
      }

      // Get DM channel for this user
      const result = await client.conversations.open({
        users: userId
      });

      if (result.ok && result.channel) {
        return result.channel.id!;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async findUser(workspaceId: string, query: string): Promise<{ user: SlackUser; dmChannelId: string | null } | null> {
    try {
      const users = await this.getUsers(workspaceId);
      
      // Smart search: exact match first, then partial match
      const queryLower = query.toLowerCase().replace('@', '');
      
      let foundUser = users.find(u => 
        u.name === queryLower ||
        u.display_name?.toLowerCase() === queryLower ||
        u.real_name?.toLowerCase() === queryLower
      );

      if (!foundUser) {
        // Try partial match
        foundUser = users.find(u => 
          u.name.includes(queryLower) ||
          u.display_name?.toLowerCase().includes(queryLower) ||
          u.real_name?.toLowerCase().includes(queryLower)
        );
      }

      if (!foundUser) return null;

      // Get DM channel
      const dmChannelId = await this.getDMChannelByUser(workspaceId, foundUser.id);

      return {
        user: foundUser,
        dmChannelId
      };
    } catch (error) {
      return null;
    }
  }

  async getRecentConversationsWithMetadata(workspaceId: string, limit: number = 20): Promise<any[]> {
    const client = this.getClient(workspaceId);
    
    try {
      // Get recent conversations
      const result = await client.conversations.list({
        limit: limit,
        exclude_archived: true,
        types: 'public_channel,private_channel,im,mpim'
      });

      if (!result.channels) return [];

      const conversations = [];
      const users = await this.getUsers(workspaceId); // Bulk load users
      const userMap = new Map(users.map(u => [u.id, u]));

      for (const channel of result.channels) {
        let displayName = channel.name || channel.id!;
        let conversationType = 'channel';

        if (channel.is_im) {
          // DM - get user info
          const userId = channel.user;
          const user = userMap.get(userId!);
          displayName = user ? `@${user.display_name || user.real_name || user.name}` : `@${userId}`;
          conversationType = 'dm';
        } else if (channel.is_mpim) {
          conversationType = 'group_dm';
        } else if (channel.is_private) {
          conversationType = 'private_channel';
        }

        // Get latest message timestamp
        const history = await client.conversations.history({
          channel: channel.id!,
          limit: 1
        });

        conversations.push({
          id: channel.id!,
          name: displayName,
          type: conversationType,
          is_member: channel.is_member || false,
          last_activity: history.messages?.[0]?.ts || '0',
          user_count: channel.num_members || 0
        });
      }

      // Sort by last activity
      return conversations.sort((a, b) => parseFloat(b.last_activity) - parseFloat(a.last_activity));
    } catch (error) {
      throw error;
    }
  }

  async resolveUserIds(workspaceId: string, userIds: string[]): Promise<Map<string, SlackUser>> {
    const client = this.getClient(workspaceId);
    const userMap = new Map<string, SlackUser>();

    try {
      // Batch API call instead of individual calls
      const result = await client.users.list({});
      
      if (result.members) {
        for (const member of result.members) {
          if (userIds.includes(member.id!)) {
            userMap.set(member.id!, {
              id: member.id!,
              name: member.name!,
              real_name: member.real_name,
              display_name: member.profile?.display_name,
              email: member.profile?.email,
              is_bot: member.is_bot || false
            });
          }
        }
      }

      return userMap;
    } catch (error) {
      throw error;
    }
  }
}