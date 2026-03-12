import { notFound } from 'next/navigation';
import { MetricPill } from '@/components/station/metric-pill';
import { PageHeader } from '@/components/station/page-header';
import { StatusBadge } from '@/components/station/status-badge';
import { TagPill } from '@/components/station/tag-pill';
import { Card, CardContent } from '@/components/ui/card';
import { getFeedback, getRoadmapBySlug } from '@/lib/data/queries';

export default async function RoadmapDetailPage({ params }: { params: { slug: string } }) {
  const item = await getRoadmapBySlug(params.slug);
  if (!item) notFound();
  const relatedFeedback = (await getFeedback()).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader title={item.title} description={item.summary} actions={<StatusBadge value={item.status} />} />
      <div className="flex flex-wrap gap-2">{item.tags.map((tag) => <TagPill key={tag} tag={tag} />)}</div>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricPill label="Priority" value={item.priority} />
        <MetricPill label="ETA" value={item.eta_label ?? 'TBD'} />
        <MetricPill label="Related feedback" value={item.related_feedback_count} />
      </div>
      <Card><CardContent className="py-6 text-sm text-slate-200">{item.content ?? item.summary}</CardContent></Card>
      <Card>
        <CardContent className="space-y-2 py-6">
          <h3 className="text-sm font-semibold">Related feedback</h3>
          {relatedFeedback.map((f) => <a key={f.id} className="block text-sm text-primary" href={`/feedback/${f.slug}`}>{f.title}</a>)}
        </CardContent>
      </Card>
    </div>
  );
}
