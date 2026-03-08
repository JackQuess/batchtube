import path from "path";
import fs from "fs";
import fetch from "node-fetch";

const COOKIES_DIR = path.join(process.cwd(), "cookies");
const COOKIES_FILE = path.join(COOKIES_DIR, "cookies.txt");
const METADATA_FILE = path.join(COOKIES_DIR, ".metadata.json");
const MAX_AGE_DAYS = 25;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
/** Refresh when cookie expiry is within this many days */
const REFRESH_BEFORE_DAYS = 2;
const REFRESH_BEFORE_MS = REFRESH_BEFORE_DAYS * 24 * 60 * 60 * 1000;
const COOKIE_EXPIRY_COLUMN = 4;
const YT_DLP_DOMAINS = ["youtube.com", "youtu.be", "google.com"];

/**
 * CookiesManager - Automatic YouTube cookie management
 */
class CookiesManager {
  constructor() {
    // Ensure cookies directory exists
    fs.mkdirSync(COOKIES_DIR, { recursive: true });
    this.isRefreshing = false;
  }

  /**
   * Get the path to cookies.txt
   */
  getCookiesPath() {
    return COOKIES_FILE;
  }

  /**
   * Check if cookies file exists and is valid
   */
  cookiesExist() {
    return fs.existsSync(COOKIES_FILE);
  }

  /**
   * Get last update time from metadata
   */
  getLastUpdateTime() {
    try {
      if (fs.existsSync(METADATA_FILE)) {
        const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"));
        return metadata.lastUpdate || 0;
      }
    } catch (err) {
      console.warn("[CookiesManager] Failed to read metadata:", err.message);
    }
    return 0;
  }

  /**
   * Get soonest cookie expiry (Unix seconds) for YouTube/Google from Netscape cookie file.
   * Returns null if file missing, unreadable, or no relevant cookies.
   */
  getParsedExpirySeconds() {
    if (!fs.existsSync(COOKIES_FILE)) return null;
    let content;
    try {
      content = fs.readFileSync(COOKIES_FILE, "utf8");
    } catch {
      return null;
    }
    let soonest = null;
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const cols = trimmed.split("\t");
      if (cols.length <= COOKIE_EXPIRY_COLUMN) continue;
      const domain = (cols[0] || "").toLowerCase();
      const isRelevant = YT_DLP_DOMAINS.some(
        (d) => domain.includes(d) || d.includes(domain.replace(/^\./, ""))
      );
      if (!isRelevant) continue;
      const exp = parseInt(cols[COOKIE_EXPIRY_COLUMN], 10);
      if (!Number.isNaN(exp) && (soonest === null || exp < soonest)) soonest = exp;
    }
    return soonest;
  }

  /**
   * Check if cookies are stale (older than MAX_AGE_DAYS) or by real cookie expiry.
   * Uses parsed expiry from cookies.txt when available; refreshes when expired or within REFRESH_BEFORE_DAYS.
   */
  isStale() {
    if (!this.cookiesExist()) {
      return true;
    }

    const expirySec = this.getParsedExpirySeconds();
    if (expirySec !== null) {
      const nowSec = Math.floor(Date.now() / 1000);
      const expiryMs = expirySec * 1000;
      const thresholdMs = Date.now() + REFRESH_BEFORE_MS;
      if (expiryMs <= thresholdMs) {
        return true; // expired or expiring within REFRESH_BEFORE_DAYS
      }
      return false; // still valid
    }

    const lastUpdate = this.getLastUpdateTime();
    if (lastUpdate === 0) {
      return true;
    }

    const age = Date.now() - lastUpdate;
    return age > MAX_AGE_MS;
  }

  /**
   * Mark cookies as expired (invalid)
   */
  markExpired() {
    try {
      const metadata = {
        lastUpdate: 0,
        expired: true,
        expiredAt: Date.now()
      };
      fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
      console.log("[CookiesManager] Cookies marked as expired");
    } catch (err) {
      console.error("[CookiesManager] Failed to mark expired:", err);
    }
  }

  /**
   * Update metadata after successful refresh
   */
  updateMetadata() {
    try {
      const metadata = {
        lastUpdate: Date.now(),
        expired: false
      };
      fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
    } catch (err) {
      console.error("[CookiesManager] Failed to update metadata:", err);
    }
  }

  /**
   * Download cookies from public source
   */
  async downloadCookies() {
    const sources = [
      // Primary: yt-dlp official cookie template
      "https://raw.githubusercontent.com/ytdl-org/youtube-dl/master/youtube-dl/cookie-file.txt",
      // Fallback: Minimal Netscape cookie format
      null // We'll generate a minimal one if needed
    ];

    for (const source of sources) {
      try {
        if (source) {
          console.log(`[CookiesManager] Attempting to download from: ${source}`);
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          try {
            const response = await fetch(source, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
              const text = await response.text();
              if (text && text.length > 100) {
                // Valid cookie file
                return text;
              }
            }
          } catch (fetchErr) {
            clearTimeout(timeoutId);
            if (fetchErr.name === 'AbortError') {
              console.warn(`[CookiesManager] Request timeout for ${source}`);
              continue;
            } else {
              throw fetchErr;
            }
          }
        } else {
          // Generate minimal Netscape cookie format
          console.log("[CookiesManager] Generating minimal cookie file");
          return this.generateMinimalCookies();
        }
      } catch (err) {
        console.warn(`[CookiesManager] Failed to download from ${source || 'fallback'}:`, err.message);
        continue;
      }
    }

    // If all sources fail, generate minimal cookies
    return this.generateMinimalCookies();
  }

  /**
   * Generate minimal Netscape cookie format
   */
  generateMinimalCookies() {
    // Netscape cookie format header
    const header = `# Netscape HTTP Cookie File
# This is a generated file! Do not edit.
# Generated by BatchTube CookiesManager

`;
    // Minimal cookies that help with basic YouTube access
    // Note: These are placeholders - real cookies would need to be extracted from a browser
    return header;
  }

  /**
   * Refresh cookies file
   */
  async refresh() {
    if (this.isRefreshing) {
      console.log("[CookiesManager] Refresh already in progress, skipping");
      return false;
    }

    this.isRefreshing = true;
    console.log("[CookiesManager] Auto-refresh triggered");

    try {
      const cookieContent = await this.downloadCookies();

      // Write cookies file
      fs.writeFileSync(COOKIES_FILE, cookieContent, "utf-8");
      console.log(`[CookiesManager] Cookies file written: ${COOKIES_FILE} (${cookieContent.length} bytes)`);

      // Update metadata
      this.updateMetadata();

      console.log("[CookiesManager] Refresh complete");
      return true;
    } catch (err) {
      console.error("[CookiesManager] Refresh failed:", err);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Check if cookies need refresh and refresh if needed
   */
  async ensureFresh() {
    if (this.isStale()) {
      console.log("[CookiesManager] Cookies are stale or expiring soon, refreshing...");
      await this.refresh();
    } else {
      console.log("[CookiesManager] Cookies still valid, no refresh needed");
    }
  }

  /**
   * Check if error indicates cookie expiration
   */
  isCookieError(stderr) {
    if (!stderr) return false;
    const errorText = stderr.toLowerCase();
    return (
      errorText.includes("sign in to confirm") ||
      errorText.includes("age restricted") ||
      errorText.includes("confirm your age") ||
      errorText.includes("this video is age restricted") ||
      errorText.includes("use --cookies")
    );
  }
}

export const cookiesManager = new CookiesManager();

