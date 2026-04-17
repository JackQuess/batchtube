import { YOUTUBE_CLIENT_STRATEGIES, getYoutubeFormatSelectors } from './constants.js';
import {
  isYoutubePermanentCode,
  isYoutubeAuthCode,
  isYoutubeRetriableCode
} from './helpers.js';
import type {
  DownloadFormat,
  DownloadQuality,
  YoutubeAttempt,
  YoutubeErrorClassification,
  YtDlpCookiesMode,
  YtDlpProbeFormat
} from './types.js';

export function getYoutubeAttemptKey(attempt: YoutubeAttempt): string {
  return [
    attempt.selector,
    attempt.selectorIndex,
    attempt.cookiesMode,
    attempt.hardened ? 'h' : 'f',
    attempt.clientStrategyIndex
  ].join(':');
}

export function planYoutubeNextAttempts(input: {
  failedAttempt: YoutubeAttempt;
  classification: YoutubeErrorClassification;
  formatSelectorCount: number;
  availableCookieModes: YtDlpCookiesMode[];
}): YoutubeAttempt[] {
  const { failedAttempt, classification, formatSelectorCount, availableCookieModes } = input;
  const out: YoutubeAttempt[] = [];
  const push = (attempt: YoutubeAttempt) => out.push(attempt);

  if (isYoutubePermanentCode(classification.code)) return out;

  if (isYoutubeAuthCode(classification.code)) {
    if (failedAttempt.cookiesMode === 'none') {
      for (const cookieMode of availableCookieModes) {
        push({
          ...failedAttempt,
          cookiesMode: cookieMode,
          hardened: true,
          clientStrategyIndex: 0,
          strategyName: `auth_cookie_${cookieMode}`
        });
      }
    }
    return out;
  }

  if (!classification.retriable) return out;

  if (!failedAttempt.hardened) {
    push({
      ...failedAttempt,
      hardened: true,
      strategyName: `${failedAttempt.strategyName}_hardened`
    });
  }

  if (classification.clientRetriable && failedAttempt.clientStrategyIndex === 0) {
    push({
      ...failedAttempt,
      hardened: true,
      clientStrategyIndex: 1,
      strategyName: `${failedAttempt.strategyName}_alt_client_1`
    });
    if (YOUTUBE_CLIENT_STRATEGIES.length > 2) {
      push({
        ...failedAttempt,
        hardened: true,
        clientStrategyIndex: 2,
        strategyName: `${failedAttempt.strategyName}_alt_client_2`
      });
    }
  }

  if (failedAttempt.cookiesMode === 'none') {
    for (const cookieMode of availableCookieModes) {
      push({
        ...failedAttempt,
        cookiesMode: cookieMode,
        hardened: true,
        clientStrategyIndex: 0,
        strategyName: `${failedAttempt.strategyName}_cookie_${cookieMode}`
      });
    }
  }

  if (failedAttempt.selectorIndex < formatSelectorCount - 1 && isYoutubeRetriableCode(classification.code)) {
    push({
      ...failedAttempt,
      selectorIndex: failedAttempt.selectorIndex + 1,
      cookiesMode: failedAttempt.cookiesMode,
      hardened: true,
      clientStrategyIndex: 0,
      strategyName: `format_fallback_${failedAttempt.selectorIndex + 1}`
    });
  }

  return out;
}

function targetHeightForQuality(quality: DownloadQuality): number | null {
  if (quality === '4k') return 2160;
  if (quality === '1080p') return 1080;
  if (quality === '720p') return 720;
  return null;
}

function protocolPenalty(protocol?: string): number {
  const p = (protocol ?? '').toLowerCase();
  if (!p) return 2;
  if (p.includes('m3u8')) return 5;
  if (p.includes('http') || p.includes('https')) return 0;
  if (p.includes('dash')) return 1;
  return 3;
}

function rankVideoFormat(fmt: YtDlpProbeFormat, quality: DownloadQuality): number {
  const height = fmt.height ?? 0;
  const target = targetHeightForQuality(quality);
  const avc1Bonus = (fmt.vcodec ?? '').startsWith('avc1') ? 10_000 : 0;
  const mp4Bonus = fmt.ext === 'mp4' ? 5_000 : 0;
  const protocolCost = protocolPenalty(fmt.protocol) * 1_000;
  const sizeScore = Math.trunc(fmt.tbr ?? 0);
  const heightScore = target ? -Math.abs(height - target) : height;
  return avc1Bonus + mp4Bonus + sizeScore + heightScore - protocolCost;
}

function rankAudioFormat(fmt: YtDlpProbeFormat): number {
  const m4aBonus = fmt.ext === 'm4a' ? 5_000 : 0;
  const protocolCost = protocolPenalty(fmt.protocol) * 1_000;
  const bitrateScore = Math.trunc(fmt.tbr ?? 0);
  return m4aBonus + bitrateScore - protocolCost;
}

export function selectYoutubeFormatSelectorFromFormats(
  formats: YtDlpProbeFormat[],
  format: DownloadFormat,
  quality: DownloadQuality
): string | null {
  if (format === 'mp3') return null;

  const usable = formats.filter((fmt) => fmt.format_id);
  const combined = usable
    .filter((fmt) => (fmt.vcodec ?? 'none') !== 'none' && (fmt.acodec ?? 'none') !== 'none')
    .sort((a, b) => rankVideoFormat(b, quality) - rankVideoFormat(a, quality));
  const videoOnly = usable
    .filter((fmt) => (fmt.vcodec ?? 'none') !== 'none' && (fmt.acodec ?? 'none') === 'none')
    .sort((a, b) => rankVideoFormat(b, quality) - rankVideoFormat(a, quality));
  const audioOnly = usable
    .filter((fmt) => (fmt.acodec ?? 'none') !== 'none' && (fmt.vcodec ?? 'none') === 'none')
    .sort((a, b) => rankAudioFormat(b) - rankAudioFormat(a));

  const bestVideo = videoOnly[0];
  const bestAudio = audioOnly[0];
  if (bestVideo?.format_id && bestAudio?.format_id) {
    return `${bestVideo.format_id}+${bestAudio.format_id}`;
  }

  const bestCombined = combined[0];
  if (bestCombined?.format_id) return bestCombined.format_id;
  return null;
}

export { getYoutubeFormatSelectors } from './constants.js';
