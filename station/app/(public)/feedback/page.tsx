import { FeedbackCard } from '@/components/station/cards';
import { DiscussionCreateForm } from '@/components/station/forms';
import { FilterBar } from '@/components/station/filter-bar';
import { PageHeader } from '@/components/station/page-header';
import { AuthCTA } from '@/components/station/auth-cta';
import { getCurrentUser } from '@/lib/auth/session';
import { getFeedback } from '@/lib/data/queries';
import { getString } from '@/lib/utils/query';

export default async function FeedbackPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = getString(searchParams.q);
  const status = getString(searchParams.status, 'all');
  const sort = getString(searchParams.sort, 'trending');
  const category = getString(searchParams.category, 'all');
  const user = await getCurrentUser();
  const items = await getFeedback({ q, status, sort, category });

  return (
    <div className="space-y-6">
      <PageHeader title="Feedback" description="Feature request board with votes, comments, and roadmap alignment." />
      <FilterBar
        queryValue={q}
        queryPlaceholder="Search feedback"
        selects={[
          { key: 'status', value: status, options: [{ label: 'All statuses', value: 'all' }, { label: 'Open', value: 'open' }, { label: 'Planned', value: 'planned' }, { label: 'In progress', value: 'in_progress' }, { label: 'Completed', value: 'completed' }] },
          { key: 'sort', value: sort, options: [{ label: 'Trending', value: 'trending' }, { label: 'Top voted', value: 'top' }, { label: 'Latest', value: 'latest' }] },
          { key: 'category', value: category, options: [{ label: 'All categories', value: 'all' }, { label: 'Reliability', value: 'reliability' }, { label: 'Templates', value: 'templates' }, { label: 'Workflow', value: 'workflow' }, { label: 'Developer', value: 'developer' }] }
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">{items.map((item) => <FeedbackCard key={item.id} item={item} />)}</div>
        <div className="space-y-4">
          {user ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">Start a discussion from feedback context</h3>
              <DiscussionCreateForm />
            </div>
          ) : (
            <AuthCTA title="Sign in to vote and comment" />
          )}
        </div>
      </div>
    </div>
  );
}
