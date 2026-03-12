import { notFound } from 'next/navigation';
import { FeedbackCommentList } from '@/components/station/feedback-comment-list';
import { FeedbackVoteButton } from '@/components/station/feedback-vote-button';
import { FeedbackCommentForm } from '@/components/station/forms';
import { AuthCTA } from '@/components/station/auth-cta';
import { StatusBadge } from '@/components/station/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/session';
import { getFeedbackBySlug, getFeedbackComments, getRoadmap } from '@/lib/data/queries';

export default async function FeedbackDetailPage({ params }: { params: { slug: string } }) {
  const post = await getFeedbackBySlug(params.slug);
  if (!post) notFound();
  const comments = await getFeedbackComments(post.id);
  const user = await getCurrentUser();
  const relatedRoadmap = (await getRoadmap()).slice(0, 3);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{post.title}</CardTitle>
            <StatusBadge value={post.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-200">{post.description}</p>
          <div className="flex items-center gap-2">
            {user ? <FeedbackVoteButton postId={post.id} /> : <AuthCTA title="Sign in to vote" />}
          </div>
        </CardContent>
      </Card>

      {user ? <FeedbackCommentForm postId={post.id} /> : <AuthCTA title="Sign in to comment" />}
      <FeedbackCommentList items={comments} />

      <Card>
        <CardHeader><CardTitle>Related roadmap items</CardTitle></CardHeader>
        <CardContent className="space-y-2">{relatedRoadmap.map((item) => <a className="block text-sm text-primary" key={item.id} href={`/roadmap/${item.slug}`}>{item.title}</a>)}</CardContent>
      </Card>
    </div>
  );
}
