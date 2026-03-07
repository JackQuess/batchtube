import React from 'react';
import { getProviderName, getProviderColorClass } from '../../lib/providerDisplay';

export interface ProviderGroupSummaryProps {
  providerCounts: Record<string, number>;
  providerLabel?: (key: string) => string;
}

export function ProviderGroupSummary({ providerCounts, providerLabel }: ProviderGroupSummaryProps) {
  const labelFn = providerLabel ?? getProviderName;
  const entries = Object.entries(providerCounts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([provider, count]) => (
        <span
          key={provider}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${getProviderColorClass(provider)}`}
        >
          {labelFn(provider)} · {count}
        </span>
      ))}
    </div>
  );
}
