import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/station/page-header';
import { TagPill } from '@/components/station/tag-pill';
import { Card, CardContent } from '@/components/ui/card';
import { getDocBySlug, getDocs } from '@/lib/data/queries';
import { formatDate } from '@/lib/utils/date';

export default async function DocDetailPage({ params }: { params: { slug: string } }) {
  const doc = await getDocBySlug(params.slug);
  if (!doc) notFound();
  const related = (await getDocs()).filter((d) => d.slug !== doc.slug).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader title={doc.title} description={doc.excerpt} />
      <div className="flex flex-wrap gap-2">{doc.tags.map((tag) => <TagPill key={tag} tag={tag} />)}</div>
      <Card><CardContent className="prose prose-invert max-w-none py-6 text-sm text-slate-200">{doc.content}</CardContent></Card>
      <p className="text-xs text-muted-foreground">Updated {formatDate(doc.updated_at)}</p>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Related docs</h3>
        {related.map((item) => <a className="block text-sm text-primary" key={item.id} href={`/docs/${item.slug}`}>{item.title}</a>)}
      </div>
    </div>
  );
}
