/**
 * Provider-aware concurrency limiter.
 * Ensures we don't exceed per-provider caps (e.g. lower concurrency for YouTube).
 * In-memory implementation: works for a single worker process. For multiple workers,
 * replace with a Redis-backed limiter (e.g. Redis key per provider with INCR/DECR).
 */

import { config } from '../config.js';

const DEFAULT_PROVIDER_CAPS: Record<string, number> = {
  instagram: 1
};

export function getConcurrencyForProvider(provider: string): number {
  const global = config.workerConcurrency;
  const key = provider.toLowerCase();
  const envCap = config.workerConcurrencyByProvider[key];
  if (envCap != null) return Math.min(global, envCap);
  const defaultCap = DEFAULT_PROVIDER_CAPS[key];
  const cap = defaultCap != null ? defaultCap : undefined;
  if (cap != null) return Math.min(global, cap);
  return global;
}

/** In-memory semaphore per provider. */
const active = new Map<string, number>();
const waiters = new Map<string, Array<() => void>>();

function getLimit(provider: string): number {
  return getConcurrencyForProvider(provider);
}

/**
 * Acquire a slot for the given provider. Resolves when a slot is available.
 * Call release(provider) when the job finishes.
 */
export function acquire(provider: string): Promise<void> {
  const key = provider.toLowerCase();
  const limit = getLimit(key);
  const current = active.get(key) ?? 0;
  if (current < limit) {
    active.set(key, current + 1);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const queue = waiters.get(key) ?? [];
    queue.push(resolve);
    waiters.set(key, queue);
  });
}

/**
 * Release a slot for the given provider. Unblocks one waiting acquirer if any.
 */
export function release(provider: string): void {
  const key = provider.toLowerCase();
  const current = (active.get(key) ?? 1) - 1;
  active.set(key, Math.max(0, current));
  const queue = waiters.get(key);
  if (queue && queue.length > 0) {
    const next = queue.shift()!;
    active.set(key, (active.get(key) ?? 0) + 1);
    next();
  }
}
