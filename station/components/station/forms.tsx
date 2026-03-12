'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addDiscussionReply, addFeedbackComment, createDiscussion, updateProfile } from '@/lib/data/actions';

export function FeedbackCommentForm({ postId }: { postId: string }) {
  const [content, setContent] = useState('');
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await addFeedbackComment({ postId, content });
          setContent('');
        });
      }}
    >
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share context or use-case" />
      <Button disabled={pending || content.length < 3}>Post comment</Button>
    </form>
  );
}

export function DiscussionCreateForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('help');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const slug = await createDiscussion({ title, content, category });
          router.push(`/discussions/${slug}`);
        });
      }}
    >
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Discussion title" />
      <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What are you trying to solve?" />
      <Button disabled={pending}>Create discussion</Button>
    </form>
  );
}

export function DiscussionReplyForm({ discussionId }: { discussionId: string }) {
  const [content, setContent] = useState('');
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await addDiscussionReply({ discussionId, content });
          setContent('');
        });
      }}
    >
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Reply" />
      <Button disabled={pending || content.length < 3}>Reply</Button>
    </form>
  );
}

export function ProfileForm({ username, avatarUrl }: { username: string | null; avatarUrl: string | null }) {
  const [name, setName] = useState(username ?? '');
  const [avatar, setAvatar] = useState(avatarUrl ?? '');
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateProfile({ username: name, avatarUrl: avatar || undefined });
        });
      }}
    >
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Username" />
      <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="Avatar URL" />
      <Button disabled={pending}>Save profile</Button>
    </form>
  );
}
