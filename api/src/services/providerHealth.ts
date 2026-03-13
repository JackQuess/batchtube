/**
 * PROVIDER HEALTH SIGNALS
 *
 * Lightweight, in-memory counters + structured logs to understand
 * how often specific providers/error codes are failing in production.
 *
 * This is intentionally simple and stateless across process restarts;
 * Railway logs are the primary source of truth.
 */

import { SUPPORTED_PROVIDER_IDS } from './providers.js';

export type ProviderName = string;

export interface ProviderHealthSnapshot {
  provider: ProviderName;
  totalFailures: number;
  totalSuccesses: number;
  successAfterFallback: number;
  permanentFailures: number;
  byCode: Record<string, number>;
}

type HealthState = {
  totalFailures: number;
  totalSuccesses: number;
  successAfterFallback: number;
  permanentFailures: number;
  byCode: Record<string, number>;
};

const health = new Map<string, HealthState>();

function createState(): HealthState {
  return {
    totalFailures: 0,
    totalSuccesses: 0,
    successAfterFallback: 0,
    permanentFailures: 0,
    byCode: {}
  };
}

for (const provider of SUPPORTED_PROVIDER_IDS) {
  health.set(provider, createState());
}
health.set('generic', health.get('generic') ?? createState());

function getState(provider: string): HealthState {
  const key = provider.toLowerCase();
  const existing = health.get(key);
  if (existing) return existing;
  const fresh = createState();
  health.set(key, fresh);
  return fresh;
}

/**
 * Record a provider failure with a machine-readable code.
 * Emits a structured log that can be aggregated in log search.
 */
export function recordProviderFailure(
  provider: ProviderName,
  code: string,
  options: { permanent?: boolean } = {}
): void {
  const state = getState(provider);
  state.totalFailures += 1;
  state.byCode[code] = (state.byCode[code] ?? 0) + 1;
  if (options.permanent) state.permanentFailures += 1;

  // Structured log for observability (Railway / log tools).
  // Example: youtube_bot_check, youtube_client_failed, instagram_compatibility_failed.
  console.warn(
    JSON.stringify({
      msg: 'provider_health_event',
      provider,
      outcome: 'failure',
      code,
      totalFailures: state.totalFailures,
      permanentFailures: state.permanentFailures,
      codeCount: state.byCode[code]
    })
  );
}

export function recordProviderSuccess(
  provider: ProviderName,
  options: { afterFallback?: boolean } = {}
): void {
  const state = getState(provider);
  state.totalSuccesses += 1;
  if (options.afterFallback) state.successAfterFallback += 1;

  console.log(
    JSON.stringify({
      msg: 'provider_health_event',
      provider,
      outcome: 'success',
      totalSuccesses: state.totalSuccesses,
      successAfterFallback: state.successAfterFallback
    })
  );
}

/**
 * Snapshot current in-memory counters for debugging or future APIs.
 */
export function getProviderHealthSnapshot(provider: ProviderName): ProviderHealthSnapshot {
  const state = getState(provider);
  return {
    provider,
    totalFailures: state.totalFailures,
    totalSuccesses: state.totalSuccesses,
    successAfterFallback: state.successAfterFallback,
    permanentFailures: state.permanentFailures,
    byCode: { ...state.byCode }
  };
}

export function getAllProviderHealthSnapshots(): ProviderHealthSnapshot[] {
  const snapshots: ProviderHealthSnapshot[] = [];
  for (const [provider, state] of health.entries()) {
    snapshots.push({
      provider,
      totalFailures: state.totalFailures,
      totalSuccesses: state.totalSuccesses,
      successAfterFallback: state.successAfterFallback,
      permanentFailures: state.permanentFailures,
      byCode: { ...state.byCode }
    });
  }
  snapshots.sort((a, b) => a.provider.localeCompare(b.provider));
  return snapshots;
}
