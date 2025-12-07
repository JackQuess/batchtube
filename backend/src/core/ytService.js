import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { cookiesManager } from "./CookiesManager.js";

const ytdlp = "yt-dlp";
const MIN_FILE_SIZE = 100 * 1024; // 100KB minimum

// Auto-update yt-dlp on module load (only once)
let ytdlpUpdated = false;

function updateYTDLP() {
  if (ytdlpUpdated) return Promise.resolve();
  
  return new Promise((resolve) => {
    console.log("[YTService] Updating yt-dlp...");
    const updateProcess = spawn(ytdlp, ["-U"], { shell: true });
    
    updateProcess.on("close", (code) => {
      ytdlpUpdated = true;
      if (code === 0) {
        console.log("[YTService] yt-dlp updated successfully");
      } else {
        console.warn("[YTService] yt-dlp update failed (continuing anyway)");
      }
      resolve();
    });
    
    updateProcess.on("error", (err) => {
      console.warn("[YTService] yt-dlp update error (continuing anyway):", err.message);
      ytdlpUpdated = true;
      resolve();
    });
  });
}

// Initialize update on module load
updateYTDLP();

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
 * Build MP4 download command arguments with fallback formats
 */
function buildMp4Command(url, output, formatIndex = 0) {
  const baseFormats = [
    "bv*[ext=mp4]+ba[ext=m4a]/mp4",
    "bv*+ba/bestvideo+bestaudio",
    "best"
  ];

  const format = baseFormats[formatIndex] || baseFormats[baseFormats.length - 1];

  return [
    url,
    "-f", format,
    "--merge-output-format", "mp4",
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
    "-o", output
  ];
}

/**
 * Execute yt-dlp download command with retry logic for MP4
 */
function execDownload(args, outputPath, retryOnCookieError = true, formatIndex = 0) {
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

    // Dev-only logging: log full command args
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.log(`[YTService] Executing: ${ytdlp} ${finalArgs.join(" ")}`);
    }

    const child = spawn(ytdlp, finalArgs, { shell: true });

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
        
        // Dev-only: log full stderr and exit code
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
            // Retry once after refresh
            console.log("[YTService] Retrying download after cookie refresh...");
            const retryResult = await execDownload(args, outputPath, false, formatIndex);
            resolve(retryResult);
            return;
          } catch (retryErr) {
            console.error("[YTService] Retry after cookie refresh failed:", retryErr);
            reject(new Error(`Download failed after cookie refresh: ${retryErr.message}`));
            return;
          }
        }

        // Production: minimal error log, Dev: detailed
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
        // Try to delete the empty file
        try {
          fs.unlinkSync(outputPath);
        } catch (e) {
          // Ignore deletion errors
        }
        reject(new Error(`Output file is too small (${stats.size} bytes, minimum ${MIN_FILE_SIZE} bytes)`));
        return;
      }

      // Success - minimal logging in production
      if (isDev) {
        console.log(`[YTService] Download successful: ${outputPath} (${stats.size} bytes)`);
      }
      resolve(outputPath);
    });

    child.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error("yt-dlp not installed on server"));
      } else {
        reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
      }
    });

    // Timeout after 10 minutes (for long videos)
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
 * Download MP4 with fallback format retry
 */
async function downloadVideoWithFallback(url, output) {
  const baseFormats = [
    "bv*[ext=mp4]+ba[ext=m4a]/mp4",
    "bv*+ba/bestvideo+bestaudio",
    "best"
  ];

  let lastError = null;

  for (let i = 0; i < baseFormats.length; i++) {
    try {
      const args = buildMp4Command(url, output, i);
      const result = await execDownload(args, output, true, i);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`[YTService] Format ${i + 1} failed, trying next...`);
      
      // If file exists but is too small, delete it before retry
      if (fs.existsSync(output)) {
        try {
          fs.unlinkSync(output);
        } catch (e) {
          // Ignore deletion errors
        }
      }
      
      // Continue to next format
      if (i < baseFormats.length - 1) {
        continue;
      }
    }
  }

  // All formats failed
  throw lastError || new Error("All format fallbacks failed");
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
async function downloadVideoFile(url, output) {
  // Ensure output is in /tmp for Railway
  if (!output.startsWith('/tmp')) {
    const filename = path.basename(output);
    output = `/tmp/${filename}`;
  }

  return await downloadVideoWithFallback(url, output);
}

/**
 * Main download function
 * @param {Object} params - Download parameters
 * @param {string} params.url - YouTube URL
 * @param {string} params.format - "mp4" or "mp3"
 * @param {string} params.quality - Ignored (for compatibility)
 * @param {string} params.output - Output file path
 * @returns {Promise<string>} Resolves with output path
 */
export async function downloadVideo({ url, format, quality, output }) {
  if (!url || !output) {
    throw new Error("URL and output path are required");
  }

  // Ensure yt-dlp is updated
  await updateYTDLP();

  if (format === "mp3") {
    return await downloadAudio(url, output);
  } else {
    return await downloadVideoFile(url, output);
  }
}

/**
 * Legacy class-based API (for backward compatibility with BatchEngine)
 */
export class YTService {
  static async downloadVideo(url, outputPath, format, onProgress) {
    return new Promise(async (resolve, reject) => {
      try {
        // Ensure yt-dlp is updated
        await updateYTDLP();

        // Call the new downloadVideo function
        const resultPath = await downloadVideo({
          url,
          format: format === "mp3" ? "mp3" : "mp4",
          quality: undefined, // Ignored
          output: outputPath
        });

        // Simulate progress callback for compatibility
        if (onProgress) {
          onProgress({ percent: 100 });
        }

        resolve({ success: true, filePath: resultPath });
      } catch (error) {
        // Report error via progress callback if available
        if (onProgress) {
          onProgress({ percent: 0, error: error.message });
        }
        reject(error);
      }
    });
  }
}
