/**
 * PROVIDER HEALTH SIGNALS
 *
 * Lightweight, in-memory counters + structured logs to understand
 * how often specific providers/error codes are failing in production.
 *
 * This is intentionally simple and stateless across process restarts;
 * Railway logs are the primary source of truth.
 */

export type ProviderName = 'youtube' | 'instagram' | 'tiktok' | 'vimeo' | 'direct' | 'generic';

export interface ProviderHealthSnapshot {
  provider: ProviderName;
  totalFailures: number;
  byCode: Record<string, number>;
}

type HealthState = {
  totalFailures: number;
  byCode: Record<string, number>;
};

const health: Record<ProviderName, HealthState> = {
  youtube: { totalFailures: 0, byCode: {} },
  instagram: { totalFailures: 0, byCode: {} },
  tiktok: { totalFailures: 0, byCode: {} },
  vimeo: { totalFailures: 0, byCode: {} },
  direct: { totalFailures: 0, byCode: {} },
  generic: { totalFailures: 0, byCode: {} }
};

/**
 * Record a provider failure with a machine-readable code.
 * Emits a structured log that can be aggregated in log search.
 */
export function recordProviderFailure(provider: ProviderName, code: string): void {
  const state = health[provider] ?? health.generic;
  state.totalFailures += 1;
  state.byCode[code] = (state.byCode[code] ?? 0) + 1;

  // Structured log for observability (Railway / log tools).
  // Example: youtube_bot_check, youtube_client_failed, instagram_compatibility_failed.
  console.warn(
    JSON.stringify({
      msg: 'provider_health_event',
      provider,
      code,
      totalFailures: state.totalFailures,
      codeCount: state.byCode[code]
    })
  );
}

/**
 * Snapshot current in-memory counters for debugging or future APIs.
 */
export function getProviderHealthSnapshot(provider: ProviderName): ProviderHealthSnapshot {
  const state = health[provider] ?? health.generic;
  return {
    provider,
    totalFailures: state.totalFailures,
    byCode: { ...state.byCode }
  };
}

