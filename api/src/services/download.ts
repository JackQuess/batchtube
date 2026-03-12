/**
 * DOWNLOAD ENGINE LAYER
 * Actual file download only (after user confirms). Uses yt-dlp, retries, format/cookie fallback, ffmpeg, then storage.
 * Success: returns { filePath, mimeType, ext }. Failure: throws with message that may start with ProviderErrorCode (e.g. youtube_age_restricted).
 * See types/providerEngine.ts ProviderDownloadResult for the standard contract.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { config } from '../config.js';
import { recordProviderFailure } from './providerHealth.js';
import { ensureShortFormMp4Compatibility } from './compatibility.js';

const YT_DLP = 'yt-dlp';
const MAX_STDERR_LOG = 2000;

/** Thrown when yt-dlp exits non-zero; carries stderr for error classification. */
export class YtDlpError extends Error {
  stderr: string;
  exitCode: number;
  constructor(message: string, stderr: string, exitCode: number) {
    super(message);
    this.name = 'YtDlpError';
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

/** Optional options for runYtDlp (YouTube: extractor args + diagnostics). */
export interface RunYtDlpOptions {
  /** e.g. "youtube:player_client=web,web_safari,tv_embedded" */
  extractorArgs?: string;
  /** For diagnostics: primary = first client strategy, fallback = retry with alternate clients */
  attemptType?: 'primary' | 'fallback';
  /** 0-based index of client strategy (for logging). */
  strategyIndex?: number;
  itemId?: string;
  url?: string;
}

export type DownloadFormat = 'mp4' | 'mp3' | 'mkv';
export type DownloadQuality = 'best' | '4k' | '1080p' | '720p';

export interface DownloadOptions {
  format?: DownloadFormat;
  quality?: DownloadQuality;
}

const QUALITY_SELECTORS: Record<DownloadQuality, string> = {
  best: 'bv*+ba/b',
  '4k': 'bestvideo[height<=2160]+bestaudio/best',
  '1080p': 'bestvideo[height<=1080]+bestaudio/best',
  '720p': 'bestvideo[height<=720]+bestaudio/best'
};

/** When format is MP4, prefer H.264 (avc1) so the file plays in QuickTime Player / default macOS players. */
const QUALITY_SELECTORS_MP4_QUICKTIME: Record<DownloadQuality, string> = {
  best: 'bestvideo[vcodec^=avc1]+bestaudio/best/bv*+ba/b',
  '4k': 'bestvideo[vcodec^=avc1][height<=2160]+bestaudio/best/bestvideo[height<=2160]+bestaudio/best',
  '1080p': 'bestvideo[vcodec^=avc1][height<=1080]+bestaudio/best/bestvideo[height<=1080]+bestaudio/best',
  '720p': 'bestvideo[vcodec^=avc1][height<=720]+bestaudio/best/bestvideo[height<=720]+bestaudio/best'
};

/** YouTube-specific: errors that suggest retrying with cookies. */
const YOUTUBE_AUTH_ERROR_PATTERNS = [
  'Sign in to confirm your age',
  'confirm your age',
  'This video may be inappropriate',
  'HTTP Error 403',
  'Login required',
  'login to view',
  'Video unavailable',
  'video is unavailable'
];

/** YouTube-specific: do not retry (permanent failure). */
const YOUTUBE_NON_RETRIABLE_PATTERNS = [
  'Private video',
  'private video',
  'Video unavailable',
  'video is unavailable',
  'unavailable'
];

/** YouTube-specific: transient/retriable (network, extractor, temporary HTTP). */
const YOUTUBE_RETRIABLE_PATTERNS = [
  'HTTP Error 5',
  'ExtractorError',
  'extractor',
  'network',
  'Network',
  'timeout',
  'Timeout',
  'ETIMEDOUT',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN'
];

export type YoutubeErrorCode =
  | 'youtube_login_required'
  | 'youtube_unavailable'
  | 'youtube_region_restricted'
  | 'youtube_bot_check'
  | 'youtube_private_or_removed'
  | 'youtube_client_failed'
  | 'youtube_private_video'
  | 'youtube_age_restricted'
  | 'youtube_extractor_error'
  | 'youtube_download_error'
  | 'youtube_unknown';

/**
 * Classify yt-dlp DOWNLOAD stderr into a single code. Used only in the Download Engine path.
 * Only classify youtube_age_restricted when the error explicitly signals age restriction;
 * generic "Sign in to confirm" (without "your age") is login_required, not age_restricted.
 * Returns clientRetriable for youtube_unavailable so caller can retry with alternate player_client.
 */
export function classifyYoutubeError(stderr: string): {
  code: YoutubeErrorCode;
  retriable: boolean;
  authError: boolean;
  /** True when error may be resolved by trying a different player_client (e.g. in datacenter). */
  clientRetriable?: boolean;
} {
  const s = (stderr || '').toLowerCase();
  const raw = stderr || '';

  if (raw.includes('Private video') || raw.includes('private video') || s.includes('private')) {
    return { code: 'youtube_private_or_removed', retriable: false, authError: false };
  }
  // Explicit age restriction only — do not map generic "Sign in to confirm" to age_restricted
  if (
    s.includes('sign in to confirm your age') ||
    s.includes('confirm your age') ||
    s.includes('age-restricted') ||
    s.includes('this video may be inappropriate') ||
    (s.includes('inappropriate') && (s.includes('age') || s.includes('confirm')))
  ) {
    return { code: 'youtube_age_restricted', retriable: false, authError: true };
  }
  if (s.includes('login required') || s.includes('login to view') || s.includes('sign in to confirm')) {
    return { code: 'youtube_login_required', retriable: false, authError: true };
  }
  if (s.includes('not available in your country') || s.includes('region') && s.includes('restrict')) {
    return { code: 'youtube_region_restricted', retriable: false, authError: false };
  }
  if (
    s.includes('verify you are human') ||
    s.includes('bot') ||
    s.includes('automation') ||
    s.includes('captcha') ||
    raw.includes('Pardon the Interruption')
  ) {
    return { code: 'youtube_bot_check', retriable: true, authError: false };
  }
  if (s.includes('video unavailable') || s.includes('unavailable')) {
    return {
      code: 'youtube_unavailable',
      retriable: false,
      authError: false,
      clientRetriable: true
    };
  }
  if (s.includes('extractorerror') || s.includes('extractor') || s.includes('player_client')) {
    return { code: 'youtube_extractor_error', retriable: true, authError: false, clientRetriable: true };
  }
  if (
    s.includes('http error 5') ||
    s.includes('etimedout') ||
    s.includes('econnreset') ||
    s.includes('enotfound') ||
    s.includes('eai_again') ||
    s.includes('network') ||
    s.includes('timeout')
  ) {
    return { code: 'youtube_download_error', retriable: true, authError: false };
  }
  if (raw.includes('HTTP Error 403')) {
    return { code: 'youtube_login_required', retriable: false, authError: true };
  }

  return { code: 'youtube_unknown', retriable: true, authError: false };
}

/** YouTube player_client strategies tried in order on "Video unavailable" (datacenter hardening). First is safer for bot detection (web_safari first). */
const YOUTUBE_CLIENT_STRATEGIES: readonly string[] = [
  'youtube:player_client=web_safari,web,tv',
  'youtube:player_client=web,web_safari,tv_embedded',
  'youtube:player_client=android,tv_embedded,web',
  'youtube:player_client=ios,tv_embedded,web',
  'youtube:player_client=mweb,tv_embedded,web'
];
const YOUTUBE_CLIENT_STRATEGY_DELAY_MS = 1500;

/** Browser-like User-Agent for YouTube to reduce bot detection (Chrome on macOS). */
const YOUTUBE_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/** Primary (first) strategy - keep for backward-compat log names. */
const YOUTUBE_EXTRACTOR_ARGS_PRIMARY = YOUTUBE_CLIENT_STRATEGIES[0]!;
/** Fallback strategy - used when we only try one fallback (e.g. cookie retry). */
const YOUTUBE_EXTRACTOR_ARGS_FALLBACK = YOUTUBE_CLIENT_STRATEGIES[1]!;

function runYtDlp(
  url: string,
  format: DownloadFormat,
  qualityOrSelector: string,
  outputFileName: string,
  useCookies: boolean,
  options?: RunYtDlpOptions
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  const dir = path.join(tmpdir(), `batchtube-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  fs.mkdirSync(dir, { recursive: true });
  const outputTemplate = path.join(dir, `${outputFileName}.%(ext)s`);

  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
    '-o', outputTemplate,
    '--no-check-certificate'
  ];
  const cookiesPath = config.ytDlpCookiesPath?.trim();
  if (useCookies && cookiesPath && fs.existsSync(cookiesPath)) {
    args.push('--cookies', cookiesPath);
  }
  const isYoutubeInvocation = Boolean(options?.extractorArgs);
  if (isYoutubeInvocation) {
    args.push('--impersonate', 'chrome');
    args.push('--add-header', `User-Agent: ${YOUTUBE_USER_AGENT}`);
  }
  if (options?.extractorArgs) {
    args.push('--extractor-args', options.extractorArgs);
  }
  if (format === 'mp3') {
    args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    args.push('-f', qualityOrSelector);
    if (format === 'mp4') {
      args.push('--merge-output-format', 'mp4');
    } else if (format === 'mkv') {
      args.push('--merge-output-format', 'mkv');
    }
  }
  args.push(url);

  // Diagnostics for YouTube (datacenter debugging)
  if (options?.itemId != null || options?.url) {
    const safeArgs = args.map((a) => (a === cookiesPath ? '<cookies>' : a));
    const sanitizedCommand =
      YT_DLP +
      ' ' +
      safeArgs.map((a) => (a.startsWith('-') ? a : a.includes(' ') ? `"${a}"` : a)).join(' ');
    let cookieSize: number | null = null;
    if (cookiesPath && fs.existsSync(cookiesPath)) {
      try {
        cookieSize = fs.statSync(cookiesPath).size;
      } catch { /* ignore */ }
    }
    logYoutube('youtube_ytdlp_run', {
      itemId: options.itemId,
      url: options.url,
      attemptType: options.attemptType ?? 'primary',
      strategyIndex: options.strategyIndex,
      extractorArgs: options.extractorArgs ?? null,
      cookiePath: cookiesPath || null,
      cookieSizeBytes: cookieSize,
      impersonate: isYoutubeInvocation ? 'chrome' : null,
      userAgent: isYoutubeInvocation ? YOUTUBE_USER_AGENT : null,
      ytdlpArgs: safeArgs,
      ytdlpCommandSanitized: sanitizedCommand
    });
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(YT_DLP, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stderr = '';
    proc.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('error', (err) => {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
      reject(new Error(`yt-dlp spawn failed: ${err.message}. Is yt-dlp installed?`));
    });
    proc.on('close', (code) => {
      if (code !== 0) {
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
        const errSnippet = stderr.length > MAX_STDERR_LOG ? stderr.slice(-MAX_STDERR_LOG) : stderr;
        reject(new YtDlpError(`yt-dlp exited ${code}`, errSnippet.trim() || 'no stderr', code ?? -1));
        return;
      }
      const files = fs.readdirSync(dir);
      const outFile = files.find((f) => f.startsWith(outputFileName));
      if (!outFile) {
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
        reject(new Error('yt-dlp did not produce an output file'));
        return;
      }
      const filePath = path.join(dir, outFile);
      const ext = path.extname(outFile).slice(1).toLowerCase();
      const mimeType = ext === 'mp4' || ext === 'm4a' ? 'video/mp4' : ext === 'mkv' ? 'video/x-matroska' : ext === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';
      resolve({ filePath, mimeType, ext });
    });
  });
}

const YOUTUBE_VIDEO_FORMAT_FALLBACK = [
  'bestvideo+bestaudio/best',
  'best',
  'bestaudio'
];

/** For MP4 output, try H.264 first so QuickTime Player can play the file. */
const YOUTUBE_VIDEO_FORMAT_FALLBACK_MP4 = [
  'bestvideo[vcodec^=avc1]+bestaudio/best',
  'bestvideo+bestaudio/best',
  'best',
  'bestaudio'
];

const YOUTUBE_RETRY_ATTEMPTS = 2;
const YOUTUBE_BACKOFF_BASE_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function logYoutube(
  msg: string,
  extra: Record<string, unknown> & { itemId?: string; url?: string }
): void {
  console.log(JSON.stringify({ msg, ...extra }));
}

/**
 * YouTube-only pipeline: when cookies are configured, use them from the first attempt
 * (same as local: yt-dlp --cookies cookies.txt). Otherwise try without, then cookie retry on auth errors;
 * format fallback bestvideo+bestaudio/best → best → bestaudio;
 * up to 2 retries with exponential backoff for transient errors.
 */
async function downloadYouTube(
  url: string,
  format: DownloadFormat,
  quality: DownloadQuality,
  outputFileName: string,
  itemId: string
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  const cookiesPath = config.ytDlpCookiesPath?.trim();
  const cookieFileExists = Boolean(cookiesPath && fs.existsSync(cookiesPath));
  const useCookiesFirst = cookieFileExists;

  if (cookieFileExists) {
    try {
      const stat = fs.statSync(cookiesPath);
      logYoutube('youtube_cookie_file_used', {
        itemId,
        url,
        cookiesPath,
        sizeBytes: stat.size,
        hint: 'Using cookies on first attempt (same as local yt-dlp --cookies).'
      });
    } catch {
      logYoutube('youtube_cookie_file_used', { itemId, url, cookiesPath, hint: 'Cookie file exists.' });
    }
  }

  logYoutube('youtube_metadata_start', { itemId, url, format, quality });
  logYoutube('youtube_download_start', { itemId, url, format, quality });

  const ytOpts = (extractorArgs: string, attemptType: 'primary' | 'fallback', strategyIndex: number) => ({
    extractorArgs,
    attemptType,
    strategyIndex,
    itemId,
    url
  });

  const formatChain =
    format === 'mp3'
      ? ['']
      : format === 'mp4'
        ? YOUTUBE_VIDEO_FORMAT_FALLBACK_MP4
        : YOUTUBE_VIDEO_FORMAT_FALLBACK;

  let lastError: Error | null = null;
  let lastStderr = '';
  let usedFallbackClient = false;

  for (let fmtIndex = 0; fmtIndex < formatChain.length; fmtIndex++) {
    const formatSelector = formatChain[fmtIndex];
    if (fmtIndex > 0) {
      logYoutube('youtube_download_format_fallback', {
        itemId,
        url,
        attemptFormat: formatSelector,
        previousError: lastStderr.slice(0, 500)
      });
    }

    // Try each player_client strategy in order; on "Video unavailable" try next with short delay.
    try {
      let result: { filePath: string; mimeType: string; ext: string } | null = null;
      let lastStrategyIndex = -1;

      const tryRun = async (strategyIndex: number) => {
        const extractorArgs = YOUTUBE_CLIENT_STRATEGIES[strategyIndex]!;
        const attemptType = strategyIndex === 0 ? 'primary' : 'fallback';
        return runYtDlp(url, format, formatSelector, outputFileName, useCookiesFirst, ytOpts(extractorArgs, attemptType, strategyIndex));
      };

      for (let s = 0; s < YOUTUBE_CLIENT_STRATEGIES.length; s++) {
        if (s > 0) {
          usedFallbackClient = true;
          await sleep(YOUTUBE_CLIENT_STRATEGY_DELAY_MS);
          logYoutube('youtube_client_fallback_attempt', {
            itemId,
            url,
            strategyIndex: s,
            extractorArgs: YOUTUBE_CLIENT_STRATEGIES[s],
            previousCode: 'youtube_unavailable'
          });
        }
        try {
          result = await tryRun(s);
          lastStrategyIndex = s;
          usedFallbackClient = s > 0;
          break;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          lastStderr = err instanceof YtDlpError ? err.stderr : lastError.message;
          const classification = err instanceof YtDlpError ? classifyYoutubeError(err.stderr) : null;
          if (classification?.clientRetriable && s < YOUTUBE_CLIENT_STRATEGIES.length - 1) {
            continue;
          }
          throw err;
        }
      }

      if (result) {
        logYoutube('youtube_metadata_success', { itemId, url });
        logYoutube('youtube_download_success', {
          itemId,
          url,
          formatSelector,
          usedCookies: useCookiesFirst,
          usedFallbackClient,
          strategyIndex: lastStrategyIndex
        });
        return result;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      lastStderr = err instanceof YtDlpError ? err.stderr : lastError.message;
      const classification = err instanceof YtDlpError ? classifyYoutubeError(err.stderr) : null;

      if (classification && !classification.retriable && !classification.authError) {
        const codeRaw =
          usedFallbackClient && classification.code === 'youtube_unavailable'
            ? 'youtube_client_failed'
            : classification.code;
        recordProviderFailure('youtube', codeRaw);
        const code = codeRaw;
        logYoutube('youtube_metadata_failed', { itemId, url, code });
        logYoutube('youtube_download_failed', { itemId, url, code, stderrSnippet: lastStderr.slice(0, 300) });
        throw new Error(`${code}: ${lastStderr.slice(0, 500)}`);
      }

      if (classification?.authError && cookieFileExists) {
        logYoutube('youtube_download_cookie_retry', { itemId, url, cookiesPath });
        try {
          const result = await runYtDlp(url, format, formatSelector, outputFileName, true, ytOpts(YOUTUBE_EXTRACTOR_ARGS_PRIMARY, 'primary', 0));
          logYoutube('youtube_metadata_success', { itemId, url });
          logYoutube('youtube_download_success', { itemId, url, formatSelector, usedCookies: true });
          return result;
        } catch (cookieErr) {
          lastError = cookieErr instanceof Error ? cookieErr : new Error(String(cookieErr));
          lastStderr = cookieErr instanceof YtDlpError ? cookieErr.stderr : lastError.message;
          const cookieClass = cookieErr instanceof YtDlpError ? classifyYoutubeError(cookieErr.stderr) : null;
          if (cookieClass && !cookieClass.retriable) {
            logYoutube('youtube_metadata_failed', { itemId, url, code: cookieClass.code });
            logYoutube('youtube_download_failed', {
              itemId,
              url,
              code: cookieClass.code,
              stderrSnippet: lastStderr.slice(0, 300)
            });
            throw new Error(`${cookieClass.code}: ${lastStderr.slice(0, 500)}`);
          }
        }
      }

      if (classification?.retriable) {
        for (let r = 0; r < YOUTUBE_RETRY_ATTEMPTS; r++) {
          const delay = YOUTUBE_BACKOFF_BASE_MS * Math.pow(2, r);
          logYoutube('youtube_download_retry', {
            itemId,
            url,
            attempt: r + 1,
            maxAttempts: YOUTUBE_RETRY_ATTEMPTS,
            delayMs: delay
          });
          await sleep(delay);
          try {
            const result = await runYtDlp(url, format, formatSelector, outputFileName, cookieFileExists, ytOpts(YOUTUBE_EXTRACTOR_ARGS_PRIMARY, 'primary', 0));
            logYoutube('youtube_metadata_success', { itemId, url });
            logYoutube('youtube_download_success', { itemId, url, formatSelector, afterRetry: true });
            return result;
          } catch (retryErr) {
            lastError = retryErr instanceof Error ? retryErr : new Error(String(retryErr));
            lastStderr = retryErr instanceof YtDlpError ? retryErr.stderr : lastError.message;
            const retryClass = retryErr instanceof YtDlpError ? classifyYoutubeError(retryErr.stderr) : null;
            if (retryClass && !retryClass.retriable) {
              logYoutube('youtube_metadata_failed', { itemId, url, code: retryClass.code });
              logYoutube('youtube_download_failed', {
                itemId,
                url,
                code: retryClass.code,
                stderrSnippet: lastStderr.slice(0, 300)
              });
              throw new Error(`${retryClass.code}: ${lastStderr.slice(0, 500)}`);
            }
          }
        }
      }
    }
  }

  const rawCode = classifyYoutubeError(lastStderr).code;
  const code =
    usedFallbackClient && rawCode === 'youtube_unavailable' ? 'youtube_client_failed' : rawCode;
  recordProviderFailure('youtube', code);
  logYoutube('youtube_metadata_failed', { itemId, url, code });
  logYoutube('youtube_download_failed', { itemId, url, code, stderrSnippet: lastStderr.slice(0, 300) });
  throw new Error(`${code}: ${lastStderr.slice(0, 500)}`);
}

/**
 * Run yt-dlp and return the path to the downloaded file and its mime type.
 * Optional: YT_DLP_COOKIES_FILE env for age-restricted / login-required content.
 * For YouTube: uses no-cookie first, cookie retry on auth errors, format fallback, and transient retries.
 * For other providers: unchanged (single run with cookies if configured, one format fallback for video).
 */
export function downloadWithYtDlp(
  url: string,
  options: DownloadOptions,
  outputFileName: string,
  provider?: string
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  const format = options.format ?? 'mp4';
  const quality = options.quality ?? 'best';
  const selector =
    format === 'mp4'
      ? QUALITY_SELECTORS_MP4_QUICKTIME[quality]
      : QUALITY_SELECTORS[quality];

  if (provider === 'youtube') {
    const ytResult = await downloadYouTube(url, format, quality, outputFileName, outputFileName);
    // YouTube short-form content (Shorts) is generally compatible; do not run
    // extra normalization here to keep latency low.
    return ytResult;
  }

  const baseResult = await runYtDlp(url, format, selector, outputFileName, true).catch((firstErr) => {
    if (format === 'mp3') throw firstErr;
    return runYtDlp(url, format, 'bv*+ba/b', outputFileName, true).catch(() => {
      throw firstErr;
    });
  });

  // Optional short-form MP4 compatibility normalization for Instagram/TikTok only.
  try {
    const compat = await ensureShortFormMp4Compatibility(provider ?? 'generic', baseResult);
    if (compat !== baseResult) {
      console.log(
        JSON.stringify({
          msg: 'compatibility_transcode_succeeded',
          provider,
          originalExt: baseResult.ext,
          normalizedExt: compat.ext
        })
      );
    }
    return compat;
  } catch (compatErr) {
    const err = compatErr instanceof Error ? compatErr : new Error(String(compatErr));
    console.error(
      JSON.stringify({
        msg: 'compatibility_transcode_failed',
        provider,
        error: err.message
      })
    );
    throw err;
  }
}

/**
 * Read file into buffer and remove the temp dir. Use after downloadWithYtDlp.
 */
export function readDownloadAndCleanup(result: { filePath: string }): { buffer: Buffer } {
  const buffer = fs.readFileSync(result.filePath);
  const dir = path.dirname(result.filePath);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
  return { buffer };
}
