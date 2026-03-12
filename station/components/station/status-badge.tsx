import { Badge } from '@/components/ui/badge';
import type { IncidentStatus, IssueState, ProviderHealthStatus } from '@/types/domain';
import { cn } from '@/lib/utils/cn';

const tone: Record<string, string> = {
  operational: 'border-emerald-400/40 text-emerald-300',
  degraded: 'border-amber-400/40 text-amber-300',
  partial_outage: 'border-orange-400/40 text-orange-300',
  outage: 'border-red-400/40 text-red-300',
  investigating: 'border-amber-400/40 text-amber-300',
  identified: 'border-orange-400/40 text-orange-300',
  monitoring: 'border-sky-400/40 text-sky-300',
  resolved: 'border-emerald-400/40 text-emerald-300'
};

export function StatusBadge({ value }: { value: ProviderHealthStatus | IncidentStatus | IssueState | string }) {
  return <Badge className={cn('capitalize', tone[value] ?? '')}>{value.replaceAll('_', ' ')}</Badge>;
}
