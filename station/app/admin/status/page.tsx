import { AdminCrudShell } from '@/components/station/admin-crud-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminUpsertIncidentForm, adminUpsertProviderStatusForm } from '@/lib/data/actions';
import { getAdminIncidents, getAdminProviderStatuses } from '@/lib/data/admin-queries';

export default async function AdminStatusPage() {
  const [statuses, incidents] = await Promise.all([getAdminProviderStatuses(), getAdminIncidents()]);

  return (
    <AdminCrudShell
      title="Status"
      description="Update provider health snapshots and publish incidents from the same screen."
      form={
        <div className="grid gap-6 lg:grid-cols-2">
          <form action={adminUpsertProviderStatusForm} className="grid gap-3 rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Provider Status</p>
            <Input name="providerKey" placeholder="provider key (youtube)" required />
            <select name="status" className="h-10 rounded-md border border-border bg-background px-3 text-sm" defaultValue="operational">
              <option value="operational">operational</option>
              <option value="degraded">degraded</option>
              <option value="partial_outage">partial_outage</option>
              <option value="outage">outage</option>
            </select>
            <Input name="successRate" placeholder="success rate (optional)" />
            <Input name="retryRecoveryRate" placeholder="retry recovery rate (optional)" />
            <Textarea name="summary" placeholder="Summary" required />
            <Button type="submit" className="w-fit">Save provider status</Button>
          </form>

          <form action={adminUpsertIncidentForm} className="grid gap-3 rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Incident</p>
            <Input name="id" placeholder="id (optional for update)" />
            <Input name="title" placeholder="Title" required />
            <Input name="providerKey" placeholder="provider key" required />
            <select name="status" className="h-10 rounded-md border border-border bg-background px-3 text-sm" defaultValue="investigating">
              <option value="investigating">investigating</option>
              <option value="identified">identified</option>
              <option value="monitoring">monitoring</option>
              <option value="resolved">resolved</option>
            </select>
            <Input name="severity" placeholder="Severity" defaultValue="medium" required />
            <Input name="summary" placeholder="Summary" required />
            <Textarea name="details" placeholder="Details" required className="min-h-24" />
            <Button type="submit" className="w-fit">Save incident</Button>
          </form>
        </div>
      }
      table={
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto">
            <p className="mb-2 text-sm font-medium">Provider Statuses</p>
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="p-2">Provider</th><th className="p-2">Status</th><th className="p-2">Success</th></tr>
              </thead>
              <tbody>
                {statuses.map((row) => (
                  <tr key={row.provider_key} className="border-t border-border/70">
                    <td className="p-2">{row.provider_key}</td>
                    <td className="p-2">{row.status}</td>
                    <td className="p-2">{row.success_rate ?? '-'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto">
            <p className="mb-2 text-sm font-medium">Incidents</p>
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="p-2">Title</th><th className="p-2">Provider</th><th className="p-2">Status</th></tr>
              </thead>
              <tbody>
                {incidents.map((row) => (
                  <tr key={row.id} className="border-t border-border/70">
                    <td className="p-2">{row.title}</td>
                    <td className="p-2">{row.provider_key}</td>
                    <td className="p-2">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    />
  );
}
