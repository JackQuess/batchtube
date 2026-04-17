import { recordProviderFailure, recordProviderSuccess } from '../providerHealth.js';
import { classifyGenericProviderError } from './errorClassifier.js';
import { isGenericFailurePermanent, sleep, toHealthProvider } from './helpers.js';
import { runYtDlp } from './ytdlpRunner.js';
import { YtDlpError } from './types.js';
import type { GenericProviderErrorCode } from './types.js';
import type { FlatDownloadAttempt, FlatDownloadInput } from './strategies/types.js';

export interface FlatDownloadOptions {
  /** Use Instagram-style long backoff for rate-limit / extractor churn. */
  useInstagramBackoff: boolean;
}

export async function runFlatAttemptDownload(
  input: FlatDownloadInput,
  attempts: FlatDownloadAttempt[],
  options: FlatDownloadOptions
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  const { url, format, quality, outputFileName, provider, context } = input;
  const healthProvider = toHealthProvider(provider);
  const itemId = outputFileName;
  const batchId = context?.batchId;
  const startedAt = Date.now();

  let lastErr: Error | null = null;
  let lastStderr = '';
  let lastCode: GenericProviderErrorCode = 'provider_unknown_failure';
  let lastRetriable = true;
  let fallbackUsed = false;

  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i]!;
    if (i > 0) fallbackUsed = true;
    const attemptStartedAt = Date.now();
    try {
      const result = await runYtDlp(url, format, a.selector, outputFileName, {
        provider,
        itemId,
        batchId,
        attempt: i + 1,
        strategyName: a.strategyName,
        strategyIndex: i,
        hardened: a.hardened,
        cookiesMode: a.cookiesMode,
        extraHeaders: a.extraHeaders,
        sleepRequestsSec: a.sleepRequestsSec,
        concurrentFragmentsOverride: a.concurrentFragmentsOverride
      });
      console.log(
        JSON.stringify({
          msg: 'provider_download_attempt_succeeded',
          provider,
          itemId,
          batchId: batchId ?? null,
          url,
          attempt: i + 1,
          strategy: a.strategyName,
          ytdlp_mode: a.hardened ? 'safe' : 'fast',
          duration_ms: Date.now() - attemptStartedAt
        })
      );
      recordProviderSuccess(healthProvider, { afterFallback: fallbackUsed });
      return result;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      lastStderr = err instanceof YtDlpError ? err.stderr : lastErr.message;
      const cls = classifyGenericProviderError(lastStderr);
      lastCode = cls.code;
      lastRetriable = cls.retriable;
      console.warn(
        JSON.stringify({
          msg: 'provider_download_attempt_failed',
          provider,
          itemId,
          batchId: batchId ?? null,
          url,
          attempt: i + 1,
          strategy: a.strategyName,
          error_category: cls.code,
          stderr_summary: lastStderr.slice(0, 400),
          duration_ms: Date.now() - attemptStartedAt
        })
      );
      if (!cls.retriable) break;
      let backoff: number;
      if (cls.code === 'provider_rate_limited' || (options.useInstagramBackoff && cls.code === 'provider_extractor_failure')) {
        backoff = options.useInstagramBackoff
          ? Math.min(20000 * Math.pow(2, Math.min(i, 5)), 180000)
          : Math.min(4000 * Math.pow(2, i), 45000);
      } else {
        backoff = Math.min(750 * Math.pow(2, i), 4000);
      }
      await sleep(backoff);
    }
  }

  const permanentHealth = isGenericFailurePermanent(lastCode, lastRetriable);
  console.error(
    JSON.stringify({
      msg: 'provider_download_pipeline_failed',
      provider,
      itemId,
      batchId: batchId ?? null,
      url,
      error_category: lastCode,
      retriable: lastRetriable,
      final_outcome: permanentHealth ? 'permanent_failure' : 'transient_failure',
      stderr_summary: lastStderr.slice(0, 400),
      duration_ms: Date.now() - startedAt
    })
  );
  recordProviderFailure(healthProvider, lastCode, { permanent: permanentHealth });
  throw new Error(`${lastCode}: ${lastStderr.slice(0, 500) || lastErr?.message || 'download failed'}`);
}
