import { spawn } from 'node:child_process';
import { config } from '../config.js';
import { SUPPORTED_PROVIDER_IDS, detectProvider } from './providers.js';
import { classifyYoutubeError, classifyGenericProviderError } from './download.js';

export type SmokeStatus = 'ok' | 'failed' | 'skipped';

export interface ProviderSmokeResult {
  provider: string;
  url: string | null;
  status: SmokeStatus;
  duration_ms: number;
  errorCode?: string;
  stderr?: string;
  reason?: string;
}

export interface ProviderSmokeSnapshot {
  startedAt: string;
  finishedAt: string;
  summary: {
    total: number;
    ok: number;
    failed: number;
    skipped: number;
    successRate: number;
  };
  results: ProviderSmokeResult[];
}

let running = false;
let lastRun: ProviderSmokeSnapshot | null = null;
let lastRunAtMs = 0;

function parseSmokeUrlMap(raw: string): Record<string, string> {
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' && v.trim()) out[k.toLowerCase()] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

function probeYtDlp(url: string, provider: string): Promise<{ ok: boolean; stderr: string; durationMs: number }> {
  return new Promise((resolve) => {
    const args = [
      '--dump-single-json',
      '--skip-download',
      '--no-warnings',
      '--no-playlist',
      '--no-check-certificate',
      '--socket-timeout',
      String(Math.max(5, Math.floor(config.providerSmokeTimeoutMs / 1000))),
      url
    ];

    if (provider === 'youtube') {
      args.unshift(
        '--extractor-args',
        'youtube:player_client=web_safari,web,tv',
        '--add-header',
        'Accept-Language: en-US,en;q=0.9',
        '--add-header',
        'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        '--impersonate',
        'chrome'
      );
    }

    const started = Date.now();
    const proc = spawn('yt-dlp', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    const timeout = setTimeout(() => {
      try {
        proc.kill('SIGTERM');
      } catch {
        // ignore
      }
      resolve({ ok: false, stderr: 'timeout', durationMs: Date.now() - started });
    }, config.providerSmokeTimeoutMs);

    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    proc.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ ok: false, stderr: err.message, durationMs: Date.now() - started });
    });
    proc.on('close', (code) => {
      clearTimeout(timeout);
      resolve({ ok: code === 0, stderr: stderr.trim().slice(0, 500), durationMs: Date.now() - started });
    });
  });
}

function classifyProviderSmokeError(provider: string, stderr: string): string {
  if (provider === 'youtube') return classifyYoutubeError(stderr).code;
  return classifyGenericProviderError(stderr).code;
}

export function getProviderSmokeSnapshot(): ProviderSmokeSnapshot | null {
  return lastRun;
}

export async function runProviderSmokeCheck(options: { force?: boolean } = {}): Promise<ProviderSmokeSnapshot> {
  const now = Date.now();
  if (!options.force && lastRun && now - lastRunAtMs < config.providerSmokeMinIntervalMs) {
    return lastRun;
  }
  if (running && lastRun) return lastRun;

  running = true;
  const startedAt = new Date().toISOString();
  try {
    const urlMap = parseSmokeUrlMap(config.providerSmokeUrlsJson);
    const providers = [...SUPPORTED_PROVIDER_IDS];
    const results: ProviderSmokeResult[] = [];

    for (const provider of providers) {
      const url = urlMap[provider] ?? null;
      if (!url) {
        results.push({
          provider,
          url: null,
          status: 'skipped',
          duration_ms: 0,
          reason: 'missing_smoke_url'
        });
        continue;
      }

      const detected = detectProvider(url);
      if (provider !== 'generic' && detected !== provider) {
        results.push({
          provider,
          url,
          status: 'skipped',
          duration_ms: 0,
          reason: `url_provider_mismatch:${detected}`
        });
        continue;
      }

      const probe = await probeYtDlp(url, provider);
      if (probe.ok) {
        results.push({
          provider,
          url,
          status: 'ok',
          duration_ms: probe.durationMs
        });
      } else {
        results.push({
          provider,
          url,
          status: 'failed',
          duration_ms: probe.durationMs,
          errorCode: classifyProviderSmokeError(provider, probe.stderr),
          stderr: probe.stderr
        });
      }
    }

    const ok = results.filter((r) => r.status === 'ok').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const totalRunnable = ok + failed;
    const successRate = totalRunnable > 0 ? ok / totalRunnable : 1;
    const snapshot: ProviderSmokeSnapshot = {
      startedAt,
      finishedAt: new Date().toISOString(),
      summary: {
        total: results.length,
        ok,
        failed,
        skipped,
        successRate
      },
      results
    };
    lastRun = snapshot;
    lastRunAtMs = Date.now();
    console.log(
      JSON.stringify({
        msg: 'provider_smoke_completed',
        ...snapshot.summary
      })
    );
    return snapshot;
  } finally {
    running = false;
  }
}
