import fs from 'fs';
import path from 'path';
import os from 'os';
import { SlackConfig, SlackWorkspace } from './types.js';

const CONFIG_DIR = path.join(os.homedir(), '.slack-mcp');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): SlackConfig {
  ensureConfigDir();
  
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig: SlackConfig = {
      workspaces: []
    };
    saveConfig(defaultConfig);
    return defaultConfig;
  }
  
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(configContent) as SlackConfig;
  } catch (error) {
    throw new Error('Failed to load Slack configuration');
  }
}

export function saveConfig(config: SlackConfig): void {
  ensureConfigDir();
  
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error('Failed to save Slack configuration');
  }
}

export function addWorkspace(workspace: SlackWorkspace): void {
  const config = loadConfig();
  
  // Remove existing workspace with same id if exists
  config.workspaces = config.workspaces.filter(w => w.id !== workspace.id);
  
  // Add new workspace
  config.workspaces.push(workspace);
  
  saveConfig(config);
}

export function removeWorkspace(workspaceId: string): void {
  const config = loadConfig();
  config.workspaces = config.workspaces.filter(w => w.id !== workspaceId);
  saveConfig(config);
}

export function getWorkspace(workspaceId: string): SlackWorkspace | undefined {
  const config = loadConfig();
  return config.workspaces.find(w => w.id === workspaceId);
}

export function listWorkspaces(): SlackWorkspace[] {
  const config = loadConfig();
  return config.workspaces;
}