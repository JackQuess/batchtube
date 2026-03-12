import { notFound } from 'next/navigation';
import { AuthCTA } from '@/components/station/auth-cta';
import { DiscussionReplyForm } from '@/components/station/forms';
import { DiscussionReplyList } from '@/components/station/discussion-reply-list';
import { TagPill } from '@/components/station/tag-pill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/session';
import { getDiscussionBySlug, getDiscussionReplies } from '@/lib/data/queries';

export default async function DiscussionDetailPage({ params }: { params: { slug: string } }) {
  const item = await getDiscussionBySlug(params.slug);
  if (!item) notFound();
  const replies = await getDiscussionReplies(item.id);
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex gap-2">{item.pinned ? <TagPill tag="pinned" /> : null}{item.locked ? <TagPill tag="locked" /> : null}</div>
          <CardTitle>{item.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-200">{item.content}</CardContent>
      </Card>
      <DiscussionReplyList items={replies} />
      {item.locked ? <p className="text-sm text-muted-foreground">This discussion is locked.</p> : user ? <DiscussionReplyForm discussionId={item.id} /> : <AuthCTA title="Sign in to reply" />}
    </div>
  );
}
