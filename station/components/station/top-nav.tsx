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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/65 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-white tracking-tight">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/35">
            <Command className="h-3.5 w-3.5 text-primary" />
          </span>
          BatchTube Station
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/search" className="hidden rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs text-muted-foreground md:inline-flex">Search</Link>
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
