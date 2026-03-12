import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/station/page-header';
import { signUpWithEmail } from '@/lib/auth/actions';

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageHeader title="Create account" description="Join BatchTube Station to participate and track updates." />
      <Card>
        <CardHeader><CardTitle>Email sign up</CardTitle></CardHeader>
        <CardContent>
          <form action={signUpWithEmail} className="space-y-3">
            <Input type="email" name="email" placeholder="you@company.com" required />
            <Input type="password" name="password" placeholder="At least 8 characters" required />
            <Button className="w-full" type="submit">Create account</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
