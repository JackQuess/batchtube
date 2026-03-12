import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthCTA({ title = 'Sign in to participate' }: { title?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button asChild variant="secondary"><Link href="/login">Login</Link></Button>
        <Button asChild><Link href="/signup">Create account</Link></Button>
      </CardContent>
    </Card>
  );
}
