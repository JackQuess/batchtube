import { loadConfig } from '../config.js';
import { getAccountUsage, BatchTubeApiError } from '../api.js';

export async function runWhoami(json = false): Promise<void> {
  const config = loadConfig();
  if (!config) {
    if (json) {
      console.log(JSON.stringify({ error: 'not_authenticated', message: 'Run batchtube login first.' }));
    } else {
      console.error('Run `batchtube login` first.');
    }
    process.exit(1);
  }

  const base = config.apiBaseUrl.replace(/\/+$/, '');
  try {
    const usage = await getAccountUsage(base, config.apiKey);
    if (json) {
      console.log(JSON.stringify(usage, null, 2));
      return;
    }
    console.log('Plan:', usage.plan);
    if (usage.credits) {
      console.log('Credits:', `${usage.credits.available} available / ${usage.credits.limit} limit`);
    }
    if (usage.cycle_reset) {
      console.log('Cycle resets:', usage.cycle_reset);
    }
  } catch (err) {
    if (err instanceof BatchTubeApiError && err.statusCode === 401) {
      if (json) {
        console.log(JSON.stringify({ error: 'invalid_api_key', message: err.message }));
      } else {
        console.error('API key is invalid or expired. Run `batchtube login` again.');
      }
      process.exit(1);
    }
    throw err;
  }
}
