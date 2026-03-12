import { AdminCrudShell } from '@/components/station/admin-crud-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminModerateDiscussionForm, adminUpsertDiscussionForm } from '@/lib/data/actions';
import { getAdminDiscussions } from '@/lib/data/admin-queries';

export default async function AdminDiscussionsPage() {
  const rows = await getAdminDiscussions();

  return (
    <AdminCrudShell
      title="Discussions"
      description="Create discussions and moderate pinned/locked flags."
      form={
        <div className="grid gap-6 lg:grid-cols-2">
          <form action={adminUpsertDiscussionForm} className="grid gap-3 rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Create / Update Discussion</p>
            <Input name="id" placeholder="id (optional for update)" />
            <Input name="title" placeholder="Title" required />
            <Textarea name="content" placeholder="Content" required className="min-h-24" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" /> pinned</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="locked" /> locked</label>
            <Button type="submit" className="w-fit">Save discussion</Button>
          </form>

          <form action={adminModerateDiscussionForm} className="grid gap-3 rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Moderate Existing</p>
            <Input name="discussionId" placeholder="discussion id" required />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" /> set pinned</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="locked" /> set locked</label>
            <Button type="submit" className="w-fit">Apply moderation</Button>
          </form>
        </div>
      }
      table={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="p-2">Title</th><th className="p-2">Pinned</th><th className="p-2">Locked</th><th className="p-2">Views</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="p-2">{row.title}</td>
                  <td className="p-2">{row.pinned ? 'yes' : 'no'}</td>
                  <td className="p-2">{row.locked ? 'yes' : 'no'}</td>
                  <td className="p-2">{row.views_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
}
