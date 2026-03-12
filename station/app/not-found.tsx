import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold">Not Found</h1>
        <p className="text-sm text-muted-foreground">The requested Station page could not be found.</p>
        <Button asChild><Link href="/">Back to home</Link></Button>
      </div>
    </div>
  );
}
