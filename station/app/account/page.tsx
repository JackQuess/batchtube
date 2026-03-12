import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/components/station/forms';
import { PageHeader } from '@/components/station/page-header';
import { signOut } from '@/lib/auth/actions';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/session';
import { getDiscussions, getFeedback } from '@/lib/data/queries';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const profile = await getCurrentProfile();
  const [recentFeedback, recentDiscussions] = await Promise.all([
    getFeedback({ sort: 'latest' }),
    getDiscussions()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Account" description="Profile, role, and participation history." />
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
          <p className="text-sm">Role: <strong>{profile?.role ?? 'user'}</strong></p>
          <ProfileForm username={profile?.username ?? null} avatarUrl={profile?.avatar_url ?? null} />
          <form action={signOut}><Button variant="secondary">Sign out</Button></form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Recent feedback</CardTitle></CardHeader><CardContent>{recentFeedback.slice(0, 5).map((f) => <a key={f.id} className="block text-sm text-primary" href={`/feedback/${f.slug}`}>{f.title}</a>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Recent discussions</CardTitle></CardHeader><CardContent>{recentDiscussions.slice(0, 5).map((d) => <a key={d.id} className="block text-sm text-primary" href={`/discussions/${d.slug}`}>{d.title}</a>)}</CardContent></Card>
      </div>
    </div>
  );
}
