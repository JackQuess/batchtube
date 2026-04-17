/**
 * DOWNLOAD ENGINE LAYER
 * Actual file download only (after user confirms). Uses yt-dlp, retries, format/cookie fallback, ffmpeg, then storage.
 * Success: returns { filePath, mimeType, ext }. Failure: throws with message that may start with ProviderErrorCode.
 * See types/providerEngine.ts ProviderDownloadResult for the standard contract.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { config } from '../config.js';
import { recordProviderFailure, recordProviderSuccess } from './providerHealth.js';
import type { ProviderName } from './providerHealth.js';
import { ensureShortFormMp4Compatibility } from './compatibility.js';

const YT_DLP = 'yt-dlp';
const MAX_STDERR_LOG = 2000;
const YTDLP_VERSION_TIMEOUT_MS = 5000;

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

export type DownloadFormat = 'mp4' | 'mp3' | 'mkv';
export type DownloadQuality = 'best' | '4k' | '1080p' | '720p';
type YtDlpCookiesMode = 'none' | 'file' | 'browser';

export interface DownloadOptions {
  format?: DownloadFormat;
  quality?: DownloadQuality;
}

export interface DownloadContext {
  batchId?: string;
}

/** Optional options for runYtDlp (YouTube: extractor args + diagnostics). */
export interface RunYtDlpOptions {
  extractorArgs?: string;
  extraHeaders?: Array<{ key: string; value: string }>;
  strategyName?: string;
  strategyIndex?: number;
  attempt?: number;
  itemId?: string;
  batchId?: string;
  provider?: string;
  cookiesMode?: YtDlpCookiesMode;
  hardened?: boolean;
  timeoutMs?: number;
  /** Optional seconds between HTTP requests (yt-dlp --sleep-requests); helps aggressive providers like Instagram. */
  sleepRequestsSec?: number;
  /** Override -N concurrent fragments (default from config by hardened mode). */
  concurrentFragmentsOverride?: number;
}

const QUALITY_SELECTORS: Record<DownloadQuality, string> = {
  best: 'bv*+ba/b',
  '4k': 'bestvideo[height<=2160]+bestaudio/best',
  '1080p': 'bestvideo[height<=1080]+bestaudio/best',
  '720p': 'bestvideo[height<=720]+bestaudio/best'
};

/** When format is MP4, prefer H.264 (avc1) so the file plays in QuickTime Player / default macOS players. */
const QUALITY_SELECTORS_MP4_QUICKTIME: Record<DownloadQuality, string> = {
  best: 'bv*[vcodec^=avc1][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*[vcodec^=avc1]+ba/b',
  '4k': 'bv*[vcodec^=avc1][height<=2160][ext=mp4]+ba[ext=m4a]/b[height<=2160][ext=mp4]/bv*[height<=2160]+ba/b[height<=2160]',
  '1080p': 'bv*[vcodec^=avc1][height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]/bv*[height<=1080]+ba/b[height<=1080]',
  '720p': 'bv*[vcodec^=avc1][height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]/bv*[height<=720]+ba/b[height<=720]'
};

const YOUTUBE_CLIENT_STRATEGIES: readonly string[] = [
  'youtube:player_client=web',
  'youtube:player_client=web_safari',
  'youtube:player_client=android,tv_embedded,web'
];

const YOUTUBE_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const YOUTUBE_VIDEO_FORMAT_FALLBACK = ['bestvideo+bestaudio/best', 'best', 'bestaudio'];
const YOUTUBE_VIDEO_FORMAT_FALLBACK_MP4 = [
  'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]',
  'bestvideo[vcodec^=avc1]+bestaudio/best',
  'bestvideo+bestaudio/best',
  'best'
];

export type YoutubeErrorCode =
  | 'youtube_transient'
  | 'youtube_antibot'
  | 'youtube_login_required'
  | 'youtube_private'
  | 'youtube_geo_restricted'
  | 'youtube_cookies_required'
  | 'youtube_rate_limited'
  | 'youtube_extractor_failure'
  | 'youtube_unknown';

export interface YoutubeErrorClassification {
  code: YoutubeErrorCode;
  retriable: boolean;
  authError: boolean;
  clientRetriable: boolean;
}

