import fs from 'node:fs';
import { config } from '../../config.js';
import { YOUTUBE_USER_AGENT } from './constants.js';
import type { BuildYtDlpArgsInput, DownloadFormat } from './types.js';

export function buildYtDlpArgs(input: BuildYtDlpArgsInput): string[] {
  const { url, format, qualityOrSelector, outputTemplate, cookiesMode, options } = input;
  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
    '-o',
    outputTemplate,
    '--no-check-certificate',
    '--socket-timeout',
    String(config.ytDlpSocketTimeoutSec),
    '--retries',
    String(options?.hardened ? config.ytDlpRetriesSafe : config.ytDlpRetriesFast),
    '--fragment-retries',
    String(options?.hardened ? config.ytDlpFragmentRetriesSafe : config.ytDlpFragmentRetriesFast),
    '--file-access-retries',
    '2'
  ];

  if (options?.hardened) {
    args.push('--extractor-retries', String(config.ytDlpExtractorRetriesSafe));
  } else {
    args.push('--extractor-retries', String(config.ytDlpExtractorRetriesFast));
  }

  if (format !== 'mp3') {
    const fragmentConcurrency =
      options?.concurrentFragmentsOverride ??
      (options?.hardened ? config.ytDlpConcurrentFragmentsSafe : config.ytDlpConcurrentFragmentsFast);
    args.push('-N', String(fragmentConcurrency));
  }

  const fileCookiesPath = config.ytDlpCookiesPath.trim();
  if (cookiesMode === 'file' && fileCookiesPath && fs.existsSync(fileCookiesPath)) {
    args.push('--cookies', fileCookiesPath);
  }
  if (cookiesMode === 'browser' && config.ytDlpCookiesFromBrowser.trim()) {
    const browser = config.ytDlpCookiesFromBrowser.trim();
    const profile = config.ytDlpCookiesFromBrowserProfile.trim();
    args.push('--cookies-from-browser', profile ? `${browser}:${profile}` : browser);
  }

  if (options?.extractorArgs) {
    args.push('--add-header', `User-Agent: ${YOUTUBE_USER_AGENT}`);
    args.push('--add-header', 'Accept-Language: en-US,en;q=0.9');
    args.push('--extractor-args', options.extractorArgs);
  }
  if (options?.extraHeaders?.length) {
    for (const header of options.extraHeaders) {
      if (!header.key.trim()) continue;
      args.push('--add-header', `${header.key}: ${header.value}`);
    }
  }

  if (format === 'mp3') {
    args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0');
  } else if (format === 'jpg') {
    args.push('-f', qualityOrSelector || 'best');
  } else {
    args.push('-f', qualityOrSelector);
    if (format === 'mp4') args.push('--merge-output-format', 'mp4');
    if (format === 'mkv') args.push('--merge-output-format', 'mkv');
  }

  if (options?.sleepRequestsSec != null && options.sleepRequestsSec > 0) {
    args.push('--sleep-requests', String(options.sleepRequestsSec));
  }

  args.push(url);
  return args;
}
