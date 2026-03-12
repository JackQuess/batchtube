import { Card } from '@/components/ui/card';

export function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </Card>
  );
}
