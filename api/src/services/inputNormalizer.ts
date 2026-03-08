/**
 * INPUT NORMALIZATION LAYER
 * Provider-agnostic: splits raw SmartBar-style input, normalizes URLs, dedupes, separates invalid.
 */

import type { NormalizedInput } from '../types/providerEngine.js';
import { isMediaUrlAllowed } from './providers.js';

function normalizeOne(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProtocol);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Normalize raw input (e.g. SmartBar paste) into structured output.
 * Splits by newlines and commas, trims, normalizes URLs, removes exact duplicates.
 */
export function normalizeInput(raw: string): NormalizedInput {
  const entries = raw
    .split(/[\r\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const normalizedUrls: string[] = [];
  const invalidEntries: string[] = [];
  const seen = new Set<string>();
  let duplicatesRemovedCount = 0;

  for (const entry of entries) {
    const url = normalizeOne(entry);
    if (!url) {
      invalidEntries.push(entry);
      continue;
    }
    const allowed = isMediaUrlAllowed(url);
    if (!allowed.ok) {
      invalidEntries.push(entry);
      continue;
    }
    if (seen.has(url)) {
      duplicatesRemovedCount += 1;
      continue;
    }
    seen.add(url);
    normalizedUrls.push(url);
  }

  return {
    normalizedUrls,
    invalidEntries,
    duplicatesRemovedCount
  };
}
