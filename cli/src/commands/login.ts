import prompts from 'prompts';
import { saveConfig, loadConfig, DEFAULT_BASE_URL } from '../config.js';
import { getAccountUsage } from '../api.js';
import type { BatchTubeConfig } from '../config.js';

export async function runLogin(): Promise<void> {
  const existing = loadConfig();
  const { apiBaseUrl, apiKey } = await prompts([
    {
      type: 'text',
      name: 'apiBaseUrl',
      message: 'API base URL',
      initial: existing?.apiBaseUrl ?? DEFAULT_BASE_URL
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'API key',
      initial: undefined,
      validate: (v: string) => (v && v.trim().length > 0 ? true : 'API key is required')
    }
  ], { onCancel: () => process.exit(0) });

  if (!apiKey?.trim()) {
    console.error('API key is required.');
    process.exit(1);
  }

  const config: BatchTubeConfig = {
    apiBaseUrl: (apiBaseUrl as string)?.trim() || DEFAULT_BASE_URL,
    apiKey: (apiKey as string).trim()
  };

  const base = config.apiBaseUrl.replace(/\/+$/, '');

  try {
    await getAccountUsage(base, config.apiKey);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('Invalid API key')) {
      console.error('Invalid API key. Check your key at https://batchtube.app or your dashboard.');
      process.exit(1);
    }
    console.error('Could not verify API key:', msg);
    process.exit(1);
  }

  saveConfig(config);
  console.log('Authenticated successfully.');
}
