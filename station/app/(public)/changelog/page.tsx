import { ChangelogCard } from '@/components/station/cards';
import { FilterBar } from '@/components/station/filter-bar';
import { PageHeader } from '@/components/station/page-header';
import { getChangelog } from '@/lib/data/queries';
import { getString } from '@/lib/utils/query';

export default async function ChangelogPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = getString(searchParams.q);
  const category = getString(searchParams.category, 'all');
  const entries = await getChangelog({ q, category });

  return (
    <div className="space-y-6">
      <PageHeader title="Changelog" description="Transparent release notes for speed, reliability, and product evolution." />
      <FilterBar queryValue={q} selects={[{ key: 'category', value: category, options: [{ label: 'All', value: 'all' }, { label: 'Reliability', value: 'reliability' }, { label: 'Observability', value: 'observability' }, { label: 'Product', value: 'product' }, { label: 'Community', value: 'community' }] }]} />
      <div className="grid gap-4 md:grid-cols-2">{entries.map((entry) => <ChangelogCard key={entry.id} item={entry} />)}</div>
    </div>
  );
}
