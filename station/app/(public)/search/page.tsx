import Link from 'next/link';
import { SearchBar } from '@/components/station/search-bar';
import { PageHeader } from '@/components/station/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { globalSearch } from '@/lib/data/queries';
import { getString } from '@/lib/utils/query';

const hrefByType: Record<string, (slug: string, provider?: string) => string> = {
  doc: (slug) => `/docs/${slug}`,
  feedback: (slug) => `/feedback/${slug}`,
  roadmap: (slug) => `/roadmap/${slug}`,
  template: (slug) => `/templates/${slug}`,
  issue: (slug) => `/issues/${slug}`,
  changelog: (slug) => `/changelog/${slug}`,
  discussion: (slug) => `/discussions/${slug}`,
  incident: (_slug, provider) => `/status/${provider}`
};

export default async function SearchPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = getString(searchParams.q);
  const results = await globalSearch(q);

  return (
    <div className="space-y-6">
      <PageHeader title="Global Search" description="Search docs, feedback, roadmap, templates, incidents, issues, changelog, and discussions." />
      <SearchBar initialQuery={q} />
      <Card>
        <CardHeader><CardTitle>Results {q ? `for “${q}”` : ''}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {results.map((result, i) => {
            const anyItem = result.item as any;
            const href = hrefByType[result.type](anyItem.slug ?? '', anyItem.provider_key);
            return (
              <Link key={`${result.type}-${i}`} href={href} className="block rounded-md border border-border p-3 hover:border-primary/50">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{result.type}</p>
                <p className="text-sm font-medium text-white">{anyItem.title}</p>
              </Link>
            );
          })}
          {results.length === 0 ? <p className="text-sm text-muted-foreground">No results yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
