/**
 * yt-dlp wrapper service
 * Handles video/audio downloads
 *
 * @deprecated Product downloads run in the `api/` worker (`api/src/services/download.ts` + `download/`).
 * Keep this module only for legacy scripts or local tooling until callers are migrated.
 */
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Find yt-dlp binary path
 * Tries multiple locations for cross-platform compatibility
 */
function findYtDlpBinary() {
  // Try common locations
  const possiblePaths = [
    'yt-dlp', // In PATH
    '/usr/local/bin/yt-dlp', // Linux/Docker standard
    '/opt/homebrew/bin/yt-dlp', // macOS Homebrew (Apple Silicon)
    '/usr/bin/yt-dlp', // Linux system-wide
    '/app/.local/bin/yt-dlp', // Railway/container
  ];

  // First, try to find in PATH
  try {
    const whichResult = execSync('which yt-dlp', { encoding: 'utf8', stdio: 'pipe' }).trim();
    if (whichResult && fs.existsSync(whichResult)) {
      return whichResult;
    }
  } catch (e) {
    // which failed, continue to check paths
  }

  // Check each possible path
  for (const binPath of possiblePaths) {
    if (binPath === 'yt-dlp') {
      // Already tried via which, skip
      continue;
    }
    if (fs.existsSync(binPath)) {
      // Check if executable
      try {
        fs.accessSync(binPath, fs.constants.X_OK);
        return binPath;
      } catch (e) {
        // Not executable, continue
      }
    }
  }

  // Fallback: return 'yt-dlp' and let spawn handle the error
  return 'yt-dlp';
}

const YTDLP_BINARY = findYtDlpBinary();

function isYoutubeUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host.includes('youtube.com') || host === 'youtu.be' || host.endsWith('.youtu.be');
  } catch (_) {
    return false;
  }
}

/** HLS (.m3u8) / DASH (.mpd) — use yt-dlp fragment concurrency instead of ffmpeg. */
function isFragmentedStreamingUrl(url) {
  const u = String(url || '').toLowerCase();
  return u.includes('.m3u8') || u.includes('.mpd');
}

function pushCookiesIfConfigured(argList) {
  // Force absolute cookie path in container for consistent behavior.
  argList.push('--cookies', '/app/cookies/cookies.txt');
}

function pushUltraFastDownloaderArgs(argList) {
  argList.push('--downloader', 'aria2c');
  argList.push('--downloader-args', 'aria2c:-x16 -k1M');
}

/**
 * Fast path for raw HLS/DASH URLs (generic provider, direct m3u8/mpd links).
 */
function buildFragmentedStreamArgs({ url, format, quality, outputPath }) {
  const fragments = quality === '4k' ? '16' : '8';
  const base = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificate',
    '--concurrent-fragments',
    fragments,
    '-o',
    outputPath
  ];
  pushCookiesIfConfigured(base);
  pushUltraFastDownloaderArgs(base);
  pushUltraFastDownloaderArgs(base);
  pushUltraFastDownloaderArgs(base);

  if (format === 'mp3') {
    return [
      ...base,
      '--extract-audio',
      '--audio-format',
      'mp3',
      '--audio-quality',
      '0',
      url
    ];
  }

  return [
    ...base,
    '-f',
    'bv*+ba',
    '--merge-output-format',
    'mp4',
    url
  ];
}

function classifyYoutubeError(message) {
  const text = String(message || '').toLowerCase();

  if (!text) {
    return { code: 'youtube_unknown_failure', recoverable: false };
  }

  if (text.includes('private') && text.includes('video')) {
    return { code: 'youtube_private_or_removed', recoverable: false };
  }

  if (text.includes('video unavailable') || text.includes('unavailable')) {
    return { code: 'youtube_unavailable', recoverable: false };
  }

  if (text.includes('sign in to confirm your age') || text.includes('confirm your age')) {
    return { code: 'youtube_age_restricted', recoverable: true, needsCookies: true };
  }

  if (text.includes('login required') || text.includes('sign in to')) {
    return { code: 'youtube_login_required', recoverable: true, needsCookies: true };
  }

  if (
    text.includes("confirm you're not a bot") ||
    text.includes('confirm you are not a bot') ||
    text.includes('bot check') ||
    text.includes('captcha')
  ) {
    return { code: 'youtube_bot_check', recoverable: true, needsCookies: false };
  }

  if (text.includes('not available in your country') || text.includes('region')) {
    return { code: 'youtube_region_restricted', recoverable: false };
  }

  if (
    text.includes('timed out') ||
    text.includes('network') ||
    text.includes('connection reset') ||
    text.includes('temporary failure') ||
    text.includes('http error 5')
  ) {
    return { code: 'transient_network_failure', recoverable: true };
  }

  return { code: 'youtube_unknown_failure', recoverable: false };
}

