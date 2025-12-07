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
const MIN_FILE_SIZE = 100 * 1024; // 100KB minimum

// Ensure bin directory exists
fs.mkdirSync(BIN_DIR, { recursive: true });

/**
 * Download latest yt-dlp binary from GitHub releases
 */
async function ensureLatestYtDlp() {
  // Check if binary already exists
  if (fs.existsSync(YTDLP_BINARY)) {
    try {
      // Verify it's executable and works
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
            // Binary exists but doesn't work, re-download
            console.log("[YTService] Existing binary invalid, re-downloading...");
            fs.unlinkSync(YTDLP_BINARY);
            reject(new Error("Invalid binary"));
          }
        });
        version.on("error", reject);
      });

      return YTDLP_BINARY;
    } catch (err) {
      // Binary exists but failed, remove and re-download
      if (fs.existsSync(YTDLP_BINARY)) {
        try {
          fs.unlinkSync(YTDLP_BINARY);
        } catch (e) {
          // Ignore deletion errors
        }
      }
    }
  }

  // Download latest binary
  console.log("[YTService] Downloading latest yt-dlp binary from GitHub...");
  const downloadUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(YTDLP_BINARY);

    https.get(downloadUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`[YTService] Following redirect to: ${redirectUrl}`);
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
        // Fallback to system yt-dlp if available
        ytdlpBinary = "yt-dlp";
        return ytdlpBinary;
      });
  }
  return binaryInitPromise;
}

// Start initialization immediately
getYtDlpBinary();

/**
 * Add cookies flag if cookies.txt exists
 */
function withCookies(args) {
  try {
    const cookiesPath = cookiesManager.getCookiesPath();
    if (cookiesManager.cookiesExist()) {
      console.log("[YTService] Using cookies from", cookiesPath);
      return [...args, "--cookies", cookiesPath];
    }
    return args;
  } catch (err) {
    console.warn("[YTService] Cookie check failed:", err);
    return args;
  }
}

/**
 * Build MP4 download command arguments with robust format selectors
 * @param {string} url - YouTube URL
 * @param {string} basePath - Base path WITHOUT extension (yt-dlp will add .%(ext)s)
 * @param {string} quality - Quality setting
 */
function buildMp4Command(url, basePath, quality) {
  // Use template with %(ext)s to let yt-dlp choose the extension
  const outputTemplate = `${basePath}.%(ext)s`;
  
  if (quality === "4K" || quality === "2160p" || quality === "4k") {
    return [
      url,
      "-f", "bv*[height>=2160]+ba/bv*+ba/best",
      "--merge-output-format", "mp4",
      "--no-warnings",
      "--compat-options", "manifest-files",
      "--no-check-certificate",
      "-o", outputTemplate
    ];
  }
  
  // Default: Robust MP4 command with multiple fallbacks
  return [
    url,
    "-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/best",
    "--merge-output-format", "mp4",
    "--no-warnings",
    "--compat-options", "manifest-files",
    "--no-check-certificate",
    "-o", outputTemplate
  ];
}

/**
 * Build MP3 download command arguments
 * @param {string} url - YouTube URL
 * @param {string} basePath - Base path WITHOUT extension (yt-dlp will add .%(ext)s)
 */
function buildMp3Command(url, basePath) {
  // Use template with %(ext)s to let yt-dlp choose the extension
  const outputTemplate = `${basePath}.%(ext)s`;
  
  return [
    url,
    "-x",
    "--audio-format", "mp3",
    "--audio-quality", "320K",
    "--no-warnings",
    "--compat-options", "manifest-files",
    "--no-check-certificate",
    "-o", outputTemplate
  ];
}

/**
 * Find the actual downloaded file by scanning the directory
 * @param {string} basePath - Base path without extension
 * @returns {string|null} - Full path to the found file, or null if not found
 */