export interface YoutubeAttempt {
  selector: string;
  selectorIndex: number;
  cookiesMode: YtDlpCookiesMode;
  hardened: boolean;
  clientStrategyIndex: number;
  strategyName: string;
}

interface YtDlpProbeFormat {
  format_id?: string;
  ext?: string;
  acodec?: string;
  vcodec?: string;
  height?: number | null;
  protocol?: string;
  filesize?: number | null;
  tbr?: number | null;
}

interface YtDlpProbePayload {
  formats?: YtDlpProbeFormat[];
}

interface BuildYtDlpArgsInput {
  url: string;
  format: DownloadFormat;
  qualityOrSelector: string;
  outputTemplate: string;
  cookiesMode: YtDlpCookiesMode;
  options?: RunYtDlpOptions;
}

let ytDlpVersionProbe: Promise<void> | null = null;

export type GenericProviderErrorCode =
  | 'provider_rate_limited'
  | 'provider_access_denied'
  | 'provider_auth_required'
  | 'provider_geo_restricted'
  | 'provider_source_unavailable'
  | 'provider_unsupported'
  | 'provider_transient'
  | 'provider_extractor_failure'
  | 'provider_unknown_failure';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logYoutube(
  msg: string,
  extra: Record<string, unknown> & { itemId?: string; url?: string; batchId?: string | null }
): void {
  console.log(JSON.stringify({ msg, ...extra }));
}

function sanitizeStderr(stderr: string): string {
  const trimmed = stderr.trim();
  return trimmed.length > MAX_STDERR_LOG ? trimmed.slice(-MAX_STDERR_LOG) : trimmed;
}

function toHealthProvider(provider?: string): ProviderName {
  const p = (provider ?? '').toLowerCase();
  if (p === 'youtube' || p === 'instagram' || p === 'tiktok' || p === 'vimeo' || p === 'direct') {
    return p;
  }
  return 'generic';
}

function isYoutubeRetriableCode(code: YoutubeErrorCode): boolean {
  return (
    code === 'youtube_transient' ||
    code === 'youtube_antibot' ||
    code === 'youtube_rate_limited' ||
    code === 'youtube_extractor_failure' ||
    code === 'youtube_unknown'
  );
}

function isYoutubeAuthCode(code: YoutubeErrorCode): boolean {
  return code === 'youtube_login_required' || code === 'youtube_cookies_required';
}

function isYoutubePermanentCode(code: YoutubeErrorCode): boolean {
  return code === 'youtube_private' || code === 'youtube_geo_restricted';
}

function parseVersionDate(rawVersion: string): number | null {
  const cleaned = rawVersion.trim();
  const m = cleaned.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (!m) return null;
  return Number(`${m[1]}${m[2]}${m[3]}`);
}

async function ensureYtDlpVersionLogged(): Promise<void> {
  if (ytDlpVersionProbe) return ytDlpVersionProbe;

  ytDlpVersionProbe = new Promise((resolve) => {
    const proc = spawn(YT_DLP, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const timeout = setTimeout(() => {
      try {
        proc.kill('SIGTERM');
      } catch {
        // ignore
      }
      if (!settled) {
        settled = true;
        console.warn(JSON.stringify({ msg: 'ytdlp_version_check_timeout', timeout_ms: YTDLP_VERSION_TIMEOUT_MS }));
        resolve();
      }
    }, YTDLP_VERSION_TIMEOUT_MS);

    proc.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      console.warn(JSON.stringify({ msg: 'ytdlp_version_check_failed', error: err.message }));
      resolve();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      const version = stdout.trim();
      const dateNum = parseVersionDate(version);
      const minDateNum = parseVersionDate(config.ytDlpMinVersionDate);

      console.log(
        JSON.stringify({
          msg: 'ytdlp_version_detected',
          version: version || null,
          exitCode: code ?? null,
          stderr: stderr.trim().slice(0, 200) || null
        })
      );

      if (dateNum != null && minDateNum != null && dateNum < minDateNum) {
        console.warn(
          JSON.stringify({
            msg: 'ytdlp_version_outdated',
            version,
            minRecommended: config.ytDlpMinVersionDate
          })
        );
      }
      resolve();
    });
  });

  return ytDlpVersionProbe;
}

