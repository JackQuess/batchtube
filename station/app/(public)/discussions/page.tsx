import { AuthCTA } from '@/components/station/auth-cta';
import { DiscussionCard } from '@/components/station/cards';
import { DiscussionCreateForm } from '@/components/station/forms';
import { FilterBar } from '@/components/station/filter-bar';
import { PageHeader } from '@/components/station/page-header';
import { getCurrentUser } from '@/lib/auth/session';
import { getDiscussions } from '@/lib/data/queries';
import { getString } from '@/lib/utils/query';

export default async function DiscussionsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const category = getString(searchParams.category, 'all');
  const q = getString(searchParams.q);
  const user = await getCurrentUser();
  const discussions = await getDiscussions({ category, q });
  const pinned = discussions.filter((d) => d.pinned);
  const latest = discussions.filter((d) => !d.pinned);

  return (
    <div className="space-y-6">
      <PageHeader title="Discussions" description="Community problem-solving and product intelligence exchange." />
      <FilterBar queryValue={q} selects={[{ key: 'category', value: category, options: [{ label: 'All categories', value: 'all' }, { label: 'Help', value: 'help' }, { label: 'Reliability', value: 'reliability' }, { label: 'Developer', value: 'developer' }, { label: 'Ops', value: 'ops' }] }]} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="space-y-3"><h3 className="text-lg font-semibold">Pinned</h3>{pinned.map((item) => <DiscussionCard key={item.id} item={item} />)}</section>
          <section className="space-y-3"><h3 className="text-lg font-semibold">Latest</h3>{latest.map((item) => <DiscussionCard key={item.id} item={item} />)}</section>
        </div>
        <div>{user ? <DiscussionCreateForm /> : <AuthCTA title="Sign in to create a discussion" />}</div>
      </div>
    </div>
  );
}
