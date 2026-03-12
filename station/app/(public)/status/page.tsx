import { IncidentCard, ProviderStatusCard } from '@/components/station/cards';
import { PageHeader } from '@/components/station/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { getIncidents, getProviderStatuses } from '@/lib/data/queries';

export default async function StatusPage() {
  const [providers, incidents] = await Promise.all([getProviderStatuses(), getIncidents()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Provider Status" description="Live provider health, recovery metrics, and incidents timeline." />
      <Card>
        <CardContent className="grid gap-3 py-5 md:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Providers monitored</p><p className="text-lg font-semibold">{providers.length}</p></div>
          <div><p className="text-xs text-muted-foreground">Active incidents</p><p className="text-lg font-semibold">{incidents.filter((i) => i.status !== 'resolved').length}</p></div>
          <div><p className="text-xs text-muted-foreground">Platform health summary</p><p className="text-lg font-semibold">Stable with targeted degradation</p></div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{providers.map((item) => <ProviderStatusCard key={item.provider_key} item={item} />)}</div>
      <div className="space-y-4"><h2 className="text-lg font-semibold">Incident feed</h2>{incidents.map((item) => <IncidentCard key={item.id} item={item} />)}</div>
    </div>
  );
}
