import { AdminCrudShell } from '@/components/station/admin-crud-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminUpsertKnownIssueForm } from '@/lib/data/actions';
import { getAdminIssues } from '@/lib/data/admin-queries';

export default async function AdminIssuesPage() {
  const rows = await getAdminIssues();

  return (
    <AdminCrudShell
      title="Issues"
      description="Track known issues and publish workarounds for providers."
      form={
        <form action={adminUpsertKnownIssueForm} className="grid gap-3">
          <Input name="id" placeholder="id (optional for update)" />
          <Input name="title" placeholder="Title" required />
          <Input name="providerKey" placeholder="Provider key (optional)" />
          <select name="state" className="h-10 rounded-md border border-border bg-background px-3 text-sm" defaultValue="investigating">
            <option value="investigating">investigating</option>
            <option value="identified">identified</option>
            <option value="monitoring">monitoring</option>
            <option value="resolved">resolved</option>
          </select>
          <Input name="severity" placeholder="Severity" defaultValue="medium" required />
          <Input name="summary" placeholder="Summary" required />
          <Textarea name="details" placeholder="Details" required className="min-h-24" />
          <Textarea name="workaround" placeholder="Workaround (optional)" className="min-h-20" />
          <Button type="submit" className="w-fit">Save issue</Button>
        </form>
      }
      table={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="p-2">Title</th><th className="p-2">Provider</th><th className="p-2">State</th><th className="p-2">Severity</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="p-2">{row.title}</td>
                  <td className="p-2">{row.provider_key ?? '-'}</td>
                  <td className="p-2">{row.state}</td>
                  <td className="p-2">{row.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
}
