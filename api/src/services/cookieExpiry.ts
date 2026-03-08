/**
 * Parse Netscape-format cookie file and report expiry for a domain.
 * Used to warn when YT_DLP_COOKIES_FILE is about to expire (~2 weeks typical).
 */

import fs from 'node:fs';
import path from 'node:path';

/** Netscape cookie line: domain \t includeSubdomains \t path \t secure \t expiry \t name \t value */
const COOKIE_EXPIRY_COLUMN = 4;

export interface CookieExpiryResult {
  path: string;
  domain: string;
  /** Unix timestamp of the latest expiry among cookies for this domain */
  expiresAt: number;
  /** Human-readable */
  expiresInDays: number;
  /** True if all relevant cookies are already expired */
  isExpired: boolean;
}

/**
 * Get the latest cookie expiry for a domain from a Netscape cookie file.
 * Returns null if file missing, unreadable, or no cookies for domain.
 */
export function getCookieExpiryForDomain(
  cookiePath: string,
  domain: string
): CookieExpiryResult | null {
  const normalized = path.normalize(cookiePath.trim());
  if (!fs.existsSync(normalized)) return null;

  let content: string;
  try {
    content = fs.readFileSync(normalized, 'utf8');
  } catch {
    return null;
  }

  const domainLower = domain.toLowerCase();
  let maxExpiry = 0;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const cols = trimmed.split('\t');
    if (cols.length <= COOKIE_EXPIRY_COLUMN) continue;
    const cookieDomain = (cols[0] || '').toLowerCase();
    if (!cookieDomain.includes(domainLower) && !domainLower.includes(cookieDomain.replace(/^\./, ''))) continue;
    const exp = parseInt(cols[COOKIE_EXPIRY_COLUMN], 10);
    if (!Number.isNaN(exp) && exp > maxExpiry) maxExpiry = exp;
  }

  if (maxExpiry <= 0) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = maxExpiry - now;
  const expiresInDays = Math.floor(expiresInSeconds / 86400);

  return {
    path: normalized,
    domain,
    expiresAt: maxExpiry,
    expiresInDays,
    isExpired: expiresInSeconds <= 0
  };
}

/** Domains we care about for yt-dlp (age-restricted etc.) */
const YT_DLP_DOMAINS = ['youtube.com', 'youtu.be', 'google.com'];

/**
 * Check YT_DLP_COOKIES_FILE and return the soonest expiry among relevant domains.
 */
export function getYtDlpCookieExpiry(cookiePath: string): CookieExpiryResult | null {
  if (!cookiePath?.trim()) return null;
  let result: CookieExpiryResult | null = null;
  for (const domain of YT_DLP_DOMAINS) {
    const r = getCookieExpiryForDomain(cookiePath, domain);
    if (!r) continue;
    if (!result || r.expiresAt < result.expiresAt) result = r;
  }
  return result;
}