function buildYoutubeArgsFast({ url, format, quality, outputPath }) {
  const base = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificate',
    '-o',
    outputPath
  ];

  pushCookiesIfConfigured(base);

  if (format === 'mp3') {
    return [
      ...base,
      '--extract-audio',
      '--audio-format',
      'mp3',
      '--audio-quality',
      '0',
      url
    ];
  }

  let heightLimit = '1080';
  if (quality === '4k') {
    heightLimit = '2160';
  }

  const selector =
    quality === '4k'
      ? `bv*[ext=mp4][height<=${heightLimit}]+ba[ext=m4a]`
      : `bv*[ext=mp4][height<=${heightLimit}]+ba[ext=m4a]`;

  const args = [
    ...base,
    '-f',
    selector,
    '--merge-output-format',
    'mp4',
    url
  ];

  // More aggressive fragment concurrency for high-res video
  if (quality === '4k') {
    args.push('--concurrent-fragments', '16');
  } else {
    args.push('--concurrent-fragments', '8');
  }

  return args;
}

/**
 * Lightspeed defaults for all non-YouTube yt-dlp extractors (Instagram, TikTok, Vimeo, …).
 * Skips embed-metadata / embed-thumbnail on the fast path; adds fragment concurrency.
 */
function buildGenericArgs({ url, format, quality, outputPath }) {
  const concurrent = quality === '4k' ? '16' : '8';
  const base = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificate',
    '--concurrent-fragments',
    concurrent,
    '-o',
    outputPath
  ];
  pushCookiesIfConfigured(base);

  if (format === 'mp3') {
    return [
      ...base,
      '--extract-audio',
      '--audio-format',
      'mp3',
      '--audio-quality',
      '0',
      url
    ];
  }

  if (format !== 'mp4') {
    throw new Error(`Unsupported format: ${format}`);
  }

  let heightLimit = '1080';
  if (quality === '4k') {
    heightLimit = '2160';
  }

  return [
    ...base,
    '-f',
    `bv*[height<=${heightLimit}]+ba`,
    '--merge-output-format',
    'mp4',
    url
  ];
}

/**
 * Download with yt-dlp
 * @param {Object} params
 * @param {string} params.url - YouTube URL
 * @param {string} params.format - "mp3" | "mp4"
 * @param {string} params.quality - "1080p" | "4k"
 * @param {string} params.outputPath - Full output file path
 * @param {Function} params.onProgress - Callback(percent, textLine)
 * @returns {Promise<void>}
 */