function resolveCookieModes(): YtDlpCookiesMode[] {
  const modes: YtDlpCookiesMode[] = [];
  const filePath = config.ytDlpCookiesPath.trim();
  if (filePath && fs.existsSync(filePath)) modes.push('file');
  if (config.ytDlpCookiesFromBrowser.trim()) modes.push('browser');
  return modes;
}

function resolveGenericCookieModes(): YtDlpCookiesMode[] {
  const modes = new Set<YtDlpCookiesMode>();
  const filePath = config.ytDlpCookiesPath.trim();
  const preferred: YtDlpCookiesMode = filePath && fs.existsSync(filePath)
    ? 'file'
    : config.ytDlpCookiesFromBrowser.trim()
      ? 'browser'
      : 'none';

  modes.add(preferred);
  modes.add('none');
  for (const mode of resolveCookieModes()) modes.add(mode);

  return [...modes];
}

function cookiesModeIsAvailable(mode: YtDlpCookiesMode): boolean {
  if (mode === 'none') return true;
  if (mode === 'file') {
    const filePath = config.ytDlpCookiesPath.trim();
    return Boolean(filePath && fs.existsSync(filePath));
  }
  return Boolean(config.ytDlpCookiesFromBrowser.trim());
}

export function classifyYoutubeError(stderr: string): YoutubeErrorClassification {
  const raw = stderr || '';
  const s = raw.toLowerCase();

  if (
    s.includes('private video') ||
    s.includes('this video is private') ||
    s.includes('has been removed') ||
    (s.includes('video unavailable') && (s.includes('private') || s.includes('removed')))
  ) {
    return { code: 'youtube_private', retriable: false, authError: false, clientRetriable: false };
  }

  if (
    s.includes('not available in your country') ||
    (s.includes('region') && s.includes('restrict')) ||
    s.includes('geo-restricted')
  ) {
    return { code: 'youtube_geo_restricted', retriable: false, authError: false, clientRetriable: false };
  }

  if (
    s.includes('sign in to confirm your age') ||
    s.includes('confirm your age') ||
    s.includes('age-restricted')
  ) {
    return { code: 'youtube_cookies_required', retriable: false, authError: true, clientRetriable: false };
  }

  if (
    s.includes('login required') ||
    s.includes('sign in to confirm') ||
    s.includes('http error 403') ||
    s.includes('members-only content')
  ) {
    return { code: 'youtube_login_required', retriable: false, authError: true, clientRetriable: false };
  }

  if (
    s.includes('too many requests') ||
    s.includes('rate limit') ||
    s.includes('http error 429') ||
    s.includes('temporarily blocked')
  ) {
    return { code: 'youtube_rate_limited', retriable: true, authError: false, clientRetriable: true };
  }

  if (
    s.includes('the page needs to be reloaded') ||
    s.includes('verify you are human') ||
    s.includes('captcha') ||
    s.includes('bot') ||
    s.includes('automation') ||
    raw.includes('Pardon the Interruption')
  ) {
    return { code: 'youtube_antibot', retriable: true, authError: false, clientRetriable: true };
  }

  if (
    s.includes('requested format is not available') ||
    s.includes('requested format not available') ||
    s.includes('requested format is not') ||
    s.includes('no video formats found')
  ) {
    return { code: 'youtube_extractor_failure', retriable: true, authError: false, clientRetriable: false };
  }

  if (
    s.includes('extractorerror') ||
    s.includes('unable to extract') ||
    s.includes('nsig extraction failed') ||
    s.includes('player_response') ||
    s.includes('signature extraction failed') ||
    s.includes('video unavailable')
  ) {
    return { code: 'youtube_extractor_failure', retriable: true, authError: false, clientRetriable: true };
  }

  if (
    s.includes('http error 5') ||
    s.includes('network') ||
    s.includes('etimedout') ||
    s.includes('econnreset') ||
    s.includes('enotfound') ||
    s.includes('eai_again') ||
    s.includes('timeout')
  ) {
    return { code: 'youtube_transient', retriable: true, authError: false, clientRetriable: false };
  }

  return { code: 'youtube_unknown', retriable: true, authError: false, clientRetriable: false };
}

