import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getIncidents, getIssues, getProviderStatuses } from '@/lib/data/queries';

export default async function AdminOverviewPage() {
  const [incidents, issues, statuses] = await Promise.all([getIncidents(), getIssues(), getProviderStatuses()]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Active incidents</CardTitle></CardHeader><CardContent>{incidents.filter((i) => i.status !== 'resolved').length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Open issues</CardTitle></CardHeader><CardContent>{issues.filter((i) => i.state !== 'resolved').length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Providers</CardTitle></CardHeader><CardContent>{statuses.length}</CardContent></Card>
      </div>
    </div>
  );
}
