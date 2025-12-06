import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { cookiesManager } from "./CookiesManager.js";

const ytdlp = "yt-dlp";

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
 * Build MP4 download command arguments
 */
function buildMp4Command(url, output, quality) {
  let args = [];

  if (quality === "4K" || quality === "2160p" || quality === "4k") {
    // 4K: Use height selector
    args = [
      url,
      "-f", "bv*[height>=2160]+ba",
      "--merge-output-format", "mp4",
      "-o", output
    ];
  } else if (quality === "1080p") {
    // 1080p: Universal command (yt-dlp auto-detects best 1080p)
    args = [
      url,
      "-f", "bv*[ext=mp4]+ba[ext=m4a]/mp4",
      "--merge-output-format", "mp4",
      "-o", output
    ];
  } else {
    // Default: Universal MP4 command (works for all qualities)
    args = [
      url,
      "-f", "bv*[ext=mp4]+ba[ext=m4a]/mp4",
      "--merge-output-format", "mp4",
      "-o", output
    ];
  }

  return args;
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
 * Execute yt-dlp download command
 */
function execDownload(args, outputPath, retryOnCookieError = true) {
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

    console.log(`[YTService] Executing: ${ytdlp} ${finalArgs.join(" ")}`);

    const child = spawn(ytdlp, finalArgs);

    let stdout = "";
    let stderr = "";
    let hasProgress = false;

    child.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      // Log progress if available
      if (text.includes("[download]") || text.includes("%")) {
        hasProgress = true;
      }
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", async (code) => {
      if (code !== 0) {
        const errorMsg = stderr.trim() || stdout.trim();
        
        // Check if error is due to expired cookies
        if (retryOnCookieError && cookiesManager.isCookieError(stderr)) {
          console.warn("[YTService] Cookie error detected, refreshing cookies and retrying...");
          cookiesManager.markExpired();
          
          try {
            await cookiesManager.refresh();
            // Retry once after refresh
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

        console.error(`[YTService] Download failed (exit code ${code}):`, errorMsg.substring(0, 500));
        reject(new Error(`Download failed: ${errorMsg.substring(0, 200)}`));
        return;
      }

      // Verify output file exists
      if (!fs.existsSync(outputPath)) {
        console.error(`[YTService] Output file not found: ${outputPath}`);
        reject(new Error("Output file not found"));
        return;
      }

      // Verify file size > 0
      const stats = fs.statSync(outputPath);
      if (stats.size === 0) {
        console.error(`[YTService] Output file is empty: ${outputPath}`);
        reject(new Error("Output file is empty"));
        return;
      }

      // Success
      console.log(`[YTService] Download successful: ${outputPath} (${stats.size} bytes)`);
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

  let args;

  if (format === "mp3") {
    // MP3 download
    args = buildMp3Command(url, output);
  } else {
    // MP4 download
    args = buildMp4Command(url, output, quality);
  }

  // Execute download
  return await execDownload(args, output);
}

/**
 * Legacy class-based API (for backward compatibility with BatchEngine)
 */
export class YTService {
  static async downloadVideo(url, outputPath, format, onProgress) {
    return new Promise(async (resolve, reject) => {
      try {
        // Map format to quality
        const quality = format === "mp4" ? "1080p" : undefined;

        // Call the new downloadVideo function
        const resultPath = await downloadVideo({
          url,
          format: format === "mp3" ? "mp3" : "mp4",
          quality,
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
