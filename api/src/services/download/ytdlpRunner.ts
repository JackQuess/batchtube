import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { config } from '../../config.js';
import { YT_DLP, MAX_STDERR_LOG, YTDLP_VERSION_TIMEOUT_MS } from './constants.js';
import { buildYtDlpArgs } from './buildYtDlpArgs.js';
import { logYoutube, parseVersionDate, sanitizeStderr } from './helpers.js';
import { YtDlpError } from './types.js';
import type { DownloadFormat, RunYtDlpOptions } from './types.js';

let ytDlpVersionProbe: Promise<void> | null = null;

export async function ensureYtDlpVersionLogged(): Promise<void> {
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

export function runYtDlp(
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
        reject(new YtDlpError(`yt-dlp exited ${code}`, sanitizeStderr(stderr, MAX_STDERR_LOG) || 'no stderr', code ?? -1));
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
              : ext === 'jpg' || ext === 'jpeg'
                ? 'image/jpeg'
                : ext === 'png'
                  ? 'image/png'
                  : ext === 'webp'
                    ? 'image/webp'
                    : 'application/octet-stream';

      resolve({ filePath, mimeType, ext });
    });
  });
}
