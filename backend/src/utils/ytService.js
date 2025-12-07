/**
 * yt-dlp wrapper service
 * Handles video/audio downloads
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

  // Build command args
  let args = [];

  if (format === 'mp3') {
    args = [
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '320K',
      '--embed-metadata',
      '--no-warnings',
      '-o', outputPath,
      url
    ];
  } else if (format === 'mp4') {
    let heightLimit = '1080';
    if (quality === '4k') {
      heightLimit = '2160';
    }

    args = [
      '-f', `bv*[ext=mp4][height<=${heightLimit}]+ba[ext=m4a]/mp4`,
      '--merge-output-format', 'mp4',
      '--embed-metadata',
      '--embed-thumbnail',
      '--no-warnings',
      '-o', outputPath,
      url
    ];
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  // Log binary path for debugging (only in dev)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[YTService] Using yt-dlp binary: ${YTDLP_BINARY}`);
  }

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

    child.on('close', async (code) => {
      if (code !== 0) {
        const errorMsg = stderr.trim() || stdout.trim();
        console.error(`[YTService] yt-dlp failed (exit code ${code}): ${errorMsg.substring(0, 500)}`);
        reject(new Error(`Download failed: ${errorMsg.substring(0, 200)}`));
        return;
      }

      // Wait a bit for file system sync
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find the actual downloaded file (yt-dlp may rename it)
      const outputDir = path.dirname(outputPath);
      const expectedExt = path.extname(outputPath).toLowerCase();
      const format = expectedExt === '.mp3' ? 'mp3' : 'mp4';

      // Try to find the file with retries
      let foundFile = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        try {
          if (!fs.existsSync(outputDir)) {
            continue;
          }

          const files = fs.readdirSync(outputDir);
          
          // Filter media files by format
          const mediaExtensions = format === 'mp3' 
            ? ['.mp3', '.m4a', '.opus', '.webm', '.ogg']
            : ['.mp4', '.mkv', '.webm', '.m4v', '.mov'];

          const mediaFiles = files.filter(f => {
            const ext = path.extname(f).toLowerCase();
            return mediaExtensions.includes(ext);
          });

          if (mediaFiles.length === 0) {
            continue;
          }

          // Get file stats and sort by modification time (newest first)
          const filesWithStats = mediaFiles.map(f => {
            const filePath = path.join(outputDir, f);
            try {
              const stats = fs.statSync(filePath);
              return { 
                path: filePath, 
                name: f, 
                size: stats.size, 
                mtime: stats.mtime 
              };
            } catch (e) {
              return null;
            }
          }).filter(f => f !== null && f.size > 0);

          if (filesWithStats.length === 0) {
            continue;
          }

          // Sort by modification time (newest first) and size (largest first)
          filesWithStats.sort((a, b) => {
            if (b.mtime.getTime() !== a.mtime.getTime()) {
              return b.mtime.getTime() - a.mtime.getTime();
            }
            return b.size - a.size;
          });

          // Prefer exact match, then newest/largest
          foundFile = filesWithStats.find(f => f.path === outputPath) || filesWithStats[0];

          if (foundFile && foundFile.size >= 100 * 1024) { // At least 100KB
            break;
          }
        } catch (err) {
          console.error(`[YTService] Error scanning directory (attempt ${attempt + 1}):`, err.message);
        }
      }

      if (!foundFile || foundFile.size < 100 * 1024) {
        console.error(`[YTService] Output file not found after download in ${outputDir}`);
        console.error(`[YTService] Expected: ${outputPath}`);
        if (fs.existsSync(outputDir)) {
          const files = fs.readdirSync(outputDir);
          console.error(`[YTService] Directory contents: ${files.join(', ')}`);
        }
        reject(new Error('Output file not found after download'));
        return;
      }

      console.log(`[YTService] Download successful: ${foundFile.path} (${foundFile.size} bytes)`);
      resolve();
    });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('yt-dlp binary not found or not executable'));
      } else {
        reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
      }
    });

    // Timeout after 10 minutes
    const timeout = setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGTERM');
        reject(new Error('Download timeout after 10 minutes'));
      }
    }, 10 * 60 * 1000);

    child.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

module.exports = { downloadWithYtDlp };

