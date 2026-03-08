/**
 * Run yt-dlp to download a single URL. Requires yt-dlp (and ffmpeg for merge) on PATH.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

const YT_DLP = 'yt-dlp';

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

/**
 * Run yt-dlp and return the path to the downloaded file and its mime type.
 * Uses a temp dir; caller should delete it after copying the file.
 */
export function downloadWithYtDlp(
  url: string,
  options: DownloadOptions,
  outputFileName: string
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  const format = options.format ?? 'mp4';
  const quality = options.quality ?? 'best';
  const dir = path.join(tmpdir(), `batchtube-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  fs.mkdirSync(dir, { recursive: true });
  const outputTemplate = path.join(dir, `${outputFileName}.%(ext)s`);

  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
    '-o', outputTemplate,
    '--no-check-certificate'
  ];

  if (format === 'mp3') {
    args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    const selector = QUALITY_SELECTORS[quality];
    args.push('-f', selector);
    if (format === 'mp4') {
      args.push('--merge-output-format', 'mp4');
    } else if (format === 'mkv') {
      args.push('--merge-output-format', 'mkv');
    }
  }

  args.push(url);

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
        reject(new Error(`yt-dlp exited ${code}: ${stderr.slice(-500)}`));
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
