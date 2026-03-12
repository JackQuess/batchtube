import type { ReactNode } from 'react';
import { TopNav } from '@/components/station/top-nav';

export async function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-8%] top-[-10%] h-[40vh] w-[38vw] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-18%] right-[-10%] h-[40vh] w-[36vw] rounded-full bg-red-600/10 blur-[130px]" />
      </div>
      <TopNav />
      <main className="container relative z-10 py-8">{children}</main>
    </div>
  );
}
