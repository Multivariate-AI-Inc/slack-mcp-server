#!/usr/bin/env node

/**
 * Simple test script to verify MCP server functionality
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧪 Testing Slack MCP Server');
console.log('==============================\n');

// Test 1: Server starts without errors
console.log('1. Testing server startup...');

const serverPath = './dist/index.js';
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server not built. Run: npm run build');
  process.exit(1);
}

const server = spawn('node', [serverPath], { 
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverOutput = '';
let serverError = '';

server.stdout.on('data', (data) => {
  serverOutput += data.toString();
});

server.stderr.on('data', (data) => {
  serverError += data.toString();
});

// Test 2: Send list_tools request
setTimeout(() => {
  console.log('2. Testing list_tools request...');
  
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };
  
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 100);

// Test 3: Check for expected tools
setTimeout(() => {
  console.log('3. Checking available tools...');
  
  const expectedTools = [
    'add_workspace',
    'authenticate_user',
    'list_workspaces',
    'get_unread_conversations',
    'send_message',
    'get_channels',
    'get_users'
  ];
  
  let foundTools = 0;
  expectedTools.forEach(tool => {
    if (serverOutput.includes(`"name":"${tool}"`)) {
      console.log(`   ✅ ${tool}`);
      foundTools++;
    } else {
      console.log(`   ❌ ${tool} (missing)`);
    }
  });
  
  console.log(`\n📊 Results: ${foundTools}/${expectedTools.length} tools found`);
  
  if (foundTools === expectedTools.length) {
    console.log('✅ All tests passed! Server is working correctly.');
  } else {
    console.log('⚠️  Some tools missing. Check server implementation.');
  }
  
  if (serverError) {
    console.log('\n🔍 Server errors:');
    console.log(serverError);
  }
  
  // Cleanup
  server.kill();
  process.exit(foundTools === expectedTools.length ? 0 : 1);
}, 1000);

// Handle server exit
server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\n❌ Server exited with code: ${code}`);
    if (serverError) {
      console.log('Server error output:');
      console.log(serverError);
    }
  }
});