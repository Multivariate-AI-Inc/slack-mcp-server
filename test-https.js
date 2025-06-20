#!/usr/bin/env node

/**
 * Test script to verify HTTPS server works correctly
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CERT_DIR = path.join(os.homedir(), '.slack-mcp');
const CERT_PATH = path.join(CERT_DIR, 'localhost.crt');
const KEY_PATH = path.join(CERT_DIR, 'localhost.key');

console.log('🧪 Testing HTTPS Server for OAuth');
console.log('===================================\n');

// Check if certificates exist
if (!fs.existsSync(CERT_PATH) || !fs.existsSync(KEY_PATH)) {
  console.error('❌ Certificates not found. Run ./generate-certs.sh first');
  process.exit(1);
}

console.log('✅ Certificates found');

// Test server startup
try {
  const cert = fs.readFileSync(CERT_PATH, 'utf8');
  const key = fs.readFileSync(KEY_PATH, 'utf8');
  
  const server = https.createServer({ cert, key }, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body>
          <h1>✅ HTTPS Server Working!</h1>
          <p>OAuth redirect server is ready for Slack authentication.</p>
          <p>URL: ${req.url}</p>
          <p>Time: ${new Date().toISOString()}</p>
        </body>
      </html>
    `);
  });
  
  server.listen(3001, () => {
    console.log('✅ HTTPS server started successfully on port 3001');
    console.log('🌐 Test URL: https://localhost:3001');
    console.log('⚠️  You may see browser security warnings (this is normal for self-signed certs)');
    console.log('\n⏹️  Press Ctrl+C to stop the test server');
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.log('💡 Port 3001 is already in use. Kill existing process with:');
      console.log('   lsof -ti:3001 | xargs kill');
    }
  });
  
} catch (error) {
  console.error('❌ Certificate error:', error.message);
  console.log('💡 Try regenerating certificates: ./generate-certs.sh');
}