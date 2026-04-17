import fs from 'node:fs';
import { config } from '../../config.js';
import type { YtDlpCookiesMode } from './types.js';

export function resolveCookieModes(): YtDlpCookiesMode[] {
  const modes: YtDlpCookiesMode[] = [];
  const filePath = config.ytDlpCookiesPath.trim();
  if (filePath && fs.existsSync(filePath)) modes.push('file');
  if (config.ytDlpCookiesFromBrowser.trim()) modes.push('browser');
  return modes;
}

/**
 * Default order for generic providers: prefer on-disk/browser cookies when configured,
 * but still try anonymous as a fallback.
 */
export function resolveGenericCookieModes(): YtDlpCookiesMode[] {
  const modes = new Set<YtDlpCookiesMode>();
  const filePath = config.ytDlpCookiesPath.trim();
  const preferred: YtDlpCookiesMode = filePath && fs.existsSync(filePath)
    ? 'file'
    : config.ytDlpCookiesFromBrowser.trim()
      ? 'browser'
      : 'none';

  modes.add(preferred);
  modes.add('none');
  for (const mode of resolveCookieModes()) modes.add(mode);

  return [...modes];
}

/**
 * Instagram / TikTok: when cookies are configured, use them first (reduces false
 * `provider_auth_required` from anonymous requests). Always end with `none` as last resort.
 */
export function resolveSocialCookieModes(): YtDlpCookiesMode[] {
  const modes: YtDlpCookiesMode[] = [];
  const filePath = config.ytDlpCookiesPath.trim();
  if (filePath && fs.existsSync(filePath)) modes.push('file');
  if (config.ytDlpCookiesFromBrowser.trim()) modes.push('browser');
  modes.push('none');
  return [...new Set(modes)];
}

export function cookiesModeIsAvailable(mode: YtDlpCookiesMode): boolean {
  if (mode === 'none') return true;
  if (mode === 'file') {
    const filePath = config.ytDlpCookiesPath.trim();
    return Boolean(filePath && fs.existsSync(filePath));
  }
  return Boolean(config.ytDlpCookiesFromBrowser.trim());
}
