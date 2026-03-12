import { notFound } from 'next/navigation';
import { IncidentCard, IssueCard } from '@/components/station/cards';
import { MetricPill } from '@/components/station/metric-pill';
import { PageHeader } from '@/components/station/page-header';
import { StatusBadge } from '@/components/station/status-badge';
import { getIncidents, getIssues, getProviderStatus, getChangelog } from '@/lib/data/queries';

export default async function ProviderStatusDetailPage({ params }: { params: { provider: string } }) {
  const provider = await getProviderStatus(params.provider);
  if (!provider) notFound();
  const [incidents, issues, changelog] = await Promise.all([
    getIncidents({ provider: params.provider }),
    getIssues({ provider: params.provider }),
    getChangelog()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={`${provider.provider_key} status`} description={provider.summary} actions={<StatusBadge value={provider.status} />} />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricPill label="Success rate" value={`${provider.success_rate ?? '-'}%`} />
        <MetricPill label="Retry recovery" value={`${provider.retry_recovery_rate ?? '-'}%`} />
        <MetricPill label="Incidents" value={incidents.length} />
      </div>
      <section className="space-y-3"><h3 className="text-lg font-semibold">Recent incidents</h3>{incidents.map((item) => <IncidentCard key={item.id} item={item} />)}</section>
      <section className="space-y-3"><h3 className="text-lg font-semibold">Known issues</h3>{issues.map((item) => <IssueCard key={item.id} item={item} />)}</section>
      <section className="space-y-2"><h3 className="text-lg font-semibold">Related changelog</h3>{changelog.slice(0, 4).map((item) => <a className="block text-sm text-primary" key={item.id} href={`/changelog/${item.slug}`}>{item.title}</a>)}</section>
    </div>
  );
}
