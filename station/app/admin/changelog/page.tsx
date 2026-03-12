import { AdminCrudShell } from '@/components/station/admin-crud-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminUpsertChangelogForm } from '@/lib/data/actions';
import { getAdminChangelog } from '@/lib/data/admin-queries';

export default async function AdminChangelogPage() {
  const rows = await getAdminChangelog();

  return (
    <AdminCrudShell
      title="Changelog"
      description="Publish release notes and product updates."
      form={
        <form action={adminUpsertChangelogForm} className="grid gap-3">
          <Input name="id" placeholder="id (optional for update)" />
          <Input name="title" placeholder="Title" required />
          <select name="category" className="h-10 rounded-md border border-border bg-background px-3 text-sm" defaultValue="product">
            <option value="reliability">reliability</option>
            <option value="performance">performance</option>
            <option value="product">product</option>
            <option value="community">community</option>
            <option value="status">status</option>
            <option value="security">security</option>
            <option value="platform">platform</option>
            <option value="observability">observability</option>
          </select>
          <Input name="summary" placeholder="Summary" required />
          <Textarea name="content" placeholder="Content" required className="min-h-32" />
          <Button type="submit" className="w-fit">Save changelog entry</Button>
        </form>
      }
      table={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="p-2">Title</th><th className="p-2">Category</th><th className="p-2">Published</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="p-2">{row.title}</td>
                  <td className="p-2">{row.category}</td>
                  <td className="p-2">{row.published ? 'yes' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
}
