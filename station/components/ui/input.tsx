import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-primary placeholder:text-muted-foreground focus:ring-2', className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';
