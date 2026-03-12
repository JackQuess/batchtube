import { AdminCrudShell } from '@/components/station/admin-crud-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminUpsertTemplateForm } from '@/lib/data/actions';
import { getAdminTemplates } from '@/lib/data/admin-queries';

export default async function AdminTemplatesPage() {
  const rows = await getAdminTemplates();

  return (
    <AdminCrudShell
      title="Templates"
      description="Manage reusable download presets shown on the public template gallery."
      form={
        <form action={adminUpsertTemplateForm} className="grid gap-3">
          <Input name="id" placeholder="id (optional for update)" />
          <Input name="title" placeholder="Title" required />
          <Input name="provider" placeholder="Provider (youtube, instagram, ... )" required />
          <Input name="format" placeholder="Format (mp4, mp3, ... )" required />
          <Input name="quality" placeholder="Quality (best, 720p, ... )" required />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" /> Featured</label>
          <Textarea name="description" placeholder="Description" required className="min-h-28" />
          <Button type="submit" className="w-fit">Save template</Button>
        </form>
      }
      table={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="p-2">Title</th><th className="p-2">Provider</th><th className="p-2">Format</th><th className="p-2">Featured</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="p-2">{row.title}</td>
                  <td className="p-2">{row.provider}</td>
                  <td className="p-2">{row.format}/{row.quality}</td>
                  <td className="p-2">{row.featured ? 'yes' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
}
