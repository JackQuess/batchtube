import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/station/page-header';
import { TagPill } from '@/components/station/tag-pill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTemplateBySlug, getTemplates } from '@/lib/data/queries';

export default async function TemplateDetailPage({ params }: { params: { slug: string } }) {
  const item = await getTemplateBySlug(params.slug);
  if (!item) notFound();
  const related = (await getTemplates({ provider: item.provider })).filter((t) => t.slug !== item.slug).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader title={item.title} description={item.description} />
      <div className="flex flex-wrap gap-2">{item.tags.map((tag) => <TagPill key={tag} tag={tag} />)}</div>
      <Card>
        <CardHeader><CardTitle>Preset summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-200">
          <p>Provider: {item.provider}</p>
          <p>Format: {item.format}</p>
          <p>Quality: {item.quality}</p>
          <p>Usage count: {item.usage_count}</p>
          <pre className="mt-3 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(item.example_config, null, 2)}</pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Related templates</CardTitle></CardHeader>
        <CardContent>{related.map((r) => <a key={r.id} className="block text-sm text-primary" href={`/templates/${r.slug}`}>{r.title}</a>)}</CardContent>
      </Card>
    </div>
  );
}
