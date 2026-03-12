import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/station/page-header';
import { signInWithEmail } from '@/lib/auth/actions';

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageHeader title="Login" description="Sign in to vote, comment, and participate." />
      <Card>
        <CardHeader><CardTitle>Email login</CardTitle></CardHeader>
        <CardContent>
          <form action={signInWithEmail} className="space-y-3">
            <Input type="email" name="email" placeholder="you@company.com" required />
            <Input type="password" name="password" placeholder="••••••••" required />
            <Button className="w-full" type="submit">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
