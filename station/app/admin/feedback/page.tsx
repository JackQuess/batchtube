import { AdminCrudShell } from '@/components/station/admin-crud-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminUpsertFeedbackForm } from '@/lib/data/actions';
import { getAdminFeedback } from '@/lib/data/admin-queries';

export default async function AdminFeedbackPage() {
  const rows = await getAdminFeedback();

  return (
    <AdminCrudShell
      title="Feedback"
      description="Manage feature request entries and statuses."
      form={
        <form action={adminUpsertFeedbackForm} className="grid gap-3">
          <Input name="id" placeholder="id (optional for update)" />
          <Input name="title" placeholder="Title" required />
          <Input name="categoryId" placeholder="Category ID (optional)" />
          <select name="status" className="h-10 rounded-md border border-border bg-background px-3 text-sm" defaultValue="open">
            <option value="open">open</option>
            <option value="planned">planned</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
            <option value="declined">declined</option>
          </select>
          <Textarea name="description" placeholder="Description" required className="min-h-28" />
          <Button type="submit" className="w-fit">Save feedback</Button>
        </form>
      }
      table={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="p-2">Title</th><th className="p-2">Slug</th><th className="p-2">Status</th><th className="p-2">Updated</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="p-2">{row.title}</td>
                  <td className="p-2">{row.slug}</td>
                  <td className="p-2">{row.status}</td>
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
