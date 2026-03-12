import type { ReactNode } from 'react';
import { TopNav } from '@/components/station/top-nav';

export async function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="container py-8">{children}</main>
    </div>
  );
}
