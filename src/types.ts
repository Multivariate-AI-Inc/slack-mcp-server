export interface SlackWorkspace {
  id: string;
  name: string;
  token: string;
  teamId: string;
  tokenType: 'bot' | 'user';
  userId?: string; // For user tokens
}

export interface SlackMessage {
  ts: string;
  text: string;
  user: string;
  channel: string;
  thread_ts?: string;
  subtype?: string;
  username?: string;
  bot_id?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_private: boolean;
  is_member: boolean;
  num_members?: number;
  unread_count?: number;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  display_name?: string;
  email?: string;
  is_bot: boolean;
}

export interface UnreadConversation {
  channel: SlackChannel;
  messages: SlackMessage[];
  unread_count: number;
  workspace: string;
}

export interface SlackConfig {
  workspaces: SlackWorkspace[];
}