function getYoutubeFormatSelectors(format: DownloadFormat, quality: DownloadQuality): string[] {
  if (format === 'mp3') return [''];
  const primary = format === 'mp4' ? QUALITY_SELECTORS_MP4_QUICKTIME[quality] : QUALITY_SELECTORS[quality];
  const fallback = format === 'mp4' ? YOUTUBE_VIDEO_FORMAT_FALLBACK_MP4 : YOUTUBE_VIDEO_FORMAT_FALLBACK;
  return [...new Set([primary, ...fallback])];
}

function getYoutubeAttemptKey(attempt: YoutubeAttempt): string {
  return [
    attempt.selector,
    attempt.selectorIndex,
    attempt.cookiesMode,
    attempt.hardened ? 'h' : 'f',
    attempt.clientStrategyIndex
  ].join(':');
}

export function planYoutubeNextAttempts(input: {
  failedAttempt: YoutubeAttempt;
  classification: YoutubeErrorClassification;
  formatSelectorCount: number;
  availableCookieModes: YtDlpCookiesMode[];
}): YoutubeAttempt[] {
  const { failedAttempt, classification, formatSelectorCount, availableCookieModes } = input;
  const out: YoutubeAttempt[] = [];
  const push = (attempt: YoutubeAttempt) => out.push(attempt);

  if (isYoutubePermanentCode(classification.code)) return out;

  if (isYoutubeAuthCode(classification.code)) {
    if (failedAttempt.cookiesMode === 'none') {
      for (const cookieMode of availableCookieModes) {
        push({
          ...failedAttempt,
          cookiesMode: cookieMode,
          hardened: true,
          clientStrategyIndex: 0,
          strategyName: `auth_cookie_${cookieMode}`
        });
      }
    }
    return out;
  }

  if (!classification.retriable) return out;

  if (!failedAttempt.hardened) {
    push({
      ...failedAttempt,
      hardened: true,
      strategyName: `${failedAttempt.strategyName}_hardened`
    });
  }

  if (classification.clientRetriable && failedAttempt.clientStrategyIndex === 0) {
    push({
      ...failedAttempt,
      hardened: true,
      clientStrategyIndex: 1,
      strategyName: `${failedAttempt.strategyName}_alt_client_1`
    });
    if (YOUTUBE_CLIENT_STRATEGIES.length > 2) {
      push({
        ...failedAttempt,
        hardened: true,
        clientStrategyIndex: 2,
        strategyName: `${failedAttempt.strategyName}_alt_client_2`
      });
    }
  }

  if (failedAttempt.cookiesMode === 'none') {
    for (const cookieMode of availableCookieModes) {
      push({
        ...failedAttempt,
        cookiesMode: cookieMode,
        hardened: true,
        clientStrategyIndex: 0,
        strategyName: `${failedAttempt.strategyName}_cookie_${cookieMode}`
      });
    }
  }

  if (failedAttempt.selectorIndex < formatSelectorCount - 1 && isYoutubeRetriableCode(classification.code)) {
    push({
      ...failedAttempt,
      selectorIndex: failedAttempt.selectorIndex + 1,
      cookiesMode: failedAttempt.cookiesMode,
      hardened: true,
      clientStrategyIndex: 0,
      strategyName: `format_fallback_${failedAttempt.selectorIndex + 1}`
    });
  }

  return out;
}

function targetHeightForQuality(quality: DownloadQuality): number | null {
  if (quality === '4k') return 2160;
  if (quality === '1080p') return 1080;
  if (quality === '720p') return 720;
  return null;
}

function protocolPenalty(protocol?: string): number {
  const p = (protocol ?? '').toLowerCase();
  if (!p) return 2;
  if (p.includes('m3u8')) return 5;
  if (p.includes('http') || p.includes('https')) return 0;
  if (p.includes('dash')) return 1;
  return 3;
}

function rankVideoFormat(fmt: YtDlpProbeFormat, quality: DownloadQuality): number {
  const height = fmt.height ?? 0;
  const target = targetHeightForQuality(quality);
  const avc1Bonus = (fmt.vcodec ?? '').startsWith('avc1') ? 10_000 : 0;
  const mp4Bonus = fmt.ext === 'mp4' ? 5_000 : 0;
  const protocolCost = protocolPenalty(fmt.protocol) * 1_000;
  const sizeScore = Math.trunc(fmt.tbr ?? 0);
  const heightScore = target ? -Math.abs(height - target) : height;
  return avc1Bonus + mp4Bonus + sizeScore + heightScore - protocolCost;
}