function downloadWithYtDlp({ url, format, quality = '1080p', outputPath, onProgress }) {
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const youtube = isYoutubeUrl(url);
  const fragmented = !youtube && isFragmentedStreamingUrl(url);
  const providerKind = youtube ? 'youtube' : fragmented ? 'fragmented_stream' : 'generic';

  const fastArgs = youtube
    ? buildYoutubeArgsFast({ url, format, quality, outputPath })
    : fragmented
      ? buildFragmentedStreamArgs({ url, format, quality, outputPath })
      : buildGenericArgs({ url, format, quality, outputPath });

  if (process.env.YT_DLP_COOKIE_DEBUG === '1') {
    try {
      const cwd = process.cwd();
      const cookiesEnv = process.env.YT_DLP_COOKIES_FILE || null;
      const cookiesExists = cookiesEnv ? fs.existsSync(cookiesEnv) : false;
      let cookiesStat = null;
      if (cookiesExists) {
        try {
          const stat = fs.lstatSync(cookiesEnv);
          cookiesStat = {
            isFile: stat.isFile(),
            isDirectory: stat.isDirectory(),
            size: stat.size
          };
        } catch (e) {
          cookiesStat = { error: e.message };
        }
      }
      console.log(
        JSON.stringify({
          msg: 'yt_dlp_cookie_debug',
          cwd,
          yt_dlp_cookies_env: cookiesEnv,
          cookies_exists: cookiesExists,
          cookies_stat: cookiesStat
        })
      );
    } catch (_) {
      // best-effort debug only
    }
  }

  // Log binary path for debugging (only in dev)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[YTService] Using yt-dlp binary: ${YTDLP_BINARY}`);
  }

  function runOnce(args, { fastPath, attempt, totalAttempts }) {
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const child = spawn(YTDLP_BINARY, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false
      });

      let stdout = '';
      let stderr = '';

      // Progress parsing regexes
      const progressPatterns = [
        /\[download\]\s+(\d+\.?\d*)%/i,
        /(\d+\.?\d*)%\s+of/i,
        /(\d+\.?\d*)%/
      ];

      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;

        // Parse progress
        if (onProgress) {
          for (const pattern of progressPatterns) {
            const match = text.match(pattern);
            if (match) {
              const percent = parseFloat(match[1]);
              if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                onProgress(percent, text);
                break;
              }
            }
          }
        }
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;

        // Parse progress from stderr too
        if (onProgress) {
          for (const pattern of progressPatterns) {
            const match = text.match(pattern);
            if (match) {
              const percent = parseFloat(match[1]);
              if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                onProgress(percent, text);
                break;
              }
            }
          }
        }
      });

      child.on('close', (code) => {
        const durationMs = Date.now() - startedAt;

        if (code !== 0) {
          const errorMsg = (stderr.trim() || stdout.trim()).substring(0, 500);
          console.error(
            JSON.stringify({
              msg: 'yt_dlp_failed',
              provider: providerKind,
              format,
              quality,
              fast_path_used: !!fastPath,
              exit_code: code,
              attempt,
              total_attempts: totalAttempts,
              duration_ms: durationMs,
              stderr_snippet: errorMsg
            })
          );
          reject(new Error(errorMsg || `yt-dlp failed with exit code ${code}`));
          return;
        }

        console.log(
          JSON.stringify({
            msg: 'yt_dlp_succeeded',
            provider: providerKind,
            format,
            quality,
            fast_path_used: !!fastPath,
            attempt,
            total_attempts: totalAttempts,
            duration_ms: durationMs
          })
        );

        resolve();
      });

      child.on('error', (err) => {
        reject(
          err.code === 'ENOENT'
            ? new Error('yt-dlp binary not found or not executable')
            : new Error(`Failed to spawn yt-dlp: ${err.message}`)
        );
      });

      // Timeout after 10 minutes
      const timeout = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
        reject(new Error('Download timeout after 10 minutes'));
      }, 10 * 60 * 1000);

      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  // FAST PATH: minimal retries, aggressive selectors
  return runOnce(fastArgs, { fastPath: true, attempt: 1, totalAttempts: 1 }).catch(async (fastError) => {
    if (!youtube) {
      throw fastError;
    }

    const classification = classifyYoutubeError(fastError.message || '');

    // Non-recoverable errors: fail immediately, do not spend time on fallbacks
    if (!classification.recoverable) {
      throw fastError;
    }

    const safeAttempts = [];

    // SAFE PATH: transient network failures → retry once with the same selector
    if (classification.code === 'transient_network_failure') {
      safeAttempts.push({
        label: 'transient_retry',
        args: fastArgs
      });
    }

    // SAFE PATH: auth/age/login issues → retry once with cookies if available
    if (classification.needsCookies) {
      const cookiesFile = process.env.YT_DLP_COOKIES_FILE;
      if (cookiesFile && fs.existsSync(cookiesFile)) {
        const withCookies = [...fastArgs];
        if (!withCookies.includes('--cookies')) {
          withCookies.push('--cookies', cookiesFile);
        }
        safeAttempts.push({
          label: 'cookie_retry',
          args: withCookies
        });
      }
    }

    // SAFE PATH: for 4K/video, fall back to a slightly less aggressive selector (cap at 1080p)
    if (format === 'mp4') {
      const simpleSelectorArgs = buildYoutubeArgsFast({
        url,
        format,
        quality: quality === '4k' ? '1080p' : quality,
        outputPath
      });
      safeAttempts.push({
        label: 'selector_fallback',
        args: simpleSelectorArgs
      });
    }

    if (!safeAttempts.length) {
      throw fastError;
    }

    console.log(
      JSON.stringify({
        msg: 'yt_dlp_safe_path_start',
        provider: 'youtube',
        format,
        quality,
        error_classification: classification.code,
        attempts: safeAttempts.map((a) => a.label)
      })
    );

    let lastError = fastError;

    for (let i = 0; i < safeAttempts.length; i++) {
      const attemptInfo = safeAttempts[i];
      const attemptIndex = i + 1;
      try {
        await runOnce(attemptInfo.args, {
          fastPath: false,
          attempt: attemptIndex,
          totalAttempts: safeAttempts.length
        });
        return;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError;
  });
}

module.exports = { downloadWithYtDlp };

