import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = process.env.BATCHTUBE_CONFIG_DIR || join(homedir(), '.batchtube');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface BatchTubeConfig {
  apiBaseUrl: string;
  apiKey: string;
}

const DEFAULT_BASE_URL = 'https://api.batchtube.net';

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(overrideBaseUrl?: string): BatchTubeConfig | null {
  try {
    if (!existsSync(CONFIG_FILE)) return null;
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    const data = JSON.parse(raw) as BatchTubeConfig;
    if (!data.apiKey || typeof data.apiKey !== 'string') return null;
    return {
      apiBaseUrl: overrideBaseUrl ?? data.apiBaseUrl ?? DEFAULT_BASE_URL,
      apiKey: data.apiKey
    };
  } catch {
    return null;
  }
}

export function saveConfig(config: BatchTubeConfig): void {
  const dir = dirname(CONFIG_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(
    CONFIG_FILE,
    JSON.stringify(
      {
        apiBaseUrl: config.apiBaseUrl || DEFAULT_BASE_URL,
        apiKey: config.apiKey
      },
      null,
      2
    ),
    'utf-8'
  );
}

export function deleteConfig(): boolean {
  try {
    if (existsSync(CONFIG_FILE)) {
      unlinkSync(CONFIG_FILE);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export { DEFAULT_BASE_URL, CONFIG_DIR };