function rankAudioFormat(fmt: YtDlpProbeFormat): number {
  const m4aBonus = fmt.ext === 'm4a' ? 5_000 : 0;
  const protocolCost = protocolPenalty(fmt.protocol) * 1_000;
  const bitrateScore = Math.trunc(fmt.tbr ?? 0);
  return m4aBonus + bitrateScore - protocolCost;
}

export function selectYoutubeFormatSelectorFromFormats(
  formats: YtDlpProbeFormat[],
  format: DownloadFormat,
  quality: DownloadQuality
): string | null {
  if (format === 'mp3') return null;

  const usable = formats.filter((fmt) => fmt.format_id);
  const combined = usable
    .filter((fmt) => (fmt.vcodec ?? 'none') !== 'none' && (fmt.acodec ?? 'none') !== 'none')
    .sort((a, b) => rankVideoFormat(b, quality) - rankVideoFormat(a, quality));
  const videoOnly = usable
    .filter((fmt) => (fmt.vcodec ?? 'none') !== 'none' && (fmt.acodec ?? 'none') === 'none')
    .sort((a, b) => rankVideoFormat(b, quality) - rankVideoFormat(a, quality));
  const audioOnly = usable
    .filter((fmt) => (fmt.acodec ?? 'none') !== 'none' && (fmt.vcodec ?? 'none') === 'none')
    .sort((a, b) => rankAudioFormat(b) - rankAudioFormat(a));

  const bestVideo = videoOnly[0];
  const bestAudio = audioOnly[0];
  if (bestVideo?.format_id && bestAudio?.format_id) {
    return `${bestVideo.format_id}+${bestAudio.format_id}`;
  }

  const bestCombined = combined[0];
  if (bestCombined?.format_id) return bestCombined.format_id;
  return null;
}

export function buildYtDlpArgs(input: BuildYtDlpArgsInput): string[] {
  const { url, format, qualityOrSelector, outputTemplate, cookiesMode, options } = input;
  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
    '-o',
    outputTemplate,
    '--no-check-certificate',
    '--socket-timeout',
    String(config.ytDlpSocketTimeoutSec),
    '--retries',
    String(options?.hardened ? config.ytDlpRetriesSafe : config.ytDlpRetriesFast),
    '--fragment-retries',
    String(options?.hardened ? config.ytDlpFragmentRetriesSafe : config.ytDlpFragmentRetriesFast),
    '--file-access-retries',
    '2'
  ];

  if (options?.hardened) {
    args.push('--extractor-retries', String(config.ytDlpExtractorRetriesSafe));
  } else {
    args.push('--extractor-retries', String(config.ytDlpExtractorRetriesFast));
  }

  if (format !== 'mp3') {
    const fragmentConcurrency =
      options?.concurrentFragmentsOverride ??
      (options?.hardened ? config.ytDlpConcurrentFragmentsSafe : config.ytDlpConcurrentFragmentsFast);
    args.push('-N', String(fragmentConcurrency));
  }

  const fileCookiesPath = config.ytDlpCookiesPath.trim();
  if (cookiesMode === 'file' && fileCookiesPath && fs.existsSync(fileCookiesPath)) {
    args.push('--cookies', fileCookiesPath);
  }
  if (cookiesMode === 'browser' && config.ytDlpCookiesFromBrowser.trim()) {
    const browser = config.ytDlpCookiesFromBrowser.trim();
    const profile = config.ytDlpCookiesFromBrowserProfile.trim();
    args.push('--cookies-from-browser', profile ? `${browser}:${profile}` : browser);
  }

  if (options?.extractorArgs) {
    args.push('--add-header', `User-Agent: ${YOUTUBE_USER_AGENT}`);
    args.push('--add-header', 'Accept-Language: en-US,en;q=0.9');
    args.push('--extractor-args', options.extractorArgs);
  }
  if (options?.extraHeaders?.length) {
    for (const header of options.extraHeaders) {
      if (!header.key.trim()) continue;
      args.push('--add-header', `${header.key}: ${header.value}`);
    }
  }

  if (format === 'mp3') {
    args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    args.push('-f', qualityOrSelector);
    if (format === 'mp4') args.push('--merge-output-format', 'mp4');
    if (format === 'mkv') args.push('--merge-output-format', 'mkv');
  }

  if (options?.sleepRequestsSec != null && options.sleepRequestsSec > 0) {
    args.push('--sleep-requests', String(options.sleepRequestsSec));
  }

  args.push(url);
  return args;
}

