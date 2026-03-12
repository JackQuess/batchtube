import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/station/page-header';
import { StatusBadge } from '@/components/station/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getIssueBySlug } from '@/lib/data/queries';
import { formatDate } from '@/lib/utils/date';

export default async function IssueDetailPage({ params }: { params: { slug: string } }) {
  const issue = await getIssueBySlug(params.slug);
  if (!issue) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={issue.title} description={issue.summary} actions={<StatusBadge value={issue.state} />} />
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-200">
          <p>Provider: {issue.provider_key ?? 'general'}</p>
          <p>Severity: {issue.severity}</p>
          <p>{issue.details}</p>
          {issue.workaround ? <p><strong>Workaround:</strong> {issue.workaround}</p> : null}
          <p className="text-xs text-muted-foreground">Updated {formatDate(issue.updated_at)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
