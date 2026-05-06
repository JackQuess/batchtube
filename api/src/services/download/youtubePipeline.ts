import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { config } from '../../config.js';
import { recordProviderFailure, recordProviderSuccess } from '../providerHealth.js';
import { YOUTUBE_CLIENT_STRATEGIES, YT_DLP, MAX_STDERR_LOG, getYoutubeFormatSelectors } from './constants.js';
import { buildYtDlpArgs } from './buildYtDlpArgs.js';
import { cookiesModeIsAvailable, resolveCookieModes } from './cookies.js';
import { classifyYoutubeError } from './errorClassifier.js';
import {
  getYoutubeAttemptKey,
  planYoutubeNextAttempts,
  selectYoutubeFormatSelectorFromFormats
} from './youtubeFormatPlan.js';
import {
  isYoutubeAuthCode,
  isYoutubePermanentCode,
  isYoutubeRetriableCode,
  isYoutubeHealthPermanentFailure,
  logYoutube,
  sanitizeStderr,
  sleep
} from './helpers.js';
import { ensureYtDlpVersionLogged, runYtDlp } from './ytdlpRunner.js';
import { YtDlpError } from './types.js';
import type { DownloadContext, DownloadFormat, DownloadQuality, YoutubeAttempt, YtDlpProbePayload } from './types.js';
import { ensureFreshCookies } from '../cookieRefresh.js';