function runYtDlp(
  url: string,
  format: DownloadFormat,
  qualityOrSelector: string,
  outputFileName: string,
  options?: RunYtDlpOptions
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  const dir = path.join(tmpdir(), `batchtube-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  fs.mkdirSync(dir, { recursive: true });
  const outputTemplate = path.join(dir, `${outputFileName}.%(ext)s`);
  const cookiesMode = options?.cookiesMode ?? 'none';
  const args = buildYtDlpArgs({
    url,
    format,
    qualityOrSelector,
    outputTemplate,
    cookiesMode,
    options
  });

  if (options?.itemId) {
    const fileCookiesPath = config.ytDlpCookiesPath.trim();
    const safeArgs = args.map((arg) => (fileCookiesPath && arg === fileCookiesPath ? '<cookies-file>' : arg));
    logYoutube('youtube_ytdlp_attempt_start', {
      provider: options.provider ?? 'youtube',
      itemId: options.itemId,
      batchId: options.batchId ?? null,
      url,
      attempt: options.attempt ?? null,
      strategy: options.strategyName ?? null,
      ytdlp_mode: options.hardened ? 'safe' : 'fast',
      cookies_mode: cookiesMode,
      strategyIndex: options.strategyIndex ?? null,
      ytdlpArgs: safeArgs
    });
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(YT_DLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    const timeoutMs = options?.timeoutMs ?? config.ytDlpTimeoutMs;

    const timeout = setTimeout(() => {
      try {
        proc.kill('SIGTERM');
      } catch {
        // ignore
      }
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
      reject(new YtDlpError(`yt-dlp timed out after ${timeoutMs}ms`, 'timeout', -2));
    }, timeoutMs);

    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
      reject(new Error(`yt-dlp spawn failed: ${err.message}. Is yt-dlp installed?`));
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch {
          // ignore
        }
        reject(new YtDlpError(`yt-dlp exited ${code}`, sanitizeStderr(stderr) || 'no stderr', code ?? -1));
        return;
      }

      const files = fs.readdirSync(dir);
      const outFile = files.find((f) => f.startsWith(outputFileName));
      if (!outFile) {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch {
          // ignore
        }
        reject(new Error('yt-dlp did not produce an output file'));
        return;
      }

      const filePath = path.join(dir, outFile);
      const ext = path.extname(outFile).slice(1).toLowerCase();
      const mimeType =
        ext === 'mp4' || ext === 'm4a'
          ? 'video/mp4'
          : ext === 'mkv'
            ? 'video/x-matroska'
            : ext === 'mp3'
              ? 'audio/mpeg'
              : 'application/octet-stream';

      resolve({ filePath, mimeType, ext });
    });
  });
}

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
        reject(new YtDlpError(`yt-dlp probe exited ${code}`, sanitizeStderr(stderrChunks.join('')), code ?? -1));
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

async function runYoutubeDownloadWithFallbacks(
  url: string,
  format: DownloadFormat,
  quality: DownloadQuality,
  outputFileName: string,
  context?: DownloadContext
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  await ensureYtDlpVersionLogged();

  const itemId = outputFileName;
  const batchId = context?.batchId;
  const formatSelectors = getYoutubeFormatSelectors(format, quality);
  const cookieModes = resolveCookieModes();
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
  let lastClassification: YoutubeErrorClassification = {
    code: 'youtube_unknown',
    retriable: true,
    authError: false,
    clientRetriable: false
  };
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
    final_outcome: 'permanent_failure'
  });
  recordProviderFailure('youtube', code, { permanent: true });
  throw new Error(finalMsg || (lastError?.message ?? 'youtube_unknown'));
}

export function classifyGenericProviderError(stderr: string): { code: GenericProviderErrorCode; retriable: boolean } {
  const s = (stderr || '').toLowerCase();

  if (s.includes('http error 429') || s.includes('too many requests') || s.includes('rate limit')) {
    return { code: 'provider_rate_limited', retriable: true };
  }
  if (
    s.includes('[instagram') &&
    (s.includes('unable to download') || s.includes('blocking') || s.includes('challenge'))
  ) {
    return { code: 'provider_rate_limited', retriable: true };
  }
  if (s.includes('http error 401') || s.includes('http error 403') || s.includes('forbidden')) {
    return { code: 'provider_access_denied', retriable: true };
  }
  if (s.includes('login required') || s.includes('sign in') || s.includes('authentication')) {
    return { code: 'provider_auth_required', retriable: false };
  }
  if (s.includes('not available in your country') || (s.includes('geo') && s.includes('restrict'))) {
    return { code: 'provider_geo_restricted', retriable: false };
  }
  if (
    s.includes('video unavailable') ||
    s.includes('not found') ||
    s.includes('private') ||
    s.includes('removed') ||
    s.includes('404')
  ) {
    return { code: 'provider_source_unavailable', retriable: false };
  }
  if (s.includes('unsupported url') || s.includes('unsupported') || s.includes('no suitable extractor')) {
    return { code: 'provider_unsupported', retriable: false };
  }
  if (
    s.includes('extractorerror') ||
    s.includes('unable to extract') ||
    s.includes('failed to parse') ||
    s.includes('signature')
  ) {
    return { code: 'provider_extractor_failure', retriable: true };
  }
  if (
    s.includes('http error 5') ||
    s.includes('timeout') ||
    s.includes('network') ||
    s.includes('etimedout') ||
    s.includes('econnreset') ||
    s.includes('eai_again') ||
    s.includes('enotfound')
  ) {
    return { code: 'provider_transient', retriable: true };
  }

  return { code: 'provider_unknown_failure', retriable: true };
}

/** Instagram throttles heavily; slow single-stream pulls and space HTTP calls. */
function ytDlpInstagramThrottleOptions(hardened: boolean): Pick<
  RunYtDlpOptions,
  'sleepRequestsSec' | 'concurrentFragmentsOverride'
> {
  return {
    sleepRequestsSec: hardened ? 3 : 2,
    concurrentFragmentsOverride: 1
  };
}

function buildRefererFallbackHeaders(url: string): Array<Array<{ key: string; value: string }>> {
  try {
    const u = new URL(url);
    const origin = `${u.protocol}//${u.host}/`;
    return [
      [{ key: 'Referer', value: origin }],
      [{ key: 'Referer', value: url }],
      [
        { key: 'Referer', value: origin },
        { key: 'Origin', value: `${u.protocol}//${u.host}` }
      ]
    ];
  } catch {
    return [];
  }
}

