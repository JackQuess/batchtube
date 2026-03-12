import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/station/page-header';
import { TagPill } from '@/components/station/tag-pill';
import { Card, CardContent } from '@/components/ui/card';
import { getChangelogBySlug } from '@/lib/data/queries';
import { formatDate } from '@/lib/utils/date';

export default async function ChangelogDetailPage({ params }: { params: { slug: string } }) {
  const entry = await getChangelogBySlug(params.slug);
  if (!entry) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={entry.title} description={entry.summary} />
      <div className="flex gap-2">{entry.tags.map((tag) => <TagPill key={tag} tag={tag} />)}</div>
      <Card><CardContent className="py-6 text-sm text-slate-200">{entry.content}</CardContent></Card>
      <p className="text-xs text-muted-foreground">Published {formatDate(entry.published_at)}</p>
    </div>
  );
}
