const path = require('path');
const fs = require('fs-extra');
const fsNative = require('fs');
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const { downloadWithYtDlp } = require('./ytService');

function findYtDlpBinary() {
  const possiblePaths = [
    'yt-dlp',
    '/usr/local/bin/yt-dlp',
    '/opt/homebrew/bin/yt-dlp',
    '/usr/bin/yt-dlp',
    '/app/.local/bin/yt-dlp'
  ];

  try {
    const whichResult = execSync('which yt-dlp', { encoding: 'utf8', stdio: 'pipe' }).trim();
    if (whichResult && fsNative.existsSync(whichResult)) {
      return whichResult;
    }
  } catch (_) {
    // Fall back to hardcoded paths.
  }

  for (const binPath of possiblePaths) {
    if (binPath === 'yt-dlp') continue;
    if (!fsNative.existsSync(binPath)) continue;
    try {
      fsNative.accessSync(binPath, fsNative.constants.X_OK);
      return binPath;
    } catch (_) {
      // Keep trying.
    }
  }

  return 'yt-dlp';
}

const YTDLP_BINARY = findYtDlpBinary();

function findThumbnail(info) {
  if (info.thumbnail) return info.thumbnail;
  if (Array.isArray(info.thumbnails) && info.thumbnails.length > 0) {
    const best = info.thumbnails[info.thumbnails.length - 1];
    return best?.url || best || null;
  }
  return null;
}

function getInfo(url) {
  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP_BINARY, ['-J', '--no-playlist', url], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `yt-dlp info failed with exit code ${code}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve({
          id: parsed.id || undefined,
          title: parsed.title || parsed.fulltitle || undefined,
          channel: parsed.uploader || parsed.channel || undefined,
          durationSeconds: typeof parsed.duration === 'number' ? parsed.duration : undefined,
          thumbnail: findThumbnail(parsed) || undefined
        });
      } catch (error) {
        reject(new Error(`Failed to parse yt-dlp metadata: ${error.message}`));
      }
    });
  });
}

async function download(url, opts) {
  const outDir = opts.outDir;
  const format = opts.format === 'audio' ? 'mp3' : 'mp4';
  const quality = opts.quality || '1080p';
  const baseName = opts.baseName || 'video';
  const ext = format === 'mp3' ? 'mp3' : 'mp4';

  fs.ensureDirSync(outDir);
  const outputPath = path.join(outDir, `${baseName}.${ext}`);

  await downloadWithYtDlp({
    url,
    format,
    quality,
    outputPath,
    onProgress: opts.onProgress
  });

  return {
    filePath: outputPath,
    fileName: path.basename(outputPath),
    bytes: fs.existsSync(outputPath) ? fs.statSync(outputPath).size : undefined
  };
}

module.exports = {
  getInfo,
  download
};
