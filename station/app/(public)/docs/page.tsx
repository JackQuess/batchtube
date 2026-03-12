import Link from 'next/link';
import { FilterBar } from '@/components/station/filter-bar';
import { PageHeader } from '@/components/station/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDocs } from '@/lib/data/queries';
import { getString } from '@/lib/utils/query';

export default async function DocsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = getString(searchParams.q);
  const category = getString(searchParams.category, 'all');
  const docs = await getDocs({ q, category });

  return (
    <div className="space-y-6">
      <PageHeader title="Docs" description="Operational guides, engineering notes, and implementation playbooks." />
      <FilterBar
        queryValue={q}
        queryPlaceholder="Search docs"
        selects={[{ key: 'category', value: category, options: [{ label: 'All categories', value: 'all' }, { label: 'Reliability', value: 'reliability' }, { label: 'Operations', value: 'operations' }, { label: 'Performance', value: 'performance' }, { label: 'Platform', value: 'platform' }] }]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {docs.map((doc) => (
          <Link key={doc.id} href={`/docs/${doc.slug}`}>
            <Card className="h-full hover:border-primary/50">
              <CardHeader>
                <CardTitle>{doc.title}</CardTitle>
                <CardDescription>{doc.excerpt}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{doc.category}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
