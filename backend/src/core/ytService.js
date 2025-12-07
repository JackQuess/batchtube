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
 */
function buildMp4Command(url, output, quality) {
  if (quality === "4K" || quality === "2160p" || quality === "4k") {
    return [
      url,
      "-f", "bv*[height>=2160]+ba/bv*+ba/best",
      "--merge-output-format", "mp4",
      "--no-warnings",
      "--compat-options", "manifest-files",
      "--no-check-certificate",
      "-o", output
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
    "-o", output
  ];
}

/**
 * Build MP3 download command arguments
 */
function buildMp3Command(url, output) {
  return [
    url,
    "-x",
    "--audio-format", "mp3",
    "--audio-quality", "320K",
    "--no-warnings",
    "--compat-options", "manifest-files",
    "--no-check-certificate",
    "-o", output
  ];
}

/**
 * Execute yt-dlp download command
 */
async function execDownload(args, outputPath, retryOnCookieError = true) {
  // Ensure binary is ready
  const ytdlp = await getYtDlpBinary();

  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
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
            const retryResult = await execDownload(args, outputPath, false);
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

      // Verify output file exists
      if (!fs.existsSync(outputPath)) {
        console.error(`[YTService] Output file not found: ${outputPath}`);
        reject(new Error("Output file not found"));
        return;
      }

      // Verify file size >= minimum threshold (100KB)
      const stats = fs.statSync(outputPath);
      if (stats.size < MIN_FILE_SIZE) {
        console.error(`[YTService] Output file is too small: ${outputPath} (${stats.size} bytes, minimum ${MIN_FILE_SIZE})`);
        try {
          fs.unlinkSync(outputPath);
        } catch (e) {
          // Ignore deletion errors
        }
        reject(new Error(`Output file is too small (${stats.size} bytes, minimum ${MIN_FILE_SIZE} bytes)`));
        return;
      }

      // Success
      if (isDev) {
        console.log(`[YTService] Download successful: ${outputPath} (${stats.size} bytes)`);
      }
      resolve(outputPath);
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
 */
async function downloadAudio(url, output) {
  // Ensure output is in /tmp for Railway
  if (!output.startsWith('/tmp')) {
    const filename = path.basename(output);
    output = `/tmp/${filename}`;
  }

  const args = buildMp3Command(url, output);
  return await execDownload(args, output);
}

/**
 * Download MP4
 */
async function downloadVideoFile(url, output, quality = "1080p") {
  // Ensure output is in /tmp for Railway
  if (!output.startsWith('/tmp')) {
    const filename = path.basename(output);
    output = `/tmp/${filename}`;
  }

  const args = buildMp4Command(url, output, quality);
  return await execDownload(args, output);
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
