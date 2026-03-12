import { RoadmapCard } from '@/components/station/cards';
import { FilterBar } from '@/components/station/filter-bar';
import { PageHeader } from '@/components/station/page-header';
import { getRoadmap } from '@/lib/data/queries';
import { getString } from '@/lib/utils/query';

const groups = ['under_consideration', 'planned', 'in_progress', 'completed'] as const;

export default async function RoadmapPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const status = getString(searchParams.status, 'all');
  const q = getString(searchParams.q);
  const items = await getRoadmap({ status, q });

  return (
    <div className="space-y-6">
      <PageHeader title="Roadmap" description="What we are considering, building, and shipping." />
      <FilterBar queryValue={q} selects={[{ key: 'status', value: status, options: [{ label: 'All', value: 'all' }, ...groups.map((g) => ({ label: g.replaceAll('_', ' '), value: g }))] }]} />
      {groups.map((group) => (
        <section key={group} className="space-y-3">
          <h2 className="text-lg font-semibold capitalize">{group.replaceAll('_', ' ')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {items.filter((i) => i.status === group).map((item) => <RoadmapCard key={item.id} item={item} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
