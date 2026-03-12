import Link from 'next/link';
import { Command, MessageSquare, NotebookTabs, Radar, ShieldAlert, Sparkles } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/docs', label: 'Docs', icon: NotebookTabs },
  { href: '/feedback', label: 'Feedback', icon: Sparkles },
  { href: '/roadmap', label: 'Roadmap', icon: Radar },
  { href: '/status', label: 'Status', icon: ShieldAlert },
  { href: '/discussions', label: 'Discussions', icon: MessageSquare }
];

export async function TopNav() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-white">
          <Command className="h-4 w-4 text-primary" /> BatchTube Station
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/search" className="hidden rounded-md border border-border px-3 py-2 text-xs text-muted-foreground md:inline-flex">Search</Link>
          {profile ? (
            <>
              {(profile.role === 'admin' || profile.role === 'moderator') ? (
                <Button asChild variant="secondary" size="sm"><Link href="/admin">Admin</Link></Button>
              ) : null}
              <Button asChild size="sm"><Link href="/account">Account</Link></Button>
            </>
          ) : (
            <>
              <Button asChild variant="secondary" size="sm"><Link href="/login">Login</Link></Button>
              <Button asChild size="sm"><Link href="/signup">Sign up</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