async function probeYoutubeFormats(
  url: string,
  outputFileName: string,
  attempt: YoutubeAttempt,
  context?: DownloadContext
): Promise<string | null> {
  const dir = path.join(tmpdir(), `batchtube-probe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  fs.mkdirSync(dir, { recursive: true });
  const cookiesMode = attempt.cookiesMode;
  const args = buildYtDlpArgs({
    url,
    format: 'mp4',
    qualityOrSelector: 'best',
    outputTemplate: path.join(dir, `${outputFileName}.%(ext)s`),
    cookiesMode,
    options: {
      extractorArgs: YOUTUBE_CLIENT_STRATEGIES[attempt.clientStrategyIndex] ?? YOUTUBE_CLIENT_STRATEGIES[0],
      itemId: outputFileName,
      batchId: context?.batchId,
      provider: 'youtube',
      hardened: true
    }
  })
    .filter((arg, index, arr) => !(arr[index - 1] === '-o' || arg === '-o'))
    .filter((arg, index, arr) => !(arr[index - 1] === '--merge-output-format' || arg === '--merge-output-format'))
    .filter((arg, index, arr) => !(arr[index - 1] === '-f' || arg === '-f'));

  args.unshift('--dump-single-json', '--skip-download');

  const stderrChunks: string[] = [];
  const stdoutChunks: string[] = [];

  const payload = await new Promise<YtDlpProbePayload>((resolve, reject) => {
    const proc = spawn(YT_DLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const timeout = setTimeout(() => {
      try {
        proc.kill('SIGTERM');
      } catch {}
      reject(new Error('format_probe_timeout'));
    }, Math.min(config.ytDlpTimeoutMs, 25_000));

    proc.stdout?.on('data', (chunk) => stdoutChunks.push(chunk.toString()));
    proc.stderr?.on('data', (chunk) => stderrChunks.push(chunk.toString()));
    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new YtDlpError(`yt-dlp probe exited ${code}`, sanitizeStderr(stderrChunks.join(''), MAX_STDERR_LOG), code ?? -1));
        return;
      }
      try {
        resolve(JSON.parse(stdoutChunks.join('')) as YtDlpProbePayload);
      } catch (error) {
        reject(error);
      }
    });
  }).finally(() => {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {}
  });

  return payload.formats ? selectYoutubeFormatSelectorFromFormats(payload.formats, 'mp4', 'best') : null;
}

export async function runYoutubeDownloadWithFallbacks(
  url: string,
  format: DownloadFormat,
  quality: DownloadQuality,
  outputFileName: string,
  context?: DownloadContext
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  await ensureYtDlpVersionLogged();

  // Cookie init/refresh MUST complete before we plan attempts.
  // Otherwise resolveCookieModes() will see no file and we will never enqueue cookie attempts.
  const cookiePath = config.ytDlpCookiesPath?.trim() || '';
  const cookieUrl =
    (process.env.COOKIES_INIT_URL?.trim() || process.env.YT_DLP_COOKIES_URL?.trim() || '') || null;
  if (cookiePath) {
    const startedAt = Date.now();
    console.log(
      JSON.stringify({
        msg: 'youtube_cookies_warmup_start',
        itemId: outputFileName,
        batchId: context?.batchId ?? null,
        cookie_path: cookiePath,
        cookie_url: cookieUrl,
        cookie_url_source: process.env.COOKIES_INIT_URL?.trim() ? 'COOKIES_INIT_URL' : process.env.YT_DLP_COOKIES_URL?.trim() ? 'YT_DLP_COOKIES_URL' : null
      })
    );
    try {
      await ensureFreshCookies();
    } catch (e) {
      console.warn(
        JSON.stringify({
          msg: 'youtube_cookies_warmup_failed',
          itemId: outputFileName,
          batchId: context?.batchId ?? null,
          cookie_path: cookiePath,
          cookie_url: cookieUrl,
          error: e instanceof Error ? e.message : String(e)
        })
      );
    }
    let exists = false;
    let bytes: number | null = null;
    let firstLine: string | null = null;
    try {
      if (fs.existsSync(cookiePath)) {
        exists = true;
        bytes = fs.statSync(cookiePath).size;
        const raw = fs.readFileSync(cookiePath, 'utf8');
        const first = (raw.split(/\r?\n/)[0] ?? '').trim();
        firstLine = first ? (first.length > 200 ? `${first.slice(0, 200)}…` : first) : null;
      }
    } catch {
      /* ignore */
    }
    console.log(
      JSON.stringify({
        msg: 'youtube_cookies_warmup_done',
        itemId: outputFileName,
        batchId: context?.batchId ?? null,
        cookie_path: cookiePath,
        cookie_file_exists: exists,
        cookie_file_bytes: bytes,
        cookie_file_first_line: firstLine,
        duration_ms: Date.now() - startedAt
      })
    );
  }

  const itemId = outputFileName;
  const batchId = context?.batchId;
  const formatSelectors = getYoutubeFormatSelectors(format, quality);
  const cookieModes = resolveCookieModes();
  console.log(
    JSON.stringify({
      msg: 'youtube_cookie_modes_resolved',
      itemId,
      batchId: batchId ?? null,
      configured_cookie_path: config.ytDlpCookiesPath?.trim() || null,
      available_cookie_modes: cookieModes
    })
  );
  const initialAttempt: YoutubeAttempt = {
    selector: formatSelectors[0] ?? '',
    selectorIndex: 0,
    cookiesMode: 'none',
    hardened: false,
    clientStrategyIndex: 0,
    strategyName: 'fast_primary'
  };

  const queue: YoutubeAttempt[] = [initialAttempt];
  const seen = new Set<string>();
  let attempts = 0;
  let fallbackAttempts = 0;
  let lastClassification = classifyYoutubeError('');
  let lastStderr = '';
  let lastError: Error | null = null;
  const startedAt = Date.now();
  let dynamicProbeQueued = false;

  while (queue.length > 0 && attempts < config.ytDlpYoutubeMaxAttempts) {
    const attempt = queue.shift();
    if (!attempt) break;
    if (attempt.selectorIndex >= formatSelectors.length) continue;
    if (!cookiesModeIsAvailable(attempt.cookiesMode)) continue;
    attempt.selector = formatSelectors[attempt.selectorIndex] ?? '';

    const key = getYoutubeAttemptKey(attempt);
    if (seen.has(key)) continue;
    seen.add(key);
    attempts += 1;
    if (attempt.strategyName !== 'fast_primary') fallbackAttempts += 1;

    if (attempts > 1 && isYoutubeRetriableCode(lastClassification.code)) {
      const backoff = Math.min(
        config.ytDlpYoutubeBackoffBaseMs * Math.pow(2, Math.max(0, attempts - 2)),
        6000
      );
      await sleep(backoff);
    }

    const attemptStartedAt = Date.now();
    try {
      const result = await runYtDlp(url, format, attempt.selector, outputFileName, {
        extractorArgs: YOUTUBE_CLIENT_STRATEGIES[attempt.clientStrategyIndex] ?? YOUTUBE_CLIENT_STRATEGIES[0],
        strategyName: attempt.strategyName,
        strategyIndex: attempt.clientStrategyIndex,
        attempt: attempts,
        itemId,
        batchId,
        provider: 'youtube',
        cookiesMode: attempt.cookiesMode,
        hardened: attempt.hardened
      });

      const durationMs = Date.now() - attemptStartedAt;
      logYoutube('youtube_download_attempt_succeeded', {
        provider: 'youtube',
        itemId,
        batchId: batchId ?? null,
        url,
        attempt: attempts,
        strategy: attempt.strategyName,
        ytdlp_mode: attempt.hardened ? 'safe' : 'fast',
        cookies_mode: attempt.cookiesMode,
        duration_ms: durationMs
      });
      logYoutube('youtube_download_pipeline_succeeded', {
        provider: 'youtube',
        itemId,
        batchId: batchId ?? null,
        url,
        total_attempts: attempts,
        fallback_attempts: fallbackAttempts,
        duration_ms: Date.now() - startedAt
      });
      recordProviderSuccess('youtube', { afterFallback: fallbackAttempts > 0 });
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      lastStderr = error instanceof YtDlpError ? error.stderr : lastError.message;
      lastClassification = classifyYoutubeError(lastStderr);
      const durationMs = Date.now() - attemptStartedAt;

      logYoutube('youtube_download_attempt_failed', {
        provider: 'youtube',
        itemId,
        batchId: batchId ?? null,
        url,
        attempt: attempts,
        strategy: attempt.strategyName,
        ytdlp_mode: attempt.hardened ? 'safe' : 'fast',
        cookies_mode: attempt.cookiesMode,
        error_category: lastClassification.code,
        stderr_summary: lastStderr.slice(0, 400),
        duration_ms: durationMs
      });

      const loweredStderr = lastStderr.toLowerCase();
      if (
        !dynamicProbeQueued &&
        format !== 'mp3' &&
        (loweredStderr.includes('requested format is not available') || loweredStderr.includes('no video formats found'))
      ) {
        try {
          const dynamicSelector = await probeYoutubeFormats(url, outputFileName, attempt, context);
          if (dynamicSelector) {
            dynamicProbeQueued = true;
            queue.unshift({
              ...attempt,
              selector: dynamicSelector,
              selectorIndex: attempt.selectorIndex,
              hardened: true,
              strategyName: 'dynamic_format_probe'
            });
            continue;
          }
        } catch (probeError) {
          console.warn(
            JSON.stringify({
              msg: 'youtube_format_probe_failed',
              provider: 'youtube',
              itemId,
              batchId: batchId ?? null,
              url,
              error: probeError instanceof Error ? probeError.message : String(probeError)
            })
          );
        }
      }

      if (isYoutubePermanentCode(lastClassification.code)) break;
      if (isYoutubeAuthCode(lastClassification.code) && cookieModes.length === 0) break;

      const next = planYoutubeNextAttempts({
        failedAttempt: attempt,
        classification: lastClassification,
        formatSelectorCount: formatSelectors.length,
        availableCookieModes: cookieModes
      });
      queue.push(...next);
    }
  }

  const code = lastClassification.code;
  const finalMsg = `${code}: ${lastStderr.slice(0, 500)}`;
  logYoutube('youtube_download_pipeline_failed', {
    provider: 'youtube',
    itemId,
    batchId: batchId ?? null,
    url,
    total_attempts: attempts,
    duration_ms: Date.now() - startedAt,
    error_category: code,
    stderr_summary: lastStderr.slice(0, 400),
    final_outcome: isYoutubeHealthPermanentFailure(code) ? 'permanent_failure' : 'transient_failure'
  });
  recordProviderFailure('youtube', code, { permanent: isYoutubeHealthPermanentFailure(code) });
  throw new Error(finalMsg || (lastError?.message ?? 'youtube_unknown'));
}