function findDownloadedFile(basePath) {
  const dir = path.dirname(basePath);
  const baseName = path.basename(basePath);
  
  if (!fs.existsSync(dir)) {
    return null;
  }

  try {
    const files = fs.readdirSync(dir);
    
    // Filter files that start with the base name
    const candidates = files.filter(f => {
      const fileName = path.basename(f, path.extname(f));
      return fileName.startsWith(baseName) || f.startsWith(baseName);
    });

    if (candidates.length > 0) {
      // Prefer .mp4 if available
      const mp4File = candidates.find(f => f.toLowerCase().endsWith('.mp4'));
      if (mp4File) {
        const finalPath = path.join(dir, mp4File);
        const stats = fs.statSync(finalPath);
        if (stats.size >= MIN_FILE_SIZE) {
          console.log(`[YTService] Using downloaded file: ${finalPath}`);
          return finalPath;
        }
      }
      
      // Try other candidates
      for (const candidate of candidates) {
        const candidatePath = path.join(dir, candidate);
        const stats = fs.statSync(candidatePath);
        if (stats.size >= MIN_FILE_SIZE) {
          console.log(`[YTService] Using downloaded file: ${candidatePath}`);
          return candidatePath;
        }
      }
    }

    // Last fallback: search for any media file in the directory
    const mediaExtensions = /\.(mp4|mkv|webm|mp3|m4a|opus)$/i;
    const anyMedia = files.find(f => mediaExtensions.test(f));
    if (anyMedia) {
      const mediaPath = path.join(dir, anyMedia);
      const stats = fs.statSync(mediaPath);
      if (stats.size >= MIN_FILE_SIZE) {
        console.log(`[YTService] Using fallback media file: ${mediaPath}`);
        return mediaPath;
      }
    }

    return null;
  } catch (err) {
    console.error(`[YTService] Error scanning directory ${dir}:`, err);
    return null;
  }
}

/**
 * Execute yt-dlp download command
 * @param {Array} args - yt-dlp command arguments (output should use .%(ext)s template)
 * @param {string} basePath - Base path without extension (for file detection)
 * @param {boolean} retryOnCookieError - Whether to retry on cookie errors
 */
async function execDownload(args, basePath, retryOnCookieError = true) {
  // Ensure binary is ready
  const ytdlp = await getYtDlpBinary();

  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    const outputDir = path.dirname(basePath);
    fs.mkdirSync(outputDir, { recursive: true });

    // Ensure cookies are fresh before download
    cookiesManager.ensureFresh().catch(err => {
      console.warn("[YTService] Cookie refresh check failed:", err);
    });

    // Add cookies if available
    const finalArgs = withCookies(args);

    // Dev-only logging
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.log(`[YTService] Executing: ${ytdlp} ${finalArgs.join(" ")}`);
    }

    const child = spawn(ytdlp, finalArgs, { shell: false });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", async (code) => {
      const isDev = process.env.NODE_ENV !== 'production';
      
      if (code !== 0) {
        const errorMsg = stderr.trim() || stdout.trim();
        
        if (isDev) {
          console.error(`[YTService] Exit code: ${code}`);
          console.error(`[YTService] stderr:`, stderr.substring(0, 1000));
        }
        
        // Check if error is due to expired cookies
        if (retryOnCookieError && cookiesManager.isCookieError(stderr)) {
          console.warn("[YTService] Cookie error detected, refreshing cookies and retrying...");
          cookiesManager.markExpired();
          
          try {
            await cookiesManager.refresh();
            console.log("[YTService] Retrying download after cookie refresh...");
            const retryResult = await execDownload(args, basePath, false);
            resolve(retryResult);
            return;
          } catch (retryErr) {
            console.error("[YTService] Retry after cookie refresh failed:", retryErr);
            reject(new Error(`Download failed after cookie refresh: ${retryErr.message}`));
            return;
          }
        }

        if (isDev) {
          console.error(`[YTService] Download failed (exit code ${code}):`, errorMsg.substring(0, 500));
        } else {
          console.error(`[YTService] Download failed (exit code ${code})`);
        }
        reject(new Error(`Download failed: ${errorMsg.substring(0, 200)}`));
        return;
      }

      // Find the actual downloaded file by scanning the directory
      const finalFilePath = findDownloadedFile(basePath);
      
      if (!finalFilePath) {
        const dir = path.dirname(basePath);
        const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
        console.warn(`[YTService] Expected file not found, scanning dir: ${dir}, base: ${path.basename(basePath)}, files: ${files.join(', ')}`);
        reject(new Error("Output file not found after download"));
        return;
      }

      // Verify file size >= minimum threshold (100KB)
      const stats = fs.statSync(finalFilePath);
      if (stats.size < MIN_FILE_SIZE) {
        console.error(`[YTService] Output file is too small: ${finalFilePath} (${stats.size} bytes, minimum ${MIN_FILE_SIZE})`);
        try {
          fs.unlinkSync(finalFilePath);
        } catch (e) {
          // Ignore deletion errors
        }
        reject(new Error(`Output file is too small (${stats.size} bytes, minimum ${MIN_FILE_SIZE} bytes)`));
        return;
      }

      // Success
      if (isDev) {
        console.log(`[YTService] Download successful: ${finalFilePath} (${stats.size} bytes)`);
      }
      resolve(finalFilePath);
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

