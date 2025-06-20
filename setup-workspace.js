#!/usr/bin/env node

/**
 * Interactive setup script for adding Slack workspaces
 * Run with: node setup-workspace.js
 */

import readline from 'readline';
import { addWorkspace } from './dist/config.js';
import { SlackClientManager } from './dist/slack-client.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 Slack MCP Server Workspace Setup');
  console.log('=====================================\n');

  try {
    const id = await question('Enter a unique ID for this workspace (e.g., "my-company"): ');
    const name = await question('Enter a display name for this workspace: ');
    const token = await question('Enter your Slack Bot Token (xoxb-...): ');
    const teamId = await question('Enter your Slack Team ID: ');

    console.log('\n⚙️  Testing connection...');

    const workspace = { id, name, token, teamId };
    const slackManager = new SlackClientManager();
    slackManager.addWorkspace(workspace);

    const isConnected = await slackManager.testConnection(id);
    
    if (!isConnected) {
      console.error('❌ Failed to connect to Slack. Please check your token and try again.');
      process.exit(1);
    }

    console.log('✅ Connection successful!');
    
    addWorkspace(workspace);
    
    console.log(`\n🎉 Workspace "${name}" has been added successfully!`);
    console.log('\nYou can now use the following tools:');
    console.log('- get_unread_conversations');
    console.log('- send_message');
    console.log('- get_channels');
    console.log('- and more...\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();