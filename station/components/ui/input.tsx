import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('h-10 w-full rounded-md border border-white/15 bg-black/35 px-3 text-sm outline-none ring-primary placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2', className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';
