import { FilterBar } from '@/components/station/filter-bar';
import { IssueCard } from '@/components/station/cards';
import { PageHeader } from '@/components/station/page-header';
import { getIssues } from '@/lib/data/queries';
import { getString } from '@/lib/utils/query';

export default async function IssuesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const provider = getString(searchParams.provider, 'all');
  const state = getString(searchParams.state, 'all');
  const q = getString(searchParams.q);
  const issues = await getIssues({ provider, state, q });

  return (
    <div className="space-y-6">
      <PageHeader title="Known Issues" description="Track active and resolved platform issues with practical workarounds." />
      <FilterBar
        queryValue={q}
        selects={[
          { key: 'provider', value: provider, options: [{ label: 'All providers', value: 'all' }, { label: 'YouTube', value: 'youtube' }, { label: 'Instagram', value: 'instagram' }, { label: 'TikTok', value: 'tiktok' }, { label: 'Vimeo', value: 'vimeo' }, { label: 'Direct', value: 'direct' }] },
          { key: 'state', value: state, options: [{ label: 'All states', value: 'all' }, { label: 'Investigating', value: 'investigating' }, { label: 'Identified', value: 'identified' }, { label: 'Monitoring', value: 'monitoring' }, { label: 'Resolved', value: 'resolved' }] }
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">{issues.map((item) => <IssueCard key={item.id} item={item} />)}</div>
    </div>
  );
}
