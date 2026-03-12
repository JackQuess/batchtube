import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';

const links = [
  ['/admin', 'Overview'],
  ['/admin/docs', 'Docs'],
  ['/admin/feedback', 'Feedback'],
  ['/admin/roadmap', 'Roadmap'],
  ['/admin/templates', 'Templates'],
  ['/admin/status', 'Status'],
  ['/admin/issues', 'Issues'],
  ['/admin/changelog', 'Changelog'],
  ['/admin/discussions', 'Discussions']
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['admin', 'moderator']);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container grid gap-6 py-8 lg:grid-cols-[230px_1fr]">
        <aside className="rounded-xl border border-border bg-card p-3">
          <p className="px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">BatchTube Station Admin</p>
          <nav className="mt-2 space-y-1">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="block rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
