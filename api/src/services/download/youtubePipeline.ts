import fs from 'node:fs';
import { config } from '../../config.js';
import { recordProviderFailure, recordProviderSuccess } from '../providerHealth.js';
import { YOUTUBE_CLIENT_STRATEGIES } from './constants.js';
import { classifyYoutubeError } from './errorClassifier.js';
import {
  isYoutubeHealthPermanentFailure,
  logYoutube,
  sanitizeStderr
} from './helpers.js';
import { ensureYtDlpVersionLogged, runYtDlp } from './ytdlpRunner.js';
import { YtDlpError } from './types.js';
import type { DownloadContext, DownloadFormat, DownloadQuality, YoutubeErrorCode } from './types.js';
import { ensureFreshCookies } from '../cookieRefresh.js';
import {
  youtubeDefaultStrategy,
  youtubeFastStrategy,
  youtubeSafeStrategy,
  type YoutubeEngineStrategy
} from './strategies/youtubeEngineStrategies.js';

const FORMAT_UNAVAILABLE_RE = /(requested format is not available|requested format not available|no video formats found)/i;

async function ensureCookiesReady(): Promise<{ mode: 'file' | 'none'; path: string | null; exists: boolean; bytes: number }> {
  const cookiePath = config.ytDlpCookiesPath?.trim() || '';
  if (!cookiePath) return { mode: 'none', path: null, exists: false, bytes: 0 };

  try {
    await ensureFreshCookies();
  } catch {
    // keep going; existence/size check is authoritative
  }

  try {
    if (fs.existsSync(cookiePath)) {
      const bytes = fs.statSync(cookiePath).size;
      if (bytes > 1000) return { mode: 'file', path: cookiePath, exists: true, bytes };
      return { mode: 'none', path: cookiePath, exists: true, bytes };
    }
  } catch {
    // ignore
  }
  return { mode: 'none', path: cookiePath, exists: false, bytes: 0 };
}

function youtubeMp4Strategies(): YoutubeEngineStrategy[] {
  const list: YoutubeEngineStrategy[] = [];
  const override = config.ytDlpFormatOverride.trim();
  if (override) {
    list.push({
      strategyName: 'youtubeFormatOverrideStrategy',
      selectedFormat: override,
      mergeOutputEnabled: true,
      concurrentFragments: Math.max(1, config.ytDlpConcurrentFragmentsFast || 8),
      hardened: false
    });
  }
  list.push(youtubeFastStrategy, youtubeSafeStrategy, youtubeDefaultStrategy);
  return list;
}

export async function runYoutubeDownloadWithFallbacks(
  url: string,
  format: DownloadFormat,
  quality: DownloadQuality,
  outputFileName: string,
  context?: DownloadContext
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  await ensureYtDlpVersionLogged();
  const itemId = outputFileName;
  const batchId = context?.batchId ?? null;
  const cookie = await ensureCookiesReady();
  const cookiesMode = cookie.mode;
  const proxy = config.ytDlpProxy.trim();
  const extractorArgs = config.ytDlpExtractorArgsOverride.trim() || YOUTUBE_CLIENT_STRATEGIES[0];

  const strategies: YoutubeEngineStrategy[] = format === 'mp3'
    ? [
        {
          strategyName: 'youtubeDefaultStrategy',
          selectedFormat: null,
          mergeOutputEnabled: false,
          concurrentFragments: Math.max(1, config.ytDlpConcurrentFragmentsSafe || 4),
          hardened: true
        }
      ]
    : youtubeMp4Strategies();

  let attempts = 0;
  let lastStderr = '';
  let lastCode: YoutubeErrorCode = 'youtube_unknown';
  let lastExitCode: number | null = null;
  const startedAt = Date.now();

  for (const strategy of strategies) {
    if (attempts >= config.ytDlpYoutubeMaxAttempts) break;
    attempts += 1;
    const attemptStartedAt = Date.now();

    try {
      const result = await runYtDlp(url, format, strategy.selectedFormat ?? '', outputFileName, {
        extractorArgs,
        proxyUrl: proxy || undefined,
        strategyName: strategy.strategyName,
        strategyIndex: attempts - 1,
        attempt: attempts,
        itemId,
        batchId: batchId ?? undefined,
        provider: 'youtube',
        cookiesMode,
        hardened: strategy.hardened,
        retriesOverride: 3,
        fragmentRetriesOverride: 3,
        socketTimeoutSecOverride: 20,
        concurrentFragmentsOverride: strategy.concurrentFragments,
        disableMergeOutput: !strategy.mergeOutputEnabled
      });

      if (!fs.existsSync(result.filePath) || fs.statSync(result.filePath).size <= 0) {
        throw new Error('youtube_output_missing_or_empty');
      }

      const durationMs = Date.now() - attemptStartedAt;
      logYoutube('final_format_success', {
        provider: 'youtube',
        itemId,
        batchId,
        url,
        attempt: attempts,
        strategy_name: strategy.strategyName,
        selected_format: strategy.selectedFormat,
        merge_output_enabled: strategy.mergeOutputEnabled,
        cookies_mode: cookiesMode,
        cookie_file_exists: cookie.exists,
        cookie_file_bytes: cookie.bytes,
        ytdlp_args_has_cookies: cookiesMode === 'file',
        proxy_enabled: Boolean(proxy),
        duration_ms: durationMs,
        stderr_summary: null,
        exit_code: 0
      });
      recordProviderSuccess('youtube', { afterFallback: attempts > 1 });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastStderr = error instanceof YtDlpError ? error.stderr : err.message;
      lastExitCode = error instanceof YtDlpError ? error.exitCode : -1;
      lastCode = classifyYoutubeError(lastStderr).code;
      const durationMs = Date.now() - attemptStartedAt;
      const formatErrorDetected = FORMAT_UNAVAILABLE_RE.test(lastStderr);
      logYoutube('youtube_download_attempt_failed', {
        provider: 'youtube',
        itemId,
        batchId,
        url,
        attempt: attempts,
        strategy_name: strategy.strategyName,
        selected_format: strategy.selectedFormat,
        merge_output_enabled: strategy.mergeOutputEnabled,
        cookies_mode: cookiesMode,
        cookie_file_exists: cookie.exists,
        cookie_file_bytes: cookie.bytes,
        ytdlp_args_has_cookies: cookiesMode === 'file',
        proxy_enabled: Boolean(proxy),
        error_category: lastCode,
        format_error_detected: formatErrorDetected,
        stderr_summary: lastStderr.slice(0, 400),
        exit_code: lastExitCode,
        duration_ms: durationMs
      });
      // Continue until all strategies are exhausted. Format errors are expected to move to next strategy.
      continue;
    }
  }

  const code = lastCode;
  const finalMsg = `${code}: ${lastStderr.slice(0, 500)}`;
  logYoutube('youtube_download_pipeline_failed', {
    provider: 'youtube',
    itemId,
    batchId,
    url,
    total_attempts: attempts,
    duration_ms: Date.now() - startedAt,
    error_category: code,
    stderr_summary: sanitizeStderr(lastStderr, 400),
    exit_code: lastExitCode,
    final_outcome: isYoutubeHealthPermanentFailure(code) ? 'permanent_failure' : 'transient_failure'
  });
  recordProviderFailure('youtube', code, { permanent: isYoutubeHealthPermanentFailure(code) });
  throw new Error(finalMsg || 'youtube_unknown');
}