/**
 * Download MP3
 * @param {string} url - YouTube URL
 * @param {string} outputPath - Full output path (will be converted to base path)
 */
async function downloadAudio(url, outputPath) {
  // Ensure output is in /tmp for Railway
  if (!outputPath.startsWith('/tmp')) {
    const filename = path.basename(outputPath);
    outputPath = `/tmp/${filename}`;
  }

  // Remove extension to create base path (yt-dlp will add .%(ext)s)
  const basePath = outputPath.replace(/\.(mp3|m4a|opus|webm)$/i, '');
  
  const args = buildMp3Command(url, basePath);
  return await execDownload(args, basePath);
}

/**
 * Download MP4
 * @param {string} url - YouTube URL
 * @param {string} outputPath - Full output path (will be converted to base path)
 * @param {string} quality - Quality setting
 */
async function downloadVideoFile(url, outputPath, quality = "1080p") {
  // Ensure output is in /tmp for Railway
  if (!outputPath.startsWith('/tmp')) {
    const filename = path.basename(outputPath);
    outputPath = `/tmp/${filename}`;
  }

  // Remove extension to create base path (yt-dlp will add .%(ext)s)
  const basePath = outputPath.replace(/\.(mp4|mkv|webm|m4v)$/i, '');
  
  const args = buildMp4Command(url, basePath, quality);
  return await execDownload(args, basePath);
}

/**
 * Main download function
 * @param {Object} params - Download parameters
 * @param {string} params.url - YouTube URL
 * @param {string} params.format - "mp4" or "mp3"
 * @param {string} params.quality - "1080p", "720p", "4K", etc. (only for MP4)
 * @param {string} params.output - Output file path
 * @returns {Promise<string>} Resolves with output path
 */
export async function downloadVideo({ url, format, quality = "1080p", output }) {
  if (!url || !output) {
    throw new Error("URL and output path are required");
  }

  // Ensure binary is ready before starting download
  await getYtDlpBinary();

  if (format === "mp3") {
    return await downloadAudio(url, output);
  } else {
    return await downloadVideoFile(url, output, quality);
  }
}

/**
 * Legacy class-based API (for backward compatibility with BatchEngine)
 */
export class YTService {
  static async downloadVideo(url, outputPath, format, onProgress) {
    return new Promise(async (resolve, reject) => {
      try {
        // Ensure binary is ready
        await getYtDlpBinary();

        const resultPath = await downloadVideo({
          url,
          format: format === "mp3" ? "mp3" : "mp4",
          quality: format === "mp4" ? "1080p" : undefined,
          output: outputPath
        });

        if (onProgress) {
          onProgress({ percent: 100 });
        }

        resolve({ success: true, filePath: resultPath });
      } catch (error) {
        if (onProgress) {
          onProgress({ percent: 0, error: error.message });
        }
        reject(error);
      }
    });
  }
}
