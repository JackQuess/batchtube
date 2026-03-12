import { AdminCrudShell } from '@/components/station/admin-crud-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminUpsertDocForm } from '@/lib/data/actions';
import { getAdminDocs } from '@/lib/data/admin-queries';

export default async function AdminDocsPage() {
  const rows = await getAdminDocs();

  return (
    <AdminCrudShell
      title="Docs"
      description="Create or update docs entries. Provide an existing id to update a row."
      form={
        <form action={adminUpsertDocForm} className="grid gap-3">
          <Input name="id" placeholder="id (optional for update)" />
          <Input name="title" placeholder="Title" required />
          <Input name="excerpt" placeholder="Excerpt" required />
          <Input name="categoryId" placeholder="Category ID (optional)" />
          <Textarea name="content" placeholder="Content" required className="min-h-36" />
          <Button type="submit" className="w-fit">Save doc</Button>
        </form>
      }
      table={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="p-2">Title</th><th className="p-2">Slug</th><th className="p-2">Published</th><th className="p-2">Updated</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="p-2">{row.title}</td>
                  <td className="p-2">{row.slug}</td>
                  <td className="p-2">{row.published ? 'yes' : 'no'}</td>
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
