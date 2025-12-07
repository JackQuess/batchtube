import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import https from "https";
import { fileURLToPath } from "url";
import { cookiesManager } from "./CookiesManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BIN_DIR = path.resolve(__dirname, "../bin");
const YTDLP_BINARY = path.join(BIN_DIR, "yt-dlp");

// Ensure bin directory exists
fs.mkdirSync(BIN_DIR, { recursive: true });

/**
 * Download latest yt-dlp binary from GitHub releases
 */
async function ensureLatestYtDlp() {
  if (fs.existsSync(YTDLP_BINARY)) {
    try {
      const version = spawn(YTDLP_BINARY, ["--version"], { shell: false });
      let versionOutput = "";
      
      version.stdout.on("data", (data) => {
        versionOutput += data.toString();
      });

      await new Promise((resolve, reject) => {
        version.on("close", (code) => {
          if (code === 0 && versionOutput.trim()) {
            console.log(`[YTService] yt-dlp binary found: ${versionOutput.trim()}`);
            resolve();
          } else {
            fs.unlinkSync(YTDLP_BINARY);
            reject(new Error("Invalid binary"));
          }
        });
        version.on("error", reject);
      });

      return YTDLP_BINARY;
    } catch (err) {
      if (fs.existsSync(YTDLP_BINARY)) {
        try {
          fs.unlinkSync(YTDLP_BINARY);
        } catch (e) {}
      }
    }
  }

  console.log("[YTService] Downloading latest yt-dlp binary from GitHub...");
  const downloadUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(YTDLP_BINARY);

    https.get(downloadUrl, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        https.get(redirectUrl, (redirectResponse) => {
          redirectResponse.pipe(file);
          redirectResponse.on("end", () => {
            fs.chmodSync(YTDLP_BINARY, 0o755);
            console.log("[YTService] Binary downloaded and made executable");
            resolve(YTDLP_BINARY);
          });
        }).on("error", (err) => {
          fs.unlinkSync(YTDLP_BINARY);
          reject(new Error(`Download failed: ${err.message}`));
        });
        return;
      }

      if (response.statusCode !== 200) {
        fs.unlinkSync(YTDLP_BINARY);
        reject(new Error(`Download failed with status: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        fs.chmodSync(YTDLP_BINARY, 0o755);
        console.log("[YTService] Binary downloaded and made executable");
        resolve(YTDLP_BINARY);
      });
    }).on("error", (err) => {
      if (fs.existsSync(YTDLP_BINARY)) {
        fs.unlinkSync(YTDLP_BINARY);
      }
      reject(new Error(`Download failed: ${err.message}`));
    });

    file.on("error", (err) => {
      if (fs.existsSync(YTDLP_BINARY)) {
        fs.unlinkSync(YTDLP_BINARY);
      }
      reject(new Error(`File write failed: ${err.message}`));
    });
  });
}

// Initialize binary on module load
let ytdlpBinary = null;
let binaryInitPromise = null;

function getYtDlpBinary() {
  if (!binaryInitPromise) {
    binaryInitPromise = ensureLatestYtDlp()
      .then(binary => {
        ytdlpBinary = binary;
        return binary;
      })
      .catch(err => {
        console.error("[YTService] Failed to initialize yt-dlp binary:", err);
        ytdlpBinary = "yt-dlp";
        return ytdlpBinary;
      });
  }
  return binaryInitPromise;
}

// Start initialization immediately
getYtDlpBinary();

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
export async function downloadWithYtDlp({ url, format, quality = "1080p", outputPath, onProgress }) {
  // Try to use local binary first, fallback to system yt-dlp
  let ytdlp;
  try {
    ytdlp = await getYtDlpBinary();
  } catch (err) {
    console.warn('[YTService] Using system yt-dlp binary');
    ytdlp = "yt-dlp";
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });

  // Build command args exactly as specified
  let args = [];

  if (format === "mp3") {
    args = [
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "320K",
      "--embed-metadata",
      "--no-warnings",
      "-o", outputPath,
      url
    ];
  } else if (format === "mp4") {
    let heightLimit = "1080";
    if (quality === "4k") {
      heightLimit = "2160";
    }

    args = [
      "-f", `bv*[ext=mp4][height<=${heightLimit}]+ba[ext=m4a]/mp4`,
      "--merge-output-format", "mp4",
      "--embed-metadata",
      "--embed-thumbnail",
      "--no-warnings",
      "-o", outputPath,
      url
    ];
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  // Add cookies if available
  try {
    const cookiesPath = cookiesManager.getCookiesPath();
    if (cookiesManager.cookiesExist()) {
      args.splice(-1, 0, "--cookies", cookiesPath);
    }
  } catch (err) {
    // Continue without cookies if check fails
  }

  return new Promise((resolve, reject) => {
    const child = spawn(ytdlp, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });

    let stdout = "";
    let stderr = "";

    // Progress parsing regexes
    const progressPatterns = [
      /\[download\]\s+(\d+\.?\d*)%/i,
      /(\d+\.?\d*)%\s+of/i,
      /(\d+\.?\d*)%/
    ];

    child.stdout.on("data", (data) => {
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

    child.stderr.on("data", (data) => {
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

    child.on("close", async (code) => {
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
        reject(new Error("Output file not found after download"));
        return;
      }

      console.log(`[YTService] Download successful: ${foundFile.path} (${foundFile.size} bytes)`);
      resolve();
    });

    child.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error("yt-dlp binary not found or not executable"));
      } else {
        reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
      }
    });

    // Timeout after 10 minutes
    const timeout = setTimeout(() => {
      if (!child.killed) {
        child.kill("SIGTERM");
        reject(new Error("Download timeout after 10 minutes"));
      }
    }, 10 * 60 * 1000);

    child.on("close", () => {
      clearTimeout(timeout);
    });
  });
}
