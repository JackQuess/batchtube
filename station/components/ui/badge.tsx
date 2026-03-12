import { cn } from '@/lib/utils/cn';

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-0.5 text-xs font-medium text-muted-foreground', className)}>
      {children}
    </span>
  );
}
