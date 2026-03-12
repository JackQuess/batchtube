import { AdminCrudShell } from '@/components/station/admin-crud-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminUpsertRoadmapForm } from '@/lib/data/actions';
import { getAdminRoadmap } from '@/lib/data/admin-queries';

export default async function AdminRoadmapPage() {
  const rows = await getAdminRoadmap();

  return (
    <AdminCrudShell
      title="Roadmap"
      description="Manage roadmap pipeline, priority, and ETA labels."
      form={
        <form action={adminUpsertRoadmapForm} className="grid gap-3">
          <Input name="id" placeholder="id (optional for update)" />
          <Input name="title" placeholder="Title" required />
          <select name="status" className="h-10 rounded-md border border-border bg-background px-3 text-sm" defaultValue="planned">
            <option value="under_consideration">under_consideration</option>
            <option value="planned">planned</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
          </select>
          <select name="priority" className="h-10 rounded-md border border-border bg-background px-3 text-sm" defaultValue="medium">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
          <Input name="etaLabel" placeholder="ETA label (optional)" />
          <Textarea name="summary" placeholder="Summary" required className="min-h-28" />
          <Button type="submit" className="w-fit">Save roadmap item</Button>
        </form>
      }
      table={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="p-2">Title</th><th className="p-2">Status</th><th className="p-2">Priority</th><th className="p-2">Updated</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="p-2">{row.title}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">{row.priority}</td>
                  <td className="p-2">{new Date(row.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
}