async function runGenericProviderDownloadWithFallbacks(
  url: string,
  format: DownloadFormat,
  quality: DownloadQuality,
  outputFileName: string,
  provider?: string,
  context?: DownloadContext
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  const selector = format === 'mp4' ? QUALITY_SELECTORS_MP4_QUICKTIME[quality] : QUALITY_SELECTORS[quality];
  const selectorFallback = 'bv*+ba/b';
  const healthProvider = toHealthProvider(provider);
  const itemId = outputFileName;
  const batchId = context?.batchId;
  const startedAt = Date.now();
  const cookieModes = resolveGenericCookieModes();
  const primaryCookiesMode = cookieModes[0] ?? 'none';
  const isInstagram = (provider ?? '').toLowerCase() === 'instagram';

  const attempts: Array<{
    strategyName: string;
    selector: string;
    hardened: boolean;
    cookiesMode: YtDlpCookiesMode;
    extraHeaders?: Array<{ key: string; value: string }>;
  }> = [
    { strategyName: 'fast_primary', selector, hardened: false, cookiesMode: primaryCookiesMode },
    { strategyName: 'selector_fallback', selector: selectorFallback, hardened: true, cookiesMode: primaryCookiesMode }
  ];

  const refererAttempts = buildRefererFallbackHeaders(url);
  for (let i = 0; i < refererAttempts.length; i++) {
    attempts.push({
      strategyName: `referer_fallback_${i + 1}`,
      selector: selectorFallback,
      hardened: true,
      cookiesMode: primaryCookiesMode,
      extraHeaders: refererAttempts[i]
    });
  }
  for (const mode of cookieModes) {
    if (mode === primaryCookiesMode) continue;
    attempts.push({
      strategyName: `cookie_fallback_${mode}`,
      selector: selectorFallback,
      hardened: true,
      cookiesMode: mode
    });
  }

  let lastErr: Error | null = null;
  let lastStderr = '';
  let lastCode: GenericProviderErrorCode = 'provider_unknown_failure';
  let lastRetriable = true;
  let fallbackUsed = false;

  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i]!;
    if (i > 0) fallbackUsed = true;
    const attemptStartedAt = Date.now();
    try {
      const result = await runYtDlp(url, format, a.selector, outputFileName, {
        provider: provider ?? 'generic',
        itemId,
        batchId,
        attempt: i + 1,
        strategyName: a.strategyName,
        strategyIndex: i,
        hardened: a.hardened,
        cookiesMode: a.cookiesMode,
        extraHeaders: a.extraHeaders,
        ...(isInstagram ? ytDlpInstagramThrottleOptions(a.hardened) : {})
      });
      console.log(
        JSON.stringify({
          msg: 'provider_download_attempt_succeeded',
          provider: provider ?? 'generic',
          itemId,
          batchId: batchId ?? null,
          url,
          attempt: i + 1,
          strategy: a.strategyName,
          ytdlp_mode: a.hardened ? 'safe' : 'fast',
          duration_ms: Date.now() - attemptStartedAt
        })
      );
      recordProviderSuccess(healthProvider, { afterFallback: fallbackUsed });
      return result;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      lastStderr = err instanceof YtDlpError ? err.stderr : lastErr.message;
      const cls = classifyGenericProviderError(lastStderr);
      lastCode = cls.code;
      lastRetriable = cls.retriable;
      console.warn(
        JSON.stringify({
          msg: 'provider_download_attempt_failed',
          provider: provider ?? 'generic',
          itemId,
          batchId: batchId ?? null,
          url,
          attempt: i + 1,
          strategy: a.strategyName,
          error_category: cls.code,
          stderr_summary: lastStderr.slice(0, 400),
          duration_ms: Date.now() - attemptStartedAt
        })
      );
      if (!cls.retriable) break;
      let backoff: number;
      if (cls.code === 'provider_rate_limited') {
        backoff = isInstagram
          ? Math.min(20000 * Math.pow(2, Math.min(i, 5)), 180000)
          : Math.min(4000 * Math.pow(2, i), 45000);
      } else {
        backoff = Math.min(750 * Math.pow(2, i), 4000);
      }
      await sleep(backoff);
    }
  }

  console.error(
    JSON.stringify({
      msg: 'provider_download_pipeline_failed',
      provider: provider ?? 'generic',
      itemId,
      batchId: batchId ?? null,
      url,
      error_category: lastCode,
      retriable: lastRetriable,
      final_outcome: lastRetriable ? 'transient_failure' : 'permanent_failure',
      stderr_summary: lastStderr.slice(0, 400),
      duration_ms: Date.now() - startedAt
    })
  );
  recordProviderFailure(healthProvider, lastCode, { permanent: !lastRetriable });
  throw new Error(`${lastCode}: ${lastStderr.slice(0, 500) || lastErr?.message || 'download failed'}`);
}

/**
 * Run yt-dlp and return the path to the downloaded file and its mime type.
 * Optional: YT_DLP_COOKIES_FILE/YT_DLP_COOKIES_FROM_BROWSER for auth-required content.
 * YouTube uses progressive fallback strategy; other providers keep the fast path.
 */
export async function downloadWithYtDlp(
  url: string,
  options: DownloadOptions,
  outputFileName: string,
  provider?: string,
  context?: DownloadContext
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  const format = options.format ?? 'mp4';
  const quality = options.quality ?? 'best';

  if (provider === 'youtube') {
    return runYoutubeDownloadWithFallbacks(url, format, quality, outputFileName, context);
  }

  if (format === 'mp3') {
    console.log(
      JSON.stringify({
        msg: 'mp3_branch_used',
        provider: provider ?? 'generic',
        quality
      })
    );
    return runGenericProviderDownloadWithFallbacks(url, format, quality, outputFileName, provider, context);
  }
  const baseResult = await runGenericProviderDownloadWithFallbacks(
    url,
    format,
    quality,
    outputFileName,
    provider,
    context
  );

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
